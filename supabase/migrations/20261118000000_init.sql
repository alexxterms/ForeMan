-- ForeMan live database, version 1.
-- One login belongs to one company. Roles: owner, manager.
-- Every table carries company_id, and row-level security limits each user to their own company.

create extension if not exists pgcrypto;

-- ---------- Tables ----------

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 120),
  gst_registered boolean not null default false,
  gstin text check (gstin is null or length(gstin) = 15),
  proprietor text,
  upi_id text,
  created_at timestamptz not null default now()
);

create table public.members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  role text not null check (role in ('owner', 'manager')),
  name text not null default '',
  email text not null default '',
  created_at timestamptz not null default now()
);
create index on public.members (company_id);

-- Helpers used by the policies. security definer so they can read members without recursion.
create or replace function public.my_company() returns uuid
language sql stable security definer set search_path = public as $$
  select company_id from public.members where user_id = auth.uid()
$$;

create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.members where user_id = auth.uid() and role = 'owner')
$$;

create table public.invites (
  email text primary key check (email = lower(email)),
  company_id uuid not null default public.my_company() references public.companies (id) on delete cascade,
  role text not null default 'manager' check (role in ('manager')),
  name text not null default '',
  created_at timestamptz not null default now()
);

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default public.my_company() references public.companies (id) on delete cascade,
  name text not null check (length(name) between 1 and 80),
  client_name text not null default '',
  archived boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.sites (company_id);

create table public.workers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default public.my_company() references public.companies (id) on delete cascade,
  site_id uuid references public.sites (id) on delete set null,
  name text not null check (length(name) between 1 and 80),
  trade text not null default '',
  daily_rate numeric(10, 2) not null default 0 check (daily_rate >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index on public.workers (company_id, site_id);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default public.my_company() references public.companies (id) on delete cascade,
  site_id uuid not null references public.sites (id) on delete cascade,
  worker_id uuid not null references public.workers (id) on delete cascade,
  day date not null,
  status text not null check (status in ('p', 'h', 'a')),
  hours numeric(4, 1) check (hours is null or (hours > 0 and hours <= 24)),
  updated_by uuid default auth.uid(),
  updated_at timestamptz not null default now(),
  unique (worker_id, day)
);
create index on public.attendance (company_id, day);

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default public.my_company() references public.companies (id) on delete cascade,
  site_id uuid not null references public.sites (id) on delete cascade,
  name text not null check (length(name) between 1 and 80),
  unit text not null check (length(unit) between 1 and 12),
  min_qty numeric(12, 2) not null default 0 check (min_qty >= 0),
  supplier text not null default '',
  created_at timestamptz not null default now()
);
create index on public.materials (company_id, site_id);

-- Stock is never edited. Each delivery or use is a new row, so offline retries cannot double count.
create table public.stock_moves (
  id uuid primary key,
  company_id uuid not null default public.my_company() references public.companies (id) on delete cascade,
  site_id uuid not null references public.sites (id) on delete cascade,
  material_id uuid not null references public.materials (id) on delete cascade,
  mode text not null check (mode in ('in', 'out')),
  qty numeric(12, 2) not null check (qty > 0),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create index on public.stock_moves (material_id);

create table public.bills (
  id uuid primary key,
  company_id uuid not null default public.my_company() references public.companies (id) on delete cascade,
  site_id uuid references public.sites (id) on delete set null,
  no integer,
  kind text not null check (kind in ('tax', 'plain', 'ra')),
  client_name text not null default '',
  with_gst boolean not null default false,
  gst_rate numeric(5, 4) not null default 0,
  retention_rate numeric(5, 4) not null default 0,
  tds_rate numeric(5, 4) not null default 0,
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid')),
  issued_on date not null default (now() at time zone 'Asia/Kolkata')::date,
  due_on date,
  paid_on date,
  created_at timestamptz not null default now(),
  unique (company_id, no)
);

create table public.bill_lines (
  id uuid primary key,
  company_id uuid not null default public.my_company() references public.companies (id) on delete cascade,
  bill_id uuid not null references public.bills (id) on delete cascade,
  position integer not null default 0,
  name text not null check (length(name) between 1 and 120),
  qty numeric(12, 2) not null check (qty > 0),
  unit text not null default '',
  rate numeric(12, 2) not null check (rate >= 0)
);
create index on public.bill_lines (bill_id);

-- Bill numbers run 1, 2, 3 per company and are given by the server, so two phones never clash.
create or replace function public.assign_bill_no() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.no is null then
    perform pg_advisory_xact_lock(hashtext(new.company_id::text));
    select coalesce(max(no), 0) + 1 into new.no from public.bills where company_id = new.company_id;
  end if;
  return new;
end $$;

create trigger bills_assign_no before insert on public.bills
for each row execute function public.assign_bill_no();

-- Current stock per material, plus how much was used today (India time).
create view public.material_stock with (security_invoker = true) as
select
  m.id as material_id,
  coalesce(sum(case when s.mode = 'in' then s.qty else -s.qty end), 0) as qty,
  coalesce(sum(case when s.mode = 'out'
    and (s.created_at at time zone 'Asia/Kolkata')::date = (now() at time zone 'Asia/Kolkata')::date
    then s.qty else 0 end), 0) as used_today
from public.materials m
left join public.stock_moves s on s.material_id = m.id
group by m.id;

-- ---------- Row-level security ----------

alter table public.companies enable row level security;
alter table public.members enable row level security;
alter table public.invites enable row level security;
alter table public.sites enable row level security;
alter table public.workers enable row level security;
alter table public.attendance enable row level security;
alter table public.materials enable row level security;
alter table public.stock_moves enable row level security;
alter table public.bills enable row level security;
alter table public.bill_lines enable row level security;

create policy "read own company" on public.companies for select to authenticated using (id = public.my_company());
create policy "owner edits company" on public.companies for update to authenticated
  using (id = public.my_company() and public.is_owner()) with check (id = public.my_company());

create policy "read team" on public.members for select to authenticated using (company_id = public.my_company());
create policy "owner removes managers" on public.members for delete to authenticated
  using (company_id = public.my_company() and public.is_owner() and role = 'manager');

create policy "owner reads invites" on public.invites for select to authenticated using (company_id = public.my_company() and public.is_owner());
create policy "owner adds invites" on public.invites for insert to authenticated with check (company_id = public.my_company() and public.is_owner());
create policy "owner deletes invites" on public.invites for delete to authenticated using (company_id = public.my_company() and public.is_owner());

-- Company data: everyone in the company reads and writes. Deleting is left out on purpose for v1.
do $$
declare t text;
begin
  foreach t in array array['sites', 'workers', 'attendance', 'materials', 'bills', 'bill_lines'] loop
    execute format('create policy "company select" on public.%I for select to authenticated using (company_id = public.my_company())', t);
    execute format('create policy "company insert" on public.%I for insert to authenticated with check (company_id = public.my_company())', t);
    execute format('create policy "company update" on public.%I for update to authenticated using (company_id = public.my_company()) with check (company_id = public.my_company())', t);
  end loop;
end $$;

-- Stock moves are append-only.
create policy "company select" on public.stock_moves for select to authenticated using (company_id = public.my_company());
create policy "company insert" on public.stock_moves for insert to authenticated with check (company_id = public.my_company());

-- ---------- Sign-up and invites ----------

-- First login of an owner: creates the company, the owner membership and the first site in one step.
create or replace function public.create_company(
  p_company text, p_your_name text, p_gst boolean, p_gstin text, p_site text, p_client text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  if auth.uid() is null then raise exception 'Not logged in'; end if;
  if exists (select 1 from public.members where user_id = auth.uid()) then
    raise exception 'This login already belongs to a company';
  end if;
  insert into public.companies (name, gst_registered, gstin, proprietor)
  values (trim(p_company), coalesce(p_gst, false), nullif(upper(trim(coalesce(p_gstin, ''))), ''), trim(p_your_name))
  returning id into cid;
  insert into public.members (user_id, company_id, role, name, email)
  values (auth.uid(), cid, 'owner', trim(p_your_name), coalesce(auth.jwt() ->> 'email', ''));
  insert into public.sites (company_id, name, client_name) values (cid, trim(p_site), trim(coalesce(p_client, '')));
  return cid;
end $$;

-- First login of a project manager: joins the company that invited this email.
create or replace function public.accept_invite() returns boolean
language plpgsql security definer set search_path = public as $$
declare inv public.invites;
declare mail text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if auth.uid() is null or mail = '' then return false; end if;
  if exists (select 1 from public.members where user_id = auth.uid()) then return true; end if;
  select * into inv from public.invites where email = mail;
  if not found then return false; end if;
  insert into public.members (user_id, company_id, role, name, email) values (auth.uid(), inv.company_id, inv.role, inv.name, mail);
  delete from public.invites where email = mail;
  return true;
end $$;

-- ---------- Access for the app ----------

revoke all on all tables in schema public from anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on public.material_stock to authenticated;
revoke execute on all functions in schema public from public, anon;
grant execute on function public.my_company(), public.is_owner(), public.create_company(text, text, boolean, text, text, text), public.accept_invite() to authenticated;

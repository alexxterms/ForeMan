# ForeMan: v1 scope (proposal, needs your approval)

## What it is

A phone-first site ledger for Indian contractors and small builders. It covers labour attendance, wages, materials, site expenses, diary, and client bills. It works in Hindi and English, takes voice entries, and runs offline.

## Users and roles

| Role | Who | Sees | Does |
|---|---|---|---|
| Owner | Contractor / builder (one login = one company) | Everything, all sites, profit | Sets rates, approves wages, sends bills, adds and manages project managers |
| Project manager | Site manager or munshi, reports to the owner | Only assigned sites, no margins | Runs sites, attendance, material in/out, expenses, diary, photos. Manages the workers on their sites |
| Accountant | CA or munim (optional) | Read-only, all sites | Exports Excel / Tally file |
| Client | Property owner | Nothing in the app | Gets a WhatsApp link to a read-only bill page with a UPI QR |
| Worker | Labourer | Nothing | Never opens the app. Project manager marks attendance |

## Accounts

- **One login, one company.** Each login belongs to one company.
- **Owner** creates the company, adds project managers, and sees everything.
- **Project manager** is assigned one or more sites. Under them, the workers on those sites are records the project manager maintains. Workers never log in.
- **Accountant** and **client** access as listed in the roles table.

## v1 modules

1. **Sites and people**: sites, workers, trades, daily rates, piece rates, gangs (mukadam groups)
2. **Attendance**: P / A / HD in taps, "Sab hazir" bulk button, optional photo with GPS and time
3. **Wages and advances**: weekly or fortnightly sheet, advances (kharchi) auto-deducted, payment by UPI or cash with who-paid-what log
4. **Materials**: stock in and out per site, challan photo, low-stock alerts, supplier ledger (what is owed)
5. **Site expenses and diary**: quick petty-cash entry, daily note, progress photos
6. **Client billing**: GST tax invoice or plain bill (for businesses not GST-registered), RA bill by stage or measurement, retention and TDS lines, payment reminders, UPI QR, share PDF on WhatsApp
7. **Voice entry**: Hindi, Hinglish, English. Speak, see the parsed entry, confirm
8. **Owner dashboard**: today's labour cost, material used, money owed to you, money you owe, per site
9. **Export**: Excel for the accountant, CSV for Tally import
10. **Foundations**: offline-first sync, Hindi and English UI with string tables ready for more languages, ₹ lakh/crore format, DD/MM/YYYY dates

## Trade-offs I recommend (please confirm each)

1. **Voice needs a network connection in v1.** Offline voice on budget phones is not reliable enough. Offline, the app stores the audio clip and parses it when the phone reconnects. The user confirms before anything saves.
2. **UPI: show a payment request and QR, never hold money.** The app records the UTR number the payer gives back. No payment gateway, no wallet, no RBI payment-aggregator licence needed.
3. **WhatsApp: share sheet in v1, Business API later.** Sharing a PDF through Android's share sheet is free and needs no approval. The Business API needs Meta business verification and approved templates, which can take weeks. Inbound project manager voice notes (a "should have") wait for the API, in v1.1.
4. **Billing works with or without GST.** Set once at company setup. GST-registered companies get tax invoices with GSTIN, HSN/SAC, and CGST/SGST or IGST as configured. Companies not registered get a plain bill with no tax lines. The setting applies to new bills only. We generate invoices and do not file returns. Works-contract rates and e-invoicing (IRN) depend on turnover and contract type, so the CA confirms the tax setup before launch.
5. **Tally: Excel and CSV in v1.** Tally XML voucher import comes after a real Tally test with a CA.

## Things missing from your list that matter for Indian contractors

Add to v1:
1. **Gang / mukadam payments.** Many sites pay one leader for a group of 5 to 15 workers. Without this, the wage sheet is wrong for most sites.
2. **Piece-rate work.** Masons are often paid per sq ft of plaster or per brick course. Support a per-unit rate type next to daily rate.
3. **Retention and TDS on client bills.** Clients usually hold back 5 to 10 percent retention and deduct TDS. Model these as bill lines.
4. **Your own data export and backup.** You must be able to take your data out at any time.
5. **Accountant role.** Read-only access for the munim or CA.

Add in v1.1 (after launch, before scale):
- WhatsApp inbound voice notes from project managers (via Business API)
- BOCW (construction workers' cess and registration) and wage-register reports
- Equipment and machine hire log (mixer, JCB, scaffolding) with hours
- Receivables aging report

## Cut from v1

- Missed-call attendance. Dropped: the project manager is on site and knows who is present. The site photo with GPS and time covers proof when the owner is off site.
- Multi-company double-entry accounting. Export to the accountant instead.
- Client login or client app. Clients get a link.
- Live two-way Tally sync.
- Payroll with PF / ESI. Add only if a customer has more than 20 workers on payroll.
- AI photo analysis of progress.
- Project scheduling, Gantt, CRM pipelines, email workflows (as you said).
- Aadhaar collection. It is sensitive personal data and not needed for attendance or wages in v1.

## Done means (v1 acceptance)

- A project manager on a ₹8,000 phone on 2G can mark a 25-worker attendance in under 90 seconds, offline.
- Entries made offline appear once on the server after sync, with no duplicates, after airplane-mode toggles mid-sync.
- Every wage line and bill can be traced to the entries behind it.
- A contractor with 10 sites sees today's cost and money owed on one screen.
- Every screen works in Hindi and English with no English-only text.

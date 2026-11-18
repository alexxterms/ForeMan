import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { randomUUID } from 'expo-crypto';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { todayDDMMYYYY, todayISO } from '@/lib/format';
import { supabase, supabaseConfigured } from '@/lib/supabase';
import type { VoiceDraft } from '@/lib/voice';
import { Cache, CompanyPatch, emptyCache, Op, OpBody, pull, PullError, reduce, send } from './sync';
import type { AttendanceMark, Bill, BillStatus, Company, Invite, Material, Member, Site, Worker } from './types';

export type Phase = 'loading' | 'unconfigured' | 'signedOut' | 'noCompany' | 'needsNetwork' | 'ready';
export type SyncState = 'saved' | 'offline' | 'sending';

type Saved = { server: Cache; outbox: Op[]; siteId: string | null };

const keyFor = (userId: string) => `foreman-live-v1:${userId}`;

type Store = {
  phase: Phase;
  email: string | null;
  reload: () => Promise<void>;
  signOut: () => Promise<void>;

  date: string; // DD/MM/YYYY for display
  company: Company | null;
  me: Member | null;
  isOwner: boolean;
  team: Member[];
  invites: Invite[];

  sites: Site[];
  site: Site | null;
  setSite: (id: string) => void;
  addSite: (name: string, clientName: string) => string;

  workers: Worker[]; // current site
  addWorker: (w: Omit<Worker, 'id' | 'siteId'>) => void;
  attendance: Record<string, AttendanceMark>; // today, by worker id
  saveAttendance: (marks: Record<string, AttendanceMark>) => void;

  materials: Material[]; // current site
  addMaterial: (m: Omit<Material, 'id' | 'siteId' | 'qty' | 'usedToday'>, opening?: number) => string;
  applyStock: (materialId: string, qty: number, mode: 'in' | 'out') => void;

  bills: Bill[];
  addBill: (b: Omit<Bill, 'id' | 'no' | 'status' | 'paidOn'>) => string;
  setBillStatus: (id: string, status: BillStatus) => void;

  updateCompany: (patch: CompanyPatch) => void;

  voiceDraft: VoiceDraft | null;
  setVoiceDraft: (draft: VoiceDraft | null) => void;
  applyVoiceDraft: () => void;

  pending: number;
  syncState: SyncState;
  syncNow: () => void;
  problems: string[];
  clearProblems: () => void;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>(supabaseConfigured ? 'loading' : 'unconfigured');
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [server, setServer] = useState<Cache>(emptyCache);
  const [outbox, setOutbox] = useState<Op[]>([]);
  const [siteId, setSiteId] = useState<string | null>(null);
  const [netOffline, setNetOffline] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);
  const [problems, setProblems] = useState<string[]>([]);
  const [voiceDraft, setVoiceDraft] = useState<VoiceDraft | null>(null);

  const loadedFor = useRef<string | null>(null);
  const outboxRef = useRef<Op[]>([]);
  const flushing = useRef(false);
  const userRef = useRef<string | null>(null);

  useEffect(() => {
    outboxRef.current = outbox;
  }, [outbox]);
  useEffect(() => {
    userRef.current = userId;
  }, [userId]);

  /* ----- Pull from the server ----- */

  const refresh = useCallback(async (uid: string): Promise<'ok' | 'none' | 'network' | 'error'> => {
    try {
      let fresh = await pull(uid);
      if (!fresh) {
        // Not in a company yet. If the owner invited this email, join now.
        const { data } = await supabase.rpc('accept_invite');
        if (data === true) fresh = await pull(uid);
      }
      if (userRef.current !== uid) return 'error';
      if (!fresh) return 'none';
      setServer(fresh);
      return 'ok';
    } catch (e) {
      return e instanceof PullError && e.network ? 'network' : 'error';
    }
  }, []);

  /* ----- Start up for a login ----- */

  const startFor = useCallback(
    async (uid: string, mail: string | null) => {
      setUserId(uid);
      userRef.current = uid;
      setEmail(mail);
      let hasCache = false;
      try {
        const raw = await AsyncStorage.getItem(keyFor(uid));
        if (raw) {
          const saved = JSON.parse(raw) as Saved;
          setServer(saved.server);
          setOutbox(saved.outbox ?? []);
          outboxRef.current = saved.outbox ?? [];
          setSiteId(saved.siteId ?? null);
          hasCache = !!saved.server?.company;
        }
      } catch {
        // A broken cache is ignored; the server copy replaces it.
      }
      loadedFor.current = uid;
      if (hasCache) setPhase('ready');

      const res = await refresh(uid);
      if (res === 'ok') setPhase('ready');
      else if (res === 'none') setPhase('noCompany');
      else if (!hasCache) setPhase('needsNetwork');
    },
    [refresh],
  );

  const resetLocal = useCallback(() => {
    loadedFor.current = null;
    userRef.current = null;
    setUserId(null);
    setEmail(null);
    setServer(emptyCache());
    setOutbox([]);
    outboxRef.current = [];
    setSiteId(null);
    setProblems([]);
    setVoiceDraft(null);
  }, []);

  useEffect(() => {
    if (!supabaseConfigured) return;
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      const s = data.session;
      if (s) void startFor(s.user.id, s.user.email ?? null);
      else setPhase('signedOut');
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session && loadedFor.current !== session.user.id) {
        setPhase('loading');
        void startFor(session.user.id, session.user.email ?? null);
      }
      if (event === 'SIGNED_OUT') {
        resetLocal();
        setPhase('signedOut');
      }
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [startFor, resetLocal]);

  /* ----- Save the phone copy ----- */

  useEffect(() => {
    if (!userId || loadedFor.current !== userId) return;
    const saved: Saved = { server, outbox, siteId };
    AsyncStorage.setItem(keyFor(userId), JSON.stringify(saved)).catch(() => {});
  }, [userId, server, outbox, siteId]);

  /* ----- Send waiting entries ----- */

  const flush = useCallback(async () => {
    const uid = userRef.current;
    if (!uid || flushing.current) return;
    flushing.current = true;
    let blocked = false;
    try {
      while (outboxRef.current.length > 0) {
        const op = outboxRef.current[0];
        const res = await send(op);
        if (!res.ok && res.network) {
          blocked = true;
          break;
        }
        outboxRef.current = outboxRef.current.filter((o) => o.opId !== op.opId);
        setOutbox((o) => o.filter((x) => x.opId !== op.opId));
        if (res.ok) setServer((s) => reduce(s, op));
        else setProblems((p) => [...p, res.message]);
      }
      setSendFailed(blocked);
      if (!blocked) await refresh(uid);
    } finally {
      flushing.current = false;
    }
  }, [refresh]);

  // Send soon after anything new is waiting.
  useEffect(() => {
    if (phase !== 'ready' || outbox.length === 0) return;
    const t = setTimeout(() => void flush(), 400);
    return () => clearTimeout(t);
  }, [phase, outbox.length, flush]);

  // Retry every 30 seconds while entries are waiting.
  useEffect(() => {
    if (phase !== 'ready' || outbox.length === 0) return;
    const t = setInterval(() => void flush(), 30_000);
    return () => clearInterval(t);
  }, [phase, outbox.length, flush]);

  // Network back, or app opened again: send and refresh.
  useEffect(() => {
    if (phase !== 'ready') return;
    const unsubNet = NetInfo.addEventListener((s) => {
      const off = s.isConnected === false;
      setNetOffline(off);
      if (!off) void flush();
    });
    const subApp = AppState.addEventListener('change', (s) => {
      if (s === 'active') void flush();
    });
    return () => {
      unsubNet();
      subApp.remove();
    };
  }, [phase, flush]);

  /* ----- What the screens see: server copy plus waiting entries ----- */

  const view = useMemo(() => outbox.reduce(reduce, server), [server, outbox]);
  const site = view.sites.find((s) => s.id === siteId) ?? view.sites[0] ?? null;
  const currentSiteId = site?.id ?? null;
  const today = todayISO();

  const enqueue = useCallback((body: OpBody) => {
    const op = { ...body, opId: randomUUID(), at: new Date().toISOString() } as Op;
    outboxRef.current = [...outboxRef.current, op];
    setOutbox((o) => [...o, op]);
  }, []);

  const addSite = useCallback(
    (name: string, clientName: string) => {
      const id = randomUUID();
      enqueue({ type: 'site.add', site: { id, name: name.trim(), clientName: clientName.trim() } });
      setSiteId(id);
      return id;
    },
    [enqueue],
  );

  const addWorker = useCallback(
    (w: Omit<Worker, 'id' | 'siteId'>) => enqueue({ type: 'worker.add', worker: { ...w, id: randomUUID(), siteId: currentSiteId } }),
    [enqueue, currentSiteId],
  );

  const saveAttendance = useCallback(
    (marks: Record<string, AttendanceMark>) => {
      if (!currentSiteId || Object.keys(marks).length === 0) return;
      enqueue({ type: 'attendance.set', day: todayISO(), siteId: currentSiteId, marks });
    },
    [enqueue, currentSiteId],
  );

  const addMaterial = useCallback(
    (m: Omit<Material, 'id' | 'siteId' | 'qty' | 'usedToday'>, opening = 0) => {
      const id = randomUUID();
      if (!currentSiteId) return id;
      enqueue({ type: 'material.add', material: { ...m, id, siteId: currentSiteId } });
      if (opening > 0) enqueue({ type: 'stock.move', id: randomUUID(), siteId: currentSiteId, materialId: id, mode: 'in', qty: opening });
      return id;
    },
    [enqueue, currentSiteId],
  );

  const applyStock = useCallback(
    (materialId: string, qty: number, mode: 'in' | 'out') => {
      const m = view.materials.find((x) => x.id === materialId);
      if (!m) return;
      enqueue({ type: 'stock.move', id: randomUUID(), siteId: m.siteId, materialId, mode, qty });
    },
    [enqueue, view.materials],
  );

  const addBill = useCallback(
    (b: Omit<Bill, 'id' | 'no' | 'status' | 'paidOn'>) => {
      const id = randomUUID();
      enqueue({ type: 'bill.add', bill: { ...b, id, no: null, status: 'draft', paidOn: null } });
      return id;
    },
    [enqueue],
  );

  const setBillStatus = useCallback(
    (id: string, status: BillStatus) => enqueue({ type: 'bill.status', id, status, paidOn: status === 'paid' ? todayISO() : null }),
    [enqueue],
  );

  const updateCompany = useCallback(
    (patch: CompanyPatch) => {
      if (view.company) enqueue({ type: 'company.update', companyId: view.company.id, patch });
    },
    [enqueue, view.company],
  );

  const applyVoiceDraft = useCallback(() => {
    if (!voiceDraft) return;
    if (voiceDraft.kind === 'attendance') {
      if (voiceDraft.status !== 'n') saveAttendance({ [voiceDraft.workerId]: { status: voiceDraft.status, hours: voiceDraft.hours } });
    } else {
      applyStock(voiceDraft.materialId, voiceDraft.qty, voiceDraft.mode);
    }
    setVoiceDraft(null);
  }, [voiceDraft, saveAttendance, applyStock]);

  const reload = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setPhase('signedOut');
      return;
    }
    setPhase('loading');
    await startFor(data.session.user.id, data.session.user.email ?? null);
  }, [startFor]);

  const signOut = useCallback(async () => {
    const uid = userRef.current;
    if (uid) await AsyncStorage.removeItem(keyFor(uid)).catch(() => {});
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    resetLocal();
    setPhase('signedOut');
  }, [resetLocal]);

  const offline = netOffline || sendFailed;
  const syncState: SyncState = outbox.length === 0 ? 'saved' : offline ? 'offline' : 'sending';

  const value = useMemo<Store>(
    () => ({
      phase,
      email,
      reload,
      signOut,
      date: todayDDMMYYYY(),
      company: view.company,
      me: view.me,
      isOwner: view.me?.role === 'owner',
      team: view.team,
      invites: view.invites,
      sites: view.sites,
      site,
      setSite: setSiteId,
      addSite,
      workers: view.workers.filter((w) => w.siteId === currentSiteId),
      addWorker,
      attendance: view.attendance.day === today ? view.attendance.marks : {},
      saveAttendance,
      materials: view.materials.filter((m) => m.siteId === currentSiteId),
      addMaterial,
      applyStock,
      bills: view.bills,
      addBill,
      setBillStatus,
      updateCompany,
      voiceDraft,
      setVoiceDraft,
      applyVoiceDraft,
      pending: outbox.length,
      syncState,
      syncNow: () => {
        setSendFailed(false);
        void flush();
      },
      problems,
      clearProblems: () => setProblems([]),
    }),
    [
      phase, email, reload, signOut, view, site, currentSiteId, today, addSite, addWorker, saveAttendance, addMaterial,
      applyStock, addBill, setBillStatus, updateCompany, voiceDraft, applyVoiceDraft, outbox.length, syncState, flush, problems,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore must be used inside StoreProvider');
  return v;
}

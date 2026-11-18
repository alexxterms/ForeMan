import React, { useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { AppText, Button, Card, ErrorStrip, Field, LangSwitch, Screen, ScreenHeader, Section, useToast } from '@/components/ui';
import { useStore } from '@/data/store';
import { initialOf } from '@/data/types';
import { useT } from '@/i18n';
import { isNetworkError, supabase } from '@/lib/supabase';
import { colors } from '@/theme/tokens';

const GSTIN = /^[0-9]{2}[A-Z0-9]{13}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UPI = /^[\w.\-]{2,}@[a-zA-Z]{2,}$/;

function CompanyForm({ onSaved }: { onSaved: (m: string) => void }) {
  const { t } = useT();
  const S = t.settings;
  const { company, updateCompany } = useStore();
  const [name, setName] = useState(company?.name ?? '');
  const [proprietor, setProprietor] = useState(company?.proprietor ?? '');
  const [gst, setGst] = useState(!!company?.gstRegistered);
  const [gstin, setGstin] = useState(company?.gstin ?? '');
  const [upi, setUpi] = useState(company?.upiId ?? '');

  const gstinClean = gstin.trim().toUpperCase();
  const gstinBad = gst && !GSTIN.test(gstinClean);
  const upiBad = upi.trim().length > 0 && !UPI.test(upi.trim());
  const ok = name.trim().length > 0 && !gstinBad && !upiBad;

  return (
    <>
      <Section>{S.company}</Section>
      <Card>
        <Field label={S.companyName} value={name} onChangeText={setName} autoCapitalize="words" />
        <Field label={S.proprietor} value={proprietor} onChangeText={setProprietor} autoCapitalize="words" hint={S.proprietorHint} />
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <AppText size={18} weight="semibold">{S.gst}</AppText>
            <AppText size={14} color={colors.muted}>{S.gstSub}</AppText>
          </View>
          <Switch accessibilityLabel={S.gst} value={gst} onValueChange={setGst} trackColor={{ false: colors.line, true: colors.primary }} />
        </View>
        {gst ? (
          <Field
            label="GSTIN"
            value={gstin}
            onChangeText={setGstin}
            autoCapitalize="characters"
            maxLength={15}
            error={gstin.length > 0 && gstinBad ? S.gstinBad : null}
          />
        ) : null}
        <Field
          label={S.upi}
          value={upi}
          onChangeText={setUpi}
          placeholder="ali@okhdfcbank"
          autoCapitalize="none"
          error={upiBad ? S.upiBad : null}
          hint={S.upiHint}
        />
        <Button
          label={S.saveCompany}
          variant="secondary"
          icon="check"
          disabled={!ok}
          onPress={() => {
            updateCompany({
              name: name.trim(),
              proprietor: proprietor.trim() || null,
              gstRegistered: gst,
              gstin: gst ? gstinClean : null,
              upiId: upi.trim() || null,
            });
            onSaved(S.saved);
          }}
        />
      </Card>
    </>
  );
}

function Person({ title, sub, onRemove, removeLabel, busy, pending }: { title: string; sub: string; onRemove?: () => void; removeLabel: string; busy: boolean; pending?: boolean }) {
  return (
    <View style={styles.person}>
      <View style={[styles.avatar, pending && { backgroundColor: colors.tNeutral }]}>
        <AppText size={17} weight="bold" color={pending ? colors.muted : colors.primary}>{initialOf(title)}</AppText>
      </View>
      <View style={{ flex: 1 }}>
        <AppText size={17} weight="semibold" numberOfLines={1}>{title}</AppText>
        <AppText size={14} color={colors.muted}>{sub}</AppText>
      </View>
      {onRemove ? (
        <Pressable accessibilityRole="button" accessibilityLabel={removeLabel} disabled={busy} onPress={onRemove} style={styles.remove} hitSlop={4}>
          <Icon name="x" size={20} color={colors.danger} />
        </Pressable>
      ) : null}
    </View>
  );
}

function Team() {
  const { t } = useT();
  const S = t.settings;
  const { team, invites, me, reload } = useStore();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mail = email.trim().toLowerCase();

  async function run(task: PromiseLike<{ error: { message: string } | null }>) {
    setBusy(true);
    setError(null);
    const { error: e } = await task;
    setBusy(false);
    if (e) {
      setError(isNetworkError(e) ? S.teamOffline : /duplicate|23505/.test(e.message) ? S.alreadyInvited : e.message);
      return false;
    }
    await reload();
    return true;
  }

  async function invite() {
    if (team.some((m) => m.email === mail)) {
      setError(S.alreadyTeam);
      return;
    }
    const done = await run(supabase.from('invites').insert({ email: mail, name: name.trim() }));
    if (done) {
      setEmail('');
      setName('');
    }
  }

  const rows = [
    ...team.map((m) => (
      <Person
        key={m.userId}
        title={`${m.name || m.email}${m.userId === me?.userId ? S.you : ''}`}
        sub={`${m.role === 'owner' ? t.common.owner : t.common.manager} · ${m.email}`}
        removeLabel={t.common.remove(m.name || m.email)}
        busy={busy}
        onRemove={m.role === 'manager' ? () => void run(supabase.from('members').delete().eq('user_id', m.userId)) : undefined}
      />
    )),
    ...invites.map((i) => (
      <Person
        key={i.email}
        pending
        title={i.name || i.email}
        sub={S.invited(i.email)}
        removeLabel={S.cancelInvite(i.email)}
        busy={busy}
        onRemove={() => void run(supabase.from('invites').delete().eq('email', i.email))}
      />
    )),
  ];

  return (
    <>
      <Section>{S.team}</Section>
      <Card style={{ paddingVertical: 4 }}>
        {rows.map((r, i) => (
          <View key={i} style={i < rows.length - 1 ? styles.divider : undefined}>{r}</View>
        ))}
      </Card>

      <Card style={{ marginTop: 12 }}>
        <AppText size={17} weight="semibold" style={{ marginBottom: 10 }}>{S.addManager}</AppText>
        <Field label={S.theirName} value={name} onChangeText={setName} placeholder="Suresh" autoCapitalize="words" />
        <Field
          label={S.theirEmail}
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            setError(null);
          }}
          placeholder="suresh@gmail.com"
          keyboardType="email-address"
          autoCapitalize="none"
          hint={S.inviteHint}
          error={error}
        />
        <Button label={busy ? t.common.saving : S.addToTeam} variant="secondary" icon="plus" disabled={busy || !EMAIL.test(mail)} onPress={invite} />
      </Card>
    </>
  );
}

export default function Settings() {
  const { t } = useT();
  const S = t.settings;
  const { isOwner, email, pending, signOut } = useStore();
  const { toast, showToast } = useToast();
  const [confirm, setConfirm] = useState(false);

  return (
    <Screen toast={toast}>
      <ScreenHeader title={isOwner ? S.ownerTitle : S.managerTitle} subtitle={email ?? undefined} />

      <Section style={{ marginTop: 0 }}>{S.language}</Section>
      <Card style={styles.langRow}>
        <Icon name="globe" size={22} color={colors.secondary} />
        <View style={{ flex: 1 }}>
          <AppText size={17} weight="semibold">{t.langName}</AppText>
        </View>
        <LangSwitch />
      </Card>

      {isOwner ? (
        <>
          <CompanyForm onSaved={showToast} />
          <Team />
        </>
      ) : null}

      <Section>{S.account}</Section>
      {confirm && pending > 0 ? (
        <>
          <ErrorStrip>
            <AppText size={15} weight="semibold" color={colors.danger}>{S.pendingWarn(pending)}</AppText>
          </ErrorStrip>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button label={t.common.stay} variant="secondary" flex onPress={() => setConfirm(false)} />
            <Button label={t.common.logOut} variant="danger" flex onPress={() => void signOut()} />
          </View>
        </>
      ) : (
        <Button label={t.common.logOut} variant="secondary" onPress={() => (pending > 0 ? setConfirm(true) : void signOut())} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  langRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4, marginBottom: 12 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.line },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.tPrimary, alignItems: 'center', justifyContent: 'center' },
  remove: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.tDanger, alignItems: 'center', justifyContent: 'center' },
});

import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Platform, StyleSheet, TextInput, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { AppText, Button, Card, ErrorStrip, Pill, Screen, ScreenHeader } from '@/components/ui';
import { useStore } from '@/data/store';
import { useT } from '@/i18n';
import { parseVoice, samplePhrases } from '@/lib/voice';
import {
  checkVoiceServer,
  parseOnServer,
  readAudio,
  VoiceApiError,
  VoiceHealth,
  VoiceReply,
} from '@/lib/voiceApi';
import { colors, fonts, shadow } from '@/theme/tokens';

type Phase = 'idle' | 'recording' | 'working';

const MAX_SECONDS = 30;

function Pulse({ delay }: { delay: number }) {
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(v, { toValue: 1, duration: 1600, easing: Easing.out(Easing.quad), useNativeDriver: Platform.OS !== 'web' }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [delay, v]);
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.15] });
  const opacity = v.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0] });
  return <Animated.View style={[styles.ring, { transform: [{ scale }], opacity }]} />;
}

function Bars() {
  const [values] = useState(() => [0, 1, 2, 3, 4].map(() => new Animated.Value(0)));
  useEffect(() => {
    const loops = values.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 120),
          Animated.timing(v, { toValue: 1, duration: 450, useNativeDriver: false }),
          Animated.timing(v, { toValue: 0, duration: 450, useNativeDriver: false }),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [values]);
  return (
    <View style={styles.bars}>
      {values.map((v, i) => (
        <Animated.View key={i} style={[styles.bar, { height: v.interpolate({ inputRange: [0, 1], outputRange: [12, 44] }) }]} />
      ))}
    </View>
  );
}

export default function Voice() {
  const router = useRouter();
  const { t } = useT();
  const V = t.voice;
  const { materials, workers, setVoiceDraft, date, site } = useStore();
  const phrases = samplePhrases(workers, materials);
  const ctx = { date, site: site?.name ?? '', workers, materials };
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [heard, setHeard] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [health, setHealth] = useState<VoiceHealth | null>(null);
  const limit = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;
    checkVoiceServer().then((h) => {
      if (alive) setHealth(h);
    });
    return () => {
      alive = false;
      if (limit.current) clearTimeout(limit.current);
    };
  }, []);

  function handleReply(reply: VoiceReply) {
    setPhase('idle');
    if (reply.draft) {
      setHeard(null);
      setVoiceDraft(reply.draft);
      router.push('/voice-confirm');
      return;
    }
    setHeard(reply.transcript || null);
    setError(reply.message ?? V.notUnderstood);
  }

  function handleError(e: unknown) {
    setPhase('idle');
    if (e instanceof VoiceApiError) {
      if (e.kind === 'offline') setError(V.offline);
      else setError(e.message);
      return;
    }
    setError(V.recordFail);
  }

  async function start() {
    setError(null);
    setHeard(null);
    try {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) {
        setError(V.micOff);
        return;
      }
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setPhase('recording');
      limit.current = setTimeout(() => {
        void stop();
      }, MAX_SECONDS * 1000);
    } catch {
      setPhase('idle');
      setError(V.micFail);
    }
  }

  async function stop() {
    if (limit.current) clearTimeout(limit.current);
    setPhase('working');
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) throw new Error('No audio was recorded');
      const audio = await readAudio(uri);
      if (audio.data.length < 400) {
        setPhase('idle');
        setError(V.nothingHeard);
        return;
      }
      handleReply(await parseOnServer({ audio }, ctx));
    } catch (e) {
      handleError(e);
    }
  }

  async function checkTyped() {
    setError(null);
    setHeard(null);
    setPhase('working');
    try {
      handleReply(await parseOnServer({ text }, ctx));
    } catch (e) {
      // Server not reachable or not set up: fall back to the small built-in parser so typing still works offline.
      if (e instanceof VoiceApiError && (e.kind === 'offline' || e.status === 503 || e.status === 404)) {
        const draft = parseVoice(text, workers, materials);
        if (draft) {
          setPhase('idle');
          setVoiceDraft(draft);
          router.push('/voice-confirm');
          return;
        }
      }
      handleError(e);
    }
  }

  const footer =
    phase === 'idle' ? (
      <Button label={V.tapToSpeak} icon="mic" onPress={start} />
    ) : phase === 'recording' ? (
      <Button label={V.done} variant="success" icon="stop" onPress={stop} />
    ) : (
      <Button label={V.working} disabled />
    );

  return (
    <Screen footer={footer}>
      <ScreenHeader title={V.title} subtitle={V.sub} />

      <View style={styles.center}>
        <View style={styles.micWrap}>
          {phase === 'recording' ? (
            <>
              <Pulse delay={0} />
              <Pulse delay={800} />
            </>
          ) : null}
          <View style={[styles.micBig, { backgroundColor: phase === 'recording' ? colors.danger : colors.secondary }]}>
            {phase === 'working' ? <ActivityIndicator size="large" color={colors.white} /> : <Icon name="mic" size={56} color={colors.white} />}
          </View>
        </View>
        {phase === 'recording' ? <Bars /> : <View style={{ height: 44 }} />}
        <AppText size={22} weight="bold" style={{ textAlign: 'center' }}>
          {phase === 'recording' ? V.listening : phase === 'working' ? V.working : V.ready}
        </AppText>
        {health ? (
          <View>
            {health === 'ready' ? <Pill tone="ok" icon="check" label={V.voiceReady} /> : null}
            {health === 'not_configured' ? <Pill tone="due" icon="alert" label={V.notSetUp} /> : null}
            {health === 'unreachable' ? <Pill tone="off" icon="cloudoff" label={V.needsNet} /> : null}
          </View>
        ) : null}
      </View>

      {heard ? (
        <Card style={{ padding: 14, marginBottom: 12 }}>
          <AppText size={14} color={colors.muted} style={{ marginBottom: 4 }}>{V.heard}</AppText>
          <AppText size={22} style={{ lineHeight: 32 }}>{heard}</AppText>
        </Card>
      ) : null}
      {error ? (
        <ErrorStrip>
          <AppText size={15} weight="semibold" color={colors.danger}>{error}</AppText>
        </ErrorStrip>
      ) : null}

      <Card style={{ gap: 8 }}>
        <AppText size={14} weight="semibold" color={colors.muted}>{V.orType}</AppText>
        <TextInput
          value={text}
          onChangeText={(t) => {
            setText(t);
            setError(null);
          }}
          placeholder={phrases[0]}
          placeholderTextColor="#94A3B8"
          style={styles.input}
          accessibilityLabel={V.typeA11y}
        />
        <Button label={V.check} variant="secondary" icon="check" disabled={phase !== 'idle' || text.trim().length === 0} onPress={checkTyped} />
        <AppText size={14} weight="semibold" color={colors.muted} style={{ marginTop: 4 }}>{V.tryLabel}</AppText>
        <View style={styles.chips}>
          {phrases.map((p) => (
            <View key={p} style={styles.chip}>
              <AppText size={14} weight="medium" color={colors.secondary}>“{p}”</AppText>
            </View>
          ))}
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', gap: 12, paddingVertical: 10 },
  micWrap: { width: 170, height: 170, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 170, height: 170, borderRadius: 85, borderWidth: 5, borderColor: colors.danger },
  micBig: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', borderWidth: 5, borderColor: colors.white, ...shadow.button(colors.secondary) },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: colors.tTeal, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 7, height: 44 },
  bar: { width: 10, borderRadius: 5, backgroundColor: colors.secondary },
  input: {
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.line,
    paddingHorizontal: 14,
    fontSize: 18,
    fontFamily: fonts.medium,
    color: colors.text,
    backgroundColor: colors.white,
  },
});

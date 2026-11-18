import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconName } from '@/components/Icon';
import { useStore } from '@/data/store';
import { Lang, useT } from '@/i18n';
import { colors, fonts, gutter, radius, shadow, Weight } from '@/theme/tokens';

/* ---------- Text ---------- */

type AppTextProps = TextProps & {
  size?: number;
  weight?: Weight;
  color?: string;
  tabular?: boolean;
};

// Devanagari needs more room above and below than Latin, so line height follows the language.
export function AppText({ size = 16, weight = 'regular', color = colors.text, tabular, style, ...rest }: AppTextProps) {
  const { lang } = useT();
  const base: TextStyle = {
    fontSize: size,
    lineHeight: Math.round(size * (lang === 'hi' ? 1.5 : 1.3)),
    fontFamily: fonts[weight],
    color,
    ...(tabular ? { fontVariant: ['tabular-nums'] as TextStyle['fontVariant'] } : null),
  };
  return <Text style={[base, style]} {...rest} />;
}

/* ---------- Buttons ---------- */

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger';

function tick() {
  if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  style,
  flex,
}: {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  flex?: boolean;
}) {
  const fill =
    variant === 'primary' ? colors.primary : variant === 'success' ? colors.success : variant === 'danger' ? colors.danger : colors.white;
  const fg = disabled ? colors.muted : variant === 'secondary' ? colors.primary : colors.white;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={() => {
        tick();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: fill },
        variant === 'secondary' && { borderWidth: 2, borderColor: colors.primary },
        variant !== 'secondary' && !disabled && shadow.button(fill),
        flex && { flex: 1 },
        pressed && { transform: [{ scale: 0.97 }], opacity: 0.92 },
        disabled && styles.buttonOff,
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={22} color={fg} strokeWidth={2.2} /> : null}
      <AppText size={19} weight="semibold" color={fg} numberOfLines={1} style={{ flexShrink: 1 }}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function IconButton({ icon, onPress, label }: { icon: IconName; onPress: () => void; label: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [styles.iconButton, pressed && { backgroundColor: colors.tPrimary }]}
    >
      <Icon name={icon} size={26} color={colors.text} />
    </Pressable>
  );
}

/* ---------- Badge (round icon with tinted ring) ---------- */

export function Badge({ icon, color, tint, size = 56 }: { icon: IconName; color: string; tint: string; size?: number }) {
  const ring = Math.round(size / 11);
  const outer = size + ring * 2;
  return (
    <View style={{ width: outer, height: outer, borderRadius: outer / 2, backgroundColor: tint, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={Math.round(size * 0.52)} color={colors.white} />
      </View>
    </View>
  );
}

/* ---------- Pills and chips ---------- */

export type PillTone = 'draft' | 'sent' | 'due' | 'over' | 'paid' | 'low' | 'out' | 'ok' | 'off' | 'busy';

const TONES: Record<PillTone, { bg: string; fg: string }> = {
  draft: { bg: colors.tNeutral, fg: colors.muted },
  sent: { bg: colors.tPrimary, fg: colors.primary },
  due: { bg: colors.tWarning, fg: colors.warning },
  over: { bg: colors.tDanger, fg: colors.danger },
  paid: { bg: colors.tSuccess, fg: colors.success },
  low: { bg: colors.tWarning, fg: colors.warning },
  out: { bg: colors.tDanger, fg: colors.danger },
  ok: { bg: colors.tSuccess, fg: colors.success },
  off: { bg: colors.tNeutral, fg: colors.muted },
  busy: { bg: colors.tPrimary, fg: colors.primary },
};

export function Pill({ tone, icon, label, spin }: { tone: PillTone; icon?: IconName; label: string; spin?: boolean }) {
  const t = TONES[tone];
  return (
    <View style={[styles.pill, { backgroundColor: t.bg }]}>
      {icon ? <Spin on={!!spin}><Icon name={icon} size={15} color={t.fg} strokeWidth={2.4} /></Spin> : null}
      <AppText size={14} weight="bold" color={t.fg}>
        {label}
      </AppText>
    </View>
  );
}

function Spin({ on, children }: { on: boolean; children: React.ReactNode }) {
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!on) {
      v.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(v, { toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: Platform.OS !== 'web' }),
    );
    loop.start();
    return () => loop.stop();
  }, [on, v]);
  const rotate = v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return <Animated.View style={{ transform: [{ rotate }] }}>{children}</Animated.View>;
}

// Sync chip: three states. Tap it to send waiting entries now.
export function SyncChip() {
  const { syncState, pending, syncNow } = useStore();
  const { t } = useT();
  let pill: React.ReactNode;
  if (syncState === 'saved') pill = <Pill tone="ok" icon="check" label={t.sync.saved} />;
  else if (syncState === 'offline') pill = <Pill tone="off" icon="cloudoff" label={t.sync.offline(pending)} />;
  else pill = <Pill tone="busy" icon="sync" spin label={t.sync.sending(pending)} />;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={t.sync.a11y} onPress={syncNow} hitSlop={6}>
      {pill}
    </Pressable>
  );
}

// Current site. Tap to switch or add a site.
export function SiteChip({ label }: { label?: string }) {
  const router = useRouter();
  const { site } = useStore();
  const { t } = useT();
  const text = label ?? site?.name ?? t.siteChip.pick;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t.siteChip.a11y(text)}
      onPress={() => router.push('/sites')}
      style={({ pressed }) => [styles.siteChip, pressed && { backgroundColor: colors.tPrimary }]}
      hitSlop={6}
    >
      <Icon name="pin" size={16} color={colors.secondary} strokeWidth={2.2} />
      <AppText size={14} weight="bold" numberOfLines={1} style={{ flexShrink: 1 }}>
        {text}
      </AppText>
      <Icon name="down" size={16} color={colors.muted} strokeWidth={2.4} />
    </Pressable>
  );
}

/* ---------- Language switch ---------- */

export function LangSwitch() {
  const { lang, setLang } = useT();
  const options: { value: Lang; label: string }[] = [
    { value: 'en', label: 'English' },
    { value: 'hi', label: 'हिंदी' },
  ];
  return (
    <View style={styles.lang} accessibilityRole="radiogroup">
      {options.map((o) => {
        const active = o.value === lang;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            onPress={() => {
              tick();
              setLang(o.value);
            }}
            style={[styles.langOpt, active && styles.langOn]}
          >
            <AppText size={15} weight="bold" color={active ? colors.white : colors.muted}>
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ---------- Text field ---------- */

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  hint,
  error,
  autoFocus,
  maxLength,
  secure,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  hint?: string;
  error?: string | null;
  autoFocus?: boolean;
  maxLength?: number;
  secure?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      <AppText size={15} weight="semibold" color={colors.muted} style={styles.fieldLabel}>
        {label}
      </AppText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoFocus={autoFocus}
        maxLength={maxLength}
        secureTextEntry={secure}
        accessibilityLabel={label}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[styles.input, focused && styles.inputFocus, error ? { borderColor: colors.danger } : null]}
      />
      {error ? (
        <View style={styles.fieldNote}>
          <Icon name="alert" size={15} color={colors.danger} strokeWidth={2.4} />
          <AppText size={14} weight="semibold" color={colors.danger} style={{ flex: 1 }}>
            {error}
          </AppText>
        </View>
      ) : hint ? (
        <AppText size={14} color={colors.muted} style={{ marginTop: 4, marginLeft: 2 }}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

/* ---------- Section label ---------- */

export function Section({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return (
    <AppText size={14} weight="bold" color={colors.muted} style={[styles.section, style]}>
      {children}
    </AppText>
  );
}

/* ---------- Empty state ---------- */

export function Empty({ title, body, action, icon = 'box' }: { title: string; body: string; action?: React.ReactNode; icon?: IconName }) {
  return (
    <Card style={styles.empty}>
      <Badge icon={icon} color={colors.slate} tint={colors.tNeutral} size={48} />
      <AppText size={20} weight="bold" style={{ textAlign: 'center', marginTop: 6 }}>{title}</AppText>
      <AppText size={16} color={colors.muted} style={{ textAlign: 'center' }}>{body}</AppText>
      {action ? <View style={{ marginTop: 10, alignSelf: 'stretch' }}>{action}</View> : null}
    </Card>
  );
}

/* ---------- Error strip ---------- */

export function ErrorStrip({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) {
  const body = (
    <View style={styles.errorStrip}>
      <Icon name="alert" size={20} color={colors.danger} strokeWidth={2.3} />
      <View style={{ flex: 1, gap: 2 }}>{children}</View>
    </View>
  );
  return onPress ? (
    <Pressable accessibilityRole="button" onPress={onPress}>
      {body}
    </Pressable>
  ) : (
    body
  );
}

/* ---------- Segmented (text only, 44px) ---------- */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  activeColors,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  activeColors?: Partial<Record<T, string>>;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((o) => {
        const active = o.value === value;
        const bg = active ? activeColors?.[o.value] ?? colors.primary : colors.white;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityLabel={o.label}
            accessibilityState={{ selected: active }}
            onPress={() => {
              tick();
              onChange(o.value);
            }}
            style={[styles.segment, { backgroundColor: bg, borderColor: active ? bg : colors.line }]}
          >
            {active ? <Icon name="check" size={15} color={colors.white} strokeWidth={2.6} /> : null}
            <AppText size={15} weight="semibold" color={active ? colors.white : colors.muted} numberOfLines={1}>
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ---------- Layout ---------- */

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function ScreenHeader({ title, subtitle, back = true, right }: { title: string; subtitle?: string; back?: boolean; right?: React.ReactNode }) {
  const router = useRouter();
  const { t } = useT();
  return (
    <View style={styles.header}>
      {back ? <IconButton icon="back" label={t.common.back} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} /> : null}
      <View style={{ flex: 1 }}>
        <AppText size={25} weight="bold" accessibilityRole="header" numberOfLines={2}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText size={15} weight="medium" color={colors.muted} numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right}
    </View>
  );
}

export function StatusRow({ site }: { site?: string }) {
  return (
    <View style={styles.statusRow}>
      <View style={{ flexShrink: 1 }}>
        <SiteChip label={site} />
      </View>
      <SyncChip />
    </View>
  );
}

export function Screen({
  children,
  footer,
  toast,
  scroll = true,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
  toast?: React.ReactNode;
  scroll?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const footerPad = Math.max(insets.bottom, 12) + 6;
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: footer ? 170 : 32 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, paddingHorizontal: gutter }}>{children}</View>
      )}
      {toast}
      {footer ? <View style={[styles.footer, { paddingBottom: footerPad }]}>{footer}</View> : null}
    </View>
  );
}

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = (m: string) => {
    setMessage(m);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), 2200);
  };
  const toast = message ? (
    <View style={styles.toast} pointerEvents="none" accessibilityLiveRegion="polite">
      <Icon name="check" size={18} color={colors.white} strokeWidth={2.6} />
      <AppText size={15} weight="semibold" color={colors.white} style={{ flexShrink: 1 }}>
        {message}
      </AppText>
    </View>
  ) : null;
  return { toast, showToast };
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 10, paddingBottom: 14 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, paddingBottom: 14 },
  button: {
    minHeight: 56,
    borderRadius: radius.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 18,
  },
  buttonOff: { backgroundColor: colors.tNeutral, borderWidth: 0, opacity: 1 },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: 11,
    alignSelf: 'flex-start',
  },
  siteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingLeft: 10,
    paddingRight: 8,
    minHeight: 36,
  },
  lang: { flexDirection: 'row', backgroundColor: colors.tNeutral, borderRadius: radius.pill, padding: 3, alignSelf: 'flex-start' },
  langOpt: { minHeight: 36, paddingHorizontal: 14, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  langOn: { backgroundColor: colors.primary },
  segmented: { flexDirection: 'row', gap: 8 },
  segment: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    minHeight: 46,
    borderRadius: radius.control,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  fieldLabel: { marginBottom: 6, marginLeft: 2 },
  fieldNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 6, marginLeft: 2 },
  input: {
    minHeight: 56,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.line,
    paddingHorizontal: 14,
    fontSize: 18,
    fontFamily: fonts.medium,
    color: colors.text,
    backgroundColor: colors.white,
  },
  inputFocus: { borderColor: colors.primary },
  section: { marginTop: 18, marginBottom: 8, marginLeft: 2, letterSpacing: 0.3 },
  empty: { alignItems: 'center', gap: 4, paddingVertical: 22, paddingHorizontal: 18, marginBottom: 12 },
  errorStrip: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: colors.tDanger,
    borderRadius: radius.control,
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: 14, ...shadow.card },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: gutter,
    paddingTop: 12,
    gap: 10,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  toast: {
    position: 'absolute',
    left: gutter,
    right: gutter,
    bottom: 160,
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.text,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

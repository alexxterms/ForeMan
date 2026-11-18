import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { en, Strings } from './en';
import { hi } from './hi';

export type Lang = 'en' | 'hi';

const KEY = 'foreman-lang';
const TABLE: Record<Lang, Strings> = { en, hi };

function deviceLang(): Lang {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase().startsWith('hi') ? 'hi' : 'en';
  } catch {
    return 'en';
  }
}

// For code outside React (billing notes, voice errors). Screens use useT().
const START = deviceLang();
let current: { lang: Lang; t: Strings } = { lang: START, t: TABLE[START] };
function setCurrent(l: Lang) {
  current = { lang: l, t: TABLE[l] };
}
export const tr = () => current.t;
export const currentLang = () => current.lang;

type Ctx = { lang: Lang; t: Strings; setLang: (l: Lang) => void };
const LangCtx = createContext<Ctx>({ lang: 'en', t: en, setLang: () => {} });

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(START);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => {
        if (v === 'en' || v === 'hi') {
          setCurrent(v);
          setLangState(v);
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const setLang = useCallback((l: Lang) => {
    setCurrent(l);
    setLangState(l);
    AsyncStorage.setItem(KEY, l).catch(() => {});
  }, []);

  const value = useMemo(() => ({ lang, t: TABLE[lang], setLang }), [lang, setLang]);

  if (!ready) return null;
  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export function useT(): Ctx {
  return useContext(LangCtx);
}

export function unitLabel(unit: string): string {
  return current.t.units[unit] ?? unit;
}

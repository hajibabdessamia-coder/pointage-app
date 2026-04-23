'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Lang, Translations, getSavedLang, saveLang, getT, isRTL } from '../lib/lang';

type LangCtx = {
  lang: Lang;
  t: Translations;
  setLang: (l: Lang) => void;
};

const LangContext = createContext<LangCtx>({
  lang: 'ar',
  t: getT('ar'),
  setLang: () => {},
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ar');

  useEffect(() => {
    const saved = getSavedLang();
    setLangState(saved);
    document.documentElement.lang = saved;
    document.documentElement.dir = isRTL(saved) ? 'rtl' : 'ltr';
  }, []);

  function setLang(l: Lang) {
    saveLang(l);
    setLangState(l);
    document.documentElement.lang = l;
    document.documentElement.dir = isRTL(l) ? 'rtl' : 'ltr';
  }

  return (
    <LangContext.Provider value={{ lang, t: getT(lang), setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}

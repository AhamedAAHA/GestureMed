import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('medisign_lang') || 'en');

  const setLanguage = useCallback((code) => {
    setLang(code);
    localStorage.setItem('medisign_lang', code);
  }, []);

  const t = useCallback(
    (key) => translations[lang]?.[key] || translations.en[key] || key,
    [lang]
  );

  const value = useMemo(() => ({ lang, setLanguage, t }), [lang, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

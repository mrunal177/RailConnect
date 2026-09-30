import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, TranslationKey, translations } from '../lib/i18n.ts';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => translations.en[key] || key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('smart_rail_language') as Language;
      if (saved && (saved === 'en' || saved === 'hi' || saved === 'mr')) {
        return saved;
      }
    } catch (e) {
      // Local storage unavailable
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('smart_rail_language', lang);
    } catch (e) {
      // Ignore
    }
  };

  const t = (key: TranslationKey): string => {
    const langObj = translations[language] || translations.en;
    return (langObj as any)[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

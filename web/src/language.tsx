import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import english from './data.en.json';
import { configuration, numberText, scoreSummary } from './results';
import type { Evaluation } from './types';

type Language = 'zh' | 'en';
const STORAGE_KEY = 'cyberai-language';
const translations: Record<string, string> = english;
const LanguageContext = createContext<{
  language: Language;
  setLanguage: (value: Language) => void;
} | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'zh';
    } catch {
      return 'zh';
    }
  });
  useEffect(() => {
    document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Language switching also works when browser storage is unavailable.
    }
  }, [language]);
  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw Error('LanguageProvider is required');
  const { language } = context;
  const t = (zh: string, en: string) => (language === 'en' ? en : zh);
  const tr = (value: string) => (language === 'en' ? translations[value] || value : value);
  const config = (value: string) =>
    language === 'en' ? tr(value) || 'See report settings' : configuration(value);
  const summary = (record: Evaluation) => {
    if (language === 'zh') return scoreSummary(record);
    if (record.scoreStatus === 'graphical') return 'Result shown in report figure';
    if (record.scoreStatus === 'qualitative') return 'Qualitative finding; see original report';
    if (record.scoreStatus !== 'reported') return '—';
    if (!/[\u3400-\u9fff]/.test(record.score)) return record.score;
    return (
      record.metrics
        .map(
          (metric) =>
            `${tr(metric.label)}: ${typeof metric.value === 'number' ? numberText(metric.value) : metric.value}${metric.unit === 'percent' ? '%' : ''}`,
        )
        .join('; ') || 'See original reported result'
    );
  };
  return { ...context, t, tr, config, summary };
}

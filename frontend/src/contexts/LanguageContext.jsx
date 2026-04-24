import React, {
  createContext,
  useState,
  useEffect,
  useContext,
} from 'react';
import { API_BASE } from '../api';

const LanguageContext = createContext();

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');
  const [messages, setMessages] = useState({});
  const [loadingTranslations, setLoadingTranslations] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('kaamwali-language');
    if (saved) setLanguage(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem('kaamwali-language', language);

    const fetchTranslations = async () => {
      setLoadingTranslations(true);
      try {
        const res = await fetch(`${API_BASE}/api/i18n?lang=${language}`);

        const data = await res.json();
        setMessages(data || {});
      } catch (e) {
        console.error('Failed to fetch translations', e);
      } finally {
        setLoadingTranslations(false);
      }
    };

    fetchTranslations();
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, messages, loadingTranslations }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

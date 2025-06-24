// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translations from './translations.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      de: { translation: translations.de },
      en: { translation: translations.en },
      pl: { translation: translations.pl },
      cs: { translation: translations.cs }
    },
    lng: 'de', // Default language
    fallbackLng: 'de',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;

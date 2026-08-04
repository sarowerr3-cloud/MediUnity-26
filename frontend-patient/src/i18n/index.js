import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import bnTranslation from "./locales/bn.json";
import enTranslation from "./locales/en.json";

const resources = {
  bn: {
    translation: bnTranslation
  },
  en: {
    translation: enTranslation
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem("lng") || "bn", // Default to Bengali
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;

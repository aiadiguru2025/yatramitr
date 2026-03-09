import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// ── Translation resources (inline for bundle speed on first load) ──
import en from "./locales/en.json";
import hi from "./locales/hi.json";
import bn from "./locales/bn.json";
import te from "./locales/te.json";
import mr from "./locales/mr.json";
import ta from "./locales/ta.json";
import gu from "./locales/gu.json";
import kn from "./locales/kn.json";
import ml from "./locales/ml.json";
import pa from "./locales/pa.json";
import or from "./locales/or.json";
import as_ from "./locales/as.json";
import ur from "./locales/ur.json";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English",       nativeLabel: "English",     script: "Latin" },
  { code: "hi", label: "Hindi",         nativeLabel: "हिन्दी",       script: "Devanagari" },
  { code: "bn", label: "Bengali",       nativeLabel: "বাংলা",        script: "Bengali" },
  { code: "te", label: "Telugu",        nativeLabel: "తెలుగు",       script: "Telugu" },
  { code: "mr", label: "Marathi",       nativeLabel: "मराठी",        script: "Devanagari" },
  { code: "ta", label: "Tamil",         nativeLabel: "தமிழ்",        script: "Tamil" },
  { code: "gu", label: "Gujarati",      nativeLabel: "ગુજરાતી",     script: "Gujarati" },
  { code: "kn", label: "Kannada",       nativeLabel: "ಕನ್ನಡ",        script: "Kannada" },
  { code: "ml", label: "Malayalam",     nativeLabel: "മലയാളം",       script: "Malayalam" },
  { code: "pa", label: "Punjabi",       nativeLabel: "ਪੰਜਾਬੀ",       script: "Gurmukhi" },
  { code: "or", label: "Odia",          nativeLabel: "ଓଡ଼ିଆ",         script: "Odia" },
  { code: "as", label: "Assamese",      nativeLabel: "অসমীয়া",      script: "Bengali" },
  { code: "ur", label: "Urdu",          nativeLabel: "اردو",         script: "Arabic", rtl: true },
] as const;

export type LangCode = typeof SUPPORTED_LANGUAGES[number]["code"];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      bn: { translation: bn },
      te: { translation: te },
      mr: { translation: mr },
      ta: { translation: ta },
      gu: { translation: gu },
      kn: { translation: kn },
      ml: { translation: ml },
      pa: { translation: pa },
      or: { translation: or },
      as: { translation: as_ },
      ur: { translation: ur },
    },
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

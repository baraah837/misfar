// src/i18n/LanguageContext.js
// Lightweight AR/EN i18n with RTL support. No external dependency, no API calls.
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import translations from "./translations";

const STORAGE_KEY = "misfar_lang";
const LanguageContext = createContext({
  lang: "en",
  dir: "ltr",
  isRTL: false,
  setLang: () => {},
  toggleLang: () => {},
  t: (k) => k,
  tv: (v) => v,
  locale: "en-GB",
});

const detectInitial = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "ar" || saved === "en") return saved;
  } catch {}
  const nav = (typeof navigator !== "undefined" && navigator.language) || "en";
  return nav.toLowerCase().startsWith("ar") ? "ar" : "en";
};

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(detectInitial);
  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    document.body.classList.toggle("lang-ar", lang === "ar");
    document.body.classList.toggle("lang-en", lang !== "ar");
    try { localStorage.setItem(STORAGE_KEY, lang); } catch {}
  }, [lang, dir]);

  const setLang = useCallback((l) => setLangState(l === "ar" ? "ar" : "en"), []);
  const toggleLang = useCallback(() => setLangState((l) => (l === "ar" ? "en" : "ar")), []);

  // t("key", { name: "x" }) -> string. Falls back to English, then to the key.
  const t = useCallback(
    (key, vars) => {
      let str = translations[lang]?.[key] ?? translations.en?.[key] ?? key;
      if (vars) Object.keys(vars).forEach((k) => { str = str.split(`{${k}}`).join(vars[k]); });
      return str;
    },
    [lang]
  );

  // tv("Historic") -> translated value for API-provided labels (category, region, seeded names).
  // Unknown values (anything an admin adds later) are returned unchanged.
  const tv = useCallback(
    (v) => (v && translations[lang]?.[`val.${v}`]) || v,
    [lang]
  );

  const value = useMemo(
    () => ({ lang, dir, isRTL: lang === "ar", setLang, toggleLang, t, tv, locale: lang === "ar" ? "ar-OM" : "en-GB" }),
    [lang, dir, setLang, toggleLang, t, tv]
  );
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLang = () => useContext(LanguageContext);
export default LanguageContext;

// src/components/LanguageSwitch.js
import React from "react";
import { useLang } from "../i18n/LanguageContext";

export default function LanguageSwitch({ className = "", compact = false }) {
  const { lang, setLang, t } = useLang();
  return (
    <div className={`lang-switch ${compact ? "lang-switch--compact" : ""} ${className}`} role="group" aria-label={t("lang.label")}>
      <button type="button" className={lang === "en" ? "active" : ""} onClick={() => setLang("en")} aria-pressed={lang === "en"}>EN</button>
      <button type="button" className={lang === "ar" ? "active" : ""} onClick={() => setLang("ar")} aria-pressed={lang === "ar"}>عربي</button>
    </div>
  );
}

// Small bottom banner that offers "Install app" on phones (Android prompt, iOS hint). Dismissal is remembered.
import React, { useState } from "react";
import { useLang } from "../i18n/LanguageContext";
import { usePWAInstall, isStandalone } from "./pwa";

const KEY = "misfar_install_dismissed";
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;

export default function InstallPrompt() {
  const { t } = useLang();
  const { canInstall, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
  });
  const showIOS = isIOS() && !isStandalone();
  if (dismissed || isStandalone() || (!canInstall && !showIOS)) return null;

  const dismiss = () => { try { localStorage.setItem(KEY, "1"); } catch {} setDismissed(true); };
  return (
    <div className="install-banner" role="dialog" aria-label={t("pwa.title")}>
      <img src={`${process.env.PUBLIC_URL || ""}/logo192.png`} alt="" width="40" height="40" />
      <div className="install-banner-text">
        <strong>{t("pwa.title")}</strong>
        <span>{canInstall ? t("pwa.body") : t("pwa.ios_hint")}</span>
      </div>
      {canInstall && <button className="install-yes" onClick={() => { promptInstall(); dismiss(); }}>{t("pwa.install")}</button>}
      <button className="install-no" onClick={dismiss}>{t("pwa.later")}</button>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { useLang } from "../i18n/LanguageContext";

export default function OfflineBanner() {
  const { t } = useLang();
  const [offline, setOffline] = useState(typeof navigator !== "undefined" && navigator.onLine === false);
  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  if (!offline) return null;
  return <div className="offline-banner" role="status">{t("common.offline_banner")}</div>;
}

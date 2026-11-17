// src/Offers.js – offers, suggestions and alerts, from the EXISTING notifications endpoint.
import React, { useEffect, useState } from "react";
import { FaTags, FaLightbulb, FaExclamationTriangle } from "react-icons/fa";
import { getToken } from "./services/api";
import { fetchNotifications, markNotificationRead } from "./services/notificationsClient";
import { useLang } from "./i18n/LanguageContext";

const ICONS = { offer: FaTags, suggestion: FaLightbulb, alert: FaExclamationTriangle };
const TABS = ["all", "offer", "suggestion", "alert"];

export default function Offers() {
  const { t, locale } = useLang();
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState("all");
  const [state, setState] = useState("loading");

  useEffect(() => {
    if (!getToken()) { setState("login"); return; }
    fetchNotifications()
      .then((res) => { if (res.success) { setItems(res.data || []); setState("ok"); } else setState("error"); })
      .catch(() => setState("error"));
  }, []);

  const read = async (id) => {
    try { await markNotificationRead(id); } catch {}
    setItems((p) => p.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };
  const shown = items.filter((n) => tab === "all" || (n.type || "offer") === tab);

  return (
    <div className="learn-page page-transition">
      <div className="learn-wrap narrow">
        <header className="learn-hero">
          <FaTags className="learn-hero-icon" />
          <h1>{t("offers.title")}</h1>
          <p>{t("offers.subtitle")}</p>
        </header>
        <div className="trail-tabs" role="tablist">
          {TABS.map((k) => (
            <button key={k} role="tab" aria-selected={tab === k} className={`trail-tab ${tab === k ? "active" : ""}`} onClick={() => setTab(k)}>
              <strong>{t(`offers.tab_${k}`)}</strong>
            </button>
          ))}
        </div>
        {state === "loading" && <p className="learn-muted">{t("common.loading")}</p>}
        {state === "login" && <p className="learn-muted">{t("offers.login")}</p>}
        {state === "error" && <p className="learn-muted">{t("offers.error")}</p>}
        {state === "ok" && shown.length === 0 && <p className="learn-muted">{t("offers.empty")}</p>}
        <div className="offer-list">
          {shown.map((n) => {
            const type = n.type || "offer";
            const Icon = ICONS[type] || FaTags;
            return (
              <article key={n.id} className={`offer ${n.is_read ? "" : "unread"}`} onClick={() => !n.is_read && read(n.id)}>
                <span className={`offer-ic ${type}`}><Icon /></span>
                <div>
                  <div className="offer-top">
                    <span className="offer-type">{t(`offers.type_${type}`)}</span>
                    {!n.is_read && <span className="offer-new">{t("offers.new")}</span>}
                  </div>
                  <h3>{n.title}</h3>
                  <p>{n.message}</p>
                  {n.sent_at && <time>{new Date(n.sent_at).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" })}</time>}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

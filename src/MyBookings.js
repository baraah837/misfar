// src/MyBookings.js – the traveller's booking requests
import React, { useEffect, useState } from "react";
import { FaCalendarCheck } from "react-icons/fa";
import { bookingAPI } from "./services/businessApi";
import { useLang } from "./i18n/LanguageContext";

export default function MyBookings({ onNavigate = () => {} }) {
  const { t, lang, locale } = useLang();
  const [items, setItems] = useState(null);
  const [error, setError] = useState(false);
  const load = () => bookingAPI.mine().then((r) => (r.success ? setItems(r.data) : setError(true))).catch(() => setError(true));
  useEffect(() => { load(); }, []);
  const cancel = async (id) => {
    if (!window.confirm(t("biz.confirm_cancel"))) return;
    const r = await bookingAPI.cancel(id); if (r.success) load(); else alert(r.message);
  };
  return (
    <div className="learn-page page-transition">
      <div className="learn-wrap narrow">
        <header className="learn-hero"><FaCalendarCheck className="learn-hero-icon" /><h1>{t("biz.my_bookings")}</h1></header>
        {error && <p className="learn-muted">{t("common.error_connect")}</p>}
        {items === null && !error && <p className="learn-muted">{t("common.loading")}</p>}
        {items && items.length === 0 && (<div className="learn-muted center"><p>{t("biz.no_bookings")}</p><button className="learn-btn" onClick={() => onNavigate("directory")}>{t("nav.directory")}</button></div>)}
        <div className="offer-list">
          {(items || []).map((k) => (
            <article key={k.id} className="offer">
              <div style={{ flex: 1 }}>
                <div className="offer-top"><span className={`status-pill s-${k.status}`}>{t(`biz.status.${k.status}`)}</span></div>
                <h3>{(lang === "ar" && k.business_name_ar) || k.business_name}</h3>
                <p>{new Date(k.booking_date).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" })}{k.booking_time ? ` · ${k.booking_time}` : ""} · {t("biz.guests")}: {k.guests}</p>
                {k.amount_omr != null && <p>{t("biz.final_amount")}: {Number(k.amount_omr).toFixed(3)} {t("common.omr")}</p>}
                {k.business_phone && <p className="learn-muted">☎ {k.business_phone}</p>}
                {["pending", "confirmed"].includes(k.status) && <button className="learn-btn ghost" onClick={() => cancel(k.id)}>{t("biz.cancel_booking")}</button>}
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

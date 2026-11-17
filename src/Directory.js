// src/Directory.js – hotels / restaurants / tours directory + booking requests
import React, { useEffect, useState, useCallback } from "react";
import { FaHotel, FaUtensils, FaCoffee, FaRoute, FaStore, FaMapMarkerAlt, FaPhone, FaGlobe, FaStar, FaArrowLeft } from "react-icons/fa";
import { bizAPI, bookingAPI } from "./services/businessApi";
import { resolveMediaUrl } from "./config";
import { useLang } from "./i18n/LanguageContext";
import { getToken } from "./services/api";
import AdSlot from "./components/AdSlot";

const ICONS = { hotel: FaHotel, restaurant: FaUtensils, cafe: FaCoffee, tour: FaRoute, other: FaStore };
const TYPES = ["hotel", "restaurant", "cafe", "tour", "other"];
const pick = (lang, b, f) => (lang === "ar" && b[`${f}_ar`]) || b[f];

function BookingForm({ business }) {
  const { t } = useLang();
  const today = new Date().toISOString().slice(0, 10);
  const [f, setF] = useState({ booking_date: "", booking_time: "", guests: 2, contact_phone: "", notes: "" });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!getToken()) { setMsg({ err: true, text: t("common.login_required") }); return; }
    if (!f.booking_date) { setMsg({ err: true, text: t("biz.err_date") }); return; }
    setBusy(true); setMsg(null);
    try {
      const res = await bookingAPI.create({ business_id: business.id, ...f, guests: parseInt(f.guests) || 1 });
      setMsg(res.success ? { text: t("biz.booking_sent") } : { err: true, text: res.message || t("common.error_connect") });
    } catch { setMsg({ err: true, text: t("common.error_connect") }); }
    setBusy(false);
  };
  return (
    <form className="learn-card form" onSubmit={submit}>
      <h3>{t("biz.book_title")}</h3>
      <div className="form-row">
        <label>{t("biz.date")}<input type="date" min={today} value={f.booking_date} onChange={set("booking_date")} /></label>
        <label>{t("biz.time")}<input type="time" value={f.booking_time} onChange={set("booking_time")} /></label>
      </div>
      <div className="form-row">
        <label>{t("biz.guests")}<input type="number" min="1" max="500" value={f.guests} onChange={set("guests")} /></label>
        <label>{t("biz.phone")}<input type="tel" value={f.contact_phone} onChange={set("contact_phone")} autoComplete="tel" /></label>
      </div>
      <label>{t("biz.notes")}<textarea rows={3} value={f.notes} onChange={set("notes")} maxLength={1000} /></label>
      {msg && <p className={msg.err ? "quiz-bad" : "quiz-ok"}>{msg.text}</p>}
      <button className="learn-btn" disabled={busy}>{busy ? t("common.loading") : t("biz.book_btn")}</button>
      <small className="learn-muted">{t("biz.book_note")}</small>
    </form>
  );
}

function BusinessCard({ b, onOpen, lang, t }) {
  const Icon = ICONS[b.type] || FaStore;
  return (
    <article className="biz-card" onClick={() => onOpen(b)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") onOpen(b); }}>
      <div className="biz-img">{b.photo_url ? <img src={resolveMediaUrl(b.photo_url)} alt="" loading="lazy" /> : <Icon />}</div>
      <div className="biz-body">
        <div className="biz-top"><span className="biz-type"><Icon /> {t(`biz.type.${b.type}`)}</span>{b.is_promoted && <span className="biz-promo"><FaStar /> {t("biz.promoted")}</span>}</div>
        <h3>{pick(lang, b, "name")}</h3>
        <p className="biz-loc"><FaMapMarkerAlt /> {[b.area, b.region].filter(Boolean).join(", ") || "—"}</p>
        {b.price_from_omr != null && <p className="biz-price">{t("biz.from")} {Number(b.price_from_omr).toFixed(3)} {t("common.omr")}</p>}
      </div>
    </article>
  );
}

export default function Directory({ onNavigate = () => {} }) {
  const { t, lang } = useLang();
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState(null);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState(null);

  const load = useCallback(() => {
    setError(false);
    bizAPI.list({ type, search: search.trim() }).then((r) => { if (r.success) setItems(r.data); else setError(true); }).catch(() => setError(true));
  }, [type, search]);
  useEffect(() => { const h = setTimeout(load, 250); return () => clearTimeout(h); }, [load]);

  if (selected) {
    const b = selected; const Icon = ICONS[b.type] || FaStore;
    const lat = parseFloat(b.latitude), lng = parseFloat(b.longitude);
    const maps = b.map_link || (Number.isFinite(lat) && Number.isFinite(lng) ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : null);
    return (
      <div className="learn-page page-transition">
        <div className="learn-wrap">
          <button className="link-btn back-link" onClick={() => setSelected(null)}><FaArrowLeft className="flip-rtl" /> {t("common.back")}</button>
          <div className="biz-detail">
            <div className="biz-detail-img">{b.photo_url ? <img src={resolveMediaUrl(b.photo_url)} alt="" /> : <Icon />}</div>
            <div>
              <span className="biz-type"><Icon /> {t(`biz.type.${b.type}`)}</span>
              {b.is_promoted && <span className="biz-promo"><FaStar /> {t("biz.promoted")}</span>}
              <h1>{pick(lang, b, "name")}</h1>
              <p className="biz-loc"><FaMapMarkerAlt /> {[b.area, b.region].filter(Boolean).join(", ")}</p>
              {b.price_from_omr != null && <p className="biz-price">{t("biz.from")} {Number(b.price_from_omr).toFixed(3)} {t("common.omr")}</p>}
              <p className="biz-desc">{pick(lang, b, "description")}</p>
              <div className="location-actions">
                {b.phone && <a className="location-btn secondary" href={`tel:${b.phone}`}><FaPhone /> {b.phone}</a>}
                {b.website && /^https?:\/\//i.test(b.website) && <a className="location-btn secondary" href={b.website} target="_blank" rel="noopener noreferrer"><FaGlobe /> {t("biz.website")}</a>}
                {maps && <a className="location-btn" href={maps} target="_blank" rel="noopener noreferrer">📍 {t("det.open_maps")}</a>}
              </div>
            </div>
          </div>
          <BookingForm business={b} />
          <AdSlot placement="details" />
        </div>
      </div>
    );
  }

  return (
    <div className="learn-page page-transition">
      <div className="learn-wrap">
        <header className="learn-hero"><FaHotel className="learn-hero-icon" /><h1>{t("biz.title")}</h1><p>{t("biz.subtitle")}</p></header>
        <div className="dir-tools">
          <input type="search" className="dir-search" placeholder={t("biz.search_ph")} value={search} onChange={(e) => setSearch(e.target.value)} aria-label={t("biz.search_ph")} />
          <div className="trail-tabs">
            <button className={`trail-tab ${type === "" ? "active" : ""}`} onClick={() => setType("")}><strong>{t("dest.filter_all")}</strong></button>
            {TYPES.map((k) => <button key={k} className={`trail-tab ${type === k ? "active" : ""}`} onClick={() => setType(k)}><strong>{t(`biz.type.${k}`)}</strong></button>)}
          </div>
        </div>
        <AdSlot placement="destinations" />
        {error && <p className="learn-muted">{t("common.error_connect")} <button className="link-btn" onClick={load}>{t("common.retry")}</button></p>}
        {items === null && !error && <p className="learn-muted">{t("common.loading")}</p>}
        {items && items.length === 0 && <p className="learn-muted">{t("biz.empty")}</p>}
        <div className="biz-grid">{(items || []).map((b) => <BusinessCard key={b.id} b={b} onOpen={setSelected} lang={lang} t={t} />)}</div>
        <section className="schools-cta">
          <div><h3>{t("biz.owner_cta_title")}</h3><p>{t("biz.owner_cta_body")}</p></div>
          <button className="learn-btn" onClick={() => onNavigate("business")}>{t("biz.owner_cta_btn")}</button>
        </section>
      </div>
    </div>
  );
}

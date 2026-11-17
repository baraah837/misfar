// src/BusinessPortal.js – for hotel / restaurant / tour owners: list a business, subscribe to a plan, manage bookings
import React, { useEffect, useState, useCallback } from "react";
import { FaStore } from "react-icons/fa";
import { bizAPI, planAPI, bookingAPI } from "./services/businessApi";
import { getToken } from "./services/api";
import { useLang } from "./i18n/LanguageContext";
import { resolveMediaUrl } from "./config";

const TYPES = ["hotel", "restaurant", "cafe", "tour", "other"];
const EMPTY = { type: "hotel", name: "", name_ar: "", description: "", description_ar: "", region: "", area: "", phone: "", website: "", map_link: "", latitude: "", longitude: "", price_from_omr: "" };

function BusinessForm({ initial, onSaved, onCancel }) {
  const { t } = useLang();
  const [f, setF] = useState({ ...EMPTY, ...Object.fromEntries(Object.entries(initial || {}).filter(([k]) => k in EMPTY).map(([k, v]) => [k, v ?? ""])) });
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const editing = !!initial?.id;

  const save = async (e) => {
    e.preventDefault();
    if (!f.name.trim()) { setMsg({ err: true, text: t("biz.err_name") }); return; }
    setBusy(true); setMsg(null);
    try {
      const body = { ...f }; Object.keys(body).forEach((k) => { if (body[k] === "") delete body[k]; });
      const res = editing ? await bizAPI.update(initial.id, body) : await bizAPI.create(body);
      if (!res.success) { setMsg({ err: true, text: res.message || t("common.error_connect") }); setBusy(false); return; }
      if (file) await bizAPI.uploadPhoto(res.data.id, file);
      onSaved();
    } catch { setMsg({ err: true, text: t("common.error_connect") }); }
    setBusy(false);
  };
  return (
    <form className="learn-card form" onSubmit={save}>
      <h3>{editing ? t("biz.edit_business") : t("biz.add_business")}</h3>
      <label>{t("biz.f_type")}<select value={f.type} onChange={set("type")}>{TYPES.map((k) => <option key={k} value={k}>{t(`biz.type.${k}`)}</option>)}</select></label>
      <div className="form-row">
        <label>{t("biz.f_name")}<input value={f.name} onChange={set("name")} maxLength={150} /></label>
        <label>{t("biz.f_name_ar")}<input value={f.name_ar} onChange={set("name_ar")} maxLength={150} dir="rtl" /></label>
      </div>
      <label>{t("biz.f_desc")}<textarea rows={3} value={f.description} onChange={set("description")} /></label>
      <label>{t("biz.f_desc_ar")}<textarea rows={3} value={f.description_ar} onChange={set("description_ar")} dir="rtl" /></label>
      <div className="form-row">
        <label>{t("det.region")}<input value={f.region} onChange={set("region")} placeholder="Muscat" /></label>
        <label>{t("biz.f_area")}<input value={f.area} onChange={set("area")} /></label>
      </div>
      <div className="form-row">
        <label>{t("biz.phone")}<input type="tel" value={f.phone} onChange={set("phone")} /></label>
        <label>{t("biz.website")}<input type="url" value={f.website} onChange={set("website")} placeholder="https://" dir="ltr" /></label>
      </div>
      <label>{t("biz.f_map")}<input type="url" value={f.map_link} onChange={set("map_link")} placeholder="https://maps.google.com/..." dir="ltr" /></label>
      <div className="form-row">
        <label>{t("biz.f_lat")}<input type="number" step="any" value={f.latitude} onChange={set("latitude")} /></label>
        <label>{t("biz.f_lng")}<input type="number" step="any" value={f.longitude} onChange={set("longitude")} /></label>
      </div>
      <label>{t("biz.f_price")}<input type="number" step="0.001" min="0" value={f.price_from_omr} onChange={set("price_from_omr")} /></label>
      <label>{t("biz.f_photo")}<input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={(e) => setFile(e.target.files?.[0] || null)} /></label>
      {msg && <p className={msg.err ? "quiz-bad" : "quiz-ok"}>{msg.text}</p>}
      <div className="stop-actions">
        <button className="learn-btn" disabled={busy}>{busy ? t("common.loading") : t("common.save")}</button>
        <button type="button" className="learn-btn ghost" onClick={onCancel}>{t("common.cancel")}</button>
      </div>
      {!editing && <small className="learn-muted">{t("biz.review_note")}</small>}
    </form>
  );
}

function Bookings({ business }) {
  const { t, locale } = useLang();
  const [items, setItems] = useState(null);
  const load = useCallback(() => bizAPI.bookingsOf(business.id).then((r) => setItems(r.success ? r.data : [])).catch(() => setItems([])), [business.id]);
  useEffect(() => { load(); }, [load]);
  const act = async (k, status) => {
    let amount;
    if (status === "completed") {
      amount = window.prompt(t("biz.ask_amount"));
      if (amount === null) return;
      if (amount.trim() === "" || isNaN(Number(amount)) || Number(amount) < 0) { alert(t("biz.err_amount")); return; }
    }
    const r = await bookingAPI.setStatus(k.id, status, amount === undefined ? undefined : Number(amount));
    if (r.success) load(); else alert(r.message);
  };
  if (items === null) return <p className="learn-muted">{t("common.loading")}</p>;
  if (!items.length) return <p className="learn-muted">{t("biz.no_requests")}</p>;
  return (
    <div className="offer-list">
      {items.map((k) => (
        <article key={k.id} className="offer">
          <div style={{ flex: 1 }}>
            <div className="offer-top"><span className={`status-pill s-${k.status}`}>{t(`biz.status.${k.status}`)}</span></div>
            <h3>{k.username} · {k.guests} {t("biz.guests")}</h3>
            <p>{new Date(k.booking_date).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" })}{k.booking_time ? ` · ${k.booking_time}` : ""}</p>
            {k.contact_phone && <p>☎ <a href={`tel:${k.contact_phone}`}>{k.contact_phone}</a></p>}
            {k.notes && <p className="learn-muted">“{k.notes}”</p>}
            {k.commission_omr != null && <p className="learn-muted">{t("biz.final_amount")}: {Number(k.amount_omr).toFixed(3)} · {t("biz.commission")}: {Number(k.commission_omr).toFixed(3)} {t("common.omr")} ({t(`biz.comm.${k.commission_status}`)})</p>}
            <div className="stop-actions">
              {k.status === "pending" && <><button className="learn-btn" onClick={() => act(k, "confirmed")}>{t("biz.confirm")}</button><button className="learn-btn ghost" onClick={() => act(k, "rejected")}>{t("biz.reject")}</button></>}
              {k.status === "confirmed" && <button className="learn-btn" onClick={() => act(k, "completed")}>{t("biz.complete")}</button>}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export default function BusinessPortal() {
  const { t, lang, locale } = useLang();
  const [mine, setMine] = useState(null);
  const [plans, setPlans] = useState([]);
  const [subs, setSubs] = useState([]);
  const [instructions, setInstructions] = useState("");
  const [form, setForm] = useState(null);
  const [open, setOpen] = useState(null);
  const [notice, setNotice] = useState(null);

  const load = useCallback(() => {
    bizAPI.mine().then((r) => setMine(r.success ? r.data : [])).catch(() => setMine([]));
    planAPI.list("business").then((r) => r.success && setPlans(r.data)).catch(() => {});
    planAPI.mine().then((r) => r.success && setSubs(r.data)).catch(() => {});
    planAPI.settings().then((r) => r.success && setInstructions(r.data.payment_instructions || "")).catch(() => {});
  }, []);
  useEffect(() => { if (getToken()) load(); }, [load]);

  if (!getToken()) return <div className="learn-page"><div className="learn-wrap"><p className="learn-muted">{t("common.login_required")}</p></div></div>;

  const subscribe = async (planId, bizId) => {
    const r = await planAPI.subscribe(planId, bizId);
    if (r.success) { setNotice({ text: r.data.payment ? t("biz.sub_pending") : t("biz.sub_active"), instr: r.data.charge?.instructions || instructions }); load(); }
    else setNotice({ err: true, text: r.message });
  };
  const statusOf = (b) => subs.find((s) => s.business_id === b.id && (s.status === "pending_payment" || s.is_current));

  return (
    <div className="learn-page page-transition">
      <div className="learn-wrap">
        <header className="learn-hero"><FaStore className="learn-hero-icon" /><h1>{t("biz.portal_title")}</h1><p>{t("biz.portal_sub")}</p></header>
        {notice && (
          <div className={`learn-card notice ${notice.err ? "err" : ""}`}>
            <p>{notice.text}</p>
            {notice.instr && <><strong>{t("biz.how_to_pay")}</strong><p className="pre">{notice.instr}</p></>}
            <button className="link-btn" onClick={() => setNotice(null)}>{t("common.close")}</button>
          </div>
        )}
        {form ? (
          <BusinessForm initial={form.id ? form : null} onSaved={() => { setForm(null); load(); }} onCancel={() => setForm(null)} />
        ) : (
          <button className="learn-btn" onClick={() => setForm({})}>＋ {t("biz.add_business")}</button>
        )}
        {mine === null && <p className="learn-muted">{t("common.loading")}</p>}
        {mine && mine.length === 0 && !form && <p className="learn-muted">{t("biz.no_business")}</p>}
        {(mine || []).map((b) => {
          const sub = statusOf(b);
          return (
            <section key={b.id} className="learn-card biz-owner">
              <div className="biz-owner-head">
                {b.photo_url && <img src={resolveMediaUrl(b.photo_url)} alt="" />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3>{(lang === "ar" && b.name_ar) || b.name}</h3>
                  <span className={`status-pill s-${b.status}`}>{t(`biz.bstatus.${b.status}`)}</span>
                  {b.is_promoted && <span className="biz-promo">★ {t("biz.promoted")}</span>}
                  {b.admin_note && <p className="learn-muted">{b.admin_note}</p>}
                </div>
                <button className="learn-btn ghost" onClick={() => setForm(b)}>{t("biz.edit")}</button>
              </div>
              {b.status === "approved" && (
                <>
                  <h4>{t("biz.plan")}</h4>
                  {sub ? (
                    <p>{sub.plan_name} — {sub.status === "pending_payment" ? t("biz.sub_awaiting") : `${t("biz.valid_until")} ${new Date(sub.expires_at).toLocaleDateString(locale)}`}</p>
                  ) : plans.length === 0 ? <p className="learn-muted">{t("biz.no_plans")}</p> : (
                    <div className="plan-grid">
                      {plans.map((p) => (
                        <div key={p.id} className="plan-card">
                          <strong>{(lang === "ar" && p.name_ar) || p.name}</strong>
                          <span className="plan-price">{Number(p.price_omr).toFixed(3)} {t("common.omr")} <small>/ {p.period_months} {t("biz.months")}</small></span>
                          <ul>{(p.features || []).map((x, i) => <li key={i}>{x}</li>)}</ul>
                          <button className="learn-btn" onClick={() => subscribe(p.id, b.id)}>{t("biz.subscribe")}</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <button className="link-btn" onClick={() => setOpen(open === b.id ? null : b.id)}>{open === b.id ? t("learn.show_less") : t("biz.view_requests")}</button>
                  {open === b.id && <Bookings business={b} />}
                </>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

// src/Premium.js – Premium subscription for travellers + store of ready-made smart trip plans
import React, { useEffect, useState, useCallback } from "react";
import { FaCrown } from "react-icons/fa";
import { planAPI, productAPI } from "./services/businessApi";
import { getToken } from "./services/api";
import { useLang } from "./i18n/LanguageContext";

export default function Premium() {
  const { t, lang, locale } = useLang();
  const [tab, setTab] = useState("premium");
  const [plans, setPlans] = useState(null);
  const [subs, setSubs] = useState({ list: [], premium: false });
  const [products, setProducts] = useState(null);
  const [orders, setOrders] = useState([]);
  const [open, setOpen] = useState(null);
  const [notice, setNotice] = useState(null);
  const [instr, setInstr] = useState("");

  const load = useCallback(() => {
    planAPI.list("tourist").then((r) => setPlans(r.success ? r.data : [])).catch(() => setPlans([]));
    productAPI.list().then((r) => setProducts(r.success ? r.data : [])).catch(() => setProducts([]));
    planAPI.settings().then((r) => r.success && setInstr(r.data.payment_instructions || "")).catch(() => {});
    if (getToken()) {
      planAPI.mine().then((r) => r.success && setSubs({ list: r.data, premium: r.is_premium })).catch(() => {});
      productAPI.orders().then((r) => r.success && setOrders(r.data)).catch(() => {});
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const requireLogin = () => { if (!getToken()) { setNotice({ err: true, text: t("common.login_required") }); return true; } return false; };
  const subscribe = async (id) => {
    if (requireLogin()) return;
    const r = await planAPI.subscribe(id);
    if (r.success) { setNotice({ text: r.data.payment ? t("biz.sub_pending") : t("biz.sub_active"), instr: r.data.charge?.instructions || instr }); load(); }
    else setNotice({ err: true, text: r.message });
  };
  const buy = async (p) => {
    if (requireLogin()) return;
    const r = await productAPI.order(p.id);
    if (r.success) { setNotice({ text: t("prem.order_pending"), instr: r.data.charge?.instructions || instr }); load(); }
    else setNotice({ err: true, text: r.message });
  };
  const view = async (p) => {
    if (open?.id === p.id) { setOpen(null); return; }
    const r = await productAPI.get(p.id);
    if (r.success) setOpen(r.data);
  };
  const L = (o, f) => (lang === "ar" && o[`${f}_ar`]) || o[f];
  const current = subs.list.find((s) => s.is_current && s.audience === "tourist");
  const pending = subs.list.find((s) => s.status === "pending_payment" && s.audience === "tourist");

  return (
    <div className="learn-page page-transition">
      <div className="learn-wrap">
        <header className="learn-hero"><FaCrown className="learn-hero-icon" /><h1>{t("prem.title")}</h1><p>{t("prem.subtitle")}</p></header>
        {notice && (
          <div className={`learn-card notice ${notice.err ? "err" : ""}`}>
            <p>{notice.text}</p>
            {notice.instr && <><strong>{t("biz.how_to_pay")}</strong><p className="pre">{notice.instr}</p></>}
            <button className="link-btn" onClick={() => setNotice(null)}>{t("common.close")}</button>
          </div>
        )}
        <div className="trail-tabs">
          {["premium", "plans", "orders"].map((k) => <button key={k} className={`trail-tab ${tab === k ? "active" : ""}`} onClick={() => setTab(k)}><strong>{t(`prem.tab_${k}`)}</strong></button>)}
        </div>

        {tab === "premium" && (
          <>
            {current && <div className="learn-card notice"><strong>👑 {t("prem.active")}</strong><p>{t("biz.valid_until")} {new Date(current.expires_at).toLocaleDateString(locale)}</p></div>}
            {pending && !current && <div className="learn-card notice"><p>{t("biz.sub_awaiting")}</p></div>}
            <p className="learn-muted">{t("prem.benefits")}</p>
            {plans === null && <p className="learn-muted">{t("common.loading")}</p>}
            {plans && plans.length === 0 && <p className="learn-muted">{t("prem.no_plans")}</p>}
            <div className="plan-grid">
              {(plans || []).map((p) => (
                <div key={p.id} className="plan-card">
                  <strong>{L(p, "name")}</strong>
                  <span className="plan-price">{Number(p.price_omr).toFixed(3)} {t("common.omr")} <small>/ {p.period_months} {t("biz.months")}</small></span>
                  <ul>{(p.features || []).map((x, i) => <li key={i}>{x}</li>)}</ul>
                  <button className="learn-btn" disabled={!!current || !!pending} onClick={() => subscribe(p.id)}>{t("biz.subscribe")}</button>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "plans" && (
          <>
            {subs.premium && <p className="quiz-ok">👑 {t("prem.all_included")}</p>}
            {products === null && <p className="learn-muted">{t("common.loading")}</p>}
            {products && products.length === 0 && <p className="learn-muted">{t("prem.no_products")}</p>}
            <div className="offer-list">
              {(products || []).map((p) => (
                <article key={p.id} className="offer">
                  <div style={{ flex: 1 }}>
                    <h3>{L(p, "title")}</h3>
                    <p>{L(p, "description")}</p>
                    <p className="learn-muted">{p.duration_days ? `${p.duration_days} ${t("prof.days")} · ` : ""}{Number(p.price_omr) === 0 ? t("common.free") : `${Number(p.price_omr).toFixed(3)} ${t("common.omr")}`}</p>
                    <div className="stop-actions">
                      <button className="learn-btn ghost" onClick={() => view(p)}>{open?.id === p.id ? t("learn.show_less") : t("prem.view")}</button>
                      {!subs.premium && Number(p.price_omr) > 0 && <button className="learn-btn" onClick={() => buy(p)}>{t("prem.buy")}</button>}
                    </div>
                    {open?.id === p.id && (open.unlocked
                      ? <div className="itinerary pre">{L(open, "itinerary_text")}</div>
                      : <p className="learn-muted">🔒 {t("prem.locked")}</p>)}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        {tab === "orders" && (
          <div className="offer-list">
            {!getToken() && <p className="learn-muted">{t("common.login_required")}</p>}
            {getToken() && orders.length === 0 && <p className="learn-muted">{t("prem.no_orders")}</p>}
            {orders.map((o) => (
              <article key={o.id} className="offer"><div style={{ flex: 1 }}>
                <span className={`status-pill s-${o.status === "paid" ? "completed" : "pending"}`}>{t(`prem.order.${o.status}`)}</span>
                <h3>{L(o, "title")}</h3><p className="learn-muted">{Number(o.amount_omr).toFixed(3)} {t("common.omr")}</p>
              </div></article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

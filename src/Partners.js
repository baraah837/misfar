// src/Partners.js – partnership page (key partners from the business model). Sends via the user's email app.
import React, { useState } from "react";
import { FaHandshake, FaLandmark, FaUniversity, FaHotel, FaUtensils, FaVideo, FaUserTie, FaSearch } from "react-icons/fa";
import { useLang } from "./i18n/LanguageContext";
import { mailtoLink } from "./config";

const TYPES = [
  { id: "gov",     Icon: FaLandmark },
  { id: "edu",     Icon: FaUniversity },
  { id: "hotel",   Icon: FaHotel },
  { id: "rest",    Icon: FaUtensils },
  { id: "creator", Icon: FaVideo },
  { id: "talent",  Icon: FaUserTie },
  { id: "jobs",    Icon: FaSearch },
];

export default function Partners() {
  const { t } = useLang();
  const [type, setType] = useState("hotel");
  const [name, setName] = useState("");
  const [org, setOrg] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const send = (e) => {
    e.preventDefault();
    if (!name.trim() || !msg.trim()) { setErr(t("partners.f_required")); return; }
    setErr("");
    const label = t(`partners.t_${type}`);
    window.location.href = mailtoLink(
      t("partners.mail_subject", { type: label }),
      t("partners.mail_body", { name: name.trim(), org: org.trim() || "-", type: label, message: msg.trim() })
    );
  };

  return (
    <div className="learn-page page-transition">
      <div className="learn-wrap">
        <header className="learn-hero">
          <FaHandshake className="learn-hero-icon" />
          <h1>{t("partners.title")}</h1>
          <p>{t("partners.subtitle")}</p>
        </header>

        <h2 className="learn-h2">{t("partners.who")}</h2>
        <div className="partner-grid">
          {TYPES.map(({ id, Icon }) => (
            <button key={id} type="button" className={`partner-card ${type === id ? "active" : ""}`} onClick={() => setType(id)} aria-pressed={type === id}>
              <span className="badge-ic"><Icon /></span>
              <strong>{t(`partners.t_${id}`)}</strong>
              <small>{t(`partners.t_${id}_d`)}</small>
            </button>
          ))}
        </div>

        <div className="two-col">
          <section className="learn-card">
            <h3>{t("partners.steps")}</h3>
            <ol className="steps">
              <li>{t("partners.s1")}</li><li>{t("partners.s2")}</li><li>{t("partners.s3")}</li>
            </ol>
            <p className="learn-muted">{t("partners.plans_note")}</p>
          </section>

          <form className="learn-card form" onSubmit={send}>
            <h3>{t("partners.form_title")}</h3>
            <label>{t("partners.f_type")}
              <select value={type} onChange={(e) => setType(e.target.value)}>
                {TYPES.map(({ id }) => <option key={id} value={id}>{t(`partners.t_${id}`)}</option>)}
              </select>
            </label>
            <label>{t("partners.f_name")}<input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>
            <label>{t("partners.f_org")}<input value={org} onChange={(e) => setOrg(e.target.value)} autoComplete="organization" /></label>
            <label>{t("partners.f_message")}<textarea rows={4} value={msg} onChange={(e) => setMsg(e.target.value)} /></label>
            {err && <p className="quiz-bad">{err}</p>}
            <button className="learn-btn" type="submit">{t("partners.f_send")}</button>
            <small className="learn-muted">{t("partners.f_note")}</small>
          </form>
        </div>
      </div>
    </div>
  );
}

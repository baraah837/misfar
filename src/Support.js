// src/Support.js – help & support: FAQ, open chatbot, contact by email
import React, { useState } from "react";
import { FaLifeRing, FaComments } from "react-icons/fa";
import { useLang } from "./i18n/LanguageContext";
import { mailtoLink } from "./config";

const TOPICS = ["tech", "account", "content", "feedback", "other"];

export default function Support() {
  const { t } = useLang();
  const [topic, setTopic] = useState("tech");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [openQ, setOpenQ] = useState(1);

  const send = (e) => {
    e.preventDefault();
    if (!msg.trim()) { setErr(t("support.c_required")); return; }
    setErr("");
    const label = t(`support.topic_${topic}`);
    const device = typeof navigator !== "undefined" ? navigator.userAgent : "";
    window.location.href = mailtoLink(t("support.mail_subject", { topic: label }), `${msg.trim()}\n\n---\n${device}`);
  };

  return (
    <div className="learn-page page-transition">
      <div className="learn-wrap">
        <header className="learn-hero">
          <FaLifeRing className="learn-hero-icon" />
          <h1>{t("support.title")}</h1>
          <p>{t("support.subtitle")}</p>
        </header>

        <div className="two-col">
          <section className="learn-card">
            <h3><FaComments /> {t("support.chat_title")}</h3>
            <p>{t("support.chat_body")}</p>
            <button className="learn-btn" onClick={() => window.dispatchEvent(new Event("misfar:open-chat"))}>{t("support.chat_btn")}</button>
          </section>

          <form className="learn-card form" onSubmit={send}>
            <h3>{t("support.contact_title")}</h3>
            <label>{t("support.c_topic")}
              <select value={topic} onChange={(e) => setTopic(e.target.value)}>
                {TOPICS.map((k) => <option key={k} value={k}>{t(`support.topic_${k}`)}</option>)}
              </select>
            </label>
            <label>{t("support.c_message")}<textarea rows={4} value={msg} onChange={(e) => setMsg(e.target.value)} /></label>
            {err && <p className="quiz-bad">{err}</p>}
            <button className="learn-btn" type="submit">{t("support.c_send")}</button>
            <small className="learn-muted">{t("support.c_note")}</small>
          </form>
        </div>

        <h2 className="learn-h2">{t("support.faq")}</h2>
        <div className="faq">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className={`faq-item ${openQ === n ? "open" : ""}`}>
              <button onClick={() => setOpenQ(openQ === n ? 0 : n)} aria-expanded={openQ === n}>{t(`support.q${n}`)}<span>{openQ === n ? "−" : "+"}</span></button>
              {openQ === n && <p>{t(`support.a${n}`)}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

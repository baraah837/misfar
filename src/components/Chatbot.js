// src/components/Chatbot.js – floating chatbot widget (responsive, AR/EN UI)
import React, { useState, useRef, useEffect } from "react";
import { chatbotAPI } from "../services/api";
import { useLang } from "../i18n/LanguageContext";

// The label is translated for the UI; the text actually sent to the server stays English
// because the current chatbot backend understands English keywords only.
const QUICK_REPLIES = [
  { key: "chat.q1", send: "Best places to visit in Oman?" },
  { key: "chat.q2", send: "What's the weather like?" },
  { key: "chat.q3", send: "Help me plan a trip" },
  { key: "chat.q4", send: "Restaurants in Muscat" },
  { key: "chat.q5", send: "How to get to Nizwa?" },
];

function Chatbot() {
  const { t, locale, lang } = useLang();
  const timeNow = () => new Date().toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: "bot", key: "chat.welcome", time: timeNow() }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // let other pages (Support) open the chat
  useEffect(() => {
    const openChat = () => setOpen(true);
    window.addEventListener("misfar:open-chat", openChat);
    return () => window.removeEventListener("misfar:open-chat", openChat);
  }, []);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 100);
    }
  }, [open, messages]);

  // full-screen sheet on phones: stop the page behind from scrolling
  useEffect(() => {
    const phone = window.matchMedia("(max-width: 767px)").matches;
    if (open && phone) {
      document.body.classList.add("chat-open");
      return () => document.body.classList.remove("chat-open");
    }
  }, [open]);

  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: trimmed, time: timeNow() }]);
    setLoading(true);
    try {
      const res = await chatbotAPI.sendMessage(trimmed, conversationId);
      if (res.success) {
        if (res.data.conversation_id) setConversationId(res.data.conversation_id);
        setMessages((prev) => [...prev, { role: "bot", text: res.data.reply, time: timeNow() }]);
        if (!open) setUnread((u) => u + 1);
      } else {
        setMessages((prev) => [...prev, { role: "bot", key: "chat.err_connect", time: timeNow() }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "bot", key: "chat.err_trouble", time: timeNow() }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus?.();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <>
      <button
        className={`mf-chat-fab ${open ? "is-open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        title={t("chat.open")}
        aria-label={open ? t("chat.close") : t("chat.open")}
        aria-expanded={open}
      >
        {open ? "✕" : "💬"}
        {!open && unread > 0 && <span className="mf-chat-unread">{unread}</span>}
      </button>

      {open && (
        <section className="mf-chat" role="dialog" aria-label={t("chat.title")}>
          <header className="mf-chat-head">
            <div className="mf-chat-avatar">🤖</div>
            <div className="mf-chat-head-text">
              <div className="mf-chat-title">{t("chat.title")}</div>
              <div className="mf-chat-status"><span className="mf-dot" />{t("chat.online")}</div>
            </div>
            <button className="mf-chat-close" onClick={() => setOpen(false)} aria-label={t("chat.close")}>✕</button>
          </header>

          <div className="mf-chat-body">
            {lang === "ar" && <div className="mf-chat-note">{t("chat.lang_note")}</div>}
            {messages.map((msg, i) => (
              <div key={i} className={`mf-chat-row ${msg.role}`}>
                <div className="mf-chat-line">
                  <span className="mf-chat-who">{msg.role === "bot" ? "🤖" : "👤"}</span>
                  <div className={`mf-chat-bubble ${msg.role}`} dir="auto">{msg.key ? t(msg.key) : msg.text}</div>
                </div>
                <span className="mf-chat-time">{msg.time}</span>
              </div>
            ))}
            {loading && (
              <div className="mf-chat-row bot">
                <div className="mf-chat-line"><span className="mf-chat-who">🤖</span><div className="mf-chat-bubble bot">···</div></div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {messages.length <= 2 && (
            <div className="mf-chat-quick">
              {QUICK_REPLIES.map((q) => (
                <button key={q.key} onClick={() => sendMessage(q.send)}>{t(q.key)}</button>
              ))}
            </div>
          )}

          <div className="mf-chat-input">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("chat.placeholder")}
              disabled={loading}
              dir="auto"
              aria-label={t("chat.placeholder")}
            />
            <button className="mf-chat-send" onClick={() => sendMessage()} disabled={loading || !input.trim()} aria-label={t("common.send")}>➤</button>
          </div>
        </section>
      )}
    </>
  );
}
export default Chatbot;

// src/Login.js
import React, { useState, useEffect } from "react";
import "./styles/Login.css";
import img1 from "./Images/home1.jpg";
import img2 from "./Images/home2.png";
import misfarLogo from "./Images/logo/logo.png";
import { authAPI } from "./services/api";
import { useLang } from "./i18n/LanguageContext";
import LanguageSwitch from "./components/LanguageSwitch";

function Login({ onLogin = () => {}, onGoRegister = () => {} }) {
  const { t } = useLang();
  const images = [img1, img2];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(interval);
  }, [images.length]);

  const handleLogin = async () => {
    setError("");
    if (!email || !password) {
      setError(t("auth.err_credentials"));
      return;
    }
    setLoading(true);
    try {
      const result = await authAPI.login(email, password);
      if (result.success) {
        onLogin(result.data.user);
      } else {
        setError(result.message || t("auth.err_login_failed"));
      }
    } catch (err) {
      setError(t("common.error_connect"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page page-transition">
      <div className="background-slider" style={{ backgroundImage: `url(${images[currentIndex]})` }} />
      <div className="overlay">
        <LanguageSwitch className="auth-lang" />
        <div className="main-card">
          <div className="logo-block">
            <img src={misfarLogo} alt="Misfar logo" className="logo-img" />
          </div>
          <div className="form-card">
            {error && (
              <div style={{ background: "rgba(220,53,69,0.15)", border: "1px solid rgba(220,53,69,0.4)", color: "#ff6b6b", borderRadius: "8px", padding: "10px 14px", marginBottom: "12px", fontSize: "0.85rem", textAlign: "center" }}>
                {error}
              </div>
            )}
            <div className="field">
              <label htmlFor="login-email">{t("auth.email")}</label>
              <input id="login-email" type="email" autoComplete="email" placeholder={t("auth.email")} value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} disabled={loading} />
            </div>
            <div className="field">
              <label htmlFor="login-pw">{t("auth.password")}</label>
              <input id="login-pw" type="password" autoComplete="current-password" placeholder={t("auth.password")} value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} disabled={loading} />
            </div>
            <button className="login-btn" onClick={handleLogin} disabled={loading} style={{ opacity: loading ? 0.7 : 1, cursor: loading ? "wait" : "pointer" }}>
              {loading ? t("auth.logging_in") : t("auth.login")}
            </button>
            <p style={{ marginTop: "12px", fontSize: "0.85rem", textAlign: "center", cursor: "pointer" }} onClick={onGoRegister}>
              {t("auth.no_account")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
export default Login;

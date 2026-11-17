import React, { useState, useEffect } from "react";
import "./styles/Login.css";
import img1 from "./Images/home1.jpg";
import img2 from "./Images/home2.png";
import misfarLogo from "./Images/logo/logo.png";
import { authAPI } from "./services/api";
import { useLang } from "./i18n/LanguageContext";
import LanguageSwitch from "./components/LanguageSwitch";

function Register({ onBackToLogin = () => {}, onRegistered = () => {} }) {
  const { t } = useLang();
  const images = [img1, img2];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [username, setUsername]   = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [rePassword, setRePassword] = useState("");
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(interval);
  }, [images.length]);

  const handleRegister = async () => {
    setError("");
    if (!username || !email || !password || !rePassword) {
      setError(t("auth.err_all_required")); return;
    }
    if (password !== rePassword) {
      setError(t("auth.err_pw_match")); return;
    }
    if (password.length < 8) {
      setError(t("auth.err_pw_len")); return;
    }

    setLoading(true);
    try {
      const result = await authAPI.register(username, email, password);
      if (result.success) {
        // Pass user to App so it logs in immediately
        onRegistered(result.data.user);
      } else {
        if (result.errors) {
          setError(result.errors.map(e => e.msg).join(" "));
        } else {
          setError(result.message || t("auth.err_register_failed"));
        }
      }
    } catch {
      setError(t("common.error_connect"));
    } finally {
      setLoading(false);
    }
  };

  const errStyle = { background:"rgba(220,53,69,0.15)", border:"1px solid rgba(220,53,69,0.4)", color:"#ff6b6b", borderRadius:"8px", padding:"10px 14px", marginBottom:"12px", fontSize:"0.85rem", textAlign:"center" };

  return (
    <div className="login-page page-transition">
      <div className="background-slider" style={{ backgroundImage:`url(${images[currentIndex]})` }} />
      <div className="overlay">
        <LanguageSwitch className="auth-lang" />
        <div className="main-card">
          <div className="logo-block">
            <img src={misfarLogo} alt="Misfar logo" className="logo-img" />
          </div>
          <div className="form-card">
            {error && <div style={errStyle}>{error}</div>}
            <div className="field">
              <label>{t("auth.email")}</label>
              <input type="email" placeholder={t("auth.email")} autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />
            </div>
            <div className="field">
              <label>{t("auth.username")}</label>
              <input type="text" placeholder={t("auth.username")} autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} disabled={loading} />
            </div>
            <div className="field">
              <label>{t("auth.password")}</label>
              <input type="password" placeholder={t("auth.password_min")} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} />
            </div>
            <div className="field">
              <label>{t("auth.repassword")}</label>
              <input type="password" placeholder={t("auth.repassword")} autoComplete="new-password" value={rePassword} onChange={e => setRePassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleRegister()} disabled={loading} />
            </div>
            <button className="login-btn" onClick={handleRegister} disabled={loading} style={{ opacity:loading ? 0.7:1, cursor:loading ? "wait":"pointer" }}>
              {loading ? t("auth.registering") : t("auth.register")}
            </button>
            <p style={{ marginTop:"12px", fontSize:"0.85rem", textAlign:"center", cursor:"pointer" }} onClick={onBackToLogin}>
              {t("auth.have_account")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
export default Register;

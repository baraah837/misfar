// src/Footer.js — fully functional footer
import React, { useState } from "react";
import "./styles/Footer.css";
import { useLang } from "./i18n/LanguageContext";
import LanguageSwitch from "./components/LanguageSwitch";
import { CONTACT_EMAIL, INSTAGRAM_URL } from "./config";
import { FaInfoCircle, FaLock, FaFileAlt, FaEnvelope, FaLinkedinIn, FaInstagram, FaFacebookF, FaTimes } from "react-icons/fa";

// ── Modal component ───────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
         onClick={onClose}>
      <div style={{ background:"white", borderRadius:16, padding:32, maxWidth:560, width:"100%", maxHeight:"85vh", overflowY:"auto", position:"relative" }}
           onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position:"absolute", top:16, insetInlineEnd:16, background:"none", border:"none", cursor:"pointer", fontSize:20, color:"#6b7280" }}><FaTimes /></button>
        <h2 style={{ margin:"0 0 16px", fontSize:20, fontWeight:700, color:"#1f2937" }}>{title}</h2>
        {children}
      </div>
    </div>
  );
}

const modalText = {
  fontSize:13, color:"#374151", lineHeight:1.7
};
const sub = { fontSize:15, fontWeight:700, color:"#1f2937", margin:"16px 0 6px" };

function Footer({ onNavigate = () => {}, onBrowse = () => {} }) {
  const { t } = useLang();
  const [modal, setModal] = useState(null); // 'privacy' | 'terms' | 'contact'
  const link = (label, action) => (
    <li key={label} className="footer-link" onClick={action} style={{ cursor: action ? "pointer" : "default" }}>{label}</li>
  );

  return (
    <>
      <footer className="site-footer">
        <div className="footer-shell">
          <div className="footer-inner">
            <div className="footer-column">
              <div className="footer-logo-text">Mis<span>far</span></div>
              <p>{t("footer.about")}</p>
              <div className="footer-social-row">
                <div className="footer-social-icon" title={t("footer.email")} role="button" tabIndex={0} onClick={() => setModal("contact")} style={{ cursor:"pointer" }}><FaEnvelope /></div>
                <div className="footer-social-icon" title="LinkedIn"><FaLinkedinIn /></div>
                <div className="footer-social-icon" title="Instagram" role="button" tabIndex={0} style={{ cursor:"pointer" }} onClick={() => window.open(INSTAGRAM_URL, "_blank", "noopener")}><FaInstagram /></div>
                <div className="footer-social-icon" title="Facebook"><FaFacebookF /></div>
              </div>
            </div>

            <div className="footer-column">
              <h3>{t("footer.explore")}</h3>
              <ul>
                {link(t("nav.destinations"), () => onNavigate("destinations"))}
                {link(t("nav.ai_trip"), () => onNavigate("aiTrip"))}
                {link(t("nav.activities"), () => onNavigate("activities"))}
                {link(t("nav.learn"), () => onNavigate("learn"))}
                {link(t("footer.beaches"), () => onBrowse({ category: "Beach" }))}
                {link(t("footer.historic"), () => onBrowse({ category: "Historic" }))}
                {link(t("footer.mountains"), () => onBrowse({ search: "Jabal" }))}
                {link(t("footer.desert"), () => onBrowse({ category: "Adventure" }))}
              </ul>
            </div>

            <div className="footer-column">
              <h3>{t("footer.features")}</h3>
              <ul>
                {link(t("footer.f_planning"), () => onNavigate("aiTrip"))}
                {link(t("footer.f_recs"), () => onNavigate("home"))}
                {link(t("footer.f_reviews"), () => onNavigate("destinations"))}
                {link(t("footer.f_chatbot"), () => window.dispatchEvent(new Event("misfar:open-chat")))}
                {link(t("footer.f_maps"), () => onNavigate("destinations"))}
                {link(t("footer.f_learn"), () => onNavigate("learn"))}
              </ul>
            </div>

            <div className="footer-column">
              <h3>{t("footer.contact")}</h3>
              <div className="footer-contact-block">
                <div className="footer-contact-row" onClick={() => setModal("contact")} style={{ cursor:"pointer" }}>
                  <FaEnvelope className="footer-contact-icon" />
                  <span dir="ltr">{CONTACT_EMAIL}</span>
                </div>
              </div>
              <div className="footer-divider" />
              <ul className="footer-support-links">
                <li className="footer-link" onClick={() => onNavigate("support")} style={{ cursor:"pointer" }}><FaInfoCircle className="footer-small-icon" /> {t("footer.help")}</li>
                <li className="footer-link" onClick={() => onNavigate("partners")} style={{ cursor:"pointer" }}><FaInfoCircle className="footer-small-icon" /> {t("footer.partners")}</li>
                <li className="footer-link" onClick={() => setModal("privacy")} style={{ cursor:"pointer" }}><FaLock className="footer-small-icon" /> {t("footer.privacy")}</li>
                <li className="footer-link" onClick={() => setModal("terms")} style={{ cursor:"pointer" }}><FaFileAlt className="footer-small-icon" /> {t("footer.terms")}</li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <span className="footer-bottom-text">{t("footer.rights")}</span>
            <div className="footer-lang-switch"><span>🌍</span><LanguageSwitch compact /></div>
          </div>
        </div>
      </footer>

      {/* ── Modals ── */}
      {modal === "privacy" && (
        <Modal title={`🔒 ${t("footer.privacy")}`} onClose={() => setModal(null)}>
          <p style={{ ...modalText, color:"#6b7280", marginBottom:12 }}>{t("footer.last_updated")}</p>
          <p style={sub}>Information We Collect</p>
          <p style={modalText}>We collect your name, email address, profile photo (optional), location, and travel preferences when you register. We also collect usage data such as destinations you view and trips you create.</p>
          <p style={sub}>How We Use Your Information</p>
          <p style={modalText}>Your data is used to personalize recommendations, generate AI itineraries based on your interests and budget, and improve the platform experience. We do not sell your personal data to third parties.</p>
          <p style={sub}>Data Security</p>
          <p style={modalText}>Passwords are hashed using bcrypt and never stored in plain text. All API communication uses JWT authentication. Your data is stored in a secure cloud PostgreSQL database (Neon.tech).</p>
          <p style={sub}>Your Rights</p>
          <p style={modalText}>You may update or delete your profile at any time. Contact {CONTACT_EMAIL} to request complete data deletion.</p>
        </Modal>
      )}

      {modal === "terms" && (
        <Modal title={`📄 ${t("footer.terms")}`} onClose={() => setModal(null)}>
          <p style={{ ...modalText, color:"#6b7280", marginBottom:12 }}>{t("footer.last_updated")}</p>
          <p style={sub}>Acceptance of Terms</p>
          <p style={modalText}>By using Misfar, you agree to these terms. The platform is provided for personal, non-commercial use to explore tourist destinations in Oman.</p>
          <p style={sub}>User Conduct</p>
          <p style={modalText}>You agree not to submit false reviews, misuse the chatbot, or attempt to gain unauthorized access to admin features. Accounts found in violation may be suspended.</p>
          <p style={sub}>Content</p>
          <p style={modalText}>Reviews submitted by users are moderated before publication. Misfar reserves the right to reject or remove content that is inappropriate, offensive, or misleading.</p>
          <p style={sub}>Limitation of Liability</p>
          <p style={modalText}>Misfar provides destination information for guidance only. We are not responsible for changes in opening hours, entry fees, or conditions at any location. Always verify locally before visiting.</p>
          <p style={sub}>Changes to Terms</p>
          <p style={modalText}>We may update these terms periodically. Continued use of the platform constitutes acceptance of the updated terms.</p>
        </Modal>
      )}

      {modal === "contact" && (
        <Modal title={`✉ ${t("footer.modal_contact")}`} onClose={() => setModal(null)}>
          <p style={modalText}>{t("footer.contact_intro")}</p>
          <p style={sub}>{t("footer.email")}</p>
          <p style={modalText}><a href={`mailto:${CONTACT_EMAIL}?subject=Misfar Support Request`} style={{ color: "#c94f3d", textDecoration: "underline" }}>{CONTACT_EMAIL}</a></p>
          <p style={sub}>{t("footer.university")}</p>
          <p style={modalText}>University of Technology and Applied Sciences – Ibri<br />Department of Information Technology<br />Course: CSSE4102</p>
          <p style={sub}>{t("footer.team")}</p>
          <p style={modalText}>
            Imaduddin Said Juwaia Al Naeemi<br />
            Baraah Mohammed Said Al Alawia<br />
            Al Yamama Khalifa Hamed Al Majarfi<br />
            Saif Awadh Mohammed Al Saadi
          </p>
          <p style={sub}>{t("footer.supervisor")}</p>
          <p style={modalText}>Dr. Ayoub Al Badawi</p>
        </Modal>
      )}
    </>
  );
}
export default Footer;

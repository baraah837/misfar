// src/Navbar.js – responsive navbar: desktop links, mobile drawer + bottom tab bar, AR/EN switch
import React, { useState, useEffect, useRef, useCallback } from "react";
import logo2 from "./Images/logo/logo2.png";
import {
  FaUserCircle, FaShieldAlt, FaBell, FaBars, FaTimes, FaHome, FaMapMarkedAlt,
  FaRobot, FaGraduationCap, FaCalendarAlt, FaTags, FaHandshake, FaLifeRing,
  FaDownload, FaChevronDown, FaHotel, FaCalendarCheck, FaCrown, FaStore,
} from "react-icons/fa";
import "./styles/Navbar.css";
import "./styles/NavbarV2.css";
import { getUser, getToken } from "./services/api";
import { fetchNotifications, markNotificationRead } from "./services/notificationsClient";
import { resolveMediaUrl } from "./config";
import { useLang } from "./i18n/LanguageContext";
import LanguageSwitch from "./components/LanguageSwitch";
import { usePWAInstall } from "./components/pwa";

const PRIMARY = [
  { page: "home",         key: "nav.home",         Icon: FaHome },
  { page: "destinations", key: "nav.destinations", Icon: FaMapMarkedAlt },
  { page: "aiTrip",       key: "nav.ai_trip",      Icon: FaRobot },
  { page: "learn",        key: "nav.learn",        Icon: FaGraduationCap },
  { page: "activities",   key: "nav.activities",   Icon: FaCalendarAlt },
];
const SECONDARY = [
  { page: "directory", key: "nav.directory", Icon: FaHotel },
  { page: "bookings",  key: "nav.bookings",  Icon: FaCalendarCheck },
  { page: "premium",   key: "nav.premium",   Icon: FaCrown },
  { page: "business",  key: "nav.business",  Icon: FaStore },
  { page: "offers",   key: "nav.offers",   Icon: FaTags },
  { page: "partners", key: "nav.partners", Icon: FaHandshake },
  { page: "support",  key: "nav.support",  Icon: FaLifeRing },
];
// pages that should highlight their parent tab
const PARENT = { destinationDetails: "destinations", tripBuilder: "destinations", editProfile: "profile" };

function Navbar({ onNavigate, currentPage }) {
  const { t, locale } = useLang();
  const user = getUser();
  const isAdmin = user?.role === "admin";
  const active = PARENT[currentPage] || currentPage;
  const { canInstall, promptInstall } = usePWAInstall();

  const [notifs, setNotifs] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const bellRef = useRef(null);
  const moreRef = useRef(null);

  useEffect(() => {
    if (!getToken()) return;
    fetchNotifications()
      .then((res) => { if (res.success) setNotifs(res.data || []); })
      .catch(() => {});
  }, [currentPage]);

  // close popovers on outside click / Escape
  useEffect(() => {
    const onDown = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setShowNotifs(false);
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") { setShowNotifs(false); setMoreOpen(false); setDrawerOpen(false); } };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown, { passive: true });
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // lock page scroll while the drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const go = useCallback((page) => {
    setDrawerOpen(false); setMoreOpen(false); setShowNotifs(false);
    onNavigate(page);
  }, [onNavigate]);

  const unreadCount = notifs.filter((n) => !n.is_read).length;
  const handleMarkRead = async (id) => {
    try { await markNotificationRead(id); } catch {}
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };
  const handleMarkAllRead = async () => {
    await Promise.all(notifs.filter((n) => !n.is_read).map((n) => markNotificationRead(n.id).catch(() => {})));
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const photo = user?.photo || resolveMediaUrl(user?.photo_url);
  const moreActive = SECONDARY.some((s) => s.page === active);

  const renderLink = (page, label) => (
    <a
      key={page}
      href={`#${page}`}
      className={active === page ? "active" : ""}
      aria-current={active === page ? "page" : undefined}
      onClick={(e) => { e.preventDefault(); go(page); }}
    >
      {label}
    </a>
  );

  // reserve space for the mobile bottom tab bar while the navbar is on screen
  useEffect(() => {
    document.body.classList.add("has-tabbar");
    return () => document.body.classList.remove("has-tabbar");
  }, []);

  return (
    <>
      <header className="mf-header">
        <div className="mf-header-inner">
          {/* hamburger (mobile / tablet) */}
          <button className="mf-icon-btn mf-burger" onClick={() => setDrawerOpen(true)} aria-label={t("nav.menu")} aria-expanded={drawerOpen}>
            <FaBars />
          </button>

          <button className="mf-logo" onClick={() => go("home")} aria-label="Misfar">
            <img src={logo2} alt="Misfar" className="navbar-logo" />
          </button>

          {/* desktop links */}
          <nav className="mf-links" aria-label={t("nav.main")}>
            {PRIMARY.map(({ page, key }) => renderLink(page, t(key)))}
            <div className="mf-more" ref={moreRef}>
              <button className={`mf-more-btn ${moreActive ? "active" : ""}`} onClick={() => setMoreOpen((v) => !v)} aria-expanded={moreOpen}>
                {t("nav.more")} <FaChevronDown size={11} />
              </button>
              {moreOpen && (
                <div className="mf-more-menu">
                  {SECONDARY.map(({ page, key, Icon }) => (
                    <button key={page} className={active === page ? "active" : ""} onClick={() => go(page)}>
                      <Icon /> {t(key)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {isAdmin && (
              <a href="#admin" className="mf-admin-link" onClick={(e) => { e.preventDefault(); go("admin"); }}>
                <FaShieldAlt /> {t("nav.admin")}
              </a>
            )}
          </nav>

          {/* right side */}
          <div className="mf-actions">
            <LanguageSwitch compact className="mf-lang-desktop" />
            {canInstall && (
              <button className="mf-icon-btn mf-install-desktop" onClick={promptInstall} title={t("nav.install")} aria-label={t("nav.install")}>
                <FaDownload />
              </button>
            )}

            {getToken() && (
              <div ref={bellRef} className="mf-bell-wrap">
                <button className="mf-icon-btn mf-bell" onClick={() => setShowNotifs((v) => !v)} aria-label={t("nav.notifications")}>
                  <FaBell />
                  {unreadCount > 0 && <span className="mf-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
                </button>
                {showNotifs && (
                  <div className="mf-notif-panel" role="dialog" aria-label={t("nav.notifications")}>
                    <div className="mf-notif-head">
                      <span>🔔 {t("nav.notifications")}</span>
                      {unreadCount > 0 && <button onClick={handleMarkAllRead}>{t("nav.mark_all_read")}</button>}
                    </div>
                    <div className="mf-notif-list">
                      {notifs.length === 0 ? (
                        <p className="mf-notif-empty">{t("nav.no_notifications")}</p>
                      ) : (
                        notifs.map((n) => (
                          <div key={n.id} className={`mf-notif ${n.is_read ? "" : "unread"}`} onClick={() => handleMarkRead(n.id)}>
                            <div className="mf-notif-title">{n.title}</div>
                            <div className="mf-notif-msg">{n.message}</div>
                            <div className="mf-notif-time">
                              {n.sent_at ? new Date(n.sent_at).toLocaleDateString(locale, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <button className="mf-notif-all" onClick={() => go("offers")}>{t("nav.offers")} →</button>
                  </div>
                )}
              </div>
            )}

            <button
              className={`nav-profile mf-profile ${active === "profile" ? "active-profile" : ""}`}
              onClick={() => go("profile")}
              aria-label={t("nav.profile")}
            >
              {photo ? <img src={photo} alt="" className="user-icon nav-user-photo" /> : <FaUserCircle className="user-icon" />}
            </button>
          </div>
        </div>
      </header>

      {/* drawer */}
      <div className={`mf-drawer-backdrop ${drawerOpen ? "open" : ""}`} onClick={() => setDrawerOpen(false)} aria-hidden={!drawerOpen} />
      <aside className={`mf-drawer ${drawerOpen ? "open" : ""}`} aria-hidden={!drawerOpen} aria-label={t("nav.menu")}>
        <div className="mf-drawer-head">
          <img src={logo2} alt="Misfar" className="navbar-logo" />
          <button className="mf-icon-btn" onClick={() => setDrawerOpen(false)} aria-label={t("common.close")}><FaTimes /></button>
        </div>
        <p className="mf-drawer-tagline">{t("brand.tagline")}</p>
        <nav className="mf-drawer-nav">
          {[...PRIMARY, ...SECONDARY, { page: "profile", key: "nav.profile", Icon: FaUserCircle }].map(({ page, key, Icon }) => (
            <button key={page} className={active === page ? "active" : ""} onClick={() => go(page)}>
              <Icon /> <span>{t(key)}</span>
            </button>
          ))}
          {isAdmin && (
            <button className="admin" onClick={() => go("admin")}><FaShieldAlt /> <span>{t("nav.admin")}</span></button>
          )}
        </nav>
        <div className="mf-drawer-foot">
          <LanguageSwitch />
          {canInstall && (
            <button className="mf-install-btn" onClick={promptInstall}><FaDownload /> {t("nav.install")}</button>
          )}
        </div>
      </aside>

      {/* mobile bottom tab bar */}
      <nav className="mf-tabbar" aria-label={t("nav.main")}>
        {[PRIMARY[0], PRIMARY[1], PRIMARY[2], PRIMARY[3]].map(({ page, key, Icon }) => (
          <button key={page} className={active === page ? "active" : ""} onClick={() => go(page)}>
            <Icon />
            <span>{page === "aiTrip" ? t("nav.ai_trip_short") : t(key)}</span>
          </button>
        ))}
        <button className={active === "profile" ? "active" : ""} onClick={() => go("profile")}>
          <FaUserCircle />
          <span>{t("nav.profile")}</span>
        </button>
      </nav>
    </>
  );
}
export default Navbar;

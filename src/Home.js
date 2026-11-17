import React, { useState, useEffect } from "react";
import "./styles/Home.css";
// الخلفية الواحدة فقط
import homeTop from "./Images/home2.png";
import { FaStar, FaGraduationCap, FaRobot, FaCalendarAlt, FaTags, FaLifeRing, FaShieldAlt, FaHotel, FaCrown } from "react-icons/fa";
import { FiSearch } from "react-icons/fi";
import { destinationsAPI, recommendationsAPI, getToken } from "./services/api";
import { fetchTrending } from "./services/notificationsClient";
import { DESTINATIONS, mapApiDestination, Stars } from "./Destinations";
import { useLang } from "./i18n/LanguageContext";
import AdSlot from "./components/AdSlot";

// Horizontal, swipeable row of destination cards (recommended / trending)
function DestRail({ items, onOpen, tv, t }) {
  return (
    <div className="home-rail" role="list">
      {items.map((d) => (
        <button key={d.id} role="listitem" className="rail-card" onClick={() => onOpen(d)}>
          <img src={d.image} alt={tv(d.name)} loading="lazy" />
          <div className="rail-info">
            <strong>{tv(d.name)}</strong>
            <span className="rail-area">{tv(d.area)}</span>
            <span className="rail-meta">
              {d.category && <em>{tv(d.category)}</em>}
              {d.rating > 0 && <span className="rail-stars"><FaStar /> {d.rating.toFixed(1)}</span>}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

function Home({ onNavigate, onOpenDestination, onSearchDestination }) {
  const { t, tv } = useLang();
  const [searchTerm, setSearchTerm] = useState("");
  const [popular, setPopular] = useState(DESTINATIONS.slice(0, 3));
  const [recs, setRecs] = useState([]);
  const [trending, setTrending] = useState([]);

  useEffect(() => {
    let alive = true;
    destinationsAPI.getAll({ limit: 3 })
      .then((res) => { if (alive && res.success && res.data?.length) setPopular(res.data.slice(0, 3).map(mapApiDestination)); })
      .catch(() => {});
    if (getToken()) {
      recommendationsAPI.get()
        .then((res) => { if (alive && res.success && res.data?.length) setRecs(res.data.slice(0, 8).map(mapApiDestination)); })
        .catch(() => {});
    }
    fetchTrending()
      .then((res) => { if (alive && res.success && res.data?.length) setTrending(res.data.slice(0, 6).map(mapApiDestination)); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const handleSearchClick = () => onSearchDestination && onSearchDestination(searchTerm);
  const open = (d) => onOpenDestination && onOpenDestination(d);

  const features = [
    { page: "learn",      Icon: FaGraduationCap, title: t("home.feat_learn"),   body: t("home.feat_learn_d") },
    { page: "aiTrip",     Icon: FaRobot,         title: t("home.feat_ai"),      body: t("home.feat_ai_d") },
    { page: "activities", Icon: FaCalendarAlt,   title: t("home.feat_events"),  body: t("home.feat_events_d") },
    { page: "directory",  Icon: FaHotel,         title: t("home.feat_stay"),    body: t("home.feat_stay_d") },
    { page: "premium",    Icon: FaCrown,         title: t("home.feat_premium"), body: t("home.feat_premium_d") },
    { page: "offers",     Icon: FaTags,          title: t("home.feat_offers"),  body: t("home.feat_offers_d") },
    { page: "support",    Icon: FaLifeRing,      title: t("home.feat_support"), body: t("home.feat_support_d") },
    { page: "destinations", Icon: FaShieldAlt,   title: t("home.feat_local"),   body: t("home.feat_local_d") },
  ];

  return (
    <div className="home-page page-transition" style={{ backgroundImage: `url(${homeTop})` }}>
      {/* ========= الجزء العلوي ========= */}
      <div className="home-top">
        <div className="home-top-overlay">
          {/* HERO */}
          <section id="home" className="hero-section">
            <h1 className="hero-title">{t("home.hero_title")}</h1>
            <p className="hero-subtitle">{t("home.hero_sub")}</p>
            <p className="hero-tagline">{t("brand.tagline")}</p>
            <div className="hero-buttons">
              <button className="btn-primary" onClick={() => onNavigate && onNavigate("destinations")}>{t("home.explore")}</button>
              <button className="btn-secondary" onClick={() => onNavigate && onNavigate("aiTrip")}>{t("home.generate")}</button>
            </div>
          </section>
        </div>
      </div>

      {/* ========= الجزء السفلي ========= */}
      <div className="home-bottom">
        <div className="home-bottom-overlay">
          {/* POPULAR DESTINATIONS */}
          <section id="destinations" className="popular-section">
            <div className="popular-inner">
              <h2 className="section-title">{t("home.popular")}</h2>
              <div className="search-bar">
                <FiSearch className="search-icon" />
                <input
                  type="search"
                  placeholder={t("home.search_ph")}
                  aria-label={t("home.search_ph")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSearchClick(); }}
                />
                <button className="search-btn" onClick={handleSearchClick}>{t("common.search")}</button>
              </div>

              <div className="dest-cards-row">
                {popular.map((d) => (
                  <div className="dest-card" key={d.id}>
                    <img src={d.image} alt={tv(d.name)} />
                    <div className="dest-info">
                      <h3>{tv(d.name)}</h3>
                      <div className="rating"><Stars rating={d.rating || 5} /></div>
                      <button className="view-btn" onClick={() => open(d)}>{t("common.view_details")}</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="popular-section"><div className="popular-inner"><AdSlot placement="home" /></div></section>

          {/* RECOMMENDED FOR YOU (existing /recommendations endpoint) */}
          {recs.length > 0 && (
            <section className="popular-section">
              <div className="popular-inner home-panel">
                <h2 className="panel-title">✨ {t("home.recommended")}</h2>
                <p className="panel-sub">{t("home.recommended_sub")}</p>
                <DestRail items={recs} onOpen={open} tv={tv} t={t} />
              </div>
            </section>
          )}

          {/* TRENDING (existing /recommendations/trending endpoint) */}
          {trending.length > 0 && (
            <section className="popular-section">
              <div className="popular-inner home-panel">
                <h2 className="panel-title">🔥 {t("home.trending")}</h2>
                <p className="panel-sub">{t("home.trending_sub")}</p>
                <DestRail items={trending} onOpen={open} tv={tv} t={t} />
              </div>
            </section>
          )}

          {/* WHAT MISFAR OFFERS */}
          <section className="popular-section">
            <div className="popular-inner home-panel">
              <h2 className="panel-title">{t("home.features_title")}</h2>
              <div className="feature-grid">
                {features.map(({ page, Icon, title, body }) => (
                  <button key={page + title} className="feature-tile" onClick={() => onNavigate && onNavigate(page)}>
                    <span className="feature-icon"><Icon /></span>
                    <strong>{title}</strong>
                    <span>{body}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section id="ai-trip" className="guarantee-section">
            <div className="guarantee-panel">
              <h2 className="guarantee-title">
                {t("home.guarantee_pre")}<span>{t("home.guarantee_word")}</span>
              </h2>
              <div className="guarantee-content">
                <div className="guarantee-left">
                  <ul>
                    <li><span className="icon-bullet"></span>{t("home.g1")}</li>
                    <li><span className="icon-bullet"></span>{t("home.g2")}</li>
                    <li><span className="icon-bullet"></span>{t("home.g3")}</li>
                    <li><span className="icon-bullet"></span>{t("home.g4")}</li>
                  </ul>
                </div>
                <div className="middle-line" />
                <div className="guarantee-right">
                  <div className="testimonial-card" dir="ltr">
                    <div className="testimonial-header">
                      <span className="name">Salim Al-Saady</span>
                      <span className="stars"><FaStar /><FaStar /><FaStar /><FaStar /><FaStar /></span>
                    </div>
                    <p className="testimonial-text">
                      I recently used Misfar to plan my trip to Nizwa and it made everything so easy. The AI trip planner suggested places I didn&apos;t even know about, and the itinerary was well organized. The interface is clean and very easy to use. I especially liked the bilingual support.
                      <br />
                      Highly recommended for anyone travelling in Oman!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* PARTNER CTA */}
          <section className="popular-section">
            <div className="popular-inner partner-cta">
              <div>
                <h2>{t("home.partner_cta_title")}</h2>
                <p>{t("home.partner_cta_body")}</p>
              </div>
              <button className="btn-primary" onClick={() => onNavigate && onNavigate("partners")}>{t("home.partner_cta_btn")}</button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
export default Home;

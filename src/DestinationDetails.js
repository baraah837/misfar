// src/DestinationDetails.js
import React, { useState, useEffect } from "react";
import "./styles/Destinations.css";
import homeTop from "./Images/home1.jpg";
import { FaArrowLeft, FaHeart, FaRegHeart, FaUserCircle, FaThumbsUp } from "react-icons/fa";
import { destinationsAPI, userAPI, getUser } from "./services/api";
import { resolveMediaUrl } from "./config";
import { useLang } from "./i18n/LanguageContext";
import AdSlot from "./components/AdSlot";
import { Stars } from "./Destinations";

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          style={{ fontSize: 24, cursor: "pointer", color: star <= (hovered || value) ? "#f97316" : "#d1d5db", transition: "color 0.15s" }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function DestinationDetails({ destination, onBack = () => {}, onNavigate = () => {}, onStartTrip = () => {} }) {
  const { t, tv, locale } = useLang();
  const [activeTab, setActiveTab]   = useState("overview");
  const [reviews, setReviews]       = useState([]);
  const [stats, setStats]           = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Write review
  const [rating, setRating]         = useState(0);
  const [comment, setComment]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg]   = useState("");

  // Like / bookmark
  const [liked, setLiked]           = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  // Review likes (local state — tracks which review IDs user has liked)
  const [likedReviews, setLikedReviews] = useState(new Set());

  const currentUser = getUser();

  // ── Load reviews when tab opens ──────────────────────────
  useEffect(() => {
    if (activeTab === "reviews" && destination?.id) {
      fetchReviews();
    }
  }, [activeTab, destination?.id]);

  const fetchReviews = async () => {
    setLoadingReviews(true);
    try {
      const res = await destinationsAPI.getReviews(destination.id);
      if (res.success) {
        setReviews(res.data);
        setStats(res.stats);
      }
    } catch {/* silently fail */}
    finally { setLoadingReviews(false); }
  };

  // ── Submit review ────────────────────────────────────────
  const handleSubmitReview = async () => {
    if (!currentUser) { setSubmitMsg(t("det.login_to_review")); return; }
    if (rating === 0)  { setSubmitMsg(t("det.pick_rating")); return; }
    if (!comment.trim()) { setSubmitMsg(t("det.write_comment")); return; }

    setSubmitting(true); setSubmitMsg("");
    try {
      const res = await destinationsAPI.addReview(destination.id, rating, comment.trim());
      if (res.success) {
        setSubmitMsg(t("det.review_ok"));
        setRating(0); setComment("");
        // Optimistically add to list
        setReviews(prev => [{
          id: Date.now(),
          rating,
          comment: comment.trim(),
          username: currentUser.username,
          user_photo: currentUser.photo_url,
          created_at: new Date().toISOString(),
          sentiment_label: "positive",
        }, ...prev]);
      } else {
        setSubmitMsg(res.message || t("det.review_fail"));
      }
    } catch { setSubmitMsg(t("common.error_connect")); }
    finally { setSubmitting(false); }
  };

  // ── Like destination (bookmark) ──────────────────────────
  const handleToggleLike = async () => {
    if (!currentUser) { alert(t("det.login_to_save")); return; }
    setLikeLoading(true);
    try {
      if (liked) {
        await userAPI.removeBookmark(destination.id);
        setLiked(false);
      } else {
        await userAPI.addBookmark(destination.id);
        setLiked(true);
      }
    } catch {/* ignore */}
    finally { setLikeLoading(false); }
  };

  // ── Like a review (local only) ───────────────────────────
  const handleLikeReview = (reviewId) => {
    setLikedReviews(prev => {
      const next = new Set(prev);
      next.has(reviewId) ? next.delete(reviewId) : next.add(reviewId);
      return next;
    });
  };

  if (!destination) {
    return (
      <div className="destinations-page">
        <div className="dest-main-overlay">
          <p style={{ padding: "40px", color: "white" }}>{t("det.no_selected")}</p>
        </div>
      </div>
    );
  }

  const avgRating = stats ? parseFloat(stats.avg_rating || 0).toFixed(1) : destination.rating;

  return (
    <div className="destinations-page page-transition">
      <div className="dest-bg" style={{ backgroundImage: `url(${homeTop})` }} />
      <div className="dest-main-overlay">
        <button className="back-icon-btn" onClick={onBack}><FaArrowLeft /></button>

        <section className="dest-detail-section">
          <div className="dest-detail-card">
            <div className="dest-detail-left">
              <img src={destination.image} alt={tv(destination.name)} className="dest-detail-main-img" />
            </div>
            <div className="dest-detail-right">
              <h2 className="dest-detail-title">{tv(destination.name)}</h2>
              <p className="dest-detail-area">{tv(destination.area)}</p>

              {/* Stars + avg rating */}
              <div className="dest-detail-stars" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Stars rating={parseFloat(avgRating) || destination.rating || 0} />
                {stats && <span style={{ fontSize: 13, color: "#6b7280", marginInlineStart: 4 }}>{avgRating} ({stats.total} {t("det.reviews_word")})</span>}
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
                <button className="start-trip-btn" onClick={() => onStartTrip(destination)}>
                  {t("det.start_trip")}
                </button>
                <button
                  onClick={handleToggleLike}
                  disabled={likeLoading}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "10px 20px", borderRadius: 999, border: "none", cursor: "pointer",
                    background: liked ? "#fee2e2" : "rgba(255,255,255,0.9)",
                    color: liked ? "#ef4444" : "#6b7280",
                    fontWeight: 600, fontSize: 14,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    transition: "all 0.2s",
                  }}
                >
                  {liked ? <FaHeart color="#ef4444" /> : <FaRegHeart />}
                  {liked ? t("common.saved") : t("common.save")}
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="dest-tabs">
            {["overview", "reviews", "location"].map(tab => (
              <button
                key={tab}
                className={"dest-tab-btn" + (activeTab === tab ? " active" : "")}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "overview" ? t("det.tab_overview") : tab === "reviews" ? `${t("det.tab_reviews")} ${stats ? `(${stats.total})` : ""}` : t("det.tab_location")}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="dest-tab-content">

            {/* ── Overview ── */}
            {activeTab === "overview" && (
              <div className="overview-content">
                <h3>{tv(destination.name)}</h3>
                <p>{destination.overview}</p>
                {(destination.category || destination.region || destination.opening_hours || destination.entry_fee != null) && (
                  <dl className="dest-facts">
                    {destination.category && <div><dt>{t("det.category")}</dt><dd>{tv(destination.category)}</dd></div>}
                    {destination.region && <div><dt>{t("det.region")}</dt><dd>{tv(destination.region)}</dd></div>}
                    {destination.opening_hours && <div><dt>{t("det.opening_hours")}</dt><dd>{destination.opening_hours}</dd></div>}
                    {destination.entry_fee != null && destination.entry_fee !== "" && (
                      <div><dt>{t("det.entry_fee")}</dt><dd>{parseFloat(destination.entry_fee) === 0 ? t("common.free") : `${parseFloat(destination.entry_fee).toFixed(3)} ${t("common.omr")}`}</dd></div>
                    )}
                  </dl>
                )}
                <AdSlot placement="details" />
                <button className="dest-learn-link" onClick={() => onNavigate("learn")}>🎓 {t("det.learn_cta")}</button>
              </div>
            )}

            {/* ── Reviews ── */}
            {activeTab === "reviews" && (
              <div className="reviews-content">

                {/* Stats bar */}
                {stats && parseInt(stats.total) > 0 && (
                  <div style={{ display: "flex", gap: 16, alignItems: "center", padding: "12px 16px", background: "#f9fafb", borderRadius: 12, marginBottom: 20, flexWrap: "wrap" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 32, fontWeight: 700, color: "#f97316" }}>{avgRating}</div>
                      <div style={{ color: "#fbbf24", fontSize: 16 }}>{"★".repeat(Math.round(avgRating))}</div>
                      <div style={{ fontSize: 12, color: "#9ca3af" }}>{stats.total} {t("det.reviews_word")}</div>
                    </div>
                    <div style={{ flex: 1, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {[
                        { label: t("det.positive"), count: stats.positive_count, color: "#16a34a" },
                        { label: t("det.neutral"),  count: stats.neutral_count,  color: "#ca8a04" },
                        { label: t("det.negative"), count: stats.negative_count, color: "#ef4444" },
                      ].map(s => (
                        <span key={s.label} style={{ padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: "#f3f4f6", color: s.color }}>
                          {s.label}: {s.count || 0}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Write a review */}
                <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 14, padding: 18, marginBottom: 24 }}>
                  <h4 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "#c2410c" }}>{t("det.write_review")}</h4>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 6 }}>{t("det.your_rating")}</div>
                    <StarPicker value={rating} onChange={setRating} />
                  </div>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t("det.comment_ph")}
                    rows={3}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #fed7aa", fontSize: 13.5, resize: "vertical", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                  />
                  {submitMsg && (
                    <p style={{ fontSize: 13, color: submitMsg.startsWith("✓") ? "#16a34a" : "#ef4444", margin: "6px 0 0", fontWeight: 600 }}>{submitMsg}</p>
                  )}
                  <button
                    onClick={handleSubmitReview}
                    disabled={submitting}
                    style={{ marginTop: 10, padding: "10px 28px", borderRadius: 999, border: "none", background: "linear-gradient(135deg,#f97316,#ea580c)", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: submitting ? 0.7 : 1 }}
                  >
                    {submitting ? t("det.submitting") : t("det.submit_review")}
                  </button>
                </div>

                {/* Reviews list */}
                {loadingReviews ? (
                  <p style={{ textAlign: "center", color: "#9ca3af", padding: 20 }}>{t("det.loading_reviews")}</p>
                ) : reviews.length === 0 ? (
                  <p style={{ textAlign: "center", color: "#9ca3af", padding: 20 }}>{t("det.no_reviews")}</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {reviews.map((review) => (
                      <div key={review.id} style={{ background: "white", borderRadius: 14, padding: "14px 18px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6" }}>
                        {/* Header */}
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                          {review.user_photo
                            ? <img src={resolveMediaUrl(review.user_photo)} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
                            : <FaUserCircle size={36} color="#d1d5db" />
                          }
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{review.username}</div>
                            <div style={{ fontSize: 11, color: "#9ca3af" }}>{new Date(review.created_at).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" })}</div>
                          </div>
                          {/* Star rating */}
                          <div style={{ color: "#fbbf24", fontSize: 14 }}>
                            {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                          </div>
                        </div>

                        {/* Comment */}
                        <p style={{ margin: "0 0 10px", fontSize: 13.5, color: "#374151", lineHeight: 1.6 }}>{review.comment}</p>

                        {/* Sentiment + Like */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          {review.sentiment_label && (
                            <span style={{
                              padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600,
                              background: review.sentiment_label === "positive" ? "#dcfce7" : review.sentiment_label === "negative" ? "#fee2e2" : "#f3f4f6",
                              color: review.sentiment_label === "positive" ? "#16a34a" : review.sentiment_label === "negative" ? "#ef4444" : "#6b7280",
                            }}>
                              {review.sentiment_label === "positive" ? t("det.positive") : review.sentiment_label === "negative" ? t("det.negative") : t("det.neutral")}
                            </span>
                          )}
                          <button
                            onClick={() => handleLikeReview(review.id)}
                            style={{
                              display: "flex", alignItems: "center", gap: 5,
                              padding: "5px 12px", borderRadius: 999, border: "1px solid #e5e7eb",
                              background: likedReviews.has(review.id) ? "#eff6ff" : "white",
                              color: likedReviews.has(review.id) ? "#3b82f6" : "#6b7280",
                              cursor: "pointer", fontSize: 12, fontWeight: 600, transition: "all 0.15s",
                            }}
                          >
                            <FaThumbsUp size={11} />
                            {likedReviews.has(review.id) ? t("det.helpful_on") : t("det.helpful")}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Location ── */}
            {activeTab === "location" && (() => {
              const lat = parseFloat(destination.latitude);
              const lng = parseFloat(destination.longitude);
              const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
              const openUrl = hasCoords ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : destination.mapLink;
              const dirUrl = hasCoords
                ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
                : destination.mapLink;
              return (
                <div className="location-content">
                  {destination.mapImage ? (
                    <a href={destination.mapLink || openUrl} target="_blank" rel="noopener noreferrer" className="location-map-link">
                      <img src={destination.mapImage} alt={`${tv(destination.name)} map`} className="location-map-image" />
                    </a>
                  ) : hasCoords ? (
                    <div className="location-embed">
                      <iframe
                        title={`${tv(destination.name)} map`}
                        src={`https://www.google.com/maps?q=${lat},${lng}&z=12&output=embed`}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <p className="location-empty">{t("det.map_unavailable")}</p>
                  )}
                  {(openUrl || dirUrl) && (
                    <div className="location-actions">
                      {openUrl && <a className="location-btn" href={openUrl} target="_blank" rel="noopener noreferrer">📍 {t("det.open_maps")}</a>}
                      {hasCoords && <a className="location-btn secondary" href={dirUrl} target="_blank" rel="noopener noreferrer">🧭 {t("det.directions")}</a>}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </section>
      </div>
    </div>
  );
}
export default DestinationDetails;

import React, { useState, useEffect } from "react";
import "./styles/Profile.css";
import profileBg from "./Images/home1.jpg";
import {
 FaUserCircle,
 FaMapMarkerAlt,
 FaSuitcase,
 FaStar,
 FaHeart,
 FaPen,
 FaTrash,
 FaCalendarAlt,
 FaSpinner,
} from "react-icons/fa";
import { tripsAPI, userAPI } from "./services/api";
import { useLang } from "./i18n/LanguageContext";
function Profile({ onNavigate = () => {}, profileData, onLogout = () => {} }) {
 const { t, locale } = useLang();
 const [activeSection, setActiveSection] = useState("");
 const [counts, setCounts] = useState({
   trips: null,
   reviews: null,
   saved: null,
 });
 const [trips, setTrips] = useState([]);
 const [reviews, setReviews] = useState([]);
 const [bookmarks, setBookmarks] = useState([]);
 const [loadingSection, setLoadingSection] = useState(false);
 const BACKEND =
   process.env.REACT_APP_API_URL?.replace("/api", "") ||
   "http://localhost:5000";
 const [currentProfile, setCurrentProfile] = useState(profileData || {});
 useEffect(() => {
   userAPI
     .getProfile()
     .then((res) => {
       if (res.success) {
         setCounts({
           trips: parseInt(res.data.trips_count) || 0,
           reviews: parseInt(res.data.reviews_count) || 0,
           saved: parseInt(res.data.bookmarks_count) || 0,
         });
         setCurrentProfile({
           name: res.data.username,
           email: res.data.email,
           location: res.data.location,
           interests: res.data.interests,
           budget: res.data.budget,
           travelType: res.data.travel_type,
           photo: res.data.photo_url
             ? res.data.photo_url.startsWith("http")
               ? `${res.data.photo_url}?t=${Date.now()}`
               : `${BACKEND}${res.data.photo_url}?t=${Date.now()}`
             : null,
         });
       }
     })
     .catch(() => {});
 }, [BACKEND]);
 const handleSectionClick = async (section) => {
   setActiveSection(section);
   setLoadingSection(true);
   try {
     if (section === "trips") {
       const res = await tripsAPI.getMyTrips();
       if (res.success) {
         setTrips(res.data);
         setCounts((c) => ({ ...c, trips: res.data.length }));
       }
     } else if (section === "reviews") {
       const res = await userAPI.getMyReviews();
       if (res.success) {
         setReviews(res.data);
         setCounts((c) => ({ ...c, reviews: res.data.length }));
       }
     } else if (section === "saved") {
       const res = await userAPI.getBookmarks();
       if (res.success) {
         setBookmarks(res.data);
         setCounts((c) => ({ ...c, saved: res.data.length }));
       }
     }
   } catch {}
   finally {
     setLoadingSection(false);
   }
 };
 const handleDeleteTrip = async (id) => {
   if (!window.confirm(t("prof.confirm_trip"))) return;
   const res = await tripsAPI.delete(id);
   if (res.success) {
     setTrips((prev) => prev.filter((t) => t.id !== id));
     setCounts((c) => ({
       ...c,
       trips: Math.max(0, (c.trips || 1) - 1),
     }));
   }
 };
 const handleRemoveBookmark = async (destinationId) => {
   const res = await userAPI.removeBookmark(destinationId);
   if (res.success) {
     setBookmarks((prev) =>
       prev.filter((b) => (b.destination_id || b.id) !== destinationId)
     );
     setCounts((c) => ({
       ...c,
       saved: Math.max(0, (c.saved || 1) - 1),
     }));
   }
 };
 const handleDeleteReview = async (id) => {
   if (!window.confirm(t("prof.confirm_review"))) return;
   const res = await userAPI.deleteReview(id);
   if (res.success) {
     setReviews((prev) => prev.filter((r) => r.id !== id));
     setCounts((c) => ({
       ...c,
       reviews: Math.max(0, (c.reviews || 1) - 1),
     }));
   }
 };
 const renderStars = (count) => (
<div className="stars-row">
     {[1, 2, 3, 4, 5].map((star) => (
<span
         key={star}
         className={star <= count ? "star-filled" : "star-empty"}
>
         ★
</span>
     ))}
</div>
 );
 const CountDisplay = ({ val }) =>
   val === null ? (
<FaSpinner style={{ animation: "spin 1s linear infinite", fontSize: 14 }} />
   ) : (
<span className="stat-number">{val}</span>
   );
 return (
<div
     className="profile-page page-transition"
     style={{ backgroundImage: `url(${profileBg})` }}
>
<style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
<div className="profile-overlay">
<div className="profile-main">
<section className="profile-header-card">
<div className="profile-header-left">
<div className="profile-avatar-box">
               {currentProfile?.photo ? (
<img
                   src={currentProfile.photo}
                   alt="Profile"
                   className="profile-avatar-image"
                 />
               ) : (
<FaUserCircle className="profile-avatar-icon" />
               )}
</div>
<div className="profile-info">
<h1 className="profile-name">
                 {currentProfile?.name || "Traveller"}
</h1>
<p className="profile-email">{currentProfile?.email}</p>
<p className="profile-location">
<FaMapMarkerAlt /> {currentProfile?.location || "Oman"}
</p>
               {currentProfile?.interests && (
<p style={{ fontSize: 13, color: "#9ca3af", margin: "4px 0 0" }}>
                   🎯 {currentProfile.interests} · 💰 {currentProfile.budget} · 👥{" "}
                   {currentProfile.travelType}
</p>
               )}
</div>
</div>
<div className="profile-header-actions">
<button
               className="edit-profile-btn"
               onClick={() => onNavigate("editProfile")}
>
<FaPen /> {t("prof.edit")}
</button>
<button className="logout-btn" onClick={onLogout}>
               {t("prof.logout")}
</button>
</div>
</section>
<section className="profile-stats">
<button
             className={`stat-card ${activeSection === "trips" ? "active-stat" : ""}`}
             onClick={() => handleSectionClick("trips")}
             type="button"
>
<div className="stat-top">
<FaSuitcase className="stat-icon" />
<CountDisplay val={counts.trips} />
</div>
<div className="stat-label">{t("prof.trips")}</div>
</button>
<button
             className={`stat-card ${activeSection === "reviews" ? "active-stat" : ""}`}
             onClick={() => handleSectionClick("reviews")}
             type="button"
>
<div className="stat-top">
<FaStar className="stat-icon star-icon" />
<CountDisplay val={counts.reviews} />
</div>
<div className="stat-label">{t("prof.reviews")}</div>
</button>
<button
             className={`stat-card ${activeSection === "saved" ? "active-stat" : ""}`}
             onClick={() => handleSectionClick("saved")}
             type="button"
>
<div className="stat-top">
<FaHeart className="stat-icon heart-icon" />
<CountDisplay val={counts.saved} />
</div>
<div className="stat-label">{t("prof.saved")}</div>
</button>
</section>
         {loadingSection && (
<div style={{ textAlign: "center", color: "white", padding: "30px", fontSize: 16 }}>
<FaSpinner style={{ animation: "spin 1s linear infinite", marginRight: 8 }} />
             Loading...
</div>
         )}
         {!loadingSection && activeSection === "trips" && (
<section className="profile-content-box">
<h2 className="content-title">{t("prof.trips")}</h2>
             {trips.length === 0 ? (
<div style={{ textAlign: "center", color: "#9ca3af", padding: 30 }}>
<p>{t("prof.no_trips")}</p>
<button
                   onClick={() => onNavigate("destinations")}
                   style={{
                     marginTop: 12,
                     padding: "10px 24px",
                     borderRadius: 999,
                     border: "none",
                     background: "#f97316",
                     color: "white",
                     fontWeight: 700,
                     cursor: "pointer",
                   }}
>
                   {t("trip.browse")}
</button>
</div>
             ) : (
<div className="trips-grid">
                 {trips.map((trip) => (
<div className="trip-card" key={trip.id}>
<div className="trip-body">
<h3 className="trip-title">{trip.title}</h3>
<p className="trip-meta">
                         {trip.duration_days ? `${trip.duration_days} ${t("prof.days")} · ` : ""}
                         {t("prof.budget")}: <strong>{trip.budget_level ? t(`opt.${trip.budget_level}`) : "—"}</strong>
</p>
                       {trip.travel_type && (
<p className="trip-places">👥 {t(`opt.${trip.travel_type}`)}</p>
                       )}
                       {trip.notes && (
<p className="trip-places" style={{ fontStyle: "italic", fontSize: 12 }}>
                           {trip.notes}
</p>
                       )}
<div className="trip-divider" />
<p className="trip-date">
<FaCalendarAlt />{" "}
                         {trip.trip_date
                           ? new Date(trip.trip_date).toLocaleDateString(locale, {
                               year: "numeric",
                               month: "short",
                               day: "numeric",
                             })
                           : new Date(trip.created_at).toLocaleDateString(locale, {
                               year: "numeric",
                               month: "short",
                               day: "numeric",
                             })}
</p>
                       {trip.stops && trip.stops.length > 0 && (
<div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 4 }}>
                           {trip.stops.slice(0, 4).map((s, i) => (
<span
                               key={i}
                               style={{
                                 padding: "2px 8px",
                                 background: "#fff7ed",
                                 color: "#c2410c",
                                 borderRadius: 999,
                                 fontSize: 11,
                                 fontWeight: 600,
                               }}
>
                               {s.place}
</span>
                           ))}
                           {trip.stops.length > 4 && (
<span style={{ fontSize: 11, color: "#9ca3af" }}>
                               +{trip.stops.length - 4} {t("prof.more")}
</span>
                           )}
</div>
                       )}
<div className="trip-actions">
<button
                           className="trip-btn delete-btn"
                           type="button"
                           onClick={() => handleDeleteTrip(trip.id)}
>
<FaTrash /> {t("prof.delete")}
</button>
</div>
</div>
</div>
                 ))}
</div>
             )}
</section>
         )}
         {!loadingSection && activeSection === "reviews" && (
<section className="profile-content-box">
<h2 className="content-title">{t("prof.reviews")}</h2>
             {reviews.length === 0 ? (
<div style={{ textAlign: "center", color: "#9ca3af", padding: 30 }}>
<p>{t("prof.no_reviews")}</p>
<button
                   onClick={() => onNavigate("destinations")}
                   style={{
                     marginTop: 12,
                     padding: "10px 24px",
                     borderRadius: 999,
                     border: "none",
                     background: "#f97316",
                     color: "white",
                     fontWeight: 700,
                     cursor: "pointer",
                   }}
>
                   {t("prof.visit")}
</button>
</div>
             ) : (
<div className="reviews-list">
                 {reviews.map((review) => (
<div className="review-card" key={review.id}>
<div className="review-content">
<div className="review-header">
<h3>{review.destination_name}</h3>
                         {renderStars(review.rating)}
</div>
<p style={{ margin: "6px 0" }}>{review.comment}</p>
<div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
<span
                           style={{
                             padding: "2px 8px",
                             borderRadius: 999,
                             fontSize: 11,
                             fontWeight: 600,
                             background:
                               review.status === "approved"
                                 ? "#dcfce7"
                                 : review.status === "rejected"
                                 ? "#fee2e2"
                                 : "#fef3c7",
                             color:
                               review.status === "approved"
                                 ? "#16a34a"
                                 : review.status === "rejected"
                                 ? "#ef4444"
                                 : "#92400e",
                           }}
>
                           {review.status === "approved"
                             ? "✓ Approved"
                             : review.status === "rejected"
                             ? "✗ Rejected"
                             : "⏳ Pending"}
</span>
<span style={{ fontSize: 11, color: "#9ca3af" }}>
                           {new Date(review.created_at).toLocaleDateString(locale)}
</span>
</div>
</div>
<div className="review-side-btn">
<button
                         className="orange-view-btn"
                         type="button"
                         onClick={() => handleDeleteReview(review.id)}
>
<FaTrash />
</button>
</div>
</div>
                 ))}
</div>
             )}
</section>
         )}
         {!loadingSection && activeSection === "saved" && (
<section className="profile-content-box">
<h2 className="content-title">{t("prof.saved")}</h2>
             {bookmarks.length === 0 ? (
<div style={{ textAlign: "center", color: "#9ca3af", padding: 30 }}>
<p>{t("prof.no_saved")}</p>
<button
                   onClick={() => onNavigate("destinations")}
                   style={{
                     marginTop: 12,
                     padding: "10px 24px",
                     borderRadius: 999,
                     border: "none",
                     background: "#f97316",
                     color: "white",
                     fontWeight: 700,
                     cursor: "pointer",
                   }}
>
                   {t("home.explore")}
</button>
</div>
             ) : (
<div className="saved-grid">
                 {bookmarks.map((item) => {
                   const destId = item.destination_id || item.id;
                   const name = item.destination_name || item.name;
                   const photo = item.photo_url || item.primary_photo;
                   return (
<div className="saved-card" key={destId}>
                       {photo && (
<img
                           src={photo.startsWith("http") ? photo : `${BACKEND}${photo}`}
                           alt={name}
                           className="saved-img"
                         />
                       )}
<div className="saved-body">
<h3 className="saved-title">{name}</h3>
<div className="saved-row">
                           {renderStars(Math.round(parseFloat(item.avg_rating) || 4))}
<FaHeart
                             className="saved-heart"
                             style={{ cursor: "pointer", color: "#ef4444" }}
                             onClick={() => handleRemoveBookmark(destId)}
                             title={t("prof.remove_saved")}
                           />
</div>
                         {item.region && (
<p style={{ fontSize: 12, color: "#9ca3af", margin: "4px 0 0" }}>
                             📍 {item.region}
</p>
                         )}
<div className="trip-divider" />
<button
                           className="orange-view-btn center-btn"
                           type="button"
                           onClick={() => onNavigate("destinations")}
>
                           View
</button>
</div>
</div>
                   );
                 })}
</div>
             )}
</section>
         )}
</div>
</div>
</div>
 );
}
export default Profile;
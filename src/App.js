import React, { useState, useEffect, useCallback } from "react";
import "./styles/App.css";
import "./styles/Login.css";
import Home from "./Home";
import Destinations from "./Destinations";
import DestinationDetails from "./DestinationDetails";
import TripBuilder from "./TripBuilder";
import AiTripGenerator from "./AiTripGenerator";
import Activities from "./Activities";
import Profile from "./Profile";
import EditProfile from "./EditProfile";
import Login from "./Login";
import Register from "./Register";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Chatbot from "./components/Chatbot";
import AdminDashboard from "./AdminDashboard";
import Learn from "./Learn";
import Offers from "./Offers";
import Partners from "./Partners";
import Support from "./Support";
import Directory from "./Directory";
import MyBookings from "./MyBookings";
import BusinessPortal from "./BusinessPortal";
import Premium from "./Premium";
import OfflineBanner from "./components/OfflineBanner";
import InstallPrompt from "./components/InstallPrompt";
import { getToken, getUser, clearTokens, userAPI } from "./services/api";
import { resolveMediaUrl } from "./config";

// Map backend user object → profileData shape
const mapUser = (u) => ({
  name:         u.username   || "",
  email:        u.email      || "",
  location:     u.location   || "",
  interests:    u.interests  || "",
  budget:       u.budget     || "Low",
  travelType:   u.travel_type|| "Solo",
  photo:        resolveMediaUrl(u.photo_url),
  id:           u.id,
  role:         u.role       || "user",
  tripsCount:   u.trips_count,
  reviewsCount: u.reviews_count,
  bookmarksCount: u.bookmarks_count,
});

const PUBLIC_PAGES = ["login", "register"];
const KNOWN_PAGES = [
  "login", "register", "home", "destinations", "destinationDetails", "tripBuilder", "aiTrip",
  "activities", "learn", "offers", "partners", "support", "directory", "bookings", "business", "premium",
  "profile", "editProfile", "admin",
];

function App() {
  // Start on login unless already authenticated
  const [currentPage, setCurrentPage] = useState(getToken() ? "home" : "login");
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [destinationSearch, setDestinationSearch]     = useState("");
  const [destinationCategory, setDestinationCategory] = useState("");

  // Profile data — seeded from localStorage, refreshed from backend
  const [profileData, setProfileData] = useState(() => {
    const cached = getUser();
    return cached ? mapUser(cached) : null;
  });

  // Refresh profile from backend whenever we land on home
  useEffect(() => {
    if (currentPage === "home" && getToken()) {
      userAPI.getProfile()
        .then(res => { if (res.success) setProfileData(mapUser(res.data)); })
        .catch(() => {});
    }
  }, [currentPage]);

  /* ── Browser history: phone/desktop Back button moves between app pages ── */
  useEffect(() => {
    window.history.replaceState({ page: currentPage }, "");
    const onPop = (e) => {
      let page = e.state?.page;
      if (!KNOWN_PAGES.includes(page)) page = getToken() ? "home" : "login";
      if (!getToken() && !PUBLIC_PAGES.includes(page)) page = "login";
      if (getToken() && PUBLIC_PAGES.includes(page)) page = "home";
      setCurrentPage(page);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goTo = useCallback((page) => {
    setCurrentPage(page);
    if (window.history.state?.page !== page) window.history.pushState({ page }, "");
  }, []);

  // Always start a new page at the top
  useEffect(() => { window.scrollTo(0, 0); }, [currentPage]);

  /* ── Navigation helpers ── */
  const handleNavigate          = (page) => { if (page === "destinations") { setDestinationSearch(""); setDestinationCategory(""); } goTo(page); };
  const handleOpenDestination   = (dest) => { setSelectedDestination(dest); goTo("destinationDetails"); };
  const handleStartTrip         = (dest) => { setSelectedDestination(dest); goTo("tripBuilder"); };
  const handleSearchDestination = (text) => { setDestinationSearch(text); setDestinationCategory(""); goTo("destinations"); };
  const handleBrowse            = ({ search = "", category = "" } = {}) => { setDestinationSearch(search); setDestinationCategory(category); goTo("destinations"); };

  /* ── Auth handlers ── */
  const handleLogin = (user) => {
    if (user) setProfileData(mapUser(user));
    goTo(user?.role === "admin" ? "admin" : "home");
  };

  const handleLogout = async () => {
    try { const { authAPI } = await import("./services/api"); await authAPI.logout(); } catch {}
    clearTokens();
    setProfileData(null);
    goTo("login");
  };

  // Guard pages that need a selected destination (e.g. after a page reload)
  let page = currentPage;
  if (page === "admin" && profileData?.role !== "admin") page = "home";
  if ((page === "destinationDetails" || page === "tripBuilder") && !selectedDestination) page = "destinations";

  /* ── Auth pages (no navbar/footer) ── */
  if (page === "login") {
    return (<><OfflineBanner /><Login onLogin={handleLogin} onGoRegister={() => goTo("register")} /></>);
  }
  if (page === "register") {
    return (<><OfflineBanner /><Register onBackToLogin={() => goTo("login")} onRegistered={handleLogin} /></>);
  }

  /* ── Admin dashboard (no navbar/footer) ── */
  if (page === "admin") {
    return <AdminDashboard onNavigate={handleNavigate} />;
  }

  /* ── Main pages ── */
  let pageContent;
  switch (page) {
    case "home":
      pageContent = <Home onNavigate={handleNavigate} onOpenDestination={handleOpenDestination} onSearchDestination={handleSearchDestination} />;
      break;
    case "destinations":
      pageContent = <Destinations onNavigate={handleNavigate} onOpenDestination={handleOpenDestination} searchTerm={destinationSearch} initialCategory={destinationCategory} />;
      break;
    case "destinationDetails":
      pageContent = <DestinationDetails destination={selectedDestination} onBack={() => goTo("destinations")} onStartTrip={handleStartTrip} onNavigate={handleNavigate} />;
      break;
    case "tripBuilder":
      pageContent = <TripBuilder destination={selectedDestination} onBack={() => goTo("destinationDetails")} onNavigate={handleNavigate} />;
      break;
    case "aiTrip":
      pageContent = <AiTripGenerator onNavigate={handleNavigate} />;
      break;
    case "activities":
      pageContent = <Activities onNavigate={handleNavigate} />;
      break;
    case "learn":
      pageContent = <Learn onNavigate={handleNavigate} onOpenDestination={handleOpenDestination} />;
      break;
    case "offers":
      pageContent = <Offers onNavigate={handleNavigate} />;
      break;
    case "partners":
      pageContent = <Partners onNavigate={handleNavigate} />;
      break;
    case "support":
      pageContent = <Support onNavigate={handleNavigate} />;
      break;
    case "directory":
      pageContent = <Directory onNavigate={handleNavigate} />;
      break;
    case "bookings":
      pageContent = <MyBookings onNavigate={handleNavigate} />;
      break;
    case "business":
      pageContent = <BusinessPortal onNavigate={handleNavigate} />;
      break;
    case "premium":
      pageContent = <Premium onNavigate={handleNavigate} />;
      break;
    case "profile":
      pageContent = <Profile onNavigate={handleNavigate} profileData={profileData} onLogout={handleLogout} />;
      break;
    case "editProfile":
      pageContent = <EditProfile profileData={profileData} setProfileData={setProfileData} onNavigate={handleNavigate} />;
      break;
    default:
      pageContent = <Home onNavigate={handleNavigate} onOpenDestination={handleOpenDestination} onSearchDestination={handleSearchDestination} />;
  }

  return (
    <>
      <OfflineBanner />
      <Navbar onNavigate={handleNavigate} currentPage={page} />
      <main id="main-content">{pageContent}</main>
      <Footer onNavigate={handleNavigate} onBrowse={handleBrowse} />
      <Chatbot />
      <InstallPrompt />
    </>
  );
}
export default App;

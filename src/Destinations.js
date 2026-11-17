import React, { useState, useEffect } from "react";
import "./styles/Destinations.css";
import homeTop from "./Images/home1.jpg";
import nizwaImg from "./Images/nizwa.jpg";
import nizwaMapImg from "./Images/nizwa-map.PNG";
import musandamImg from "./Images/musandam.jpg";
import musandamMapImg from "./Images/Musandam-map.PNG";
import salalahImg from "./Images/salalah.jpg";
import salalahMapImg from "./Images/Salalah-map.PNG";
import muttrahImg from "./Images/Muttrah.jpg";
import muttrahMapImg from "./Images/MuttrahCorniche-map.PNG";
import jabalShamsImg from "./Images/jabal shams.jpg";
import jabalShamsMapImg from "./Images/Jabal Shams-map.PNG";
import jabalAkhdarImg from "./Images/aljabal alakhdar.jpg";
import jabalAkhdarMapImg from "./Images/Jabal Al Akhdar-map.PNG";
import TurtleBeachMapImg from "./Images/Turtle Beach-map.PNG";
import rasAlJanzImg from "./Images/ras aljanz.jpg";
import rasAlJinzMapImg from "./Images/Ras Al Jinz-map.PNG";
import wadiBaniKhalidImg from "./Images/Wadi Bani Khalid.jpg";
import wadiBaniKhalidMapImg from "./Images/Wadi Bani Khalid-map.PNG";
import { FaStar, FaStarHalfAlt } from "react-icons/fa";
import { FiSearch } from "react-icons/fi";
import { destinationsAPI } from "./services/api";
import { resolveMediaUrl } from "./config";
import { useLang } from "./i18n/LanguageContext";
import AdSlot from "./components/AdSlot";
export const DESTINATIONS = [
 {
   id: 1,
   name: "Suq Nizwa",
   area: "Al Dakhiliya",
   image: nizwaImg,
   rating: 5,
   overview: `Nizwa Souq is one of Oman's most iconic traditional markets, located in the historic city of Nizwa, right beside Nizwa Fort. Known for its authentic atmosphere and cultural significance, the souq offers visitors a genuine glimpse into Oman's rich heritage and trading traditions.
The market is famous for its handcrafted silver jewelry, traditional Omani khanjars (daggers), pottery, spices, dates, and frankincense. Beyond shopping, Nizwa Souq provides a cultural experience where visitors can witness local craftsmanship, interact with friendly shopkeepers, and explore a setting that reflects centuries of history.`,
   mapImage: nizwaMapImg,
   mapLink: "https://maps.app.goo.gl/1ftmZ7yNhmAxNbMe6",
 },
 {
   id: 2,
   name: "Musandam",
   area: "Musandam Peninsula",
   image: musandamImg,
   rating: 5,
   overview:
     "Musandam is known for its spectacular fjord-like inlets, towering cliffs, and crystal-clear waters. Visitors can enjoy dhow cruises, snorkeling, and dolphin watching in a dramatic natural setting.",
   mapImage: musandamMapImg,
   mapLink: "https://maps.app.goo.gl/UH3zYkoPQpkhExYWA",
 },
 {
   id: 3,
   name: "Salalah",
   area: "Dhofar",
   image: salalahImg,
   rating: 4.5,
   overview:
     "Salalah transforms into a lush green paradise during the Khareef season. It is famous for its waterfalls, cool climate, and unique coastal and mountain landscapes.",
   mapImage: salalahMapImg,
   mapLink: "https://maps.app.goo.gl/6cgdp5cRFSecbjbL7",
 },
 {
   id: 4,
   name: "Muttrah Corniche",
   area: "Muscat",
   image: muttrahImg,
   rating: 4.5,
   overview:
     "Muttrah Corniche combines traditional souqs with a beautiful seaside promenade. It offers stunning views of the harbor, historic buildings, and lively local life.",
   mapImage: muttrahMapImg,
   mapLink: "https://maps.app.goo.gl/jpnhuPcovQPM98yK6",
 },
 {
   id: 5,
   name: "Jabal Shams",
   area: "Al Dakhiliya",
   image: jabalShamsImg,
   rating: 5,
   overview:
     "Jabal Shams is the highest mountain in Oman, known for its breathtaking canyon views and hiking trails. It is a popular spot for adventure seekers and nature lovers.",
   mapImage: jabalShamsMapImg,
   mapLink: "https://maps.app.goo.gl/kVaPnhoVaDkf6Hux6",
 },
 {
   id: 6,
   name: "Jabal Al Akhdar",
   area: "Al Dakhiliya",
   image: jabalAkhdarImg,
   rating: 4.5,
   overview:
     "Jabal Al Akhdar offers cool temperatures, terraced villages, and famous rose gardens. It is ideal for relaxing stays and scenic walks.",
   mapImage: jabalAkhdarMapImg,
   mapLink: "https://maps.app.goo.gl/LRAy1oJEFrXkun5e7",
 },
 {
   id: 7,
   name: "Turtle Beach",
   area: "South Al Sharqiya",
   image: rasAlJanzImg,
   rating: 4.5,
   overview:
     "Ras Al Jinz is known for its turtle reserve where visitors can watch sea turtles nesting. It offers a unique wildlife and eco-tourism experience.",
   mapImage: TurtleBeachMapImg,
   mapLink: "https://maps.app.goo.gl/HsckzVfJNyD9W2Ct5",
 },
 {
   id: 8,
   name: "Ras Al Janz",
   area: "Al Sharqiya",
   image: rasAlJanzImg,
   rating: 4,
   overview:
     "Ras Al Janz features scenic coastal views and peaceful beaches, suitable for quiet getaways and seaside walks.",
   mapImage: rasAlJinzMapImg,
   mapLink: "https://maps.app.goo.gl/Yw8rs6esxikRKdWR9",
 },
 {
   id: 9,
   name: "Wadi Bani Khalid",
   area: "Al Sharqiya",
   image: wadiBaniKhalidImg,
   rating: 5,
   overview:
     "Wadi Bani Khalid is one of the most famous wadis in Oman, offering clear turquoise pools, dramatic rock formations, and family-friendly swimming spots.",
   mapImage: wadiBaniKhalidMapImg,
   mapLink: "https://maps.app.goo.gl/pZnEVrKR338sc6td9",
 },
];
// Local photos for the seeded destinations (used when the server has no uploaded photo)
export const getLocalImage = (name) => {
  switch (name) {
    case "Suq Nizwa": return nizwaImg;
    case "Musandam": return musandamImg;
    case "Salalah": return salalahImg;
    case "Muttrah Corniche": return muttrahImg;
    case "Jabal Shams": return jabalShamsImg;
    case "Jabal Al Akhdar": return jabalAkhdarImg;
    case "Turtle Beach": return rasAlJanzImg;
    case "Ras Al Janz": return rasAlJanzImg;
    case "Wadi Bani Khalid": return wadiBaniKhalidImg;
    default: return homeTop;
  }
};

// API destination row → the shape used by the pages
export const mapApiDestination = (d) => {
  const photo = d.primary_photo || d.photo_url || d.photo;
  return {
    id: d.id,
    name: d.name,
    area: d.area || d.region || "",
    image: photo ? resolveMediaUrl(photo) : getLocalImage(d.name),
    rating: parseFloat(d.avg_rating) || 0,
    overview: d.overview || d.description || "",
    mapImage: null,
    mapLink: d.map_link || "",
    region: d.region,
    category: d.category,
    entry_fee: d.entry_fee,
    opening_hours: d.opening_hours,
    latitude: d.latitude,
    longitude: d.longitude,
  };
};

// Rating stars (full / half) used on the cards
export function Stars({ rating }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.25 && rating - full < 0.75;
  const extra = rating - full >= 0.75 ? 1 : 0;
  const stars = [];
  for (let i = 0; i < Math.min(5, full + extra); i++) stars.push(<FaStar key={i} />);
  if (half && stars.length < 5) stars.push(<FaStarHalfAlt key="h" />);
  return <>{stars}</>;
}

function Destinations({
  onNavigate = () => {},
  onOpenDestination = () => {},
  searchTerm = "",
  initialCategory = "",
}) {
  const { t, tv } = useLang();
  const [search, setSearch] = useState(searchTerm);
  const [category, setCategory] = useState(initialCategory);
  const [destinations, setDestinations] = useState(DESTINATIONS);
  useEffect(() => { setSearch(searchTerm); }, [searchTerm]);
  useEffect(() => { setCategory(initialCategory); }, [initialCategory]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await destinationsAPI.getAll({ limit: 50 });
        if (alive && res.success && Array.isArray(res.data)) setDestinations(res.data.map(mapApiDestination));
      } catch {
        if (alive) setDestinations(DESTINATIONS);
      }
    })();
    return () => { alive = false; };
  }, []);

  // categories present in the data (admin can add new ones, they appear automatically)
  const categories = Array.from(new Set(destinations.map((d) => d.category).filter(Boolean)));

  const normalizedSearch = search.trim().toLowerCase();
  const compact = (s) => (s || "").replace(/\s+/g, "").toLowerCase();
  const filteredDestinations = destinations.filter((dest) => {
    if (category && dest.category !== category) return false;
    if (!normalizedSearch) return true;
    const q = compact(normalizedSearch);
    return (
      dest.name?.toLowerCase().includes(normalizedSearch) ||
      dest.area?.toLowerCase().includes(normalizedSearch) ||
      dest.region?.toLowerCase().includes(normalizedSearch) ||
      tv(dest.name)?.toLowerCase().includes(normalizedSearch) ||
      tv(dest.area)?.toLowerCase().includes(normalizedSearch) ||
      compact(dest.name).includes(q) ||
      compact(dest.area).includes(q)
    );
  });

  return (
    <div className="destinations-page page-transition">
      <div className="dest-bg" style={{ backgroundImage: `url(${homeTop})` }} />
      <div className="dest-main-overlay">
        <section id="destinations" className="dest-search-section">
          <div className="dest-search-row">
            <div className="dest-search-box">
              <FiSearch className="dest-search-icon" />
              <input
                type="search"
                placeholder={t("dest.search_ph")}
                aria-label={t("dest.search_ph")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="dest-search-button" type="button">{t("common.search")}</button>
          </div>
          {categories.length > 1 && (
            <div className="dest-chips" role="group" aria-label={t("dest.filter_label")}>
              <button type="button" className={`dest-chip ${category === "" ? "active" : ""}`} onClick={() => setCategory("")}>{t("dest.filter_all")}</button>
              {categories.map((c) => (
                <button key={c} type="button" className={`dest-chip ${category === c ? "active" : ""}`} onClick={() => setCategory(c)}>{tv(c)}</button>
              ))}
            </div>
          )}
        </section>

        <section className="dest-grid-section">
          <AdSlot placement="destinations" />
          <div className="dest-grid">
            {filteredDestinations.length > 0 ? (
              filteredDestinations.map((dest) => (
                <div
                  key={dest.id}
                  role="button"
                  tabIndex={0}
                  className="destination-card"
                  onClick={() => onOpenDestination(dest)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpenDestination(dest); } }}
                >
                  <div className="dest-card-image-wrapper">
                    <img src={dest.image} alt={tv(dest.name)} loading="lazy" />
                  </div>
                  <div className="dest-card-info">
                    <span className="dest-card-name">{tv(dest.name)}</span>
                    <div className="dest-card-area">{tv(dest.area)}</div>
                    <div className="dest-card-rating"><Stars rating={dest.rating} /></div>
                    <span className="view-details-btn">{t("common.view_details")}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="dest-empty">{t("dest.none")}</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
export default Destinations;

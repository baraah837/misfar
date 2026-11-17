import React, { useState } from "react";
import "./styles/Home.css";
// الخلفيات
import homeTop from "./Images/home2.jpg";
import homeBottom from "./Images/home1.jpg";
// صور الوجهات
import musandamImg from "./Images/musandam.jpg";
import nizwaImg from "./Images/nizwa.jpg";
import salalahImg from "./Images/salalah.jpg";
// أيقونات واقعية
import { FaStar, FaStarHalfAlt } from "react-icons/fa";
import { FiSearch } from "react-icons/fi";
function Home({ onNavigate, onOpenDestination, onSearchDestination }) {
 const [searchTerm, setSearchTerm] = useState("");
 const handleSearchClick = () => {
   if (onSearchDestination) {
     onSearchDestination(searchTerm);
   }
 };
 return (
<div className="home-page page-transition">
     {/* ========= الجزء العلوي ========= */}
<div
       className="home-top"
       style={{ backgroundImage: `url(${homeTop})` }}
>
<div className="home-top-overlay">
         {/* HERO */}
<section id="home" className="hero-section">
<h1 className="hero-title"> 
  Discover Oman with Misfar
</h1> 
<p className="hero-subtitle">
             Explore destination, activities &amp; plan your trip with AI
</p>
<div className="hero-buttons">
<button
               className="btn-primary"
               onClick={() => onNavigate && onNavigate("destinations")}
>
               Explore destination
</button>
<button
               className="btn-secondary"
               onClick={() => onNavigate && onNavigate("aiTrip")}
>
               Generate Trip
</button>
</div>
</section>
</div>
</div>
     {/* ========= الجزء السفلي ========= */}
<div
       className="home-bottom"
       style={{ backgroundImage: `url(${homeBottom})` }}
>
<div className="home-bottom-overlay">
         {/* POPULAR DESTINATIONS */}
<section id="destinations" className="popular-section">
<div className="popular-inner">
<h2 className="section-title">Popular Destinations</h2>
<div className="search-bar">
<FiSearch className="search-icon" />
<input
                 type="text"
                 placeholder="Where do you want to go?"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
<button className="search-btn" onClick={handleSearchClick}>
                 Search
</button>
</div>
<div className="dest-cards-row">
<div className="dest-card">
<img src={nizwaImg} alt="Nizwa" />
<div className="dest-info">
<h3>Nizwa</h3>
<div className="rating">
<FaStar />
<FaStar />
<FaStar />
<FaStar />
<FaStar />
</div>
<button
                     className="view-btn"
                     onClick={() =>
                       onOpenDestination &&
                       onOpenDestination({
                         id: 1,
                         name: "Suq Nizwa",
                         area: "Al Dakhiliya",
                         image: nizwaImg,
                         rating: 5,
                         overview:
                           "Nizwa Souq is one of Oman's most iconic traditional markets, located in the historic city of Nizwa right beside Nizwa Fort. Known for its authentic atmosphere and cultural significance, the souq offers visitors a genuine glimpse into Oman's rich heritage and trading traditions.",
                       })
                     }
>
                     View Details
</button>
</div>
</div>
<div className="dest-card">
<img src={musandamImg} alt="Musandam" />
<div className="dest-info">
<h3>Musandam</h3>
<div className="rating">
<FaStar />
<FaStar />
<FaStar />
<FaStar />
<FaStar />
</div>
<button
                     className="view-btn"
                     onClick={() =>
                       onOpenDestination &&
                       onOpenDestination({
                         id: 2,
                         name: "Musandam",
                         area: "Musandam Peninsula",
                         image: musandamImg,
                         rating: 5,
                         overview:
                           "Musandam is famous for its dramatic fjords, crystal-clear waters, and breathtaking mountain scenery. It is one of the most unique natural destinations in Oman and offers unforgettable boat trips, coastal adventures, and peaceful escapes.",
                       })
                     }
>
                     View Details
</button>
</div>
</div>
<div className="dest-card">
<img src={salalahImg} alt="Salalah" />
<div className="dest-info">
<h3>Salalah</h3>
<div className="rating">
<FaStar />
<FaStar />
<FaStar />
<FaStar />
<FaStarHalfAlt />
</div>
<button
                     className="view-btn"
                     onClick={() =>
                       onOpenDestination &&
                       onOpenDestination({
                         id: 3,
                         name: "Salalah",
                         area: "Dhofar",
                         image: salalahImg,
                         rating: 4.5,
                         overview:
                           "Salalah is known for its lush greenery, waterfalls, and cool climate during the Khareef season. It is one of Oman’s most beloved travel destinations, combining natural beauty, cultural charm, and relaxing coastal views.",
                       })
                     }
>
                     View Details
</button>
</div>
</div>
</div>
</div>
</section>
<section id="ai-trip" className="guarantee-section">
<div className="guarantee-panel">
<h2 className="guarantee-title">
               We <span>guarantee</span>
</h2>
<div className="guarantee-content">
<div className="guarantee-left">
<ul>
<li>
<span className="icon-bullet"></span>
                     Smart trip planning
</li>
<li>
<span className="icon-bullet"></span>
                     Fast communication
</li>
<li>
<span className="icon-bullet"></span>
                     Exclusive offers
</li>
<li>
<span className="icon-bullet"></span>
                     Fun and easy trips
</li>
</ul>
</div>
<div className="middle-line" />
<div className="guarantee-right">
<div className="testimonial-card">
<div className="testimonial-header">
<span className="name">Salim Al-Saady</span>
<span className="stars">
<FaStar />
<FaStar />
<FaStar />
<FaStar />
<FaStar />
</span>
</div>
<p className="testimonial-text">
                     I recently used Misfar to plan my trip to Nizwa and it
                     made everything so easy. The AI trip planner suggested
                     places I didn&apos;t even know about, and the itinerary was
                     well organized. The interface is clean and very easy to
                     use. I especially liked the bilingual support.
<br />
                     Highly recommended for anyone travelling in Oman!
</p>
</div>
</div>
</div>
</div>
</section>
<section id="activities" />
</div>
</div>
</div>
 );
}
export default Home;
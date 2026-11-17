// src/AiTripGenerator.js
import React, { useState } from "react";
import "./styles/AiTripGenerator.css";
import beachBg from "./Images/home1.jpg";
import { tripsAPI } from "./services/api";

import nizwaImg        from "./Images/nizwa.jpg";
import musandamImg     from "./Images/musandam.jpg";
import salalahImg      from "./Images/salalah.jpg";
import muttrahImg      from "./Images/Muttrah.jpg";
import { useLang } from "./i18n/LanguageContext";
import jabalShamsImg   from "./Images/jabal shams.jpg";
import jabalAkhdarImg  from "./Images/aljabal alakhdar.jpg";
import rasAlJinzImg    from "./Images/Ras Al Jinz.png";
import wadiBaniImg     from "./Images/Wadi Bani Khalid.jpg";

// Map destination name → local image
const LOCAL_IMAGES = {
  "suq nizwa": nizwaImg,       "nizwa": nizwaImg,
  "musandam": musandamImg,
  "salalah": salalahImg,
  "muttrah": muttrahImg,
  "jabal shams": jabalShamsImg,
  "jabal al akhdar": jabalAkhdarImg, "jabal akhdar": jabalAkhdarImg,
  "ras al jinz": rasAlJinzImg,  "turtle beach": rasAlJinzImg, "ras al janz": rasAlJinzImg,
  "wadi bani khalid": wadiBaniImg,
};
const getImg = (name) => {
  if (!name) return nizwaImg;
  const key = name.toLowerCase();
  for (const [k, v] of Object.entries(LOCAL_IMAGES)) {
    if (key.includes(k)) return v;
  }
  return nizwaImg;
};

// Category badge colors
const CAT_COLOR = {
  Historic:  { bg: "#fef3c7", color: "#92400e", icon: "🏛" },
  Nature:    { bg: "#d1fae5", color: "#065f46", icon: "🌿" },
  Adventure: { bg: "#fee2e2", color: "#991b1b", icon: "🎯" },
  Beach:     { bg: "#dbeafe", color: "#1e40af", icon: "🏖" },
};


const DURATION_MAP = { "1–2 days": 2, "3–5 days": 4, "1 Week": 7 };
const TRANSPORT_COST = { Low: 10, Medium: 25, High: 50 };

// ── Local fallback destinations grouped by interest ───────────
const LOCAL_BY_INTEREST = {
  Beaches:   [
    { name: "Ras Al Janz", area: "Al Sharqiya", category: "Beach" },
    { name: "Turtle Beach", area: "South Al Sharqiya", category: "Beach" },
    { name: "Musandam", area: "Musandam Peninsula", category: "Nature" },
  ],
  Mountains: [
    { name: "Jabal Shams", area: "Al Dakhiliya", category: "Adventure" },
    { name: "Jabal Al Akhdar", area: "Al Dakhiliya", category: "Nature" },
    { name: "Musandam", area: "Musandam Peninsula", category: "Nature" },
  ],
  Historic: [
    { name: "Suq Nizwa", area: "Al Dakhiliya", category: "Historic" },
    { name: "Muttrah Corniche", area: "Muscat", category: "Historic" },
  ],
  Desert: [
    { name: "Jabal Shams", area: "Al Dakhiliya", category: "Adventure" },
    { name: "Wadi Bani Khalid", area: "Al Sharqiya", category: "Nature" },
  ],
  Adventure: [
    { name: "Jabal Shams", area: "Al Dakhiliya", category: "Adventure" },
    { name: "Wadi Bani Khalid", area: "Al Sharqiya", category: "Nature" },
    { name: "Musandam", area: "Musandam Peninsula", category: "Nature" },
  ],
};

function buildLocalItinerary(interests, region, duration, budget, travelType) {
  const days = DURATION_MAP[duration] || 2;
  // Collect destinations matching selected interests (deduplicated)
  const seen = new Set();
  const pool = [];
  const activeInterests = interests.length > 0 ? interests : ["Beaches", "Historic", "Adventure"];
  for (const interest of activeInterests) {
    for (const dest of (LOCAL_BY_INTEREST[interest] || [])) {
      if (!seen.has(dest.name)) {
        seen.add(dest.name);
        pool.push(dest);
      }
    }
  }
  // Pad with remaining if not enough
  const allDests = [
    { name: "Suq Nizwa", area: "Al Dakhiliya", category: "Historic" },
    { name: "Muttrah Corniche", area: "Muscat", category: "Historic" },
    { name: "Jabal Shams", area: "Al Dakhiliya", category: "Adventure" },
    { name: "Jabal Al Akhdar", area: "Al Dakhiliya", category: "Nature" },
    { name: "Wadi Bani Khalid", area: "Al Sharqiya", category: "Nature" },
    { name: "Musandam", area: "Musandam Peninsula", category: "Nature" },
    { name: "Salalah", area: "Dhofar", category: "Nature" },
    { name: "Turtle Beach", area: "South Al Sharqiya", category: "Beach" },
  ];
  for (const d of allDests) {
    if (!seen.has(d.name)) { seen.add(d.name); pool.push(d); }
  }

  const itinerary = [];
  let idx = 0;
  for (let d = 1; d <= days; d++) {
    const morning = pool[idx % pool.length]; idx++;
    const afternoon = pool[idx % pool.length]; idx++;
    itinerary.push({
      day: d,
      stops: [
        { time: "8:00 AM",  destination: morning,   duration: "2-3 hours" },
        { time: "1:00 PM",  destination: null, custom_place: "Lunch / Local Restaurant", duration: "1 hour", notes: "Enjoy authentic Omani cuisine 🍽" },
        { time: "3:00 PM",  destination: afternoon, duration: "2-3 hours" },
      ],
    });
  }
  const cost = (TRANSPORT_COST[budget] || 10) * days + days * 5;
  return {
    itinerary,
    summary: { days, region, budget, travel_type: travelType, interests, estimated_cost_omr: cost, destinations_count: days * 2 },
  };
}

function AiTripGenerator({ onNavigate = () => {} }) {
  const { t: tt, tv } = useLang();
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading]     = useState(false);
  const [progress, setProgress]       = useState(0);
  const [itinerary, setItinerary]     = useState(null);
  const [summary, setSummary]         = useState(null);
  const [savedMsg, setSavedMsg]       = useState("");
  const [saving, setSaving]           = useState(false);
  const [noMatchMsg, setNoMatchMsg]   = useState("");

  const [region, setRegion]       = useState("All Regions");
  const [duration, setDuration]   = useState("1–2 days");
  const [budget, setBudget]       = useState("Low");
  const [interests, setInterests] = useState([]);
  const [travelType, setTravelType] = useState("Solo");

  const toggleInterest = (val) =>
    setInterests(prev => prev.includes(val) ? prev.filter(i => i !== val) : [...prev, val]);

  const handleGenerate = async () => {
    if (interests.length === 0) {
      setNoMatchMsg(tt("ai.pick_interest"));
      return;
    }
    setNoMatchMsg("");
    setIsLoading(true); setProgress(0); setShowResults(false); setSavedMsg("");

    let current = 0;
    const tick = setInterval(() => {
      current += 2; setProgress(Math.min(current, 90));
      if (current >= 90) clearInterval(tick);
    }, 80);

    try {
      const res = await tripsAPI.aiGenerate({
        region: region === "All Regions" ? null : region,
        duration: DURATION_MAP[duration],
        budget,
        interests,
        travel_type: travelType,
      });

      clearInterval(tick); setProgress(100);

      if (res.success && res.data?.itinerary?.length > 0) {
        setItinerary(res.data.itinerary);
        setSummary(res.data.summary);
      } else {
        // Use local interest-based fallback
        const local = buildLocalItinerary(interests, region, duration, budget, travelType);
        setItinerary(local.itinerary);
        setSummary(local.summary);
        setNoMatchMsg(tt("ai.suggested"));
      }
    } catch {
      clearInterval(tick); setProgress(100);
      const local = buildLocalItinerary(interests, region, duration, budget, travelType);
      setItinerary(local.itinerary);
      setSummary(local.summary);
      setNoMatchMsg(tt("ai.suggested"));
    } finally {
      setIsLoading(false);
      setShowResults(true);
    }
  };

  const handleSaveTrip = async () => {
    if (!itinerary) return;
    setSaving(true); setSavedMsg("");
    try {
      const stops = itinerary.flatMap((day, di) =>
        day.stops.map((s, si) => ({
          stop_order: di * 10 + si + 1,
          destination_id: s.destination?.id || null,
          custom_place: s.destination ? null : s.custom_place,
          arrival_time: s.time,
          duration_hours: 2,
        }))
      );
      const res = await tripsAPI.create({
        title: `${interests.join(" & ")} Trip – ${region} (${duration})`,
        duration_days: DURATION_MAP[duration],
        budget_level: budget,
        travel_type: travelType,
        total_cost_omr: summary?.estimated_cost_omr || 0,
        stops,
      });
      setSavedMsg(res.success ? tt("trip.saved") : res.message || tt("ai.login_save"));
    } catch { setSavedMsg(tt("common.error_connect")); }
    finally { setSaving(false); }
  };

  const chip = (active) => `ai-chip${active ? " ai-chip-active" : ""}`;

  return (
    <div className="ai-trip-page page-transition" style={{ backgroundImage: `url(${beachBg})` }}>
      <div className="ai-overlay">
        <section className="ai-hero">
          <h1 className="ai-hero-title">{tt("ai.hero")}</h1>
          <p className="ai-hero-subtitle">{tt("ai.hero_sub")}</p>
        </section>

        <section className="ai-builder-card" id="ai-trip">
          <h2 className="ai-section-title">{tt("ai.build")}</h2>

          {/* ── Interests (most important — shown first) ── */}
          <div className="ai-row">
            <div className="ai-label" style={{ fontWeight:700, color:"#f97316" }}>
              ✦ {tt("ai.interests")} <span style={{ fontSize:11, fontWeight:400, color:"#9ca3af" }}>({tt("ai.select_all")})</span>
            </div>
            <div className="ai-chips-row ai-chips-wrap">
              {[["Beaches","🏖"],["Mountains","⛰"],["Historic","🏛"],["Desert","🏜"],["Adventure","🎯"]].map(([i, emoji]) => (
                <button key={i} className={chip(interests.includes(i))} onClick={() => toggleInterest(i)}
                  style={{ position:"relative" }}>
                  {emoji} {tt(`ai.int.${i}`)}
                  {interests.includes(i) && (
                    <span style={{ position:"absolute", top:-6, right:-6, background:"#f97316", color:"white", borderRadius:"50%", width:16, height:16, fontSize:10, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Show what each interest maps to */}
          {interests.length > 0 && (
            <div style={{ margin:"0 0 16px 0", padding:"10px 14px", background:"rgba(249,115,22,0.08)", borderRadius:12, borderLeft:"3px solid #f97316" }}>
              <div style={{ fontSize:12, color:"#92400e", fontWeight:600, marginBottom:4 }}>{tt("ai.will_include")}</div>
              {interests.map(i => (
                <div key={i} style={{ fontSize:12, color:"#78350f", marginTop:2 }}>
                  • <strong>{tt(`ai.int.${i}`)}</strong> → {tt(`ai.desc.${i}`)}
                </div>
              ))}
            </div>
          )}

          {noMatchMsg && !showResults && (
            <div style={{ padding:"8px 14px", background:"#fef3c7", borderRadius:10, fontSize:13, color:"#92400e", marginBottom:12 }}>
              ⚠ {noMatchMsg}
            </div>
          )}

          {/* ── Region ── */}
          <div className="ai-row">
            <div className="ai-label">{tt("ai.region")}</div>
            <div className="ai-dropdown">
              <select value={region} onChange={(e) => setRegion(e.target.value)} className="ai-select">
                <option value="All Regions">{tt("ai.all_regions")}</option>
                <option value="Muscat">{tv("Muscat")}</option>
                <option value="Dhofar">{tv("Dhofar")}</option>
                <option value="Al Dakhiliya">{tv("Al Dakhiliya")}</option>
                <option value="Al Sharqiya">{tv("Al Sharqiya")}</option>
                <option value="Musandam">{tv("Musandam")}</option>
                <option value="Al Buraimi">{tv("Al Buraimi")}</option>
              </select>
            </div>
          </div>

          {/* ── Duration ── */}
          <div className="ai-row">
            <div className="ai-label">{tt("ai.duration")}</div>
            <div className="ai-chips-row">
              {["1–2 days","3–5 days","1 Week"].map(d => (
                <button key={d} className={chip(duration===d)} onClick={() => setDuration(d)}>{tt(`ai.dur.${d}`)}</button>
              ))}
            </div>
          </div>

          {/* ── Budget ── */}
          <div className="ai-row">
            <div className="ai-label">{tt("ai.budget")}</div>
            <div className="ai-chips-row">
              {["Low","Medium","High"].map(b => (
                <button key={b} className={chip(budget===b)} onClick={() => setBudget(b)}>{tt(`opt.${b}`)}</button>
              ))}
            </div>
          </div>

          {/* ── Travel Type ── */}
          <div className="ai-row">
            <div className="ai-label">{tt("trip.travel_type")}</div>
            <div className="ai-chips-row">
              {["Solo","Family","Friends","Couple"].map(x => (
                <button key={x} className={chip(travelType===x)} onClick={() => setTravelType(x)}>{tt(`opt.${x}`)}</button>
              ))}
            </div>
          </div>

          <div className="ai-generate-wrapper">
            <button className={`ai-generate-btn ${isLoading ? "loading" : ""}`} onClick={handleGenerate}
              disabled={isLoading} style={{ position:"relative", overflow:"hidden" }}>
              {isLoading ? tt("ai.generating") : `✨ ${tt("ai.generate")}`}
              {isLoading && (
                <div style={{ position:"absolute", bottom:0, left:0, height:4, width:`${progress}%`, background:"#1d4ed8", transition:"width 0.08s linear" }} />
              )}
            </button>
          </div>
        </section>

        {/* ── Results ── */}
        {showResults && itinerary && (
          <section className="ai-results-card">
            <h2 className="ai-section-title">
              🗺 {tt("ai.result")}
            </h2>

            {/* Summary bar */}
            {summary && (
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:20 }}>
                {[
                  ["📅", `${summary.days} ${tt("prof.days")}`],
                  ["📍", tv(summary.region)],
                  ["💰", `${tt(`opt.${summary.budget}`)} ${tt("ai.budget_word")}`],
                  ["👥", tt(`opt.${summary.travel_type}`)],
                  ["🏷", `~${parseFloat(summary.estimated_cost_omr||0).toFixed(3)} ${tt("common.omr")}`],
                ].map(([icon, label]) => (
                  <span key={label} style={{ padding:"4px 12px", background:"#f3f4f6", borderRadius:999, fontSize:12, fontWeight:600, color:"#374151" }}>
                    {icon} {label}
                  </span>
                ))}
                {summary.interests?.map(i => (
                  <span key={i} style={{ padding:"4px 12px", background:"#fff7ed", borderRadius:999, fontSize:12, fontWeight:600, color:"#c2410c", border:"1px solid #fed7aa" }}>
                    {tt(`ai.int.${i}`)}
                  </span>
                ))}
              </div>
            )}

            {noMatchMsg && (
              <div style={{ padding:"8px 14px", background:"#fef3c7", borderRadius:10, fontSize:13, color:"#92400e", marginBottom:16 }}>
                ℹ {noMatchMsg}
              </div>
            )}

            {itinerary.map((day, di) => (
              <div key={di}>
                <div style={{ background:"#f97316", color:"white", display:"inline-flex", alignItems:"center", gap:6, padding:"5px 18px", borderRadius:999, fontWeight:700, fontSize:14, marginBottom:14 }}>
                  📅 {tt("ai.day")} {day.day}
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:24 }}>
                  {day.stops.map((stop, si) => {
                    const rawName = stop.destination?.name || stop.custom_place;
                    const name = stop.destination ? tv(rawName) : (rawName === "Lunch / Local Restaurant" ? tt("trip.lunch") : rawName);
                    const area = tv(stop.destination?.area || stop.destination?.region || "");
                    const cat  = stop.destination?.category;
                    const catStyle = CAT_COLOR[cat] || { bg:"#f3f4f6", color:"#374151", icon:"📌" };
                    const isBreak = !stop.destination;
                    const img = getImg(rawName);
                    return (
                      <div key={si} style={{ display:"flex", alignItems:"center", gap:14, background:"white", borderRadius:16, padding:"12px 16px", boxShadow:"0 4px 14px rgba(0,0,0,0.07)", border:"1px solid #f3f4f6" }}>
                        {/* Time badge */}
                        <div style={{ background:"#f97316", color:"white", borderRadius:999, padding:"6px 12px", fontSize:12, fontWeight:700, whiteSpace:"nowrap", minWidth:72, textAlign:"center", flexShrink:0 }}>
                          {stop.time}
                        </div>

                        {/* Image or emoji */}
                        {isBreak
                          ? <div style={{ width:52, height:52, borderRadius:12, background:"#fef3c7", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>🍽</div>
                          : <img src={img} alt={name} style={{ width:52, height:52, borderRadius:12, objectFit:"cover", flexShrink:0 }} />
                        }

                        {/* Info */}
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:700, fontSize:14, color:"#111827" }}>{name}</div>
                          {area && <div style={{ fontSize:12, color:"#9ca3af", marginTop:1 }}>📍 {area}</div>}
                          {stop.notes && <div style={{ fontSize:11, color:"#6b7280", marginTop:2, fontStyle:"italic" }}>{stop.notes}</div>}
                        </div>

                        {/* Right side: category + duration */}
                        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, flexShrink:0 }}>
                          {cat && (
                            <span style={{ padding:"2px 8px", borderRadius:999, fontSize:11, fontWeight:600, background:catStyle.bg, color:catStyle.color }}>
                              {catStyle.icon} {tv(cat)}
                            </span>
                          )}
                          <span style={{ fontSize:11, color:"#9ca3af" }}>⏱ {stop.duration}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {di < itinerary.length - 1 && <hr className="ai-divider" />}
              </div>
            ))}

            {savedMsg && (
              <p style={{ color: savedMsg.startsWith("✓") ? "#16a34a" : "#ef4444", textAlign:"center", fontWeight:600, margin:"12px 0", fontSize:14 }}>{savedMsg}</p>
            )}
            <div className="ai-results-buttons">
              <button className="ai-secondary-btn" onClick={handleSaveTrip} disabled={saving}>
                {saving ? tt("trip.saving") : `💾 ${tt("trip.save_btn")}`}
              </button>
              <button className="ai-secondary-btn" onClick={() => { setShowResults(false); setItinerary(null); setSavedMsg(""); setNoMatchMsg(""); }}>
                🔄 {tt("ai.edit")}
              </button>
              {savedMsg.startsWith("✓") && (
                <button className="ai-secondary-btn" onClick={() => onNavigate("profile")} style={{ background:"#f97316", color:"white", border:"none" }}>
                  {tt("ai.view_profile")} →
                </button>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
export default AiTripGenerator;

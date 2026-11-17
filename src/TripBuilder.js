// src/TripBuilder.js  – fully working trip builder
import React, { useState, useEffect } from "react";
import "./styles/TripBuilder.css";
import homeTop from "./Images/home1.jpg";
import { FaArrowLeft, FaRegCalendarAlt, FaTrash, FaPlus } from "react-icons/fa";
import { tripsAPI } from "./services/api";
import { useLang } from "./i18n/LanguageContext";
import { Stars } from "./Destinations";

const TIMES = ["7:00 AM","8:00 AM","9:00 AM","10:00 AM","11:00 AM","12:00 PM",
               "1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM","6:00 PM","7:00 PM"];
const DURATIONS = ["30 min","1 hr","1.5 hr","2 hr","3 hr","4 hr"];
const TRANSPORT_COST = { Low: 10, Medium: 25, High: 50 };

function TripBuilder({ destination, onBack = () => {}, onNavigate = () => {} }) {
  const { t: tt, tv } = useLang();
  const [tripDate, setTripDate]     = useState("");
  const [tripTitle, setTripTitle]   = useState("");
  const [budgetLevel, setBudgetLevel] = useState("Low");
  const [travelType, setTravelType] = useState("Solo");
  const [notes, setNotes]           = useState("");
  const [stops, setStops]           = useState([]);
  const [saveMsg, setSaveMsg]       = useState("");
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    if (!destination) return;
    setTripTitle(tt("trip.title_default", { name: tv(destination.name) }));
    setStops([
      { time: "8:00 AM", place: destination.name, duration: "2 hr", destination_id: destination.id || null, entry_fee: destination.entry_fee || 5 },
      { time: "11:00 AM", place: tt("trip.free_time"), duration: "1.5 hr", destination_id: null, entry_fee: 0 },
      { time: "1:00 PM", place: tt("trip.lunch"), duration: "1 hr", destination_id: null, entry_fee: 0 },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination]);

  if (!destination) {
    return (
      <div className="trip-page page-transition">
        <div className="trip-bg" style={{ backgroundImage: `url(${homeTop})` }} />
        <div className="trip-overlay" style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ color:"white", textAlign:"center" }}>
            <p style={{ fontSize:"1.2rem" }}>{tt("det.no_selected")}</p>
            <button className="save-trip-btn" style={{ marginTop:16 }} onClick={() => onNavigate("destinations")}>{tt("trip.browse")}</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Calculated budget ──────────────────────────────────────
  const ticketsCost = stops.reduce((sum, s) => sum + (parseFloat(s.entry_fee) || 0), 0);
  const transportCost = TRANSPORT_COST[budgetLevel] || 10;
  const totalCost = ticketsCost + transportCost;

  // ── Stop editing ───────────────────────────────────────────
  const updateStop = (index, field, value) => {
    setStops(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };
  const addStop = () => {
    setStops(prev => [...prev, { time: "12:00 PM", place: "", duration: "1 hr", destination_id: null, entry_fee: 0 }]);
  };
  const removeStop = (index) => {
    setStops(prev => prev.filter((_, i) => i !== index));
  };

  // ── Save to backend ────────────────────────────────────────
  const handleSaveTrip = async () => {
    if (!tripTitle.trim()) { setSaveMsg(tt("trip.err_title")); return; }
    setSaveMsg(""); setSaving(true);
    try {
      const res = await tripsAPI.create({
        title: tripTitle,
        trip_date: tripDate,
        duration_days: 1,
        budget_level: budgetLevel,
        travel_type: travelType,
        total_cost_omr: totalCost,
        notes,
        stops: stops.map((s, i) => ({
          stop_order: i + 1,
          destination_id: s.destination_id || null,
          custom_place: s.destination_id ? null : s.place,
          arrival_time: s.time,
          duration_hours: parseFloat(s.duration) || 1,
        })),
      });
      if (res.success) {
        setSaveMsg(tt("trip.saved"));
      } else {
        setSaveMsg(res.message || tt("trip.err_save"));
      }
    } catch {
      setSaveMsg(tt("common.error_connect"));
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="trip-page">
      <div className="trip-bg" style={{ backgroundImage: `url(${homeTop})` }} />
      <div className="trip-overlay">
        <button className="trip-back-btn" onClick={onBack}><FaArrowLeft /></button>

        <section className="trip-layout">
          {/* ── Destination hero card ── */}
          <div className="trip-main-card">
            <div className="trip-main-card-header">
              <div>
                <h2 className="trip-dest-title">{tv(destination.name)}</h2>
                <p className="trip-dest-area">{tv(destination.area)}</p>
                <div className="trip-dest-stars">
                  <Stars rating={destination.rating || 5} />
                </div>
              </div>
            </div>
            <img src={destination.image} alt={tv(destination.name)} className="trip-main-image" />
          </div>

          {/* ── Trip details ── */}
          <div className="trip-card" style={{ marginBottom: 24 }}>
            <h3 className="trip-card-title">{tt("trip.details")}</h3>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:12 }}>
              <div>
                <label style={{ fontSize:13, color:"#6b7280", display:"block", marginBottom:4 }}>{tt("trip.title")}</label>
                <input
                  value={tripTitle}
                  onChange={(e) => setTripTitle(e.target.value)}
                  style={{ width:"100%", padding:"10px 14px", borderRadius:12, border:"1px solid #e5e7eb", fontSize:14, outline:"none", boxSizing:"border-box" }}
                  placeholder={tt("trip.title_ph")}
                />
              </div>
              <div>
                <label style={{ fontSize:13, color:"#6b7280", display:"block", marginBottom:4 }}>{tt("trip.date")}</label>
                <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", borderRadius:12, border:"1px solid #e5e7eb", background:"white", boxSizing:"border-box" }}>
                  <FaRegCalendarAlt style={{ color:"#f97316", flexShrink:0 }} />
                  <input
                    type="date"
                    value={tripDate}
                    onChange={(e) => setTripDate(e.target.value)}
                    style={{ flex:1, border:"none", outline:"none", fontSize:14, background:"transparent", cursor:"pointer", minWidth:0 }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize:13, color:"#6b7280", display:"block", marginBottom:4 }}>{tt("trip.budget_level")}</label>
                <select value={budgetLevel} onChange={(e) => setBudgetLevel(e.target.value)}
                  style={{ width:"100%", padding:"10px 14px", borderRadius:12, border:"1px solid #e5e7eb", fontSize:14, outline:"none" }}>
                  <option value="Low">{tt("opt.Low")}</option><option value="Medium">{tt("opt.Medium")}</option><option value="High">{tt("opt.High")}</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize:13, color:"#6b7280", display:"block", marginBottom:4 }}>{tt("trip.travel_type")}</label>
                <select value={travelType} onChange={(e) => setTravelType(e.target.value)}
                  style={{ width:"100%", padding:"10px 14px", borderRadius:12, border:"1px solid #e5e7eb", fontSize:14, outline:"none" }}>
                  <option value="Solo">{tt("opt.Solo")}</option><option value="Family">{tt("opt.Family")}</option><option value="Friends">{tt("opt.Friends")}</option><option value="Couple">{tt("opt.Couple")}</option>
                </select>
              </div>
            </div>
            <label style={{ fontSize:13, color:"#6b7280", display:"block", marginBottom:4 }}>{tt("trip.notes")}</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={tt("trip.notes_ph")}
              style={{ width:"100%", padding:"10px 14px", borderRadius:12, border:"1px solid #e5e7eb", fontSize:14, outline:"none", resize:"vertical", minHeight:60, boxSizing:"border-box" }} />
          </div>

          <div className="trip-bottom-grid">
            {/* ── Stops builder ── */}
            <div className="trip-card">
              <h3 className="trip-card-title">{tt("trip.schedule")}</h3>
              {stops.map((stop, index) => (
                <div key={index} style={{ display:"grid", gridTemplateColumns:"120px 1fr 100px 36px", gap:10, alignItems:"center", marginBottom:10 }}>
                  <select value={stop.time} onChange={(e) => updateStop(index, "time", e.target.value)}
                    style={{ padding:"10px 8px", borderRadius:999, border:"none", background:"#f97316", color:"white", fontWeight:600, fontSize:13, cursor:"pointer", textAlign:"center" }}>
                    {TIMES.map(t => <option key={t}>{t}</option>)}
                  </select>
                  <input
                    value={stop.place}
                    onChange={(e) => updateStop(index, "place", e.target.value)}
                    placeholder={tt("trip.place_ph")}
                    style={{ padding:"10px 16px", borderRadius:999, border:"none", background:"white", boxShadow:"0 4px 12px rgba(0,0,0,0.1)", fontSize:13, outline:"none" }}
                  />
                  <select value={stop.duration} onChange={(e) => updateStop(index, "duration", e.target.value)}
                    style={{ padding:"10px 8px", borderRadius:999, border:"none", background:"#f97316", color:"white", fontWeight:600, fontSize:13, cursor:"pointer", textAlign:"center" }}>
                    {DURATIONS.map(d => <option key={d}>{d}</option>)}
                  </select>
                  <button onClick={() => removeStop(index)}
                    style={{ width:36, height:36, borderRadius:"50%", border:"none", background:"#fee2e2", color:"#ef4444", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <FaTrash size={13} />
                  </button>
                </div>
              ))}
              <button className="trip-add-destination-btn" onClick={addStop} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                <FaPlus size={12} /> {tt("trip.add_stop")}
              </button>
            </div>

            {/* ── Budget ── */}
            <div className="trip-card">
              <h3 className="trip-card-title">{tt("trip.budget_est")}</h3>
              <div className="budget-row"><span>{tt("trip.transport", { level: tt(`opt.${budgetLevel}`) })}</span><span>{transportCost} {tt("common.omr")}</span></div>
              <div className="budget-row"><span>{tt("trip.tickets")}</span><span>{ticketsCost.toFixed(3)} {tt("common.omr")}</span></div>
              <div className="budget-row budget-row-total"><span>{tt("trip.total")}</span><span>{totalCost.toFixed(3)} {tt("common.omr")}</span></div>

              {saveMsg && (
                <p style={{ color: saveMsg.startsWith("✓") ? "#16a34a" : "#ef4444", fontSize:"0.85rem", textAlign:"center", margin:"12px 0 0", fontWeight:600 }}>{saveMsg}</p>
              )}
              <button className="save-trip-btn" onClick={handleSaveTrip} disabled={saving} style={{ opacity: saving ? 0.7 : 1, marginTop:16 }}>
                {saving ? tt("trip.saving") : tt("trip.save_btn")}
              </button>
              {saveMsg.startsWith("✓") && (
                <button onClick={() => onNavigate("profile")}
                  style={{ width:"60%", margin:"10px auto 0", display:"block", padding:"10px", borderRadius:25, background:"transparent", border:"2px solid #f97316", color:"#f97316", fontWeight:600, cursor:"pointer" }}>
                  View in Profile →
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
export default TripBuilder;

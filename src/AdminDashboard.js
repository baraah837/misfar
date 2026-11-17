// src/AdminDashboard.js  — Full admin dashboard (self-contained, no adminAPI import needed)
import React, { useState, useEffect, useCallback } from "react";
import AdminBusiness from "./AdminBusiness";
import {
  FaUsers, FaMapMarkerAlt, FaStar, FaSuitcase, FaChartBar,
  FaCheck, FaTimes, FaTrash, FaEdit, FaPlus, FaSearch,
  FaToggleOn, FaToggleOff, FaSignOutAlt, FaBell,
} from "react-icons/fa";

// ── Self-contained API helpers (no external import needed) ────
const BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const tok  = () => localStorage.getItem("misfar_token");
const go   = async (path, opts = {}) => {
  const h = { "Content-Type": "application/json" };
  if (tok()) h["Authorization"] = `Bearer ${tok()}`;
  const r = await fetch(`${BASE}${path}`, { ...opts, headers: { ...h, ...(opts.headers||{}) } });
  return r.json();
};
const api = {
  analytics:          () => go("/admin/analytics"),
  users:              (q="") => go(`/admin/users${q?`?search=${encodeURIComponent(q)}`:""}`),
  toggleUser:         (id) => go(`/admin/users/${id}/toggle`, { method:"PUT" }),
  resetPassword:      (id, newPassword) => go(`/admin/users/${id}/reset-password`, { method:"PUT", body: JSON.stringify({ newPassword }) }),
  destinations:       () => go("/destinations?limit=50"),
  createDest: async (formData) => {
    const r = await fetch(`${BASE}/destinations`, { method:"POST", headers:{ Authorization:`Bearer ${tok()}` }, body: formData });
    return r.json();
  },
  updateDest:         (id,d) => go(`/destinations/${id}`, { method:"PUT", body: JSON.stringify(d) }),
  deleteDest:         (id) => go(`/destinations/${id}`, { method:"DELETE" }),
  reviews:            (s="pending") => go(`/admin/reviews?status=${s}&limit=50`),
  moderateReview:     (id,s) => go(`/admin/reviews/${id}`, { method:"PUT", body: JSON.stringify({ status:s }) }),
  sendNotif:          (title,message) => go("/admin/notifications", { method:"POST", body: JSON.stringify({ title, message }) }),
  // Activities
  getActivities:      () => go("/activities"),
  createActivity:     (d) => go("/activities", { method:"POST", body: JSON.stringify(d) }),
  updateActivity:     (id,d) => go(`/activities/${id}`, { method:"PUT", body: JSON.stringify(d) }),
  deleteActivity:     (id) => go(`/activities/${id}`, { method:"DELETE" }),
};

/* ── colour tokens ── */
const C = {
  bg:"#0f172a", sidebar:"#1e293b", card:"#1e293b", border:"#334155",
  orange:"#f97316", text:"#f1f5f9", muted:"#94a3b8",
  green:"#22c55e", red:"#ef4444", yellow:"#eab308", blue:"#3b82f6",
};

/* ── tiny UI helpers ── */
const Card = ({ children, style={} }) => (
  <div style={{ background:C.card, borderRadius:16, padding:20, border:`1px solid ${C.border}`, ...style }}>{children}</div>
);
const Badge = ({ children, color=C.orange }) => (
  <span style={{ padding:"2px 10px", borderRadius:999, fontSize:11, fontWeight:700, background:color+"22", color, border:`1px solid ${color}44` }}>{children}</span>
);
const Btn = ({ children, onClick, color=C.orange, small, disabled, style={} }) => (
  <button onClick={onClick} disabled={disabled} style={{ padding:small?"5px 12px":"9px 20px", borderRadius:999, border:"none", cursor:disabled?"default":"pointer", background:color, color:"white", fontWeight:600, fontSize:small?12:13, opacity:disabled?0.5:1, display:"inline-flex", alignItems:"center", gap:5, transition:"opacity 0.15s", ...style }}>
    {children}
  </button>
);
const Inp = ({ value, onChange, placeholder, style={} }) => (
  <input value={value} onChange={onChange} placeholder={placeholder}
    style={{ padding:"9px 14px", borderRadius:10, border:`1px solid ${C.border}`, background:C.bg, color:C.text, fontSize:13, outline:"none", width:"100%", boxSizing:"border-box", ...style }} />
);
const Sel = ({ value, onChange, children, style={} }) => (
  <select value={value} onChange={onChange}
    style={{ padding:"9px 14px", borderRadius:10, border:`1px solid ${C.border}`, background:C.bg, color:C.text, fontSize:13, outline:"none", cursor:"pointer", ...style }}>
    {children}
  </select>
);
const Th = ({ children }) => (
  <th style={{ padding:"10px 14px", textAlign:"left", fontSize:12, fontWeight:700, color:C.muted, borderBottom:`1px solid ${C.border}`, whiteSpace:"nowrap" }}>{children}</th>
);
const Td = ({ children, style={} }) => (
  <td style={{ padding:"10px 14px", fontSize:13, color:C.text, borderBottom:`1px solid ${C.border}22`, verticalAlign:"middle", ...style }}>{children}</td>
);

/* ══════════════════════════════════════════════════════════ */
export default function AdminDashboard({ onNavigate = () => {} }) {
  const [tab, setTab]       = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast]   = useState("");

  const [analytics, setAnalytics]         = useState(null);
  const [users, setUsers]                 = useState([]);
  const [userSearch, setUserSearch]       = useState("");
  const [destinations, setDestinations]   = useState([]);
  const [reviews, setReviews]             = useState([]);
  const [reviewStatus, setReviewStatus]   = useState("pending");

  const emptyDest = { name:"", area:"", region:"Muscat", category:"Historic", overview:"", opening_hours:"", entry_fee:0, map_link:"", latitude:"", longitude:"", is_active:true };
  const [destForm, setDestForm]           = useState(emptyDest);
  const [destPhotoFile, setDestPhotoFile] = useState(null);
  const [destPhotoPreview, setDestPhotoPreview] = useState(null);
  const [editingDest, setEditingDest]     = useState(null);
  const [showDestForm, setShowDestForm]   = useState(false);
  const [notifTitle, setNotifTitle]       = useState("");
  const [notifMsg, setNotifMsg]           = useState("");

  // Activities state
  const [activities, setActivities]       = useState([]);
  const emptyAct = { title:"", location:"", region:"Muscat", start_date:"", end_date:"", description:"", is_active:true };
  const [actForm, setActForm]             = useState(emptyAct);
  const [editingAct, setEditingAct]       = useState(null);
  const [showActForm, setShowActForm]     = useState(false);

  // Reset password modal
  const [resetUser, setResetUser]         = useState(null); // { id, username }
  const [newPassword, setNewPassword]     = useState("");
  const [resetMsg, setResetMsg]           = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const loadAnalytics    = useCallback(async () => { try { const r = await api.analytics();    if(r.success) setAnalytics(r.data); } catch {} }, []);
  const loadUsers        = useCallback(async () => { try { const r = await api.users(userSearch); if(r.success) setUsers(r.data); } catch {} }, [userSearch]);
  const loadDestinations = useCallback(async () => { try { const r = await api.destinations(); if(r.success) setDestinations(r.data); } catch {} }, []);
  const loadReviews      = useCallback(async () => { try { const r = await api.reviews(reviewStatus); if(r.success) setReviews(r.data); } catch {} }, [reviewStatus]);
  const loadActivities   = useCallback(async () => { try { const r = await api.getActivities(); if(r.success) setActivities(r.data); } catch {} }, []);

  useEffect(() => {
    if (tab==="dashboard")    loadAnalytics();
    else if (tab==="users")   loadUsers();
    else if (tab==="destinations") loadDestinations();
    else if (tab==="reviews") loadReviews();
    else if (tab==="activities") loadActivities();
  }, [tab, loadAnalytics, loadUsers, loadDestinations, loadReviews, loadActivities]);

  const handleToggleUser = async (id) => {
    const r = await api.toggleUser(id);
    if (r.success) { setUsers(p => p.map(u => u.id===id ? {...u, is_active:!u.is_active} : u)); showToast(r.message); }
  };

const handleSaveDest = async () => {
 let r;
 if (editingDest) {
   const d = {
     ...destForm,
     entry_fee: parseFloat(destForm.entry_fee) || 0,
     latitude: parseFloat(destForm.latitude) || null,
     longitude: parseFloat(destForm.longitude) || null,
   };
   r = await api.updateDest(editingDest.id, d);
 } else {
   const fd = new FormData();
   Object.entries(destForm).forEach(([k, v]) => fd.append(k, v));
   if (destPhotoFile) fd.append("photos", destPhotoFile);
   r = await api.createDest(fd);
 }
 if (r.success) {
   showToast(editingDest ? "Destination updated!" : "Destination created!");
   if (!editingDest) {
     const createNotif = await go("/admin/notifications", {
       method: "POST",
       body: JSON.stringify({
         title: "New Destination Added!",
         message: `${destForm.name} has been added to Misfar. Explore it now!`,
         type: "destination",
         target_all: true,
       }),
     });
     if (createNotif.success) {
       await go(`/admin/notifications/${createNotif.data.id}/send`, {
         method: "POST",
       });
     }
   }
   setShowDestForm(false);
   setEditingDest(null);
   setDestForm(emptyDest);
   setDestPhotoFile(null);
   setDestPhotoPreview(null);
   loadDestinations();
 } else {
   showToast(r.message || "Error saving.");
 }
};

  const handleDeleteDest = async (id) => {
    if (!window.confirm("Deactivate this destination?")) return;
    const r = await api.deleteDest(id);
    if (r.success) { showToast("Destination deactivated."); loadDestinations(); }
  };

  const handleEditDest = (dest) => {
    setEditingDest(dest);
    setDestForm({ name:dest.name, area:dest.area, region:dest.region, category:dest.category, overview:dest.overview||"", opening_hours:dest.opening_hours||"", entry_fee:dest.entry_fee||0, map_link:dest.map_link||"", latitude:dest.latitude||"", longitude:dest.longitude||"", is_active:dest.is_active });
    setDestPhotoFile(null); setDestPhotoPreview(dest.primary_photo || null);
    setShowDestForm(true);
    setTimeout(() => document.getElementById("dest-form-top")?.scrollIntoView({ behavior:"smooth" }), 100);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setDestPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setDestPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  // Activities handlers
  const handleSaveAct = async () => {
 const r = editingAct
   ? await api.updateActivity(editingAct.id, actForm)
   : await api.createActivity(actForm);
 if (r.success) {
   showToast(editingAct ? "Activity updated!" : "Activity created!");
   // Send automatic notification only when adding a new activity
   if (!editingAct) {
     const createNotif = await go("/admin/notifications", {
       method: "POST",
       body: JSON.stringify({
         title: "New Activity Added!",
         message: `${actForm.title} has been added to Misfar. Check it out now!`,
         type: "activity",
         target_all: true,
       }),
     });
     if (createNotif.success) {
       await go(`/admin/notifications/${createNotif.data.id}/send`, {
         method: "POST",
       });
     }
   }
   setShowActForm(false);
   setEditingAct(null);
   setActForm(emptyAct);
   loadActivities();
 } else {
   showToast(r.message || "Error saving activity.");
 }
};

  const handleDeleteAct = async (id) => {
    if (!window.confirm("Deactivate this activity?")) return;
    const r = await api.deleteActivity(id);
    if (r.success) { showToast("Activity deactivated."); loadActivities(); }
  };

  const handleEditAct = (act) => {
    setEditingAct(act);
    setActForm({ title:act.title, location:act.location||"", region:act.region||"Muscat", start_date:act.start_date?.slice(0,10)||"", end_date:act.end_date?.slice(0,10)||"", description:act.description||"", is_active:act.is_active });
    setShowActForm(true);
  };

  const handleModerateReview = async (id, status) => {
    const r = await api.moderateReview(id, status);
    if (r.success) { showToast(`Review ${status}!`); setReviews(p => p.filter(rv => rv.id!==id)); }
  };

  const handleSendNotif = async () => {
 if (!notifTitle || !notifMsg) {
   showToast("Title and message required.");
   return;
 }
 // create notification
 const createRes = await go("/admin/notifications", {
   method: "POST",
   body: JSON.stringify({
     title: notifTitle,
     message: notifMsg,
   }),
 });
 if (!createRes.success) {
   showToast(createRes.message || "Error creating notification");
   return;
 }
 // send notification
 const notifId = createRes.data.id;
 const sendRes = await go(`/admin/notifications/${notifId}/send`, {
   method: "POST",
 });
 if (sendRes.success) {
   showToast("Notification sent to all users 🚀");
   setNotifTitle("");
   setNotifMsg("");
 } else {
   showToast(sendRes.message || "Error sending notification");
 }
};

  const handleResetPassword = async () => {
    setResetMsg("");
    if (!newPassword || newPassword.length < 8) {
      setResetMsg("Password must be at least 8 characters.");
      return;
    }
    const r = await api.resetPassword(resetUser.id, newPassword);
    if (r.success) {
      showToast(r.message);
      setResetUser(null);
      setNewPassword("");
      setResetMsg("");
    } else {
      setResetMsg(r.message || "Error resetting password.");
    }
  };

  const TABS = [
    { id:"dashboard",    label:"Dashboard",    icon:"📊" },
    { id:"users",        label:"Users",        icon:"👥" },
    { id:"destinations", label:"Destinations", icon:"📍" },
    { id:"reviews",      label:"Reviews",      icon:"⭐" },
    { id:"activities",   label:"Activities",   icon:"🎯" },
    { id:"notifications",label:"Notifications",icon:"🔔" },
    { id:"business",     label:"Business model",icon:"💼" },
  ];

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:C.bg, fontFamily:"Inter,system-ui,sans-serif", color:C.text }}>
      <style>{`
        *{box-sizing:border-box} table{border-collapse:collapse;width:100%}
        ::-webkit-scrollbar{width:6px} ::-webkit-scrollbar-track{background:${C.bg}} ::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        .aa{animation:fadeIn 0.25s ease}
      `}</style>

      <div className={`adm-backdrop ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen(false)} />
      {/* ── Sidebar ── */}
      <div className={`adm-sidebar ${menuOpen ? "open" : ""}`} style={{ width:220, background:C.sidebar, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", position:"fixed", top:0, left:0, bottom:0, zIndex:100 }}>
        <div style={{ padding:"20px 16px 12px", borderBottom:`1px solid ${C.border}` }}>
          <div style={{ fontSize:18, fontWeight:800, color:C.orange }}>🌍 Misfar</div>
          <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>Admin Dashboard</div>
        </div>
        <nav style={{ flex:1, padding:"12px 8px" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setMenuOpen(false); }}
              style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:10, border:"none", cursor:"pointer", background:tab===t.id?C.orange+"22":"transparent", color:tab===t.id?C.orange:C.muted, fontWeight:tab===t.id?700:500, fontSize:13, marginBottom:2, transition:"all 0.15s" }}>
              {t.icon} {t.label}
            </button>
          ))}
        </nav>
        <div style={{ padding:"12px 8px", borderTop:`1px solid ${C.border}` }}>
          <button onClick={() => onNavigate("home")}
            style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:10, border:"none", cursor:"pointer", background:"transparent", color:C.muted, fontSize:13 }}>
            ← Back to Site
          </button>
        </div>
      </div>

      {/* ── Main ── */}
      <div className="adm-main" style={{ marginLeft:220, flex:1, padding:28, overflowX:"hidden", minWidth:0 }}>
        <div className="adm-topbar"><button onClick={() => setMenuOpen(true)} aria-label="Menu">☰ Menu</button><strong style={{ color:C.orange }}>Misfar Admin</strong></div>

        {toast && (
          <div style={{ position:"fixed", top:20, right:20, background:C.green, color:"white", padding:"10px 20px", borderRadius:10, fontWeight:600, fontSize:13, zIndex:9999, boxShadow:"0 8px 24px rgba(0,0,0,0.3)" }}>
            ✓ {toast}
          </div>
        )}

        {/* ── DASHBOARD ── */}
        {tab==="dashboard" && (
          <div className="aa">
            <h2 style={{ marginBottom:24, fontSize:22, fontWeight:800 }}>📊 Dashboard Overview</h2>
            {!analytics ? <p style={{ color:C.muted }}>Loading...</p> : (
              <>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:16, marginBottom:24 }}>
                  {[
                    ["👥","Total Users",       analytics.users?.total,           C.blue],
                    ["🆕","New This Month",    analytics.users?.new_this_month,  C.green],
                    ["⚡","Active This Week",  analytics.users?.active_this_week,C.yellow],
                    ["📍","Destinations",      analytics.destinations?.total,    C.orange],
                    ["⭐","Total Reviews",     analytics.reviews?.total,         C.yellow],
                    ["⏳","Pending Reviews",   analytics.reviews?.pending,       C.red],
                    ["🗺","Total Trips",       analytics.trips?.total,           C.blue],
                    ["🤖","AI Trips",          analytics.trips?.ai_generated,    C.green],
                  ].map(([icon,label,value,color]) => (
                    <Card key={label} style={{ display:"flex", alignItems:"center", gap:14 }}>
                      <div style={{ fontSize:28 }}>{icon}</div>
                      <div>
                        <div style={{ fontSize:26, fontWeight:800, color }}>{value ?? "—"}</div>
                        <div style={{ fontSize:12, color:C.muted }}>{label}</div>
                      </div>
                    </Card>
                  ))}
                </div>

                {analytics.top_destinations?.length > 0 && (
                  <Card style={{ marginBottom:20 }}>
                    <h3 style={{ marginBottom:14, fontSize:15, fontWeight:700 }}>🔥 Most Visited Destinations</h3>
                    <table>
                      <thead><tr><Th>#</Th><Th>Destination</Th><Th>Region</Th><Th>Views</Th></tr></thead>
                      <tbody>
                        {analytics.top_destinations.map((d,i) => (
                          <tr key={i}>
                            <Td><span style={{ fontWeight:700, color:C.orange }}>{i+1}</span></Td>
                            <Td>{d.name}</Td>
                            <Td><Badge>{d.region}</Badge></Td>
                            <Td><strong>{d.view_count}</strong></Td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Card>
                )}

                {analytics.sentiment && (
                  <Card>
                    <h3 style={{ marginBottom:14, fontSize:15, fontWeight:700 }}>😊 Review Sentiment</h3>
                    <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
                      {[["Positive",analytics.sentiment.positive,C.green],["Neutral",analytics.sentiment.neutral,C.yellow],["Negative",analytics.sentiment.negative,C.red]].map(([l,v,c]) => (
                        <div key={l} style={{ textAlign:"center", padding:"12px 24px", background:c+"15", borderRadius:12, border:`1px solid ${c}33` }}>
                          <div style={{ fontSize:24, fontWeight:800, color:c }}>{v??0}</div>
                          <div style={{ fontSize:12, color:C.muted }}>{l}</div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Reset Password Modal ── */}
        {resetUser && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <div style={{ background:C.card, borderRadius:18, padding:28, width:360, border:`1px solid ${C.border}`, boxShadow:"0 24px 60px rgba(0,0,0,0.5)" }}>
              <h3 style={{ margin:"0 0 6px", fontSize:17, fontWeight:800 }}>🔑 Reset Password</h3>
              <p style={{ fontSize:13, color:C.muted, margin:"0 0 20px" }}>
                Setting a new password for <strong style={{ color:C.orange }}>{resetUser.username}</strong>. Their current session will be logged out.
              </p>
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:12, color:C.muted, marginBottom:6 }}>New Password</div>
                <Inp
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  style={{ letterSpacing: newPassword ? 3 : 0 }}
                />
                {/* Password strength indicator */}
                {newPassword.length > 0 && (
                  <div style={{ marginTop:6, display:"flex", gap:4 }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{ flex:1, height:4, borderRadius:2, background:
                        newPassword.length >= i * 3
                          ? newPassword.length < 8 ? C.red : newPassword.length < 12 ? C.yellow : C.green
                          : C.border
                      }} />
                    ))}
                    <span style={{ fontSize:11, color:C.muted, marginLeft:6 }}>
                      {newPassword.length < 8 ? "Too short" : newPassword.length < 12 ? "OK" : "Strong"}
                    </span>
                  </div>
                )}
              </div>
              {resetMsg && (
                <p style={{ fontSize:12, color:C.red, margin:"0 0 12px", fontWeight:600 }}>{resetMsg}</p>
              )}
              <div style={{ display:"flex", gap:10 }}>
                <Btn onClick={handleResetPassword} disabled={newPassword.length < 8}>
                  🔑 Reset Password
                </Btn>
                <Btn color="#475569" onClick={() => { setResetUser(null); setNewPassword(""); setResetMsg(""); }}>
                  Cancel
                </Btn>
              </div>
            </div>
          </div>
        )}

        {/* ── USERS ── */}
        {tab==="users" && (
          <div className="aa">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <h2 style={{ fontSize:22, fontWeight:800 }}>👥 User Management</h2>
              <div className="adm-search" style={{ display:"flex", gap:8, width:300 }}>
                <Inp value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search users..." />
                <Btn onClick={loadUsers}><FaSearch /></Btn>
              </div>
            </div>
            <Card>
              <table>
                <thead><tr><Th>User</Th><Th>Email</Th><Th>Location</Th><Th>Trips</Th><Th>Reviews</Th><Th>Last Login</Th><Th>Status</Th><Th>Action</Th></tr></thead>
                <tbody>
                  {users.length===0
                    ? <tr><td colSpan={8} style={{ textAlign:"center", padding:30, color:C.muted }}>No users found.</td></tr>
                    : users.map(u => (
                      <tr key={u.id}>
                        <Td><strong>{u.username}</strong></Td>
                        <Td style={{ color:C.muted }}>{u.email}</Td>
                        <Td style={{ color:C.muted }}>{u.location||"—"}</Td>
                        <Td><Badge color={C.blue}>{u.trips_count}</Badge></Td>
                        <Td><Badge color={C.yellow}>{u.reviews_count}</Badge></Td>
                        <Td style={{ color:C.muted, fontSize:12 }}>{u.last_login ? new Date(u.last_login).toLocaleDateString() : "Never"}</Td>
                        <Td><Badge color={u.is_active?C.green:C.red}>{u.is_active?"Active":"Banned"}</Badge></Td>
                        <Td>
                          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                            <Btn small color={u.is_active?C.red:C.green} onClick={() => handleToggleUser(u.id)}>
                              {u.is_active ? <><FaToggleOff /> Ban</> : <><FaToggleOn /> Unban</>}
                            </Btn>
                            <Btn small color="#7c3aed" onClick={() => { setResetUser({ id:u.id, username:u.username }); setNewPassword(""); setResetMsg(""); }}>
                              🔑 Reset PW
                            </Btn>
                          </div>
                        </Td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {/* ── DESTINATIONS ── */}
        {tab==="destinations" && (
          <div className="aa">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <h2 style={{ fontSize:22, fontWeight:800 }}>📍 Destinations</h2>
              <Btn onClick={() => { setEditingDest(null); setDestForm(emptyDest); setShowDestForm(v=>!v); }}>
                <FaPlus /> {showDestForm && !editingDest ? "Cancel" : "Add Destination"}
              </Btn>
            </div>

            {showDestForm && (
              <Card id="dest-form-top" style={{ marginBottom:24, border:`1px solid ${C.orange}44` }}>
                <h3 style={{ marginBottom:16, color:C.orange }}>{editingDest?"✏ Edit Destination":"➕ New Destination"}</h3>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }} className="adm-grid-2">
                  {[["name","Name *"],["area","Area *"]].map(([k,label]) => (
                    <div key={k}>
                      <div style={{ fontSize:12, color:C.muted, marginBottom:4 }}>{label}</div>
                      <Inp value={destForm[k]} onChange={e => setDestForm(p=>({...p,[k]:e.target.value}))} placeholder={label} />
                    </div>
                  ))}
                  <div>
                    <div style={{ fontSize:12, color:C.muted, marginBottom:4 }}>Region *</div>
                    <Sel value={destForm.region} onChange={e => setDestForm(p=>({...p,region:e.target.value}))}>
                      {["Muscat","Dhofar","Al Dakhiliya","Al Sharqiya","Musandam","Al Buraimi","Al Batinah"].map(r=><option key={r}>{r}</option>)}
                    </Sel>
                  </div>
                  <div>
                    <div style={{ fontSize:12, color:C.muted, marginBottom:4 }}>Category *</div>
                    <Sel value={destForm.category} onChange={e => setDestForm(p=>({...p,category:e.target.value}))}>
                      {["Historic","Nature","Adventure","Beach","Cultural","Religious"].map(c=><option key={c}>{c}</option>)}
                    </Sel>
                  </div>
                  {[["opening_hours","Opening Hours"],["entry_fee","Entry Fee (OMR)"],["map_link","Google Maps Link"],["latitude","Latitude"],["longitude","Longitude"]].map(([k,label]) => (
                    <div key={k}>
                      <div style={{ fontSize:12, color:C.muted, marginBottom:4 }}>{label}</div>
                      <Inp value={destForm[k]} onChange={e => setDestForm(p=>({...p,[k]:e.target.value}))} placeholder={label} />
                    </div>
                  ))}
                  <div style={{ gridColumn:"1 / -1" }}>
                    <div style={{ fontSize:12, color:C.muted, marginBottom:4 }}>Overview</div>
                    <textarea value={destForm.overview} onChange={e => setDestForm(p=>({...p,overview:e.target.value}))}
                      rows={3} placeholder="Destination description..."
                      style={{ width:"100%", padding:"9px 14px", borderRadius:10, border:`1px solid ${C.border}`, background:C.bg, color:C.text, fontSize:13, resize:"vertical", outline:"none", boxSizing:"border-box", fontFamily:"inherit" }} />
                  </div>
                  {/* Photo upload — only on create */}
                  {!editingDest && (
                    <div style={{ gridColumn:"1 / -1" }}>
                      <div style={{ fontSize:12, color:C.muted, marginBottom:4 }}>Destination Photo (optional)</div>
                      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                        <label style={{ padding:"8px 16px", borderRadius:10, border:`1px dashed ${C.orange}`, cursor:"pointer", fontSize:13, color:C.orange, fontWeight:600 }}>
                          📷 Choose Photo
                          <input type="file" accept="image/*" hidden onChange={handlePhotoChange} />
                        </label>
                        {destPhotoPreview && (
                          <img src={destPhotoPreview} alt="preview" style={{ width:60, height:60, borderRadius:10, objectFit:"cover", border:`2px solid ${C.orange}` }} />
                        )}
                        {destPhotoPreview && <span style={{ fontSize:12, color:C.green }}>✓ Photo selected</span>}
                      </div>
                    </div>
                  )}
                  {editingDest && (
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <input type="checkbox" checked={destForm.is_active} onChange={e => setDestForm(p=>({...p,is_active:e.target.checked}))} id="iac" />
                      <label htmlFor="iac" style={{ fontSize:13, color:C.text, cursor:"pointer" }}>Active (visible to users)</label>
                    </div>
                  )}
                </div>
                <div style={{ display:"flex", gap:10, marginTop:16 }}>
                  <Btn onClick={handleSaveDest}><FaCheck /> {editingDest?"Save Changes":"Create Destination"}</Btn>
                  <Btn color="#475569" onClick={() => { setShowDestForm(false); setEditingDest(null); setDestForm(emptyDest); }}>Cancel</Btn>
                </div>
              </Card>
            )}

            <Card>
              <table>
                <thead><tr><Th>Name</Th><Th>Area</Th><Th>Region</Th><Th>Category</Th><Th>Rating</Th><Th>Fee</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
                <tbody>
                  {destinations.length===0
                    ? <tr><td colSpan={8} style={{ textAlign:"center", padding:30, color:C.muted }}>No destinations.</td></tr>
                    : destinations.map(d => (
                      <tr key={d.id}>
                        <Td><strong>{d.name}</strong></Td>
                        <Td style={{ color:C.muted }}>{d.area}</Td>
                        <Td><Badge>{d.region}</Badge></Td>
                        <Td><Badge color={{Historic:C.yellow,Nature:C.green,Adventure:C.red,Beach:C.blue}[d.category]||C.muted}>{d.category}</Badge></Td>
                        <Td><span style={{ color:"#fbbf24" }}>★</span> {parseFloat(d.avg_rating||0).toFixed(1)}</Td>
                        <Td>{d.entry_fee>0?`${d.entry_fee} OMR`:<span style={{ color:C.green }}>Free</span>}</Td>
                        <Td><Badge color={d.is_active?C.green:C.red}>{d.is_active?"Active":"Hidden"}</Badge></Td>
                        <Td>
                          <div style={{ display:"flex", gap:6 }}>
                            <Btn small color={C.blue} onClick={() => handleEditDest(d)}><FaEdit /></Btn>
                            <Btn small color={C.red} onClick={() => handleDeleteDest(d.id)}><FaTrash /></Btn>
                          </div>
                        </Td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {/* ── REVIEWS ── */}
        {tab==="reviews" && (
          <div className="aa">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <h2 style={{ fontSize:22, fontWeight:800 }}>⭐ Review Moderation</h2>
              <div style={{ display:"flex", gap:8 }}>
                {["pending","approved","rejected","all"].map(s => (
                  <Btn key={s} small color={reviewStatus===s?C.orange:"#475569"} onClick={() => setReviewStatus(s)}>
                    {s.charAt(0).toUpperCase()+s.slice(1)}
                  </Btn>
                ))}
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {reviews.length===0
                ? <Card><p style={{ color:C.muted, textAlign:"center", padding:20 }}>No {reviewStatus} reviews.</p></Card>
                : reviews.map(r => (
                  <Card key={r.id}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, flexWrap:"wrap" }}>
                          <strong style={{ fontSize:14 }}>{r.username}</strong>
                          <span style={{ color:C.muted, fontSize:12 }}>→</span>
                          <Badge color={C.orange}>{r.destination_name}</Badge>
                          <div style={{ color:"#fbbf24" }}>{"★".repeat(r.rating)}{"☆".repeat(5-r.rating)}</div>
                          <Badge color={r.sentiment_label==="positive"?C.green:r.sentiment_label==="negative"?C.red:C.yellow}>{r.sentiment_label}</Badge>
                          <span style={{ fontSize:11, color:C.muted }}>{new Date(r.created_at).toLocaleDateString()}</span>
                        </div>
                        <p style={{ fontSize:13, color:"#cbd5e1", lineHeight:1.6, margin:0 }}>{r.comment}</p>
                      </div>
                      {reviewStatus==="pending"
                        ? <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                            <Btn small color={C.green} onClick={() => handleModerateReview(r.id,"approved")}><FaCheck /> Approve</Btn>
                            <Btn small color={C.red}   onClick={() => handleModerateReview(r.id,"rejected")}><FaTimes /> Reject</Btn>
                          </div>
                        : <Badge color={r.status==="approved"?C.green:C.red}>{r.status}</Badge>
                      }
                    </div>
                  </Card>
                ))
              }
            </div>
          </div>
        )}

        {/* ── ACTIVITIES ── */}
        {tab==="activities" && (
          <div className="aa">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <h2 style={{ fontSize:22, fontWeight:800 }}>🎯 Activities Management</h2>
              <Btn onClick={() => { setEditingAct(null); setActForm(emptyAct); setShowActForm(v=>!v); }}>
                <FaPlus /> {showActForm && !editingAct ? "Cancel" : "Add Activity"}
              </Btn>
            </div>

            {showActForm && (
              <Card style={{ marginBottom:24, border:`1px solid ${C.orange}44` }}>
                <h3 style={{ marginBottom:16, color:C.orange }}>{editingAct ? "✏ Edit Activity" : "➕ New Activity"}</h3>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }} className="adm-grid-2">
                  <div>
                    <div style={{ fontSize:12, color:C.muted, marginBottom:4 }}>Title *</div>
                    <Inp value={actForm.title} onChange={e => setActForm(p=>({...p,title:e.target.value}))} placeholder="Activity title" />
                  </div>
                  <div>
                    <div style={{ fontSize:12, color:C.muted, marginBottom:4 }}>Location</div>
                    <Inp value={actForm.location} onChange={e => setActForm(p=>({...p,location:e.target.value}))} placeholder="e.g. Muscat, Nizwa" />
                  </div>
                  <div>
                    <div style={{ fontSize:12, color:C.muted, marginBottom:4 }}>Region</div>
                    <Sel value={actForm.region} onChange={e => setActForm(p=>({...p,region:e.target.value}))}>
                      {["Muscat","Dhofar","Al Dakhiliya","Al Sharqiya","Musandam","Al Buraimi","Al Batinah","All Oman"].map(r=><option key={r}>{r}</option>)}
                    </Sel>
                  </div>
                  <div>
                    <div style={{ fontSize:12, color:C.muted, marginBottom:4 }}>Start Date</div>
                    <Inp value={actForm.start_date} onChange={e => setActForm(p=>({...p,start_date:e.target.value}))} placeholder="" style={{ colorScheme:"dark" }} />
                    <input type="date" value={actForm.start_date} onChange={e => setActForm(p=>({...p,start_date:e.target.value}))}
                      style={{ width:"100%", padding:"9px 14px", borderRadius:10, border:`1px solid ${C.border}`, background:C.bg, color:C.text, fontSize:13, outline:"none", marginTop:-36, position:"relative" }} />
                  </div>
                  <div>
                    <div style={{ fontSize:12, color:C.muted, marginBottom:4 }}>End Date</div>
                    <input type="date" value={actForm.end_date} onChange={e => setActForm(p=>({...p,end_date:e.target.value}))}
                      style={{ width:"100%", padding:"9px 14px", borderRadius:10, border:`1px solid ${C.border}`, background:C.bg, color:C.text, fontSize:13, outline:"none" }} />
                  </div>
                  {editingAct && (
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <input type="checkbox" checked={actForm.is_active} onChange={e => setActForm(p=>({...p,is_active:e.target.checked}))} id="act-active" />
                      <label htmlFor="act-active" style={{ fontSize:13, color:C.text, cursor:"pointer" }}>Active (visible to users)</label>
                    </div>
                  )}
                  <div style={{ gridColumn:"1 / -1" }}>
                    <div style={{ fontSize:12, color:C.muted, marginBottom:4 }}>Description</div>
                    <textarea value={actForm.description} onChange={e => setActForm(p=>({...p,description:e.target.value}))}
                      rows={3} placeholder="Describe the activity..."
                      style={{ width:"100%", padding:"9px 14px", borderRadius:10, border:`1px solid ${C.border}`, background:C.bg, color:C.text, fontSize:13, resize:"vertical", outline:"none", boxSizing:"border-box", fontFamily:"inherit" }} />
                  </div>
                </div>
                <div style={{ display:"flex", gap:10, marginTop:16 }}>
                  <Btn onClick={handleSaveAct}><FaCheck /> {editingAct ? "Save Changes" : "Create Activity"}</Btn>
                  <Btn color="#475569" onClick={() => { setShowActForm(false); setEditingAct(null); setActForm(emptyAct); }}>Cancel</Btn>
                </div>
              </Card>
            )}

            <Card>
              <table>
                <thead><tr><Th>Title</Th><Th>Location</Th><Th>Region</Th><Th>Start Date</Th><Th>End Date</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
                <tbody>
                  {activities.length===0
                    ? <tr><td colSpan={7} style={{ textAlign:"center", padding:30, color:C.muted }}>No activities yet. Add the first one!</td></tr>
                    : activities.map(a => (
                      <tr key={a.id}>
                        <Td><strong>{a.title}</strong></Td>
                        <Td style={{ color:C.muted }}>{a.location||"—"}</Td>
                        <Td><Badge>{a.region||"—"}</Badge></Td>
                        <Td style={{ color:C.muted, fontSize:12 }}>{a.start_date ? new Date(a.start_date).toLocaleDateString() : "—"}</Td>
                        <Td style={{ color:C.muted, fontSize:12 }}>{a.end_date ? new Date(a.end_date).toLocaleDateString() : "—"}</Td>
                        <Td><Badge color={a.is_active?C.green:C.red}>{a.is_active?"Active":"Hidden"}</Badge></Td>
                        <Td>
                          <div style={{ display:"flex", gap:6 }}>
                            <Btn small color={C.blue} onClick={() => handleEditAct(a)}><FaEdit /></Btn>
                            <Btn small color={C.red} onClick={() => handleDeleteAct(a.id)}><FaTrash /></Btn>
                          </div>
                        </Td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {/* ── NOTIFICATIONS ── */}
        {tab==="business" && <AdminBusiness C={C} />}

        {tab==="notifications" && (
          <div className="aa">
            <h2 style={{ fontSize:22, fontWeight:800, marginBottom:20 }}>🔔 Send Notification</h2>
            <Card style={{ maxWidth:600 }}>
              <p style={{ color:C.muted, fontSize:13, marginBottom:16 }}>Send a notification to all users of the platform.</p>
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:12, color:C.muted, marginBottom:4 }}>Title</div>
                <Inp value={notifTitle} onChange={e => setNotifTitle(e.target.value)} placeholder="e.g. New Destination Added!" />
              </div>
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:12, color:C.muted, marginBottom:4 }}>Message</div>
                <textarea value={notifMsg} onChange={e => setNotifMsg(e.target.value)} rows={4} placeholder="Write your message here..."
                  style={{ width:"100%", padding:"9px 14px", borderRadius:10, border:`1px solid ${C.border}`, background:C.bg, color:C.text, fontSize:13, resize:"vertical", outline:"none", boxSizing:"border-box", fontFamily:"inherit" }} />
              </div>
              <Btn onClick={handleSendNotif}><FaBell /> Send to All Users</Btn>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
}

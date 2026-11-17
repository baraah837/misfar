// src/AdminBusiness.js – admin panel for the business model (rendered as one tab inside AdminDashboard).
// Uses only the NEW /api/admin-biz endpoints.
import React, { useState, useEffect, useCallback } from "react";
import { bizAdminAPI as api } from "./services/businessApi";

const SUBTABS = [
  ["overview", "📈 Overview"], ["businesses", "🏨 Businesses"], ["plans", "💳 Plans"], ["subs", "🧾 Subscriptions"],
  ["bookings", "📅 Bookings & commission"], ["ads", "📣 Ads"], ["products", "🗺 Trip plans & orders"], ["learning", "🎓 Learning"], ["settings", "⚙ Settings"],
];

function useLoad(fn, deps = []) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const reload = useCallback(() => {
    setErr("");
    Promise.resolve(fn()).then((r) => { if (r.success) setData(r.data); else setErr(r.message || "Error"); }).catch(() => setErr("Cannot reach the server"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { reload(); }, [reload]);
  return [data, reload, err];
}

function AdminBusiness({ C }) {
  const [sub, setSub] = useState("overview");
  const S = {
    card: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, marginBottom: 14 },
    input: { width: "100%", padding: "9px 11px", borderRadius: 9, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 16, fontFamily: "inherit" },
    label: { display: "flex", flexDirection: "column", gap: 4, fontSize: 12.5, color: C.muted, fontWeight: 600 },
    btn: (color = C.orange) => ({ background: color, color: "#fff", border: 0, borderRadius: 8, padding: "8px 14px", fontWeight: 700, cursor: "pointer", fontSize: 13 }),
    th: { textAlign: "left", padding: "8px 10px", color: C.muted, fontSize: 12, borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" },
    td: { padding: "9px 10px", borderBottom: `1px solid ${C.border}`, fontSize: 13.5, verticalAlign: "top" },
    pill: (c) => ({ background: c + "33", color: c, borderRadius: 999, padding: "2px 9px", fontSize: 11.5, fontWeight: 700 }),
  };
  const money = (v) => `${Number(v || 0).toFixed(3)} OMR`;
  const Table = ({ head, children }) => (
    <div style={{ overflowX: "auto" }}><table><thead><tr>{head.map((h) => <th key={h} style={S.th}>{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div>
  );
  const Err = ({ e }) => (e ? <p style={{ color: C.red }}>{e}</p> : null);
  const statusColor = (s) => ({ approved: C.green, active: C.green, paid: C.green, completed: C.green, confirmed: C.blue, pending: C.yellow, pending_payment: C.yellow, rejected: C.red, suspended: C.red, cancelled: C.red, expired: C.muted, settled: C.green, due: C.yellow, none: C.muted }[s] || C.muted);

  /* ───────── generic form-based CRUD ───────── */
  function Editor({ title, crud, fields, columns, defaults = {}, transformOut, transformIn, onChanged }) {
    const [rows, reload, err] = useLoad(crud.list);
    const [form, setForm] = useState(null);
    const [msg, setMsg] = useState("");
    const start = (row) => setForm(row ? { ...defaults, ...(transformIn ? transformIn(row) : row), __id: row.id } : { ...defaults });
    const save = async (e) => {
      e.preventDefault(); setMsg("");
      const body = {}; fields.forEach((f) => { if (form[f.key] !== undefined) body[f.key] = form[f.key]; });
      const out = transformOut ? transformOut(body) : body;
      const r = form.__id ? await crud.update(form.__id, out) : await crud.create(out);
      if (r.success) { setForm(null); reload(); onChanged && onChanged(); } else setMsg(r.message || "Failed");
    };
    const del = async (row) => { if (!window.confirm("Delete this item?")) return; const r = await crud.remove(row.id); if (r.success) { reload(); onChanged && onChanged(); } else alert(r.message); };
    const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button style={S.btn()} onClick={() => start(null)}>＋ Add</button>
        </div>
        <Err e={err} />
        {form && (
          <form onSubmit={save} style={S.card}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10 }}>
              {fields.map((f) => (
                <label key={f.key} style={{ ...S.label, gridColumn: f.wide ? "1 / -1" : undefined }}>{f.label}
                  {f.type === "textarea" ? <textarea rows={f.rows || 3} style={S.input} value={form[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} />
                    : f.type === "select" ? <select style={S.input} value={form[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)}>{f.options.map((o) => <option key={o.v ?? o} value={o.v ?? o}>{o.l ?? o}</option>)}</select>
                    : f.type === "checkbox" ? <input type="checkbox" checked={!!form[f.key]} onChange={(e) => set(f.key, e.target.checked)} style={{ width: 20, height: 20 }} />
                    : <input style={S.input} type={f.type || "text"} step={f.type === "number" ? "any" : undefined} value={form[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} />}
                </label>
              ))}
            </div>
            {msg && <p style={{ color: C.red }}>{msg}</p>}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}><button style={S.btn(C.green)}>Save</button><button type="button" style={S.btn(C.border)} onClick={() => setForm(null)}>Cancel</button></div>
          </form>
        )}
        <div style={S.card}>
          {rows === null ? "Loading…" : rows.length === 0 ? <span style={{ color: C.muted }}>Nothing yet.</span> : (
            <Table head={[...columns.map((c) => c.label), ""]}>
              {rows.map((r) => (
                <tr key={r.id}>
                  {columns.map((c) => <td key={c.key} style={S.td}>{c.render ? c.render(r) : String(r[c.key] ?? "—")}</td>)}
                  <td style={{ ...S.td, whiteSpace: "nowrap" }}><button style={S.btn(C.blue)} onClick={() => start(r)}>Edit</button> <button style={S.btn(C.red)} onClick={() => del(r)}>Delete</button></td>
                </tr>
              ))}
            </Table>
          )}
        </div>
      </div>
    );
  }
  const yes = (v) => (v ? "✓" : "—");

  /* ───────── sections ───────── */
  const Overview = () => {
    const [d, , err] = useLoad(api.overview);
    if (err) return <Err e={err} />;
    if (!d) return <p>Loading…</p>;
    const Stat = ({ label, value, sub }) => (<div style={{ ...S.card, margin: 0 }}><div style={{ color: C.muted, fontSize: 12 }}>{label}</div><div style={{ fontSize: 24, fontWeight: 800 }}>{value}</div>{sub && <div style={{ color: C.muted, fontSize: 12 }}>{sub}</div>}</div>);
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
        <Stat label="Businesses awaiting approval" value={d.businesses.pending} sub={`${d.businesses.approved} approved`} />
        <Stat label="Active subscriptions" value={d.subscriptions.active} sub={`${d.subscriptions.awaiting_payment} awaiting payment`} />
        <Stat label="Payments received" value={money(d.payments.paid_omr)} sub={`${d.payments.pending_count} pending`} />
        <Stat label="Bookings" value={d.bookings.total} sub={`${d.bookings.pending} pending · ${d.bookings.completed} completed`} />
        <Stat label="Commission due" value={money(d.commissions.due_omr)} sub={`settled: ${money(d.commissions.settled_omr)}`} />
        <Stat label="Ads" value={`${d.ads.impressions} views`} sub={`${d.ads.clicks} clicks · ${d.ads.active} active`} />
        <Stat label="Trip plan orders" value={d.orders.paid} sub={`${d.orders.pending} awaiting payment`} />
      </div>
    );
  };

  const Businesses = () => {
    const [filter, setFilter] = useState("");
    const [rows, reload, err] = useLoad(() => api.businesses(filter), [filter]);
    const act = async (id, body) => { const r = await api.setBusinessStatus(id, body); if (r.success) reload(); else alert(r.message); };
    const reject = (id) => { const note = window.prompt("Reason (shown to the owner):", ""); if (note !== null) act(id, { status: "rejected", admin_note: note }); };
    return (
      <div style={S.card}>
        <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          {["", "pending", "approved", "rejected", "suspended"].map((s) => <button key={s} style={S.btn(filter === s ? C.orange : C.border)} onClick={() => setFilter(s)}>{s || "All"}</button>)}
        </div>
        <Err e={err} />
        {rows === null ? "Loading…" : rows.length === 0 ? <span style={{ color: C.muted }}>None.</span> : (
          <Table head={["Name", "Type", "Owner", "Region", "Status", "Featured", ""]}>
            {rows.map((b) => (
              <tr key={b.id}>
                <td style={S.td}><strong>{b.name}</strong><div style={{ color: C.muted, fontSize: 12 }}>{b.phone || ""}</div></td>
                <td style={S.td}>{b.type}</td><td style={S.td}>{b.owner_name}<div style={{ color: C.muted, fontSize: 12 }}>{b.owner_email}</div></td>
                <td style={S.td}>{[b.area, b.region].filter(Boolean).join(", ")}</td>
                <td style={S.td}><span style={S.pill(statusColor(b.status))}>{b.status}</span></td>
                <td style={S.td}><input type="checkbox" checked={b.is_featured} onChange={(e) => act(b.id, { is_featured: e.target.checked })} /></td>
                <td style={{ ...S.td, whiteSpace: "nowrap" }}>
                  {b.status !== "approved" && <button style={S.btn(C.green)} onClick={() => act(b.id, { status: "approved", admin_note: "" })}>Approve</button>}{" "}
                  {b.status !== "rejected" && <button style={S.btn(C.red)} onClick={() => reject(b.id)}>Reject</button>}{" "}
                  {b.status === "approved" && <button style={S.btn(C.border)} onClick={() => act(b.id, { status: "suspended" })}>Suspend</button>}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </div>
    );
  };

  const Plans = () => (
    <Editor title="Subscription plans (you set the names and prices)" crud={api.plans}
      defaults={{ audience: "business", period_months: 1, is_active: true, boosts_listing: false, features: "" }}
      fields={[
        { key: "code", label: "Code (unique, e.g. hotel-monthly)" },
        { key: "audience", label: "For", type: "select", options: [{ v: "business", l: "Businesses (hotels/restaurants)" }, { v: "tourist", l: "Travellers (Premium)" }] },
        { key: "name", label: "Name (EN)" }, { key: "name_ar", label: "Name (AR)" },
        { key: "price_omr", label: "Price (OMR)", type: "number" }, { key: "period_months", label: "Period (months)", type: "number" },
        { key: "features", label: "Features (one per line)", type: "textarea", wide: true },
        { key: "boosts_listing", label: "Promotes the business in the directory", type: "checkbox" },
        { key: "is_active", label: "Active", type: "checkbox" },
      ]}
      columns={[{ key: "name", label: "Name" }, { key: "audience", label: "For" }, { key: "price_omr", label: "Price", render: (r) => money(r.price_omr) }, { key: "period_months", label: "Months" }, { key: "boosts_listing", label: "Promotes", render: (r) => yes(r.boosts_listing) }, { key: "is_active", label: "Active", render: (r) => yes(r.is_active) }]}
      transformIn={(r) => ({ ...r, features: (r.features || []).join("\n") })}
      transformOut={(b) => ({ ...b, features: String(b.features || "").split("\n").map((x) => x.trim()).filter(Boolean), price_omr: Number(b.price_omr), period_months: parseInt(b.period_months) || 1 })} />
  );

  const Subs = () => {
    const [rows, reload, err] = useLoad(api.subscriptions);
    const [orders, reloadO, errO] = useLoad(api.orders);
    const activate = async (s) => { const ref = window.prompt("Payment reference / receipt no. (optional):", ""); if (ref === null) return; const r = await api.activateSub(s.id, { provider_ref: ref }); if (r.success) reload(); else alert(r.message); };
    const cancel = async (s) => { if (!window.confirm("Cancel this subscription?")) return; const r = await api.cancelSub(s.id); if (r.success) reload(); else alert(r.message); };
    const paid = async (o) => { const ref = window.prompt("Payment reference / receipt no. (optional):", ""); if (ref === null) return; const r = await api.markOrderPaid(o.id, { provider_ref: ref }); if (r.success) reloadO(); else alert(r.message); };
    return (
      <>
        <div style={S.card}><h3 style={{ marginTop: 0 }}>Subscriptions</h3><Err e={err} />
          {rows === null ? "Loading…" : rows.length === 0 ? <span style={{ color: C.muted }}>None yet.</span> : (
            <Table head={["User", "Plan", "For", "Amount", "Status", "Expires", ""]}>
              {rows.map((s) => (
                <tr key={s.id}><td style={S.td}>{s.username}<div style={{ color: C.muted, fontSize: 12 }}>{s.email}</div></td>
                  <td style={S.td}>{s.plan_name}</td><td style={S.td}>{s.business_name || "Premium (traveller)"}</td><td style={S.td}>{money(s.amount_omr)}</td>
                  <td style={S.td}><span style={S.pill(statusColor(s.status))}>{s.status}</span></td>
                  <td style={S.td}>{s.expires_at ? new Date(s.expires_at).toLocaleDateString() : "—"}</td>
                  <td style={{ ...S.td, whiteSpace: "nowrap" }}>{s.status === "pending_payment" && <button style={S.btn(C.green)} onClick={() => activate(s)}>Confirm payment</button>} {["pending_payment", "active"].includes(s.status) && <button style={S.btn(C.red)} onClick={() => cancel(s)}>Cancel</button>}</td></tr>
              ))}
            </Table>)}
        </div>
        <div style={S.card}><h3 style={{ marginTop: 0 }}>Trip plan orders</h3><Err e={errO} />
          {orders === null ? "Loading…" : orders.length === 0 ? <span style={{ color: C.muted }}>None yet.</span> : (
            <Table head={["User", "Plan", "Amount", "Status", ""]}>
              {orders.map((o) => (<tr key={o.id}><td style={S.td}>{o.username}</td><td style={S.td}>{o.title}</td><td style={S.td}>{money(o.amount_omr)}</td>
                <td style={S.td}><span style={S.pill(statusColor(o.status))}>{o.status}</span></td>
                <td style={S.td}>{o.status === "pending_payment" && <button style={S.btn(C.green)} onClick={() => paid(o)}>Confirm payment</button>}</td></tr>))}
            </Table>)}
        </div>
      </>
    );
  };

  const Bookings = () => {
    const [com, reloadC, errC] = useLoad(api.commissions);
    const [rows, , err] = useLoad(() => api.bookings());
    const settle = async (b) => { if (!window.confirm(`Mark ${money(b.due_omr)} from ${b.business_name} as received?`)) return; const r = await api.settle(b.business_id); if (r.success) reloadC(); else alert(r.message); };
    return (
      <>
        <div style={S.card}><h3 style={{ marginTop: 0 }}>Commission per business</h3><Err e={errC} />
          {com === null ? "Loading…" : com.length === 0 ? <span style={{ color: C.muted }}>No completed bookings yet.</span> : (
            <Table head={["Business", "Completed", "Booking value", "Commission due", "Settled", ""]}>
              {com.map((b) => (<tr key={b.business_id}><td style={S.td}>{b.business_name}</td><td style={S.td}>{b.completed_bookings}</td><td style={S.td}>{money(b.booking_value_omr)}</td>
                <td style={S.td}><strong>{money(b.due_omr)}</strong></td><td style={S.td}>{money(b.settled_omr)}</td>
                <td style={S.td}>{Number(b.due_omr) > 0 && <button style={S.btn(C.green)} onClick={() => settle(b)}>Mark received</button>}</td></tr>))}
            </Table>)}
        </div>
        <div style={S.card}><h3 style={{ marginTop: 0 }}>All bookings</h3><Err e={err} />
          {rows === null ? "Loading…" : rows.length === 0 ? <span style={{ color: C.muted }}>None.</span> : (
            <Table head={["Date", "Business", "Guest", "Guests", "Status", "Amount", "Commission"]}>
              {rows.map((k) => (<tr key={k.id}><td style={S.td}>{new Date(k.booking_date).toLocaleDateString()}</td><td style={S.td}>{k.business_name}</td><td style={S.td}>{k.username}</td><td style={S.td}>{k.guests}</td>
                <td style={S.td}><span style={S.pill(statusColor(k.status))}>{k.status}</span></td><td style={S.td}>{k.amount_omr != null ? money(k.amount_omr) : "—"}</td>
                <td style={S.td}>{k.commission_omr != null ? <>{money(k.commission_omr)} <span style={S.pill(statusColor(k.commission_status))}>{k.commission_status}</span></> : "—"}</td></tr>))}
            </Table>)}
        </div>
      </>
    );
  };

  const Ads = () => (
    <Editor title="In-app ads" crud={api.ads} defaults={{ placement: "home", is_active: true }}
      fields={[
        { key: "title", label: "Title (EN)" }, { key: "title_ar", label: "Title (AR)" },
        { key: "body", label: "Text (EN)" }, { key: "body_ar", label: "Text (AR)" },
        { key: "image_url", label: "Image URL (https://…)" }, { key: "link_url", label: "Link URL (https://…)" },
        { key: "placement", label: "Where", type: "select", options: ["home", "destinations", "details", "learn"] },
        { key: "starts_at", label: "Starts", type: "date" }, { key: "ends_at", label: "Ends", type: "date" },
        { key: "is_active", label: "Active", type: "checkbox" },
      ]}
      columns={[{ key: "title", label: "Title" }, { key: "placement", label: "Where" }, { key: "impressions", label: "Views" }, { key: "clicks", label: "Clicks" },
        { key: "ends_at", label: "Ends", render: (r) => (r.ends_at ? String(r.ends_at).slice(0, 10) : "—") }, { key: "is_active", label: "Active", render: (r) => yes(r.is_active) }]}
      transformIn={(r) => ({ ...r, starts_at: r.starts_at ? String(r.starts_at).slice(0, 10) : "", ends_at: r.ends_at ? String(r.ends_at).slice(0, 10) : "" })} />
  );

  const Products = () => (
    <Editor title="Ready-made smart trip plans (for sale)" crud={api.products} defaults={{ is_active: true, price_omr: 0 }}
      fields={[
        { key: "title", label: "Title (EN)" }, { key: "title_ar", label: "Title (AR)" },
        { key: "price_omr", label: "Price (OMR) – 0 = free", type: "number" }, { key: "duration_days", label: "Days", type: "number" },
        { key: "description", label: "Public teaser (EN)", type: "textarea", wide: true }, { key: "description_ar", label: "Public teaser (AR)", type: "textarea", wide: true },
        { key: "itinerary_text", label: "Full itinerary – shown only after purchase (EN)", type: "textarea", rows: 8, wide: true },
        { key: "itinerary_text_ar", label: "Full itinerary (AR)", type: "textarea", rows: 8, wide: true },
        { key: "is_active", label: "Active", type: "checkbox" },
      ]}
      columns={[{ key: "title", label: "Title" }, { key: "price_omr", label: "Price", render: (r) => money(r.price_omr) }, { key: "duration_days", label: "Days" }, { key: "is_active", label: "Active", render: (r) => yes(r.is_active) }]}
      transformOut={(b) => ({ ...b, price_omr: Number(b.price_omr), duration_days: b.duration_days === "" || b.duration_days == null ? null : parseInt(b.duration_days) })} />
  );

  const Learning = () => {
    const [trails, reloadTrails] = useLoad(api.trails.list);
    const opts = (trails || []).map((t) => ({ v: t.id, l: t.title }));
    const trailName = (id) => (trails || []).find((t) => t.id === id)?.title || "—";
    const [dests] = useLoad(() => fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/destinations?limit=50`).then((r) => r.json()));
    return (
      <>
        <Editor title="Learning trails" crud={api.trails} onChanged={reloadTrails} defaults={{ is_active: true, sort_order: 0 }}
          fields={[{ key: "title", label: "Title (EN)" }, { key: "title_ar", label: "Title (AR)" }, { key: "description", label: "Description (EN)", type: "textarea", wide: true }, { key: "description_ar", label: "Description (AR)", type: "textarea", wide: true }, { key: "sort_order", label: "Order", type: "number" }, { key: "is_active", label: "Active", type: "checkbox" }]}
          columns={[{ key: "title", label: "Trail" }, { key: "title_ar", label: "AR" }, { key: "sort_order", label: "Order" }, { key: "is_active", label: "Active", render: (r) => yes(r.is_active) }]} />
        {opts.length > 0 && (
          <>
            <div style={{ height: 18 }} />
            <Editor title="Trail stops (learning content)" crud={api.stops} defaults={{ trail_id: opts[0].v, sort_order: 0 }}
              fields={[{ key: "trail_id", label: "Trail", type: "select", options: opts },
                { key: "destination_id", label: "Linked destination (optional)", type: "select", options: [{ v: "", l: "— none —" }, ...((dests || []).map((d) => ({ v: d.id, l: d.name })))] },
                { key: "title", label: "Title (EN)" }, { key: "title_ar", label: "Title (AR)" },
                { key: "content", label: "Content (EN)", type: "textarea", rows: 5, wide: true }, { key: "content_ar", label: "Content (AR)", type: "textarea", rows: 5, wide: true },
                { key: "sort_order", label: "Order", type: "number" }]}
              columns={[{ key: "title", label: "Stop" }, { key: "trail_id", label: "Trail", render: (r) => trailName(r.trail_id) }, { key: "sort_order", label: "Order" }]}
              transformOut={(b) => ({ ...b, sort_order: parseInt(b.sort_order) || 0 })} />
            <div style={{ height: 18 }} />
            <Editor title="Quiz questions" crud={api.questions} defaults={{ trail_id: opts[0].v, correct_index: 0, sort_order: 0, options: "" }}
              fields={[{ key: "trail_id", label: "Trail", type: "select", options: opts },
                { key: "question", label: "Question (EN)" }, { key: "question_ar", label: "Question (AR)" },
                { key: "options", label: "Answers – one per line as  English | Arabic", type: "textarea", rows: 5, wide: true },
                { key: "correct_index", label: "Correct answer number (first line = 0)", type: "number" }, { key: "sort_order", label: "Order", type: "number" }]}
              columns={[{ key: "question", label: "Question" }, { key: "trail_id", label: "Trail", render: (r) => trailName(r.trail_id) }, { key: "correct_index", label: "Correct #" }]}
              transformIn={(r) => ({ ...r, options: (r.options || []).map((o) => `${o.en || ""} | ${o.ar || ""}`).join("\n") })}
              transformOut={(b) => {
                const options = String(b.options || "").split("\n").map((l) => l.trim()).filter(Boolean).map((l) => { const [en, ar] = l.split("|").map((x) => x.trim()); return { en, ar: ar || en }; });
                return { ...b, options, correct_index: parseInt(b.correct_index) || 0, sort_order: parseInt(b.sort_order) || 0 };
              }} />
          </>
        )}
      </>
    );
  };

  const Settings = () => {
    const [d, reload, err] = useLoad(api.settings);
    const [f, setF] = useState(null);
    const [msg, setMsg] = useState("");
    useEffect(() => { if (d) setF(d); }, [d]);
    if (err) return <Err e={err} />;
    if (!f) return <p>Loading…</p>;
    const save = async (e) => { e.preventDefault(); const r = await api.saveSettings({ commission_rate_percent: f.commission_rate_percent, payment_instructions: f.payment_instructions }); setMsg(r.success ? "Saved ✓" : r.message); if (r.success) reload(); };
    return (
      <form onSubmit={save} style={S.card}>
        <label style={S.label}>Booking commission (% of the final booking amount)
          <input type="number" min="0" max="100" step="0.01" style={S.input} value={f.commission_rate_percent} onChange={(e) => setF({ ...f, commission_rate_percent: e.target.value })} /></label>
        <p style={{ color: C.muted, fontSize: 12.5 }}>The rate in force when a booking is completed is stored on that booking, so changing it later does not alter past bookings.</p>
        <label style={S.label}>Payment instructions shown to users after they subscribe or order (bank account, office address, …)
          <textarea rows={5} style={S.input} value={f.payment_instructions} onChange={(e) => setF({ ...f, payment_instructions: e.target.value })} /></label>
        <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center" }}><button style={S.btn(C.green)}>Save</button><span>{msg}</span></div>
      </form>
    );
  };

  const view = { overview: Overview, businesses: Businesses, plans: Plans, subs: Subs, bookings: Bookings, ads: Ads, products: Products, learning: Learning, settings: Settings }[sub];
  const View = view;
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Business model</h2>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {SUBTABS.map(([id, label]) => <button key={id} style={S.btn(sub === id ? C.orange : C.border)} onClick={() => setSub(id)}>{label}</button>)}
      </div>
      <View />
    </div>
  );
}

export default React.memo(AdminBusiness);

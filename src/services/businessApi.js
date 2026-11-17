// src/services/businessApi.js – client for the NEW business-model endpoints.
// Separate file on purpose: services/api.js (existing endpoints) is left untouched.
import { API_BASE } from "../config";
import { getToken, getRefreshToken, setToken, setRefreshToken, clearTokens } from "./api";

async function request(path, { method = "GET", body, form } = {}) {
  const build = () => {
    const headers = {};
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (!form) headers["Content-Type"] = "application/json";
    return { method, headers, body: form || (body ? JSON.stringify(body) : undefined) };
  };
  let res = await fetch(`${API_BASE}${path}`, build());
  if (res.status === 401 && getRefreshToken()) {
    const rr = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: getRefreshToken() }),
    });
    if (rr.ok) {
      const { data } = await rr.json();
      setToken(data.accessToken); setRefreshToken(data.refreshToken);
      res = await fetch(`${API_BASE}${path}`, build());
    } else { clearTokens(); window.location.reload(); }
  }
  try { return await res.json(); } catch { return { success: false, message: "Server error" }; }
}
const qs = (p = {}) => {
  const s = new URLSearchParams(Object.entries(p).filter(([, v]) => v !== undefined && v !== "" && v !== null)).toString();
  return s ? `?${s}` : "";
};

export const bizAPI = {
  list: (p) => request(`/businesses${qs(p)}`),
  get: (id) => request(`/businesses/${id}`),
  mine: () => request("/businesses/mine/list"),
  create: (b) => request("/businesses", { method: "POST", body: b }),
  update: (id, b) => request(`/businesses/${id}`, { method: "PUT", body: b }),
  uploadPhoto: (id, file) => { const f = new FormData(); f.append("photos", file); return request(`/businesses/${id}/photo`, { method: "POST", form: f }); },
  bookingsOf: (id) => request(`/businesses/${id}/bookings`),
};
export const planAPI = {
  list: (audience) => request(`/plans${qs({ audience })}`),
  subscribe: (plan_id, business_id) => request("/subscriptions", { method: "POST", body: { plan_id, business_id } }),
  mine: () => request("/subscriptions/me"),
  settings: () => request("/public-settings"),
};
export const bookingAPI = {
  create: (b) => request("/bookings", { method: "POST", body: b }),
  mine: () => request("/bookings/me"),
  cancel: (id) => request(`/bookings/${id}/cancel`, { method: "PUT" }),
  setStatus: (id, status, amount_omr) => request(`/bookings/${id}/status`, { method: "PUT", body: { status, amount_omr } }),
};
export const adsAPI = {
  list: (placement) => request(`/ads${qs({ placement })}`),
  impression: (id) => request(`/ads/${id}/impression`, { method: "POST" }),
  click: (id) => request(`/ads/${id}/click`, { method: "POST" }),
};
export const productAPI = {
  list: () => request("/products"),
  get: (id) => request(`/products/${id}`),
  order: (id) => request(`/products/${id}/order`, { method: "POST" }),
  orders: () => request("/orders/me"),
};
export const learningAPI = { list: () => request("/learning") };

const A = "/admin-biz";
const crud = (p) => ({
  list: () => request(`${A}${p}`),
  create: (b) => request(`${A}${p}`, { method: "POST", body: b }),
  update: (id, b) => request(`${A}${p}/${id}`, { method: "PUT", body: b }),
  remove: (id) => request(`${A}${p}/${id}`, { method: "DELETE" }),
});
export const bizAdminAPI = {
  overview: () => request(`${A}/overview`),
  businesses: (status) => request(`${A}/businesses${qs({ status })}`),
  setBusinessStatus: (id, b) => request(`${A}/businesses/${id}/status`, { method: "PUT", body: b }),
  plans: crud("/plans"), ads: crud("/ads"), products: crud("/products"),
  trails: crud("/learning/trails"), stops: crud("/learning/stops"), questions: crud("/learning/questions"),
  subscriptions: () => request(`${A}/subscriptions`),
  activateSub: (id, b = {}) => request(`${A}/subscriptions/${id}/activate`, { method: "PUT", body: b }),
  cancelSub: (id) => request(`${A}/subscriptions/${id}/cancel`, { method: "PUT" }),
  orders: () => request(`${A}/orders`),
  markOrderPaid: (id, b = {}) => request(`${A}/orders/${id}/mark-paid`, { method: "PUT", body: b }),
  bookings: (status) => request(`${A}/bookings${qs({ status })}`),
  commissions: () => request(`${A}/commissions`),
  settle: (businessId) => request(`${A}/commissions/${businessId}/settle`, { method: "PUT" }),
  settings: () => request(`${A}/settings`),
  saveSettings: (b) => request(`${A}/settings`, { method: "PUT", body: b }),
};

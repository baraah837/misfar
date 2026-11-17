// src/services/api.js
// Central API service for Misfar – connects to the Express backend

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// ── Token helpers ─────────────────────────────────────────────
export const getToken = () => localStorage.getItem("misfar_token");
export const setToken = (token) => localStorage.setItem("misfar_token", token);
export const getRefreshToken = () => localStorage.getItem("misfar_refresh_token");
export const setRefreshToken = (token) => localStorage.setItem("misfar_refresh_token", token);
export const clearTokens = () => {
  localStorage.removeItem("misfar_token");
  localStorage.removeItem("misfar_refresh_token");
  localStorage.removeItem("misfar_user");
};

export const setUser = (user) =>
  localStorage.setItem("misfar_user", JSON.stringify(user));
export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("misfar_user"));
  } catch {
    return null;
  }
};

// ── Core fetch wrapper ────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // Auto-refresh if 401
  if (res.status === 401) {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (refreshRes.ok) {
        const { data } = await refreshRes.json();
        setToken(data.accessToken);
        setRefreshToken(data.refreshToken);
        headers["Authorization"] = `Bearer ${data.accessToken}`;
        const retryRes = await fetch(`${BASE_URL}${path}`, { ...options, headers });
        return retryRes.json();
      } else {
        clearTokens();
        window.location.reload();
        return;
      }
    }
  }

  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  login: async (email, password) => {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (data.success) {
      setToken(data.data.accessToken);
      setRefreshToken(data.data.refreshToken);
      setUser(data.data.user);
    }
    return data;
  },

  register: async (username, email, password) => {
    const data = await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });
    if (data.success) {
      setToken(data.data.accessToken);
      setRefreshToken(data.data.refreshToken);
      setUser(data.data.user);
    }
    return data;
  },

  logout: async () => {
    const refreshToken = getRefreshToken();
    await apiFetch("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
    clearTokens();
  },
};

// ── Destinations ──────────────────────────────────────────────
export const destinationsAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/destinations${qs ? `?${qs}` : ""}`);
  },
  getOne: (id) => apiFetch(`/destinations/${id}`),
  getReviews: (id) => apiFetch(`/destinations/${id}/reviews`),
  addReview: (id, rating, comment) =>
    apiFetch(`/destinations/${id}/reviews`, {
      method: "POST",
      body: JSON.stringify({ rating, comment }),
    }),
};

// ── User / Profile ────────────────────────────────────────────
export const userAPI = {
  getProfile: () => apiFetch("/users/me"),

  updateProfile: async (formData) => {
    const token = getToken();
    // multipart form for photo upload
    const res = await fetch(`${BASE_URL}/users/me`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    return res.json();
  },

  getBookmarks: () => apiFetch("/users/me/bookmarks"),
  addBookmark: (destinationId) =>
    apiFetch(`/users/me/bookmarks/${destinationId}`, { method: "POST" }),
  removeBookmark: (destinationId) =>
    apiFetch(`/users/me/bookmarks/${destinationId}`, { method: "DELETE" }),

  getMyReviews: () => apiFetch("/users/me/reviews"),
  deleteReview: (id) => apiFetch(`/users/me/reviews/${id}`, { method: "DELETE" }),
};

// ── Trips ─────────────────────────────────────────────────────
export const tripsAPI = {
  getMyTrips: () => apiFetch("/trips"),
  getOne: (id) => apiFetch(`/trips/${id}`),
  create: (tripData) =>
    apiFetch("/trips", { method: "POST", body: JSON.stringify(tripData) }),
  update: (id, tripData) =>
    apiFetch(`/trips/${id}`, { method: "PUT", body: JSON.stringify(tripData) }),
  delete: (id) => apiFetch(`/trips/${id}`, { method: "DELETE" }),
  aiGenerate: (params) =>
    apiFetch("/trips/ai-generate", { method: "POST", body: JSON.stringify(params) }),
};

// ── Recommendations ───────────────────────────────────────────
export const recommendationsAPI = {
  get: () => apiFetch("/recommendations"),
};

// ── Chatbot ───────────────────────────────────────────────────
export const chatbotAPI = {
  sendMessage: (message, conversation_id = null) =>
    apiFetch("/chatbot/message", {
      method: "POST",
      body: JSON.stringify({ message, conversation_id }),
    }),
};

// ── Activities ────────────────────────────────────────────────
export const activitiesAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/activities${qs ? `?${qs}` : ""}`);
  },
};

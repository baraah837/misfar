// src/config.js
// Frontend-only constants. Nothing here changes the backend API.
const RAW_API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export const API_BASE = RAW_API;
// Origin that serves /uploads (profile + destination photos)
export const BACKEND_ORIGIN = RAW_API.replace(/\/api\/?$/, "");

// Public contact address used by the footer, Support and Partners pages.
// Override with REACT_APP_CONTACT_EMAIL in .env if it changes.
export const CONTACT_EMAIL = process.env.REACT_APP_CONTACT_EMAIL || "misfarutas@gmail.com";
export const INSTAGRAM_URL = "https://www.instagram.com/misfarutas/";

export const resolveMediaUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("data:") || url.startsWith("http")) return url;
  return `${BACKEND_ORIGIN}${url}`;
};

export const mailtoLink = (subject, body) =>
  `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

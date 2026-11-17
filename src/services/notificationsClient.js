// src/services/notificationsClient.js
// Read-only client for the EXISTING notification endpoints used by the navbar bell.
// (GET /users/me/notifications, POST /users/me/notifications/:id/read) – no backend change.
import { API_BASE } from "../config";
import { getToken } from "./api";

const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

export const fetchNotifications = () =>
  fetch(`${API_BASE}/users/me/notifications`, { headers: headers() }).then((r) => r.json());

export const markNotificationRead = (id) =>
  fetch(`${API_BASE}/users/me/notifications/${id}/read`, { method: "POST", headers: headers() });

// Public endpoint, auth optional (existing: GET /recommendations/trending)
export const fetchTrending = () =>
  fetch(`${API_BASE}/recommendations/trending`, { headers: getToken() ? headers() : {} }).then((r) => r.json());

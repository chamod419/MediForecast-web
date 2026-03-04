import axios from "axios";

const API_BASE = "http://127.0.0.1:8000/api";

// create axios instance
export const api = axios.create({
  baseURL: API_BASE,
});

// attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access"); // ✅ consistent key
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// auto refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not retried yet
    if (
      error?.response?.status === 401 &&
      !originalRequest._retry &&
      localStorage.getItem("refresh")
    ) {
      originalRequest._retry = true;

      try {
        const refresh = localStorage.getItem("refresh");

        // refresh token
        const res = await axios.post(`${API_BASE}/auth/token/refresh/`, {
          refresh,
        });

        // save new access token
        localStorage.setItem("access", res.data.access);

        // retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
        return api(originalRequest);
      } catch (refreshErr) {
        // refresh token invalid -> force logout
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("role");
        localStorage.removeItem("pharmacy_id");
        localStorage.removeItem("full_name");
        localStorage.removeItem("username");

        window.location.href = "/login";
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);
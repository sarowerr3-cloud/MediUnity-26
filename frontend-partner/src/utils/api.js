import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

const api = axios.create({
  baseURL: API_BASE,
});

// Request interceptor to attach access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("patient_token") || localStorage.getItem("doctor_token") || localStorage.getItem("partner_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 Unauthorized and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const res = await axios.post(`${API_BASE}/api/auth/refresh`, {
          refreshToken,
        });

        if (res.data.success) {
          const { accessToken, refreshToken: newRefreshToken } = res.data;
          
          // Determine which role's token to update based on what was previously there
          if (localStorage.getItem("patient_token")) {
            localStorage.setItem("patient_token", accessToken);
          } else if (localStorage.getItem("doctor_token")) {
            localStorage.setItem("doctor_token", accessToken);
          } else if (localStorage.getItem("partner_token")) {
            localStorage.setItem("partner_token", accessToken);
          }
          
          localStorage.setItem("refreshToken", newRefreshToken);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear everything and redirect to login
        localStorage.removeItem("patient_token");
        localStorage.removeItem("doctor_token");
        localStorage.removeItem("partner_token");
        localStorage.removeItem("refreshToken");
        window.location.href = "/";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// src/config.js
export const API_BASE = import.meta.env.VITE_API_URL || 
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
    ? "http://localhost:4000" 
    : "https://medicare-backend-6eww.onrender.com");

import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [adminToken, setAdminToken] = useState(localStorage.getItem("adminToken") || null);
  const [adminRole, setAdminRole] = useState(localStorage.getItem("adminRole") || null);
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Configure global axios header for admin
  useEffect(() => {
    if (adminToken) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${adminToken}`;
      fetchAdminProfile();
    } else {
      delete axios.defaults.headers.common["Authorization"];
      setAdminUser(null);
      setLoading(false);
    }
  }, [adminToken]);

  const fetchAdminProfile = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/admin/me`);
      if (res.data.success) {
        setAdminUser(res.data.admin);
      }
    } catch (err) {
      console.error("Failed to fetch admin profile:", err);
      // Logout if token invalid
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await axios.post(`${API_BASE_URL}/api/admin/login`, { email, password });
    if (res.data.success && res.data.token) {
      const token = res.data.token;
      const role = res.data.role || "admin";
      localStorage.setItem("adminToken", token);
      localStorage.setItem("adminRole", role);
      setAdminToken(token);
      setAdminRole(role);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      return res.data;
    } else {
      throw new Error(res.data.message || "Invalid credentials");
    }
  };

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminRole");
    delete axios.defaults.headers.common["Authorization"];
    setAdminToken(null);
    setAdminRole(null);
    setAdminUser(null);
  };

  return (
    <AdminAuthContext.Provider value={{ adminToken, adminRole, adminUser, loading, login, logout, API_BASE_URL }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
};

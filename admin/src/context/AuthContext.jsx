import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);
const STORAGE_KEY = "adminToken_v1";

// Valid RBAC roles
const VALID_ROLES = ["super-admin", "moderator", "support"];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  /** Extract role from JWT, mapping legacy "admin" to "super-admin" */
  function parseToken(jwt) {
    try {
      const payload = JSON.parse(atob(jwt.split(".")[1]));
      let role = payload.role;
      if (role === "admin") role = "super-admin"; // backward compat
      if (!VALID_ROLES.includes(role)) return null;
      return { email: payload.email, role };
    } catch {
      return null;
    }
  }

  // Sync session on mount
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const localToken = localStorage.getItem(STORAGE_KEY);
        if (localToken) {
          const parsed = parseToken(localToken);
          if (parsed) {
            setUser(parsed);
            setToken(localToken);
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch (err) {
        console.warn("Failed to initialize admin auth session:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen to storage changes to sync across tabs
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) {
        if (e.newValue) {
          const parsed = parseToken(e.newValue);
          if (parsed) {
            setUser(parsed);
            setToken(e.newValue);
          } else {
            setUser(null);
            setToken(null);
          }
        } else {
          setUser(null);
          setToken(null);
        }
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setToken(null);
    window.dispatchEvent(
      new StorageEvent("storage", { key: STORAGE_KEY, newValue: null })
    );
  };

  const getToken = async () => {
    return localStorage.getItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        token,
        logout,
        getToken,
        userId: user ? "admin" : null,
        isSignedIn: !!user,
        isLoaded: !loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const useUser = () => {
  const { user, loading } = useAuth();

  // Role display labels
  const roleLabels = {
    "super-admin": "Super Admin",
    moderator: "Moderator",
    support: "Support Agent",
  };

  return {
    isLoaded: !loading,
    isSignedIn: !!user,
    user: user
      ? {
          id: "admin",
          fullName: roleLabels[user.role] || "System Admin",
          primaryEmailAddress: { emailAddress: user.email },
          imageUrl:
            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150",
          role: user.role,
        }
      : null,
  };
};

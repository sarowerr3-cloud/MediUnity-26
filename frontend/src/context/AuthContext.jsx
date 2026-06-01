import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  signInWithPopup, 
  signOut 
} from "firebase/auth";
import { auth, googleProvider } from "../config/firebase";

const AuthContext = createContext(null);
const STORAGE_KEY = "patientToken_v1";
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [isCustomAuth, setIsCustomAuth] = useState(false);

  // Load user session on mount
  useEffect(() => {
    let active = true;
    const initializeAuth = async () => {
      try {
        const localToken = localStorage.getItem(STORAGE_KEY);
        if (localToken) {
          // Fetch custom patient profile using local token
          const res = await fetch(`${API_BASE}/api/patients/profile`, {
            headers: { Authorization: `Bearer ${localToken}` }
          });
          const json = await res.json().catch(() => null);
          if (json && json.success && active) {
            setUser({
              uid: json.profile.clerkUserId,
              id: json.profile.clerkUserId,
              displayName: json.profile.name,
              email: json.profile.email,
              phone: json.profile.phone,
              isVerified: json.profile.isVerified,
              nid: json.profile.nid,
              nidImageUrl: json.profile.nidImageUrl,
              imageUrl: json.profile.imageUrl,
              medicalHistory: json.profile.medicalHistory || []
            });
            setToken(localToken);
            setIsCustomAuth(true);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn("Failed to restore patient session from local token:", err);
      }

      // Fall back to Firebase
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (!active) return;
        if (currentUser) {
          setUser(currentUser);
          try {
            const idToken = await currentUser.getIdToken();
            setToken(idToken);
            setIsCustomAuth(false);
          } catch (error) {
            console.error("Error getting idToken", error);
            setToken(null);
          }
        } else {
          setUser(null);
          setToken(null);
        }
        setLoading(false);
      });

      return () => {
        unsubscribe();
      };
    };

    initializeAuth();

    return () => {
      active = false;
    };
  }, []);

  const loginWithEmail = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (email, password, displayName) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });
    setUser({ ...auth.currentUser });
    return userCredential.user;
  };

  const loginWithGoogle = () => {
    return signInWithPopup(auth, googleProvider);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setToken(null);
    setIsCustomAuth(false);
    return signOut(auth);
  };

  const getToken = async (forceRefresh = false) => {
    const localToken = localStorage.getItem(STORAGE_KEY);
    if (localToken) return localToken;
    if (!auth.currentUser) return null;
    return await auth.currentUser.getIdToken(forceRefresh);
  };

  // Custom DB Authentication methods
  const signUpCustom = async (name, email, phone, password) => {
    const res = await fetch(`${API_BASE}/api/patients/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, password })
    });
    const json = await res.json();
    return json;
  };

  const verifyOtpCustom = async (emailOrPhone, otp) => {
    const res = await fetch(`${API_BASE}/api/patients/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailOrPhone, otp })
    });
    const json = await res.json();
    if (json.success && json.token) {
      localStorage.setItem(STORAGE_KEY, json.token);
      setUser({
        uid: json.profile.clerkUserId,
        id: json.profile.clerkUserId,
        displayName: json.profile.name,
        email: json.profile.email,
        phone: json.profile.phone,
        isVerified: json.profile.isVerified,
        nid: json.profile.nid,
        nidImageUrl: json.profile.nidImageUrl,
        imageUrl: json.profile.imageUrl,
        medicalHistory: json.profile.medicalHistory || []
      });
      setToken(json.token);
      setIsCustomAuth(true);
    }
    return json;
  };

  const loginCustom = async (emailOrPhone, password) => {
    const res = await fetch(`${API_BASE}/api/patients/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailOrPhone, password })
    });
    const json = await res.json();
    if (json.success && json.token) {
      localStorage.setItem(STORAGE_KEY, json.token);
      setUser({
        uid: json.profile.clerkUserId,
        id: json.profile.clerkUserId,
        displayName: json.profile.name,
        email: json.profile.email,
        phone: json.profile.phone,
        isVerified: json.profile.isVerified,
        nid: json.profile.nid,
        nidImageUrl: json.profile.nidImageUrl,
        imageUrl: json.profile.imageUrl,
        medicalHistory: json.profile.medicalHistory || []
      });
      setToken(json.token);
      setIsCustomAuth(true);
    }
    return json;
  };

  const reloadUserProfile = async () => {
    try {
      const localToken = localStorage.getItem(STORAGE_KEY);
      if (localToken) {
        const res = await fetch(`${API_BASE}/api/patients/profile`, {
          headers: { Authorization: `Bearer ${localToken}` }
        });
        const json = await res.json().catch(() => null);
        if (json && json.success) {
          setUser({
            uid: json.profile.clerkUserId,
            id: json.profile.clerkUserId,
            displayName: json.profile.name,
            email: json.profile.email,
            phone: json.profile.phone,
            isVerified: json.profile.isVerified,
            nid: json.profile.nid,
            nidImageUrl: json.profile.nidImageUrl,
            imageUrl: json.profile.imageUrl,
            medicalHistory: json.profile.medicalHistory || []
          });
          setToken(localToken);
          setIsCustomAuth(true);
        }
      }
    } catch (e) {
      console.warn("Failed to reload user profile:", e);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        token, 
        loginWithEmail, 
        signUpWithEmail, 
        loginWithGoogle, 
        logout,
        getToken,
        signUpCustom,
        verifyOtpCustom,
        loginCustom,
        isCustomAuth,
        reloadUserProfile,
        userId: user?.uid || user?.id || null,
        isSignedIn: !!user,
        isLoaded: !loading
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

// Replicate useUser to match Clerk's behavior where needed
export const useUser = () => {
  const { user, loading } = useAuth();
  return {
    isLoaded: !loading,
    isSignedIn: !!user,
    user: user ? {
      id: user.uid || user.id,
      fullName: user.displayName || user.name || user.email?.split("@")[0] || "Patient",
      primaryEmailAddress: { emailAddress: user.email },
      imageUrl: user.imageUrl || user.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150"
    } : null
  };
};

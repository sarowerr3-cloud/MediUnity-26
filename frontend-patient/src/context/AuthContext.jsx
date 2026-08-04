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
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Initialize and listen to Firebase auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          // Use cached token to prevent blocking Firebase network roundtrips on every mount
          const idTokenResult = await currentUser.getIdTokenResult(false);
          const idToken = idTokenResult.token;

          const claims = idTokenResult.claims;
          const userRole = claims.role || "patient";
          const isVerified = !!claims.verified;
          const isBmdcVerified = !!claims.bmdcVerified;
          const adminRole = claims.adminRole || null;

          const userData = {
            uid: currentUser.uid,
            id: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || currentUser.email?.split("@")[0] || "User",
            photoURL: currentUser.photoURL,
            imageUrl: currentUser.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150",
            role: userRole,
            verified: isVerified,
            bmdcVerified: isBmdcVerified,
            adminRole: adminRole,
          };

          setUser(userData);
          setToken(idToken);

          // Role-based redirects: Redirect unverified doctors to verification-pending
          if (userRole === "doctor" && !isVerified) {
            const path = window.location.pathname;
            if (!path.includes("/doctor/verification-pending") && !path.includes("/doctor/setup-profile")) {
              window.location.href = "/doctor/verification-pending";
            }
          }
        } catch (error) {
          console.error("[AUTH] Error fetching ID token and claims:", error);
          setUser(null);
          setToken(null);
        }
      } else {
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (email, password, displayName) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });
    return userCredential.user;
  };

  const loginWithGoogle = () => {
    return signInWithPopup(auth, googleProvider);
  };

  const logout = async (redirect = true) => {
    setUser(null);
    setToken(null);
    await signOut(auth);
    // Redirect to home/login
    if (redirect) {
      window.location.href = "/";
    }
  };

  const getToken = async (forceRefresh = false) => {
    if (!auth.currentUser) return null;
    return await auth.currentUser.getIdToken(forceRefresh);
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
        userId: user?.uid || null,
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

export const useUser = () => {
  const { user, loading } = useAuth();
  return {
    isLoaded: !loading,
    isSignedIn: !!user,
    user: user ? {
      id: user.uid,
      fullName: user.displayName,
      primaryEmailAddress: { emailAddress: user.email },
      imageUrl: user.photoURL || user.imageUrl,
      role: user.role,
      verified: user.verified,
      bmdcVerified: user.bmdcVerified,
      adminRole: user.adminRole
    } : null
  };
};

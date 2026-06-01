import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const EVENTS = ["mousemove", "keydown", "click", "scroll", "touchstart"];

/**
 * InactivityTimeout — auto-logs out admin after 15 minutes of inactivity.
 * Renders nothing; purely a side-effect component.
 */
export default function InactivityTimeout() {
  const { isSignedIn, logout } = useAuth();
  const navigate = useNavigate();
  const timerRef = useRef(null);

  const handleTimeout = useCallback(() => {
    logout();
    navigate("/admin-login");
    // Show a simple alert — in production, consider using toast
    alert("Session expired due to inactivity. Please log in again.");
  }, [logout, navigate]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(handleTimeout, TIMEOUT_MS);
  }, [handleTimeout]);

  useEffect(() => {
    if (!isSignedIn) return;

    // Start the timer
    resetTimer();

    // Reset on user activity
    const listeners = EVENTS.map((event) => {
      const handler = () => resetTimer();
      window.addEventListener(event, handler, { passive: true });
      return { event, handler };
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      listeners.forEach(({ event, handler }) => {
        window.removeEventListener(event, handler);
      });
    };
  }, [isSignedIn, resetTimer]);

  return null; // invisible component
}

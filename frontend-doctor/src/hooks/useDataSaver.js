import { useState, useEffect } from "react";

/**
 * Custom hook to detect and manage client-side Data-Saver Mode.
 * Checks both system preference (navigator.connection.saveData) and manual local override.
 */
export function useDataSaver() {
  const [isDataSaver, setIsDataSaver] = useState(() => {
    try {
      const stored = localStorage.getItem("dataSaver");
      if (stored !== null) {
        return stored === "true";
      }
      
      // Fallback to standard browser connection preference
      if (navigator.connection && navigator.connection.saveData) {
        return true;
      }
    } catch (e) {
      // Fallback
    }
    return false;
  });

  const toggleDataSaver = () => {
    setIsDataSaver((prev) => {
      const newVal = !prev;
      localStorage.setItem("dataSaver", String(newVal));
      return newVal;
    });
  };

  useEffect(() => {
    const handleConnectionChange = () => {
      if (localStorage.getItem("dataSaver") === null) {
        if (navigator.connection) {
          setIsDataSaver(Boolean(navigator.connection.saveData));
        }
      }
    };

    if (navigator.connection) {
      navigator.connection.addEventListener("change", handleConnectionChange);
    }
    return () => {
      if (navigator.connection) {
        navigator.connection.removeEventListener("change", handleConnectionChange);
      }
    };
  }, []);

  return { isDataSaver, toggleDataSaver };
}

export default useDataSaver;

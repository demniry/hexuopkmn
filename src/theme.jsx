import { useState, useEffect, useMemo, useCallback, createContext, useContext } from "react";

// ═══════════════════════════════════════════════════════════
// THEME SYSTEM - Light & Dark Mode
// ═══════════════════════════════════════════════════════════
export const THEMES = {
  light: {
    bg: "#f8f9fa",
    card: "#ffffff",
    shadow: "0 2px 8px rgba(0,0,0,0.06)",
    primary: "#5c6bc0",
    secondary: "#78909c",
    success: "#66bb6a",
    warning: "#ffb74d",
    danger: "#ef5350",
    text: "#37474f",
    soft: "#90a4ae",
    accent: "#5c6bc0",
    border: "#455a64",
    borderLight: "#cfd8dc",
  },
  dark: {
    bg: "#1a1a2e",
    card: "#16213e",
    shadow: "0 2px 12px rgba(0,0,0,0.3)",
    primary: "#7c8ce0",
    secondary: "#8eacbb",
    success: "#81c784",
    warning: "#ffcc80",
    danger: "#ef7070",
    text: "#e8eaed",
    soft: "#9aa0a6",
    accent: "#7c8ce0",
    border: "#3d4f6f",
    borderLight: "#2d3a5a",
  }
};

// Theme Context
const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);

// Mutable theme palette - updated by ThemeProvider, used by all components
export let P = THEMES.light;

// Pixel font family
export const PIXEL_FONT = "'Press Start 2P', monospace";
export const BODY_FONT = "'VT323', monospace";

// ═══════════════════════════════════════════════════════════
// TOAST NOTIFICATION SYSTEM
// ═══════════════════════════════════════════════════════════
const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success", duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const toast = useMemo(() => ({
    success: (msg) => addToast(msg, "success"),
    error: (msg) => addToast(msg, "error"),
    info: (msg) => addToast(msg, "info"),
    warning: (msg) => addToast(msg, "warning"),
  }), [addToast]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        pointerEvents: "none",
      }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              padding: "14px 20px",
              borderRadius: 10,
              background: t.type === "success" ? P.success : t.type === "error" ? P.danger : t.type === "warning" ? P.warning : P.primary,
              color: "#fff",
              fontFamily: BODY_FONT,
              fontSize: 18,
              boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
              animation: "toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              pointerEvents: "auto",
            }}
          >
            <span style={{ fontSize: 20 }}>
              {t.type === "success" ? "✓" : t.type === "error" ? "✕" : t.type === "warning" ? "⚠" : "ℹ"}
            </span>
            {t.message}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes toastIn {
          from { transform: translateY(-12px) scale(0.95); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

// ═══════════════════════════════════════════════════════════
// THEME PROVIDER COMPONENT
// ═══════════════════════════════════════════════════════════
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("hexuo-theme") || "light";
    }
    return "light";
  });

  useEffect(() => {
    localStorage.setItem("hexuo-theme", theme);
    P = THEMES[theme];
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  }, []);

  // Update P on mount
  P = THEMES[theme];

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, P: THEMES[theme] }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════
// RESPONSIVE HOOKS
// ═══════════════════════════════════════════════════════════
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = (e) => setMatches(e.matches);
    media.addEventListener("change", listener);
    setMatches(media.matches);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
}

export const useIsDesktop = () => useMediaQuery("(min-width: 900px)");
export const useIsWide = () => useMediaQuery("(min-width: 1200px)");

// ═══════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════
export const fmt = (n) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 0 });
export const fmtDate = (d) => new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
export const today = () => new Date().toISOString().split("T")[0];

export const isValidUrl = (str) => {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch { return false; }
};

export const MAX_NAME_LENGTH = 100;
export const MAX_NOTE_LENGTH = 500;
export const MAX_URL_LENGTH = 2000;

export const INIT = {
  items: [],
  events: [],
  spots: [],
  resources: [],
};

// ═══════════════════════════════════════════════════════════
// NAVIGATION TABS
// ═══════════════════════════════════════════════════════════
export const TABS = [
  { id: "wallet", label: "COLLECTION", icon: "BAG" },
  { id: "calendar", label: "CALENDRIER", icon: "DAY" },
  { id: "spots", label: "SPOTS", icon: "MAP" },
  { id: "resources", label: "GUIDES", icon: "DEX" },
];

import { useState, useEffect, useMemo, useCallback, createContext, useContext } from "react";
import { supabase } from "./supabase";

// ═══════════════════════════════════════════════════════════
// THEME SYSTEM - Light & Dark Mode
// ═══════════════════════════════════════════════════════════
const THEMES = {
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
const useTheme = () => useContext(ThemeContext);

// Default to light theme (will be overridden by ThemeProvider)
let P = THEMES.light;

// Pixel font family
const PIXEL_FONT = "'Press Start 2P', monospace";
const BODY_FONT = "'VT323', monospace";

// Modern pixel border - softer with slight radius
const pixelBorder = (color = P.border, width = 2) => ({
  border: `${width}px solid ${color}`,
  borderRadius: 4,
});

// Retro button style
const retroButtonStyle = (isActive = false, color = P.primary) => ({
  padding: "10px 16px",
  border: `3px solid ${P.border}`,
  borderRadius: 0,
  background: isActive ? color : P.card,
  color: isActive ? "#fff" : P.text,
  fontSize: 12,
  fontFamily: PIXEL_FONT,
  cursor: "pointer",
  textTransform: "uppercase",
  letterSpacing: 1,
  transition: "none",
  boxShadow: isActive ? "inset 2px 2px 0 rgba(0,0,0,0.2)" : "3px 3px 0 rgba(0,0,0,0.3)",
});

// ═══════════════════════════════════════════════════════════
// RESPONSIVE HOOK
// ═══════════════════════════════════════════════════════════
function useMediaQuery(query) {
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

const useIsDesktop = () => useMediaQuery("(min-width: 900px)");
const useIsWide = () => useMediaQuery("(min-width: 1200px)");

// ═══════════════════════════════════════════════════════════
// TOAST NOTIFICATION SYSTEM
// ═══════════════════════════════════════════════════════════
const ToastContext = createContext();

function ToastProvider({ children }) {
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
      {/* Toast container */}
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
              animation: "slideIn 0.3s ease",
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
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

const useToast = () => useContext(ToastContext);

// ═══════════════════════════════════════════════════════════
// THEME PROVIDER COMPONENT
// ═══════════════════════════════════════════════════════════
function ThemeProvider({ children }) {
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

const fmt = (n) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 0 });
const fmtDate = (d) => new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
const today = () => new Date().toISOString().split("T")[0];

// ═══════════════════════════════════════════════════════════
// INITIAL DATA
// ═══════════════════════════════════════════════════════════
const INIT = {
  items: [],
  events: [],
  spots: [],
  resources: [],
  wishlist: [],
};

// ═══════════════════════════════════════════════════════════
// SHARED COMPONENTS - RETRO PIXEL STYLE
// ═══════════════════════════════════════════════════════════

// Pokeball decoration
function Pokeball({ size = 24, style: extra }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={extra}>
      <circle cx="50" cy="50" r="48" fill="#fff" stroke={P.border} strokeWidth="4"/>
      <path d="M 2 50 H 98" stroke={P.border} strokeWidth="4"/>
      <circle cx="50" cy="50" r="16" fill="#fff" stroke={P.border} strokeWidth="4"/>
      <circle cx="50" cy="50" r="8" fill={P.border}/>
      <path d="M 2 50 A 48 48 0 0 0 98 50" fill={P.primary}/>
    </svg>
  );
}

// Pixel sparkle animation
function PixelSparkle({ style }) {
  return (
    <div style={{
      position: "absolute",
      width: 8,
      height: 8,
      background: P.warning,
      animation: "sparkle 0.6s ease-in-out infinite",
      ...style
    }} />
  );
}

function Input({ label, type, placeholder, value, onChange, style: extraStyle }) {
  return (
    <div style={{ marginBottom: 14, ...extraStyle }}>
      <label style={{
        fontSize: 10,
        color: P.text,
        fontFamily: PIXEL_FONT,
        letterSpacing: 0.5,
        marginBottom: 8,
        display: "block",
        textTransform: "uppercase"
      }}>{label}</label>
      <input type={type} placeholder={placeholder} value={value} onChange={onChange}
        style={{
          display: "block",
          width: "100%",
          padding: "12px 14px",
          border: `3px solid ${P.border}`,
          borderRadius: 0,
          fontSize: 18,
          fontFamily: BODY_FONT,
          outline: "none",
          boxSizing: "border-box",
          background: P.card,
          color: P.text
        }}
        onFocus={(e) => (e.target.style.borderColor = P.primary)}
        onBlur={(e) => (e.target.style.borderColor = P.borderLight)}
      />
    </div>
  );
}

function AddButton({ onClick }) {
  return (
    <button onClick={onClick}
      style={{
        width: "100%",
        padding: "16px",
        border: `3px dashed ${P.border}`,
        borderRadius: 0,
        background: "transparent",
        color: P.text,
        fontSize: 10,
        fontFamily: PIXEL_FONT,
        cursor: "pointer",
        textTransform: "uppercase",
        letterSpacing: 1,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = P.primary; e.currentTarget.style.color = P.primary; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = P.borderLight; e.currentTarget.style.color = P.soft; }}
    >+ Ajouter</button>
  );
}

function Card({ children, onClick, style: extra }) {
  return (
    <div onClick={onClick}
      style={{
        background: P.card,
        border: `2px solid ${P.borderLight}`,
        borderRadius: 8,
        padding: "16px 18px",
        cursor: onClick ? "pointer" : "default",
        boxShadow: P.shadow,
        transition: "all 0.15s ease",
        ...extra
      }}
      onMouseEnter={(e) => { if (onClick) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)"; e.currentTarget.style.borderColor = P.primary; }}}
      onMouseLeave={(e) => { if (onClick) { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = P.shadow; e.currentTarget.style.borderColor = P.borderLight; }}}
    >{children}</div>
  );
}

function Modal({ onClose, children, title }) {
  const isDesktop = useIsDesktop();

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(55, 71, 79, 0.6)",
        backdropFilter: "blur(4px)",
        zIndex: 100,
        display: "flex",
        alignItems: isDesktop ? "center" : "flex-end",
        justifyContent: "center",
        padding: isDesktop ? 20 : 0,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: P.card,
          border: `2px solid ${P.borderLight}`,
          borderRadius: isDesktop ? 12 : "16px 16px 0 0",
          width: "100%",
          maxWidth: isDesktop ? 520 : 560,
          maxHeight: isDesktop ? "85vh" : "90vh",
          overflowY: "auto",
          padding: isDesktop ? "24px 28px" : "20px 20px 100px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

// Alias for backward compatibility
const BottomModal = Modal;

// Stars rating display - Pixel style
function Stars({ rating, max = 5 }) {
  return (
    <span style={{ fontSize: 14, letterSpacing: 4, fontFamily: PIXEL_FONT }}>
      {Array(max).fill(0).map((_, i) => (
        <span key={i} style={{ color: i < rating ? P.warning : P.borderLight }}>*</span>
      ))}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB: WALLET (portfolio)
// ═══════════════════════════════════════════════════════════
const totalQty = (item) => item.transactions.reduce((s, t) => s + t.quantity, 0);
const totalCost = (item) => item.transactions.reduce((s, t) => s + t.price * t.quantity, 0);
const avgPrice = (item) => { const q = totalQty(item); return q > 0 ? totalCost(item) / q : 0; };

// Calculate real P&L considering actual sales
const getItemPnL = (item) => {
  const avg = avgPrice(item);
  const qty = totalQty(item);
  const hasSales = item.sold && item.sold.length > 0;

  if (!hasSales) {
    // No sales: use estimated current price
    return (item.currentPrice - avg) * qty;
  }

  // Has sales: calculate realized + unrealized P&L
  const soldQty = item.sold.reduce((s, sale) => s + sale.quantity, 0);
  const soldRevenue = item.sold.reduce((s, sale) => s + sale.netAmount, 0);
  const soldCost = avg * soldQty;
  const realizedPnL = soldRevenue - soldCost;

  const remainingQty = qty - soldQty;
  const unrealizedPnL = remainingQty > 0 ? (item.currentPrice - avg) * remainingQty : 0;

  return realizedPnL + unrealizedPnL;
};

const getItemPnLPct = (item) => {
  const cost = totalCost(item);
  if (cost <= 0) return 0;
  const pnl = getItemPnL(item);
  return (pnl / cost) * 100;
};

// Legacy function for display (uses current price only)
const itemPnLPct = (item) => { const avg = avgPrice(item); return avg > 0 ? (((item.currentPrice - avg) / avg) * 100).toFixed(1) : "0.0"; };

function TypeBadge({ type }) {
  const map = {
    "Ultra Premium Collection": { bg: P.warning, text: P.border, icon: "UPC" },
    "Bundle": { bg: P.primary, text: "#fff", icon: "BDL" },
    "Elite Trainer Box": { bg: P.danger, text: "#fff", icon: "ETB" },
    "Collection Box": { bg: P.success, text: "#fff", icon: "BOX" }
  };
  const c = map[type] || { bg: P.borderLight, text: P.text, icon: "???" };
  return (
    <span style={{
      fontSize: 8,
      fontFamily: PIXEL_FONT,
      letterSpacing: 1,
      textTransform: "uppercase",
      background: c.bg,
      color: c.text,
      padding: "6px 10px",
      border: `2px solid ${P.border}`,
      display: "inline-block"
    }}>{c.icon}</span>
  );
}

function MiniBar({ value, max, color }) {
  const w = Math.max((value / max) * 100, 6);
  return (
    <div style={{ width: "100%", height: 10, border: `2px solid ${P.border}`, background: P.card }}>
      <div style={{ width: `${w}%`, height: "100%", background: color }} />
    </div>
  );
}

function DonutChart({ items }) {
  const total = items.reduce((s, i) => s + i.currentPrice * totalQty(i), 0);
  if (total === 0) return null;
  const colors = [P.danger, P.primary, P.success, P.warning, "#9c27b0", "#e91e63", "#00bcd4", "#ff5722"];

  // Pixel-style bar chart instead of donut
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Pokeball counter */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <Pokeball size={40} />
        <div>
          <div style={{ fontSize: 10, fontFamily: PIXEL_FONT, color: P.text }}>{items.length} ITEMS</div>
          <div style={{ fontSize: 20, fontFamily: BODY_FONT, color: P.text, fontWeight: 700 }}>{fmt(total)}</div>
        </div>
      </div>

      {/* Pixel bar chart */}
      {items.slice(0, 5).map((item, idx) => {
        const pct = (item.currentPrice * totalQty(item)) / total * 100;
        return (
          <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 12, height: 12, background: colors[idx % colors.length], border: `2px solid ${P.border}`, flexShrink: 0 }} />
            <span style={{ fontSize: 14, fontFamily: BODY_FONT, color: P.text, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span>
            <span style={{ fontSize: 12, fontFamily: PIXEL_FONT, color: P.soft }}>{pct.toFixed(0)}%</span>
          </div>
        );
      })}
      {items.length > 5 && (
        <div style={{ fontSize: 10, fontFamily: PIXEL_FONT, color: P.soft, textAlign: "center" }}>+{items.length - 5} AUTRES</div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PORTFOLIO EVOLUTION CHART
// ═══════════════════════════════════════════════════════════
function PortfolioChart({ items }) {
  // Generate data points from transactions
  const dataPoints = useMemo(() => {
    if (items.length === 0) return [];

    // Get all transactions with dates
    const allTransactions = items.flatMap(item =>
      (item.transactions || []).map(tx => ({
        date: tx.date,
        cost: tx.price * tx.quantity,
        item,
      }))
    );

    if (allTransactions.length === 0) return [];

    // Sort by date
    allTransactions.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Build cumulative data
    let cumulativeCost = 0;
    const points = [];
    const dateMap = new Map();

    allTransactions.forEach(tx => {
      cumulativeCost += tx.cost;
      dateMap.set(tx.date, cumulativeCost);
    });

    // Convert to array
    dateMap.forEach((value, date) => {
      points.push({ date, invested: value });
    });

    // Add current value point (today)
    const totalInvested = items.reduce((s, i) => s + totalCost(i), 0);
    const currentValue = items.reduce((s, i) => s + i.currentPrice * totalQty(i), 0);
    const todayDate = today();

    if (points.length > 0) {
      points.push({ date: todayDate, invested: totalInvested, currentValue });
    }

    return points;
  }, [items]);

  if (dataPoints.length < 2) return null;

  // Chart dimensions
  const width = 320;
  const height = 150;
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Scale calculations
  const maxValue = Math.max(
    ...dataPoints.map(d => d.invested),
    dataPoints[dataPoints.length - 1]?.currentValue || 0
  );
  const minDate = new Date(dataPoints[0].date);
  const maxDate = new Date(dataPoints[dataPoints.length - 1].date);
  const dateRange = maxDate - minDate || 1;

  const scaleX = (date) => padding.left + ((new Date(date) - minDate) / dateRange) * chartWidth;
  const scaleY = (value) => padding.top + chartHeight - (value / maxValue) * chartHeight;

  // Generate path
  const linePath = dataPoints.map((d, i) =>
    `${i === 0 ? 'M' : 'L'} ${scaleX(d.date)} ${scaleY(d.invested)}`
  ).join(' ');

  // Area under curve
  const areaPath = linePath +
    ` L ${scaleX(dataPoints[dataPoints.length - 1].date)} ${scaleY(0)}` +
    ` L ${scaleX(dataPoints[0].date)} ${scaleY(0)} Z`;

  const currentValue = dataPoints[dataPoints.length - 1]?.currentValue || 0;
  const totalInvested = dataPoints[dataPoints.length - 1]?.invested || 0;
  const isProfit = currentValue >= totalInvested;

  return (
    <Card style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 8, fontFamily: PIXEL_FONT, color: P.text, marginBottom: 12, letterSpacing: 1 }}>
        EVOLUTION PORTFOLIO
      </div>

      <svg width={width} height={height} style={{ display: "block", maxWidth: "100%" }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(pct => (
          <g key={pct}>
            <line
              x1={padding.left}
              y1={scaleY(maxValue * pct)}
              x2={width - padding.right}
              y2={scaleY(maxValue * pct)}
              stroke={P.borderLight}
              strokeDasharray="4 2"
            />
            <text
              x={padding.left - 8}
              y={scaleY(maxValue * pct)}
              fontSize={10}
              fontFamily={BODY_FONT}
              fill={P.soft}
              textAnchor="end"
              dominantBaseline="middle"
            >
              {fmt(maxValue * pct).replace(/[^\d]/g, '')}
            </text>
          </g>
        ))}

        {/* Area fill */}
        <path d={areaPath} fill={isProfit ? `${P.success}20` : `${P.danger}20`} />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={isProfit ? P.success : P.danger}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {dataPoints.map((d, i) => (
          <circle
            key={i}
            cx={scaleX(d.date)}
            cy={scaleY(d.invested)}
            r={4}
            fill={P.card}
            stroke={isProfit ? P.success : P.danger}
            strokeWidth={2}
          />
        ))}

        {/* Current value indicator */}
        {currentValue > 0 && (
          <circle
            cx={scaleX(dataPoints[dataPoints.length - 1].date)}
            cy={scaleY(currentValue)}
            r={6}
            fill={isProfit ? P.success : P.danger}
            stroke={P.card}
            strokeWidth={2}
          />
        )}
      </svg>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginTop: 12, justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 12, height: 3, background: isProfit ? P.success : P.danger, borderRadius: 2 }} />
          <span style={{ fontSize: 14, fontFamily: BODY_FONT, color: P.soft }}>Investi</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 8, height: 8, background: isProfit ? P.success : P.danger, borderRadius: "50%" }} />
          <span style={{ fontSize: 14, fontFamily: BODY_FONT, color: P.soft }}>Valeur actuelle</span>
        </div>
      </div>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════
// ITEM PRICE HISTORY CHART
// ═══════════════════════════════════════════════════════════
function ItemPriceChart({ priceHistory }) {
  if (!priceHistory || priceHistory.length < 2) return null;

  const width = 280;
  const height = 100;
  const padding = { top: 10, right: 10, bottom: 20, left: 45 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const prices = priceHistory.map(p => p.price);
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  const priceRange = maxPrice - minPrice || 1;

  const scaleX = (i) => padding.left + (i / (priceHistory.length - 1)) * chartWidth;
  const scaleY = (price) => padding.top + chartHeight - ((price - minPrice) / priceRange) * chartHeight;

  const linePath = priceHistory.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(p.price)}`
  ).join(' ');

  const firstPrice = priceHistory[0].price;
  const lastPrice = priceHistory[priceHistory.length - 1].price;
  const isUp = lastPrice >= firstPrice;

  return (
    <svg width={width} height={height} style={{ display: "block", maxWidth: "100%", marginBottom: 8 }}>
      {/* Grid lines */}
      {[0, 0.5, 1].map(pct => (
        <g key={pct}>
          <line
            x1={padding.left}
            y1={scaleY(minPrice + priceRange * pct)}
            x2={width - padding.right}
            y2={scaleY(minPrice + priceRange * pct)}
            stroke={P.borderLight}
            strokeDasharray="2 2"
          />
          <text
            x={padding.left - 5}
            y={scaleY(minPrice + priceRange * pct)}
            fontSize={10}
            fontFamily={BODY_FONT}
            fill={P.soft}
            textAnchor="end"
            dominantBaseline="middle"
          >
            {Math.round(minPrice + priceRange * pct)}€
          </text>
        </g>
      ))}

      {/* Area */}
      <path
        d={linePath + ` L ${scaleX(priceHistory.length - 1)} ${scaleY(minPrice)} L ${scaleX(0)} ${scaleY(minPrice)} Z`}
        fill={isUp ? `${P.success}30` : `${P.danger}30`}
      />

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke={isUp ? P.success : P.danger}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Points */}
      {priceHistory.map((p, i) => (
        <circle
          key={i}
          cx={scaleX(i)}
          cy={scaleY(p.price)}
          r={3}
          fill={P.card}
          stroke={isUp ? P.success : P.danger}
          strokeWidth={2}
        />
      ))}
    </svg>
  );
}

// Fee rates for platforms
const PLATFORM_FEES = {
  ebay: { label: "eBay", rate: 0.13 },
  cardmarket: { label: "Cardmarket", rate: 0.05 },
  vinted: { label: "Vinted", rate: 0.05 },
  leboncoin: { label: "Leboncoin", rate: 0 },
  direct: { label: "Vente directe", rate: 0 },
};

function ItemDetailModal({ item, onClose, onUpdate }) {
  const [newTx, setNewTx] = useState({ date: today(), price: "", quantity: "1", source: "" });
  const [editingPrice, setEditingPrice] = useState(false);
  const [editPrice, setEditPrice] = useState(String(item.currentPrice));
  const [editingTxId, setEditingTxId] = useState(null);
  const [editTx, setEditTx] = useState({ source: "", date: "", price: "", quantity: "" });
  const [showSellForm, setShowSellForm] = useState(false);
  const [sellForm, setSellForm] = useState({ date: today(), price: "", platform: "ebay", quantity: String(totalQty(item)) });

  const isSold = item.sold && item.sold.length > 0;
  const soldQty = isSold ? item.sold.reduce((s, sale) => s + sale.quantity, 0) : 0;
  const remainingQty = totalQty(item) - soldQty;

  // Calculate P&L - if sold, use actual sale data; otherwise use current price estimate
  const totalSaleRevenue = isSold ? item.sold.reduce((s, sale) => s + sale.netAmount, 0) : 0;
  const soldCost = isSold ? (avgPrice(item) * soldQty) : 0;
  const realizedPnL = totalSaleRevenue - soldCost;
  const unrealizedPnL = remainingQty > 0 ? (item.currentPrice - avgPrice(item)) * remainingQty : 0;
  const totalPnL = realizedPnL + unrealizedPnL;
  const isUp = totalPnL >= 0;

  const [targetPrice, setTargetPrice] = useState(item.targetPrice ? String(item.targetPrice) : "");
  const [showPriceHistory, setShowPriceHistory] = useState(false);
  const toast = useToast();

  const savePrice = () => {
    const v = Number(editPrice);
    if (!isNaN(v) && v >= 0) {
      // Add to price history
      const historyEntry = { date: today(), price: v };
      const newHistory = [...(item.priceHistory || []), historyEntry];
      onUpdate({ ...item, currentPrice: v, priceHistory: newHistory });

      // Check if target price alert should trigger
      if (item.targetPrice && v >= item.targetPrice) {
        toast?.success(`🎯 ${item.name} a atteint ton prix cible !`);
      }
    }
    setEditingPrice(false);
  };

  const saveTargetPrice = () => {
    const v = targetPrice ? Number(targetPrice) : null;
    onUpdate({ ...item, targetPrice: v });
    toast?.success(v ? `Alerte fixée à ${fmt(v)}` : "Alerte supprimée");
  };

  // eBay market price tracking
  const [ebayQuery, setEbayQuery] = useState(item.ebayQuery || "");
  const [editingEbayQuery, setEditingEbayQuery] = useState(false);
  const [loadingMarketPrice, setLoadingMarketPrice] = useState(false);

  // Generate suggested eBay query from item name
  const suggestEbayQuery = () => {
    const name = item.name.toLowerCase()
      .replace(/[éèê]/g, "e")
      .replace(/[àâ]/g, "a")
      .replace(/[ùû]/g, "u")
      .replace(/[ôö]/g, "o")
      .replace(/[îï]/g, "i");
    return `pokemon ${name} sealed`;
  };

  const saveEbayQuery = () => {
    onUpdate({ ...item, ebayQuery: ebayQuery.trim() || null });
    setEditingEbayQuery(false);
    toast?.success(ebayQuery.trim() ? "Requête eBay enregistrée" : "Requête eBay supprimée");
  };

  const fetchMarketPrice = async () => {
    const query = item.ebayQuery || ebayQuery.trim();
    if (!query) {
      toast?.error("Définis d'abord une requête eBay");
      return;
    }

    setLoadingMarketPrice(true);
    try {
      // Call Supabase Edge Function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ebay-price`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ query }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la récupération du prix");
      }

      // Update item with market price data
      onUpdate({
        ...item,
        ebayQuery: query,
        marketPrice: data.median,
        marketPriceMin: data.min,
        marketPriceMax: data.max,
        marketPriceSalesCount: data.salesCount,
        marketPriceUpdatedAt: data.updatedAt,
      });

      toast?.success(`Prix marché mis à jour : ${fmt(data.median)}`);
    } catch (error) {
      console.error("Error fetching market price:", error);
      toast?.error(error.message || "Erreur lors de la récupération du prix");
    } finally {
      setLoadingMarketPrice(false);
    }
  };

  const addTx = () => { if (!newTx.source || Number(newTx.price) <= 0) return; onUpdate({ ...item, transactions: [...item.transactions, { id: Date.now(), date: newTx.date, price: Number(newTx.price), quantity: Number(newTx.quantity), source: newTx.source }] }); setNewTx({ date: today(), price: "", quantity: "1", source: "" }); };
  const deleteTx = (id) => { const rem = item.transactions.filter((t) => t.id !== id); onUpdate(rem.length === 0 ? null : { ...item, transactions: rem }); };
  const saveTx = (id) => { if (!editTx.source || Number(editTx.price) <= 0) return; onUpdate({ ...item, transactions: item.transactions.map((t) => t.id === id ? { ...t, source: editTx.source, date: editTx.date, price: Number(editTx.price), quantity: Number(editTx.quantity) } : t) }); setEditingTxId(null); };

  const recordSale = () => {
    const price = Number(sellForm.price);
    const qty = Number(sellForm.quantity);
    if (price <= 0 || qty <= 0 || qty > remainingQty) return;
    const feeRate = PLATFORM_FEES[sellForm.platform]?.rate || 0;
    const grossAmount = price * qty;
    const fees = grossAmount * feeRate;
    const netAmount = grossAmount - fees;
    const sale = { id: Date.now(), date: sellForm.date, price, quantity: qty, platform: sellForm.platform, grossAmount, fees, netAmount };
    onUpdate({ ...item, sold: [...(item.sold || []), sale] });
    setShowSellForm(false);
    setSellForm({ date: today(), price: "", platform: "ebay", quantity: String(Math.max(remainingQty - qty, 1)) });
  };

  const deleteSale = (id) => {
    onUpdate({ ...item, sold: item.sold.filter((s) => s.id !== id) });
  };

  return (
    <BottomModal onClose={onClose}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
        <div><div style={{ fontSize: 20, fontWeight: 700, color: P.text }}>{item.name}</div><div style={{ marginTop: 8 }}><TypeBadge type={item.type} /></div></div>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 24, color: P.soft, cursor: "pointer" }}>✕</button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: isSold ? "1fr 1fr" : "1fr 1fr 1fr", gap: 10, marginBottom: 22 }}>
        {[
          { label: "Coût total", value: fmt(totalCost(item)), sub: `${totalQty(item)} unité${totalQty(item) > 1 ? "s" : ""} · moy. ${fmt(avgPrice(item))}` },
          ...(isSold ? [
            { label: "Vendu", value: fmt(totalSaleRevenue), sub: `${soldQty} vendu${soldQty > 1 ? "s" : ""} · ${remainingQty} restant${remainingQty > 1 ? "s" : ""}` },
          ] : [
            { label: "Valeur act.", value: fmt(item.currentPrice * totalQty(item)), sub: `${fmt(item.currentPrice)} × ${totalQty(item)}` },
          ]),
          { label: isSold ? "P&L réel" : "P&L estimé", value: `${isUp ? "+" : ""}${fmt(totalPnL)}`, sub: isSold && realizedPnL !== 0 ? `Réalisé: ${realizedPnL >= 0 ? "+" : ""}${fmt(realizedPnL)}` : `${isUp ? "+" : ""}${((totalPnL / totalCost(item)) * 100).toFixed(1)}%`, hl: true, isUp },
        ].map((s, i) => (
          <div key={i} style={{ background: "#f8fafc", borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 11, color: P.soft, fontWeight: 500, letterSpacing: 0.3, textTransform: "uppercase", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: s.hl ? (s.isUp ? "#16a34a" : "#dc2626") : P.text }}>{s.value}</div>
            <div style={{ fontSize: 11, color: P.soft, marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Prix editable */}
      <div style={{ background: "#f8fafc", borderRadius: 10, padding: "14px 16px", marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, color: P.soft, fontWeight: 500, letterSpacing: 0.3, textTransform: "uppercase", marginBottom: 4 }}>Prix actuel</div>
          {!editingPrice ? <div style={{ fontSize: 24, fontWeight: 700, color: P.text }}>{fmt(item.currentPrice)}</div> : (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} autoFocus onKeyDown={(e) => { if (e.key === "Enter") savePrice(); }}
                style={{ width: 90, padding: "6px 10px", borderRadius: 8, border: "1.5px solid #d1c4e9", fontSize: 18, fontWeight: 700, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
              <span style={{ fontSize: 15, color: P.soft }}>€</span>
              <button onClick={savePrice} style={{ fontSize: 13, fontWeight: 600, color: "#fff", background: P.primary, border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontFamily: "inherit" }}>OK</button>
              <button onClick={() => setEditingPrice(false)} style={{ fontSize: 14, color: P.soft, background: "transparent", border: "none", cursor: "pointer" }}>✕</button>
            </div>
          )}
        </div>
        {!editingPrice && <button onClick={() => { setEditingPrice(true); setEditPrice(String(item.currentPrice)); }} style={{ fontSize: 13, fontWeight: 600, color: P.primary, background: "#f1f5f9", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontFamily: "inherit" }}>✎ Modifier</button>}
      </div>

      {/* Target Price Alert */}
      <div style={{ background: "#fef3c7", borderRadius: 10, padding: "14px 16px", marginBottom: 18, border: "2px solid #f59e0b" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 18 }}>🎯</span>
          <div style={{ fontSize: 11, color: "#92400e", fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase" }}>Alerte de prix</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="number"
            placeholder="Prix cible..."
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1.5px solid #fbbf24", fontSize: 16, fontFamily: BODY_FONT, outline: "none", background: "#fff", color: P.text }}
          />
          <span style={{ fontSize: 15, color: "#92400e" }}>€</span>
          <button onClick={saveTargetPrice} style={{ fontSize: 12, fontWeight: 600, color: "#fff", background: "#f59e0b", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontFamily: PIXEL_FONT }}>
            {item.targetPrice ? "MAJ" : "SET"}
          </button>
        </div>
        {item.targetPrice && (
          <div style={{ marginTop: 8, fontSize: 14, fontFamily: BODY_FONT, color: "#92400e" }}>
            Alerte active : {fmt(item.targetPrice)} ({item.currentPrice >= item.targetPrice ? "✅ Atteint !" : `${((item.targetPrice - item.currentPrice) / item.currentPrice * 100).toFixed(0)}% restant`})
          </div>
        )}
      </div>

      {/* eBay Market Price */}
      <div style={{ background: "#e0f2fe", borderRadius: 10, padding: "14px 16px", marginBottom: 18, border: "2px solid #0284c7" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 18 }}>📊</span>
          <div style={{ fontSize: 11, color: "#0369a1", fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase" }}>Prix marché eBay</div>
        </div>

        {/* eBay Query */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: "#0369a1", marginBottom: 6, fontFamily: BODY_FONT }}>Requête de recherche :</div>
          {editingEbayQuery ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="text"
                value={ebayQuery}
                onChange={(e) => setEbayQuery(e.target.value)}
                placeholder={suggestEbayQuery()}
                style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1.5px solid #0284c7", fontSize: 14, fontFamily: BODY_FONT, outline: "none", background: "#fff", color: P.text }}
              />
              <button onClick={saveEbayQuery} style={{ fontSize: 10, fontWeight: 600, color: "#fff", background: "#0284c7", border: "none", borderRadius: 6, padding: "8px 12px", cursor: "pointer", fontFamily: PIXEL_FONT }}>OK</button>
              <button onClick={() => setEditingEbayQuery(false)} style={{ fontSize: 14, color: "#64748b", background: "none", border: "none", cursor: "pointer" }}>✕</button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ flex: 1, padding: "8px 12px", background: "#fff", borderRadius: 8, fontSize: 14, fontFamily: BODY_FONT, color: item.ebayQuery ? P.text : P.soft }}>
                {item.ebayQuery || "Non définie"}
              </div>
              <button onClick={() => { setEbayQuery(item.ebayQuery || suggestEbayQuery()); setEditingEbayQuery(true); }} style={{ fontSize: 10, fontWeight: 600, color: "#0284c7", background: "#fff", border: "1.5px solid #0284c7", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontFamily: PIXEL_FONT }}>
                {item.ebayQuery ? "EDIT" : "SET"}
              </button>
            </div>
          )}
        </div>

        {/* Market Price Display */}
        {item.marketPrice ? (
          <div style={{ background: "#fff", borderRadius: 8, padding: 12, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: P.text, fontFamily: BODY_FONT }}>{fmt(item.marketPrice)}</div>
                <div style={{ fontSize: 12, color: P.soft, fontFamily: BODY_FONT }}>Médiane de {item.marketPriceSalesCount} ventes</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, color: P.soft, fontFamily: BODY_FONT }}>Min: {fmt(item.marketPriceMin)}</div>
                <div style={{ fontSize: 12, color: P.soft, fontFamily: BODY_FONT }}>Max: {fmt(item.marketPriceMax)}</div>
              </div>
            </div>

            {/* Comparison with your price */}
            {(() => {
              const diff = item.currentPrice - item.marketPrice;
              const diffPct = ((diff / item.marketPrice) * 100).toFixed(1);
              const isAbove = diff > 0;
              return (
                <div style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  background: isAbove ? "#dcfce7" : "#fee2e2",
                  border: `1px solid ${isAbove ? "#86efac" : "#fca5a5"}`,
                }}>
                  <div style={{ fontSize: 14, fontFamily: BODY_FONT, color: isAbove ? "#166534" : "#991b1b", fontWeight: 600 }}>
                    {isAbove ? "📈" : "📉"} Ton prix est {isAbove ? "+" : ""}{fmt(diff)} ({isAbove ? "+" : ""}{diffPct}%) {isAbove ? "au-dessus" : "en-dessous"} du marché
                  </div>
                </div>
              );
            })()}

            {/* Last updated */}
            <div style={{ marginTop: 8, fontSize: 11, color: P.soft, fontFamily: BODY_FONT }}>
              Mis à jour : {item.marketPriceUpdatedAt ? new Date(item.marketPriceUpdatedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "N/A"}
            </div>
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: 8, padding: 12, marginBottom: 12, textAlign: "center", color: P.soft, fontFamily: BODY_FONT }}>
            Aucun prix marché disponible
          </div>
        )}

        {/* Refresh button */}
        <button
          onClick={fetchMarketPrice}
          disabled={loadingMarketPrice || (!item.ebayQuery && !ebayQuery.trim())}
          style={{
            width: "100%",
            padding: "10px",
            border: "none",
            borderRadius: 8,
            background: loadingMarketPrice ? "#94a3b8" : "#0284c7",
            color: "#fff",
            fontSize: 11,
            fontFamily: PIXEL_FONT,
            cursor: loadingMarketPrice ? "wait" : "pointer",
            letterSpacing: 1,
            opacity: (!item.ebayQuery && !ebayQuery.trim()) ? 0.5 : 1,
          }}
        >
          {loadingMarketPrice ? "CHARGEMENT..." : "🔄 ACTUALISER LE PRIX MARCHÉ"}
        </button>
      </div>

      {/* Price History Chart */}
      {item.priceHistory && item.priceHistory.length > 1 && (
        <div style={{ background: "#f8fafc", borderRadius: 10, padding: "14px 16px", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: P.soft, fontWeight: 500, letterSpacing: 0.3, textTransform: "uppercase" }}>Historique des prix</div>
            <button onClick={() => setShowPriceHistory(!showPriceHistory)} style={{ fontSize: 12, color: P.primary, background: "none", border: "none", cursor: "pointer", fontFamily: BODY_FONT }}>
              {showPriceHistory ? "Masquer" : "Voir graphique"}
            </button>
          </div>
          {showPriceHistory && <ItemPriceChart priceHistory={item.priceHistory} />}
          <div style={{ fontSize: 14, fontFamily: BODY_FONT, color: P.soft }}>
            {item.priceHistory.length} mise{item.priceHistory.length > 1 ? "s" : ""} à jour
            {item.priceHistory.length >= 2 && (() => {
              const first = item.priceHistory[0].price;
              const last = item.priceHistory[item.priceHistory.length - 1].price;
              const change = ((last - first) / first * 100).toFixed(1);
              return ` · ${change >= 0 ? "+" : ""}${change}% depuis le début`;
            })()}
          </div>
        </div>
      )}

      {/* Historique */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: P.text, marginBottom: 12 }}>Historique des achats</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[...item.transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).map((tx) => {
            if (editingTxId === tx.id) {
              return (
                <div key={tx.id} style={{ background: "#f1f5f9", borderRadius: 12, padding: "12px 14px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                    {[{ key: "source", label: "Où acheté", type: "text" }, { key: "date", label: "Date", type: "date" }, { key: "price", label: "Prix (€)", type: "number" }, { key: "quantity", label: "Quantité", type: "number" }].map((f) => (
                      <div key={f.key}>
                        <div style={{ fontSize: 11, color: P.soft, fontWeight: 500, marginBottom: 4 }}>{f.label}</div>
                        <input type={f.type} value={editTx[f.key]} onChange={(e) => setEditTx({ ...editTx, [f.key]: e.target.value })}
                          style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #d1c4e9", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#fff", color: P.text }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => saveTx(tx.id)} style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#fff", background: P.primary, border: "none", borderRadius: 8, padding: "8px 0", cursor: "pointer", fontFamily: "inherit" }}>Sauvegarder</button>
                    <button onClick={() => setEditingTxId(null)} style={{ fontSize: 13, color: P.soft, background: "rgba(255,255,255,0.6)", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontFamily: "inherit" }}>Annuler</button>
                    <button onClick={() => deleteTx(tx.id)} style={{ fontSize: 13, fontWeight: 600, color: "#dc2626", background: "rgba(255,255,255,0.6)", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontFamily: "inherit" }}>Supprimer</button>
                  </div>
                </div>
              );
            }
            return (
              <div key={tx.id} onClick={() => { setEditingTxId(tx.id); setEditTx({ source: tx.source, date: tx.date, price: String(tx.price), quantity: String(tx.quantity) }); }}
                style={{ display: "flex", alignItems: "center", gap: 12, background: "#f8fafc", borderRadius: 12, padding: "10px 14px", cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")} onMouseLeave={(e) => (e.currentTarget.style.background = "#f8fafc")}>
                <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600, color: P.text }}>{tx.source}</div><div style={{ fontSize: 12, color: P.soft }}>{fmtDate(tx.date)} · Qté : {tx.quantity}</div></div>
                <div style={{ textAlign: "right" }}><div style={{ fontSize: 16, fontWeight: 700, color: P.text }}>{fmt(tx.price)}</div><div style={{ fontSize: 11, color: P.soft }}>/ unité</div></div>
                <div style={{ fontSize: 14, color: P.soft }}>›</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ventes enregistrées */}
      {isSold && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: P.text, marginBottom: 12 }}>Ventes enregistrées</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {item.sold.map((sale) => (
              <div key={sale.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "#d1fae5", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#065f46" }}>{PLATFORM_FEES[sale.platform]?.label || sale.platform}</div>
                  <div style={{ fontSize: 12, color: "#047857" }}>{fmtDate(sale.date)} · {sale.quantity} unité{sale.quantity > 1 ? "s" : ""}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#065f46" }}>{fmt(sale.netAmount)}</div>
                  {sale.fees > 0 && <div style={{ fontSize: 11, color: "#047857" }}>-{fmt(sale.fees)} frais</div>}
                </div>
                <button onClick={() => deleteSale(sale.id)} style={{ background: "none", border: "none", fontSize: 18, color: "#047857", cursor: "pointer" }}
                  onMouseEnter={(e) => (e.target.style.color = "#dc2626")} onMouseLeave={(e) => (e.target.style.color = "#047857")}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bouton/Formulaire vente */}
      {remainingQty > 0 && (
        <div style={{ marginBottom: 18 }}>
          {!showSellForm ? (
            <button onClick={() => setShowSellForm(true)}
              style={{ width: "100%", padding: 14, borderRadius: 10, border: "1px solid #16a34a", background: "#f0fdf4", color: "#16a34a", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              💰 Enregistrer une vente ({remainingQty} disponible{remainingQty > 1 ? "s" : ""})
            </button>
          ) : (
            <div style={{ background: "#f0fdf4", borderRadius: 10, padding: 16, border: "1px solid #bbf7d0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#065f46" }}>Enregistrer une vente</div>
                <button onClick={() => setShowSellForm(false)} style={{ background: "none", border: "none", fontSize: 20, color: "#047857", cursor: "pointer" }}>✕</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Input label="Prix de vente (€)" type="number" placeholder="200" value={sellForm.price} onChange={(e) => setSellForm({ ...sellForm, price: e.target.value })} />
                <Input label="Quantité" type="number" placeholder="1" value={sellForm.quantity} onChange={(e) => setSellForm({ ...sellForm, quantity: e.target.value })} />
                <Input label="Date de vente" type="date" value={sellForm.date} onChange={(e) => setSellForm({ ...sellForm, date: e.target.value })} />
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 13, color: P.soft, fontWeight: 500, letterSpacing: 0.3 }}>Plateforme</label>
                  <select value={sellForm.platform} onChange={(e) => setSellForm({ ...sellForm, platform: e.target.value })}
                    style={{ display: "block", width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #bbf7d0", fontSize: 15, fontFamily: "inherit", background: "#fff", color: P.text, outline: "none", boxSizing: "border-box" }}>
                    {Object.entries(PLATFORM_FEES).map(([k, v]) => (
                      <option key={k} value={k}>{v.label} ({(v.rate * 100).toFixed(0)}% frais)</option>
                    ))}
                  </select>
                </div>
              </div>
              {sellForm.price && (
                <div style={{ background: "#dcfce7", borderRadius: 8, padding: "10px 12px", marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: "#047857", marginBottom: 4 }}>Estimation nette après frais :</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#065f46" }}>
                    {fmt(Number(sellForm.price) * Number(sellForm.quantity || 1) * (1 - (PLATFORM_FEES[sellForm.platform]?.rate || 0)))}
                  </div>
                </div>
              )}
              <button onClick={recordSale} style={{ width: "100%", padding: 12, borderRadius: 10, border: "none", background: "#16a34a", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                Confirmer la vente
              </button>
            </div>
          )}
        </div>
      )}

      {/* Nouvelle transaction */}
      <div style={{ background: "#f8fafc", borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: P.text, marginBottom: 12 }}>+ Nouvel achat</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Input label="Où acheté" type="text" placeholder="Amazon..." value={newTx.source} onChange={(e) => setNewTx({ ...newTx, source: e.target.value })} />
          <Input label="Date" type="date" value={newTx.date} onChange={(e) => setNewTx({ ...newTx, date: e.target.value })} />
          <Input label="Prix (€)" type="number" placeholder="180" value={newTx.price} onChange={(e) => setNewTx({ ...newTx, price: e.target.value })} />
          <Input label="Quantité" type="number" placeholder="1" value={newTx.quantity} onChange={(e) => setNewTx({ ...newTx, quantity: e.target.value })} />
        </div>
        <button onClick={addTx} style={{ width: "100%", padding: 12, borderRadius: 10, border: "none", background: "#1e293b", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginTop: 6 }}>Ajouter achat</button>
      </div>
    </BottomModal>
  );
}

function WalletTab({ items, setItems, events }) {
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", type: "Bundle", source: "", date: today(), price: "", quantity: "1", currentPrice: "", imageUrl: "" });
  const selectedItem = useMemo(() => items.find((i) => i.id === selectedId) || null, [items, selectedId]);
  const isDesktop = useIsDesktop();
  const isWide = useIsWide();
  const toast = useToast();

  // Search and filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all"); // all, profit, loss, sold
  const [sortBy, setSortBy] = useState("name"); // name, value, pnl, date

  // Available types from items
  const itemTypes = useMemo(() => {
    const types = [...new Set(items.map(i => i.type))];
    return types.sort();
  }, [items]);

  // Filtered and sorted items
  const filteredItems = useMemo(() => {
    let result = items;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(i =>
        i.name.toLowerCase().includes(query) ||
        i.type.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (filterType !== "all") {
      result = result.filter(i => i.type === filterType);
    }

    // Status filter
    if (filterStatus !== "all") {
      result = result.filter(i => {
        const pnl = getItemPnL(i);
        const hasSales = i.sold && i.sold.length > 0;
        const soldQty = hasSales ? i.sold.reduce((s, sale) => s + sale.quantity, 0) : 0;
        const isFullySold = soldQty >= totalQty(i);

        if (filterStatus === "profit") return pnl >= 0;
        if (filterStatus === "loss") return pnl < 0;
        if (filterStatus === "sold") return isFullySold;
        return true;
      });
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "value":
          return (b.currentPrice * totalQty(b)) - (a.currentPrice * totalQty(a));
        case "pnl":
          return getItemPnLPct(b) - getItemPnLPct(a);
        case "date":
          const dateA = a.transactions?.[0]?.date || "1970-01-01";
          const dateB = b.transactions?.[0]?.date || "1970-01-01";
          return new Date(dateB) - new Date(dateA);
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return result;
  }, [items, searchQuery, filterType, filterStatus, sortBy]);

  // Get releases sorted by date (most recent first), grouped by year
  const releasesByYear = useMemo(() => {
    const releases = events.filter((e) => e.type === "release").sort((a, b) => new Date(b.date) - new Date(a.date));
    return releases.reduce((acc, ev) => {
      const year = new Date(ev.date + "T12:00:00").getFullYear();
      if (!acc[year]) acc[year] = [];
      acc[year].push(ev);
      return acc;
    }, {});
  }, [events]);

  const totalBuy = items.reduce((s, i) => s + totalCost(i), 0);
  const totalCur = items.reduce((s, i) => s + i.currentPrice * totalQty(i), 0);
  // Calculate real total P&L (including sales)
  const totalRealPnL = items.reduce((s, i) => s + getItemPnL(i), 0);
  const totalPnLPct = totalBuy > 0 ? ((totalRealPnL / totalBuy) * 100).toFixed(1) : "0.0";
  const maxVal = Math.max(...items.map((i) => i.currentPrice * totalQty(i)), 1);

  // Advanced stats - use real P&L (sales > estimated)
  const realizedPnL = items.reduce((s, i) => {
    if (!i.sold || i.sold.length === 0) return s;
    const soldRevenue = i.sold.reduce((r, sale) => r + sale.netAmount, 0);
    const soldQty = i.sold.reduce((q, sale) => q + sale.quantity, 0);
    const soldCost = avgPrice(i) * soldQty;
    return s + (soldRevenue - soldCost);
  }, 0);

  // Best/worst use REAL P&L % (actual sales take priority over estimates)
  const bestItem = items.length > 0 ? items.reduce((best, item) => {
    const pct = getItemPnLPct(item);
    return pct > getItemPnLPct(best) ? item : best;
  }, items[0]) : null;

  const worstItem = items.length > 0 ? items.reduce((worst, item) => {
    const pct = getItemPnLPct(item);
    return pct < getItemPnLPct(worst) ? item : worst;
  }, items[0]) : null;

  const hasAnySales = items.some(i => i.sold && i.sold.length > 0);

  const addItem = () => {
    if (!form.name || Number(form.price) <= 0) {
      toast?.error("Veuillez remplir tous les champs");
      return;
    }
    const newItem = {
      id: Date.now(),
      name: form.name,
      type: form.type,
      currentPrice: Number(form.currentPrice) || Number(form.price),
      imageUrl: form.imageUrl || null,
      transactions: [{
        id: Date.now() + 1,
        date: form.date,
        price: Number(form.price),
        quantity: Number(form.quantity),
        source: form.source || "Non spécifié"
      }]
    };
    setItems([...items, newItem]);
    setForm({ name: "", type: "Bundle", source: "", date: today(), price: "", quantity: "1", currentPrice: "", imageUrl: "" });
    setShowForm(false);
    toast?.success(`${form.name} ajouté !`);
  };

  const handleItemUpdate = (updated) => {
    if (updated === null) {
      const itemName = items.find(i => i.id === selectedId)?.name || "Item";
      setItems((p) => p.filter((i) => i.id !== selectedId));
      setSelectedId(null);
      toast?.success(`${itemName} supprimé`);
    } else {
      setItems((p) => p.map((i) => (i.id === updated.id ? updated : i)));
      toast?.success("Modifications sauvegardées");
    }
  };

  // Export to CSV
  const exportCSV = () => {
    const headers = ["Nom", "Type", "Quantité", "Prix Moyen", "Prix Actuel", "Valeur Totale", "P&L", "P&L %"];
    const rows = items.map(item => [
      item.name,
      item.type,
      totalQty(item),
      avgPrice(item).toFixed(2),
      item.currentPrice,
      (item.currentPrice * totalQty(item)).toFixed(2),
      getItemPnL(item).toFixed(2),
      getItemPnLPct(item).toFixed(1) + "%"
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(";")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `hexuo_portfolio_${today()}.csv`;
    link.click();
    toast?.success("Export CSV téléchargé !");
  };

  // Export to PDF (simple HTML-based)
  const exportPDF = () => {
    const printWindow = window.open("", "_blank");
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Hexuo Portfolio - ${today()}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #5c6bc0; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background: #5c6bc0; color: white; }
          .positive { color: #16a34a; }
          .negative { color: #dc2626; }
          .summary { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h1>🎴 Hexuo Portfolio</h1>
        <p>Exporté le ${new Date().toLocaleDateString("fr-FR")}</p>
        <div class="summary">
          <strong>Valeur totale:</strong> ${fmt(totalCur)}<br>
          <strong>Investi:</strong> ${fmt(totalBuy)}<br>
          <strong>P&L:</strong> <span class="${totalRealPnL >= 0 ? "positive" : "negative"}">${totalRealPnL >= 0 ? "+" : ""}${fmt(totalRealPnL)} (${totalPnLPct}%)</span>
        </div>
        <table>
          <thead>
            <tr><th>Nom</th><th>Type</th><th>Qté</th><th>Prix Moy.</th><th>Prix Act.</th><th>Valeur</th><th>P&L</th></tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.type}</td>
                <td>${totalQty(item)}</td>
                <td>${fmt(avgPrice(item))}</td>
                <td>${fmt(item.currentPrice)}</td>
                <td>${fmt(item.currentPrice * totalQty(item))}</td>
                <td class="${getItemPnL(item) >= 0 ? "positive" : "negative"}">${getItemPnL(item) >= 0 ? "+" : ""}${fmt(getItemPnL(item))} (${getItemPnLPct(item).toFixed(1)}%)</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        <script>window.print();</script>
      </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
    toast?.success("PDF prêt à imprimer !");
  };

  // View mode state
  const [viewMode, setViewMode] = useState("list"); // list, grid
  const [quickAdd, setQuickAdd] = useState({ show: false, name: "", price: "" });

  // Quick add function
  const handleQuickAdd = () => {
    if (!quickAdd.name || Number(quickAdd.price) <= 0) {
      toast?.error("Nom et prix requis");
      return;
    }
    const newItem = {
      id: Date.now(),
      name: quickAdd.name,
      type: "Bundle",
      currentPrice: Number(quickAdd.price),
      imageUrl: null,
      priceHistory: [{ date: today(), price: Number(quickAdd.price) }],
      transactions: [{
        id: Date.now() + 1,
        date: today(),
        price: Number(quickAdd.price),
        quantity: 1,
        source: "Ajout rapide"
      }]
    };
    setItems([...items, newItem]);
    setQuickAdd({ show: false, name: "", price: "" });
    toast?.success(`${quickAdd.name} ajouté !`);
  };

  return (
    <div>
      {/* Action bar */}
      {items.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <button onClick={exportCSV} style={{ padding: "8px 14px", border: `2px solid ${P.borderLight}`, borderRadius: 8, background: P.card, color: P.text, fontSize: 14, fontFamily: BODY_FONT, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            📊 Export CSV
          </button>
          <button onClick={exportPDF} style={{ padding: "8px 14px", border: `2px solid ${P.borderLight}`, borderRadius: 8, background: P.card, color: P.text, fontSize: 14, fontFamily: BODY_FONT, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            📄 Export PDF
          </button>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", border: `2px solid ${P.borderLight}`, borderRadius: 8, overflow: "hidden" }}>
            <button onClick={() => setViewMode("list")} style={{ padding: "8px 12px", border: "none", background: viewMode === "list" ? P.primary : P.card, color: viewMode === "list" ? "#fff" : P.text, cursor: "pointer", fontSize: 14 }}>☰</button>
            <button onClick={() => setViewMode("grid")} style={{ padding: "8px 12px", border: "none", background: viewMode === "grid" ? P.primary : P.card, color: viewMode === "grid" ? "#fff" : P.text, cursor: "pointer", fontSize: 14 }}>▦</button>
          </div>
        </div>
      )}

      {/* RETRO OVERVIEW CARD - Game Boy style */}
      <div style={{
        background: P.primary,
        border: `4px solid ${P.border}`,
        padding: "24px",
        color: "#fff",
        marginBottom: 20,
        boxShadow: "0 4px 20px rgba(92, 107, 192, 0.3)",
        borderRadius: 12,
      }}>
        <div style={{ fontSize: 8, fontFamily: PIXEL_FONT, letterSpacing: 1, opacity: 0.7, marginBottom: 8 }}>VALEUR TOTALE</div>
        <div style={{ fontSize: 32, fontFamily: BODY_FONT, fontWeight: 700 }}>{fmt(totalCur)}</div>
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{
            background: totalRealPnL >= 0 ? P.success : P.danger,
            color: "#fff",
            padding: "8px 14px",
            borderRadius: 8,
            fontSize: 16,
            fontFamily: BODY_FONT,
            fontWeight: 700,
          }}>
            {totalRealPnL >= 0 ? "+" : ""}{fmt(totalRealPnL)} ({totalRealPnL >= 0 ? "+" : ""}{totalPnLPct}%)
          </span>
          <span style={{ fontSize: 16, fontFamily: BODY_FONT, opacity: 0.8 }}>{fmt(totalBuy)} investis</span>
        </div>
      </div>

      {/* Stats row - Retro boxes */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
        {[
          { label: "ITEMS", value: items.reduce((s, i) => s + totalQty(i), 0), color: P.text, bg: P.card },
          { label: "PROFIT", value: items.filter((i) => getItemPnL(i) >= 0).length, color: "#fff", bg: P.success },
          { label: "PERTE", value: items.filter((i) => getItemPnL(i) < 0).length, color: "#fff", bg: P.danger },
        ].map((s) => (
          <div key={s.label} style={{
            background: s.bg,
            border: `3px solid ${P.border}`,
            padding: "14px 10px",
            textAlign: "center",
            boxShadow: "3px 3px 0 rgba(0,0,0,0.2)",
          }}>
            <div style={{ fontSize: 28, fontFamily: BODY_FONT, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 8, fontFamily: PIXEL_FONT, color: s.color, letterSpacing: 0.5, marginTop: 4, opacity: 0.8 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Portfolio Evolution Chart */}
      {items.length > 0 && <PortfolioChart items={items} />}

      {/* Advanced stats - Retro card */}
      {items.length > 0 && (
        <Card style={{ marginBottom: 20, padding: "16px 18px" }}>
          <div style={{ fontSize: 8, fontFamily: PIXEL_FONT, color: P.text, marginBottom: 14, letterSpacing: 1 }}>STATISTIQUES</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            {bestItem && getItemPnLPct(bestItem) > 0 && (
              <div style={{ flex: "1 1 45%", minWidth: 120 }}>
                <div style={{ fontSize: 7, fontFamily: PIXEL_FONT, color: P.soft, letterSpacing: 0.5, marginBottom: 6 }}>MEILLEUR</div>
                <div style={{ fontSize: 16, fontFamily: BODY_FONT, color: P.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{bestItem.name}</div>
                <div style={{ fontSize: 18, fontFamily: BODY_FONT, fontWeight: 700, color: P.success }}>+{getItemPnLPct(bestItem).toFixed(1)}%</div>
              </div>
            )}
            {worstItem && getItemPnLPct(worstItem) < 0 && (
              <div style={{ flex: "1 1 45%", minWidth: 120 }}>
                <div style={{ fontSize: 7, fontFamily: PIXEL_FONT, color: P.soft, letterSpacing: 0.5, marginBottom: 6 }}>PIRE</div>
                <div style={{ fontSize: 16, fontFamily: BODY_FONT, color: P.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{worstItem.name}</div>
                <div style={{ fontSize: 18, fontFamily: BODY_FONT, fontWeight: 700, color: P.danger }}>{getItemPnLPct(worstItem).toFixed(1)}%</div>
              </div>
            )}
            {hasAnySales && (
              <div style={{ flex: "1 1 45%", minWidth: 120 }}>
                <div style={{ fontSize: 7, fontFamily: PIXEL_FONT, color: P.soft, letterSpacing: 0.5, marginBottom: 6 }}>P&L REALISE</div>
                <div style={{ fontSize: 22, fontFamily: BODY_FONT, fontWeight: 700, color: realizedPnL >= 0 ? P.success : P.danger }}>{realizedPnL >= 0 ? "+" : ""}{fmt(realizedPnL)}</div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Search and Filter Bar */}
      {items.length > 0 && (
        <Card style={{ marginBottom: 16, padding: "14px 16px" }}>
          {/* Search */}
          <div style={{ position: "relative", marginBottom: 12 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: P.soft }}>🔍</span>
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px 10px 38px",
                border: `2px solid ${P.borderLight}`,
                borderRadius: 8,
                fontSize: 16,
                fontFamily: BODY_FONT,
                background: P.bg,
                color: P.text,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Filters row */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {/* Type filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                padding: "8px 12px",
                border: `2px solid ${P.borderLight}`,
                borderRadius: 6,
                fontSize: 14,
                fontFamily: BODY_FONT,
                background: P.card,
                color: P.text,
                cursor: "pointer",
              }}
            >
              <option value="all">Tous types</option>
              {itemTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                padding: "8px 12px",
                border: `2px solid ${P.borderLight}`,
                borderRadius: 6,
                fontSize: 14,
                fontFamily: BODY_FONT,
                background: P.card,
                color: P.text,
                cursor: "pointer",
              }}
            >
              <option value="all">Tous</option>
              <option value="profit">Profit</option>
              <option value="loss">Perte</option>
              <option value="sold">Vendus</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: "8px 12px",
                border: `2px solid ${P.borderLight}`,
                borderRadius: 6,
                fontSize: 14,
                fontFamily: BODY_FONT,
                background: P.card,
                color: P.text,
                cursor: "pointer",
              }}
            >
              <option value="name">Nom A-Z</option>
              <option value="value">Valeur ↓</option>
              <option value="pnl">P&L % ↓</option>
              <option value="date">Date ↓</option>
            </select>
          </div>

          {/* Results count */}
          {(searchQuery || filterType !== "all" || filterStatus !== "all") && (
            <div style={{ marginTop: 10, fontSize: 14, fontFamily: BODY_FONT, color: P.soft }}>
              {filteredItems.length} résultat{filteredItems.length !== 1 ? "s" : ""}
              {searchQuery && ` pour "${searchQuery}"`}
            </div>
          )}
        </Card>
      )}

      {/* Items - List or Grid view */}
      {viewMode === "grid" ? (
        /* GRID VIEW - Showcase mode */
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: 12,
          marginBottom: 18
        }}>
          {filteredItems.map((item) => {
            const realPnL = getItemPnL(item);
            const isUp = realPnL >= 0;
            return (
              <div
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                style={{
                  background: P.card,
                  border: `2px solid ${P.borderLight}`,
                  borderRadius: 12,
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.15)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                {/* Image */}
                <div style={{ width: "100%", aspectRatio: "1", background: P.bg, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => e.target.style.display = "none"} />
                  ) : (
                    <Pokeball size={48} />
                  )}
                </div>
                {/* Info */}
                <div style={{ padding: "10px 12px" }}>
                  <div style={{ fontSize: 14, fontFamily: BODY_FONT, fontWeight: 600, color: P.text, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
                  <div style={{ fontSize: 16, fontFamily: BODY_FONT, fontWeight: 700, color: P.text }}>{fmt(item.currentPrice)}</div>
                  <div style={{ fontSize: 14, fontFamily: BODY_FONT, fontWeight: 600, color: isUp ? P.success : P.danger }}>{isUp ? "+" : ""}{getItemPnLPct(item).toFixed(1)}%</div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          marginBottom: 18
        }}>
          {filteredItems.map((item) => {
            const realPnL = getItemPnL(item);
            const realPnLPct = getItemPnLPct(item);
            const isUp = realPnL >= 0;
            const hasSales = item.sold && item.sold.length > 0;
            const soldQty = hasSales ? item.sold.reduce((s, sale) => s + sale.quantity, 0) : 0;
            const remainingQty = totalQty(item) - soldQty;
            const isFullySold = remainingQty === 0;
            return (
              <Card key={item.id} onClick={() => setSelectedId(item.id)} style={{ opacity: isFullySold ? 0.7 : 1 }}>
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  {/* Item thumbnail */}
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      style={{
                        width: 56,
                        height: 56,
                        objectFit: "cover",
                        borderRadius: 8,
                        border: `2px solid ${P.borderLight}`,
                        flexShrink: 0,
                      }}
                      onError={(e) => e.target.style.display = "none"}
                    />
                  ) : (
                    <div style={{
                      width: 56,
                      height: 56,
                      background: P.bg,
                      borderRadius: 8,
                      border: `2px solid ${P.borderLight}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <Pokeball size={28} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 18, fontFamily: BODY_FONT, fontWeight: 600, marginBottom: 6 }}>{item.name}</div>
                    <div style={{ marginBottom: 8, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <TypeBadge type={item.type} />
                      {hasSales && (
                        <span style={{
                          fontSize: 8,
                          fontFamily: PIXEL_FONT,
                          background: isFullySold ? P.success : P.warning,
                          color: isFullySold ? "#fff" : P.text,
                          padding: "4px 8px",
                          border: `2px solid ${P.border}`,
                        }}>
                          {isFullySold ? "VENDU" : `${soldQty}/${totalQty(item)}`}
                        </span>
                      )}
                      {item.targetPrice && (
                        <span style={{
                          fontSize: 8,
                          fontFamily: PIXEL_FONT,
                          background: item.currentPrice >= item.targetPrice ? P.success : P.warning,
                          color: "#fff",
                          padding: "4px 8px",
                          borderRadius: 4,
                        }}>
                          🎯 {item.currentPrice >= item.targetPrice ? "ATTEINT" : fmt(item.targetPrice)}
                        </span>
                      )}
                    </div>
                    <MiniBar value={item.currentPrice * totalQty(item)} max={maxVal} color={isUp ? P.success : P.danger} />
                    <div style={{ fontSize: 14, fontFamily: BODY_FONT, color: P.soft, marginTop: 6 }}>{totalQty(item)} unite{totalQty(item) > 1 ? "s" : ""} - moy. {fmt(avgPrice(item))}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 22, fontFamily: BODY_FONT, fontWeight: 700 }}>{hasSales && isFullySold ? fmt(realPnL + totalCost(item)) : fmt(item.currentPrice)}</div>
                    <div style={{
                      fontSize: 16,
                      fontFamily: BODY_FONT,
                      fontWeight: 700,
                      color: isUp ? P.success : P.danger,
                      marginTop: 4
                    }}>{isUp ? "+" : ""}{realPnLPct.toFixed(1)}%</div>
                  </div>
                  <div style={{ color: P.soft, fontSize: 20, fontFamily: PIXEL_FONT, flexShrink: 0 }}>▶</div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Donut */}
      {items.length > 1 && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Répartition</div>
          <DonutChart items={items} />
        </Card>
      )}

      {/* Add form */}
      {!showForm ? <AddButton onClick={() => setShowForm(true)} /> : (
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Nouvel item</div>

          {/* Releases timeline */}
          {Object.keys(releasesByYear).length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: P.soft, fontWeight: 500, letterSpacing: 0.3, display: "block", marginBottom: 8 }}>Sorties récentes (cliquer pour sélectionner)</label>
              <div style={{ maxHeight: 180, overflowY: "auto", background: "#f8fafc", borderRadius: 12, padding: 10 }}>
                {Object.entries(releasesByYear).sort(([a], [b]) => Number(b) - Number(a)).map(([year, yearEvents]) => (
                  <div key={year} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: P.primary, letterSpacing: 0.5, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: P.primary }} />
                      {year}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingLeft: 14, borderLeft: `2px solid ${P.primary}20`, marginLeft: 3 }}>
                      {yearEvents.map((ev) => {
                        const d = new Date(ev.date + "T12:00:00");
                        const monthLabel = d.toLocaleDateString("fr-FR", { month: "short" });
                        const isSelected = form.name === ev.title.replace(/^Sortie:\s*/i, "").trim();
                        return (
                          <div
                            key={ev.id}
                            onClick={() => {
                              const cleanName = ev.title.replace(/^Sortie:\s*/i, "").trim();
                              setForm({ ...form, name: cleanName });
                            }}
                            style={{
                              display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 8,
                              background: isSelected ? "#f1f5f9" : "transparent",
                              border: isSelected ? `1.5px solid ${P.primary}` : "1.5px solid transparent",
                              cursor: "pointer", transition: "all 0.15s"
                            }}
                            onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "#f1f5f9"; }}
                            onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                          >
                            <span style={{ fontSize: 9, fontWeight: 600, color: P.primary, background: "#f1f5f9", padding: "2px 6px", borderRadius: 6, textTransform: "uppercase" }}>{monthLabel}</span>
                            <span style={{ fontSize: 11, fontWeight: 500, color: P.text, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {ev.title.replace(/^Sortie:\s*/i, "")}
                            </span>
                            {isSelected && <span style={{ fontSize: 10, color: P.primary }}>✓</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Input label="Nom" type="text" placeholder="Ex: Elite Trainer Box..." value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Où acheté" type="text" placeholder="Amazon, eBay..." value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
          <Input label="Date d'achat" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Input label="Prix d'achat (€)" type="number" placeholder="150" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <Input label="Quantité" type="number" placeholder="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          <Input label="Prix actuel (€)" type="number" placeholder="180" value={form.currentPrice} onChange={(e) => setForm({ ...form, currentPrice: e.target.value })} />
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: P.soft, fontWeight: 500, letterSpacing: 0.3 }}>Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={{ display: "block", width: "100%", padding: "8px 12px", borderRadius: 12, border: "1.5px solid #e2e8f0", fontSize: 13, fontFamily: "inherit", background: "#f8fafc", color: P.text, outline: "none", boxSizing: "border-box" }}>
              <option value="Ultra Premium Collection">Ultra Premium Collection</option><option value="Bundle">Bundle</option><option value="Elite Trainer Box">Elite Trainer Box</option><option value="Collection Box">Collection Box</option>
            </select>
          </div>
          <Input label="Image URL (optionnel)" type="url" placeholder="https://..." value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
          {form.imageUrl && (
            <div style={{ marginBottom: 12, textAlign: "center" }}>
              <img src={form.imageUrl} alt="Preview" style={{ maxWidth: 100, maxHeight: 100, borderRadius: 8, border: `2px solid ${P.borderLight}` }} onError={(e) => e.target.style.display = "none"} />
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={addItem} style={{ flex: 1, padding: 10, borderRadius: 8, border: "none", background: "#1e293b", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Ajouter</button>
            <button onClick={() => setShowForm(false)} style={{ padding: "10px 16px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "transparent", color: P.soft, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Annuler</button>
          </div>
        </Card>
      )}

      {selectedItem && <ItemDetailModal item={selectedItem} onClose={() => setSelectedId(null)} onUpdate={handleItemUpdate} />}

      {/* Quick Add Floating Button */}
      <button
        onClick={() => setQuickAdd({ ...quickAdd, show: true })}
        style={{
          position: "fixed",
          bottom: 100,
          right: 20,
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${P.primary} 0%, #4a5ab8 100%)`,
          border: "none",
          color: "#fff",
          fontSize: 28,
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(92, 107, 192, 0.4)",
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        ⚡
      </button>

      {/* Quick Add Modal */}
      {quickAdd.show && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 200,
          padding: 20,
        }} onClick={() => setQuickAdd({ ...quickAdd, show: false })}>
          <div style={{
            background: P.card,
            borderRadius: 16,
            padding: 24,
            width: "100%",
            maxWidth: 320,
            boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <span style={{ fontSize: 24 }}>⚡</span>
              <div style={{ fontSize: 12, fontFamily: PIXEL_FONT, color: P.text, letterSpacing: 1 }}>AJOUT RAPIDE</div>
            </div>

            <input
              type="text"
              placeholder="Nom du produit..."
              value={quickAdd.name}
              onChange={(e) => setQuickAdd({ ...quickAdd, name: e.target.value })}
              autoFocus
              style={{
                width: "100%",
                padding: "14px 16px",
                border: `2px solid ${P.borderLight}`,
                borderRadius: 10,
                fontSize: 18,
                fontFamily: BODY_FONT,
                marginBottom: 12,
                outline: "none",
                boxSizing: "border-box",
                background: P.bg,
                color: P.text,
              }}
              onKeyDown={(e) => e.key === "Enter" && document.getElementById("quick-price")?.focus()}
            />

            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <input
                id="quick-price"
                type="number"
                placeholder="Prix €"
                value={quickAdd.price}
                onChange={(e) => setQuickAdd({ ...quickAdd, price: e.target.value })}
                style={{
                  flex: 1,
                  padding: "14px 16px",
                  border: `2px solid ${P.borderLight}`,
                  borderRadius: 10,
                  fontSize: 18,
                  fontFamily: BODY_FONT,
                  outline: "none",
                  boxSizing: "border-box",
                  background: P.bg,
                  color: P.text,
                }}
                onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
              />
              <span style={{ fontSize: 24, color: P.soft, alignSelf: "center" }}>€</span>
            </div>

            <button
              onClick={handleQuickAdd}
              style={{
                width: "100%",
                padding: "14px",
                border: "none",
                borderRadius: 10,
                background: P.primary,
                color: "#fff",
                fontSize: 14,
                fontFamily: PIXEL_FONT,
                cursor: "pointer",
                letterSpacing: 1,
              }}
            >
              AJOUTER
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB: CALENDAR
// ═══════════════════════════════════════════════════════════
const EVENT_TYPES = {
  release: { label: "Sortie", color: "#0369a1", bg: "#e0f2fe", icon: "📦" },
  brocante: { label: "Brocante", color: "#b45309", bg: "#fef3c7", icon: "🛒" },
  event: { label: "Événement", color: "#047857", bg: "#d1fae5", icon: "🎪" },
};

function EventFormModal({ onClose, onAdd, editItem }) {
  const [form, setForm] = useState(editItem || { title: "", date: today(), type: "release", note: "" });
  const isEdit = !!editItem;
  const submit = () => { if (!form.title || !form.date) return; onAdd({ ...form, id: isEdit ? form.id : Date.now() }); onClose(); };
  return (
    <BottomModal onClose={onClose}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: P.text }}>{isEdit ? "Modifier" : "Nouvel"} événement</div>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 24, color: P.soft, cursor: "pointer" }}>✕</button>
      </div>
      <Input label="Titre" type="text" placeholder="Ex: Sortie Phantasmal Flames" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 13, color: P.soft, fontWeight: 500, letterSpacing: 0.3 }}>Type</label>
        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          {Object.entries(EVENT_TYPES).map(([k, v]) => (
            <button key={k} onClick={() => setForm({ ...form, type: k })}
              style={{ flex: 1, padding: "10px 6px", borderRadius: 12, border: form.type === k ? `2px solid ${v.color}` : "2px solid #e2e8f0", background: form.type === k ? v.bg : "#f8fafc", color: form.type === k ? v.color : P.soft, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              {v.icon} {v.label}
            </button>
          ))}
        </div>
      </div>
      <Input label="Note (optionnel)" type="text" placeholder="Détails..." value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
      <button onClick={submit} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: "#1e293b", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{isEdit ? "Sauvegarder" : "Ajouter"}</button>
    </BottomModal>
  );
}

function CalendarTab({ events, setEvents }) {
  const [showForm, setShowForm] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [view, setView] = useState("list"); // "list" | "grid"
  const [gridMonth, setGridMonth] = useState(() => { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() }; });
  const [dayPopover, setDayPopover] = useState(null); // date string "YYYY-MM-DD" or null
  const [selectedDate, setSelectedDate] = useState(null); // date string "YYYY-MM-DD" for visual selection
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return typeof window !== "undefined" && Notification.permission === "granted";
  });
  const todayStr = today();
  const toast = useToast();

  // Request notification permission
  const enableNotifications = async () => {
    if (!("Notification" in window)) {
      toast?.error("Notifications non supportées par ce navigateur");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setNotificationsEnabled(true);
      toast?.success("Notifications activées !");
      // Show test notification
      new Notification("🎴 Hexuo", { body: "Les rappels de sorties sont activés !" });
    } else {
      toast?.error("Permission refusée");
    }
  };

  // Check for upcoming releases and notify
  useEffect(() => {
    if (!notificationsEnabled) return;

    const checkUpcoming = () => {
      const now = new Date();
      const todayDate = now.toISOString().split("T")[0];

      events.forEach(ev => {
        if (ev.type !== "release") return;
        const eventDate = new Date(ev.date + "T10:00:00");
        const daysUntil = Math.round((eventDate - now) / 86400000);

        // Notify 7 days before, 1 day before, and on the day
        if (daysUntil === 7 || daysUntil === 1 || daysUntil === 0) {
          const notifKey = `hexuo-notif-${ev.id}-${daysUntil}`;
          if (!localStorage.getItem(notifKey)) {
            localStorage.setItem(notifKey, "1");
            const message = daysUntil === 0
              ? `📦 ${ev.title} sort aujourd'hui !`
              : `📦 ${ev.title} dans ${daysUntil} jour${daysUntil > 1 ? "s" : ""} !`;
            new Notification("🎴 Hexuo - Rappel", { body: message });
          }
        }
      });
    };

    checkUpcoming();
    const interval = setInterval(checkUpcoming, 3600000); // Check every hour
    return () => clearInterval(interval);
  }, [events, notificationsEnabled]);

  // Upcoming releases (next 30 days)
  const upcomingReleases = useMemo(() => {
    const now = new Date();
    return events
      .filter(ev => ev.type === "release" && new Date(ev.date + "T12:00:00") >= now)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5);
  }, [events]);

  const save = (ev) => {
    if (editEvent) setEvents(events.map((e) => (e.id === ev.id ? ev : e)));
    else setEvents([...events, ev]);
    setEditEvent(null);
  };

  const del = (id) => setEvents(events.filter((e) => e.id !== id));

  // ── LIST VIEW (existing) ──────────────────────────────
  const sorted = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
  const grouped = sorted.reduce((acc, ev) => {
    const d = new Date(ev.date + "T12:00:00");
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(ev);
    return acc;
  }, {});

  const monthLabel = (key) => {
    const [y, m] = key.split("-");
    const d = new Date(Number(y), Number(m) - 1, 1);
    const label = d.toLocaleDateString("fr-FR", { month: "long" });
    return label.charAt(0).toUpperCase() + label.slice(1) + (Number(y) !== new Date().getFullYear() ? ` ${y}` : "");
  };

  const renderList = () => (
    <div>
      {Object.entries(grouped).map(([monthKey, monthEvents]) => (
        <div key={monthKey} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: P.primary, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10, paddingLeft: 2 }}>{monthLabel(monthKey)}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {monthEvents.map((ev) => {
              const t = EVENT_TYPES[ev.type];
              const isPast = ev.date < todayStr;
              const isToday = ev.date === todayStr;
              const days = Math.round((new Date(ev.date + "T12:00:00") - new Date(todayStr + "T12:00:00")) / 86400000);
              return (
                <Card key={ev.id} style={{ opacity: isPast ? 0.5 : 1 }}>
                  <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <div style={{ background: isPast ? "#eee" : t.bg, borderRadius: 10, padding: "10px 12px", textAlign: "center", flexShrink: 0, minWidth: 54 }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: isPast ? "#999" : t.color, lineHeight: 1.1 }}>{new Date(ev.date + "T12:00:00").getDate()}</div>
                      <div style={{ fontSize: 10, color: isPast ? "#999" : t.color, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{new Date(ev.date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short" })}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, fontWeight: 600, background: t.bg, color: t.color, padding: "3px 9px", borderRadius: 6 }}>{t.icon} {t.label}</span>
                        {isToday && <span style={{ fontSize: 11, fontWeight: 600, color: "#16a34a", background: "#f0fff4", padding: "3px 8px", borderRadius: 6 }}>Aujourd'hui</span>}
                        {!isPast && !isToday && days <= 7 && <span style={{ fontSize: 11, fontWeight: 600, color: "#dc2626", background: "#fff0f0", padding: "3px 8px", borderRadius: 6 }}>Dans {days}j</span>}
                        {isPast && <span style={{ fontSize: 11, color: "#999", background: "#f0f0f0", padding: "3px 8px", borderRadius: 6 }}>Il y a {Math.abs(days)}j</span>}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: P.text }}>{ev.title}</div>
                      {ev.note && <div style={{ fontSize: 12, color: P.soft, marginTop: 4 }}>{ev.note}</div>}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button onClick={() => setEditEvent(ev)} style={{ background: "none", border: "none", fontSize: 16, color: P.soft, cursor: "pointer" }}>✎</button>
                      <button onClick={() => del(ev.id)} style={{ background: "none", border: "none", fontSize: 16, color: P.soft, cursor: "pointer" }}
                        onMouseEnter={(e) => (e.target.style.color = "#dc2626")} onMouseLeave={(e) => (e.target.style.color = P.soft)}>×</button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  // ── GRID VIEW ─────────────────────────────────────────
  const renderGrid = () => {
    const { y, m } = gridMonth;
    const firstDay = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0);
    // Monday=0 based offset
    let startDow = (firstDay.getDay() + 6) % 7; // 0=Mon … 6=Sun
    const daysInMonth = lastDay.getDate();

    // Index events by date string for this month
    const eventsByDate = {};
    events.forEach((ev) => {
      if (!eventsByDate[ev.date]) eventsByDate[ev.date] = [];
      eventsByDate[ev.date].push(ev);
    });

    const mLabel = firstDay.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    const mLabelCap = mLabel.charAt(0).toUpperCase() + mLabel.slice(1);

    const prevMonth = () => setGridMonth(m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 });
    const nextMonth = () => setGridMonth(m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 });

    // Build day cells
    const cells = [];
    // Leading empty cells
    for (let i = 0; i < startDow; i++) cells.push(null);
    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ d, dateStr, evs: eventsByDate[dateStr] || [] });
    };

    // Popover day events
    const popoverEvents = dayPopover ? (eventsByDate[dayPopover] || []) : [];

    return (
      <div>
        {/* Month navigator */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <button onClick={prevMonth} style={{ background: "none", border: "none", fontSize: 24, color: P.primary, cursor: "pointer", padding: "6px 12px", borderRadius: 10 }}>‹</button>
          <div style={{ fontSize: 17, fontWeight: 700, color: P.text }}>{mLabelCap}</div>
          <button onClick={nextMonth} style={{ background: "none", border: "none", fontSize: 24, color: P.primary, cursor: "pointer", padding: "6px 12px", borderRadius: 10 }}>›</button>
        </div>

        {/* Weekday headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, marginBottom: 6 }}>
          {["L", "M", "M", "J", "V", "S", "D"].map((label, i) => (
            <div key={i} style={{ textAlign: "center", fontSize: 12, fontWeight: 600, color: P.soft, paddingBottom: 8 }}>{label}</div>
          ))}
        </div>

        {/* Day grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 5 }}>
          {cells.map((cell, i) => {
            if (!cell) return <div key={`e-${i}`} />;
            const { d, dateStr, evs } = cell;
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const hasEvents = evs.length > 0;
            return (
              <div key={dateStr}
                onClick={() => {
                  setSelectedDate(dateStr);
                  if (hasEvents) setDayPopover(dateStr);
                  else setDayPopover(null);
                }}
                style={{
                  minHeight: 80, display: "flex", flexDirection: "column", alignItems: "stretch",
                  borderRadius: 10,
                  background: isSelected ? "#f1f5f9" : "transparent",
                  border: isSelected ? `2px solid ${P.primary}` : "2px solid transparent",
                  cursor: "pointer",
                  position: "relative", transition: "all 0.15s",
                  padding: 5,
                }}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "#f8fafc"; }}
                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{
                  fontSize: 14, fontWeight: isToday ? 700 : 500,
                  color: isToday ? "#fff" : P.text,
                  background: isToday ? P.primary : "transparent",
                  borderRadius: 7,
                  width: 26, height: 26,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 3
                }}>{d}</div>
                {/* Event labels */}
                {hasEvents && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 3, overflow: "hidden", flex: 1 }}>
                    {evs.slice(0, 2).map((ev, idx) => {
                      const t = EVENT_TYPES[ev.type];
                      return (
                        <div key={idx} style={{
                          fontSize: 9, fontWeight: 600,
                          background: t?.bg || "#f1f5f9",
                          color: t?.color || P.primary,
                          padding: "3px 5px",
                          borderRadius: 5,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }}>
                          {ev.title.length > 12 ? ev.title.slice(0, 10) + "…" : ev.title}
                        </div>
                      );
                    })}
                    {evs.length > 2 && (
                      <div style={{ fontSize: 8, color: P.soft, fontWeight: 500 }}>+{evs.length - 2}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Day popover — appears below grid when a day is tapped */}
        {dayPopover && popoverEvents.length > 0 && (
          <div style={{ marginTop: 16, background: P.card, borderRadius: 18, boxShadow: P.shadow, padding: "14px 16px", animation: "fadeIn 0.15s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: P.text }}>
                {new Date(dayPopover + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
              </div>
              <button onClick={() => setDayPopover(null)} style={{ background: "none", border: "none", fontSize: 16, color: P.soft, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {popoverEvents.map((ev) => {
                const t = EVENT_TYPES[ev.type];
                return (
                  <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", borderRadius: 12, padding: "8px 10px" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: P.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.title}</div>
                      {ev.note && <div style={{ fontSize: 9.5, color: P.soft, marginTop: 1 }}>{ev.note}</div>}
                    </div>
                    <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
                      <button onClick={() => setEditEvent(ev)} style={{ background: "none", border: "none", fontSize: 13, color: P.soft, cursor: "pointer" }}>✎</button>
                      <button onClick={() => del(ev.id)} style={{ background: "none", border: "none", fontSize: 13, color: P.soft, cursor: "pointer" }}
                        onMouseEnter={(e) => (e.target.style.color = "#dc2626")} onMouseLeave={(e) => (e.target.style.color = P.soft)}>×</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Notifications & Upcoming releases */}
      <Card style={{ marginBottom: 20, background: notificationsEnabled ? "#f0fdf4" : "#fef3c7", border: notificationsEnabled ? "2px solid #86efac" : "2px solid #fcd34d" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 20 }}>{notificationsEnabled ? "🔔" : "🔕"}</span>
              <div style={{ fontSize: 10, fontFamily: PIXEL_FONT, color: notificationsEnabled ? "#166534" : "#92400e", letterSpacing: 1 }}>
                {notificationsEnabled ? "RAPPELS ACTIFS" : "RAPPELS DESACTIVES"}
              </div>
            </div>
            <div style={{ fontSize: 14, fontFamily: BODY_FONT, color: P.text }}>
              {notificationsEnabled
                ? "Tu recevras des notifications 7j et 1j avant chaque sortie"
                : "Active les notifications pour ne rien rater !"}
            </div>
          </div>
          {!notificationsEnabled && (
            <button onClick={enableNotifications} style={{
              padding: "10px 16px",
              border: "none",
              borderRadius: 8,
              background: "#f59e0b",
              color: "#fff",
              fontSize: 10,
              fontFamily: PIXEL_FONT,
              cursor: "pointer",
              letterSpacing: 1,
            }}>
              ACTIVER
            </button>
          )}
        </div>
      </Card>

      {/* Upcoming releases preview */}
      {upcomingReleases.length > 0 && (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontFamily: PIXEL_FONT, color: P.text, marginBottom: 12, letterSpacing: 1 }}>📦 PROCHAINES SORTIES</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {upcomingReleases.map(ev => {
              const days = Math.round((new Date(ev.date + "T12:00:00") - new Date(todayStr + "T12:00:00")) / 86400000);
              return (
                <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", background: P.bg, borderRadius: 8 }}>
                  <div style={{ fontSize: 14, fontFamily: BODY_FONT, fontWeight: 600, color: P.primary, minWidth: 60 }}>
                    {days === 0 ? "Aujourd'hui" : days === 1 ? "Demain" : `J-${days}`}
                  </div>
                  <div style={{ flex: 1, fontSize: 16, fontFamily: BODY_FONT, color: P.text }}>{ev.title}</div>
                  <div style={{ fontSize: 12, fontFamily: BODY_FONT, color: P.soft }}>{fmtDate(ev.date)}</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* View toggle - Retro style */}
      <div style={{ display: "flex", gap: 0, marginBottom: 20, border: `3px solid ${P.border}` }}>
        {[{ id: "list", label: "LISTE" }, { id: "grid", label: "CALENDRIER" }].map((v, idx) => (
          <button key={v.id} onClick={() => setView(v.id)}
            style={{
              flex: 1,
              padding: "12px 8px",
              border: "none",
              borderRight: idx === 0 ? `3px solid ${P.border}` : "none",
              background: view === v.id ? P.warning : P.card,
              color: P.text,
              fontSize: 8,
              fontFamily: PIXEL_FONT,
              cursor: "pointer",
              letterSpacing: 1,
            }}>
            {view === v.id && "* "}{v.label}{view === v.id && " *"}
          </button>
        ))}
      </div>

      {view === "list" ? renderList() : renderGrid()}

      <div style={{ marginTop: 16 }}>
        <AddButton onClick={() => setShowForm(true)} />
      </div>
      {(showForm || editEvent) && <EventFormModal onClose={() => { setShowForm(false); setEditEvent(null); }} onAdd={save} editItem={editEvent} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB: SPOTS
// ═══════════════════════════════════════════════════════════
const SPOT_TYPES = {
  magasin: { label: "Magasin", color: "#475569", bg: "#f1f5f9", icon: "🏪" },
  online: { label: "En ligne", color: "#0369a1", bg: "#e0f2fe", icon: "🌐" },
  brocante: { label: "Brocante", color: "#b45309", bg: "#fef3c7", icon: "🛒" },
};

function SpotFormModal({ onClose, onAdd, editItem }) {
  const [form, setForm] = useState(editItem || { name: "", type: "magasin", rating: 3, note: "" });
  const isEdit = !!editItem;
  const submit = () => { if (!form.name) return; onAdd({ ...form, id: isEdit ? form.id : Date.now() }); onClose(); };
  return (
    <BottomModal onClose={onClose}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: P.text }}>{isEdit ? "Modifier" : "Nouveau"} spot</div>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 24, color: P.soft, cursor: "pointer" }}>✕</button>
      </div>
      <Input label="Nom" type="text" placeholder="Ex: Gamemania Part Dieu" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 13, color: P.soft, fontWeight: 500, letterSpacing: 0.3 }}>Type</label>
        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          {Object.entries(SPOT_TYPES).map(([k, v]) => (
            <button key={k} onClick={() => setForm({ ...form, type: k })}
              style={{ flex: 1, padding: "10px 6px", borderRadius: 12, border: form.type === k ? `2px solid ${v.color}` : "2px solid #e2e8f0", background: form.type === k ? v.bg : "#f8fafc", color: form.type === k ? v.color : P.soft, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              {v.icon} {v.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 13, color: P.soft, fontWeight: 500, letterSpacing: 0.3 }}>Note</label>
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setForm({ ...form, rating: n })}
              style={{ fontSize: 28, background: "none", border: "none", cursor: "pointer", color: n <= form.rating ? "#f59e0b" : "#e2e8f0", padding: "0 4px" }}>★</button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 13, color: P.soft, fontWeight: 500, letterSpacing: 0.3 }}>Commentaire</label>
        <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Tes impressions..." rows={3}
          style={{ display: "block", width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid #e2e8f0", fontSize: 15, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#f8fafc", color: P.text, resize: "none", marginTop: 6 }}
          onFocus={(e) => (e.target.style.borderColor = P.primary)} onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")} />
      </div>
      <button onClick={submit} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: "#1e293b", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{isEdit ? "Sauvegarder" : "Ajouter"}</button>
    </BottomModal>
  );
}

// Fuzzy match: does spot name overlap with transaction source?
// "eBay France" ↔ "eBay" → true | "Gamemania – Part Dieu" ↔ "Gamemania" → true
const spotMatchesTx = (spotName, txSource) => {
  const a = spotName.toLowerCase();
  const b = txSource.toLowerCase();
  // Either one contains the other
  return a.includes(b) || b.includes(a);
};

// Collect all transactions across all wallet items that match a given spot
const getSpotPurchases = (spot, items) => {
  const purchases = [];
  items.forEach((item) => {
    item.transactions.forEach((tx) => {
      if (spotMatchesTx(spot.name, tx.source)) {
        purchases.push({ ...tx, itemName: item.name, itemType: item.type });
      }
    });
  });
  return purchases.sort((a, b) => new Date(b.date) - new Date(a.date)); // most recent first
};

function SpotDetailModal({ spot, purchases, onClose, onEdit }) {
  const totalSpent = purchases.reduce((s, p) => s + p.price * p.quantity, 0);
  const t = SPOT_TYPES[spot.type];

  return (
    <BottomModal onClose={onClose}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, background: t.bg, color: t.color, padding: "4px 10px", borderRadius: 8 }}>{t.icon} {t.label}</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: P.text }}>{spot.name}</div>
          <div style={{ marginTop: 6 }}><Stars rating={spot.rating} /></div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onEdit} style={{ background: "#f1f5f9", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, color: P.primary, cursor: "pointer", fontFamily: "inherit" }}>✎ Modifier</button>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 24, color: P.soft, cursor: "pointer" }}>✕</button>
        </div>
      </div>

      {/* Note */}
      {spot.note && (
        <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 14px", marginBottom: 18 }}>
          <div style={{ fontSize: 14, color: P.soft, lineHeight: 1.5 }}>{spot.note}</div>
        </div>
      )}

      {/* Purchase history */}
      <div style={{ fontSize: 15, fontWeight: 600, color: P.text, marginBottom: 12 }}>
        Achats à ce spot
      </div>

      {purchases.length === 0 ? (
        <div style={{ background: "#f8fafc", borderRadius: 12, padding: "22px 18px", textAlign: "center" }}>
          <div style={{ fontSize: 34, marginBottom: 8 }}>🛒</div>
          <div style={{ fontSize: 14, color: P.soft }}>Aucun achat enregistré ici.</div>
          <div style={{ fontSize: 12, color: P.soft, marginTop: 4, opacity: 0.7 }}>Les achats apparaissent automatiquement quand la source dans le Wallet correspond à ce spot.</div>
        </div>
      ) : (
        <>
          {/* Summary row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <div style={{ background: "#f8fafc", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, color: P.soft, fontWeight: 500, letterSpacing: 0.3, textTransform: "uppercase", marginBottom: 4 }}>Total dépensé</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: P.primary }}>{fmt(totalSpent)}</div>
            </div>
            <div style={{ background: "#f8fafc", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, color: P.soft, fontWeight: 500, letterSpacing: 0.3, textTransform: "uppercase", marginBottom: 4 }}>Achats</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: P.text }}>{purchases.length}</div>
            </div>
          </div>

          {/* Transaction list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {purchases.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: "#f8fafc", borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: P.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.itemName}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                    <TypeBadge type={p.itemType} />
                    <span style={{ fontSize: 12, color: P.soft }}>{fmtDate(p.date)}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: P.text }}>{fmt(p.price * p.quantity)}</div>
                  {p.quantity > 1 && <div style={{ fontSize: 11, color: P.soft }}>{fmt(p.price)} × {p.quantity}</div>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </BottomModal>
  );
}

function SpotsTab({ spots, setSpots, items }) {
  const [showForm, setShowForm] = useState(false);
  const [editSpot, setEditSpot] = useState(null);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const sorted = [...spots].sort((a, b) => b.rating - a.rating);

  const save = (sp) => {
    if (editSpot) setSpots(spots.map((s) => (s.id === sp.id ? sp : s)));
    else setSpots([...spots, sp]);
    setEditSpot(null);
  };

  const del = (id) => setSpots(spots.filter((s) => s.id !== id));

  // Precompute purchase counts per spot for the badge on cards
  const purchaseCounts = useMemo(() => {
    const map = {};
    spots.forEach((sp) => { map[sp.id] = getSpotPurchases(sp, items).length; });
    return map;
  }, [spots, items]);

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 18 }}>
        {sorted.map((sp) => {
          const t = SPOT_TYPES[sp.type];
          const count = purchaseCounts[sp.id] || 0;
          return (
            <Card key={sp.id} onClick={() => setSelectedSpot(sp)}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, background: t.bg, color: t.color, padding: "4px 10px", borderRadius: 8 }}>{t.icon} {t.label}</span>
                    {count > 0 && <span style={{ fontSize: 11, fontWeight: 600, background: "#f1f5f9", color: P.primary, padding: "3px 8px", borderRadius: 6 }}>{count} achat{count > 1 ? "s" : ""}</span>}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: P.text }}>{sp.name}</div>
                  <div style={{ marginTop: 5 }}><Stars rating={sp.rating} /></div>
                  {sp.note && <div style={{ fontSize: 13, color: P.soft, marginTop: 6, lineHeight: 1.5 }}>{sp.note}</div>}
                </div>
                <div style={{ color: P.soft, fontSize: 20, flexShrink: 0 }}>›</div>
              </div>
            </Card>
          );
        })}
      </div>
      <AddButton onClick={() => setShowForm(true)} />

      {(showForm || editSpot) && <SpotFormModal onClose={() => { setShowForm(false); setEditSpot(null); }} onAdd={save} editItem={editSpot} />}
      {selectedSpot && (
        <SpotDetailModal
          spot={selectedSpot}
          purchases={getSpotPurchases(selectedSpot, items)}
          onClose={() => setSelectedSpot(null)}
          onEdit={() => { setEditSpot(selectedSpot); setSelectedSpot(null); }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB: RESOURCES
// ═══════════════════════════════════════════════════════════
const RESOURCE_TYPES = {
  video:   { label: "Vidéo",   color: "#dc2626", bg: "#fee2e2", icon: "▶️" },
  article: { label: "Article", color: "#475569", bg: "#f1f5f9", icon: "📄" },
  tweet:   { label: "Tweet",   color: "#0369a1", bg: "#e0f2fe", icon: "🐦" },
  other:   { label: "Autre",   color: "#6b7280", bg: "#f3f4f6", icon: "🔗" },
};

function ResourceFormModal({ onClose, onAdd, editItem }) {
  const [form, setForm] = useState(editItem || { title: "", url: "", type: "video", note: "" });
  const isEdit = !!editItem;
  const submit = () => { if (!form.title || !form.url) return; onAdd({ ...form, id: isEdit ? form.id : Date.now() }); onClose(); };
  return (
    <BottomModal onClose={onClose}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: P.text }}>{isEdit ? "Modifier" : "Nouvelle"} ressource</div>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 24, color: P.soft, cursor: "pointer" }}>✕</button>
      </div>
      <Input label="Titre" type="text" placeholder="Ex: Guide investissement Pokémon cards" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <Input label="URL" type="text" placeholder="https://..." value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 13, color: P.soft, fontWeight: 500, letterSpacing: 0.3 }}>Type</label>
        <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
          {Object.entries(RESOURCE_TYPES).map(([k, v]) => (
            <button key={k} onClick={() => setForm({ ...form, type: k })}
              style={{ flex: "1 1 calc(50% - 4px)", padding: "10px 6px", borderRadius: 12, border: form.type === k ? `2px solid ${v.color}` : "2px solid #e2e8f0", background: form.type === k ? v.bg : "#f8fafc", color: form.type === k ? v.color : P.soft, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              {v.icon} {v.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 13, color: P.soft, fontWeight: 500, letterSpacing: 0.3 }}>Note (optionnel)</label>
        <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Tes impressions, points clés..." rows={3}
          style={{ display: "block", width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid #e2e8f0", fontSize: 15, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#f8fafc", color: P.text, resize: "none", marginTop: 6 }}
          onFocus={(e) => (e.target.style.borderColor = P.primary)} onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")} />
      </div>
      <button onClick={submit} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: "#1e293b", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{isEdit ? "Sauvegarder" : "Ajouter"}</button>
    </BottomModal>
  );
}

function ResourcesTab({ resources, setResources }) {
  const [showForm, setShowForm] = useState(false);
  const [editRes, setEditRes] = useState(null);
  const [filter, setFilter] = useState("all"); // "all" | resource type key

  const save = (r) => {
    if (editRes) setResources(resources.map((x) => (x.id === r.id ? r : x)));
    else setResources([...resources, r]);
    setEditRes(null);
  };

  const del = (id) => setResources(resources.filter((r) => r.id !== id));

  const openUrl = (url) => { try { window.open(url, "_blank", "noopener,noreferrer"); } catch (e) {} };

  const filtered = filter === "all" ? resources : resources.filter((r) => r.type === filter);

  // Count per type for filter pills
  const counts = resources.reduce((acc, r) => { acc[r.type] = (acc[r.type] || 0) + 1; return acc; }, {});

  return (
    <div>
      {/* Filter pills - Retro style */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
        <button onClick={() => setFilter("all")}
          style={{
            padding: "8px 12px",
            border: `3px solid ${P.border}`,
            background: filter === "all" ? P.danger : P.card,
            color: filter === "all" ? "#fff" : P.text,
            fontSize: 8,
            fontFamily: PIXEL_FONT,
            cursor: "pointer",
            letterSpacing: 0.5,
            boxShadow: filter === "all" ? "none" : "2px 2px 0 rgba(0,0,0,0.2)",
          }}>
          TOUS {resources.length > 0 && `(${resources.length})`}
        </button>
        {Object.entries(RESOURCE_TYPES).map(([k, v]) => counts[k] ? (
          <button key={k} onClick={() => setFilter(k)}
            style={{
              padding: "8px 12px",
              border: `3px solid ${P.border}`,
              background: filter === k ? v.color : P.card,
              color: filter === k ? "#fff" : P.text,
              fontSize: 8,
              fontFamily: PIXEL_FONT,
              cursor: "pointer",
              letterSpacing: 0.5,
              boxShadow: filter === k ? "none" : "2px 2px 0 rgba(0,0,0,0.2)",
            }}>
            {v.label.toUpperCase()} ({counts[k]})
          </button>
        ) : null)}
      </div>

      {/* Resource cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 18 }}>
        {filtered.map((r) => {
          const t = RESOURCE_TYPES[r.type] || RESOURCE_TYPES.other;
          return (
            <Card key={r.id} onClick={() => openUrl(r.url)}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, background: t.bg, color: t.color, padding: "4px 10px", borderRadius: 8 }}>{t.icon} {t.label}</span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: P.text, lineHeight: 1.3 }}>{r.title}</div>
                  <div style={{ fontSize: 12, color: P.primary, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.url}</div>
                  {r.note && <div style={{ fontSize: 13, color: P.soft, marginTop: 6, lineHeight: 1.5 }}>{r.note}</div>}
                </div>
                {/* Actions — stop propagation so they don't trigger the card's openUrl */}
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => setEditRes(r)} style={{ background: "none", border: "none", fontSize: 16, color: P.soft, cursor: "pointer" }}>✎</button>
                  <button onClick={() => del(r.id)} style={{ background: "none", border: "none", fontSize: 16, color: P.soft, cursor: "pointer" }}
                    onMouseEnter={(e) => (e.target.style.color = "#dc2626")} onMouseLeave={(e) => (e.target.style.color = P.soft)}>×</button>
                </div>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ background: "#f8fafc", borderRadius: 18, padding: "32px 22px", textAlign: "center" }}>
            <div style={{ fontSize: 38, marginBottom: 10 }}>📚</div>
            <div style={{ fontSize: 15, color: P.soft, fontWeight: 500 }}>{filter === "all" ? "Aucune ressource" : `Aucune ressource de type "${RESOURCE_TYPES[filter]?.label}"`}</div>
            <div style={{ fontSize: 13, color: P.soft, marginTop: 5, opacity: 0.7 }}>Ajoute des liens utiles ci-dessous</div>
          </div>
        )}
      </div>
      <AddButton onClick={() => setShowForm(true)} />
      {(showForm || editRes) && <ResourceFormModal onClose={() => { setShowForm(false); setEditRes(null); }} onAdd={save} editItem={editRes} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN APP — routing + persistence
// ═══════════════════════════════════════════════════════════
const TABS = [
  { id: "wallet", label: "COLLECTION", icon: "BAG" },
  { id: "calendar", label: "CALENDRIER", icon: "DAY" },
  { id: "spots", label: "SPOTS", icon: "MAP" },
  { id: "resources", label: "GUIDES", icon: "DEX" },
];


// ═══════════════════════════════════════════════════════════
// SIDEBAR COMPONENT (Desktop only) - RETRO STYLE
// ═══════════════════════════════════════════════════════════
function Sidebar({ tab, setTab, user, onLogout, theme, toggleTheme }) {
  return (
    <div style={{
      width: 220,
      background: theme === "dark"
        ? `linear-gradient(180deg, #1e1e3f 0%, #0d1b2a 100%)`
        : `linear-gradient(180deg, ${P.primary} 0%, #4a5ab8 100%)`,
      height: "100vh",
      position: "fixed",
      left: 0,
      top: 0,
      display: "flex",
      flexDirection: "column",
      zIndex: 40,
      boxShadow: "4px 0 20px rgba(0,0,0,0.1)",
    }}>
      {/* Logo - Enhanced */}
      <div style={{
        padding: "28px 20px 24px",
        background: "rgba(255,255,255,0.08)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            background: "rgba(255,255,255,0.15)",
            borderRadius: 10,
            padding: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Pokeball size={28} />
          </div>
          <div>
            <div style={{
              fontSize: 12,
              fontFamily: PIXEL_FONT,
              color: "#fff",
              letterSpacing: 2,
              textShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }}>HEXUO</div>
            <div style={{ fontSize: 14, fontFamily: BODY_FONT, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>TCG Portfolio</div>
          </div>
        </div>
      </div>

      {/* Navigation - Clean menu style */}
      <nav style={{ flex: 1, padding: "20px 16px" }}>
        {TABS.map((t) => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "14px 16px",
                marginBottom: 8,
                border: "none",
                borderRadius: 8,
                background: isActive ? "rgba(255,255,255,0.2)" : "transparent",
                color: "#fff",
                fontSize: 9,
                fontFamily: PIXEL_FONT,
                cursor: "pointer",
                textAlign: "left",
                letterSpacing: 1,
                transition: "all 0.15s ease",
              }}
            >
              {/* Selection arrow */}
              <span style={{ opacity: isActive ? 1 : 0.3, fontSize: 10, transition: "opacity 0.15s" }}>▶</span>
              {t.label}
            </button>
          );
        })}
      </nav>

      {/* Footer - Trainer info & Theme toggle */}
      <div style={{ padding: "16px", borderTop: `3px solid ${P.border}`, background: "rgba(0,0,0,0.1)" }}>
        <div style={{ fontSize: 8, fontFamily: PIXEL_FONT, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>TRAINER</div>
        <div style={{ fontSize: 12, fontFamily: BODY_FONT, color: "#fff", marginBottom: 12, overflow: "hidden", textOverflow: "ellipsis" }}>
          {user?.email?.split("@")[0] || "???"}
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          style={{
            width: "100%",
            padding: "10px",
            border: "2px solid rgba(255,255,255,0.3)",
            borderRadius: 8,
            background: "rgba(255,255,255,0.1)",
            color: "#fff",
            fontSize: 9,
            fontFamily: PIXEL_FONT,
            cursor: "pointer",
            letterSpacing: 1,
            marginBottom: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {theme === "dark" ? "☀️" : "🌙"} {theme === "dark" ? "LIGHT" : "DARK"}
        </button>

        {user && (
          <button
            onClick={onLogout}
            style={{
              width: "100%",
              padding: "10px",
              border: `3px solid #fff`,
              borderRadius: 0,
              background: "transparent",
              color: "#fff",
              fontSize: 8,
              fontFamily: PIXEL_FONT,
              cursor: "pointer",
              letterSpacing: 1,
            }}
          >
            DECONNEXION
          </button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// AUTH PAGE - RETRO POKEMON STYLE
// ═══════════════════════════════════════════════════════════
function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const isDesktop = useIsDesktop();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user && !data.session) {
          setMessage("Verifie ton email pour confirmer ton compte!");
        } else if (data.session) {
          onAuth(data.session);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuth(data.session);
      }
    } catch (err) {
      setError(err.message === "Invalid login credentials"
        ? "Email ou mot de passe incorrect"
        : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${P.primary} 0%, #7986cb 100%)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: BODY_FONT,
      padding: 20,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap" rel="stylesheet" />

      {/* Decorative Pokeballs */}
      <div style={{ position: "absolute", top: 40, left: 40, opacity: 0.08 }}>
        <Pokeball size={120} />
      </div>
      <div style={{ position: "absolute", bottom: 40, right: 40, opacity: 0.08 }}>
        <Pokeball size={80} />
      </div>

      <div style={{
        background: P.card,
        border: `2px solid ${P.borderLight}`,
        borderRadius: 16,
        padding: isDesktop ? "40px 48px" : "28px 24px",
        width: "100%",
        maxWidth: 400,
        boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Pokeball size={48} style={{ marginBottom: 16 }} />
          <h1 style={{ fontSize: 16, fontFamily: PIXEL_FONT, color: P.text, margin: 0, letterSpacing: 2 }}>HEXUO</h1>
          <p style={{ fontSize: 18, fontFamily: BODY_FONT, color: P.soft, marginTop: 8 }}>TCG Portfolio Tracker</p>
        </div>

        {/* Tabs - Modern pixel style */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {[
            { id: "login", label: "CONNEXION" },
            { id: "signup", label: "NOUVEAU" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => { setMode(t.id); setError(null); setMessage(null); }}
              style={{
                flex: 1,
                padding: "12px 8px",
                border: `2px solid ${mode === t.id ? P.primary : P.borderLight}`,
                borderRadius: 8,
                background: mode === t.id ? P.primary : P.card,
                color: mode === t.id ? "#fff" : P.text,
                fontSize: 8,
                fontFamily: PIXEL_FONT,
                cursor: "pointer",
                letterSpacing: 1,
                transition: "all 0.15s ease",
              }}
            >
              {mode === t.id && "▶ "}{t.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 8, fontFamily: PIXEL_FONT, color: P.text, display: "block", marginBottom: 8, letterSpacing: 1 }}>EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="ton@email.com"
              style={{
                width: "100%",
                padding: "12px 14px",
                border: `2px solid ${P.borderLight}`,
                borderRadius: 8,
                fontSize: 18,
                fontFamily: BODY_FONT,
                outline: "none",
                boxSizing: "border-box",
                background: P.bg,
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 8, fontFamily: PIXEL_FONT, color: P.text, display: "block", marginBottom: 8, letterSpacing: 1 }}>MOT DE PASSE</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="********"
              style={{
                width: "100%",
                padding: "12px 14px",
                border: `2px solid ${P.borderLight}`,
                borderRadius: 8,
                fontSize: 18,
                fontFamily: BODY_FONT,
                outline: "none",
                boxSizing: "border-box",
                background: P.bg,
              }}
            />
            {mode === "signup" && (
              <div style={{ fontSize: 14, fontFamily: BODY_FONT, color: P.soft, marginTop: 6 }}>Min. 6 caracteres</div>
            )}
          </div>

          {error && (
            <div style={{
              background: "#fef2f2",
              border: `2px solid ${P.danger}`,
              borderRadius: 8,
              color: P.danger,
              padding: "10px 12px",
              marginBottom: 16,
              fontSize: 14,
              fontFamily: BODY_FONT,
            }}>
              {error}
            </div>
          )}

          {message && (
            <div style={{
              background: "#f0fdf4",
              border: `2px solid ${P.success}`,
              borderRadius: 8,
              color: P.success,
              padding: "10px 12px",
              marginBottom: 16,
              fontSize: 14,
              fontFamily: BODY_FONT,
            }}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              border: "none",
              borderRadius: 8,
              background: loading ? P.borderLight : P.primary,
              color: "#fff",
              fontSize: 10,
              fontFamily: PIXEL_FONT,
              cursor: loading ? "wait" : "pointer",
              letterSpacing: 1,
              boxShadow: loading ? "none" : "0 4px 12px rgba(92, 107, 192, 0.3)",
              transition: "all 0.15s ease",
            }}
          >
            {loading ? "CHARGEMENT..." : mode === "login" ? "CONNEXION" : "CREER COMPTE"}
          </button>
        </form>
      </div>
    </div>
  );
}

function AppContent() {
  const { theme, toggleTheme, P: themeP } = useTheme() || { theme: "light", toggleTheme: () => {}, P: THEMES.light };
  // Update global P when theme changes
  P = themeP;

  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tab, setTab] = useState("wallet");
  const [items, setItems] = useState(INIT.items);
  const [events, setEvents] = useState(INIT.events);
  const [spots, setSpots] = useState(INIT.spots);
  const [resources, setResources] = useState(INIT.resources);
  const [wishlist, setWishlist] = useState(INIT.wishlist);
  const [loaded, setLoaded] = useState(false);
  const isDesktop = useIsDesktop();

  // Check auth session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load data from Supabase when logged in
  useEffect(() => {
    if (!session?.user) return;

    const loadData = async () => {
      const userId = session.user.id;

      // Load items
      const { data: itemsData } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", userId);
      if (itemsData) {
        setItems(itemsData.map(i => ({
          id: i.id,
          name: i.name,
          type: i.type,
          currentPrice: Number(i.current_price) || 0,
          transactions: i.transactions || [],
          sold: i.sold || [],
          priceHistory: i.price_history || [],
          targetPrice: i.target_price ? Number(i.target_price) : null,
          imageUrl: i.image_url || null,
          // eBay market price fields
          ebayQuery: i.ebay_query || null,
          marketPrice: i.market_price ? Number(i.market_price) : null,
          marketPriceMin: i.market_price_min ? Number(i.market_price_min) : null,
          marketPriceMax: i.market_price_max ? Number(i.market_price_max) : null,
          marketPriceSalesCount: i.market_price_sales_count || null,
          marketPriceUpdatedAt: i.market_price_updated_at || null,
        })));
      }

      // Load events
      const { data: eventsData } = await supabase
        .from("events")
        .select("*")
        .eq("user_id", userId);
      if (eventsData) {
        setEvents(eventsData.map(e => ({
          id: e.id,
          title: e.title,
          date: e.date,
          type: e.type,
          note: e.note,
        })));
      }

      // Load spots
      const { data: spotsData } = await supabase
        .from("spots")
        .select("*")
        .eq("user_id", userId);
      if (spotsData) {
        setSpots(spotsData.map(s => ({
          id: s.id,
          name: s.name,
          type: s.type,
          rating: s.rating,
          note: s.note,
        })));
      }

      // Load resources
      const { data: resourcesData } = await supabase
        .from("resources")
        .select("*")
        .eq("user_id", userId);
      if (resourcesData) {
        setResources(resourcesData.map(r => ({
          id: r.id,
          title: r.title,
          url: r.url,
          type: r.type,
          note: r.note,
        })));
      }

      setLoaded(true);
    };

    loadData();
  }, [session]);

  // Sync items to Supabase
  const syncItems = useCallback(async (newItems) => {
    if (!session?.user || !loaded) return;
    const userId = session.user.id;

    // Get current DB items
    const { data: dbItems } = await supabase.from("items").select("id").eq("user_id", userId);
    const dbIds = new Set((dbItems || []).map(i => i.id));
    const newIds = new Set(newItems.map(i => i.id));

    // Delete removed items
    for (const id of dbIds) {
      if (!newIds.has(id)) {
        await supabase.from("items").delete().eq("id", id);
      }
    }

    // Upsert items
    for (const item of newItems) {
      if (dbIds.has(item.id)) {
        await supabase.from("items").update({
          name: item.name,
          type: item.type,
          current_price: item.currentPrice,
          transactions: item.transactions,
          sold: item.sold || [],
          price_history: item.priceHistory || [],
          target_price: item.targetPrice || null,
          image_url: item.imageUrl || null,
          // eBay fields
          ebay_query: item.ebayQuery || null,
          market_price: item.marketPrice || null,
          market_price_min: item.marketPriceMin || null,
          market_price_max: item.marketPriceMax || null,
          market_price_sales_count: item.marketPriceSalesCount || null,
          market_price_updated_at: item.marketPriceUpdatedAt || null,
        }).eq("id", item.id);
      } else {
        const { data } = await supabase.from("items").insert({
          user_id: userId,
          name: item.name,
          type: item.type,
          current_price: item.currentPrice,
          transactions: item.transactions,
          sold: item.sold || [],
          price_history: item.priceHistory || [],
          target_price: item.targetPrice || null,
          image_url: item.imageUrl || null,
          // eBay fields
          ebay_query: item.ebayQuery || null,
          market_price: item.marketPrice || null,
          market_price_min: item.marketPriceMin || null,
          market_price_max: item.marketPriceMax || null,
          market_price_sales_count: item.marketPriceSalesCount || null,
          market_price_updated_at: item.marketPriceUpdatedAt || null,
        }).select().single();
        if (data) {
          // Update local id with DB id
          item.id = data.id;
        }
      }
    }
  }, [session, loaded]);

  // Sync events to Supabase
  const syncEvents = useCallback(async (newEvents) => {
    if (!session?.user || !loaded) return;
    const userId = session.user.id;

    const { data: dbEvents } = await supabase.from("events").select("id").eq("user_id", userId);
    const dbIds = new Set((dbEvents || []).map(e => e.id));
    const newIds = new Set(newEvents.map(e => e.id));

    for (const id of dbIds) {
      if (!newIds.has(id)) {
        await supabase.from("events").delete().eq("id", id);
      }
    }

    for (const event of newEvents) {
      if (dbIds.has(event.id)) {
        await supabase.from("events").update({
          title: event.title,
          date: event.date,
          type: event.type,
          note: event.note,
        }).eq("id", event.id);
      } else {
        const { data } = await supabase.from("events").insert({
          user_id: userId,
          title: event.title,
          date: event.date,
          type: event.type,
          note: event.note,
        }).select().single();
        if (data) event.id = data.id;
      }
    }
  }, [session, loaded]);

  // Sync spots to Supabase
  const syncSpots = useCallback(async (newSpots) => {
    if (!session?.user || !loaded) return;
    const userId = session.user.id;

    const { data: dbSpots } = await supabase.from("spots").select("id").eq("user_id", userId);
    const dbIds = new Set((dbSpots || []).map(s => s.id));
    const newIds = new Set(newSpots.map(s => s.id));

    for (const id of dbIds) {
      if (!newIds.has(id)) {
        await supabase.from("spots").delete().eq("id", id);
      }
    }

    for (const spot of newSpots) {
      if (dbIds.has(spot.id)) {
        await supabase.from("spots").update({
          name: spot.name,
          type: spot.type,
          rating: spot.rating,
          note: spot.note,
        }).eq("id", spot.id);
      } else {
        const { data } = await supabase.from("spots").insert({
          user_id: userId,
          name: spot.name,
          type: spot.type,
          rating: spot.rating,
          note: spot.note,
        }).select().single();
        if (data) spot.id = data.id;
      }
    }
  }, [session, loaded]);

  // Sync resources to Supabase
  const syncResources = useCallback(async (newResources) => {
    if (!session?.user || !loaded) return;
    const userId = session.user.id;

    const { data: dbResources } = await supabase.from("resources").select("id").eq("user_id", userId);
    const dbIds = new Set((dbResources || []).map(r => r.id));
    const newIds = new Set(newResources.map(r => r.id));

    for (const id of dbIds) {
      if (!newIds.has(id)) {
        await supabase.from("resources").delete().eq("id", id);
      }
    }

    for (const resource of newResources) {
      if (dbIds.has(resource.id)) {
        await supabase.from("resources").update({
          title: resource.title,
          url: resource.url,
          type: resource.type,
          note: resource.note,
        }).eq("id", resource.id);
      } else {
        const { data } = await supabase.from("resources").insert({
          user_id: userId,
          title: resource.title,
          url: resource.url,
          type: resource.type,
          note: resource.note,
        }).select().single();
        if (data) resource.id = data.id;
      }
    }
  }, [session, loaded]);

  // Wrapped setters that sync to Supabase
  const setItemsAndSync = useCallback((newItemsOrFn) => {
    setItems(prev => {
      const newItems = typeof newItemsOrFn === "function" ? newItemsOrFn(prev) : newItemsOrFn;
      syncItems(newItems);
      return newItems;
    });
  }, [syncItems]);

  const setEventsAndSync = useCallback((newEventsOrFn) => {
    setEvents(prev => {
      const newEvents = typeof newEventsOrFn === "function" ? newEventsOrFn(prev) : newEventsOrFn;
      syncEvents(newEvents);
      return newEvents;
    });
  }, [syncEvents]);

  const setSpotsAndSync = useCallback((newSpotsOrFn) => {
    setSpots(prev => {
      const newSpots = typeof newSpotsOrFn === "function" ? newSpotsOrFn(prev) : newSpotsOrFn;
      syncSpots(newSpots);
      return newSpots;
    });
  }, [syncSpots]);

  const setResourcesAndSync = useCallback((newResourcesOrFn) => {
    setResources(prev => {
      const newResources = typeof newResourcesOrFn === "function" ? newResourcesOrFn(prev) : newResourcesOrFn;
      syncResources(newResources);
      return newResources;
    });
  }, [syncResources]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setItems(INIT.items);
    setEvents(INIT.events);
    setSpots(INIT.spots);
    setResources(INIT.resources);
    setLoaded(false);
  };

  // Loading state - Retro style
  if (authLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: P.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: BODY_FONT,
      }}>
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap" rel="stylesheet" />
        <div style={{ textAlign: "center" }}>
          <Pokeball size={64} style={{ marginBottom: 20, animation: "spin 1s linear infinite" }} />
          <div style={{ fontSize: 16, fontFamily: PIXEL_FONT, color: P.text, marginBottom: 12, letterSpacing: 2 }}>HEXUO</div>
          <div style={{ fontSize: 20, fontFamily: BODY_FONT, color: P.soft }}>Chargement...</div>
        </div>
        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  // Not logged in -> show auth page
  if (!session) {
    return <AuthPage onAuth={setSession} />;
  }

  // CSS animations for retro effects
  const retroStyles = `
    @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
    @keyframes sparkle { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.5; } }
  `;

  // Desktop layout with sidebar - Retro style
  if (isDesktop) {
    return (
      <div style={{ minHeight: "100vh", background: P.bg, fontFamily: BODY_FONT, color: P.text }}>
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap" rel="stylesheet" />
        <style>{retroStyles}</style>

        {/* Sidebar */}
        <Sidebar tab={tab} setTab={setTab} user={session.user} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />

        {/* Main content */}
        <div style={{ marginLeft: 220, minHeight: "100vh" }}>
          {/* Header - Clean style */}
          <header style={{
            background: P.card,
            borderBottom: `1px solid ${P.borderLight}`,
            padding: "18px 32px",
            position: "sticky",
            top: 0,
            zIndex: 30,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <h1 style={{ fontSize: 11, fontFamily: PIXEL_FONT, color: P.text, margin: 0, letterSpacing: 1 }}>
              {TABS.find(t => t.id === tab)?.label || "HEXUO"}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                fontSize: 14,
                fontFamily: BODY_FONT,
                color: P.soft,
                background: P.bg,
                padding: "6px 12px",
                borderRadius: 6,
              }}>
                {session.user.email?.split("@")[0]}
              </div>
            </div>
          </header>

          {/* Page content */}
          <main style={{ padding: "28px 32px", maxWidth: 1400, margin: "0 auto" }}>
            {tab === "wallet" && <WalletTab items={items} setItems={setItemsAndSync} events={events} />}
            {tab === "calendar" && <CalendarTab events={events} setEvents={setEventsAndSync} />}
            {tab === "spots" && <SpotsTab spots={spots} setSpots={setSpotsAndSync} items={items} />}
            {tab === "resources" && <ResourcesTab resources={resources} setResources={setResourcesAndSync} />}
          </main>
        </div>
      </div>
    );
  }

  // Mobile layout - Retro style
  return (
    <div style={{ minHeight: "100vh", background: P.bg, fontFamily: BODY_FONT, color: P.text, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap" rel="stylesheet" />
      <style>{retroStyles}</style>

      {/* Header with logout - Retro style */}
      <div style={{
        position: "relative",
        zIndex: 1,
        padding: "14px 18px",
        flexShrink: 0,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: P.primary,
        borderBottom: `4px solid ${P.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Pokeball size={28} />
          <span style={{ fontSize: 12, fontFamily: PIXEL_FONT, color: "#fff", letterSpacing: 2 }}>HEXUO</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            style={{
              padding: "8px 10px",
              border: `2px solid rgba(255,255,255,0.5)`,
              borderRadius: 6,
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: "8px 12px",
              border: `2px solid #fff`,
              background: "transparent",
              color: "#fff",
              fontSize: 8,
              fontFamily: PIXEL_FONT,
              cursor: "pointer",
              letterSpacing: 1,
            }}
          >
            QUIT
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", position: "relative", zIndex: 1, padding: "16px 18px 130px" }}>
        {tab === "wallet" && <WalletTab items={items} setItems={setItemsAndSync} events={events} />}
        {tab === "calendar" && <CalendarTab events={events} setEvents={setEventsAndSync} />}
        {tab === "spots" && <SpotsTab spots={spots} setSpots={setSpotsAndSync} items={items} />}
        {tab === "resources" && <ResourcesTab resources={resources} setResources={setResourcesAndSync} />}
      </div>

      {/* Bottom tab bar - Retro Game Boy style */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: "flex",
        gap: 0,
        padding: "0",
        background: P.card,
        borderTop: `4px solid ${P.border}`,
      }}>
        {TABS.map((t, idx) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              padding: "14px 8px 28px",
              border: "none",
              borderRight: idx < TABS.length - 1 ? `2px solid ${P.borderLight}` : "none",
              background: tab === t.id ? P.warning : P.card,
              color: P.text,
              fontSize: 8,
              fontFamily: PIXEL_FONT,
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              letterSpacing: 0.5,
            }}>
            <span style={{
              fontSize: 10,
              background: tab === t.id ? P.border : P.borderLight,
              color: tab === t.id ? "#fff" : P.text,
              padding: "4px 8px",
              border: `2px solid ${P.border}`,
            }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN APP EXPORT - With Providers
// ═══════════════════════════════════════════════════════════
export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ThemeProvider>
  );
}

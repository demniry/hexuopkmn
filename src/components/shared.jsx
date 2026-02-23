import { P, PIXEL_FONT, BODY_FONT, useIsDesktop } from "../theme.jsx";

// Pokeball decoration
export function Pokeball({ size = 24, style: extra }) {
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
export function PixelSparkle({ style }) {
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

export function Input({ label, type, placeholder, value, onChange, style: extraStyle }) {
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

export function AddButton({ onClick }) {
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

export function Card({ children, onClick, style: extra, className }) {
  return (
    <div onClick={onClick} className={className}
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

export function Modal({ onClose, children, title }) {
  const isDesktop = useIsDesktop();

  return (
    <div
      className="animate-fade-in"
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
        className={isDesktop ? "animate-scale-in" : "animate-slide-up"}
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

// Stars rating display - Pixel style
export function Stars({ rating, max = 5 }) {
  return (
    <span style={{ fontSize: 14, letterSpacing: 4, fontFamily: PIXEL_FONT }}>
      {Array(max).fill(0).map((_, i) => (
        <span key={i} style={{ color: i < rating ? P.warning : P.borderLight }}>*</span>
      ))}
    </span>
  );
}

export function TypeBadge({ type }) {
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

export function MiniBar({ value, max, color }) {
  const w = Math.max((value / max) * 100, 6);
  return (
    <div style={{ width: "100%", height: 10, border: `2px solid ${P.border}`, background: P.card }}>
      <div style={{ width: `${w}%`, height: "100%", background: color }} />
    </div>
  );
}

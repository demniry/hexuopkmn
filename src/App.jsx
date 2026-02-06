import { useState, useEffect, useMemo } from "react";

// ═══════════════════════════════════════════════════════════
// PALETTE & SHARED UTILS
// ═══════════════════════════════════════════════════════════
const P = {
  bg: "#f8fafc", card: "#fff", shadow: "0 2px 16px rgba(15,23,42,0.06)",
  a1: "#475569", a2: "#b45309", a3: "#047857", a4: "#16a34a",
  text: "#1e293b", soft: "#64748b",
  accent: "#1e40af", // bleu pro pour highlights
  danger: "#dc2626",
};

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
};

// ═══════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════
function Blob({ style }) {
  return <div style={{ position: "absolute", borderRadius: "50%", filter: "blur(100px)", opacity: 0.15, pointerEvents: "none", ...style }} />;
}

function Input({ label, type, placeholder, value, onChange, style: extraStyle }) {
  return (
    <div style={{ marginBottom: 10, ...extraStyle }}>
      <label style={{ fontSize: 11, color: P.soft, fontWeight: 500, letterSpacing: 0.3 }}>{label}</label>
      <input type={type} placeholder={placeholder} value={value} onChange={onChange}
        style={{ display: "block", width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#f8fafc", color: P.text }}
        onFocus={(e) => (e.target.style.borderColor = P.a1)} onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
      />
    </div>
  );
}

function AddButton({ onClick }) {
  return (
    <button onClick={onClick}
      style={{ width: "100%", padding: "14px", border: "1px dashed #cbd5e1", borderRadius: 10, background: "transparent", color: P.soft, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", transition: "border-color 0.2s, color 0.2s" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = P.a1; e.currentTarget.style.color = P.a1; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.color = P.soft; }}
    >+ Ajouter</button>
  );
}

function Card({ children, onClick, style: extra }) {
  return (
    <div onClick={onClick}
      style={{ background: P.card, borderRadius: 12, padding: "14px 16px", boxShadow: P.shadow, border: "1px solid #e2e8f0", cursor: onClick ? "pointer" : "default", transition: "transform 0.2s, box-shadow 0.2s", ...extra }}
      onMouseEnter={(e) => { if (onClick) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(15,23,42,0.1)"; }}}
      onMouseLeave={(e) => { if (onClick) { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = P.shadow; }}}
    >{children}</div>
  );
}

function BottomModal({ onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: "16px 16px 0 0", width: "100%", maxWidth: 520, maxHeight: "85vh", overflowY: "auto", padding: "20px 20px 40px" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "#e2e8f0", margin: "0 auto 18px" }} />
        {children}
      </div>
    </div>
  );
}

// Stars rating display
function Stars({ rating, max = 5 }) {
  return (
    <span style={{ fontSize: 13, letterSpacing: 1 }}>
      {"★".repeat(rating)}<span style={{ color: "#e2e8f0" }}>{"★".repeat(max - rating)}</span>
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
    "Ultra Premium Collection": { bg: "#fef3c7", text: "#92400e" },
    "Bundle": { bg: "#e0f2fe", text: "#0369a1" },
    "Elite Trainer Box": { bg: "#fee2e2", text: "#991b1b" },
    "Collection Box": { bg: "#d1fae5", text: "#065f46" }
  };
  const c = map[type] || { bg: "#f1f5f9", text: "#475569" };
  return <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase", background: c.bg, color: c.text, padding: "3px 8px", borderRadius: 4, display: "inline-block" }}>{type}</span>;
}

function MiniBar({ value, max, color }) {
  const w = Math.max((value / max) * 100, 6);
  return (
    <div style={{ width: "100%", height: 4, borderRadius: 2, background: "#e2e8f0", overflow: "hidden" }}>
      <div style={{ width: `${w}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.6s cubic-bezier(.4,0,.2,1)" }} />
    </div>
  );
}

function DonutChart({ items }) {
  const total = items.reduce((s, i) => s + i.currentPrice * totalQty(i), 0);
  if (total === 0) return null;
  const colors = ["#475569", "#0369a1", "#047857", "#b45309", "#7c3aed", "#be185d", "#0891b2", "#4f46e5"];
  let cumul = 0;
  const segments = items.map((item, idx) => { const val = (item.currentPrice * totalQty(item)) / total; const start = cumul; cumul += val; return { item, val, start, color: colors[idx % colors.length] }; });
  const size = 110, cx = size / 2, cy = size / 2, r = 42;
  const arc = (s, e) => { const a1 = s * 2 * Math.PI - Math.PI / 2, a2 = e * 2 * Math.PI - Math.PI / 2; return `M ${cx} ${cy} L ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)} A ${r} ${r} 0 ${e - s > 0.5 ? 1 : 0} 1 ${cx + r * Math.cos(a2)} ${cy + r * Math.sin(a2)} Z`; };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
        {segments.map((seg, i) => <path key={i} d={arc(seg.start, seg.start + seg.val)} fill={seg.color} stroke="#fff" strokeWidth="2" />)}
        <circle cx={cx} cy={cy} r={20} fill="#fff" />
        <text x={cx} y={cy - 2} textAnchor="middle" fontSize="11" fontWeight="700" fill={P.text}>{items.length}</text>
        <text x={cx} y={cy + 7} textAnchor="middle" fontSize="6.5" fill={P.soft}>items</text>
      </svg>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
        {items.map((item, idx) => <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: colors[idx % colors.length], flexShrink: 0 }} /><span style={{ fontSize: 11, color: P.text, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span><span style={{ fontSize: 11, fontWeight: 600, color: P.soft }}>{((item.currentPrice * totalQty(item)) / total * 100).toFixed(1)}%</span></div>)}
      </div>
    </div>
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

  const savePrice = () => { const v = Number(editPrice); if (!isNaN(v) && v >= 0) onUpdate({ ...item, currentPrice: v }); setEditingPrice(false); };
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div><div style={{ fontSize: 17, fontWeight: 700, color: P.text }}>{item.name}</div><div style={{ marginTop: 5 }}><TypeBadge type={item.type} /></div></div>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: P.soft, cursor: "pointer" }}>✕</button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: isSold ? "1fr 1fr" : "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
        {[
          { label: "Coût total", value: fmt(totalCost(item)), sub: `${totalQty(item)} unité${totalQty(item) > 1 ? "s" : ""} · moy. ${fmt(avgPrice(item))}` },
          ...(isSold ? [
            { label: "Vendu", value: fmt(totalSaleRevenue), sub: `${soldQty} vendu${soldQty > 1 ? "s" : ""} · ${remainingQty} restant${remainingQty > 1 ? "s" : ""}` },
          ] : [
            { label: "Valeur act.", value: fmt(item.currentPrice * totalQty(item)), sub: `${fmt(item.currentPrice)} × ${totalQty(item)}` },
          ]),
          { label: isSold ? "P&L réel" : "P&L estimé", value: `${isUp ? "+" : ""}${fmt(totalPnL)}`, sub: isSold && realizedPnL !== 0 ? `Réalisé: ${realizedPnL >= 0 ? "+" : ""}${fmt(realizedPnL)}` : `${isUp ? "+" : ""}${((totalPnL / totalCost(item)) * 100).toFixed(1)}%`, hl: true, isUp },
        ].map((s, i) => (
          <div key={i} style={{ background: "#f8fafc", borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: 9, color: P.soft, fontWeight: 500, letterSpacing: 0.3, textTransform: "uppercase", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: s.hl ? (s.isUp ? "#16a34a" : "#dc2626") : P.text }}>{s.value}</div>
            <div style={{ fontSize: 9, color: P.soft, marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Prix editable */}
      <div style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 14px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 9, color: P.soft, fontWeight: 500, letterSpacing: 0.3, textTransform: "uppercase", marginBottom: 2 }}>Prix actuel</div>
          {!editingPrice ? <div style={{ fontSize: 20, fontWeight: 700, color: P.text }}>{fmt(item.currentPrice)}</div> : (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} autoFocus onKeyDown={(e) => { if (e.key === "Enter") savePrice(); }}
                style={{ width: 80, padding: "4px 8px", borderRadius: 8, border: "1.5px solid #d1c4e9", fontSize: 16, fontWeight: 700, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
              <span style={{ fontSize: 13, color: P.soft }}>€</span>
              <button onClick={savePrice} style={{ fontSize: 10, fontWeight: 600, color: "#fff", background: P.a1, border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontFamily: "inherit" }}>OK</button>
              <button onClick={() => setEditingPrice(false)} style={{ fontSize: 10, color: P.soft, background: "transparent", border: "none", cursor: "pointer" }}>✕</button>
            </div>
          )}
        </div>
        {!editingPrice && <button onClick={() => { setEditingPrice(true); setEditPrice(String(item.currentPrice)); }} style={{ fontSize: 10, fontWeight: 600, color: P.a1, background: "#f1f5f9", border: "none", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontFamily: "inherit" }}>✎ Modifier</button>}
      </div>

      {/* Historique */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: P.text, marginBottom: 10 }}>Historique des achats</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[...item.transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).map((tx) => {
            if (editingTxId === tx.id) {
              return (
                <div key={tx.id} style={{ background: "#f1f5f9", borderRadius: 12, padding: "10px 12px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
                    {[{ key: "source", label: "Où acheté", type: "text" }, { key: "date", label: "Date", type: "date" }, { key: "price", label: "Prix (€)", type: "number" }, { key: "quantity", label: "Quantité", type: "number" }].map((f) => (
                      <div key={f.key}>
                        <div style={{ fontSize: 8.5, color: P.soft, fontWeight: 500, marginBottom: 3 }}>{f.label}</div>
                        <input type={f.type} value={editTx[f.key]} onChange={(e) => setEditTx({ ...editTx, [f.key]: e.target.value })}
                          style={{ width: "100%", padding: "5px 8px", borderRadius: 8, border: "1.5px solid #d1c4e9", fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#fff", color: P.text }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => saveTx(tx.id)} style={{ flex: 1, fontSize: 10, fontWeight: 600, color: "#fff", background: P.a1, border: "none", borderRadius: 8, padding: "5px 0", cursor: "pointer", fontFamily: "inherit" }}>Sauvegarder</button>
                    <button onClick={() => setEditingTxId(null)} style={{ fontSize: 10, color: P.soft, background: "rgba(255,255,255,0.6)", border: "none", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontFamily: "inherit" }}>Annuler</button>
                    <button onClick={() => deleteTx(tx.id)} style={{ fontSize: 10, fontWeight: 600, color: "#dc2626", background: "rgba(255,255,255,0.6)", border: "none", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontFamily: "inherit" }}>Supprimer</button>
                  </div>
                </div>
              );
            }
            return (
              <div key={tx.id} onClick={() => { setEditingTxId(tx.id); setEditTx({ source: tx.source, date: tx.date, price: String(tx.price), quantity: String(tx.quantity) }); }}
                style={{ display: "flex", alignItems: "center", gap: 10, background: "#f8fafc", borderRadius: 12, padding: "8px 12px", cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")} onMouseLeave={(e) => (e.currentTarget.style.background = "#f8fafc")}>
                <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 600, color: P.text }}>{tx.source}</div><div style={{ fontSize: 10, color: P.soft }}>{fmtDate(tx.date)} · Qté : {tx.quantity}</div></div>
                <div style={{ textAlign: "right" }}><div style={{ fontSize: 13, fontWeight: 700, color: P.text }}>{fmt(tx.price)}</div><div style={{ fontSize: 9, color: P.soft }}>/ unité</div></div>
                <div style={{ fontSize: 12, color: P.soft }}>›</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ventes enregistrées */}
      {isSold && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: P.text, marginBottom: 10 }}>Ventes enregistrées</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {item.sold.map((sale) => (
              <div key={sale.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "#d1fae5", borderRadius: 8, padding: "8px 12px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#065f46" }}>{PLATFORM_FEES[sale.platform]?.label || sale.platform}</div>
                  <div style={{ fontSize: 10, color: "#047857" }}>{fmtDate(sale.date)} · {sale.quantity} unité{sale.quantity > 1 ? "s" : ""}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#065f46" }}>{fmt(sale.netAmount)}</div>
                  {sale.fees > 0 && <div style={{ fontSize: 9, color: "#047857" }}>-{fmt(sale.fees)} frais</div>}
                </div>
                <button onClick={() => deleteSale(sale.id)} style={{ background: "none", border: "none", fontSize: 14, color: "#047857", cursor: "pointer" }}
                  onMouseEnter={(e) => (e.target.style.color = "#dc2626")} onMouseLeave={(e) => (e.target.style.color = "#047857")}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bouton/Formulaire vente */}
      {remainingQty > 0 && (
        <div style={{ marginBottom: 16 }}>
          {!showSellForm ? (
            <button onClick={() => setShowSellForm(true)}
              style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #16a34a", background: "#f0fdf4", color: "#16a34a", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              💰 Enregistrer une vente ({remainingQty} disponible{remainingQty > 1 ? "s" : ""})
            </button>
          ) : (
            <div style={{ background: "#f0fdf4", borderRadius: 8, padding: 14, border: "1px solid #bbf7d0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#065f46" }}>Enregistrer une vente</div>
                <button onClick={() => setShowSellForm(false)} style={{ background: "none", border: "none", fontSize: 16, color: "#047857", cursor: "pointer" }}>✕</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <Input label="Prix de vente (€)" type="number" placeholder="200" value={sellForm.price} onChange={(e) => setSellForm({ ...sellForm, price: e.target.value })} />
                <Input label="Quantité" type="number" placeholder="1" value={sellForm.quantity} onChange={(e) => setSellForm({ ...sellForm, quantity: e.target.value })} />
                <Input label="Date de vente" type="date" value={sellForm.date} onChange={(e) => setSellForm({ ...sellForm, date: e.target.value })} />
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 11, color: P.soft, fontWeight: 500, letterSpacing: 0.3 }}>Plateforme</label>
                  <select value={sellForm.platform} onChange={(e) => setSellForm({ ...sellForm, platform: e.target.value })}
                    style={{ display: "block", width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #bbf7d0", fontSize: 13, fontFamily: "inherit", background: "#fff", color: P.text, outline: "none", boxSizing: "border-box" }}>
                    {Object.entries(PLATFORM_FEES).map(([k, v]) => (
                      <option key={k} value={k}>{v.label} ({(v.rate * 100).toFixed(0)}% frais)</option>
                    ))}
                  </select>
                </div>
              </div>
              {sellForm.price && (
                <div style={{ background: "#dcfce7", borderRadius: 6, padding: "8px 10px", marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: "#047857", marginBottom: 4 }}>Estimation nette après frais :</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#065f46" }}>
                    {fmt(Number(sellForm.price) * Number(sellForm.quantity || 1) * (1 - (PLATFORM_FEES[sellForm.platform]?.rate || 0)))}
                  </div>
                </div>
              )}
              <button onClick={recordSale} style={{ width: "100%", padding: 10, borderRadius: 8, border: "none", background: "#16a34a", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                Confirmer la vente
              </button>
            </div>
          )}
        </div>
      )}

      {/* Nouvelle transaction */}
      <div style={{ background: "#f8fafc", borderRadius: 8, padding: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: P.text, marginBottom: 10 }}>+ Nouvel achat</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <Input label="Où acheté" type="text" placeholder="Amazon..." value={newTx.source} onChange={(e) => setNewTx({ ...newTx, source: e.target.value })} />
          <Input label="Date" type="date" value={newTx.date} onChange={(e) => setNewTx({ ...newTx, date: e.target.value })} />
          <Input label="Prix (€)" type="number" placeholder="180" value={newTx.price} onChange={(e) => setNewTx({ ...newTx, price: e.target.value })} />
          <Input label="Quantité" type="number" placeholder="1" value={newTx.quantity} onChange={(e) => setNewTx({ ...newTx, quantity: e.target.value })} />
        </div>
        <button onClick={addTx} style={{ width: "100%", padding: 8, borderRadius: 10, border: "none", background: "#1e293b", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginTop: 4 }}>Ajouter achat</button>
      </div>
    </BottomModal>
  );
}

function WalletTab({ items, setItems, events }) {
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", type: "Bundle", source: "", date: today(), price: "", quantity: "1", currentPrice: "" });
  const selectedItem = useMemo(() => items.find((i) => i.id === selectedId) || null, [items, selectedId]);

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
    if (!form.name || Number(form.price) <= 0) return;
    setItems([...items, { id: Date.now(), name: form.name, type: form.type, currentPrice: Number(form.currentPrice) || Number(form.price), transactions: [{ id: Date.now() + 1, date: form.date, price: Number(form.price), quantity: Number(form.quantity), source: form.source || "Non spécifié" }] }]);
    setForm({ name: "", type: "Bundle", source: "", date: today(), price: "", quantity: "1", currentPrice: "" });
    setShowForm(false);
  };

  const handleItemUpdate = (updated) => {
    if (updated === null) { setItems((p) => p.filter((i) => i.id !== selectedId)); setSelectedId(null); }
    else setItems((p) => p.map((i) => (i.id === updated.id ? updated : i)));
  };

  return (
    <div>
      {/* Overview card */}
      <div style={{ background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)", borderRadius: 8, padding: "22px 22px 18px", color: "#fff", marginBottom: 16, boxShadow: "0 4px 24px rgba(15,23,42,0.25)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 60%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: 1.2, opacity: 0.6, marginBottom: 2 }}>VALEUR TOTALE</div>
          <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -1 }}>{fmt(totalCur)}</div>
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10, fontSize: 12, fontWeight: 500 }}>
            <span style={{ background: totalRealPnL >= 0 ? "rgba(22,163,74,0.3)" : "rgba(220,38,38,0.3)", color: totalRealPnL >= 0 ? "#4ade80" : "#fca5a5", padding: "4px 10px", borderRadius: 6 }}>{totalRealPnL >= 0 ? "+" : ""}{fmt(totalRealPnL)} ({totalRealPnL >= 0 ? "+" : ""}{totalPnLPct}%)</span>
            <span style={{ opacity: 0.5, fontSize: 11 }}>{fmt(totalBuy)} investis</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
        {[
          { label: "Items", value: items.reduce((s, i) => s + totalQty(i), 0), color: P.text },
          { label: "En profit", value: items.filter((i) => getItemPnL(i) >= 0).length, color: "#16a34a" },
          { label: "En perte", value: items.filter((i) => getItemPnL(i) < 0).length, color: "#dc2626" },
        ].map((s) => (
          <div key={s.label} style={{ background: P.card, borderRadius: 10, padding: "12px 8px", boxShadow: P.shadow, border: "1px solid #e2e8f0", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 9, color: P.soft, fontWeight: 500, letterSpacing: 0.3, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Advanced stats */}
      {items.length > 0 && (
        <Card style={{ marginBottom: 18, padding: "12px 14px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            {bestItem && getItemPnLPct(bestItem) > 0 && (
              <div style={{ flex: "1 1 45%", minWidth: 120 }}>
                <div style={{ fontSize: 9, color: P.soft, fontWeight: 500, letterSpacing: 0.3, textTransform: "uppercase", marginBottom: 4 }}>Meilleur investissement</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: P.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{bestItem.name}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#16a34a" }}>+{getItemPnLPct(bestItem).toFixed(1)}%</div>
              </div>
            )}
            {worstItem && getItemPnLPct(worstItem) < 0 && (
              <div style={{ flex: "1 1 45%", minWidth: 120 }}>
                <div style={{ fontSize: 9, color: P.soft, fontWeight: 500, letterSpacing: 0.3, textTransform: "uppercase", marginBottom: 4 }}>Pire investissement</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: P.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{worstItem.name}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#dc2626" }}>{getItemPnLPct(worstItem).toFixed(1)}%</div>
              </div>
            )}
            {hasAnySales && (
              <div style={{ flex: "1 1 45%", minWidth: 120 }}>
                <div style={{ fontSize: 9, color: P.soft, fontWeight: 500, letterSpacing: 0.3, textTransform: "uppercase", marginBottom: 4 }}>P&L réalisé</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: realizedPnL >= 0 ? "#16a34a" : "#dc2626" }}>{realizedPnL >= 0 ? "+" : ""}{fmt(realizedPnL)}</div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        {items.map((item) => {
          const realPnL = getItemPnL(item);
          const realPnLPct = getItemPnLPct(item);
          const isUp = realPnL >= 0;
          const hasSales = item.sold && item.sold.length > 0;
          const soldQty = hasSales ? item.sold.reduce((s, sale) => s + sale.quantity, 0) : 0;
          const remainingQty = totalQty(item) - soldQty;
          const isFullySold = remainingQty === 0;
          return (
            <Card key={item.id} onClick={() => setSelectedId(item.id)} style={{ opacity: isFullySold ? 0.7 : 1 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{item.name}</div>
                  <div style={{ marginBottom: 7, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    <TypeBadge type={item.type} />
                    {hasSales && (
                      <span style={{ fontSize: 9, fontWeight: 600, background: isFullySold ? "#d1fae5" : "#fef3c7", color: isFullySold ? "#065f46" : "#92400e", padding: "2px 6px", borderRadius: 4 }}>
                        {isFullySold ? "Vendu" : `${soldQty}/${totalQty(item)} vendu`}
                      </span>
                    )}
                  </div>
                  <MiniBar value={item.currentPrice * totalQty(item)} max={maxVal} color={isUp ? P.a4 : P.a2} />
                  <div style={{ fontSize: 10, color: P.soft, marginTop: 4 }}>{totalQty(item)} unité{totalQty(item) > 1 ? "s" : ""} · {item.transactions.length} achat{item.transactions.length > 1 ? "s" : ""} · moy. {fmt(avgPrice(item))}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{hasSales && isFullySold ? fmt(realPnL + totalCost(item)) : fmt(item.currentPrice)}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: isUp ? "#16a34a" : "#dc2626", marginTop: 2 }}>{isUp ? "+" : ""}{realPnLPct.toFixed(1)}%</div>
                </div>
                <div style={{ color: P.soft, fontSize: 16, flexShrink: 0 }}>›</div>
              </div>
            </Card>
          );
        })}
      </div>

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
                    <div style={{ fontSize: 10, fontWeight: 700, color: P.a1, letterSpacing: 0.5, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: P.a1 }} />
                      {year}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingLeft: 14, borderLeft: `2px solid ${P.a1}20`, marginLeft: 3 }}>
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
                              border: isSelected ? `1.5px solid ${P.a1}` : "1.5px solid transparent",
                              cursor: "pointer", transition: "all 0.15s"
                            }}
                            onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "#f1f5f9"; }}
                            onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                          >
                            <span style={{ fontSize: 9, fontWeight: 600, color: P.a1, background: "#f1f5f9", padding: "2px 6px", borderRadius: 6, textTransform: "uppercase" }}>{monthLabel}</span>
                            <span style={{ fontSize: 11, fontWeight: 500, color: P.text, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {ev.title.replace(/^Sortie:\s*/i, "")}
                            </span>
                            {isSelected && <span style={{ fontSize: 10, color: P.a1 }}>✓</span>}
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
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={addItem} style={{ flex: 1, padding: 10, borderRadius: 8, border: "none", background: "#1e293b", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Ajouter</button>
            <button onClick={() => setShowForm(false)} style={{ padding: "10px 16px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "transparent", color: P.soft, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Annuler</button>
          </div>
        </Card>
      )}

      {selectedItem && <ItemDetailModal item={selectedItem} onClose={() => setSelectedId(null)} onUpdate={handleItemUpdate} />}
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: P.text }}>{isEdit ? "Modifier" : "Nouvel"} événement</div>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: P.soft, cursor: "pointer" }}>✕</button>
      </div>
      <Input label="Titre" type="text" placeholder="Ex: Sortie Phantasmal Flames" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 11, color: P.soft, fontWeight: 500, letterSpacing: 0.3 }}>Type</label>
        <div style={{ display: "flex", gap: 6, marginTop: 5 }}>
          {Object.entries(EVENT_TYPES).map(([k, v]) => (
            <button key={k} onClick={() => setForm({ ...form, type: k })}
              style={{ flex: 1, padding: "6px 4px", borderRadius: 10, border: form.type === k ? `2px solid ${v.color}` : "2px solid #e2e8f0", background: form.type === k ? v.bg : "#f8fafc", color: form.type === k ? v.color : P.soft, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              {v.icon} {v.label}
            </button>
          ))}
        </div>
      </div>
      <Input label="Note (optionnel)" type="text" placeholder="Détails..." value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
      <button onClick={submit} style={{ width: "100%", padding: 10, borderRadius: 8, border: "none", background: "#1e293b", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{isEdit ? "Sauvegarder" : "Ajouter"}</button>
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
  const todayStr = today();

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
          <div style={{ fontSize: 11, fontWeight: 600, color: P.a1, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10, paddingLeft: 2 }}>{monthLabel(monthKey)}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {monthEvents.map((ev) => {
              const t = EVENT_TYPES[ev.type];
              const isPast = ev.date < todayStr;
              const isToday = ev.date === todayStr;
              const days = Math.round((new Date(ev.date + "T12:00:00") - new Date(todayStr + "T12:00:00")) / 86400000);
              return (
                <Card key={ev.id} style={{ opacity: isPast ? 0.5 : 1 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ background: isPast ? "#eee" : t.bg, borderRadius: 8, padding: "8px 10px", textAlign: "center", flexShrink: 0, minWidth: 48 }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: isPast ? "#999" : t.color, lineHeight: 1.1 }}>{new Date(ev.date + "T12:00:00").getDate()}</div>
                      <div style={{ fontSize: 8.5, color: isPast ? "#999" : t.color, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{new Date(ev.date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short" })}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 9.5, fontWeight: 600, background: t.bg, color: t.color, padding: "1.5px 7px", borderRadius: 6 }}>{t.icon} {t.label}</span>
                        {isToday && <span style={{ fontSize: 9, fontWeight: 600, color: "#16a34a", background: "#f0fff4", padding: "1.5px 6px", borderRadius: 6 }}>Aujourd'hui</span>}
                        {!isPast && !isToday && days <= 7 && <span style={{ fontSize: 9, fontWeight: 600, color: "#dc2626", background: "#fff0f0", padding: "1.5px 6px", borderRadius: 6 }}>Dans {days}j</span>}
                        {isPast && <span style={{ fontSize: 9, color: "#999", background: "#f0f0f0", padding: "1.5px 6px", borderRadius: 6 }}>Il y a {Math.abs(days)}j</span>}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: P.text }}>{ev.title}</div>
                      {ev.note && <div style={{ fontSize: 10, color: P.soft, marginTop: 3 }}>{ev.note}</div>}
                    </div>
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      <button onClick={() => setEditEvent(ev)} style={{ background: "none", border: "none", fontSize: 14, color: P.soft, cursor: "pointer" }}>✎</button>
                      <button onClick={() => del(ev.id)} style={{ background: "none", border: "none", fontSize: 14, color: P.soft, cursor: "pointer" }}
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <button onClick={prevMonth} style={{ background: "none", border: "none", fontSize: 20, color: P.a1, cursor: "pointer", padding: "4px 10px", borderRadius: 8 }}>‹</button>
          <div style={{ fontSize: 14, fontWeight: 700, color: P.text }}>{mLabelCap}</div>
          <button onClick={nextMonth} style={{ background: "none", border: "none", fontSize: 20, color: P.a1, cursor: "pointer", padding: "4px 10px", borderRadius: 8 }}>›</button>
        </div>

        {/* Weekday headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
          {["L", "M", "M", "J", "V", "S", "D"].map((label, i) => (
            <div key={i} style={{ textAlign: "center", fontSize: 9.5, fontWeight: 600, color: P.soft, paddingBottom: 6 }}>{label}</div>
          ))}
        </div>

        {/* Day grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
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
                  minHeight: 70, display: "flex", flexDirection: "column", alignItems: "stretch",
                  borderRadius: 10,
                  background: isSelected ? "#f1f5f9" : "transparent",
                  border: isSelected ? `2px solid ${P.a1}` : "2px solid transparent",
                  cursor: "pointer",
                  position: "relative", transition: "all 0.15s",
                  padding: 4,
                }}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "#f8fafc"; }}
                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{
                  fontSize: 12, fontWeight: isToday ? 700 : 500,
                  color: isToday ? "#fff" : P.text,
                  background: isToday ? P.a1 : "transparent",
                  borderRadius: 6,
                  width: 22, height: 22,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 2
                }}>{d}</div>
                {/* Event labels */}
                {hasEvents && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, overflow: "hidden", flex: 1 }}>
                    {evs.slice(0, 2).map((ev, idx) => {
                      const t = EVENT_TYPES[ev.type];
                      return (
                        <div key={idx} style={{
                          fontSize: 8, fontWeight: 600,
                          background: t?.bg || "#f1f5f9",
                          color: t?.color || P.a1,
                          padding: "2px 4px",
                          borderRadius: 4,
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
      {/* View toggle */}
      <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 12, padding: 3, marginBottom: 18 }}>
        {[{ id: "list", label: "Liste", icon: "☰" }, { id: "grid", label: "Calendrier", icon: "⊞" }].map((v) => (
          <button key={v.id} onClick={() => setView(v.id)}
            style={{ flex: 1, padding: "7px 4px", borderRadius: 10, border: "none", background: view === v.id ? "#fff" : "transparent", color: view === v.id ? P.text : P.soft, fontSize: 11, fontWeight: view === v.id ? 600 : 500, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", boxShadow: view === v.id ? "0 1px 6px rgba(100,80,140,0.12)" : "none" }}>
            {v.icon} {v.label}
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: P.text }}>{isEdit ? "Modifier" : "Nouveau"} spot</div>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: P.soft, cursor: "pointer" }}>✕</button>
      </div>
      <Input label="Nom" type="text" placeholder="Ex: Gamemania Part Dieu" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 11, color: P.soft, fontWeight: 500, letterSpacing: 0.3 }}>Type</label>
        <div style={{ display: "flex", gap: 6, marginTop: 5 }}>
          {Object.entries(SPOT_TYPES).map(([k, v]) => (
            <button key={k} onClick={() => setForm({ ...form, type: k })}
              style={{ flex: 1, padding: "6px 4px", borderRadius: 10, border: form.type === k ? `2px solid ${v.color}` : "2px solid #e2e8f0", background: form.type === k ? v.bg : "#f8fafc", color: form.type === k ? v.color : P.soft, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              {v.icon} {v.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 11, color: P.soft, fontWeight: 500, letterSpacing: 0.3 }}>Note</label>
        <div style={{ display: "flex", gap: 4, marginTop: 5 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setForm({ ...form, rating: n })}
              style={{ fontSize: 22, background: "none", border: "none", cursor: "pointer", color: n <= form.rating ? "#f59e0b" : "#e2e8f0", padding: "0 2px" }}>★</button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 11, color: P.soft, fontWeight: 500, letterSpacing: 0.3 }}>Commentaire</label>
        <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Tes impressions..." rows={3}
          style={{ display: "block", width: "100%", padding: "8px 12px", borderRadius: 12, border: "1.5px solid #e2e8f0", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#f8fafc", color: P.text, resize: "none" }}
          onFocus={(e) => (e.target.style.borderColor = P.a1)} onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")} />
      </div>
      <button onClick={submit} style={{ width: "100%", padding: 10, borderRadius: 8, border: "none", background: "#1e293b", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{isEdit ? "Sauvegarder" : "Ajouter"}</button>
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 9.5, fontWeight: 600, background: t.bg, color: t.color, padding: "1.5px 7px", borderRadius: 6 }}>{t.icon} {t.label}</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: P.text }}>{spot.name}</div>
          <div style={{ marginTop: 3 }}><Stars rating={spot.rating} /></div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={onEdit} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 10, fontWeight: 600, color: P.a1, cursor: "pointer", fontFamily: "inherit" }}>✎ Modifier</button>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: P.soft, cursor: "pointer" }}>✕</button>
        </div>
      </div>

      {/* Note */}
      {spot.note && (
        <div style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 12px", marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: P.soft, lineHeight: 1.5 }}>{spot.note}</div>
        </div>
      )}

      {/* Purchase history */}
      <div style={{ fontSize: 12, fontWeight: 600, color: P.text, marginBottom: 10 }}>
        Achats à ce spot
      </div>

      {purchases.length === 0 ? (
        <div style={{ background: "#f8fafc", borderRadius: 8, padding: "18px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>🛒</div>
          <div style={{ fontSize: 12, color: P.soft }}>Aucun achat enregistré ici.</div>
          <div style={{ fontSize: 10, color: P.soft, marginTop: 3, opacity: 0.7 }}>Les achats apparaissent automatiquement quand la source dans le Wallet correspond à ce spot.</div>
        </div>
      ) : (
        <>
          {/* Summary row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
            <div style={{ background: "#f8fafc", borderRadius: 12, padding: "10px 12px" }}>
              <div style={{ fontSize: 9, color: P.soft, fontWeight: 500, letterSpacing: 0.3, textTransform: "uppercase", marginBottom: 3 }}>Total dépensé</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: P.a1 }}>{fmt(totalSpent)}</div>
            </div>
            <div style={{ background: "#f8fafc", borderRadius: 12, padding: "10px 12px" }}>
              <div style={{ fontSize: 9, color: P.soft, fontWeight: 500, letterSpacing: 0.3, textTransform: "uppercase", marginBottom: 3 }}>Achats</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: P.text }}>{purchases.length}</div>
            </div>
          </div>

          {/* Transaction list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {purchases.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: "#f8fafc", borderRadius: 12, padding: "9px 12px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: P.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.itemName}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                    <TypeBadge type={p.itemType} />
                    <span style={{ fontSize: 9.5, color: P.soft }}>{fmtDate(p.date)}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: P.text }}>{fmt(p.price * p.quantity)}</div>
                  {p.quantity > 1 && <div style={{ fontSize: 9, color: P.soft }}>{fmt(p.price)} × {p.quantity}</div>}
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
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        {sorted.map((sp) => {
          const t = SPOT_TYPES[sp.type];
          const count = purchaseCounts[sp.id] || 0;
          return (
            <Card key={sp.id} onClick={() => setSelectedSpot(sp)}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 9.5, fontWeight: 600, background: t.bg, color: t.color, padding: "1.5px 7px", borderRadius: 6 }}>{t.icon} {t.label}</span>
                    {count > 0 && <span style={{ fontSize: 9, fontWeight: 600, background: "#f1f5f9", color: P.a1, padding: "1.5px 6px", borderRadius: 6 }}>{count} achat{count > 1 ? "s" : ""}</span>}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: P.text }}>{sp.name}</div>
                  <div style={{ marginTop: 3 }}><Stars rating={sp.rating} /></div>
                  {sp.note && <div style={{ fontSize: 10.5, color: P.soft, marginTop: 5, lineHeight: 1.5 }}>{sp.note}</div>}
                </div>
                <div style={{ color: P.soft, fontSize: 16, flexShrink: 0 }}>›</div>
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: P.text }}>{isEdit ? "Modifier" : "Nouvelle"} ressource</div>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: P.soft, cursor: "pointer" }}>✕</button>
      </div>
      <Input label="Titre" type="text" placeholder="Ex: Guide investissement Pokémon cards" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <Input label="URL" type="text" placeholder="https://..." value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 11, color: P.soft, fontWeight: 500, letterSpacing: 0.3 }}>Type</label>
        <div style={{ display: "flex", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
          {Object.entries(RESOURCE_TYPES).map(([k, v]) => (
            <button key={k} onClick={() => setForm({ ...form, type: k })}
              style={{ flex: "1 1 calc(50% - 3px)", padding: "6px 4px", borderRadius: 10, border: form.type === k ? `2px solid ${v.color}` : "2px solid #e2e8f0", background: form.type === k ? v.bg : "#f8fafc", color: form.type === k ? v.color : P.soft, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              {v.icon} {v.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 11, color: P.soft, fontWeight: 500, letterSpacing: 0.3 }}>Note (optionnel)</label>
        <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Tes impressions, points clés..." rows={3}
          style={{ display: "block", width: "100%", padding: "8px 12px", borderRadius: 12, border: "1.5px solid #e2e8f0", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#f8fafc", color: P.text, resize: "none" }}
          onFocus={(e) => (e.target.style.borderColor = P.a1)} onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")} />
      </div>
      <button onClick={submit} style={{ width: "100%", padding: 10, borderRadius: 8, border: "none", background: "#1e293b", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{isEdit ? "Sauvegarder" : "Ajouter"}</button>
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
      {/* Filter pills */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        <button onClick={() => setFilter("all")}
          style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: filter === "all" ? P.a1 : "#f1f5f9", color: filter === "all" ? "#fff" : P.soft, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>
          Tous {resources.length > 0 && `(${resources.length})`}
        </button>
        {Object.entries(RESOURCE_TYPES).map(([k, v]) => counts[k] ? (
          <button key={k} onClick={() => setFilter(k)}
            style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: filter === k ? v.color : v.bg, color: filter === k ? "#fff" : v.color, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>
            {v.icon} {v.label} ({counts[k]})
          </button>
        ) : null)}
      </div>

      {/* Resource cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        {filtered.map((r) => {
          const t = RESOURCE_TYPES[r.type] || RESOURCE_TYPES.other;
          return (
            <Card key={r.id} onClick={() => openUrl(r.url)}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 9.5, fontWeight: 600, background: t.bg, color: t.color, padding: "1.5px 7px", borderRadius: 6 }}>{t.icon} {t.label}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: P.text, lineHeight: 1.3 }}>{r.title}</div>
                  <div style={{ fontSize: 10, color: P.a1, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.url}</div>
                  {r.note && <div style={{ fontSize: 10.5, color: P.soft, marginTop: 5, lineHeight: 1.5 }}>{r.note}</div>}
                </div>
                {/* Actions — stop propagation so they don't trigger the card's openUrl */}
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => setEditRes(r)} style={{ background: "none", border: "none", fontSize: 14, color: P.soft, cursor: "pointer" }}>✎</button>
                  <button onClick={() => del(r.id)} style={{ background: "none", border: "none", fontSize: 14, color: P.soft, cursor: "pointer" }}
                    onMouseEnter={(e) => (e.target.style.color = "#dc2626")} onMouseLeave={(e) => (e.target.style.color = P.soft)}>×</button>
                </div>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ background: "#f8fafc", borderRadius: 18, padding: "28px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📚</div>
            <div style={{ fontSize: 13, color: P.soft, fontWeight: 500 }}>{filter === "all" ? "Aucune ressource" : `Aucune ressource de type "${RESOURCE_TYPES[filter]?.label}"`}</div>
            <div style={{ fontSize: 10.5, color: P.soft, marginTop: 4, opacity: 0.7 }}>Ajoute des liens utiles ci-dessous</div>
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
  { id: "wallet", label: "Wallet", icon: "💰" },
  { id: "calendar", label: "Calendrier", icon: "📅" },
  { id: "spots", label: "Spots", icon: "📍" },
  { id: "resources", label: "Ressources", icon: "📚" },
];


export default function App() {
  const [tab, setTab] = useState("wallet");
  const [items, setItems] = useState(INIT.items);
  const [events, setEvents] = useState(INIT.events);
  const [spots, setSpots] = useState(INIT.spots);
  const [resources, setResources] = useState(INIT.resources);
  const [loaded, setLoaded] = useState(false);

  // Migration V2→V3 items
  const migrateItems = (raw) => raw.map((item) => {
    if (item.transactions && Array.isArray(item.transactions)) return item;
    return { id: item.id, name: item.name, type: item.type, currentPrice: item.currentPrice || item.buyPrice || 0, transactions: [{ id: item.id * 100 + 1, date: "2025-12-01", price: item.buyPrice || 0, quantity: item.quantity || 1, source: "Ancien import" }] };
  });

  // Load from localStorage
  useEffect(() => {
    try { const r = localStorage.getItem("pokemon-wallet-items"); if (r) setItems(migrateItems(JSON.parse(r))); } catch (e) {}
    try { const r = localStorage.getItem("pokemon-wallet-events"); if (r) setEvents(JSON.parse(r)); } catch (e) {}
    try { const r = localStorage.getItem("pokemon-wallet-spots"); if (r) setSpots(JSON.parse(r)); } catch (e) {}
    try { const r = localStorage.getItem("hexuo-resources"); if (r) setResources(JSON.parse(r)); } catch (e) {}
    setLoaded(true);
  }, []);

  // Save each collection independently
  useEffect(() => { if (!loaded) return; try { localStorage.setItem("pokemon-wallet-items", JSON.stringify(items)); } catch (e) {} }, [items, loaded]);
  useEffect(() => { if (!loaded) return; try { localStorage.setItem("pokemon-wallet-events", JSON.stringify(events)); } catch (e) {} }, [events, loaded]);
  useEffect(() => { if (!loaded) return; try { localStorage.setItem("pokemon-wallet-spots", JSON.stringify(spots)); } catch (e) {} }, [spots, loaded]);
  useEffect(() => { if (!loaded) return; try { localStorage.setItem("hexuo-resources", JSON.stringify(resources)); } catch (e) {} }, [resources, loaded]);

  return (
    <div style={{ minHeight: "100vh", background: P.bg, fontFamily: "'Inter', 'Sora', sans-serif", color: P.text, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <Blob style={{ top: -80, right: -80, width: 300, height: 300, background: "#94a3b8" }} />
      <Blob style={{ bottom: 100, left: -100, width: 260, height: 260, background: "#cbd5e1" }} />

      {/* Logo — top right, discreet */}
      <div style={{ position: "relative", zIndex: 1, padding: "20px 22px 12px", flexShrink: 0, textAlign: "right" }}>
        <span style={{ fontSize: 17, fontWeight: 700, color: P.text, letterSpacing: "-0.5px" }}>Hexuo</span>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", position: "relative", zIndex: 1, padding: "0 20px 100px" }}>
        {tab === "wallet" && <WalletTab items={items} setItems={setItems} events={events} />}
        {tab === "calendar" && <CalendarTab events={events} setEvents={setEvents} />}
        {tab === "spots" && <SpotsTab spots={spots} setSpots={setSpots} items={items} />}
        {tab === "resources" && <ResourcesTab resources={resources} setResources={setResources} />}
      </div>

      {/* Bottom tab bar */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50, display: "flex", gap: 4, padding: "10px 16px 28px", background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderTop: "1px solid #e2e8f0" }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex: 1, padding: "8px 4px", borderRadius: 10, border: "none", background: tab === t.id ? "#1e293b" : "transparent", color: tab === t.id ? "#fff" : P.soft, fontSize: 9.5, fontWeight: tab === t.id ? 600 : 500, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

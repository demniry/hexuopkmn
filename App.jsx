import { useState, useEffect, useMemo } from "react";

// ═══════════════════════════════════════════════════════════
// PALETTE & SHARED UTILS
// ═══════════════════════════════════════════════════════════
const P = {
  bg: "#f5f0fa", card: "#fff", shadow: "0 2px 24px rgba(100,80,140,0.08)",
  a1: "#a78bca", a2: "#f9a8d4", a3: "#7dd3fc", a4: "#86efac",
  text: "#3d3350", soft: "#7a6d8a",
};

const fmt = (n) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 0 });
const fmtDate = (d) => new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
const today = () => new Date().toISOString().split("T")[0];

// ═══════════════════════════════════════════════════════════
// INITIAL DATA
// ═══════════════════════════════════════════════════════════
const INIT = {
  items: [
    { id: 1, name: "UPC Sulfura – Team Rocket", type: "Ultra Premium Collection", currentPrice: 410, transactions: [{ id: 101, date: "2025-12-19", price: 320, quantity: 1, source: "Auchan" }] },
    { id: 2, name: "Bundle Evolutions Prismatiques", type: "Bundle", currentPrice: 240, transactions: [{ id: 201, date: "2025-11-10", price: 180, quantity: 1, source: "Amazon" }, { id: 202, date: "2025-12-05", price: 195, quantity: 1, source: "eBay" }] },
    { id: 3, name: "Bundle Flammes Blanches", type: "Bundle", currentPrice: 142, transactions: [{ id: 301, date: "2025-12-01", price: 150, quantity: 1, source: "Carrefour" }] },
  ],
  events: [
    { id: 1, title: "Sortie: Mega Evolution – Phantasmal Flames", date: "2026-02-14", type: "release", note: "Nouveau set très attendu, on surveille les prix de pré-commande" },
    { id: 2, title: "Brocante Perrache", date: "2026-02-08", type: "brocante", note: "Bonne brocante, arriver avant 9h pour les meilleurs lots" },
    { id: 3, title: "Salon du Collectible – Lyon", date: "2026-03-15", type: "event", note: "Grand salon, budget 100€ max" },
    { id: 4, title: "Sortie: Scarlet & Violet – Next Wave", date: "2026-03-01", type: "release", note: "" },
  ],
  spots: [
    { id: 1, name: "Gamemania – Part Dieu", type: "magasin", rating: 4, note: "Bon stock en général, prix un peu élevés mais personnel connaît le marché. Utile pour les dernières sorties." },
    { id: 2, name: "eBay France", type: "online", rating: 5, note: "Meilleure source pour les sealed products. Utiliser les filtres 'acheter maintenant' + vendeur évalué." },
    { id: 3, name: "Brocante Perrache", type: "brocante", rating: 3, note: "Très variable selon les semaines. Mieux vaut y aller tôt, avant 9h." },
    { id: 4, name: "Carrefour City – Massoury", type: "magasin", rating: 2, note: "Rarement en stock, prix officiels. Utile en dépannage uniquement." },
  ],
  resources: [
    { id: 1, title: "Pulling a Charizard VSTAR - Pack Opening", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", type: "video", note: "Vidéo super bien filmée, la qualité de présentation est inspirante pour un futur projet" },
    { id: 2, title: "Le marché des sealed products en 2025", url: "https://example.com/article-sealed-products", type: "article", note: "Analyse claire de l'évolution des prix. Le point sur les UPC est particulièrement utile" },
    { id: 3, title: "Tips pour acheter des cartes sur eBay sans se faire avoir", url: "https://twitter.com/pokecollector/status/123456", type: "tweet", note: "Conseils pratiques, notamment sur comment vérifier l'authenticité avant d'enchérir" },
    { id: 4, title: "Guide complet: Investir dans les Pokémon cards", url: "https://example.com/guide-investissement", type: "article", note: "" },
  ],
};

// ═══════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════
function Blob({ style }) {
  return <div style={{ position: "absolute", borderRadius: "50%", filter: "blur(80px)", opacity: 0.35, pointerEvents: "none", ...style }} />;
}

function Input({ label, type, placeholder, value, onChange, style: extraStyle }) {
  return (
    <div style={{ marginBottom: 10, ...extraStyle }}>
      <label style={{ fontSize: 11, color: P.soft, fontWeight: 500, letterSpacing: 0.3 }}>{label}</label>
      <input type={type} placeholder={placeholder} value={value} onChange={onChange}
        style={{ display: "block", width: "100%", padding: "8px 12px", borderRadius: 12, border: "1.5px solid #e5dff0", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#faf8fd", color: P.text }}
        onFocus={(e) => (e.target.style.borderColor = P.a1)} onBlur={(e) => (e.target.style.borderColor = "#e5dff0")}
      />
    </div>
  );
}

function AddButton({ onClick }) {
  return (
    <button onClick={onClick}
      style={{ width: "100%", padding: "14px", border: "2px dashed #d1c4e9", borderRadius: 20, background: "transparent", color: P.soft, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", transition: "border-color 0.2s, color 0.2s" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = P.a1; e.currentTarget.style.color = P.a1; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#d1c4e9"; e.currentTarget.style.color = P.soft; }}
    >+ Ajouter</button>
  );
}

function Card({ children, onClick, style: extra }) {
  return (
    <div onClick={onClick}
      style={{ background: P.card, borderRadius: 20, padding: "14px 16px", boxShadow: P.shadow, cursor: onClick ? "pointer" : "default", transition: "transform 0.2s, box-shadow 0.2s", ...extra }}
      onMouseEnter={(e) => { if (onClick) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 28px rgba(100,80,140,0.14)"; }}}
      onMouseLeave={(e) => { if (onClick) { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = P.shadow; }}}
    >{children}</div>
  );
}

function BottomModal({ onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(61,51,80,0.4)", backdropFilter: "blur(6px)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 520, maxHeight: "85vh", overflowY: "auto", padding: "20px 20px 40px" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "#e5dff0", margin: "0 auto 18px" }} />
        {children}
      </div>
    </div>
  );
}

// Stars rating display
function Stars({ rating, max = 5 }) {
  return (
    <span style={{ fontSize: 13, letterSpacing: 1 }}>
      {"★".repeat(rating)}<span style={{ color: "#e5dff0" }}>{"★".repeat(max - rating)}</span>
    </span>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB: WALLET (portfolio)
// ═══════════════════════════════════════════════════════════
const totalQty = (item) => item.transactions.reduce((s, t) => s + t.quantity, 0);
const totalCost = (item) => item.transactions.reduce((s, t) => s + t.price * t.quantity, 0);
const avgPrice = (item) => { const q = totalQty(item); return q > 0 ? totalCost(item) / q : 0; };
const itemPnLPct = (item) => { const avg = avgPrice(item); return avg > 0 ? (((item.currentPrice - avg) / avg) * 100).toFixed(1) : "0.0"; };

function TypeBadge({ type }) {
  const map = { "Ultra Premium Collection": { bg: "#f0e6ff", text: "#7c5cbf" }, "Bundle": { bg: "#e6f4ff", text: "#4a8fc9" }, "Elite Trainer Box": { bg: "#fff0e6", text: "#c97a4a" }, "Collection Box": { bg: "#e6fff0", text: "#4ac97a" } };
  const c = map[type] || { bg: "#f0f0f0", text: "#666" };
  return <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase", background: c.bg, color: c.text, padding: "2px 8px", borderRadius: 20, display: "inline-block" }}>{type}</span>;
}

function MiniBar({ value, max, color }) {
  const w = Math.max((value / max) * 100, 6);
  return (
    <div style={{ width: "100%", height: 5, borderRadius: 3, background: "#e8e0f0", overflow: "hidden" }}>
      <div style={{ width: `${w}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.6s cubic-bezier(.4,0,.2,1)" }} />
    </div>
  );
}

function DonutChart({ items }) {
  const total = items.reduce((s, i) => s + i.currentPrice * totalQty(i), 0);
  if (total === 0) return null;
  const colors = ["#a78bca", "#7dd3fc", "#f9a8d4", "#86efac", "#fbbf24", "#fb923c", "#c084fc", "#34d399"];
  let cumul = 0;
  const segments = items.map((item, idx) => { const val = (item.currentPrice * totalQty(item)) / total; const start = cumul; cumul += val; return { item, val, start, color: colors[idx % colors.length] }; });
  const size = 110, cx = size / 2, cy = size / 2, r = 42;
  const arc = (s, e) => { const a1 = s * 2 * Math.PI - Math.PI / 2, a2 = e * 2 * Math.PI - Math.PI / 2; return `M ${cx} ${cy} L ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)} A ${r} ${r} 0 ${e - s > 0.5 ? 1 : 0} 1 ${cx + r * Math.cos(a2)} ${cy + r * Math.sin(a2)} Z`; };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
        {segments.map((seg, i) => <path key={i} d={arc(seg.start, seg.start + seg.val)} fill={seg.color} stroke="#fff" strokeWidth="2.5" />)}
        <circle cx={cx} cy={cy} r={20} fill="#fff" />
        <text x={cx} y={cy - 2} textAnchor="middle" fontSize="11" fontWeight="700" fill={P.text}>{items.length}</text>
        <text x={cx} y={cy + 7} textAnchor="middle" fontSize="6.5" fill={P.soft}>items</text>
      </svg>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
        {items.map((item, idx) => <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: colors[idx % colors.length], flexShrink: 0 }} /><span style={{ fontSize: 11, color: P.text, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span><span style={{ fontSize: 11, fontWeight: 600, color: P.soft }}>{((item.currentPrice * totalQty(item)) / total * 100).toFixed(1)}%</span></div>)}
      </div>
    </div>
  );
}

function ItemDetailModal({ item, onClose, onUpdate }) {
  const [newTx, setNewTx] = useState({ date: today(), price: "", quantity: "1", source: "" });
  const [editingPrice, setEditingPrice] = useState(false);
  const [editPrice, setEditPrice] = useState(String(item.currentPrice));
  const [editingTxId, setEditingTxId] = useState(null);
  const [editTx, setEditTx] = useState({ source: "", date: "", price: "", quantity: "" });
  const pnL = (item.currentPrice - avgPrice(item)) * totalQty(item);
  const isUp = pnL >= 0;

  const savePrice = () => { const v = Number(editPrice); if (!isNaN(v) && v >= 0) onUpdate({ ...item, currentPrice: v }); setEditingPrice(false); };
  const addTx = () => { if (!newTx.source || Number(newTx.price) <= 0) return; onUpdate({ ...item, transactions: [...item.transactions, { id: Date.now(), date: newTx.date, price: Number(newTx.price), quantity: Number(newTx.quantity), source: newTx.source }] }); setNewTx({ date: today(), price: "", quantity: "1", source: "" }); };
  const deleteTx = (id) => { const rem = item.transactions.filter((t) => t.id !== id); onUpdate(rem.length === 0 ? null : { ...item, transactions: rem }); };
  const saveTx = (id) => { if (!editTx.source || Number(editTx.price) <= 0) return; onUpdate({ ...item, transactions: item.transactions.map((t) => t.id === id ? { ...t, source: editTx.source, date: editTx.date, price: Number(editTx.price), quantity: Number(editTx.quantity) } : t) }); setEditingTxId(null); };

  return (
    <BottomModal onClose={onClose}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div><div style={{ fontSize: 17, fontWeight: 700, color: P.text }}>{item.name}</div><div style={{ marginTop: 5 }}><TypeBadge type={item.type} /></div></div>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: P.soft, cursor: "pointer" }}>✕</button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
        {[
          { label: "Valeur", value: fmt(item.currentPrice * totalQty(item)), sub: `${fmt(item.currentPrice)} × ${totalQty(item)}` },
          { label: "Coût moy.", value: fmt(avgPrice(item)), sub: `${totalQty(item)} unité${totalQty(item) > 1 ? "s" : ""}` },
          { label: "PnL", value: `${isUp ? "+" : ""}${fmt(pnL)}`, sub: `${isUp ? "+" : ""}${itemPnLPct(item)}%`, hl: true, isUp },
        ].map((s, i) => (
          <div key={i} style={{ background: "#faf8fd", borderRadius: 14, padding: 10 }}>
            <div style={{ fontSize: 9, color: P.soft, fontWeight: 500, letterSpacing: 0.3, textTransform: "uppercase", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: s.hl ? (s.isUp ? "#16a34a" : "#dc2626") : P.text }}>{s.value}</div>
            <div style={{ fontSize: 9, color: P.soft, marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Prix editable */}
      <div style={{ background: "#faf8fd", borderRadius: 14, padding: "12px 14px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
        {!editingPrice && <button onClick={() => { setEditingPrice(true); setEditPrice(String(item.currentPrice)); }} style={{ fontSize: 10, fontWeight: 600, color: P.a1, background: "#f0e6ff", border: "none", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontFamily: "inherit" }}>✎ Modifier</button>}
      </div>

      {/* Historique */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: P.text, marginBottom: 10 }}>Historique des achats</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[...item.transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).map((tx) => {
            if (editingTxId === tx.id) {
              return (
                <div key={tx.id} style={{ background: "#f0e6ff", borderRadius: 12, padding: "10px 12px" }}>
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
                style={{ display: "flex", alignItems: "center", gap: 10, background: "#faf8fd", borderRadius: 12, padding: "8px 12px", cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f0e6ff")} onMouseLeave={(e) => (e.currentTarget.style.background = "#faf8fd")}>
                <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 600, color: P.text }}>{tx.source}</div><div style={{ fontSize: 10, color: P.soft }}>{fmtDate(tx.date)} · Qté : {tx.quantity}</div></div>
                <div style={{ textAlign: "right" }}><div style={{ fontSize: 13, fontWeight: 700, color: P.text }}>{fmt(tx.price)}</div><div style={{ fontSize: 9, color: P.soft }}>/ unité</div></div>
                <div style={{ fontSize: 12, color: P.soft }}>›</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Nouvelle transaction */}
      <div style={{ background: "#f5f0fa", borderRadius: 14, padding: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: P.text, marginBottom: 10 }}>+ Nouvelle transaction</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <Input label="Où acheté" type="text" placeholder="Amazon..." value={newTx.source} onChange={(e) => setNewTx({ ...newTx, source: e.target.value })} />
          <Input label="Date" type="date" value={newTx.date} onChange={(e) => setNewTx({ ...newTx, date: e.target.value })} />
          <Input label="Prix (€)" type="number" placeholder="180" value={newTx.price} onChange={(e) => setNewTx({ ...newTx, price: e.target.value })} />
          <Input label="Quantité" type="number" placeholder="1" value={newTx.quantity} onChange={(e) => setNewTx({ ...newTx, quantity: e.target.value })} />
        </div>
        <button onClick={addTx} style={{ width: "100%", padding: 8, borderRadius: 10, border: "none", background: "linear-gradient(135deg, #a78bca, #c4b5fd)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginTop: 4 }}>Ajouter achat</button>
      </div>
    </BottomModal>
  );
}

function WalletTab({ items, setItems }) {
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", type: "Bundle", source: "", date: today(), price: "", quantity: "1", currentPrice: "" });
  const selectedItem = useMemo(() => items.find((i) => i.id === selectedId) || null, [items, selectedId]);

  const totalBuy = items.reduce((s, i) => s + totalCost(i), 0);
  const totalCur = items.reduce((s, i) => s + i.currentPrice * totalQty(i), 0);
  const totalPnL = totalCur - totalBuy;
  const totalPnLPct = totalBuy > 0 ? ((totalPnL / totalBuy) * 100).toFixed(1) : "0.0";
  const maxVal = Math.max(...items.map((i) => i.currentPrice * totalQty(i)), 1);

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
      <div style={{ background: "linear-gradient(135deg, #c4b5fd 0%, #a78bca 40%, #f9a8d4 100%)", borderRadius: 24, padding: "22px 22px 18px", color: "#fff", marginBottom: 16, boxShadow: "0 4px 32px rgba(167,139,202,0.35)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.12) 0%, transparent 60%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: 1.2, opacity: 0.8, marginBottom: 2 }}>VALEUR TOTALE</div>
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -1 }}>{fmt(totalCur)}</div>
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10, fontSize: 12, fontWeight: 500 }}>
            <span style={{ background: totalPnL >= 0 ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)", padding: "3px 10px", borderRadius: 20 }}>{totalPnL >= 0 ? "+" : ""}{fmt(totalPnL)} ({totalPnL >= 0 ? "+" : ""}{totalPnLPct}%)</span>
            <span style={{ opacity: 0.6, fontSize: 10 }}>vs. {fmt(totalBuy)}</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 18 }}>
        {[
          { label: "Items", value: items.reduce((s, i) => s + totalQty(i), 0), color: P.a1 },
          { label: "En bénéfice", value: items.filter((i) => i.currentPrice >= avgPrice(i)).length, color: "#16a34a" },
          { label: "En perte", value: items.filter((i) => i.currentPrice < avgPrice(i)).length, color: "#dc2626" },
        ].map((s) => (
          <div key={s.label} style={{ background: P.card, borderRadius: 16, padding: "10px 8px", boxShadow: P.shadow, textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 9, color: P.soft, fontWeight: 500, letterSpacing: 0.3, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        {items.map((item) => {
          const isUp = item.currentPrice >= avgPrice(item);
          return (
            <Card key={item.id} onClick={() => setSelectedId(item.id)}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{item.name}</div>
                  <div style={{ marginBottom: 7 }}><TypeBadge type={item.type} /></div>
                  <MiniBar value={item.currentPrice * totalQty(item)} max={maxVal} color={isUp ? P.a4 : P.a2} />
                  <div style={{ fontSize: 10, color: P.soft, marginTop: 4 }}>{totalQty(item)} unité{totalQty(item) > 1 ? "s" : ""} · {item.transactions.length} achat{item.transactions.length > 1 ? "s" : ""} · moy. {fmt(avgPrice(item))}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{fmt(item.currentPrice)}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: isUp ? "#16a34a" : "#dc2626", marginTop: 2 }}>{isUp ? "+" : ""}{itemPnLPct(item)}%</div>
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
          <Input label="Nom" type="text" placeholder="Ex: Elite Trainer Box..." value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Où acheté" type="text" placeholder="Amazon, eBay..." value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
          <Input label="Date d'achat" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Input label="Prix d'achat (€)" type="number" placeholder="150" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <Input label="Quantité" type="number" placeholder="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          <Input label="Prix actuel (€)" type="number" placeholder="180" value={form.currentPrice} onChange={(e) => setForm({ ...form, currentPrice: e.target.value })} />
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: P.soft, fontWeight: 500, letterSpacing: 0.3 }}>Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={{ display: "block", width: "100%", padding: "8px 12px", borderRadius: 12, border: "1.5px solid #e5dff0", fontSize: 13, fontFamily: "inherit", background: "#faf8fd", color: P.text, outline: "none", boxSizing: "border-box" }}>
              <option value="Ultra Premium Collection">Ultra Premium Collection</option><option value="Bundle">Bundle</option><option value="Elite Trainer Box">Elite Trainer Box</option><option value="Collection Box">Collection Box</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={addItem} style={{ flex: 1, padding: 10, borderRadius: 14, border: "none", background: "linear-gradient(135deg, #a78bca, #c4b5fd)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Ajouter</button>
            <button onClick={() => setShowForm(false)} style={{ padding: "10px 16px", borderRadius: 14, border: "1.5px solid #e5dff0", background: "transparent", color: P.soft, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Annuler</button>
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
  release: { label: "Sortie", color: "#a78bca", bg: "#f0e6ff", icon: "📦" },
  brocante: { label: "Brocante", color: "#f9a8d4", bg: "#fff0f5", icon: "🛒" },
  event: { label: "Événement", color: "#7dd3fc", bg: "#f0f8ff", icon: "🎪" },
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
              style={{ flex: 1, padding: "6px 4px", borderRadius: 10, border: form.type === k ? `2px solid ${v.color}` : "2px solid #e5dff0", background: form.type === k ? v.bg : "#faf8fd", color: form.type === k ? v.color : P.soft, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              {v.icon} {v.label}
            </button>
          ))}
        </div>
      </div>
      <Input label="Note (optionnel)" type="text" placeholder="Détails..." value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
      <button onClick={submit} style={{ width: "100%", padding: 10, borderRadius: 14, border: "none", background: "linear-gradient(135deg, #a78bca, #c4b5fd)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{isEdit ? "Sauvegarder" : "Ajouter"}</button>
    </BottomModal>
  );
}

function CalendarTab({ events, setEvents }) {
  const [showForm, setShowForm] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [view, setView] = useState("list"); // "list" | "grid"
  const [gridMonth, setGridMonth] = useState(() => { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() }; });
  const [dayPopover, setDayPopover] = useState(null); // date string "YYYY-MM-DD" or null
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
                    <div style={{ background: isPast ? "#eee" : t.bg, borderRadius: 14, padding: "8px 10px", textAlign: "center", flexShrink: 0, minWidth: 48 }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: isPast ? "#999" : t.color, lineHeight: 1.1 }}>{new Date(ev.date + "T12:00:00").getDate()}</div>
                      <div style={{ fontSize: 8.5, color: isPast ? "#999" : t.color, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{new Date(ev.date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short" })}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 9.5, fontWeight: 600, background: t.bg, color: t.color, padding: "1.5px 7px", borderRadius: 20 }}>{t.icon} {t.label}</span>
                        {isToday && <span style={{ fontSize: 9, fontWeight: 600, color: "#16a34a", background: "#f0fff4", padding: "1.5px 6px", borderRadius: 20 }}>Aujourd'hui</span>}
                        {!isPast && !isToday && days <= 7 && <span style={{ fontSize: 9, fontWeight: 600, color: "#dc2626", background: "#fff0f0", padding: "1.5px 6px", borderRadius: 20 }}>Dans {days}j</span>}
                        {isPast && <span style={{ fontSize: 9, color: "#999", background: "#f0f0f0", padding: "1.5px 6px", borderRadius: 20 }}>Il y a {Math.abs(days)}j</span>}
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
          {cells.map((cell, i) => {
            if (!cell) return <div key={`e-${i}`} />;
            const { d, dateStr, evs } = cell;
            const isToday = dateStr === todayStr;
            const hasEvents = evs.length > 0;
            return (
              <div key={dateStr}
                onClick={() => hasEvents && setDayPopover(dateStr)}
                style={{
                  aspectRatio: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  borderRadius: 10, background: isToday ? P.a1 : "transparent", cursor: hasEvents ? "pointer" : "default",
                  position: "relative", transition: "background 0.15s",
                }}
                onMouseEnter={(e) => { if (hasEvents && !isToday) e.currentTarget.style.background = "#ede9f5"; }}
                onMouseLeave={(e) => { if (!isToday) e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{ fontSize: 13, fontWeight: isToday ? 700 : 500, color: isToday ? "#fff" : P.text }}>{d}</div>
                {/* Event dots */}
                {hasEvents && (
                  <div style={{ display: "flex", gap: 2, marginTop: 3 }}>
                    {evs.slice(0, 3).map((ev, idx) => (
                      <div key={idx} style={{ width: 5, height: 5, borderRadius: "50%", background: EVENT_TYPES[ev.type]?.color || P.a1 }} />
                    ))}
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
                  <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 8, background: "#faf8fd", borderRadius: 12, padding: "8px 10px" }}>
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
      <div style={{ display: "flex", gap: 4, background: "#ede9f5", borderRadius: 12, padding: 3, marginBottom: 18 }}>
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
  magasin: { label: "Magasin", color: "#a78bca", bg: "#f0e6ff", icon: "🏪" },
  online: { label: "En ligne", color: "#7dd3fc", bg: "#f0f8ff", icon: "🌐" },
  brocante: { label: "Brocante", color: "#f9a8d4", bg: "#fff0f5", icon: "🛒" },
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
              style={{ flex: 1, padding: "6px 4px", borderRadius: 10, border: form.type === k ? `2px solid ${v.color}` : "2px solid #e5dff0", background: form.type === k ? v.bg : "#faf8fd", color: form.type === k ? v.color : P.soft, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
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
              style={{ fontSize: 22, background: "none", border: "none", cursor: "pointer", color: n <= form.rating ? "#f59e0b" : "#e5dff0", padding: "0 2px" }}>★</button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 11, color: P.soft, fontWeight: 500, letterSpacing: 0.3 }}>Commentaire</label>
        <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Tes impressions..." rows={3}
          style={{ display: "block", width: "100%", padding: "8px 12px", borderRadius: 12, border: "1.5px solid #e5dff0", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#faf8fd", color: P.text, resize: "none" }}
          onFocus={(e) => (e.target.style.borderColor = P.a1)} onBlur={(e) => (e.target.style.borderColor = "#e5dff0")} />
      </div>
      <button onClick={submit} style={{ width: "100%", padding: 10, borderRadius: 14, border: "none", background: "linear-gradient(135deg, #a78bca, #c4b5fd)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{isEdit ? "Sauvegarder" : "Ajouter"}</button>
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
            <span style={{ fontSize: 9.5, fontWeight: 600, background: t.bg, color: t.color, padding: "1.5px 7px", borderRadius: 20 }}>{t.icon} {t.label}</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: P.text }}>{spot.name}</div>
          <div style={{ marginTop: 3 }}><Stars rating={spot.rating} /></div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={onEdit} style={{ background: "#f0e6ff", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 10, fontWeight: 600, color: P.a1, cursor: "pointer", fontFamily: "inherit" }}>✎ Modifier</button>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: P.soft, cursor: "pointer" }}>✕</button>
        </div>
      </div>

      {/* Note */}
      {spot.note && (
        <div style={{ background: "#faf8fd", borderRadius: 14, padding: "10px 12px", marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: P.soft, lineHeight: 1.5 }}>{spot.note}</div>
        </div>
      )}

      {/* Purchase history */}
      <div style={{ fontSize: 12, fontWeight: 600, color: P.text, marginBottom: 10 }}>
        Achats à ce spot
      </div>

      {purchases.length === 0 ? (
        <div style={{ background: "#faf8fd", borderRadius: 14, padding: "18px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>🛒</div>
          <div style={{ fontSize: 12, color: P.soft }}>Aucun achat enregistré ici.</div>
          <div style={{ fontSize: 10, color: P.soft, marginTop: 3, opacity: 0.7 }}>Les achats apparaissent automatiquement quand la source dans le Wallet correspond à ce spot.</div>
        </div>
      ) : (
        <>
          {/* Summary row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
            <div style={{ background: "#faf8fd", borderRadius: 12, padding: "10px 12px" }}>
              <div style={{ fontSize: 9, color: P.soft, fontWeight: 500, letterSpacing: 0.3, textTransform: "uppercase", marginBottom: 3 }}>Total dépensé</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: P.a1 }}>{fmt(totalSpent)}</div>
            </div>
            <div style={{ background: "#faf8fd", borderRadius: 12, padding: "10px 12px" }}>
              <div style={{ fontSize: 9, color: P.soft, fontWeight: 500, letterSpacing: 0.3, textTransform: "uppercase", marginBottom: 3 }}>Achats</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: P.text }}>{purchases.length}</div>
            </div>
          </div>

          {/* Transaction list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {purchases.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: "#faf8fd", borderRadius: 12, padding: "9px 12px" }}>
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
                    <span style={{ fontSize: 9.5, fontWeight: 600, background: t.bg, color: t.color, padding: "1.5px 7px", borderRadius: 20 }}>{t.icon} {t.label}</span>
                    {count > 0 && <span style={{ fontSize: 9, fontWeight: 600, background: "#f0e6ff", color: P.a1, padding: "1.5px 6px", borderRadius: 20 }}>{count} achat{count > 1 ? "s" : ""}</span>}
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
  video:   { label: "Vidéo",   color: "#dc2626", bg: "#fff5f5", icon: "▶️" },
  article: { label: "Article", color: "#7a6d8a", bg: "#f5f0fa", icon: "📄" },
  tweet:   { label: "Tweet",   color: "#0ea5e9", bg: "#f0f9ff", icon: "🐦" },
  other:   { label: "Autre",   color: "#a78bca", bg: "#f0e6ff", icon: "🔗" },
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
              style={{ flex: "1 1 calc(50% - 3px)", padding: "6px 4px", borderRadius: 10, border: form.type === k ? `2px solid ${v.color}` : "2px solid #e5dff0", background: form.type === k ? v.bg : "#faf8fd", color: form.type === k ? v.color : P.soft, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              {v.icon} {v.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 11, color: P.soft, fontWeight: 500, letterSpacing: 0.3 }}>Note (optionnel)</label>
        <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Tes impressions, points clés..." rows={3}
          style={{ display: "block", width: "100%", padding: "8px 12px", borderRadius: 12, border: "1.5px solid #e5dff0", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#faf8fd", color: P.text, resize: "none" }}
          onFocus={(e) => (e.target.style.borderColor = P.a1)} onBlur={(e) => (e.target.style.borderColor = "#e5dff0")} />
      </div>
      <button onClick={submit} style={{ width: "100%", padding: 10, borderRadius: 14, border: "none", background: "linear-gradient(135deg, #a78bca, #c4b5fd)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{isEdit ? "Sauvegarder" : "Ajouter"}</button>
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
          style={{ padding: "5px 12px", borderRadius: 20, border: "none", background: filter === "all" ? P.a1 : "#ede9f5", color: filter === "all" ? "#fff" : P.soft, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>
          Tous {resources.length > 0 && `(${resources.length})`}
        </button>
        {Object.entries(RESOURCE_TYPES).map(([k, v]) => counts[k] ? (
          <button key={k} onClick={() => setFilter(k)}
            style={{ padding: "5px 12px", borderRadius: 20, border: "none", background: filter === k ? v.color : v.bg, color: filter === k ? "#fff" : v.color, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>
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
                    <span style={{ fontSize: 9.5, fontWeight: 600, background: t.bg, color: t.color, padding: "1.5px 7px", borderRadius: 20 }}>{t.icon} {t.label}</span>
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
          <div style={{ background: "#faf8fd", borderRadius: 18, padding: "28px 20px", textAlign: "center" }}>
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
    <div style={{ minHeight: "100vh", background: P.bg, fontFamily: "'Sora', sans-serif", color: P.text, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      <Blob style={{ top: -60, right: -60, width: 280, height: 280, background: P.a1 }} />
      <Blob style={{ bottom: 80, left: -80, width: 240, height: 240, background: P.a2 }} />
      <Blob style={{ top: "40%", right: -40, width: 160, height: 160, background: P.a3 }} />

      {/* Logo — top right, discreet */}
      <div style={{ position: "relative", zIndex: 1, padding: "20px 22px 12px", flexShrink: 0, textAlign: "right" }}>
        <span style={{ fontSize: 17, fontWeight: 700, color: P.text, letterSpacing: "-0.3px" }}>Hexuo</span>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", position: "relative", zIndex: 1, padding: "0 20px 100px" }}>
        {tab === "wallet" && <WalletTab items={items} setItems={setItems} />}
        {tab === "calendar" && <CalendarTab events={events} setEvents={setEvents} />}
        {tab === "spots" && <SpotsTab spots={spots} setSpots={setSpots} items={items} />}
        {tab === "resources" && <ResourcesTab resources={resources} setResources={setResources} />}
      </div>

      {/* Bottom tab bar — fixed, frosted glass */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50, display: "flex", gap: 4, padding: "10px 16px 28px", background: "rgba(245,240,250,0.85)", backdropFilter: "blur(16px)", borderTop: "1px solid rgba(167,139,202,0.12)" }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex: 1, padding: "6px 4px", borderRadius: 14, border: "none", background: tab === t.id ? P.a1 : "transparent", color: tab === t.id ? "#fff" : P.soft, fontSize: 9.5, fontWeight: tab === t.id ? 600 : 500, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

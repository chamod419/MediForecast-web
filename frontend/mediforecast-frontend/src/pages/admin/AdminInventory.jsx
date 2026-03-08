import { useEffect, useState } from "react";
import {
  listAdminInventory,
  listAdminPharmacies,
  updateAdminInventory,
} from "../../api/adminApi";
import "./AdminPages.css";

function getErr(e) {
  const d = e?.response?.data;
  if (!d) return e?.message || "Action failed.";
  if (typeof d.detail === "string") return d.detail;
  return Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`).join(" | ");
}

function getStatus(qty, reorder) {
  if (qty <= 0)        return { cls: "ap-chip ap-chip-red",   label: "OUT OF STOCK", dot: "ap-dot-red"   };
  if (qty <= reorder)  return { cls: "ap-chip ap-chip-amber", label: "LOW STOCK",    dot: "ap-dot-amber" };
  return                      { cls: "ap-chip ap-chip-green", label: "IN STOCK",     dot: "ap-dot-green" };
}

const emptyForm = { quantity_in_stock: "", reorder_level: "", expiry_date: "" };

export default function AdminInventory() {
  const [rows,       setRows]       = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [form,       setForm]       = useState(emptyForm);
  const [q,          setQ]          = useState("");
  const [pharmacyId, setPharmacyId] = useState("");
  const [lowOnly,    setLowOnly]    = useState(false);
  const [msg,        setMsg]        = useState({ type: "", text: "" });
  const [loading,    setLoading]    = useState(false);
  const [saving,     setSaving]     = useState(false);

  useEffect(() => { loadPharmacies(); }, []);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [q, pharmacyId, lowOnly]);

  const loadPharmacies = async () => {
    try { const d = await listAdminPharmacies(); setPharmacies(Array.isArray(d) ? d : []); } catch {}
  };

  const load = async () => {
    try {
      setLoading(true);
      const d = await listAdminInventory({ q: q || undefined, pharmacy_id: pharmacyId || undefined, low_stock: lowOnly ? "true" : undefined });
      setRows(Array.isArray(d) ? d : []);
    } catch (e) { setMsg({ type: "error", text: getErr(e) }); }
    finally { setLoading(false); }
  };

  const startEdit = (row) => {
    setSelected(row);
    setForm({
      quantity_in_stock: String(row.quantity_in_stock ?? 0),
      reorder_level:     String(row.reorder_level ?? 0),
      expiry_date:       row.expiry_date || "",
    });
  };

  const clear = () => { setSelected(null); setForm(emptyForm); };

  const save = async () => {
    if (!selected) return;
    try {
      setSaving(true);
      await updateAdminInventory(selected.inventory_id, {
        quantity_in_stock: Number(form.quantity_in_stock),
        reorder_level:     Number(form.reorder_level),
        expiry_date:       form.expiry_date || null,
      });
      setMsg({ type: "success", text: "Inventory updated successfully." });
      clear(); await load();
    } catch (e) { setMsg({ type: "error", text: getErr(e) }); }
    finally { setSaving(false); }
  };

  const pharmacyName = (id) => pharmacies.find(p => p.pharmacy_id === id)?.name || id || "—";

  const stockPercent = (qty, reorder) => {
    if (!reorder) return 100;
    return Math.min(Math.round((qty / (reorder * 2)) * 100), 100);
  };

  return (
    <div className="ap-page">

      {/* ── HEADER ── */}
      <div className="ap-head">
        <div>
          <div className="ap-kicker">📦 Administration</div>
          <h1 className="ap-title">Inventory Monitoring</h1>
          <div className="ap-sub">Track and update stock across all pharmacies from a central admin console.</div>
        </div>
        <div className="ap-head-actions">
          <button
            className={`ap-btn ${lowOnly ? "ap-btn-primary" : "ap-btn-secondary"}`}
            onClick={() => setLowOnly(v => !v)}
          >
            <span className={lowOnly ? "ap-dot-amber" : ""} style={lowOnly ? { width: 7, height: 7, borderRadius: "50%", background: "#f59e0b", display: "inline-block" } : {}} />
            {lowOnly ? "⚠ Low Stock Only" : "Low Stock Filter"}
          </button>
          <button className="ap-btn ap-btn-secondary" onClick={load}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {msg.text && <div className={`ap-banner ap-banner-${msg.type}`}>{msg.text}</div>}

      <div className="ap-grid-2">

        {/* ── LEFT: LIST ── */}
        <div className="ap-card">
          <div className="ap-card-head">
            <div className="ap-card-title">Inventory List</div>
            <span className="ap-card-count">{loading ? "…" : `${rows.length} records`}</span>
          </div>

          <div className="ap-toolbar">
            <div className="ap-search-wrap">
              <svg className="ap-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                className="ap-input"
                placeholder="Search drug or pharmacy…"
                value={q}
                onChange={e => setQ(e.target.value)}
              />
            </div>
            <select className="ap-select" value={pharmacyId} onChange={e => setPharmacyId(e.target.value)}>
              <option value="">All Pharmacies</option>
              {pharmacies.map(p => (
                <option key={p.pharmacy_id} value={p.pharmacy_id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="ap-table-wrap">
            <table className="ap-table">
              <thead>
                <tr>
                  <th>Drug</th>
                  <th>Pharmacy</th>
                  <th>Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const st = getStatus(r.quantity_in_stock ?? 0, r.reorder_level ?? 0);
                  return (
                    <tr
                      key={r.inventory_id}
                      className={`ap-row-click ${selected?.inventory_id === r.inventory_id ? "ap-row-active" : ""}`}
                      onClick={() => startEdit(r)}
                      style={{ animationDelay: `${i * 16}ms` }}
                    >
                      <td>
                        <div style={{ fontWeight: 700, fontSize: 13.5 }}>{r.drug_generic_name || "—"}</div>
                        <div className="ap-muted">{r.drug_brand_name || r.drug_category || "—"}</div>
                      </td>
                      <td style={{ fontSize: 12.5, color: "rgba(228,236,250,0.6)" }}>{pharmacyName(r.pharmacy)}</td>
                      <td>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12.5, fontWeight: 700 }}>
                          {r.quantity_in_stock}
                          <span style={{ color: "rgba(228,236,250,0.3)", fontWeight: 400 }}> / {r.reorder_level}</span>
                        </div>
                        <div style={{ marginTop: 5, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden", width: 60 }}>
                          <div style={{
                            height: "100%",
                            width: `${stockPercent(r.quantity_in_stock, r.reorder_level)}%`,
                            background: (r.quantity_in_stock ?? 0) <= 0 ? "#ef4444" : (r.quantity_in_stock ?? 0) <= (r.reorder_level ?? 0) ? "#f59e0b" : "#10b981",
                            borderRadius: 2,
                            transition: "width 0.4s ease",
                          }}/>
                        </div>
                      </td>
                      <td><span className={st.cls}>{st.label}</span></td>
                    </tr>
                  );
                })}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan="4">
                      <div className="ap-empty-panel">
                        <div className="ap-empty-panel-icon">📦</div>
                        <p className="ap-empty-panel-title">No inventory records</p>
                        <p className="ap-empty-panel-sub">Try adjusting your filters.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── RIGHT: EDITOR ── */}
        <div className="ap-card">
          <div className="ap-card-head">
            <div className="ap-card-title">Inventory Editor</div>
            {selected && <span className="ap-code">{selected.inventory_id}</span>}
          </div>

          {!selected ? (
            <div className="ap-empty-panel">
              <div className="ap-empty-panel-icon">👆</div>
              <p className="ap-empty-panel-title">Select a row to edit</p>
              <p className="ap-empty-panel-sub">Click any inventory row in the list to update its stock levels.</p>
            </div>
          ) : (
            <div className="ap-form">
              <div className="ap-form-grid">

                <div className="ap-field ap-field-full">
                  <label className="ap-label">Drug</label>
                  <input
                    className="ap-input"
                    value={`${selected.drug_generic_name || ""}${selected.drug_brand_name ? ` (${selected.drug_brand_name})` : ""}`}
                    readOnly
                  />
                </div>

                <div className="ap-field ap-field-full">
                  <label className="ap-label">Pharmacy</label>
                  <input className="ap-input" value={pharmacyName(selected.pharmacy)} readOnly />
                </div>

                <div className="ap-field">
                  <label className="ap-label">Quantity in Stock</label>
                  <input
                    className="ap-input"
                    type="number"
                    min="0"
                    value={form.quantity_in_stock}
                    onChange={e => setForm(prev => ({ ...prev, quantity_in_stock: e.target.value }))}
                  />
                </div>

                <div className="ap-field">
                  <label className="ap-label">Reorder Level</label>
                  <input
                    className="ap-input"
                    type="number"
                    min="0"
                    value={form.reorder_level}
                    onChange={e => setForm(prev => ({ ...prev, reorder_level: e.target.value }))}
                  />
                </div>

                <div className="ap-field ap-field-full">
                  <label className="ap-label">Expiry Date</label>
                  <input
                    className="ap-input"
                    type="date"
                    value={form.expiry_date}
                    onChange={e => setForm(prev => ({ ...prev, expiry_date: e.target.value }))}
                  />
                </div>

                {/* Live status preview */}
                {form.quantity_in_stock !== "" && (
                  <div className="ap-field ap-field-full">
                    <label className="ap-label">Stock Status Preview</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 13px", background: "rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10 }}>
                      {(() => {
                        const st = getStatus(Number(form.quantity_in_stock), Number(form.reorder_level));
                        return <span className={st.cls}>{st.label}</span>;
                      })()}
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "rgba(228,236,250,0.45)" }}>
                        {form.quantity_in_stock} units / reorder at {form.reorder_level}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="ap-form-actions">
                <button className="ap-btn ap-btn-primary" onClick={save} disabled={saving}>
                  {saving ? "Saving…" : "Update Inventory"}
                </button>
                <button className="ap-btn ap-btn-secondary" onClick={clear}>Clear</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
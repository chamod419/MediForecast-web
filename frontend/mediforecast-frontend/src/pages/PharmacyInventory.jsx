import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../api/authApi";
import "./PharmacyInventory.css";
import {
  listInventory,
  updateInventory,
  exportInventoryExcel,
  importInventoryExcel,
} from "../api/pharmacyInventoryApi";

import { exportDispensedReportExcel } from "../api/pharmacyInventoryApi";

/* ── Fonts ─────────────────────────────────────────────────────────────────── */
if (!document.getElementById("mf-inv-fonts")) {
  const l = document.createElement("link");
  l.id = "mf-inv-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap";
  document.head.appendChild(l);
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const strHue = (s = "") => {
  let h = 0; for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  const hues = [210, 160, 270, 40, 330, 195, 25];
  return hues[Math.abs(h) % hues.length];
};

function Avatar({ name = "?", size = 40 }) {
  const hue = strHue(name);
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28, flexShrink: 0,
      background: `linear-gradient(135deg, hsl(${hue},65%,38%), hsl(${hue + 30},70%,52%))`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Outfit',sans-serif", fontWeight: 800,
      fontSize: size * 0.38, color: "#fff", letterSpacing: "-0.5px",
      boxShadow: `0 4px 14px hsla(${hue},60%,40%,0.35)`,
    }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function MiniBar({ qty = 0, reorder = 0 }) {
  const max   = Math.max(qty, reorder * 2, 1);
  const pct   = Math.min((qty / max) * 100, 100);
  const color = qty === 0 ? "#ef4444" : qty <= reorder ? "#f59e0b" : qty <= reorder * 1.5 ? "#3b82f6" : "#22c55e";
  return (
    <div style={{ width: "100%", height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 2, marginTop: 6, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2, transition: "width .5s cubic-bezier(.4,0,.2,1)" }} />
    </div>
  );
}

function StatusPill({ qty = 0, reorder = 0, expiry = null }) {
  const isLow  = qty <= reorder;
  const isOut  = qty === 0;
  const isSoon = expiry && new Date(expiry) <= new Date(Date.now() + 30 * 864e5);
  if (isOut)  return <span style={{ ...pill, background: "rgba(239,68,68,.15)",  border: "1px solid rgba(239,68,68,.4)",  color: "#fca5a5" }}>OUT</span>;
  if (isLow)  return <span style={{ ...pill, background: "rgba(245,158,11,.12)", border: "1px solid rgba(245,158,11,.4)", color: "#fde68a" }}>LOW</span>;
  if (isSoon) return <span style={{ ...pill, background: "rgba(239,68,68,.1)",   border: "1px solid rgba(239,68,68,.3)",  color: "#fca5a5" }}>EXP</span>;
  return <span style={{ ...pill, background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.3)", color: "#4ade80" }}>OK</span>;
}
const pill = { display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 5, fontSize: 10, fontWeight: 900, letterSpacing: ".6px" };

/* ════════════════════════════════════════════════════════════════════════════ */
export default function PharmacyInventory() {
  const nav = useNavigate();
  const pharmacyId = localStorage.getItem("pharmacy_id") || "";
  const fullName   = localStorage.getItem("full_name") || localStorage.getItem("username") || "";
  const todayISO = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgoISO = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);

  const [rows,         setRows]         = useState([]);
  const [selected,     setSelected]     = useState(null);
  const [q,            setQ]            = useState("");
  const [lowOnly,      setLowOnly]      = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [banner,       setBanner]       = useState({ type: "", text: "" });
  const [importResult, setImportResult] = useState(null);
  const [edit,         setEdit]         = useState({ quantity_in_stock: "", reorder_level: "", expiry_date: "" });

  const [dispFrom, setDispFrom] = useState(thirtyDaysAgoISO);
  const [dispTo, setDispTo] = useState(todayISO);
  const [downloadingDisp, setDownloadingDisp] = useState(false);

  const handleAuthFail = () => { logout(); nav("/login"); };
  const showBanner     = (type, text) => setBanner({ type, text });

  const load = async (keepSelected = true) => {
    setBanner({ type: "", text: "" });
    setLoading(true);
    try {
      const data = await listInventory();
      const list = Array.isArray(data) ? data : [];
      setRows(list);
      if (keepSelected && selected?.inventory_id) {
        const still = list.find(x => x.inventory_id === selected.inventory_id);
        setSelected(still || null);
        if (still) setEdit({ quantity_in_stock: String(still.quantity_in_stock ?? 0), reorder_level: String(still.reorder_level ?? 0), expiry_date: still.expiry_date ? String(still.expiry_date) : "" });
      } else { setSelected(null); }
    } catch (e) {
      const c = e?.response?.status;
      if (c === 401 || c === 403) return handleAuthFail();
      showBanner("error", "Failed to load inventory.");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(false); }, []);

  const filtered = useMemo(() => {
    let d = [...rows];
    if (q.trim()) {
      const t = q.toLowerCase();
      d = d.filter(r =>
        (r.drug_generic_name || "").toLowerCase().includes(t) ||
        (r.drug_brand_name   || "").toLowerCase().includes(t) ||
        (r.drug_category     || "").toLowerCase().includes(t)
      );
    }
    if (lowOnly) d = d.filter(r => (r.quantity_in_stock ?? 0) <= (r.reorder_level ?? 0));
    return d;
  }, [rows, q, lowOnly]);

  const stats = useMemo(() => ({
    total:    rows.length,
    low:      rows.filter(r => (r.quantity_in_stock ?? 0) <= (r.reorder_level ?? 0) && (r.quantity_in_stock ?? 0) > 0).length,
    out:      rows.filter(r => (r.quantity_in_stock ?? 0) === 0).length,
    expiring: rows.filter(r => r.expiry_date && new Date(r.expiry_date) <= new Date(Date.now() + 30 * 864e5)).length,
    ok:       rows.filter(r => (r.quantity_in_stock ?? 0) > (r.reorder_level ?? 0)).length,
  }), [rows]);

  const selectRow = r => {
    setSelected(r); setImportResult(null); setBanner({ type: "", text: "" });
    setEdit({ quantity_in_stock: String(r.quantity_in_stock ?? 0), reorder_level: String(r.reorder_level ?? 0), expiry_date: r.expiry_date ? String(r.expiry_date) : "" });
  };

  const save = async () => {
    if (!selected?.inventory_id) return;
    setBanner({ type: "", text: "" }); setSaving(true);
    const qty    = Number(edit.quantity_in_stock);
    const reorder= Number(edit.reorder_level);
    if (Number.isNaN(qty)     || qty < 0)    { setSaving(false); return showBanner("warn", "Quantity must be a valid non-negative number."); }
    if (Number.isNaN(reorder) || reorder < 0){ setSaving(false); return showBanner("warn", "Reorder Level must be a valid non-negative number."); }
    try {
      const updated = await updateInventory(selected.inventory_id, { quantity_in_stock: qty, reorder_level: reorder, expiry_date: edit.expiry_date || null });
      showBanner("success", "Inventory updated successfully.");
      setSelected(updated);
      await load(true);
    } catch (e) {
      const c = e?.response?.status;
      if (c === 401 || c === 403) return handleAuthFail();
      showBanner("error", e?.response?.data?.detail || (e?.response?.data ? JSON.stringify(e.response.data) : "Update failed."));
    } finally { setSaving(false); }
  };

  const downloadExcel = async () => {
    setBanner({ type: "", text: "" });
    try {
      const blob = await exportInventoryExcel();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = "pharmacy_inventory_export.xlsx";
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      showBanner("success", "Excel exported successfully.");
    } catch (e) {
      const c = e?.response?.status;
      if (c === 401 || c === 403) return handleAuthFail();
      showBanner("error", "Export failed.");
    }
  };

  const uploadExcel = async file => {
    if (!file) return;
    setBanner({ type: "", text: "" }); setImportResult(null);
    try {
      const res = await importInventoryExcel(file);
      setImportResult(res);
      showBanner("success", "Import completed. Inventory updated.");
      await load(false);
    } catch (e) {
      const c = e?.response?.status;
      if (c === 401 || c === 403) return handleAuthFail();
      showBanner("error", e?.response?.data?.detail || (e?.response?.data ? JSON.stringify(e.response.data) : "Import failed."));
    }
  };

  const downloadDispensedExcel = async () => {
  setBanner({ type: "", text: "" });
  setDownloadingDisp(true);

  try {
    if (dispFrom && dispTo && dispFrom > dispTo) {
      setDownloadingDisp(false);
      return showBanner("warn", "From date cannot be after To date.");
    }

    const blob = await exportDispensedReportExcel(dispFrom, dispTo);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dispensed_report_${dispFrom || "all"}_to_${dispTo || "all"}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    showBanner("success", "Dispensed report downloaded successfully.");
  } catch (e) {
    const msg = e?.message || "Dispensed report download failed.";
    showBanner("error", msg);
  } finally {
    setDownloadingDisp(false);
  }
};

  /* ── render ── */
  return (
    <>
      <div className="pi-root">

        {/* ══ PAGE HEADER ══ */}
        <header className="pi-header">
          <div className="pi-header-left">
            <div className="pi-breadcrumb">
              <span>Pharmacy</span>
              <span className="pi-bc-chevron">›</span>
              <span className="pi-bc-active">Inventory</span>
            </div>
            <h1 className="pi-title">
              <span className="pi-title-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              </span>
              Pharmacy Inventory
            </h1>
            <div className="pi-identity">
              <Avatar name={fullName} size={26} />
              <span className="pi-id-name">{fullName || "—"}</span>
              <span className="pi-id-sep">·</span>
              <code className="pi-id-code">{pharmacyId ? pharmacyId.slice(0, 14) + "…" : "—"}</code>
            </div>
          </div>

          <div className="pi-header-right">
            {/* Stat chips */}
            <div className="pi-stat-row">
              {[
                { label: "Total",    val: stats.total,    color: "rgba(221,228,240,0.9)" },
                { label: "In Stock", val: stats.ok,       color: "#4ade80" },
                { label: "Low",      val: stats.low,      color: "#fde68a" },
                { label: "Out",      val: stats.out,      color: "#fca5a5" },
                { label: "Expiring", val: stats.expiring, color: "#fb923c" },
              ].map(s => (
                <div className="pi-stat" key={s.label}>
                  <span className="pi-stat-val" style={{ color: s.color }}>{loading ? "—" : s.val}</span>
                  <span className="pi-stat-lbl">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="pi-actions">

              <button className="pi-btn pi-btn-ghost" onClick={() => load(true)} disabled={loading}>
                {loading
                  ? <><span className="pi-spin" />Loading</>
                  : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>Refresh</>}
              </button>
            
              {/* ✅ Inventory Export */}
              <button className="pi-btn pi-btn-green" onClick={downloadExcel}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Export
              </button>
            
              {/* ✅ Inventory Import */}
              <label className="pi-btn pi-btn-blue">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Import
                <input
                  type="file"
                  accept=".xlsx"
                  style={{ display: "none" }}
                  onChange={e => { uploadExcel(e.target.files?.[0]); e.target.value = ""; }}
                />
              </label>
            
              {/* ✅ Dispensed Report Date Picker */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 10px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(0,0,0,0.25)",
              }}>
                <span style={{ fontSize: 12, opacity: 0.7, fontWeight: 700 }}>Dispensed</span>
            
                <input
                  type="date"
                  value={dispFrom}
                  onChange={(e) => setDispFrom(e.target.value)}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    color: "#eee",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 10,
                    padding: "7px 10px",
                    fontSize: 12,
                    outline: "none",
                  }}
                />
                <span style={{ opacity: 0.5, fontSize: 12 }}>to</span>
            
                <input
                  type="date"
                  value={dispTo}
                  onChange={(e) => setDispTo(e.target.value)}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    color: "#eee",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 10,
                    padding: "7px 10px",
                    fontSize: 12,
                    outline: "none",
                  }}
                />
            
                <button
                  className="pi-btn pi-btn-ghost"
                  onClick={downloadDispensedExcel}
                  disabled={downloadingDisp}
                  style={{ marginLeft: 4 }}
                  title="Download dispensed items Excel"
                >
                  {downloadingDisp
                    ? <><span className="pi-spin" />Downloading</>
                    : <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Dispensed Excel
                    </>
                  }
                </button>
              </div>
            
            </div>
          </div>
        </header>

        {/* ══ NOTIFICATION BANNER ══ */}
        {banner.text && (
          <div className={`pi-banner pi-banner-${banner.type}`}>
            <span className="pi-banner-ico">
              {banner.type === "success" ? "✓" : banner.type === "warn" ? "!" : "✕"}
            </span>
            <span style={{ flex: 1 }}>{banner.text}</span>
            <button className="pi-banner-close" onClick={() => setBanner({ type: "", text: "" })}>✕</button>
          </div>
        )}

        {/* ══ IMPORT RESULT ══ */}
        {importResult && (
          <div className="pi-import-result">
            <div className="pi-import-head">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Import Summary
            </div>
            <div className="pi-import-stats">
              <div className="pi-import-stat"><span style={{ color: "#93c5fd" }}>{importResult.updated_inventory ?? 0}</span><small>Updated</small></div>
              <div className="pi-import-stat"><span style={{ color: "#4ade80" }}>{importResult.created_drugs ?? 0}</span><small>New Drugs</small></div>
              <div className="pi-import-stat"><span style={{ color: "#fde68a" }}>{importResult.skipped ?? 0}</span><small>Skipped</small></div>
            </div>
            {Array.isArray(importResult.errors) && importResult.errors.length > 0 && (
              <details className="pi-import-errors">
                <summary>Errors ({importResult.errors.length})</summary>
                {importResult.errors.map((er, i) => <div key={i} className="pi-import-err">{er}</div>)}
              </details>
            )}
          </div>
        )}

        {/* ══ TOOLBAR ══ */}
        <div className="pi-toolbar">
          <div className="pi-search-box">
            <svg className="pi-search-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              className="pi-search"
              value={q} onChange={e => setQ(e.target.value)}
              placeholder="Search generic name, brand, category…"
            />
            {q && <button className="pi-search-x" onClick={() => setQ("")}>✕</button>}
          </div>

          <button
            className={`pi-filter-btn ${lowOnly ? "pi-filter-btn-on" : ""}`}
            onClick={() => setLowOnly(v => !v)}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
            Low stock only
            {stats.low + stats.out > 0 && <span className="pi-filter-cnt">{stats.low + stats.out}</span>}
          </button>

          <span className="pi-count-label">{loading ? "Loading…" : `${filtered.length} of ${rows.length} items`}</span>
        </div>

        {/* ══ BODY: LIST + EDITOR ══ */}
        <div className="pi-body">

          {/* ─── INVENTORY LIST ─── */}
          <div className="pi-list-panel">
            <div className="pi-panel-head">
              <span className="pi-panel-title">Stock Inventory</span>
              {stats.low + stats.out > 0 && (
                <span className="pi-alert-chip">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  {stats.low + stats.out} needs attention
                </span>
              )}
            </div>

            {/* Column headers */}
            <div className="pi-list-cols">
              <span style={{ flex: "2 1 180px" }}>Drug</span>
              <span style={{ flex: "1 1 100px" }}>Category</span>
              <span style={{ width: 60, textAlign: "right" }}>Stock</span>
              <span style={{ width: 60, textAlign: "right" }}>Reorder</span>
              <span style={{ width: 58, textAlign: "center" }}>Status</span>
            </div>

            {!loading && filtered.length === 0 ? (
              <div className="pi-empty">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                <p>{lowOnly ? "No low-stock items found" : "No inventory items found"}</p>
              </div>
            ) : (
              <div className="pi-list-scroll">
                {filtered.map((r, idx) => {
                  const active = selected?.inventory_id === r.inventory_id;
                  const isLow  = (r.quantity_in_stock ?? 0) <= (r.reorder_level ?? 0);
                  const qty    = r.quantity_in_stock ?? 0;
                  return (
                    <div
                      key={r.inventory_id}
                      className={`pi-row ${active ? "pi-row-active" : ""} ${isLow && !active ? "pi-row-warn" : ""}`}
                      onClick={() => selectRow(r)}
                      style={{ animationDelay: `${idx * 18}ms` }}
                    >
                      <div style={{ flex: "2 1 180px", minWidth: 0 }}>
                        <div className="pi-row-name">
                          {r.drug_generic_name || "—"}
                          {r.drug_brand_name && <span className="pi-row-brand"> · {r.drug_brand_name}</span>}
                        </div>
                        <code className="pi-row-code">{(r.drug || "").slice(0, 22)}</code>
                        <MiniBar qty={qty} reorder={r.reorder_level ?? 0} />
                      </div>
                      <div style={{ flex: "1 1 100px", minWidth: 0 }}>
                        {r.drug_category
                          ? <span className="pi-cat">{r.drug_category}</span>
                          : <span className="pi-dash">—</span>}
                      </div>
                      <div style={{ width: 60, textAlign: "right" }}>
                        <span className={`pi-qty ${isLow ? "pi-qty-low" : ""}`}>{qty}</span>
                      </div>
                      <div style={{ width: 60, textAlign: "right" }}>
                        <span className="pi-reorder">{r.reorder_level ?? 0}</span>
                      </div>
                      <div style={{ width: 58, display: "flex", justifyContent: "center" }}>
                        <StatusPill qty={qty} reorder={r.reorder_level ?? 0} expiry={r.expiry_date} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ─── EDITOR PANEL ─── */}
          <div className="pi-edit-panel">
            {!selected ? (
              <div className="pi-edit-placeholder">
                <div className="pi-placeholder-ico">
                  <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </div>
                <p className="pi-placeholder-ttl">Select an item</p>
                <p className="pi-placeholder-sub">Click any inventory row to update stock quantity, reorder level, and expiry date.</p>
              </div>
            ) : (
              <div className="pi-editor" key={selected.inventory_id}>

                {/* Editor header */}
                <div className="pi-edit-head">
                  <Avatar name={selected.drug_generic_name || "?"} size={46} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="pi-edit-drug-name">
                      {selected.drug_generic_name || "—"}
                      {selected.drug_brand_name && <span className="pi-edit-brand"> ({selected.drug_brand_name})</span>}
                    </div>
                    <code className="pi-edit-drug-id">{selected.drug}</code>
                    <div className="pi-edit-inv-id">
                      INV: <code>{selected.inventory_id?.slice(0, 20)}…</code>
                    </div>
                  </div>
                  <StatusPill qty={selected.quantity_in_stock ?? 0} reorder={selected.reorder_level ?? 0} expiry={selected.expiry_date} />
                </div>

                {/* Snapshot stats */}
                <div className="pi-snapshot">
                  {[
                    { label: "Current Stock", val: selected.quantity_in_stock ?? 0, color: (selected.quantity_in_stock ?? 0) <= (selected.reorder_level ?? 0) ? "#fde68a" : "#4ade80" },
                    { label: "Reorder At",    val: selected.reorder_level ?? 0,    color: "rgba(221,228,240,0.7)" },
                    { label: "Expiry",        val: selected.expiry_date ? new Date(selected.expiry_date).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—", color: selected.expiry_date && new Date(selected.expiry_date) <= new Date(Date.now() + 30 * 864e5) ? "#fca5a5" : "rgba(221,228,240,0.7)" },
                    { label: "Last Updated",  val: selected.last_updated ? new Date(selected.last_updated).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—", color: "rgba(221,228,240,0.5)" },
                  ].map(s => (
                    <div className="pi-snap-item" key={s.label}>
                      <span className="pi-snap-val" style={{ color: s.color }}>{s.val}</span>
                      <span className="pi-snap-lbl">{s.label}</span>
                    </div>
                  ))}
                </div>

                {/* Category row */}
                {selected.drug_category && (
                  <div className="pi-edit-meta-row">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                    Category:
                    <span className="pi-cat pi-cat-sm">{selected.drug_category}</span>
                  </div>
                )}

                <div className="pi-edit-divider" />

                {/* Form */}
                <div className="pi-form-title">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Edit Record
                </div>

                <div className="pi-form-grid">
                  <div className="pi-field">
                    <label className="pi-label">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                      Quantity in Stock
                    </label>
                    <div className="pi-input-wrap">
                      <input className="pi-input" type="number" min="0"
                        value={edit.quantity_in_stock}
                        onChange={e => setEdit(p => ({ ...p, quantity_in_stock: e.target.value }))} />
                      <span className="pi-input-sfx">units</span>
                    </div>
                    {edit.quantity_in_stock !== "" && Number(edit.quantity_in_stock) <= Number(edit.reorder_level) && (
                      <div className="pi-hint pi-hint-warn">⚠ Will be flagged LOW</div>
                    )}
                  </div>

                  <div className="pi-field">
                    <label className="pi-label">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
                      Reorder Level
                    </label>
                    <div className="pi-input-wrap">
                      <input className="pi-input" type="number" min="0"
                        value={edit.reorder_level}
                        onChange={e => setEdit(p => ({ ...p, reorder_level: e.target.value }))} />
                      <span className="pi-input-sfx">units</span>
                    </div>
                  </div>

                  <div className="pi-field pi-field-full">
                    <label className="pi-label">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      Expiry Date
                    </label>
                    <input className="pi-input pi-input-date" type="date"
                      value={edit.expiry_date || ""}
                      onChange={e => setEdit(p => ({ ...p, expiry_date: e.target.value }))} />
                    {edit.expiry_date && new Date(edit.expiry_date) <= new Date(Date.now() + 30 * 864e5) && (
                      <div className="pi-hint pi-hint-red">⚠ Expiring within 30 days</div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pi-form-actions">
                  <button className={`pi-save-btn ${saving ? "pi-saving" : ""}`} onClick={save} disabled={saving}>
                    {saving
                      ? <><span className="pi-spin" />Saving changes…</>
                      : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Save Changes</>}
                  </button>
                  <button className="pi-close-btn" onClick={() => { setSelected(null); setEdit({ quantity_in_stock: "", reorder_level: "", expiry_date: "" }); }} disabled={saving}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    Discard
                  </button>
                </div>

                <div className="pi-form-note">Stock is flagged LOW when Qty ≤ Reorder Level</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
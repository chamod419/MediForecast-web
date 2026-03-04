import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

import "./DoctorHistory.css";

// ── Inject fonts once ──────────────────────────────────────────────────────────
if (!document.getElementById("mf-hist-fonts")) {
  const l = document.createElement("link");
  l.id = "mf-hist-fonts";
  l.rel = "stylesheet";
  l.href =
    "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap";
  document.head.appendChild(l);
}

const STATUS_OPTS = ["ALL", "PENDING", "READY", "DISPENSED", "CANCELLED"];

const STATUS_STYLE = {
  DISPENSED:  { color: "#4ade80", bg: "rgba(34,197,94,0.1)",  border: "rgba(34,197,94,0.3)",  dot: "#22c55e" },
  PENDING:    { color: "#fde68a", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", dot: "#f59e0b" },
  READY:      { color: "#93c5fd", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.3)", dot: "#3b82f6" },
  CANCELLED:  { color: "#fca5a5", bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.3)",  dot: "#ef4444" },
};

function strColor(s = "") {
  const p = ["#3b82f6","#8b5cf6","#06b6d4","#f59e0b","#ec4899","#10b981","#f97316"];
  let h = 0; for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return p[Math.abs(h) % p.length];
}

export default function DoctorHistory() {
  const nav = useNavigate();
  const [rows, setRows]     = useState([]);
  const [status, setStatus] = useState("ALL");
  const [q, setQ]           = useState("");
  const [msg, setMsg]       = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setMsg(""); setLoading(true);
    try {
      const res = await api.get("/prescriptions/my/?format=json");
      setRows(res.data || []);
    } catch {
      setMsg("Failed to load prescription history.");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let d = [...rows];
    if (status !== "ALL") d = d.filter(r => r.status === status);
    if (q.trim()) {
      const t = q.toLowerCase();
      d = d.filter(r =>
        (r.patient_name    || "").toLowerCase().includes(t) ||
        (r.pharmacy_name   || "").toLowerCase().includes(t) ||
        (r.prescription_id || "").toLowerCase().includes(t)
      );
    }
    return d;
  }, [rows, status, q]);

  // Stats
  const stats = useMemo(() => ({
    total:     rows.length,
    dispensed: rows.filter(r => r.status === "DISPENSED").length,
    pending:   rows.filter(r => r.status === "PENDING").length,
    ready:     rows.filter(r => r.status === "READY").length,
  }), [rows]);

  return (
    <>
      <div className="hist-page">
        <div className="hist-ambient" />

        {/* ── PAGE HEADER ── */}
        <div className="hist-header">
          <div className="hist-header-left">
            <div className="hist-breadcrumb">
              <span>Dashboard</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              <span className="hist-bc-active">Prescription History</span>
            </div>
            <h1 className="hist-title">Prescription History</h1>
            <p className="hist-sub">Review and manage all your previously issued prescriptions.</p>
          </div>

          <div className="hist-header-actions">
            <button className="hist-btn-secondary" onClick={() => nav("/doctor")}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Prescription
            </button>
            <button className="hist-btn-primary" onClick={load} disabled={loading}>
              {loading ? (
                <><div className="hist-spin"/>Refreshing…</>
              ) : (
                <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>Refresh</>
              )}
            </button>
          </div>
        </div>

        {/* ── STATS ROW ── */}
        <div className="hist-stats">
          {[
            { label:"Total Prescriptions", value: stats.total,     icon:"📋", color:"#60a5fa" },
            { label:"Dispensed",           value: stats.dispensed, icon:"✅", color:"#4ade80" },
            { label:"Ready",               value: stats.ready,     icon:"🔵", color:"#93c5fd" },
            { label:"Pending",             value: stats.pending,   icon:"⏳", color:"#fde68a" },
          ].map(s => (
            <div key={s.label} className="hist-stat-card">
              <div className="hist-stat-icon">{s.icon}</div>
              <div>
                <div className="hist-stat-value" style={{color: s.color}}>{s.value}</div>
                <div className="hist-stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── ERROR ── */}
        {msg && (
          <div className="hist-banner">
            <div className="hist-banner-ico">✕</div>
            <span>{msg}</span>
            <button className="hist-banner-x" onClick={() => setMsg("")}>✕</button>
          </div>
        )}

        {/* ── TOOLBAR ── */}
        <div className="hist-toolbar">
          <div className="hist-search-wrap">
            <svg className="hist-search-ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              className="hist-search"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search by patient, pharmacy, or prescription ID…"
            />
            {q && <button className="hist-search-clear" onClick={() => setQ("")}>✕</button>}
          </div>

          <div className="hist-filter-tabs">
            {STATUS_OPTS.map(s => (
              <button
                key={s}
                className={`hist-tab ${status === s ? "hist-tab-on" : ""}`}
                onClick={() => setStatus(s)}
              >
                {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
                {s !== "ALL" && rows.filter(r => r.status === s).length > 0 && (
                  <span className="hist-tab-count">{rows.filter(r => r.status === s).length}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── TABLE ── */}
        <div className="hist-table-wrap">
          {/* Header */}
          <div className="hist-table-head">
            <div className="hist-th">Date & Time</div>
            <div className="hist-th">Patient</div>
            <div className="hist-th">Pharmacy</div>
            <div className="hist-th">Status</div>
            <div className="hist-th hist-th-right">Actions</div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="hist-loading">
              <div className="hist-spin hist-spin-lg"/>
              <span>Loading prescriptions…</span>
            </div>
          )}

          {/* Empty */}
          {!loading && filtered.length === 0 && (
            <div className="hist-empty">
              <div className="hist-empty-icon">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/></svg>
              </div>
              <p>No prescriptions found</p>
              <small>{q || status !== "ALL" ? "Try adjusting your search or filter" : "Create your first prescription to get started"}</small>
              {!q && status === "ALL" && (
                <button className="hist-btn-secondary" style={{marginTop:12}} onClick={() => nav("/doctor")}>
                  + Create Prescription
                </button>
              )}
            </div>
          )}

          {/* Rows */}
          {!loading && filtered.map((r, idx) => {
            const st = STATUS_STYLE[r.status] || STATUS_STYLE["PENDING"];
            const initials = (r.patient_name || "?").charAt(0).toUpperCase();
            return (
              <div key={r.prescription_id} className="hist-row" style={{"--i": idx}}>
                {/* Date */}
                <div className="hist-td">
                  <div className="hist-date-main">
                    {r.created_at ? new Date(r.created_at).toLocaleDateString("en-US", {month:"short",day:"numeric",year:"numeric"}) : "—"}
                  </div>
                  <div className="hist-date-sub">
                    {r.created_at ? new Date(r.created_at).toLocaleTimeString("en-US", {hour:"2-digit",minute:"2-digit"}) : ""}
                  </div>
                </div>

                {/* Patient */}
                <div className="hist-td hist-patient-cell">
                  <div className="hist-avatar" style={{background: strColor(r.patient_name||"")}}>
                    {initials}
                  </div>
                  <div>
                    <div className="hist-patient-name">{r.patient_name || "—"}</div>
                    <div className="hist-rx-id">
                      <code>{r.prescription_id ? r.prescription_id.slice(0,16)+"…" : "—"}</code>
                    </div>
                  </div>
                </div>

                {/* Pharmacy */}
                <div className="hist-td">
                  <div className="hist-pharmacy">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                    {r.pharmacy_name || "—"}
                  </div>
                </div>

                {/* Status */}
                <div className="hist-td">
                  <div className="hist-badge" style={{color: st.color, background: st.bg, borderColor: st.border}}>
                    <div className="hist-badge-dot" style={{background: st.dot}}/>
                    {r.status}
                  </div>
                </div>

                {/* Actions */}
                <div className="hist-td hist-td-right">
                  <button
                    className="hist-print-btn"
                    onClick={() => nav(`/prescriptions/${r.prescription_id}/print`)}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                    Print
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── FOOTER COUNT ── */}
        {!loading && filtered.length > 0 && (
          <div className="hist-footer">
            Showing <strong>{filtered.length}</strong> of <strong>{rows.length}</strong> prescriptions
          </div>
        )}
      </div>
    </>
  );
}

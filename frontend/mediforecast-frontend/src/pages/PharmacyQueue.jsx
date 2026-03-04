import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PharmacyQueue.css"; 

import {
  fetchPharmacyQueue,
  dispensePrescription,
  updatePrescriptionStatus,
} from "../api/pharmacyApi";

import { logout } from "../api/authApi";

// ── Inject fonts once ──────────────────────────────────────────────────────────
if (!document.getElementById("mf-pq-fonts")) {
  const l = document.createElement("link");
  l.id = "mf-pq-fonts";
  l.rel = "stylesheet";
  l.href =
    "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap";
  document.head.appendChild(l);
}

const STATUS_CFG = {
  DISPENSED: { color: "#4ade80", bg: "rgba(34,197,94,0.12)",  border: "rgba(34,197,94,0.3)",  dot: "#22c55e" },
  PENDING:   { color: "#fde68a", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)", dot: "#f59e0b" },
  READY:     { color: "#93c5fd", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.3)", dot: "#3b82f6" },
  CANCELLED: { color: "#fca5a5", bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.3)",  dot: "#ef4444" },
};

function strColor(s = "") {
  const p = ["#3b82f6","#8b5cf6","#06b6d4","#f59e0b","#ec4899","#10b981","#f97316"];
  let h = 0; for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return p[Math.abs(h) % p.length];
}

export default function PharmacyQueue() {
  const nav = useNavigate();

  const pharmacyId = localStorage.getItem("pharmacy_id") || "";
  const fullName   = localStorage.getItem("full_name") || localStorage.getItem("username") || "";

  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [q, setQ]                       = useState("");
  const [autoRefresh, setAutoRefresh]   = useState(true);
  const [rows, setRows]                 = useState([]);
  const [selected, setSelected]         = useState(null);
  const [loading, setLoading]           = useState(false);
  const [busyAction, setBusyAction]     = useState(false);
  const [banner, setBanner]             = useState({ type: "", text: "" });
  const [confirmOpen, setConfirmOpen]   = useState(false);
  const [confirmType, setConfirmType]   = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [lastSync, setLastSync]         = useState(null);
  const [countdown, setCountdown]       = useState(15);

  const showError   = (text) => setBanner({ type: "error",   text });
  const showSuccess = (text) => setBanner({ type: "success", text });
  const showWarn    = (text) => setBanner({ type: "warn",    text });

  const handleAuthFail = () => { logout(); nav("/login"); };

  // ── fetch ──
  const load = async (opts = { keepSelected: true }) => {
    setBanner({ type: "", text: "" });
    setLoading(true);
    try {
      const data = await fetchPharmacyQueue(statusFilter);
      const list = Array.isArray(data) ? data : [];
      setRows(list);
      setLastSync(new Date());
      setCountdown(15);
      if (!opts.keepSelected) {
        setSelected(null);
      } else if (selected?.prescription_id) {
        const still = list.find(x => x.prescription_id === selected.prescription_id);
        setSelected(still || null);
      }
    } catch (e) {
      const code = e?.response?.status;
      if (code === 401 || code === 403) return handleAuthFail();
      showError("Failed to load pharmacy queue.");
    } finally { setLoading(false); }
  };

  useEffect(() => { load({ keepSelected: false }); }, [statusFilter]);

  // auto-refresh + countdown
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => load({ keepSelected: true }), 15000);
    const tick     = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 15), 1000);
    return () => { clearInterval(interval); clearInterval(tick); };
  }, [autoRefresh, statusFilter, selected]);

  const filtered = useMemo(() => {
    let d = [...rows];
    if (q.trim()) {
      const t = q.toLowerCase();
      d = d.filter(r =>
        (r.prescription_id || "").toLowerCase().includes(t) ||
        (r.patient_name    || "").toLowerCase().includes(t) ||
        (r.doctor_full_name || r.doctor_name || r.doctor_username || "").toLowerCase().includes(t)
      );
    }
    return d;
  }, [rows, q]);

  const canReady   = useMemo(() => selected?.status === "PENDING", [selected]);
  const canCancel  = useMemo(() => selected && selected.status !== "DISPENSED" && selected.status !== "CANCELLED", [selected]);
  const canDispense= useMemo(() => selected?.status === "PENDING" || selected?.status === "READY", [selected]);

  const openReadyConfirm   = () => { if (!canReady)   return showWarn(`Only PENDING → READY. Current: ${selected?.status}`); setConfirmType("READY");     setConfirmOpen(true); };
  const openCancelConfirm  = () => { if (!canCancel)  return showWarn(`Cannot cancel. Current: ${selected?.status}`);         setCancelReason(""); setConfirmType("CANCELLED"); setConfirmOpen(true); };
  const openDispenseConfirm= () => { if (!canDispense)return showWarn(`Cannot dispense. Current: ${selected?.status}`);       setConfirmType("DISPENSE");  setConfirmOpen(true); };

  const doConfirmAction = async () => {
    if (!selected?.prescription_id) return;
    setBusyAction(true);
    setBanner({ type: "", text: "" });
    try {
      let res;
      if (confirmType === "READY")     res = await updatePrescriptionStatus(selected.prescription_id, "READY");
      if (confirmType === "CANCELLED") res = await updatePrescriptionStatus(selected.prescription_id, "CANCELLED", cancelReason);
      if (confirmType === "DISPENSE")  res = await dispensePrescription(selected.prescription_id);

      if (confirmType === "READY")     showSuccess("Marked as READY for collection.");
      if (confirmType === "CANCELLED") showSuccess("Prescription cancelled.");
      if (confirmType === "DISPENSE")  showSuccess("Dispensed! Inventory updated & status set to DISPENSED.");

      setConfirmOpen(false); setConfirmType(""); setSelected(res || null);
      await load({ keepSelected: false });
    } catch (e) {
      const code = e?.response?.status;
      if (code === 401 || code === 403) return handleAuthFail();
      showError(e?.response?.data?.detail || (e?.response?.data ? JSON.stringify(e.response.data) : "Action failed."));
    } finally { setBusyAction(false); }
  };

  const modalMeta = {
    READY:     { title: "Confirm Mark READY",   text: "Mark this prescription as ready for patient collection?",              icon: "🔵", color: "#3b82f6" },
    CANCELLED: { title: "Confirm Cancellation", text: "Cancel this prescription? This action cannot be undone.",              icon: "🔴", color: "#ef4444" },
    DISPENSE:  { title: "Confirm Dispense",     text: "Dispense this prescription and deduct inventory automatically?",       icon: "🟢", color: "#22c55e" },
  };
  const mm = modalMeta[confirmType] || {};

  return (
    <>
      <div className="pq-page">
        <div className="pq-ambient" />

        {/* ── PAGE HEADER ── */}
        <div className="pq-header">
          <div className="pq-header-left">
            <div className="pq-breadcrumb">
              <span>Dashboard</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              <span className="pq-bc-active">Pharmacy Queue</span>
            </div>
            <h1 className="pq-title">Pharmacy Queue</h1>
            <div className="pq-subtitle">
              <div className="pq-user-chip">
                <div className="pq-user-dot" style={{background: strColor(fullName)}}/>
                {fullName || "—"}
              </div>
              <span className="pq-sep">·</span>
              <code className="pq-pid">{pharmacyId ? pharmacyId.slice(0,12)+"…" : "—"}</code>
            </div>
          </div>

          <div className="pq-header-right">
            {/* Stats chips */}
            <div className="pq-stats">
              {["PENDING","READY","DISPENSED","CANCELLED"].map(s => {
                const c = STATUS_CFG[s];
                const cnt = rows.filter(r => r.status === s).length;
                return (
                  <button
                    key={s}
                    className={`pq-stat-chip ${statusFilter === s ? "pq-stat-chip-on" : ""}`}
                    style={statusFilter === s ? {borderColor: c.border, background: c.bg, color: c.color} : {}}
                    onClick={() => setStatusFilter(s)}
                  >
                    <div className="pq-stat-dot" style={{background: c.dot}}/>
                    <span>{s.charAt(0) + s.slice(1).toLowerCase()}</span>
                    <span className="pq-stat-cnt">{cnt}</span>
                  </button>
                );
              })}
            </div>

            <div className="pq-header-actions">
              <button
                className={`pq-auto-toggle ${autoRefresh ? "pq-auto-on" : ""}`}
                onClick={() => setAutoRefresh(v => !v)}
              >
                <div className={`pq-auto-dot ${autoRefresh ? "pq-auto-dot-pulse" : ""}`}/>
                {autoRefresh ? `Auto · ${countdown}s` : "Auto Off"}
              </button>

              <button className="pq-btn-refresh" onClick={() => load({ keepSelected: true })} disabled={loading}>
                {loading
                  ? <><div className="pq-spin"/>Loading…</>
                  : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>Refresh</>
                }
              </button>
            </div>
          </div>
        </div>

        {/* ── BANNER ── */}
        {banner.text && (
          <div className={`pq-banner pq-banner-${banner.type}`}>
            <div className="pq-banner-ico">
              {banner.type === "success" ? "✓" : banner.type === "warn" ? "⚠" : "✕"}
            </div>
            <span>{banner.text}</span>
            <button className="pq-banner-x" onClick={() => setBanner({type:"",text:""})}>✕</button>
          </div>
        )}

        {/* ── SEARCH BAR ── */}
        <div className="pq-search-bar">
          <div className="pq-search-wrap">
            <svg className="pq-search-ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              className="pq-search"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search by patient, prescription ID, or doctor…"
            />
            {q && <button className="pq-search-clear" onClick={() => setQ("")}>✕</button>}
          </div>
          <div className="pq-search-meta">
            {lastSync && (
              <span className="pq-sync-time">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {lastSync.toLocaleTimeString()}
              </span>
            )}
            <span className="pq-result-count">
              {loading ? "Loading…" : `${filtered.length} record${filtered.length !== 1 ? "s" : ""}`}
            </span>
          </div>
        </div>

        {/* ── MAIN LAYOUT ── */}
        <div className="pq-layout">

          {/* ═══ LEFT: QUEUE LIST ═══ */}
          <div className="pq-panel pq-panel-list">
            <div className="pq-panel-head">
              <div className="pq-panel-title">Queue List</div>
              <div className="pq-panel-badge" style={{background: STATUS_CFG[statusFilter]?.bg, borderColor: STATUS_CFG[statusFilter]?.border, color: STATUS_CFG[statusFilter]?.color}}>
                <div className="pq-panel-dot" style={{background: STATUS_CFG[statusFilter]?.dot}}/>
                {statusFilter}
              </div>
            </div>

            {!loading && filtered.length === 0 ? (
              <div className="pq-empty">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/></svg>
                <p>No prescriptions</p>
                <small>No {statusFilter.toLowerCase()} prescriptions found</small>
              </div>
            ) : (
              <div className="pq-list">
                {filtered.map((r, idx) => {
                  const sc  = STATUS_CFG[r.status] || STATUS_CFG["PENDING"];
                  const active = selected?.prescription_id === r.prescription_id;
                  const doctorName = r.doctor_full_name || r.doctor_name || r.doctor_username || "—";
                  return (
                    <div
                      key={r.prescription_id}
                      className={`pq-list-item ${active ? "pq-list-item-active" : ""}`}
                      style={active ? {borderColor: "rgba(59,130,246,0.4)", background: "rgba(59,130,246,0.06)"} : {}}
                      onClick={() => setSelected(r)}
                    >
                      <div className="pq-item-avatar" style={{background: strColor(r.patient_name||"")}}>
                        {(r.patient_name||"?").charAt(0).toUpperCase()}
                      </div>
                      <div className="pq-item-body">
                        <div className="pq-item-top">
                          <span className="pq-item-patient">{r.patient_name || "—"}</span>
                          <div className="pq-item-badge" style={{color: sc.color, background: sc.bg, borderColor: sc.border}}>
                            <div style={{width:5, height:5, borderRadius:"50%", background: sc.dot, flexShrink:0}}/>
                            {r.status}
                          </div>
                        </div>
                        <div className="pq-item-meta">
                          <span>Dr. {doctorName}</span>
                          <span className="pq-item-dot">·</span>
                          <span>{(r.items||[]).length} drug{(r.items||[]).length !== 1 ? "s" : ""}</span>
                          <span className="pq-item-dot">·</span>
                          <span>{r.created_at ? new Date(r.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric"}) : "—"}</span>
                        </div>
                        <code className="pq-item-id">{(r.prescription_id||"").slice(0,20)}…</code>
                      </div>
                      {active && <div className="pq-item-arrow">›</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ═══ RIGHT: DETAIL PANEL ═══ */}
          <div className="pq-panel pq-panel-detail">
            {!selected ? (
              <div className="pq-detail-empty">
                <div className="pq-detail-empty-icon">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/></svg>
                </div>
                <p>Select a prescription</p>
                <small>Click any item in the queue to view details and take action</small>
              </div>
            ) : (
              <>
                {/* Detail header */}
                <div className="pq-detail-head">
                  <div className="pq-detail-avatar" style={{background: strColor(selected.patient_name||"")}}>
                    {(selected.patient_name||"?").charAt(0).toUpperCase()}
                  </div>
                  <div className="pq-detail-info">
                    <div className="pq-detail-name">{selected.patient_name || "—"}</div>
                    <code className="pq-detail-id">{selected.prescription_id}</code>
                  </div>
                  <div className="pq-detail-status">
                    {(() => { const sc = STATUS_CFG[selected.status]||STATUS_CFG["PENDING"]; return (
                      <div className="pq-status-badge" style={{color:sc.color, background:sc.bg, borderColor:sc.border}}>
                        <div className="pq-status-dot" style={{background:sc.dot}}/>
                        {selected.status}
                      </div>
                    );})()}
                    <div className="pq-detail-date">
                      {selected.created_at ? new Date(selected.created_at).toLocaleString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}) : "—"}
                    </div>
                  </div>
                </div>

                {/* Doctor & Pharmacy info */}
                <div className="pq-info-row">
                  <div className="pq-info-box">
                    <div className="pq-info-label">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      Doctor
                    </div>
                    <div className="pq-info-val">{selected.doctor_full_name || selected.doctor_name || selected.doctor_username || "—"}</div>
                    {selected.doctor_reg_no && <code className="pq-info-sub">Reg: {selected.doctor_reg_no}</code>}
                  </div>
                  <div className="pq-info-box">
                    <div className="pq-info-label">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                      Pharmacy
                    </div>
                    <div className="pq-info-val">{selected.pharmacy_name || "—"}</div>
                    <code className="pq-info-sub">{pharmacyId ? pharmacyId.slice(0,14)+"…" : "—"}</code>
                  </div>
                </div>

                {/* Medicines */}
                <div className="pq-medicines">
                  <div className="pq-sect-head">
                    <div className="pq-sect-icon">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                    </div>
                    <span className="pq-sect-title">Medicines</span>
                    <span className="pq-sect-count">{(selected.items||[]).length}</span>
                  </div>

                  <div className="pq-drug-list">
                    {(selected.items||[]).length === 0 ? (
                      <div className="pq-drug-empty">No items found.</div>
                    ) : (
                      (selected.items||[]).map((it, idx) => (
                        <div key={it.item_id||idx} className="pq-drug-row">
                          <div className="pq-drug-num">{idx+1}</div>
                          <div className="pq-drug-info">
                            <div className="pq-drug-name">
                              {it.drug_name}{it.brand_name ? <span className="pq-drug-brand"> ({it.brand_name})</span> : ""}
                            </div>
                            <div className="pq-drug-meta">
                              {it.dosage && <span className="pq-dosage">{it.dosage}</span>}
                              {it.instructions && <span className="pq-instructions">{it.instructions}</span>}
                            </div>
                          </div>
                          <div className="pq-drug-qty">
                            <div className="pq-qty-badge">{it.quantity}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Notes */}
                {selected.diagnosis_notes && (
                  <div className="pq-notes">
                    <div className="pq-sect-head">
                      <div className="pq-sect-icon pq-sect-icon-amber">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      </div>
                      <span className="pq-sect-title">Clinical Notes</span>
                    </div>
                    <div className="pq-notes-box">{selected.diagnosis_notes}</div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pq-actions">
                  <button
                    className={`pq-action-btn pq-action-ready ${!canReady||busyAction?"pq-action-disabled":""}`}
                    disabled={!canReady || busyAction}
                    onClick={openReadyConfirm}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Mark Ready
                  </button>

                  <button
                    className={`pq-action-btn pq-action-dispense ${!canDispense||busyAction?"pq-action-disabled":""}`}
                    disabled={!canDispense || busyAction}
                    onClick={openDispenseConfirm}
                  >
                    {busyAction && confirmType === "DISPENSE"
                      ? <><div className="pq-spin"/>Processing…</>
                      : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>Dispense</>
                    }
                  </button>

                  <button
                    className={`pq-action-btn pq-action-cancel ${!canCancel||busyAction?"pq-action-disabled":""}`}
                    disabled={!canCancel || busyAction}
                    onClick={openCancelConfirm}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    Cancel
                  </button>

                  <button className="pq-action-btn pq-action-close" onClick={() => setSelected(null)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                    Close
                  </button>
                </div>

                <div className="pq-action-hint">
                  <span className="pq-hint-item">🔵 READY = prepared for patient</span>
                  <span className="pq-hint-item">🟢 DISPENSE = deducts inventory</span>
                  <span className="pq-hint-item">🔴 CANCEL = stops fulfillment</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ═══ CONFIRM MODAL ═══ */}
      {confirmOpen && selected && (
        <div className="pq-overlay" onClick={() => !busyAction && setConfirmOpen(false)}>
          <div className="pq-modal" onClick={e => e.stopPropagation()}>
            <div className="pq-modal-head">
              <div className="pq-modal-icon" style={{background: `${mm.color}20`, borderColor: `${mm.color}40`, color: mm.color}}>
                {confirmType === "READY"    && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
                {confirmType === "DISPENSE" && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>}
                {confirmType === "CANCELLED"&& <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
              </div>
              <div>
                <div className="pq-modal-title" style={{color: mm.color}}>{mm.title}</div>
                <div className="pq-modal-sub">{mm.text}</div>
              </div>
            </div>

            <div className="pq-modal-patient">
              <div className="pq-modal-avatar" style={{background: strColor(selected.patient_name||"")}}>
                {(selected.patient_name||"?").charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="pq-modal-pname">{selected.patient_name}</div>
                <code className="pq-modal-pid">{selected.prescription_id?.slice(0,24)}…</code>
              </div>
            </div>

            {confirmType === "CANCELLED" && (
              <div className="pq-modal-reason">
                <label className="pq-modal-reason-label">Cancellation reason <span>(optional)</span></label>
                <textarea
                  className="pq-modal-textarea"
                  rows={3}
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  placeholder="e.g. Out of stock · Patient not reachable · Doctor request"
                />
              </div>
            )}

            <div className="pq-modal-actions">
              <button className="pq-modal-back" onClick={() => !busyAction && setConfirmOpen(false)} disabled={busyAction}>
                Back
              </button>
              <button
                className="pq-modal-confirm"
                style={{background: mm.color, boxShadow: `0 4px 16px ${mm.color}40`}}
                onClick={doConfirmAction}
                disabled={busyAction}
              >
                {busyAction ? <><div className="pq-spin"/>Processing…</> : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

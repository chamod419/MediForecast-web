import { useEffect, useState } from "react";
import { getAdminPrescription, listAdminPharmacies, listAdminPrescriptions } from "../../api/adminApi";
import "./AdminPages.css";

function fmtDate(v) {
  if (!v) return "—";
  return new Date(v).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

function statusChip(status) {
  const map = {
    DISPENSED: "ap-chip ap-chip-green",
    READY:     "ap-chip ap-chip-blue",
    CANCELLED: "ap-chip ap-chip-red",
    PENDING:   "ap-chip ap-chip-amber",
  };
  return map[status] || "ap-chip ap-chip-amber";
}

const STATUS_ICONS = { DISPENSED: "✓", READY: "◉", PENDING: "◷", CANCELLED: "✕" };

export default function AdminPrescriptions() {
  const [rows,       setRows]       = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [q,          setQ]          = useState("");
  const [status,     setStatus]     = useState("");
  const [pharmacyId, setPharmacyId] = useState("");
  const [msg,        setMsg]        = useState("");
  const [loading,    setLoading]    = useState(false);

  useEffect(() => { loadPharmacies(); }, []);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [q, status, pharmacyId]);

  const loadPharmacies = async () => {
    try { const d = await listAdminPharmacies(); setPharmacies(Array.isArray(d) ? d : []); } catch {}
  };

  const load = async () => {
    try {
      setLoading(true); setMsg("");
      const d = await listAdminPrescriptions({ q: q || undefined, status: status || undefined, pharmacy_id: pharmacyId || undefined });
      setRows(Array.isArray(d) ? d : []);
    } catch (e) { setMsg(e?.response?.data?.detail || "Failed to load prescriptions."); }
    finally { setLoading(false); }
  };

  const openDetail = async (row) => {
    try { const d = await getAdminPrescription(row.prescription_id); setSelected(d); }
    catch { setSelected(row); }
  };

  return (
    <div className="ap-page">

      {/* ── HEADER ── */}
      <div className="ap-head">
        <div>
          <div className="ap-kicker">📋 Administration</div>
          <h1 className="ap-title">Prescription Monitoring</h1>
          <div className="ap-sub">Review and track prescriptions across all doctors and pharmacies in one place.</div>
        </div>
        <div className="ap-head-actions">
          <button className="ap-btn ap-btn-secondary" onClick={load}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {msg && <div className="ap-banner ap-banner-error">{msg}</div>}

      <div className="ap-grid-2">

        {/* ── LEFT: LIST ── */}
        <div className="ap-card">
          <div className="ap-card-head">
            <div className="ap-card-title">Prescriptions</div>
            <span className="ap-card-count">{loading ? "…" : `${rows.length} records`}</span>
          </div>

          <div className="ap-toolbar">
            <div className="ap-search-wrap">
              <svg className="ap-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                className="ap-input"
                placeholder="Search patient, doctor, or pharmacy…"
                value={q}
                onChange={e => setQ(e.target.value)}
              />
            </div>
            <select className="ap-select" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="READY">Ready</option>
              <option value="DISPENSED">Dispensed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
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
                  <th>ID / Date</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={r.prescription_id}
                    className={`ap-row-click ${selected?.prescription_id === r.prescription_id ? "ap-row-active" : ""}`}
                    onClick={() => openDetail(r)}
                    style={{ animationDelay: `${i * 14}ms` }}
                  >
                    <td>
                      <span className="ap-code">{r.prescription_id?.slice(0, 8)}…</span>
                      <div className="ap-muted" style={{ marginTop: 3 }}>{fmtDate(r.created_at)}</div>
                    </td>
                    <td style={{ fontWeight: 700, fontSize: 13 }}>{r.patient_name || "—"}</td>
                    <td style={{ fontSize: 13, color: "rgba(228,236,250,0.65)" }}>
                      {r.doctor_full_name || r.doctor_username || "—"}
                    </td>
                    <td>
                      <span className={statusChip(r.status)}>
                        {STATUS_ICONS[r.status] || ""} {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan="4">
                      <div className="ap-empty-panel">
                        <div className="ap-empty-panel-icon">📋</div>
                        <p className="ap-empty-panel-title">No prescriptions found</p>
                        <p className="ap-empty-panel-sub">Adjust your search or status filter.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── RIGHT: DETAIL ── */}
        <div className="ap-card">
          <div className="ap-card-head">
            <div className="ap-card-title">Prescription Details</div>
            {selected && <span className={statusChip(selected.status)}>{STATUS_ICONS[selected.status]} {selected.status}</span>}
          </div>

          {!selected ? (
            <div className="ap-empty-panel">
              <div className="ap-empty-panel-icon">📋</div>
              <p className="ap-empty-panel-title">Select a prescription</p>
              <p className="ap-empty-panel-sub">Click any row to view its full details and medicine items.</p>
            </div>
          ) : (
            <div className="ap-form">
              <div className="ap-form-grid">

                <div className="ap-field ap-field-full">
                  <label className="ap-label">Prescription ID</label>
                  <span className="ap-code" style={{ padding: "10px 13px", display: "block", background: "rgba(0,0,0,0.15)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                    {selected.prescription_id}
                  </span>
                </div>

                <div className="ap-field">
                  <label className="ap-label">Patient</label>
                  <input className="ap-input" value={selected.patient_name || ""} readOnly />
                </div>

                <div className="ap-field">
                  <label className="ap-label">Doctor</label>
                  <input className="ap-input" value={selected.doctor_full_name || selected.doctor_username || ""} readOnly />
                </div>

                <div className="ap-field">
                  <label className="ap-label">Pharmacy</label>
                  <input className="ap-input" value={selected.pharmacy_name || ""} readOnly />
                </div>

                <div className="ap-field">
                  <label className="ap-label">Status</label>
                  <input className="ap-input" value={selected.status || ""} readOnly />
                </div>

                <div className="ap-field">
                  <label className="ap-label">Created At</label>
                  <input className="ap-input" value={fmtDate(selected.created_at)} readOnly />
                </div>

                <div className="ap-field">
                  <label className="ap-label">Dispensed At</label>
                  <input className="ap-input" value={fmtDate(selected.dispensed_at)} readOnly />
                </div>

                <div className="ap-field ap-field-full">
                  <label className="ap-label">Diagnosis Notes</label>
                  <textarea className="ap-textarea" value={selected.diagnosis_notes || ""} readOnly style={{ minHeight: 72 }} />
                </div>

                {/* Items sub-table */}
                <div className="ap-field ap-field-full">
                  <label className="ap-label">
                    Medicine Items
                    <span style={{ marginLeft: 8, color: "rgba(228,236,250,0.35)", fontWeight: 600 }}>
                      ({(selected.items || []).length})
                    </span>
                  </label>
                  <div style={{ border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
                    <table className="ap-table" style={{ minWidth: 0 }}>
                      <thead>
                        <tr>
                          <th>Drug</th>
                          <th>Dosage</th>
                          <th>Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selected.items || []).map((it) => (
                          <tr key={it.item_id}>
                            <td>
                              <div style={{ fontWeight: 700, fontSize: 13 }}>{it.drug_name || "—"}</div>
                              {it.brand_name && <div className="ap-muted">{it.brand_name}</div>}
                            </td>
                            <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>{it.dosage || "—"}</td>
                            <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700, color: "#6ee7b7" }}>{it.quantity ?? "—"}</td>
                          </tr>
                        ))}
                        {(selected.items || []).length === 0 && (
                          <tr><td colSpan="3" className="ap-empty">No items.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
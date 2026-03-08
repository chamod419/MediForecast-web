import { useEffect, useMemo, useState } from "react";
import {
  createAdminPatient,
  deleteAdminPatient,
  getAdminPatient,
  listAdminPatients,
  updateAdminPatient,
} from "../../api/adminApi";
import {
  ConfirmModal,
  exportRowsToCsv,
  HighlightText,
  Pagination,
  paginateRows,
} from "../../components/admin/AdminUiKit";
import "./AdminPages.css";

const emptyForm = {
  full_name: "", nic_number: "", phone: "",
  date_of_birth: "", gender: "Other",
};

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function getErr(e) {
  const d = e?.response?.data;
  if (!d) return e?.message || "Action failed.";
  if (typeof d.detail === "string") return d.detail;
  if (typeof d === "string") return d;
  return Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`).join(" | ");
}

const GENDER_COLORS = { M: "#3b82f6", F: "#ec4899", Other: "#6366f1" };
const GENDER_LABELS = { M: "Male", F: "Female", Other: "Other" };

export default function AdminPatients() {
  const [rows,            setRows]            = useState([]);
  const [selected,        setSelected]        = useState(null);
  const [form,            setForm]            = useState(emptyForm);
  const [q,               setQ]               = useState("");
  const [msg,             setMsg]             = useState({ type: "", text: "" });
  const [loading,         setLoading]         = useState(false);
  const [saving,          setSaving]          = useState(false);
  const [deleteBusy,      setDeleteBusy]      = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [page,            setPage]            = useState(1);
  const pageSize = 8;

  const load = async () => {
    try {
      setLoading(true); setMsg({ type: "", text: "" });
      const d = await listAdminPatients({ q: q || undefined });
      setRows(Array.isArray(d) ? d : []);
    } catch (e) { setMsg({ type: "error", text: getErr(e) }); }
    finally { setLoading(false); }
  };

  const openDetail = async (row) => {
    try {
      const detail = await getAdminPatient(row.patient_id);
      setSelected(detail);
      setForm({ full_name: detail.full_name || "", nic_number: detail.nic_number || "", phone: detail.phone || "", date_of_birth: detail.date_of_birth || "", gender: detail.gender || "Other" });
    } catch {
      setSelected(row);
      setForm({ full_name: row.full_name || "", nic_number: row.nic_number || "", phone: row.phone || "", date_of_birth: row.date_of_birth || "", gender: row.gender || "Other" });
    }
  };

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [q]);
  useEffect(() => { setPage(1); }, [q]);

  const reset = () => { setSelected(null); setForm(emptyForm); setShowDeleteModal(false); };

  const save = async () => {
    try {
      setSaving(true); setMsg({ type: "", text: "" });
      const payload = {
        full_name: form.full_name.trim(), nic_number: form.nic_number.trim(),
        phone: form.phone.trim(), date_of_birth: form.date_of_birth || null, gender: form.gender,
      };
      if (selected) {
        await updateAdminPatient(selected.patient_id, payload);
        setMsg({ type: "success", text: "Patient updated successfully." });
      } else {
        await createAdminPatient(payload);
        setMsg({ type: "success", text: "Patient created successfully." });
      }
      reset(); await load();
    } catch (e) { setMsg({ type: "error", text: getErr(e) }); }
    finally { setSaving(false); }
  };

  const remove = async () => {
    if (!selected) return;
    try {
      setDeleteBusy(true);
      await deleteAdminPatient(selected.patient_id);
      setMsg({ type: "success", text: "Patient deleted successfully." });
      reset(); await load();
    } catch (e) { setMsg({ type: "error", text: getErr(e) }); }
    finally { setDeleteBusy(false); setShowDeleteModal(false); }
  };

  const initials = n => n?.trim()?.split(/\s+/)?.map(x => x[0])?.join("")?.slice(0, 2)?.toUpperCase() || "P";
  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageRows   = useMemo(() => paginateRows(rows, page, pageSize), [rows, page]);

  return (
    <div className="ap-page">

      {/* ── HEADER ── */}
      <div className="ap-head">
        <div>
          <div className="ap-kicker">🧑‍⚕️ Administration</div>
          <h1 className="ap-title">Patient Directory</h1>
          <div className="ap-sub">
            Add, edit, delete, search, and export patient records with full lifecycle management.
          </div>
        </div>
        <div className="ap-head-actions">
          <button className="ap-btn ap-btn-secondary" onClick={load}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Refresh
          </button>
          <button
            className="ap-btn ap-btn-success"
            onClick={() => exportRowsToCsv("mediforecast_patients.csv",
              rows.map(r => ({ full_name: r.full_name, nic_number: r.nic_number, phone: r.phone, gender: r.gender, date_of_birth: r.date_of_birth, created_at: r.created_at }))
            )}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export CSV
          </button>
          <button className="ap-btn ap-btn-primary" onClick={reset}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Patient
          </button>
        </div>
      </div>

      {msg.text && <div className={`ap-banner ap-banner-${msg.type}`}>{msg.text}</div>}

      <div className="ap-grid-2">

        {/* ── LEFT: LIST ── */}
        <div className="ap-card">
          <div className="ap-card-head">
            <div className="ap-card-title">Patients</div>
            <span className="ap-card-count">{loading ? "…" : `${rows.length} records`}</span>
          </div>

          <div className="ap-toolbar">
            <div className="ap-search-wrap">
              <svg className="ap-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                className="ap-input"
                placeholder="Search by name, NIC, or phone…"
                value={q}
                onChange={e => setQ(e.target.value)}
              />
            </div>
          </div>

          <div className="ap-table-wrap">
            <table className="ap-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>NIC</th>
                  <th>Phone</th>
                  <th>Gender</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r, i) => (
                  <tr
                    key={r.patient_id}
                    className={`ap-row-click ${selected?.patient_id === r.patient_id ? "ap-row-active" : ""}`}
                    onClick={() => openDetail(r)}
                    style={{ animationDelay: `${i * 16}ms` }}
                  >
                    <td>
                      <div className="ap-userbox">
                        <div className="ap-avatar" style={{ background: `linear-gradient(135deg,${GENDER_COLORS[r.gender] || "#6366f1"},${GENDER_COLORS[r.gender] || "#8b5cf6"}99)` }}>
                          {initials(r.full_name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13.5 }}>
                            <HighlightText text={r.full_name} query={q} />
                          </div>
                          <div className="ap-muted">Added {fmtDate(r.created_at)}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>
                      <HighlightText text={r.nic_number} query={q} />
                    </td>
                    <td style={{ fontSize: 13 }}>
                      <HighlightText text={r.phone || "—"} query={q} />
                    </td>
                    <td>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        fontSize: 12, fontWeight: 700,
                        color: GENDER_COLORS[r.gender] || "rgba(228,236,250,0.55)",
                      }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor", display: "inline-block" }}/>
                        {GENDER_LABELS[r.gender] || r.gender || "—"}
                      </span>
                    </td>
                  </tr>
                ))}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan="4">
                      <div className="ap-empty-panel">
                        <div className="ap-empty-panel-icon">🧑‍⚕️</div>
                        <p className="ap-empty-panel-title">No patients found</p>
                        <p className="ap-empty-panel-sub">Try a different search or create a new patient record.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="ap-form" style={{ paddingTop: 12 }}>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>

        {/* ── RIGHT: FORM ── */}
        <div className="ap-card">
          <div className="ap-card-head">
            <div className="ap-card-title">{selected ? "Edit Patient" : "Create Patient"}</div>
            {selected && <span className="ap-code">{selected.patient_id}</span>}
          </div>

          <div className="ap-form">
            <div className="ap-form-grid">

              <div className="ap-field ap-field-full">
                <label className="ap-label">Full Name</label>
                <input className="ap-input" placeholder="Full legal name" value={form.full_name} onChange={e => f("full_name", e.target.value)} />
              </div>

              <div className="ap-field">
                <label className="ap-label">NIC Number</label>
                <input className="ap-input" placeholder="National ID" value={form.nic_number} onChange={e => f("nic_number", e.target.value)} />
              </div>

              <div className="ap-field">
                <label className="ap-label">Phone</label>
                <input className="ap-input" placeholder="+94 77 000 0000" value={form.phone} onChange={e => f("phone", e.target.value)} />
              </div>

              <div className="ap-field">
                <label className="ap-label">Date of Birth</label>
                <input type="date" className="ap-input" value={form.date_of_birth} onChange={e => f("date_of_birth", e.target.value)} />
              </div>

              <div className="ap-field">
                <label className="ap-label">Gender</label>
                <select className="ap-select" value={form.gender} onChange={e => f("gender", e.target.value)}>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {selected && (
                <div className="ap-field ap-field-full">
                  <label className="ap-label">Record Created</label>
                  <input className="ap-input" value={fmtDate(selected.created_at)} readOnly />
                </div>
              )}
            </div>

            <div className="ap-form-actions">
              <button className="ap-btn ap-btn-primary" onClick={save} disabled={saving}>
                {saving ? "Saving…" : selected ? "Update Patient" : "Create Patient"}
              </button>
              <button className="ap-btn ap-btn-secondary" onClick={reset}>Clear</button>
              {selected && (
                <button className="ap-btn ap-btn-danger" onClick={() => setShowDeleteModal(true)}>Delete</button>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={showDeleteModal}
        title="Delete Patient"
        message={`Are you sure you want to permanently delete "${selected?.full_name || "this patient"}"? This action cannot be undone.`}
        confirmLabel="Delete Patient"
        busy={deleteBusy}
        onConfirm={remove}
        onClose={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
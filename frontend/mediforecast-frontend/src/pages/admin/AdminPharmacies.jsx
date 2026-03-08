import { useEffect, useState } from "react";
import {
  createAdminPharmacy,
  deleteAdminPharmacy,
  listAdminPharmacies,
  updateAdminPharmacy,
} from "../../api/adminApi";
import "./AdminPages.css";

function getErr(e) {
  const d = e?.response?.data;
  if (!d) return e?.message || "Action failed.";
  if (typeof d.detail === "string") return d.detail;
  return Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`).join(" | ");
}

const emptyForm = { name: "", location: "", contact_number: "", hospital_branch: "" };

export default function AdminPharmacies() {
  const [rows,     setRows]     = useState([]);
  const [selected, setSelected] = useState(null);
  const [form,     setForm]     = useState(emptyForm);
  const [q,        setQ]        = useState("");
  const [msg,      setMsg]      = useState({ type: "", text: "" });
  const [loading,  setLoading]  = useState(false);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [q]);

  const load = async () => {
    try {
      setLoading(true);
      const d = await listAdminPharmacies({ q: q || undefined });
      setRows(Array.isArray(d) ? d : []);
    } catch (e) { setMsg({ type: "error", text: getErr(e) }); }
    finally { setLoading(false); }
  };

  const reset = () => { setSelected(null); setForm(emptyForm); };

  const edit = (row) => {
    setSelected(row);
    setForm({ name: row.name || "", location: row.location || "", contact_number: row.contact_number || "", hospital_branch: row.hospital_branch || "" });
  };

  const save = async () => {
    try {
      setSaving(true); setMsg({ type: "", text: "" });
      if (selected) {
        await updateAdminPharmacy(selected.pharmacy_id, form);
        setMsg({ type: "success", text: "Pharmacy updated successfully." });
      } else {
        await createAdminPharmacy(form);
        setMsg({ type: "success", text: "Pharmacy created successfully." });
      }
      reset(); await load();
    } catch (e) { setMsg({ type: "error", text: getErr(e) }); }
    finally { setSaving(false); }
  };

  const remove = async () => {
    if (!selected || !window.confirm(`Delete pharmacy "${selected.name}"?`)) return;
    try {
      await deleteAdminPharmacy(selected.pharmacy_id);
      setMsg({ type: "success", text: "Pharmacy deleted." });
      reset(); await load();
    } catch (e) { setMsg({ type: "error", text: getErr(e) }); }
  };

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="ap-page">

      {/* ── HEADER ── */}
      <div className="ap-head">
        <div>
          <div className="ap-kicker">🏥 Administration</div>
          <h1 className="ap-title">Pharmacy Management</h1>
          <div className="ap-sub">Maintain pharmacy locations, hospital branches, and contact details system-wide.</div>
        </div>
        <div className="ap-head-actions">
          <button className="ap-btn ap-btn-secondary" onClick={load}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Refresh
          </button>
          <button className="ap-btn ap-btn-primary" onClick={reset}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Pharmacy
          </button>
        </div>
      </div>

      {msg.text && <div className={`ap-banner ap-banner-${msg.type}`}>{msg.text}</div>}

      <div className="ap-grid-2">

        {/* ── LEFT: LIST ── */}
        <div className="ap-card">
          <div className="ap-card-head">
            <div className="ap-card-title">Pharmacy List</div>
            <span className="ap-card-count">{loading ? "…" : `${rows.length} records`}</span>
          </div>

          <div className="ap-toolbar">
            <div className="ap-search-wrap">
              <svg className="ap-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                className="ap-input"
                placeholder="Search name, location, or branch…"
                value={q}
                onChange={e => setQ(e.target.value)}
              />
            </div>
          </div>

          <div className="ap-table-wrap">
            <table className="ap-table">
              <thead>
                <tr>
                  <th>Pharmacy</th>
                  <th>Branch</th>
                  <th>Location</th>
                  <th>Contact</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={r.pharmacy_id}
                    className={`ap-row-click ${selected?.pharmacy_id === r.pharmacy_id ? "ap-row-active" : ""}`}
                    onClick={() => edit(r)}
                    style={{ animationDelay: `${i * 16}ms` }}
                  >
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                          background: "linear-gradient(135deg,rgba(59,130,246,0.2),rgba(16,185,129,0.15))",
                          border: "1px solid rgba(59,130,246,0.2)",
                          display: "grid", placeItems: "center", fontSize: 16,
                        }}>🏥</div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13.5 }}>{r.name}</div>
                          <span className="ap-code" style={{ fontSize: 10 }}>{r.pharmacy_id?.slice(0, 8)}…</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 13, color: "rgba(228,236,250,0.6)" }}>{r.hospital_branch || "—"}</td>
                    <td style={{ fontSize: 12.5, color: "rgba(228,236,250,0.55)" }}>{r.location || "—"}</td>
                    <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>{r.contact_number || "—"}</td>
                  </tr>
                ))}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan="4">
                      <div className="ap-empty-panel">
                        <div className="ap-empty-panel-icon">🏥</div>
                        <p className="ap-empty-panel-title">No pharmacies found</p>
                        <p className="ap-empty-panel-sub">Try a different search term or create a new pharmacy.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── RIGHT: FORM ── */}
        <div className="ap-card">
          <div className="ap-card-head">
            <div className="ap-card-title">{selected ? "Edit Pharmacy" : "Create Pharmacy"}</div>
            {selected && <span className="ap-code">{selected.pharmacy_id}</span>}
          </div>

          <div className="ap-form">
            <div className="ap-form-grid">

              <div className="ap-field ap-field-full">
                <label className="ap-label">Pharmacy Name</label>
                <input className="ap-input" placeholder="e.g. City General Pharmacy" value={form.name} onChange={e => f("name", e.target.value)} />
              </div>

              <div className="ap-field">
                <label className="ap-label">Hospital Branch</label>
                <input className="ap-input" placeholder="e.g. Main Ward" value={form.hospital_branch} onChange={e => f("hospital_branch", e.target.value)} />
              </div>

              <div className="ap-field">
                <label className="ap-label">Contact Number</label>
                <input className="ap-input" placeholder="+94 11 000 0000" value={form.contact_number} onChange={e => f("contact_number", e.target.value)} />
              </div>

              <div className="ap-field ap-field-full">
                <label className="ap-label">Location / Address</label>
                <input className="ap-input" placeholder="e.g. No. 10, Main Street, Colombo 01" value={form.location} onChange={e => f("location", e.target.value)} />
              </div>
            </div>

            <div className="ap-form-actions">
              <button className="ap-btn ap-btn-primary" onClick={save} disabled={saving}>
                {saving ? "Saving…" : selected ? "Update Pharmacy" : "Create Pharmacy"}
              </button>
              <button className="ap-btn ap-btn-secondary" onClick={reset}>Clear</button>
              {selected && (
                <button className="ap-btn ap-btn-danger" onClick={remove}>Delete</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useEffect, useMemo, useState } from "react";
import {
  createAdminDrug,
  deleteAdminDrug,
  listAdminDrugs,
  updateAdminDrug,
} from "../../api/adminApi";
import "./AdminPages.css";

const emptyForm = {
  generic_name: "",
  brand_name:   "",
  category:     "",
  unit:         "",
  requires_prescription: true,
  description:  "",
};

function getErr(e) {
  const d = e?.response?.data;
  if (!d) return e?.message || "Action failed.";
  if (typeof d.detail === "string") return d.detail;
  return Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`).join(" | ");
}



export default function AdminDrugs() {
  const [rows,           setRows]           = useState([]);
  const [allRows,        setAllRows]        = useState([]);  
  const [selected,       setSelected]       = useState(null);
  const [form,           setForm]           = useState(emptyForm);
  const [q,              setQ]              = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [msg,            setMsg]            = useState({ type: "", text: "" });
  const [loading,        setLoading]        = useState(false);
  const [saving,         setSaving]         = useState(false);

  // Unique sorted categories from ALL drugs 
  const categories = useMemo(() => {
    const set = new Set(allRows.map(r => r.category).filter(Boolean));
    return Array.from(set).sort();
  }, [allRows]);

  // Load all drugs once on mount 
  const loadAll = async () => {
    try {
      const data = await listAdminDrugs({});
      setAllRows(Array.isArray(data) ? data : []);
    } catch {}
  };

  const load = async () => {
    try {
      setLoading(true);
      const data = await listAdminDrugs({ q: q || undefined, category: categoryFilter || undefined });
      setRows(Array.isArray(data) ? data : []);
    } catch (e) { setMsg({ type: "error", text: getErr(e) }); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [q, categoryFilter]);

  const reset = () => { setSelected(null); setForm(emptyForm); };

  const edit = (row) => {
    setSelected(row);
    setForm({
      generic_name:          row.generic_name || "",
      brand_name:            row.brand_name   || "",
      category:              row.category     || "",
      unit:                  row.unit         || "",
      requires_prescription: row.requires_prescription ?? true,
      description:           row.description  || "",
    });
  };

  const save = async () => {
    try {
      setSaving(true); setMsg({ type: "", text: "" });
      if (selected) {
        await updateAdminDrug(selected.drug_id, form);
        setMsg({ type: "success", text: "Drug updated successfully." });
      } else {
        await createAdminDrug(form);
        setMsg({ type: "success", text: "Drug created successfully." });
      }
      reset(); await load(); await loadAll();
    } catch (e) { setMsg({ type: "error", text: getErr(e) }); }
    finally { setSaving(false); }
  };

  const remove = async () => {
    if (!selected) return;
    if (!window.confirm(`Delete drug "${selected.generic_name}"?`)) return;
    try {
      await deleteAdminDrug(selected.drug_id);
      setMsg({ type: "success", text: "Drug deleted." });
      reset(); await load(); await loadAll();
    } catch (e) { setMsg({ type: "error", text: getErr(e) }); }
  };

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="ap-page">

      {/* ── HEADER ── */}
      <div className="ap-head">
        <div>
          <div className="ap-kicker">💊 Administration</div>
          <h1 className="ap-title">Drug Management</h1>
          <div className="ap-sub">Manage medicine master data used by doctors and pharmacies across the system.</div>
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
            New Drug
          </button>
        </div>
      </div>

      {msg.text && <div className={`ap-banner ap-banner-${msg.type}`}>{msg.text}</div>}

      <div className="ap-grid-2">

        {/* ── LEFT: LIST ── */}
        <div className="ap-card">
          <div className="ap-card-head">
            <div className="ap-card-title">Drug Master List</div>
            <span className="ap-card-count">{loading ? "…" : `${rows.length} records`}</span>
          </div>

          <div className="ap-toolbar">
            <div className="ap-search-wrap">
              <svg className="ap-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                className="ap-input"
                placeholder="Search generic or brand name…"
                value={q}
                onChange={e => setQ(e.target.value)}
              />
            </div>
            <select
              className="ap-select"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              style={{ minWidth: 160 }}
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="ap-table-wrap">
            <table className="ap-table">
              <thead>
                <tr>
                  <th>Drug</th>
                  <th>Category</th>
                  <th>Unit</th>
                  <th>Rx</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={r.drug_id}
                    className={`ap-row-click ${selected?.drug_id === r.drug_id ? "ap-row-active" : ""}`}
                    onClick={() => edit(r)}
                    style={{ animationDelay: `${i * 18}ms` }}
                  >
                    <td>
                      <div style={{ fontWeight: 700, fontSize: 13.5 }}>{r.generic_name}</div>
                      <div className="ap-muted">{r.brand_name || "—"}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, color: "rgba(228,236,250,0.55)", fontWeight: 600 }}>
                        {r.category || "—"}
                      </span>
                    </td>
                    <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>{r.unit || "—"}</td>
                    <td>
                      <span className={r.requires_prescription ? "ap-chip ap-chip-blue" : "ap-chip ap-chip-green"}>
                        {r.requires_prescription ? "REQUIRED" : "OTC"}
                      </span>
                    </td>
                  </tr>
                ))}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan="4">
                      <div className="ap-empty-panel">
                        <div className="ap-empty-panel-icon">💊</div>
                        <p className="ap-empty-panel-title">No drugs found</p>
                        <p className="ap-empty-panel-sub">Try adjusting your search or create a new drug.</p>
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
            <div className="ap-card-title">{selected ? "Edit Drug" : "Create Drug"}</div>
            {selected && <span className="ap-code">{selected.drug_id}</span>}
          </div>

          <div className="ap-form">
            <div className="ap-form-grid">

              <div className="ap-field">
                <label className="ap-label">Generic Name</label>
                <input className="ap-input" placeholder="e.g. Paracetamol" value={form.generic_name} onChange={e => f("generic_name", e.target.value)} />
              </div>

              <div className="ap-field">
                <label className="ap-label">Brand Name</label>
                <input className="ap-input" placeholder="e.g. Panadol" value={form.brand_name} onChange={e => f("brand_name", e.target.value)} />
              </div>

              <div className="ap-field">
                <label className="ap-label">Category</label>
                <select
                  className="ap-select"
                  value={form.category}
                  onChange={e => f("category", e.target.value)}
                >
                  <option value="">— Select Category —</option>
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="ap-field">
                <label className="ap-label">Unit</label>
                <input className="ap-input" placeholder="e.g. mg, ml, tablet" value={form.unit} onChange={e => f("unit", e.target.value)} />
              </div>

              <div className="ap-field ap-field-full">
                <label className="ap-label">Prescription Requirement</label>
                <select
                  className="ap-select"
                  value={String(form.requires_prescription)}
                  onChange={e => f("requires_prescription", e.target.value === "true")}
                >
                  <option value="true">Requires Prescription</option>
                  <option value="false">Over-the-Counter (OTC)</option>
                </select>
              </div>

              <div className="ap-field ap-field-full">
                <label className="ap-label">Description</label>
                <textarea
                  className="ap-textarea"
                  placeholder="Brief description of the drug, its uses, and notes…"
                  value={form.description}
                  onChange={e => f("description", e.target.value)}
                />
              </div>
            </div>

            <div className="ap-form-actions">
              <button className="ap-btn ap-btn-primary" onClick={save} disabled={saving}>
                {saving ? "Saving…" : selected ? "Update Drug" : "Create Drug"}
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
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DoctorCreatePrescription.css";

import DrugItemRow from "../components/DrugItemRow";
import {
  fetchPharmacies,
  searchPatients,
  createPatient,
  searchDrugs,
  createPrescription,
  checkAvailability,
} from "../api/doctorApi";

// ── Inject fonts once ──────────────────────────────────────────────────────────
if (!document.getElementById("mf-rx-fonts")) {
  const l = document.createElement("link");
  l.id = "mf-rx-fonts";
  l.rel = "stylesheet";
  l.href =
    "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap";
  document.head.appendChild(l);
}

export default function DoctorCreatePrescription() {
  const nav = useNavigate();

  const [pharmacies, setPharmacies]             = useState([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState("");
  const [patientQuery, setPatientQuery]         = useState("");
  const [patientResults, setPatientResults]     = useState([]);
  const [selectedPatient, setSelectedPatient]   = useState("");
  const [showAddPatient, setShowAddPatient]     = useState(false);
  const [newPatient, setNewPatient] = useState({ full_name:"", nic_number:"", phone:"", date_of_birth:"", gender:"Other" });
  const [patientMsg, setPatientMsg]             = useState({ type:"", text:"" });
  const [drugQuery, setDrugQuery]               = useState("");
  const [drugResults, setDrugResults]           = useState([]);
  const [items, setItems]                       = useState([]);
  const [notes, setNotes]                       = useState("");
  const [banner, setBanner]                     = useState({ type:"", text:"" });
  const [lastPrescriptionId, setLastPrescriptionId] = useState("");
  const [loadingPharmacies, setLoadingPharmacies]   = useState(false);
  const [submitting, setSubmitting]             = useState(false);

  const step1Done = !!selectedPharmacy;
  const step2Done = !!selectedPatient;
  const step3Done = items.length > 0 && items.every(it => it.drug && it.quantity > 0 && (it.dosage||"").trim());

  useEffect(() => {
    (async () => {
      try { setLoadingPharmacies(true); const d = await fetchPharmacies(); setPharmacies(d||[]); }
      catch { setBanner({ type:"error", text:"Failed to load pharmacies." }); }
      finally { setLoadingPharmacies(false); }
    })();
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!patientQuery.trim()) { setPatientResults([]); return; }
      try { const d = await searchPatients(patientQuery); setPatientResults(d||[]); } catch {}
    }, 350);
    return () => clearTimeout(t);
  }, [patientQuery]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!drugQuery.trim()) { setDrugResults([]); return; }
      try { const d = await searchDrugs(drugQuery); setDrugResults(d||[]); } catch {}
    }, 350);
    return () => clearTimeout(t);
  }, [drugQuery]);

  const canSubmit = useMemo(() => step1Done && step2Done && step3Done, [step1Done, step2Done, step3Done]);

  const addItem = (drug) => {
    setBanner({ type:"", text:"" });
    setItems(prev => {
      if (prev.some(x => x.drug === drug.drug_id)) {
        setBanner({ type:"warn", text:"This drug is already in the prescription." }); return prev;
      }
      return [...prev, { drug: drug.drug_id, drugLabel:`${drug.generic_name}${drug.brand_name?" ("+drug.brand_name+")":""}`, dosage:"", quantity:1, instructions:"", availableQty:null }];
    });
  };

  const updateItem = (idx, it) => setItems(prev => prev.map((x,i) => i===idx?it:x));
  const removeItem = (idx)     => setItems(prev => prev.filter((_,i) => i!==idx));

  const checkStock = async (idx) => {
    if (!selectedPharmacy) { setBanner({ type:"error", text:"Select a pharmacy first." }); return; }
    try { const r = await checkAvailability(selectedPharmacy, items[idx].drug); updateItem(idx, {...items[idx], availableQty: r.available_quantity}); }
    catch { setBanner({ type:"error", text:"Stock check failed." }); }
  };

  const submit = async () => {
    setBanner({ type:"", text:"" }); setLastPrescriptionId("");
    try {
      setSubmitting(true);
      const res = await createPrescription({
        patient: selectedPatient, pharmacy: selectedPharmacy, diagnosis_notes: notes,
        items: items.map(({drug,dosage,quantity,instructions}) => ({drug,dosage,quantity,instructions})),
      });
      setBanner({ type:"success", text:"Prescription sent successfully!" });
      setLastPrescriptionId(res.prescription_id);
      setNotes(""); setDrugQuery(""); setDrugResults([]); setItems([]);
    } catch(e) {
      setBanner({ type:"error", text: e?.response?.data ? JSON.stringify(e.response.data) : "Failed to send." });
    } finally { setSubmitting(false); }
  };

  const handleCreatePatient = async () => {
    setPatientMsg({ type:"", text:"" });
    try {
      if (!newPatient.full_name.trim() || !newPatient.nic_number.trim()) {
        setPatientMsg({ type:"error", text:"Full name and NIC are required." }); return;
      }
      const created = await createPatient({ full_name:newPatient.full_name.trim(), nic_number:newPatient.nic_number.trim(), phone:newPatient.phone.trim(), date_of_birth:newPatient.date_of_birth||null, gender:newPatient.gender });
      setSelectedPatient(created.patient_id); setPatientQuery(created.full_name);
      setPatientResults([]); setShowAddPatient(false);
      setNewPatient({ full_name:"", nic_number:"", phone:"", date_of_birth:"", gender:"Other" });
      setPatientMsg({ type:"success", text:`Patient registered: ${created.full_name}` });
    } catch(e) {
      setPatientMsg({ type:"error", text: e?.response?.data ? JSON.stringify(e.response.data) : "Registration failed." });
    }
  };

  const resetAll = () => {
    setBanner({type:"",text:""}); setPatientMsg({type:"",text:""}); setPatientQuery(""); setPatientResults([]);
    setSelectedPatient(""); setShowAddPatient(false); setDrugQuery(""); setDrugResults([]);
    setItems([]); setNotes(""); setLastPrescriptionId("");
  };

  return (
    <>
      <div className="rx-page">
        <div className="rx-ambient" />

        {/* ── TOP BAR ── */}
        <div className="rx-topbar">
          <div className="rx-topbar-left">
            <div className="rx-breadcrumb">
              <span>Dashboard</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              <span className="rx-bc-active">New Prescription</span>
            </div>
            <h1 className="rx-title">Create Prescription</h1>
          </div>

          <div className="rx-topbar-right">
            {/* Step progress */}
            <div className="rx-steps">
              {[
                { n:1, label:"Pharmacy", done: step1Done },
                { n:2, label:"Patient",  done: step2Done },
                { n:3, label:"Drugs",    done: step3Done },
                { n:4, label:"Send",     done: !!lastPrescriptionId },
              ].map((s, i, arr) => (
                <div key={s.n} className="rx-step">
                  <div className={`rx-step-dot ${s.done?"rx-step-done":""}`}>
                    {s.done
                      ? <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>
                      : s.n
                    }
                  </div>
                  <span className={`rx-step-label ${s.done?"rx-step-done-label":""}`}>{s.label}</span>
                  {i < arr.length - 1 && <div className={`rx-step-line ${s.done?"rx-step-line-done":""}`} />}
                </div>
              ))}
            </div>

            <div className="rx-actions">
              <button className="rx-btn-ghost" onClick={() => nav("/doctor/history")}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                History
              </button>
              <button className="rx-btn-ghost" onClick={resetAll}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* ── BANNER ── */}
        {banner.text && (
          <div className={`rx-banner rx-banner-${banner.type}`}>
            <div className="rx-banner-ico">
              {banner.type==="success"?"✓":banner.type==="warn"?"⚠":"✕"}
            </div>
            <span>{banner.text}</span>
            <button className="rx-banner-x" onClick={() => setBanner({type:"",text:""})}>✕</button>
          </div>
        )}

        {/* ── SUCCESS CARD ── */}
        {lastPrescriptionId && (
          <div className="rx-success">
            <div className="rx-success-shine" />
            <div className="rx-success-ico">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div className="rx-success-info">
              <div className="rx-success-heading">Prescription Dispatched</div>
              <div className="rx-success-sub">ID: <code>{lastPrescriptionId}</code></div>
            </div>
            <button className="rx-btn-print" onClick={() => nav(`/prescriptions/${lastPrescriptionId}/print`)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              Print / PDF
            </button>
          </div>
        )}

        {/* ── MAIN GRID ── */}
        <div className="rx-grid">

          {/* LEFT */}
          <div className="rx-col">

            {/* CARD 1 – PHARMACY */}
            <div className={`rx-card ${step1Done?"rx-card-ok":""}`}>
              <div className="rx-card-aside">
                <div className={`rx-num ${step1Done?"rx-num-ok":""}`}>
                  {step1Done ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg> : "1"}
                </div>
                {step1Done && <div className="rx-aside-line" />}
              </div>
              <div className="rx-card-main">
                <div className="rx-card-top">
                  <h2 className="rx-card-title">Select Pharmacy</h2>
                  <span className="rx-tag rx-tag-req">Required</span>
                </div>

                <label className="rx-lbl">Pharmacy Location</label>
                <div className="rx-sel-wrap">
                  <svg className="rx-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                  <select className="rx-sel" value={selectedPharmacy} onChange={e => setSelectedPharmacy(e.target.value)} disabled={loadingPharmacies}>
                    <option value="">{loadingPharmacies ? "Loading…" : "Choose a pharmacy"}</option>
                    {pharmacies.map(p => (
                      <option key={p.pharmacy_id} value={p.pharmacy_id}>{p.name} — {p.hospital_branch}</option>
                    ))}
                  </select>
                  <svg className="rx-arrow" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                </div>

                {step1Done && <div className="rx-ok-tag"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Pharmacy confirmed</div>}
              </div>
            </div>

            {/* CARD 2 – PATIENT */}
            <div className={`rx-card ${step2Done?"rx-card-ok":""}`}>
              <div className="rx-card-aside">
                <div className={`rx-num ${step2Done?"rx-num-ok":""}`}>
                  {step2Done ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg> : "2"}
                </div>
              </div>
              <div className="rx-card-main">
                <div className="rx-card-top">
                  <h2 className="rx-card-title">Patient</h2>
                  <button
                    className={`rx-toggle ${showAddPatient?"rx-toggle-on":""}`}
                    onClick={() => { setShowAddPatient(v=>!v); setPatientMsg({type:"",text:""}); }}
                  >
                    {showAddPatient ? "✕ Cancel" : "+ Register New"}
                  </button>
                </div>

                <label className="rx-lbl">Search patient</label>
                <div className="rx-inp-wrap">
                  <svg className="rx-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input className="rx-inp" value={patientQuery} onChange={e=>setPatientQuery(e.target.value)} placeholder="Name, NIC, or phone" />
                </div>

                {patientResults.length > 0 && (
                  <div className="rx-results">
                    {patientResults.slice(0,5).map(pt => (
                      <div key={pt.patient_id} className="rx-res-row">
                        <div className="rx-avatar" style={{background: strColor(pt.full_name)}}>
                          {pt.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="rx-res-info">
                          <div className="rx-res-name">{pt.full_name}</div>
                          <div className="rx-res-sub">{pt.nic_number} · {pt.phone}</div>
                        </div>
                        <button
                          className={`rx-sel-btn ${selectedPatient===pt.patient_id?"rx-sel-btn-on":""}`}
                          onClick={() => { setSelectedPatient(pt.patient_id); setBanner({type:"",text:""}); }}
                        >
                          {selectedPatient===pt.patient_id ? "✓ Selected" : "Select"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {step2Done && (
                  <div className="rx-ok-tag">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Patient selected · <code>{selectedPatient.slice(0,10)}…</code>
                  </div>
                )}

                {showAddPatient && (
                  <div className="rx-subform">
                    <div className="rx-subform-title">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                      Register New Patient
                    </div>
                    <div className="rx-form-grid">
                      <input className="rx-inp rx-bare" placeholder="Full name *" value={newPatient.full_name} onChange={e=>setNewPatient({...newPatient,full_name:e.target.value})} />
                      <input className="rx-inp rx-bare" placeholder="NIC number *" value={newPatient.nic_number} onChange={e=>setNewPatient({...newPatient,nic_number:e.target.value})} />
                      <input className="rx-inp rx-bare" placeholder="Phone" value={newPatient.phone} onChange={e=>setNewPatient({...newPatient,phone:e.target.value})} />
                      <input type="date" className="rx-inp rx-bare" value={newPatient.date_of_birth} onChange={e=>setNewPatient({...newPatient,date_of_birth:e.target.value})} />
                      <select className="rx-sel rx-bare" value={newPatient.gender} onChange={e=>setNewPatient({...newPatient,gender:e.target.value})}>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      <button className="rx-btn-save" onClick={handleCreatePatient}>Save &amp; Select Patient</button>
                    </div>
                    {patientMsg.text && (
                      <div className={`rx-banner rx-banner-${patientMsg.type}`} style={{marginTop:10,marginLeft:0,marginRight:0}}>
                        <span>{patientMsg.text}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT */}
          <div className="rx-col">

            {/* CARD 3 – DRUGS */}
            <div className={`rx-card ${step3Done?"rx-card-ok":""}`}>
              <div className="rx-card-aside">
                <div className={`rx-num ${step3Done?"rx-num-ok":""}`}>
                  {step3Done ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg> : "3"}
                </div>
              </div>
              <div className="rx-card-main">
                <div className="rx-card-top">
                  <h2 className="rx-card-title">Drugs</h2>
                  {items.length > 0 && (
                    <div className="rx-count-badge">
                      <span className="rx-count-dot" />
                      {items.length} item{items.length>1?"s":""}
                    </div>
                  )}
                </div>

                <label className="rx-lbl">Search drug</label>
                <div className="rx-inp-wrap">
                  <svg className="rx-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input className="rx-inp" value={drugQuery} onChange={e=>setDrugQuery(e.target.value)} placeholder="Generic or brand name…" />
                </div>

                {drugResults.length > 0 && (
                  <div className="rx-results">
                    {drugResults.slice(0,6).map(d => (
                      <div key={d.drug_id} className="rx-res-row">
                        <div className="rx-avatar rx-drug-ico">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                        </div>
                        <div className="rx-res-info">
                          <div className="rx-res-name">{d.generic_name}{d.brand_name?` (${d.brand_name})`:""}</div>
                          <div className="rx-res-sub">{d.unit||"—"} · {d.category||"—"}</div>
                        </div>
                        <button className="rx-add-btn" onClick={() => addItem(d)}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="rx-items-area">
                  <div className="rx-items-hdr">
                    <span>Prescription Items</span>
                    {items.length===0 && <span className="rx-items-hint">Search above to add drugs</span>}
                  </div>

                  {items.length === 0 ? (
                    <div className="rx-empty">
                      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/></svg>
                      <p>No drugs added yet</p>
                      <small>Search and click Add to build the prescription</small>
                    </div>
                  ) : (
                    <div className="rx-items-list">
                      {items.map((it, idx) => (
                        <DrugItemRow key={idx} item={it} index={idx} onChange={updateItem} onRemove={removeItem} onCheckStock={checkStock} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CARD 4 – SEND */}
            <div className="rx-card rx-send-card">
              <div className="rx-card-aside">
                <div className={`rx-num ${lastPrescriptionId?"rx-num-ok":""}`}>
                  {lastPrescriptionId ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg> : "4"}
                </div>
              </div>
              <div className="rx-card-main">
                <div className="rx-card-top">
                  <h2 className="rx-card-title">Notes &amp; Send</h2>
                </div>

                <label className="rx-lbl">Diagnosis notes <span className="rx-lbl-opt">— optional</span></label>
                <textarea
                  className="rx-textarea"
                  value={notes}
                  onChange={e=>setNotes(e.target.value)}
                  rows={3}
                  placeholder="Add clinical notes, diagnosis details, or special instructions…"
                />

                {/* Readiness checklist */}
                <div className="rx-checklist">
                  {[
                    { label:"Pharmacy selected",         ok: step1Done },
                    { label:"Patient selected",           ok: step2Done },
                    { label:"Drugs & dosage complete",    ok: step3Done },
                  ].map((c,i) => (
                    <div key={i} className={`rx-chk ${c.ok?"rx-chk-ok":""}`}>
                      <div className="rx-chk-dot">
                        {c.ok && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                      <span>{c.label}</span>
                    </div>
                  ))}
                </div>

                <div className="rx-send-row">
                  <button
                    className={`rx-send-btn ${canSubmit&&!submitting?"rx-send-btn-on":""}`}
                    disabled={!canSubmit||submitting}
                    onClick={submit}
                  >
                    {submitting ? (
                      <><div className="rx-spin"/><span>Sending…</span></>
                    ) : (
                      <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg><span>Send Prescription</span></>
                    )}
                  </button>
                  <button className="rx-btn-ghost" onClick={resetAll}>Clear all</button>
                </div>

                <div className="rx-tip">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Stock availability check is optional — use the "Stock" button per drug.
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

// ── Deterministic avatar color ────────────────────────────────────────────────
function strColor(s) {
  const p = ["#3b82f6","#8b5cf6","#06b6d4","#f59e0b","#ec4899","#10b981","#f97316"];
  let h = 0; for (let i=0;i<s.length;i++) h=s.charCodeAt(i)+((h<<5)-h);
  return p[Math.abs(h)%p.length];
}



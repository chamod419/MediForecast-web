import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPrescriptionById } from "../api/doctorApi";
import "./PrescriptionPrint.css";

if (!document.getElementById("mf-print-fonts")) {
  const l = document.createElement("link");
  l.id = "mf-print-fonts";
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap";
  document.head.appendChild(l);
}

const STATUS_CFG = {
  DISPENSED: { label: "Dispensed", color: "#166534", bg: "#f0fdf4", accent: "#16a34a", border: "#bbf7d0" },
  PENDING:   { label: "Pending",   color: "#92400e", bg: "#fffbeb", accent: "#d97706", border: "#fde68a" },
  READY:     { label: "Ready",     color: "#1e40af", bg: "#eff6ff", accent: "#2563eb", border: "#bfdbfe" },
  CANCELLED: { label: "Cancelled", color: "#991b1b", bg: "#fef2f2", accent: "#dc2626", border: "#fecaca" },
};

export default function PrescriptionPrint() {
  const { id } = useParams();
  const nav    = useNavigate();
  const [p, setP]     = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setMsg("");
    getPrescriptionById(id).then(setP).catch(() => setMsg("Failed to load prescription."));
  }, [id]);

  const doctorName = useMemo(() => p?.doctor_full_name || p?.doctor_name || p?.doctor_username || "—", [p]);
  const doctorReg  = useMemo(() => p?.doctor_reg_no || "—", [p]);
  const st         = STATUS_CFG[p?.status] || STATUS_CFG["PENDING"];

  if (msg) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#edeae3",fontFamily:"DM Sans,sans-serif"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:40,marginBottom:12}}>⚠️</div>
        <div style={{fontSize:15,color:"#64748b",fontWeight:600}}>{msg}</div>
        <button onClick={() => nav(-1)} style={{marginTop:16,padding:"10px 22px",borderRadius:8,border:"1.5px solid #cbd5e1",background:"#fff",cursor:"pointer",fontWeight:700,fontFamily:"DM Sans,sans-serif",fontSize:13}}>← Go Back</button>
      </div>
    </div>
  );

  if (!p) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#edeae3",fontFamily:"DM Sans,sans-serif"}}>
      <div style={{textAlign:"center",color:"#94a3b8"}}>
        <div style={{width:32,height:32,borderRadius:"50%",border:"3px solid #e2e8f0",borderTopColor:"#1e40af",animation:"pspin .7s linear infinite",margin:"0 auto 12px"}}/>
        <div style={{fontSize:13,fontWeight:600}}>Loading prescription…</div>
        <style>{`@keyframes pspin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  const issueDate = p.created_at ? new Date(p.created_at) : null;

  return (
    <>

      <div className="rx-shell">

        {/* ── ACTION BAR ── */}
        <div className="rx-bar no-print">
          <div className="rx-bar-left">
            <button className="rx-back" onClick={() => nav(-1)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              Back
            </button>
            <div className="rx-bar-id">
              <span className="rx-bar-lbl">RX</span>
              <code>{p.prescription_id?.slice(0,22)}…</code>
            </div>
          </div>
          <div className="rx-bar-right">
            <span className="rx-status-chip" style={{color:st.color,background:st.bg,borderColor:st.border}}>
              <span className="rx-status-dot" style={{background:st.accent}}/>
              {st.label}
            </span>
            <button className="rx-print-btn" onClick={() => window.print()}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              Print / Save PDF
            </button>
          </div>
        </div>

        {/* ══ DOCUMENT ══ */}
        <div className="rx-doc">

          {/* Top accent strip */}
          <div className="rx-accent-bar" style={{background:`linear-gradient(90deg,#1e3a5f 0%,${st.accent} 50%,#1e3a5f 100%)`}}/>

          {/* ── HEADER ── */}
          <div className="rx-header">
            <div className="rx-brand">
              <div className="rx-logo-box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              </div>
              <div>
                <div className="rx-brand-name">MediForecast</div>
                <div className="rx-brand-sub">Digital Health Platform</div>
              </div>
            </div>

            <div className="rx-header-center">
              <div className="rx-rx-glyph">℞</div>
              <div className="rx-doc-label">MEDICAL PRESCRIPTION</div>
            </div>

            <div className="rx-header-meta">
              {/* <div className="rx-meta-item">
                <span className="rx-meta-k">Prescription No.</span>
                <code className="rx-meta-v">{p.prescription_id?.slice(0,16)}…</code>
              </div> */}
              <div className="rx-meta-item" style={{marginTop:6}}>
                <span className="rx-meta-k">Date Issued</span>
                <span className="rx-meta-txt">
                  {issueDate ? issueDate.toLocaleDateString("en-US",{day:"numeric",month:"short",year:"numeric"}) : "—"}
                </span>
              </div>
              <div className="rx-meta-item" style={{marginTop:6}}>
                <span className="rx-meta-k">Status</span>
                <span className="rx-status-pill" style={{color:st.color,background:st.bg,borderColor:st.border}}>
                  <span style={{width:5,height:5,borderRadius:"50%",background:st.accent,display:"inline-block",marginRight:5}}/>
                  {st.label}
                </span>
              </div>
            </div>
          </div>

          {/* Divider with gradient */}
          <div className="rx-rule"/>

          {/* ── PARTIES ── */}
          <div className="rx-parties">
            <div className="rx-party">
              <div className="rx-party-hd">
                <div className="rx-party-ico" style={{background:"linear-gradient(135deg,#1e3a5f,#2563eb)"}}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.3"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                PRESCRIBING PHYSICIAN
              </div>
              <div className="rx-party-name">{doctorName}</div>
              <div className="rx-party-kv">
                <span className="rx-kv-k">Medical Registration</span>
                <code className="rx-kv-code">{doctorReg}</code>
              </div>
            </div>

            <div className="rx-party-div"/>

            <div className="rx-party">
              <div className="rx-party-hd">
                <div className="rx-party-ico" style={{background:"linear-gradient(135deg,#0d9488,#059669)"}}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.3"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                PATIENT
              </div>
              <div className="rx-party-name">{p.patient_name || "—"}</div>
              <div className="rx-party-kv">
                <span className="rx-kv-k">Dispensing Pharmacy</span>
                <span className="rx-kv-v">{p.pharmacy_name || "—"}</span>
              </div>
              <div className="rx-party-kv" style={{marginTop:4}}>
                <span className="rx-kv-k">Issued At</span>
                <span className="rx-kv-v">
                  {issueDate ? issueDate.toLocaleString("en-US",{dateStyle:"medium",timeStyle:"short"}) : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* ── MEDICINES ── */}
          <div className="rx-meds-section">
            <div className="rx-meds-hd">
              <div className="rx-meds-title">
                <span className="rx-meds-glyph">℞</span>
                Prescribed Medicines
              </div>
              <div className="rx-meds-cnt" style={{color:st.color,background:st.bg,borderColor:st.border}}>
                {(p.items||[]).length} item{(p.items||[]).length!==1?"s":""}
              </div>
            </div>

            {/* Table */}
            <div className="rx-table">
              <div className="rx-thead">
                <div className="rx-th" style={{width:28}}>#</div>
                <div className="rx-th rx-th-flex2">Drug / Medicine</div>
                <div className="rx-th rx-th-flex1">Dosage</div>
                <div className="rx-th" style={{width:52,textAlign:"center"}}>Qty</div>
                <div className="rx-th rx-th-flex1">Instructions</div>
              </div>

              {(p.items||[]).length === 0 ? (
                <div className="rx-empty">No medicines prescribed.</div>
              ) : (
                (p.items||[]).map((it, idx) => (
                  <div key={it.item_id||idx} className={`rx-tr ${idx%2===1?"rx-tr-alt":""}`}>
                    <div className="rx-td" style={{width:28}}>
                      <span className="rx-num">{idx+1}</span>
                    </div>
                    <div className="rx-td rx-th-flex2">
                      <div className="rx-dname">
                        {it.drug_name}
                        {it.brand_name&&<span className="rx-dbrand"> ({it.brand_name})</span>}
                      </div>
                      {/* <code className="rx-did">{it.drug?.slice(0,20)}</code> */}
                    </div>
                    <div className="rx-td rx-th-flex1">
                      {it.dosage
                        ? <span className="rx-dosage" style={{color:st.color,background:st.bg,borderColor:st.border}}>{it.dosage}</span>
                        : <span className="rx-dash">—</span>}
                    </div>
                    <div className="rx-td" style={{width:52,display:"flex",justifyContent:"center"}}>
                      <div className="rx-qty" style={{background:st.accent}}>{it.quantity}</div>
                    </div>
                    <div className="rx-td rx-th-flex1 rx-instr">
                      {it.instructions||<span className="rx-dash">As directed</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ── NOTES ── */}
          {p.diagnosis_notes && (
            <div className="rx-notes">
              <div className="rx-notes-lbl">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                Clinical Notes
              </div>
              <div className="rx-notes-body">{p.diagnosis_notes}</div>
            </div>
          )}

          {/* ── SIGNATURES ── */}
          <div className="rx-sigs">
            {[
              {title:"Prescribing Doctor", name:doctorName, sub:`Reg. ${doctorReg}`},
              // {title:"Date of Issue",      name: issueDate ? issueDate.toLocaleDateString("en-US",{day:"numeric",month:"long",year:"numeric"}) : "—", sub: issueDate ? issueDate.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"}) : ""},
              // {title:"Dispensed by",       name: p.pharmacy_name||"—", sub:"Pharmacist"},
            ].map((s,i) => (
              <div key={i} className="rx-sig">
                <div className="rx-sig-area"/>
                <div className="rx-sig-line"/>
                <div className="rx-sig-ttl">{s.title}</div>
                <div className="rx-sig-name">{s.name}</div>
                <div className="rx-sig-sub">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* ── VALIDITY ── */}
          <div className="rx-validity">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Valid 30 days from issue date. This prescription is non-transferable and cannot be reused after dispensing.
          </div>

          {/* ── WATERMARK ── */}
          <div className="rx-wm print-only">ORIGINAL</div>

          {/* ── FOOTER ── */}
          <div className="rx-footer">
            <div style={{display:"flex",alignItems:"center",gap:7}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:st.accent}}/>
              <span className="rx-footer-brand">MediForecast Digital Health Platform</span>
            </div>
            <code className="rx-footer-code">{p.prescription_id?.slice(0,24)}</code>
            <span className="rx-footer-pg">Page 1 / 1</span>
          </div>

        </div>
      </div>
    </>
  );
}


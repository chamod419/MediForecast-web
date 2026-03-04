import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { pharmacyChangePassword, logout } from "../api/authApi";
import "./PharmacyChangePassword.css";

if (!document.getElementById("mf-pcp-fonts")) {
  const l = document.createElement("link");
  l.id = "mf-pcp-fonts";
  l.rel = "stylesheet";
  l.href =
    "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap";
  document.head.appendChild(l);
}

export default function PharmacyChangePassword() {
  const nav = useNavigate();

  const [oldPw,     setOldPw]     = useState("");
  const [newPw,     setNewPw]     = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showOld,     setShowOld]     = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [msg,  setMsg]  = useState({ type: "", text: "" });
  const [busy, setBusy] = useState(false);

  const strength = (() => {
    if (!newPw) return 0;
    let s = 0;
    if (newPw.length >= 8)           s++;
    if (/[A-Z]/.test(newPw))         s++;
    if (/[0-9]/.test(newPw))         s++;
    if (/[^A-Za-z0-9]/.test(newPw))  s++;
    return s;
  })();
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "#ef4444", "#f59e0b", "#3b82f6", "#22c55e"][strength];
  const passwordsMatch    = confirmPw && newPw === confirmPw;
  const passwordsMismatch = confirmPw && newPw !== confirmPw;

  const submit = async () => {
    setMsg({ type: "", text: "" });
    if (!oldPw || !newPw || !confirmPw) { setMsg({ type:"error", text:"All fields are required." }); return; }
    if (newPw !== confirmPw)             { setMsg({ type:"error", text:"New passwords do not match." }); return; }
    setBusy(true);
    try {
      const res = await pharmacyChangePassword(oldPw, newPw, confirmPw);
      setMsg({ type: "success", text: res.detail || "Password changed successfully." });
      logout();
      setTimeout(() => nav("/login"), 1800);
    } catch (e) {
      const data = e?.response?.data;
      const err  = data?.detail
        ? Array.isArray(data.detail) ? data.detail.join("\n") : data.detail
        : "Failed to change password.";
      setMsg({ type: "error", text: err });
    } finally { setBusy(false); }
  };

  const EyeIcon = ({ show }) => show
    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;

  return (
    <>
      <div className="pcp-shell">
        <div className="pcp-blob-1" />
        <div className="pcp-blob-2" />

        <div className="pcp-card">

          {/* Header */}
          <div className="pcp-header">
            <button className="pcp-back-btn" onClick={() => nav(-1)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              Back
            </button>
            <div className="pcp-role-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              Pharmacy Account
            </div>
          </div>

          {/* Hero */}
          <div className="pcp-hero">
            <div className="pcp-hero-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <h1 className="pcp-title">Change Password</h1>
            <p className="pcp-sub">Update your pharmacy account password securely.<br/>You'll be logged out after a successful change.</p>
          </div>

          {/* Form */}
          <div className="pcp-form">

            {/* Current Password */}
            <div className="pcp-field">
              <label className="pcp-label">Current Password</label>
              <div className="pcp-input-wrap">
                <svg className="pcp-ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input className="pcp-input" type={showOld?"text":"password"} value={oldPw} onChange={e=>setOldPw(e.target.value)} placeholder="Enter current password" />
                <button className="pcp-eye" onClick={()=>setShowOld(v=>!v)} tabIndex={-1}><EyeIcon show={showOld}/></button>
              </div>
            </div>

            <div className="pcp-divider">
              <div className="pcp-divider-line"/>
              <span>New credentials</span>
              <div className="pcp-divider-line"/>
            </div>

            {/* New Password */}
            <div className="pcp-field">
              <label className="pcp-label">New Password</label>
              <div className="pcp-input-wrap">
                <svg className="pcp-ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <input className="pcp-input" type={showNew?"text":"password"} value={newPw} onChange={e=>setNewPw(e.target.value)} placeholder="Enter new password" />
                <button className="pcp-eye" onClick={()=>setShowNew(v=>!v)} tabIndex={-1}><EyeIcon show={showNew}/></button>
              </div>

              {newPw && (
                <div className="pcp-strength">
                  <div className="pcp-strength-bars">
                    {[1,2,3,4].map(i=>(
                      <div key={i} className="pcp-strength-bar" style={{background: i<=strength ? strengthColor : "rgba(255,255,255,0.1)"}}/>
                    ))}
                  </div>
                  <span className="pcp-strength-label" style={{color:strengthColor}}>{strengthLabel}</span>
                </div>
              )}

              {newPw && (
                <div className="pcp-reqs">
                  {[
                    {ok:newPw.length>=8,          label:"At least 8 characters"},
                    {ok:/[A-Z]/.test(newPw),       label:"One uppercase letter"},
                    {ok:/[0-9]/.test(newPw),       label:"One number"},
                    {ok:/[^A-Za-z0-9]/.test(newPw),label:"One special character"},
                  ].map((r,i)=>(
                    <div key={i} className={`pcp-req ${r.ok?"pcp-req-ok":""}`}>
                      {r.ok
                        ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        : <div className="pcp-req-dot"/>
                      }
                      {r.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="pcp-field">
              <label className="pcp-label">Confirm New Password</label>
              <div className={`pcp-input-wrap ${passwordsMismatch?"pcp-input-error":""} ${passwordsMatch?"pcp-input-ok":""}`}>
                <svg className="pcp-ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                <input className="pcp-input" type={showConfirm?"text":"password"} value={confirmPw} onChange={e=>setConfirmPw(e.target.value)} placeholder="Re-enter new password" onKeyDown={e=>e.key==="Enter"&&submit()} />
                <button className="pcp-eye" onClick={()=>setShowConfirm(v=>!v)} tabIndex={-1}><EyeIcon show={showConfirm}/></button>
              </div>
              {passwordsMismatch && <div className="pcp-field-err">Passwords do not match</div>}
              {passwordsMatch    && <div className="pcp-field-ok">Passwords match ✓</div>}
            </div>

            {/* Banner */}
            {msg.text && (
              <div className={`pcp-banner pcp-banner-${msg.type}`}>
                <div className="pcp-banner-ico">
                  {msg.type==="success"
                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  }
                </div>
                <span style={{whiteSpace:"pre-wrap"}}>{msg.text}</span>
                {msg.type==="success" && <span className="pcp-redirect-note">Redirecting to login…</span>}
              </div>
            )}

            {/* Submit */}
            <button
              className={`pcp-submit ${busy?"pcp-submit-busy":""} ${msg.type==="success"?"pcp-submit-done":""}`}
              onClick={submit}
              disabled={busy||msg.type==="success"}
            >
              {busy
                ? <><div className="pcp-spin"/>Updating password…</>
                : msg.type==="success"
                  ? <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Password Updated!</>
                  : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Update Password</>
              }
            </button>
          </div>

          <div className="pcp-security-note">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Your password is encrypted and never stored in plain text.
          </div>
        </div>
      </div>
    </>
  );
}

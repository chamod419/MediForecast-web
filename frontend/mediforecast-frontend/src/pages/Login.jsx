import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import loginLogo from "../assets/login_logo.png";
import "./Login.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// ── Inject fonts once ──────────────────────────────────────────────────────────
if (!document.getElementById("mf-login-fonts")) {
  const l = document.createElement("link");
  l.id = "mf-login-fonts";
  l.rel = "stylesheet";
  l.href =
    "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap";
  document.head.appendChild(l);
}

export default function Login() {
  const [portal, setPortal] = useState(null); // DOCTOR | PHARMACY | null => ADMIN
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const isDoctor = portal === "DOCTOR";
  const isPharmacy = portal === "PHARMACY";
  const isAdmin = portal === null;

  const clearAuthStorage = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    localStorage.removeItem("full_name");
    localStorage.removeItem("pharmacy_id");
  };

  const handlePortalClick = (nextPortal) => {
    setMsg("");
    setPortal((prev) => (prev === nextPortal ? null : nextPortal));
  };

  const getLoginUrl = () => {
    if (portal === "DOCTOR") return `${API_BASE}/api/auth/doctor/login/`;
    if (portal === "PHARMACY") return `${API_BASE}/api/auth/pharmacy/login/`;
    return `${API_BASE}/api/auth/admin/login/`;
  };

  const getButtonText = () => {
    if (isDoctor) return "Sign in as Doctor";
    if (isPharmacy) return "Sign in as Pharmacist";
    return "Sign in as Admin";
  };

  const getActiveText = () => {
    if (isDoctor) return "Signing in as Doctor";
    if (isPharmacy) return "Signing in as Pharmacist";
    return "No clinical role selected · Admin access mode";
  };

  const login = async () => {
    setMsg("");

    if (!username.trim() || !password.trim()) {
      setMsg("Please enter your username and password.");
      return;
    }

    setLoading(true);

    try {
      clearAuthStorage();

      const res = await axios.post(getLoginUrl(), {
        username: username.trim(),
        password,
      });

      const data = res.data;

      if (portal === "DOCTOR" && data.role !== "DOCTOR") {
        throw new Error("Selected Doctor login, but this is not a doctor account.");
      }

      if (portal === "PHARMACY" && data.role !== "PHARMACY") {
        throw new Error("Selected Pharmacy login, but this is not a pharmacy account.");
      }

      if (portal === null && data.role !== "ADMIN") {
        throw new Error("Without selecting a role, only admin accounts can sign in.");
      }

      localStorage.setItem("access", data.access || "");
      localStorage.setItem("refresh", data.refresh || "");
      localStorage.setItem("role", data.role || "");
      localStorage.setItem("username", data.username || "");
      localStorage.setItem("full_name", data.full_name || "");
      localStorage.setItem("pharmacy_id", data.pharmacy_id || "");

      if (data.role === "DOCTOR") {
        navigate("/doctor", { replace: true });
        return;
      }

      if (data.role === "PHARMACY") {
        navigate("/pharmacy", { replace: true });
        return;
      }

      if (data.role === "ADMIN") {
        navigate("/admin/dashboard", { replace: true });
        return;
      }

      navigate("/unauthorized", { replace: true });
    } catch (e) {
      const serverMsg = e?.response?.data?.detail;

      if (!portal && serverMsg === "Not an admin account") {
        setMsg("For Doctor or Pharmacy accounts, please select your role before signing in.");
      } else {
        setMsg(
          serverMsg ||
            e?.message ||
            "Login failed. Check your credentials."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lg-shell">
      <div className="lg-blob lg-blob-1" />
      <div className="lg-blob lg-blob-2" />
      <div className="lg-blob lg-blob-3" />

      <div className="lg-card">
        <div className="lg-brand">
          <img src={loginLogo} alt="MediForecast" className="lg-logo" />
          <div className="lg-tagline">AI-Driven Pharmacy Intelligence</div>
        </div>

        <div className="lg-welcome">
          <h1 className="lg-title">Welcome back</h1>
          <p className="lg-sub">Sign in to your clinical portal</p>
        </div>

        <div className="lg-portal-row">
          <button
            type="button"
            className={`lg-portal-btn ${isDoctor ? "lg-portal-active" : ""}`}
            onClick={() => handlePortalClick("DOCTOR")}
          >
            <div className={`lg-portal-icon ${isDoctor ? "lg-portal-icon-active" : ""}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <div>
              <div className="lg-portal-name">Doctor</div>
              <div className="lg-portal-desc">Clinical prescriptions</div>
            </div>
            {isDoctor && <div className="lg-portal-check">✓</div>}
          </button>

          <button
            type="button"
            className={`lg-portal-btn ${isPharmacy ? "lg-portal-active lg-portal-active-green" : ""}`}
            onClick={() => handlePortalClick("PHARMACY")}
          >
            <div className={`lg-portal-icon ${isPharmacy ? "lg-portal-icon-active-green" : ""}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <div>
              <div className="lg-portal-name">Pharmacy</div>
              <div className="lg-portal-desc">Queue management</div>
            </div>
            {isPharmacy && <div className="lg-portal-check lg-portal-check-green">✓</div>}
          </button>
        </div>

        <div className="lg-role-helper">
          <span>Choose Doctor or Pharmacy. Leave unselected for Admin access.</span>
          {!isAdmin && (
            <button
              type="button"
              className="lg-clear-role"
              onClick={() => {
                setPortal(null);
                setMsg("");
              }}
            >
              Clear selection
            </button>
          )}
        </div>

        <div
          className={`lg-active-tag ${
            isPharmacy ? "lg-active-tag-green" : isAdmin ? "lg-active-tag-admin" : ""
          }`}
        >
          <div
            className={`lg-active-dot ${
              isPharmacy ? "lg-active-dot-green" : isAdmin ? "lg-active-dot-admin" : ""
            }`}
          />
          <strong>{getActiveText()}</strong>
        </div>

        <div className="lg-form">
          <div className="lg-field">
            <label className="lg-label">Username</label>
            <div className="lg-input-wrap">
              <svg
                className="lg-input-ico"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <input
                className="lg-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                autoComplete="username"
                onKeyDown={(e) => e.key === "Enter" && login()}
              />
            </div>
          </div>

          <div className="lg-field">
            <label className="lg-label">Password</label>
            <div className="lg-input-wrap">
              <svg
                className="lg-input-ico"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                className="lg-input"
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                onKeyDown={(e) => e.key === "Enter" && login()}
              />
              <button
                type="button"
                className="lg-eye-btn"
                onClick={() => setShowPass((v) => !v)}
                tabIndex={-1}
              >
                {showPass ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {msg && (
            <div className="lg-error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {msg}
            </div>
          )}

          <button
            type="button"
            className={`lg-btn ${
              loading ? "lg-btn-loading" : ""
            } ${isPharmacy ? "lg-btn-green" : isAdmin ? "lg-btn-admin" : ""}`}
            onClick={login}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="lg-spin" />
                Signing in…
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                {getButtonText()}
              </>
            )}
          </button>
        </div>

        <div className="lg-info">
          <div className="lg-info-row">
            <div className="lg-info-dot lg-info-dot-blue" />
            <span>Doctor accounts → select Doctor</span>
          </div>
          <div className="lg-info-row">
            <div className="lg-info-dot lg-info-dot-green" />
            <span>Pharmacy accounts → select Pharmacy</span>
          </div>
          <div className="lg-info-row">
            <div className="lg-info-dot lg-info-dot-purple" />
            <span>Admin accounts → leave role unselected</span>
          </div>
        </div>

        <div className="lg-card-footer">
          MediForecast · AI-Driven Pharmacy Intelligence · v1.0
        </div>
      </div>
    </div>
  );
}
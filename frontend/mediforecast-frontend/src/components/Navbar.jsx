import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { logout as doLogout } from "../api/authApi";
import logo from "../assets/logo.png";
import "./Navbar.css";

// ── Role config ────────────────────────────────────────────────────────────────
const ROLE_META = {
  DOCTOR:   { label: "Doctor",   color: "#3b82f6", bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.3)"  },
  PHARMACY: { label: "Pharmacy", color: "#22c55e", bg: "rgba(34,197,94,0.12)",   border: "rgba(34,197,94,0.3)"   },
  ADMIN:    { label: "Admin",    color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.3)"  },
  GUEST:    { label: "Guest",    color: "#94a3b8", bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.2)" },
};

const NAV_LINKS = {
  DOCTOR: [
    { to: "/doctor",                  exact: true,  icon: "pulse",    label: "Prescriptions"  },
    { to: "/doctor/history",          exact: false, icon: "clock",    label: "History"         },
    { to: "/doctor/change-password",  exact: false, icon: "lock",     label: "Change Password" },
  ],
  PHARMACY: [
  { to: "/pharmacy",                  exact: true,  icon: "home",      label: "Pharmacy Queue"   },
  { to: "/pharmacy/inventory",        exact: false, icon: "inventory", label: "Inventory"        }, 
  { to: "/pharmacy/prediction",      exact: false, icon: "trend",      label: "Drug Prediction"},
  { to: "/pharmacy/change-password",  exact: false, icon: "lock",      label: "Change Password"  },
],
  ADMIN: [
    { to: "/admin-panel", exact: false, icon: "settings", label: "Admin Panel" },
  ],
};

const ICON = {
  pulse:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  clock:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  lock:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  home:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  inventory: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"> <path d="M3 3h18v4H3z"/> <path d="M3 9h18v12H3z"/> <path d="M7 13h4"/> <path d="M7 17h8"/></svg>,
  trend:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"> <path d="M3 17l6-6 4 4 7-7" /> <path d="M14 8h6v6" /> </svg>,
  settings: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>,
  logout:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  menu:     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6"  x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  close:    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

export default function Navbar() {
  const location = useLocation();
  const navigate  = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  // close drawer on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // inject fonts once
  useEffect(() => {
    if (!document.getElementById("mf-nav-fonts")) {
      const l = document.createElement("link");
      l.id  = "mf-nav-fonts";
      l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap";
      document.head.appendChild(l);
    }
  }, []);

  // prevent body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const role       = localStorage.getItem("role")        || "GUEST";
  const fullName   = localStorage.getItem("full_name")   || "User";
  const pharmacyId = localStorage.getItem("pharmacy_id") || "";
  const meta       = ROLE_META[role] || ROLE_META.GUEST;
  const links      = NAV_LINKS[role] || [];

  const homePath =
    role === "DOCTOR"   ? "/doctor" :
    role === "PHARMACY" ? "/pharmacy" :
    role === "ADMIN"    ? "/admin-panel" : "/login";

  const isActive = (to, exact) =>
    exact ? location.pathname === to
          : location.pathname === to || location.pathname.startsWith(to + "/");

  const logout = () => { doLogout(); navigate("/login"); };

  const initials = fullName.trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase() || "U";

  return (
    <>


      {/* ══════════════════════ NAVBAR ══════════════════════ */}
      <nav className="nb">

        {/* LEFT */}
        <div className="nb-left">
          <Link to={homePath} className="nb-brand">
            <img src={logo} alt="MediForecast" className="nb-logo" />
            <div className="nb-brand-text">
              <span className="nb-brand-name">
                <span style={{color:"#e8edf5"}}>Medi</span>
                <span style={{color:"#3b82f6"}}>Forecast</span>
              </span>
              <span className="nb-brand-tag">Clinical Intelligence</span>
            </div>
          </Link>

          <div className="nb-sep" />

          <div className="nb-links">
            {links.map(lnk => (
              <Link
                key={lnk.to}
                to={lnk.to}
                className={`nb-link ${isActive(lnk.to, lnk.exact) ? "nb-link-on" : ""}`}
              >
                {ICON[lnk.icon]}
                <span>{lnk.label}</span>
                {isActive(lnk.to, lnk.exact) && <div className="nb-link-dot" />}
              </Link>
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div className="nb-right">
          {/* User chip */}
          <div className="nb-user">
            <div className="nb-avatar" style={{background:`linear-gradient(135deg,${meta.color},${meta.color}88)`}}>
              {initials}
            </div>
            <div className="nb-user-info">
              <span className="nb-user-name">{fullName}</span>
              <div className="nb-user-meta">
                <span className="nb-role-badge" style={{color:meta.color, background:meta.bg, borderColor:meta.border}}>
                  {meta.label}
                </span>
                {role === "PHARMACY" && pharmacyId && (
                  <code className="nb-pid">{pharmacyId.slice(0,8)}…</code>
                )}
              </div>
            </div>
          </div>

          {/* Logout btn */}
          <button className="nb-logout-btn" onClick={logout}>
            {ICON.logout}
            <span className="nb-logout-txt">Logout</span>
          </button>

          {/* Hamburger */}
          <button
            className={`nb-burger ${mobileOpen ? "nb-burger-open" : ""}`}
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? ICON.close : ICON.menu}
          </button>
        </div>
      </nav>

      {/* ══════════════════════ MOBILE DRAWER ══════════════════════ */}
      {/* Backdrop */}
      <div
        className={`nb-backdrop ${mobileOpen ? "nb-backdrop-on" : ""}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Drawer panel */}
      <div className={`nb-drawer ${mobileOpen ? "nb-drawer-on" : ""}`}>

        {/* Drawer header */}
        <div className="nb-drawer-head">
          <div className="nb-drawer-brand">
            <img src={logo} alt="MediForecast" className="nb-drawer-logo" />
            <div>
              <div className="nb-drawer-brand-name">
                <span style={{color:"#e8edf5"}}>Medi</span>
                <span style={{color:"#3b82f6"}}>Forecast</span>
              </div>
              <div className="nb-drawer-brand-tag">Clinical Intelligence</div>
            </div>
          </div>
          <button className="nb-drawer-close" onClick={() => setMobileOpen(false)}>
            {ICON.close}
          </button>
        </div>

        {/* Drawer user */}
        <div className="nb-drawer-user">
          <div className="nb-drawer-avatar" style={{background:`linear-gradient(135deg,${meta.color},${meta.color}88)`}}>
            {initials}
          </div>
          <div>
            <div className="nb-drawer-uname">{fullName}</div>
            <div style={{marginTop:5, display:"flex", alignItems:"center", gap:6, flexWrap:"wrap"}}>
              <span className="nb-role-badge" style={{color:meta.color, background:meta.bg, borderColor:meta.border}}>
                {meta.label}
              </span>
              {role === "PHARMACY" && pharmacyId && (
                <code className="nb-pid nb-drawer-pid">{pharmacyId.slice(0,16)}…</code>
              )}
            </div>
          </div>
        </div>

        <div className="nb-drawer-rule" />

        {/* Drawer links */}
        <div className="nb-drawer-nav">
          <div className="nb-drawer-nav-label">Navigation</div>
          {links.map(lnk => {
            const active = isActive(lnk.to, lnk.exact);
            return (
              <Link
                key={lnk.to}
                to={lnk.to}
                className={`nb-drawer-link ${active ? "nb-drawer-link-on" : ""}`}
                style={active ? {color:meta.color, background:meta.bg, borderColor:meta.border} : {}}
              >
                <span className="nb-drawer-link-ico" style={active?{color:meta.color}:{}}>{ICON[lnk.icon]}</span>
                <span>{lnk.label}</span>
                {active && (
                  <span className="nb-drawer-active-dot" style={{background:meta.color, boxShadow:`0 0 6px ${meta.color}`}} />
                )}
              </Link>
            );
          })}
        </div>

        <div className="nb-drawer-rule" />

        {/* Drawer logout */}
        <div className="nb-drawer-footer-area">
          <button className="nb-drawer-logout" onClick={logout}>
            {ICON.logout}
            Sign Out of {meta.label} Portal
          </button>
          <div className="nb-drawer-copy">MediForecast · AI-Driven Pharmacy Intelligence</div>
        </div>
      </div>
    </>
  );
}


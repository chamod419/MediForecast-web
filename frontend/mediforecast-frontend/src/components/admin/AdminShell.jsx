import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { logout } from "../../api/authApi";
import logo from "../../assets/logo.png";
import "./AdminShell.css";

const NAV_ITEMS = [
  { to: "/admin/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/admin/users", label: "Users", icon: "users" },
  { to: "/admin/pharmacies", label: "Pharmacies", icon: "pharmacy" },
  { to: "/admin/drugs", label: "Drugs", icon: "drugs" },
  { to: "/admin/patients", label: "Patients", icon: "patients" },
  { to: "/admin/prescriptions", label: "Prescriptions", icon: "prescriptions" },
  { to: "/admin/inventory", label: "Inventory", icon: "inventory" },
];

const ICONS = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="4" rx="2" />
      <rect x="14" y="10" width="7" height="11" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
    </svg>
  ),
  users: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  pharmacy: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  drugs: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.5 20.5 3.5 13.5a3.54 3.54 0 1 1 5-5l7 7a3.54 3.54 0 0 1-5 5Z" />
      <path d="m8.5 8.5 7 7" />
      <path d="m14 4 6 6" />
    </svg>
  ),
  patients: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  prescriptions: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
    </svg>
  ),
  inventory: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3h18v4H3z" />
      <path d="M3 9h18v12H3z" />
      <path d="M7 13h4" />
      <path d="M7 17h8" />
    </svg>
  ),
  menu: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  close: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  logout: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
};

export default function AdminShell() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!document.getElementById("mf-admin-fonts")) {
      const l = document.createElement("link");
      l.id = "mf-admin-fonts";
      l.rel = "stylesheet";
      l.href =
        "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap";
      document.head.appendChild(l);
    }
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const name =
    localStorage.getItem("full_name") ||
    localStorage.getItem("username") ||
    "Administrator";

  const initials = useMemo(() => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    return parts.length ? parts.map((p) => p[0]).join("").slice(0, 2).toUpperCase() : "AD";
  }, [name]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="adm-shell">
      <aside className={`adm-sidebar ${mobileOpen ? "adm-sidebar-open" : ""}`}>
        <div className="adm-brand">
          <img src={logo} alt="MediForecast" className="adm-brand-logo" />
          <div>
            <div className="adm-brand-name">MediForecast</div>
            <div className="adm-brand-sub">Admin Control Center</div>
          </div>
        </div>

        <div className="adm-admin-chip">
          <div className="adm-admin-avatar">{initials}</div>
          <div className="adm-admin-meta">
            <div className="adm-admin-name">{name}</div>
            <div className="adm-admin-role">ADMINISTRATOR</div>
          </div>
        </div>

        <nav className="adm-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `adm-nav-link ${isActive ? "adm-nav-link-active" : ""}`
              }
              onClick={() => setMobileOpen(false)}
            >
              <span className="adm-nav-icon">{ICONS[item.icon]}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <button className="adm-logout" onClick={handleLogout}>
          {ICONS.logout}
          <span>Logout</span>
        </button>
      </aside>

      <div className={`adm-backdrop ${mobileOpen ? "adm-backdrop-on" : ""}`} onClick={() => setMobileOpen(false)} />

      <div className="adm-main">
        <header className="adm-topbar">
          <button className="adm-menu-btn" onClick={() => setMobileOpen((v) => !v)}>
            {mobileOpen ? ICONS.close : ICONS.menu}
          </button>

          <div className="adm-topbar-copy">
            Centralized control for users, pharmacies, drugs, inventory, and prescriptions
          </div>

          <div className="adm-topbar-right">
            <div className="adm-topbar-badge">ADMIN PANEL</div>
          </div>
        </header>

        <main className="adm-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
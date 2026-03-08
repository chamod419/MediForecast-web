import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminDashboard } from "../../api/adminApi";
import { HorizontalBars, StatCard } from "../../components/admin/AdminUiKit";
import "./AdminPages.css";

export default function AdminDashboard() {
  const [data, setData]   = useState(null);
  const [msg,  setMsg]    = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setMsg(""); setLoading(true);
      const res = await getAdminDashboard();
      setData(res);
    } catch (e) {
      setMsg(e?.response?.data?.detail || "Failed to load dashboard.");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const statCards = [
    {
      title:    "Total Users",
      value:    data?.users?.total ?? 0,
      subtitle: `${data?.users?.admins ?? 0} admins · ${data?.users?.doctors ?? 0} doctors · ${data?.users?.pharmacy_users ?? 0} pharmacy`,
      tone:     "purple",
      icon:     "👥",
    },
    {
      title:    "Pharmacies",
      value:    data?.business?.pharmacies ?? 0,
      subtitle: `${data?.business?.inventory_items ?? 0} inventory records`,
      tone:     "blue",
      icon:     "🏥",
    },
    {
      title:    "Patients",
      value:    data?.business?.patients ?? 0,
      subtitle: `${data?.business?.drugs ?? 0} drugs in master list`,
      tone:     "green",
      icon:     "🧑‍⚕️",
    },
    {
      title:    "Prescriptions",
      value:    data?.prescriptions?.total ?? 0,
      subtitle: `${data?.prescriptions?.dispensed ?? 0} dispensed overall`,
      tone:     "amber",
      icon:     "📋",
    },
  ];

  const prescriptionBars = useMemo(() => [
    { label: "Pending",   value: data?.prescriptions?.pending   ?? 0, color: "#f59e0b" },
    { label: "Ready",     value: data?.prescriptions?.ready     ?? 0, color: "#3b82f6" },
    { label: "Dispensed", value: data?.prescriptions?.dispensed ?? 0, color: "#10b981" },
    { label: "Cancelled", value: data?.prescriptions?.cancelled ?? 0, color: "#ef4444" },
  ], [data]);

  const alertBars = useMemo(() => [
    { label: "Low Stock",    value: data?.alerts?.low_stock_items   ?? 0, color: "#f59e0b" },
    { label: "Out of Stock", value: data?.alerts?.out_of_stock_items ?? 0, color: "#ef4444" },
    { label: "Expired",      value: data?.alerts?.expired_items     ?? 0, color: "#fb923c" },
  ], [data]);

  const userMixBars = useMemo(() => [
    { label: "Admins",         value: data?.users?.admins          ?? 0, color: "#8b5cf6" },
    { label: "Doctors",        value: data?.users?.doctors         ?? 0, color: "#3b82f6" },
    { label: "Pharmacy Users", value: data?.users?.pharmacy_users  ?? 0, color: "#10b981" },
  ], [data]);

  const quickLinks = [
    { to: "/admin/users",         icon: "👤", title: "Manage Users",          sub: "Create, edit, activate, and organize user roles", accent: "#8b5cf6" },
    { to: "/admin/pharmacies",    icon: "🏥", title: "Manage Pharmacies",      sub: "Update branches, locations, and contacts",        accent: "#3b82f6" },
    { to: "/admin/drugs",         icon: "💊", title: "Manage Drugs",           sub: "Maintain the central medicine catalogue",         accent: "#10b981" },
    { to: "/admin/patients",      icon: "🧑‍⚕️", title: "Manage Patients",        sub: "Add, update, search, and export records",         accent: "#f59e0b" },
    { to: "/admin/prescriptions", icon: "📋", title: "Prescription Monitoring", sub: "Track prescription flow across the system",       accent: "#06b6d4" },
    { to: "/admin/inventory",     icon: "📦", title: "Inventory Monitoring",    sub: "View stock issues and edit inventory centrally",   accent: "#ef4444" },
  ];

  return (
    <div className="ap-page">

      {/* ── HEADER ── */}
      <div className="ap-head">
        <div>
          <div className="ap-kicker">⚡ Admin Dashboard</div>
          <h1 className="ap-title">MediForecast Control Center</h1>
          <div className="ap-sub">
            Advanced analytics, operational visibility, and centralized control for the entire platform.
          </div>
        </div>
        <div className="ap-head-actions">
          <button className="ap-btn ap-btn-secondary" onClick={load} disabled={loading}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </div>

      {msg && <div className="ap-banner ap-banner-error">{msg}</div>}

      {/* ── STAT CARDS ── */}
      <div className="ap-stat-grid">
        {statCards.map((c) => (
          <StatCard key={c.title} {...c} />
        ))}
      </div>

      {/* ── CHARTS ROW 1 ── */}
      <div className="ap-grid-2">
        <HorizontalBars title="Prescription Status Analytics" items={prescriptionBars} />
        <HorizontalBars title="System Alert Analytics"        items={alertBars} />
      </div>

      {/* ── CHARTS ROW 2 + QUICK ACTIONS ── */}
      <div className="ap-grid-2">
        <HorizontalBars title="User Role Distribution" items={userMixBars} />

        <div className="ap-card">
          <div className="ap-card-head">
            <div className="ap-card-title">Quick Actions</div>
            <span className="ap-card-count">{quickLinks.length} shortcuts</span>
          </div>
          <div className="ap-form">
            <div className="ap-linkgrid">
              {quickLinks.map((lk) => (
                <Link
                  key={lk.to}
                  to={lk.to}
                  className="ap-linkcard"
                  style={{ "--link-accent": lk.accent }}
                >
                  <span className="ap-linkcard-icon">{lk.icon}</span>
                  <div className="ap-linktitle">{lk.title}</div>
                  <div className="ap-linksub">{lk.sub}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function StatCard({ title, value, subtitle }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 18,
        padding: 20,
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
      }}
    >
      <div style={{ color: "rgba(229,238,252,0.6)", fontSize: 13, marginBottom: 10 }}>
        {title}
      </div>
      <div style={{ fontSize: 34, fontWeight: 800, color: "#f8fbff", lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ color: "rgba(229,238,252,0.45)", fontSize: 12, marginTop: 10 }}>
        {subtitle}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const clearAuth = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    localStorage.removeItem("full_name");
    localStorage.removeItem("pharmacy_id");
  };

  const logout = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  const fetchDashboard = async () => {
    setLoading(true);
    setMsg("");

    try {
      const access = localStorage.getItem("access");

      const res = await axios.get(`${API_BASE}/api/admin/dashboard/`, {
        headers: {
          Authorization: `Bearer ${access}`,
        },
      });

      setData(res.data);
    } catch (e) {
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        clearAuth();
        navigate("/login", { replace: true });
        return;
      }
      setMsg(
        e?.response?.data?.detail ||
          "Failed to load admin dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const name =
    localStorage.getItem("full_name") ||
    localStorage.getItem("username") ||
    "Admin";

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "linear-gradient(180deg, #09111f 0%, #0d1728 100%)",
          color: "#e5eefc",
          fontFamily: "Outfit, sans-serif",
        }}
      >
        Loading admin dashboard...
      </div>
    );
  }

  if (!data) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "linear-gradient(180deg, #09111f 0%, #0d1728 100%)",
          color: "#e5eefc",
          fontFamily: "Outfit, sans-serif",
          padding: 24,
        }}
      >
        <div
          style={{
            maxWidth: 520,
            width: "100%",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20,
            padding: 24,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Admin dashboard unavailable</h2>
          <p style={{ color: "rgba(229,238,252,0.7)" }}>{msg || "Something went wrong."}</p>
          <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
            <button
              onClick={fetchDashboard}
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(135deg, #4338ca, #6366f1)",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Retry
            </button>
            <button
              onClick={logout}
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "transparent",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  const cards = [
    {
      title: "Total Users",
      value: data.users?.total ?? 0,
      subtitle: `${data.users?.admins ?? 0} admins · ${data.users?.doctors ?? 0} doctors · ${data.users?.pharmacy_users ?? 0} pharmacy users`,
    },
    {
      title: "Pharmacies",
      value: data.business?.pharmacies ?? 0,
      subtitle: `${data.business?.inventory_items ?? 0} inventory records in system`,
    },
    {
      title: "Patients",
      value: data.business?.patients ?? 0,
      subtitle: `${data.business?.drugs ?? 0} drugs available in master list`,
    },
    {
      title: "Prescriptions",
      value: data.prescriptions?.total ?? 0,
      subtitle: `${data.prescriptions?.dispensed ?? 0} dispensed overall`,
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #09111f 0%, #0d1728 100%)",
        color: "#e5eefc",
        fontFamily: "Outfit, sans-serif",
        padding: 28,
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 20,
            alignItems: "center",
            marginBottom: 24,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                color: "rgba(229,238,252,0.55)",
                fontSize: 13,
                marginBottom: 6,
                letterSpacing: 0.4,
              }}
            >
              MEDIFORECAST ADMIN PORTAL
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: 34,
                lineHeight: 1.1,
                fontWeight: 900,
              }}
            >
              Welcome, {name}
            </h1>
            <div style={{ color: "rgba(229,238,252,0.6)", marginTop: 8 }}>
              Central administration dashboard
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={fetchDashboard}
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Refresh
            </button>
            <button
              onClick={logout}
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(135deg, #4338ca, #6366f1)",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {msg && (
          <div
            style={{
              marginBottom: 18,
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.25)",
              color: "#fca5a5",
              borderRadius: 14,
              padding: "12px 14px",
            }}
          >
            {msg}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginBottom: 22,
          }}
        >
          {cards.map((card) => (
            <StatCard
              key={card.title}
              title={card.title}
              value={card.value}
              subtitle={card.subtitle}
            />
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 16,
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 18,
              padding: 20,
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Prescription Status</h3>
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Pending</span>
                <strong>{data.prescriptions?.pending ?? 0}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Ready</span>
                <strong>{data.prescriptions?.ready ?? 0}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Dispensed</span>
                <strong>{data.prescriptions?.dispensed ?? 0}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Cancelled</span>
                <strong>{data.prescriptions?.cancelled ?? 0}</strong>
              </div>
            </div>
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 18,
              padding: 20,
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>System Alerts</h3>
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Low stock items</span>
                <strong>{data.alerts?.low_stock_items ?? 0}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Out of stock items</span>
                <strong>{data.alerts?.out_of_stock_items ?? 0}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Expired items</span>
                <strong>{data.alerts?.expired_items ?? 0}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
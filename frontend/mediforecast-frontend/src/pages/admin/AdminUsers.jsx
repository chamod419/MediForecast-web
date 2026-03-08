import { useEffect, useMemo, useState } from "react";
import {
  createAdminUser,
  deleteAdminUser,
  listAdminPharmacies,
  listAdminUsers,
  updateAdminUser,
} from "../../api/adminApi";
import "./AdminPages.css";

const emptyForm = {
  username: "",
  password: "",
  first_name: "",
  last_name: "",
  email: "",
  is_active: true,
  role: "DOCTOR",
  doctor_reg_no: "",
  pharmacy: "",
};

function getErr(e) {
  const data = e?.response?.data;
  if (!data) return e?.message || "Action failed.";
  if (typeof data.detail === "string") return data.detail;
  if (typeof data === "string") return data;
  return Object.entries(data)
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`)
    .join(" | ");
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await listAdminUsers({
        q: q || undefined,
        role: roleFilter || undefined,
        is_active: activeFilter || undefined,
      });
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      setMsg({ type: "error", text: getErr(e) });
    } finally {
      setLoading(false);
    }
  };

  const loadPharmacies = async () => {
    try {
      const data = await listAdminPharmacies();
      setPharmacies(Array.isArray(data) ? data : []);
    } catch {}
  };

  useEffect(() => {
    loadPharmacies();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      loadUsers();
    }, 250);
    return () => clearTimeout(t);
  }, [q, roleFilter, activeFilter]);

  const resetForm = () => {
    setSelected(null);
    setForm(emptyForm);
  };

  const startEdit = (user) => {
    setSelected(user);
    setForm({
      username: user.username || "",
      password: "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
      is_active: user.is_active ?? true,
      role: user.role || "DOCTOR",
      doctor_reg_no: user.doctor_reg_no || "",
      pharmacy: user.pharmacy || "",
    });
    setMsg({ type: "", text: "" });
  };

  const save = async () => {
    try {
      setSaving(true);
      setMsg({ type: "", text: "" });

      const payload = {
        username: form.username.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        is_active: !!form.is_active,
        role: form.role,
        doctor_reg_no: form.role === "DOCTOR" ? form.doctor_reg_no || null : null,
        pharmacy: form.role === "PHARMACY" ? form.pharmacy || null : null,
      };

      if (form.password.trim()) {
        payload.password = form.password;
      }

      if (selected) {
        await updateAdminUser(selected.id, payload);
        setMsg({ type: "success", text: "User updated successfully." });
      } else {
        await createAdminUser({ ...payload, password: form.password });
        setMsg({ type: "success", text: "User created successfully." });
      }

      resetForm();
      await loadUsers();
    } catch (e) {
      setMsg({ type: "error", text: getErr(e) });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!selected) return;
    const ok = window.confirm(`Delete user "${selected.username}"?`);
    if (!ok) return;

    try {
      await deleteAdminUser(selected.id);
      setMsg({ type: "success", text: "User deleted successfully." });
      resetForm();
      await loadUsers();
    } catch (e) {
      setMsg({ type: "error", text: getErr(e) });
    }
  };

  const roleChip = (role) => {
    if (role === "ADMIN") return "ap-chip ap-chip-purple";
    if (role === "PHARMACY") return "ap-chip ap-chip-green";
    return "ap-chip ap-chip-blue";
  };

  const initials = (name) =>
    name?.trim()?.split(/\s+/)?.map((x) => x[0])?.join("")?.slice(0, 2)?.toUpperCase() || "U";

  const selectedPharmacyName = useMemo(() => {
    return pharmacies.find((p) => p.pharmacy_id === form.pharmacy)?.name || "";
  }, [form.pharmacy, pharmacies]);

  return (
    <div className="ap-page">
      <div className="ap-head">
        <div>
          <div className="ap-kicker">Administration</div>
          <h1 className="ap-title">User Management</h1>
          <div className="ap-sub">Create doctor, pharmacy, and admin accounts with role-based control.</div>
        </div>

        <div className="ap-head-actions">
          <button className="ap-btn ap-btn-secondary" onClick={loadUsers}>Refresh</button>
          <button className="ap-btn ap-btn-primary" onClick={resetForm}>New User</button>
        </div>
      </div>

      {msg.text && <div className={`ap-banner ap-banner-${msg.type}`}>{msg.text}</div>}

      <div className="ap-grid-2">
        <div className="ap-card">
          <div className="ap-card-head">
            <div className="ap-card-title">Users</div>
            <div className="ap-muted">{loading ? "Loading..." : `${users.length} records`}</div>
          </div>

          <div className="ap-toolbar">
            <input
              className="ap-input"
              placeholder="Search username, name, or email..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />

            <select className="ap-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="">All Roles</option>
              <option value="DOCTOR">Doctor</option>
              <option value="PHARMACY">Pharmacy</option>
              <option value="ADMIN">Admin</option>
            </select>

            <select className="ap-select" value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div className="ap-table-wrap">
            <table className="ap-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Pharmacy</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className={`ap-row-click ${selected?.id === u.id ? "ap-row-active" : ""}`}
                    onClick={() => startEdit(u)}
                  >
                    <td>
                      <div className="ap-userbox">
                        <div className="ap-avatar">{initials(u.first_name || u.username)}</div>
                        <div>
                          <div style={{ fontWeight: 800 }}>{u.first_name || u.last_name ? `${u.first_name} ${u.last_name}`.trim() : u.username}</div>
                          <div className="ap-muted">@{u.username}</div>
                          <div className="ap-muted">{u.email || "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={roleChip(u.role)}>{u.role}</span></td>
                    <td>{u.pharmacy_name || "—"}</td>
                    <td>
                      <span className={u.is_active ? "ap-chip ap-chip-green" : "ap-chip ap-chip-red"}>
                        {u.is_active ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                  </tr>
                ))}

                {!loading && users.length === 0 && (
                  <tr>
                    <td colSpan="4" className="ap-empty">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="ap-card">
          <div className="ap-card-head">
            <div className="ap-card-title">{selected ? "Edit User" : "Create User"}</div>
            {selected && <div className="ap-code">ID: {selected.id}</div>}
          </div>

          <div className="ap-form">
            <div className="ap-form-grid">
              <div className="ap-field">
                <label className="ap-label">Username</label>
                <input className="ap-input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
              </div>

              <div className="ap-field">
                <label className="ap-label">{selected ? "New Password (optional)" : "Password"}</label>
                <input className="ap-input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>

              <div className="ap-field">
                <label className="ap-label">First Name</label>
                <input className="ap-input" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              </div>

              <div className="ap-field">
                <label className="ap-label">Last Name</label>
                <input className="ap-input" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
              </div>

              <div className="ap-field ap-field-full">
                <label className="ap-label">Email</label>
                <input className="ap-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>

              <div className="ap-field">
                <label className="ap-label">Role</label>
                <select className="ap-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="DOCTOR">Doctor</option>
                  <option value="PHARMACY">Pharmacy</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="ap-field">
                <label className="ap-label">Account Status</label>
                <select className="ap-select" value={String(form.is_active)} onChange={(e) => setForm({ ...form, is_active: e.target.value === "true" })}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              {form.role === "DOCTOR" && (
                <div className="ap-field ap-field-full">
                  <label className="ap-label">Doctor Registration No</label>
                  <input className="ap-input" value={form.doctor_reg_no} onChange={(e) => setForm({ ...form, doctor_reg_no: e.target.value })} />
                </div>
              )}

              {form.role === "PHARMACY" && (
                <div className="ap-field ap-field-full">
                  <label className="ap-label">Assign Pharmacy</label>
                  <select className="ap-select" value={form.pharmacy} onChange={(e) => setForm({ ...form, pharmacy: e.target.value })}>
                    <option value="">Select Pharmacy</option>
                    {pharmacies.map((p) => (
                      <option key={p.pharmacy_id} value={p.pharmacy_id}>
                        {p.name} {p.hospital_branch ? `— ${p.hospital_branch}` : ""}
                      </option>
                    ))}
                  </select>
                  {selectedPharmacyName && <div className="ap-muted">Selected: {selectedPharmacyName}</div>}
                </div>
              )}
            </div>

            <div className="ap-form-actions">
              <button className="ap-btn ap-btn-primary" onClick={save} disabled={saving}>
                {saving ? "Saving..." : selected ? "Update User" : "Create User"}
              </button>

              <button className="ap-btn ap-btn-secondary" onClick={resetForm}>
                Clear
              </button>

              {selected && (
                <button className="ap-btn ap-btn-danger" onClick={remove}>
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
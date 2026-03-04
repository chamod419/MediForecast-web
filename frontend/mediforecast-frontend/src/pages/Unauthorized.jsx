import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <div style={{ padding: 30 }}>
      <h2>403 — Unauthorized</h2>
      <p>You don’t have permission to access this portal.</p>
      <Link to="/login">Go to Login</Link>
    </div>
  );
}
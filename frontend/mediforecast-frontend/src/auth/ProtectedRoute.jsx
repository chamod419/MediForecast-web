import { Navigate } from "react-router-dom";

const roleHomeMap = {
  DOCTOR: "/doctor",
  PHARMACY: "/pharmacy",
  ADMIN: "/admin/dashboard",
};

export default function ProtectedRoute({ allowedRoles, children }) {
  const access = localStorage.getItem("access");
  const role = localStorage.getItem("role");

  if (!access) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={roleHomeMap[role] || "/unauthorized"} replace />;
  }

  return children;
}
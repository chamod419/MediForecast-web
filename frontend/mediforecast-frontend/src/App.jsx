import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import DoctorCreatePrescription from "./pages/DoctorCreatePrescription";
import DoctorHistory from "./pages/DoctorHistory";
import PharmacyQueue from "./pages/PharmacyQueue";
import PrescriptionPrint from "./pages/PrescriptionPrint";
import Unauthorized from "./pages/Unauthorized";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./auth/ProtectedRoute";

import DoctorChangePassword from "./pages/DoctorChangePassword";
import PharmacyChangePassword from "./pages/PharmacyChangePassword";
import PharmacyInventory from "./pages/PharmacyInventory";
import PharmacyPrediction from "./pages/PharmacyPrediction";

import AdminShell from "./components/admin/AdminShell";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPharmacies from "./pages/admin/AdminPharmacies";
import AdminDrugs from "./pages/admin/AdminDrugs";
import AdminPatients from "./pages/admin/AdminPatients";
import AdminPrescriptions from "./pages/admin/AdminPrescriptions";
import AdminInventory from "./pages/admin/AdminInventory";

function Layout({ children }) {
  return (
    <div style={{ background: "#1b1b1b", minHeight: "100vh", color: "#eee" }}>
      <Navbar />
      {children}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route
          path="/doctor"
          element={
            <ProtectedRoute allowedRoles={["DOCTOR"]}>
              <Layout>
                <DoctorCreatePrescription />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/doctor/history"
          element={
            <ProtectedRoute allowedRoles={["DOCTOR"]}>
              <Layout>
                <DoctorHistory />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/doctor/change-password"
          element={
            <ProtectedRoute allowedRoles={["DOCTOR"]}>
              <Layout>
                <DoctorChangePassword />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/pharmacy"
          element={
            <ProtectedRoute allowedRoles={["PHARMACY"]}>
              <Layout>
                <PharmacyQueue />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/pharmacy/change-password"
          element={
            <ProtectedRoute allowedRoles={["PHARMACY"]}>
              <Layout>
                <PharmacyChangePassword />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/pharmacy/inventory"
          element={
            <ProtectedRoute allowedRoles={["PHARMACY"]}>
              <Layout>
                <PharmacyInventory />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/pharmacy/prediction"
          element={
            <ProtectedRoute allowedRoles={["PHARMACY"]}>
              <Layout>
                <PharmacyPrediction />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/prescriptions/:id/print"
          element={
            <ProtectedRoute allowedRoles={["DOCTOR"]}>
              <PrescriptionPrint />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="pharmacies" element={<AdminPharmacies />} />
          <Route path="drugs" element={<AdminDrugs />} />
          <Route path="patients" element={<AdminPatients />} />
          <Route path="prescriptions" element={<AdminPrescriptions />} />
          <Route path="inventory" element={<AdminInventory />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
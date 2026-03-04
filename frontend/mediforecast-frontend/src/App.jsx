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
        {/* Default */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Doctor Routes */}
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

        {/* Pharmacy Route */}
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

        {/* Print Route (Doctor only) */}
        <Route
          path="/prescriptions/:id/print"
          element={
            <ProtectedRoute allowedRoles={["DOCTOR"]}>
              <PrescriptionPrint />
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

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
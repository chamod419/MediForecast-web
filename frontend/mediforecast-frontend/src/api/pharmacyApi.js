import { api } from "./client";
import axios from "axios";

export async function fetchPharmacyQueue(status = "PENDING") {
  const res = await api.get(`/prescriptions/queue/?status=${encodeURIComponent(status)}&format=json`);
  return res.data;
}

export async function dispensePrescription(prescriptionId) {
  const res = await api.post(`/prescriptions/${prescriptionId}/dispense/`);
  return res.data;
}

export async function updatePrescriptionStatus(prescriptionId, status, reason = "") {
  const res = await api.patch(`/prescriptions/${prescriptionId}/status/`, { status, reason });
  return res.data;
}

export async function exportDispensedPrescriptions() {
  const res = await api.get("/prescriptions/export/", { responseType: "blob" });
  return res.data;
}

export async function getPrediction(file, cancelToken) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post("/inventory/predict/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    cancelToken,
  });

  return res.data;
}
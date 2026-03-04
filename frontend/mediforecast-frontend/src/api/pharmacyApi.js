import { api } from "./client";

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
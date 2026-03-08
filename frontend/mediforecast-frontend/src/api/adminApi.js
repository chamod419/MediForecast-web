import { api } from "./client";

/* Dashboard */
export async function getAdminDashboard() {
  const res = await api.get("/admin/dashboard/");
  return res.data;
}

/* Users */
export async function listAdminUsers(params = {}) {
  const res = await api.get("/admin/users/", { params });
  return res.data;
}

export async function createAdminUser(payload) {
  const res = await api.post("/admin/users/", payload);
  return res.data;
}

export async function updateAdminUser(id, payload) {
  const res = await api.patch(`/admin/users/${id}/`, payload);
  return res.data;
}

export async function deleteAdminUser(id) {
  const res = await api.delete(`/admin/users/${id}/`);
  return res.data;
}

/* Pharmacies */
export async function listAdminPharmacies(params = {}) {
  const res = await api.get("/admin/pharmacies/", { params });
  return res.data;
}

export async function createAdminPharmacy(payload) {
  const res = await api.post("/admin/pharmacies/", payload);
  return res.data;
}

export async function updateAdminPharmacy(id, payload) {
  const res = await api.patch(`/admin/pharmacies/${id}/`, payload);
  return res.data;
}

export async function deleteAdminPharmacy(id) {
  const res = await api.delete(`/admin/pharmacies/${id}/`);
  return res.data;
}

/* Drugs */
export async function listAdminDrugs(params = {}) {
  const res = await api.get("/admin/drugs/", { params });
  return res.data;
}

export async function createAdminDrug(payload) {
  const res = await api.post("/admin/drugs/", payload);
  return res.data;
}

export async function updateAdminDrug(id, payload) {
  const res = await api.patch(`/admin/drugs/${id}/`, payload);
  return res.data;
}

export async function deleteAdminDrug(id) {
  const res = await api.delete(`/admin/drugs/${id}/`);
  return res.data;
}

/* Patients */
export async function listAdminPatients(params = {}) {
  const res = await api.get("/admin/patients/", { params });
  return res.data;
}

export async function getAdminPatient(id) {
  const res = await api.get(`/admin/patients/${id}/`);
  return res.data;
}

/* Prescriptions */
export async function listAdminPrescriptions(params = {}) {
  const res = await api.get("/admin/prescriptions/", { params });
  return res.data;
}

export async function getAdminPrescription(id) {
  const res = await api.get(`/admin/prescriptions/${id}/`);
  return res.data;
}

/* Inventory */
export async function listAdminInventory(params = {}) {
  const res = await api.get("/admin/inventory/", { params });
  return res.data;
}

export async function updateAdminInventory(id, payload) {
  const res = await api.patch(`/admin/inventory/${id}/`, payload);
  return res.data;
}


export async function createAdminPatient(payload) {
  const res = await api.post("/admin/patients/", payload);
  return res.data;
}

export async function updateAdminPatient(id, payload) {
  const res = await api.patch(`/admin/patients/${id}/`, payload);
  return res.data;
}

export async function deleteAdminPatient(id) {
  const res = await api.delete(`/admin/patients/${id}/`);
  return res.data;
}
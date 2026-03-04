import { api } from "./client";

export const fetchPharmacies = async () =>
  (await api.get("/pharmacies/?format=json")).data;

export const searchPatients = async (q) =>
  (await api.get(`/patients/?format=json&q=${encodeURIComponent(q)}`)).data;

export const createPatient = async (payload) =>
  (await api.post("/patients/", payload)).data;

export const searchDrugs = async (q) =>
  (await api.get(`/drugs/?format=json&q=${encodeURIComponent(q)}`)).data;

export const createPrescription = async (payload) =>
  (await api.post("/prescriptions/", payload)).data;

// ✅ MUST HAVE (stock check)
export const checkAvailability = async (pharmacy_id, drug_id) =>
  (
    await api.get(
      `/inventory/availability/?format=json&pharmacy_id=${pharmacy_id}&drug_id=${drug_id}`
    )
  ).data;

// ✅ For print page (if you added)
export const getPrescriptionById = async (id) =>
  (await api.get(`/prescriptions/${id}/?format=json`)).data;
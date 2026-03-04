import { api } from "./client";

export async function loginDoctor(username, password) {
  const res = await api.post("/auth/doctor/login/", { username, password });
  return res.data;
}

export async function doctorChangePassword(old_password, new_password, confirm_password) {
  const res = await api.post("/auth/doctor/change-password/", {
    old_password,
    new_password,
    confirm_password,
  });
  return res.data;
}

export async function loginPharmacy(username, password) {
  const res = await api.post("/auth/pharmacy/login/", { username, password });
  return res.data;
}

export async function pharmacyChangePassword(old_password, new_password, confirm_password) {
  const res = await api.post("/auth/pharmacy/change-password/", {
    old_password,
    new_password,
    confirm_password,
  });
  return res.data;
}

export function logout() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("role");
  localStorage.removeItem("pharmacy_id");
  localStorage.removeItem("full_name");
  localStorage.removeItem("username");
}
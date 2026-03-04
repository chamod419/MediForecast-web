import { api } from "./client";

// list inventory (pharmacy derived from logged-in profile)
export async function listInventory() {
  const res = await api.get("/inventory/?format=json");
  return res.data;
}

// update one inventory row (PATCH)
export async function updateInventory(inventoryId, patch) {
  const res = await api.patch(`/inventory/${inventoryId}/`, patch);
  return res.data;
}

// download excel (blob)
export async function exportInventoryExcel() {
  const res = await api.get("/inventory/export/", { responseType: "blob" });
  return res.data;
}

// upload excel (multipart/form-data)
export async function importInventoryExcel(file) {
  const form = new FormData();
  form.append("file", file);

  const res = await api.post("/inventory/import/", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}
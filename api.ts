
import type { Medicine, MedicineData } from "./components/MedicineForm";

const API_URL = "http://127.0.0.1:8000/api/medicines";

function toFrontendMedicine(item: any): Medicine {
  return {
    id: item.id,
    name: item.name,
    batchNo: item.batch_no,
    tabletsPerStrip: item.tablets_per_strip,
    stripsInStock: item.strips_in_stock,
    looseTablets: item.loose_tablets,
    stripPrice: Number(item.strip_price),
    stripDiscount: Number(item.strip_discount),
    tabletDiscount: Number(item.tablet_discount),
    expiry: String(item.expiry).slice(0, 10),
  };
}

function toBackendMedicine(item: MedicineData) {
  return {
    name: item.name,
    batch_no: item.batchNo,
    tablets_per_strip: item.tabletsPerStrip,
    strips_in_stock: item.stripsInStock,
    loose_tablets: item.looseTablets,
    strip_price: item.stripPrice,
    strip_discount: item.stripDiscount,
    tablet_discount: item.tabletDiscount,
    expiry: item.expiry,
  };
}

async function request(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.detail ?? "Something went wrong.");
  }

  return response.status === 204 ? null : response.json();
}

export async function getMedicines(): Promise<Medicine[]> {
  const data = await request(API_URL);
  return data.map(toFrontendMedicine);
}

export async function addMedicine(item: MedicineData): Promise<Medicine> {
  const data = await request(API_URL, {
    method: "POST",
    body: JSON.stringify(toBackendMedicine(item)),
  });

  return toFrontendMedicine(data);
}

export async function updateMedicine(
  id: number,
  item: MedicineData
): Promise<Medicine> {
  const data = await request(`${API_URL}/${id}`, {
    method: "PUT",
    body: JSON.stringify(toBackendMedicine(item)),
  });

  return toFrontendMedicine(data);
}

export async function deleteMedicine(id: number): Promise<void> {
  await request(`${API_URL}/${id}`, { method: "DELETE" });
}

export async function saveSale(
  items: { medicine_id: number; tablets_sold: number }[]
): Promise<void> {
  await request("http://127.0.0.1:8000/api/sales", {
    method: "POST",
    body: JSON.stringify({ items }),
  });
}

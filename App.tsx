
import { useEffect, useState } from "react";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import MedicineForm from "./components/MedicineForm";
import MedicineTable from "./components/MedicineTable";
import SalesPage from "./components/SalesPage";
import type { Medicine, MedicineData } from "./components/MedicineForm";
import {
  getMedicines,
  addMedicine,
  updateMedicine,
  deleteMedicine as deleteMedicineAPI,
} from "./api";
import "./App.css";
import { saveSale } from "./api";

interface CartItem {
  medicineId: number;
  medicineName: string;
  batchNo: string;
  saleType: "strip" | "tablet";
  units: number;
  tabletsSold: number;
  unitPrice: number;
  total: number;
}

function App() {
  const [page, setPage] = useState<"admin" | "sales">("admin");
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [editingMedicine, setEditingMedicine] =
    useState<Medicine | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load saved medicines from MySQL through FastAPI.
  async function loadMedicines() {
    try {
      setError("");
      const data = await getMedicines();
      setMedicines(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load medicines."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMedicines();
  }, []);

  // Add a new medicine or update an existing medicine.
  async function saveMedicine(data: MedicineData) {
    try {
      setError("");

      if (editingMedicine) {
        await updateMedicine(editingMedicine.id, data);
        setEditingMedicine(null);
      } else {
        await addMedicine(data);
      }

      await loadMedicines();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to save medicine.";

      setError(message);
      alert(message);
    }
  }

  // Delete a medicine from the database.
  async function handleDeleteMedicine(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this medicine batch?"
    );

    if (!confirmed) return;

    try {
      setError("");
      await deleteMedicineAPI(id);

      setMedicines((previous) =>
        previous.filter((medicine) => medicine.id !== id)
      );

      if (editingMedicine?.id === id) {
        setEditingMedicine(null);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to delete medicine.";

      setError(message);
      alert(message);
    }
  }

  // Temporary frontend-only sales logic.
  // We will connect sales to the database in the next step.
  

async function completeSale(items: CartItem[]): Promise<boolean> {
  try {
    const quantities = new Map<number, number>();

    for (const item of items) {
      quantities.set(
        item.medicineId,
        (quantities.get(item.medicineId) ?? 0) + item.tabletsSold
      );
    }

    await saveSale(
      Array.from(quantities, ([medicine_id, tablets_sold]) => ({
        medicine_id,
        tablets_sold,
      }))
    );

    await loadMedicines();
    return true;
  } catch (error) {
    alert(
      error instanceof Error
        ? error.message
        : "Could not complete the sale."
    );
    return false;
  }
}



  const filteredMedicines = medicines.filter(
    (medicine) =>
      medicine.name.toLowerCase().includes(search.toLowerCase()) ||
      medicine.batchNo.toLowerCase().includes(search.toLowerCase())
  );

  const totalStock = medicines.reduce(
    (total, medicine) =>
      total +
      medicine.stripsInStock * medicine.tabletsPerStrip +
      medicine.looseTablets,
    0
  );

  const today = new Date().toISOString().slice(0, 10);

  const expiredMedicines = medicines.filter(
    (medicine) => medicine.expiry < today
  ).length;

  return (
    <>
      <Header />

      <nav className="main-nav">
        <button
          type="button"
          className={page === "admin" ? "nav-button active" : "nav-button"}
          onClick={() => setPage("admin")}
        >
          Admin Page
        </button>

        <button
          type="button"
          className={page === "sales" ? "nav-button active" : "nav-button"}
          onClick={() => setPage("sales")}
        >
          Sales Page
        </button>
      </nav>

      {error && (
        <div role="alert" className="error-message">
          {error}
          <button type="button" onClick={() => void loadMedicines()}>
            Retry
          </button>
        </div>
      )}

      {page === "admin" ? (
        <main className="container">
          <Dashboard
            totalMedicines={medicines.length}
            totalStock={totalStock}
            expiredMedicines={expiredMedicines}
          />

          {loading ? (
            <p>Loading medicines...</p>
          ) : (
            <>
              <MedicineForm
                onAddMedicine={saveMedicine}
                editingMedicine={editingMedicine}
                onCancel={() => setEditingMedicine(null)}
              />

              <section className="records">
                <h2>Search Medicine Records</h2>

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by medicine name or batch number"
                />

                <MedicineTable
                  medicines={filteredMedicines}
                  onEdit={setEditingMedicine}
                  onDelete={handleDeleteMedicine}
                />
              </section>
            </>
          )}
        </main>
      ) : (
        <SalesPage
          medicines={medicines}
          onCompleteSale={completeSale}
        />
      )}
    </>
  );
}

export default App;


import { useState } from "react";
import type { Medicine } from "./MedicineForm";

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

interface SalesPageProps {
  medicines: Medicine[];
  onCompleteSale: (items: CartItem[]) => Promise<boolean>;
}

function SalesPage({ medicines, onCompleteSale }: SalesPageProps) {
  const [medicineId, setMedicineId] = useState("");
  const [saleType, setSaleType] = useState<"strip" | "tablet">("strip");
  const [units, setUnits] = useState("1");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const selectedMedicine = medicines.find(
    (medicine) => medicine.id === Number(medicineId)
  );

  function addToCart() {
    setMessage("");

    if (!selectedMedicine) {
      setMessage("Please select a medicine batch.");
      return;
    }

    if (selectedMedicine.expiry < today) {
      setMessage("This batch has expired and cannot be sold.");
      return;
    }

    const quantity = Number(units);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setMessage("Enter a valid quantity.");
      return;
    }

    const tabletsSold =
      saleType === "strip"
        ? quantity * selectedMedicine.tabletsPerStrip
        : quantity;

    const availableTablets =
      selectedMedicine.stripsInStock *
        selectedMedicine.tabletsPerStrip +
      selectedMedicine.looseTablets;

    // Include quantities already in the cart for this batch.
    const alreadyInCart = cart
      .filter((item) => item.medicineId === selectedMedicine.id)
      .reduce((sum, item) => sum + item.tabletsSold, 0);

    if (tabletsSold + alreadyInCart > availableTablets) {
      setMessage(
        `Only ${availableTablets - alreadyInCart} more tablets can be added for this batch.`
      );
      return;
    }

    const pricePerTablet =
      selectedMedicine.stripPrice / selectedMedicine.tabletsPerStrip;

    const discount =
      saleType === "strip"
        ? selectedMedicine.stripDiscount
        : selectedMedicine.tabletDiscount;

    const unitPrice =
      saleType === "strip"
        ? selectedMedicine.stripPrice
        : pricePerTablet;

    const total = Number(
      (quantity * unitPrice * (1 - discount / 100)).toFixed(2)
    );

    const newItem: CartItem = {
      medicineId: selectedMedicine.id,
      medicineName: selectedMedicine.name,
      batchNo: selectedMedicine.batchNo,
      saleType,
      units: quantity,
      tabletsSold,
      unitPrice,
      total,
    };

    setCart((previous) => [...previous, newItem]);
    setUnits("1");
    setMessage("Item added to cart.");
  }

  // Save the sale in MySQL through the backend.
  async function completeSale() {
    if (cart.length === 0) {
      setMessage("Add at least one item before completing the sale.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      const success = await onCompleteSale(cart);

      if (success) {
        setCart([]);
        setMessage("Sale completed successfully! Stock has been updated.");
      } else {
        setMessage("Sale failed. Please check stock and expiry dates.");
      }
    } catch {
      setMessage("Unable to complete the sale. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  const grandTotal = cart.reduce((sum, item) => sum + item.total, 0);

  return (
    <main className="container">
      <section className="panel">
        <h2>Medicine Sales</h2>

        <div className="medicine-form">
          <label>
            Select Medicine Batch
            <select
              value={medicineId}
              onChange={(event) => setMedicineId(event.target.value)}
            >
              <option value="">Choose a medicine</option>

              {medicines
                .filter(
                  (medicine) =>
                    medicine.expiry >= today &&
                    medicine.stripsInStock * medicine.tabletsPerStrip +
                      medicine.looseTablets >
                      0
                )
                .map((medicine) => (
                  <option key={medicine.id} value={medicine.id}>
                    {medicine.name} - Batch: {medicine.batchNo}
                  </option>
                ))}
            </select>
          </label>

          {selectedMedicine && (
            <p>
              Available:{" "}
              {selectedMedicine.stripsInStock *
                selectedMedicine.tabletsPerStrip +
                selectedMedicine.looseTablets}{" "}
              tablets | Expiry: {selectedMedicine.expiry}
            </p>
          )}

          <label>
            Sale Type
            <select
              value={saleType}
              onChange={(event) =>
                setSaleType(event.target.value as "strip" | "tablet")
              }
            >
              <option value="strip">Full strips</option>
              <option value="tablet">Individual tablets</option>
            </select>
          </label>

          <label>
            {saleType === "strip" ? "Number of Strips" : "Number of Tablets"}
            <input
              type="number"
              min="1"
              step="1"
              value={units}
              onChange={(event) => setUnits(event.target.value)}
            />
          </label>

          {selectedMedicine && (
            <p>
              Discount:{" "}
              {saleType === "strip"
                ? selectedMedicine.stripDiscount
                : selectedMedicine.tabletDiscount}
              %
            </p>
          )}

          <button type="button" onClick={addToCart} disabled={isSaving}>
            Add to Cart
          </button>
        </div>

        {message && <p role="status">{message}</p>}
      </section>

      <section className="panel">
        <h2>Sales Cart</h2>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Batch</th>
                <th>Sale Type</th>
                <th>Quantity</th>
                <th>Tablets Deducted</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {cart.map((item, index) => (
                <tr key={`${item.medicineId}-${index}`}>
                  <td>{item.medicineName}</td>
                  <td>{item.batchNo}</td>
                  <td>{item.saleType}</td>
                  <td>{item.units}</td>
                  <td>{item.tabletsSold}</td>
                  <td>₹{item.total.toFixed(2)}</td>
                  <td>
                    <button
                      type="button"
                      className="delete-button"
                      disabled={isSaving}
                      onClick={() =>
                        setCart((previous) =>
                          previous.filter((_, i) => i !== index)
                        )
                      }
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}

              {cart.length === 0 && (
                <tr>
                  <td colSpan={7}>Your cart is empty.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <h3>Grand Total: ₹{grandTotal.toFixed(2)}</h3>

        <button
          type="button"
          onClick={completeSale}
          disabled={isSaving || cart.length === 0}
        >
          {isSaving ? "Saving Sale..." : "Complete Sale"}
        </button>
      </section>
    </main>
  );
}

export default SalesPage;

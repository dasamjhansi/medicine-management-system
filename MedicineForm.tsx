
import { useEffect, useState } from "react";

export interface Medicine {
  id: number;
  name: string;
  batchNo: string;
  tabletsPerStrip: number;
  stripsInStock: number;
  looseTablets: number;
  stripPrice: number;
  stripDiscount: number;
  tabletDiscount: number;
  expiry: string;
}

export type MedicineData = Omit<Medicine, "id">;

interface MedicineFormProps {
  onAddMedicine: (medicine: MedicineData) => void;
  editingMedicine: Medicine | null;
  onCancel: () => void;
}

function MedicineForm({
  onAddMedicine,
  editingMedicine,
  onCancel,
}: MedicineFormProps) {
  const [name, setName] = useState("");
  const [batchNo, setBatchNo] = useState("");
  const [tabletsPerStrip, setTabletsPerStrip] = useState("10");
  const [stripsInStock, setStripsInStock] = useState("0");
  const [looseTablets, setLooseTablets] = useState("0");
  const [stripPrice, setStripPrice] = useState("");
  const [stripDiscount, setStripDiscount] = useState("0");
  const [tabletDiscount, setTabletDiscount] = useState("0");
  const [expiry, setExpiry] = useState("");

  useEffect(() => {
    if (editingMedicine) {
      setName(editingMedicine.name);
      setBatchNo(editingMedicine.batchNo);
      setTabletsPerStrip(String(editingMedicine.tabletsPerStrip));
      setStripsInStock(String(editingMedicine.stripsInStock));
      setLooseTablets(String(editingMedicine.looseTablets));
      setStripPrice(String(editingMedicine.stripPrice));
      setStripDiscount(String(editingMedicine.stripDiscount));
      setTabletDiscount(String(editingMedicine.tabletDiscount));
      setExpiry(editingMedicine.expiry);
    } else {
      setName("");
      setBatchNo("");
      setTabletsPerStrip("10");
      setStripsInStock("0");
      setLooseTablets("0");
      setStripPrice("");
      setStripDiscount("0");
      setTabletDiscount("0");
      setExpiry("");
    }
  }, [editingMedicine]);

  const totalTablets =
    Number(stripsInStock) * Number(tabletsPerStrip) +
    Number(looseTablets);

  const tabletPrice =
    Number(tabletsPerStrip) > 0
      ? Number(stripPrice || 0) / Number(tabletsPerStrip)
      : 0;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const size = Number(tabletsPerStrip);
    const strips = Number(stripsInStock);
    const loose = Number(looseTablets);
    const price = Number(stripPrice);
    const stripOff = Number(stripDiscount);
    const tabletOff = Number(tabletDiscount);

    if (!name.trim() || !batchNo.trim() || !expiry) {
      alert("Please enter medicine name, batch number, and expiry date.");
      return;
    }

    if (
      !Number.isInteger(size) ||
      size < 1 ||
      !Number.isInteger(strips) ||
      strips < 0 ||
      !Number.isInteger(loose) ||
      loose < 0 ||
      loose >= size ||
      !Number.isFinite(price) ||
      price <= 0 ||
      !Number.isFinite(stripOff) ||
      stripOff < 0 ||
      stripOff > 100 ||
      !Number.isFinite(tabletOff) ||
      tabletOff < 0 ||
      tabletOff > 100
    ) {
      alert(
        "Check the strip size, stock, price, and discounts. Discounts must be between 0 and 100%."
      );
      return;
    }

    onAddMedicine({
      name: name.trim(),
      batchNo: batchNo.trim(),
      tabletsPerStrip: size,
      stripsInStock: strips,
      looseTablets: loose,
      stripPrice: price,
      stripDiscount: stripOff,
      tabletDiscount: tabletOff,
      expiry,
    });
  }

  return (
    <section className="panel">
      <h2>{editingMedicine ? "Edit Medicine Batch" : "Add Medicine Batch"}</h2>

      <form className="medicine-form" onSubmit={handleSubmit}>
        <label>
          Medicine Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Paracetamol"
            required
          />
        </label>

        <label>
          Batch Number
          <input
            value={batchNo}
            onChange={(e) => setBatchNo(e.target.value)}
            placeholder="e.g. PCM2026001"
            required
          />
        </label>

        <label>
          Tablets per Strip
          <input
            type="number"
            min="1"
            step="1"
            value={tabletsPerStrip}
            onChange={(e) => setTabletsPerStrip(e.target.value)}
            required
          />
        </label>

        <label>
          Full Strips in Stock
          <input
            type="number"
            min="0"
            step="1"
            value={stripsInStock}
            onChange={(e) => setStripsInStock(e.target.value)}
            required
          />
        </label>

        <label>
          Loose Tablets
          <input
            type="number"
            min="0"
            step="1"
            value={looseTablets}
            onChange={(e) => setLooseTablets(e.target.value)}
            required
          />
        </label>

        <label>
          Price per Strip (₹)
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={stripPrice}
            onChange={(e) => setStripPrice(e.target.value)}
            placeholder="20"
            required
          />
        </label>

        <label>
          Price per Tablet (₹)
          <input value={`₹${tabletPrice.toFixed(2)}`} readOnly />
        </label>

        <label>
          Strip Discount (%)
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={stripDiscount}
            onChange={(e) => setStripDiscount(e.target.value)}
            required
          />
        </label>

        <label>
          Tablet Discount (%)
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={tabletDiscount}
            onChange={(e) => setTabletDiscount(e.target.value)}
            required
          />
        </label>

        <label>
          Expiry Date
          <input
            type="date"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            required
          />
        </label>

        <div className="stock-preview">
          <strong>Total stock: {totalTablets} tablets</strong>
        </div>

        <div className="form-actions">
          <button type="submit">
            {editingMedicine ? "Update Batch" : "Add Batch"}
          </button>

          {editingMedicine && (
            <button type="button" onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

export default MedicineForm;

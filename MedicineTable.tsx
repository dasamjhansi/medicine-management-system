
import type { Medicine } from "./MedicineForm";

interface MedicineTableProps {
  medicines: Medicine[];
  onEdit: (medicine: Medicine) => void;
  onDelete: (id: number) => void;
}

function MedicineTable({
  medicines,
  onEdit,
  onDelete,
}: MedicineTableProps) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <section className="panel">
      <h2>Medicine Records</h2>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Batch No.</th>
              <th>Strip Size</th>
              <th>Full Strips</th>
              <th>Loose Tablets</th>
              <th>Total Tablets</th>
              <th>Strip Price</th>
              <th>Tablet Price</th>
              <th>Strip Discount</th>
              <th>Tablet Discount</th>
              <th>Expiry Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {medicines.map((medicine) => {
              const total =
                medicine.stripsInStock * medicine.tabletsPerStrip +
                medicine.looseTablets;

              const expired = medicine.expiry < today;

              return (
                <tr key={medicine.id}>
                  <td>{medicine.name}</td>
                  <td>{medicine.batchNo}</td>
                  <td>{medicine.tabletsPerStrip}</td>
                  <td>{medicine.stripsInStock}</td>
                  <td>{medicine.looseTablets}</td>
                  <td>{total}</td>
                  <td>₹{medicine.stripPrice.toFixed(2)}</td>
                  <td>
                    ₹
                    {(
                      medicine.stripPrice / medicine.tabletsPerStrip
                    ).toFixed(2)}
                  </td>
                  <td>{medicine.stripDiscount}%</td>
                  <td>{medicine.tabletDiscount}%</td>
                  <td>{medicine.expiry}</td>
                  <td>
                    {expired
                      ? "Expired"
                      : total === 0
                        ? "Out of stock"
                        : "Available"}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button type="button" onClick={() => onEdit(medicine)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="delete-button"
                        onClick={() => onDelete(medicine.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {medicines.length === 0 && (
              <tr>
                <td colSpan={13}>No medicine records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default MedicineTable;

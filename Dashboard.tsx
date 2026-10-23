
interface DashboardProps {
  totalMedicines: number;
  totalStock: number;
  expiredMedicines: number;
}

function Dashboard({
  totalMedicines,
  totalStock,
  expiredMedicines,
}: DashboardProps) {
  return (
    <section className="dashboard">
      <div className="dashboard-card">
        <h3>Total Medicines</h3>
        <p>{totalMedicines}</p>
      </div>

      <div className="dashboard-card">
        <h3>Total Stock</h3>
        <p>{totalStock} tablets</p>
      </div>

      <div className="dashboard-card">
        <h3>Expired Batches</h3>
        <p>{expiredMedicines}</p>
      </div>
    </section>
  );
}

export default Dashboard;

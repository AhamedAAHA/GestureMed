export default function StatCard({ title, value, icon, variant = 'default' }) {
  return (
    <div className={`stat-card glass-card stat-${variant}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <p className="stat-value">{value ?? 0}</p>
        <p className="stat-title">{title}</p>
      </div>
    </div>
  );
}

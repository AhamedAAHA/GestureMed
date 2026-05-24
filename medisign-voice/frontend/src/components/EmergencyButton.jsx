export default function EmergencyButton({ label, icon, onClick, variant = 'default' }) {
  return (
    <button type="button" className={`emergency-btn emergency-${variant}`} onClick={onClick}>
      <span className="emergency-icon">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

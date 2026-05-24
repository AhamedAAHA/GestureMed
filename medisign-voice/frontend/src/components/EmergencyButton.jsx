export default function EmergencyButton({ label, icon, onClick, variant = 'default', disabled = false }) {
  return (
    <button
      type="button"
      className={`emergency-btn emergency-${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="emergency-icon">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

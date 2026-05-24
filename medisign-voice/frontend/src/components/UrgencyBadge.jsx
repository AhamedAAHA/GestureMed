export default function UrgencyBadge({ urgency }) {
  const level = (urgency || 'Normal').toLowerCase();
  return <span className={`urgency-badge urgency-${level}`}>{urgency || 'Normal'}</span>;
}

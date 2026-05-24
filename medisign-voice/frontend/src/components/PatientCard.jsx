import UrgencyBadge from './UrgencyBadge';

export default function PatientCard({ patient, urgency }) {
  if (!patient) return null;
  const ward = patient.wardId?.name || patient.wardId;
  return (
    <div className={`patient-card glass-card ${urgency === 'Emergency' ? 'pulse-emergency' : ''}`}>
      <div className="patient-card-header">
        <h4>{patient.name}</h4>
        {urgency && <UrgencyBadge urgency={urgency} />}
      </div>
      <div className="patient-card-body">
        <p>
          <strong>Room:</strong> {patient.roomNumber || '—'} {ward && `· ${ward}`}
        </p>
        <p>
          <strong>Blood:</strong> {patient.bloodGroup || '—'}
        </p>
        <p>
          <strong>Condition:</strong> {patient.medicalCondition || '—'}
        </p>
        {patient.allergies?.length > 0 && (
          <p>
            <strong>Allergies:</strong> {patient.allergies.join(', ')}
          </p>
        )}
      </div>
    </div>
  );
}

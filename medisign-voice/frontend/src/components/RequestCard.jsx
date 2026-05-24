import UrgencyBadge from './UrgencyBadge';
import VoicePlayer from './VoicePlayer';
import PatientCard from './PatientCard';

export default function RequestCard({
  request,
  t,
  onHandled,
  onAddNote,
  onPlayVoice,
}) {
  const patient = request.patientId;
  const isEmergency = request.urgency === 'Emergency';

  return (
    <div
      className={`request-card glass-card ${isEmergency ? 'pulse-emergency' : ''} ${
        request.isPinned ? 'pinned' : ''
      }`}
    >
      {request.isPinned && <span className="pin-badge">📌 PINNED</span>}
      <div className="request-card-top">
        <div>
          <h4>{patient?.name || 'Unknown Patient'}</h4>
          <UrgencyBadge urgency={request.urgency} />
        </div>
        <span className={`status-pill status-${request.status}`}>{request.status}</span>
      </div>

      {isEmergency && patient && (
        <PatientCard patient={patient} urgency={request.urgency} />
      )}

      <div className="request-messages">
        <p className="msg-raw">
          <small>{t('rawMessage')}:</small> {request.rawMessage}
        </p>
        <p className="msg-improved">
          <small>{t('improvedMessage')}:</small> {request.improvedMessage}
        </p>
      </div>

      <div className="request-actions">
        <VoicePlayer
          request={request}
          label={t('playVoice')}
          onPlay={onPlayVoice}
        />
        {request.status === 'pending' && (
          <>
            <button type="button" className="btn btn-secondary" onClick={() => onAddNote(request)}>
              {t('addNote')}
            </button>
            <button type="button" className="btn btn-primary" onClick={() => onHandled(request._id)}>
              {t('markHandled')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

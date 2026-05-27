import { useCallback, useEffect, useRef, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import RequestCard from '../components/RequestCard';
import Modal from '../components/Modal';
import FormInput from '../components/FormInput';
import VoiceTranscription from '../components/VoiceTranscription';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { playAlertSound } from '../utils/voice';

export default function DoctorDashboard({ showToast }) {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [noteModal, setNoteModal] = useState(null);
  const [noteText, setNoteText] = useState('');
  const pendingRequestIds = useRef(new Set());
  const hasLoadedRequests = useRef(false);


  const loadRequests = useCallback(async () => {
    try {
      const params = {};
      if (filter !== 'all') {
        if (['Normal', 'Warning', 'Emergency'].includes(filter)) params.urgency = filter;
        else params.status = filter;
      }
      const [data, pendingData] = await Promise.all([
        api.requests.list(params),
        filter === 'all' ? Promise.resolve(null) : api.requests.list({ status: 'pending' }),
      ]);
      const pending = (pendingData || data).filter((request) => request.status === 'pending');
      const newRequests = hasLoadedRequests.current
        ? pending.filter((request) => !pendingRequestIds.current.has(request._id))
        : [];
      if (newRequests.length) {
        const hasEmergency = newRequests.some((request) => request.urgency === 'Emergency');
        const visibleRequestIds = new Set(data.map((request) => request._id));
        const hiddenByFilter = newRequests.some((request) => !visibleRequestIds.has(request._id));
        const message = hasEmergency
          ? 'New emergency patient request!'
          : 'New patient request received!';
        playAlertSound();
        showToast?.(
          hiddenByFilter ? `${message} Select All to view it.` : message,
          hasEmergency ? 'error' : 'success'
        );
      }
      pendingRequestIds.current = new Set(pending.map((request) => request._id));
      hasLoadedRequests.current = true;
      setRequests(data);
    } catch (err) {
      showToast?.(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [filter, showToast]);

  useEffect(() => {
    loadRequests();
    const interval = setInterval(loadRequests, 3000);
    return () => clearInterval(interval);
  }, [loadRequests]);

  const handleHandled = async (id) => {
    try {
      await api.requests.handled(id);
      showToast?.('Request marked as handled', 'success');
      loadRequests();
    } catch (err) {
      showToast?.(err.message, 'error');
    }
  };

  const handleSaveNote = async () => {
    if (!noteText.trim() || !noteModal) {
      showToast?.('Enter or dictate a medical note before saving.', 'error');
      return;
    }
    try {
      await api.notes.create({
        requestId: noteModal._id,
        patientId: noteModal.patientId._id || noteModal.patientId,
        content: noteText,
      });
      showToast?.('Medical note saved', 'success');
      setNoteModal(null);
      setNoteText('');
    } catch (err) {
      showToast?.(err.message, 'error');
    }
  };

  return (
    <DashboardLayout>
      <header className="page-header">
        <h1>{t('liveRequests')}</h1>
        <p>{t('welcomeBack')}, {user?.name}</p>
      </header>

      <div className="filter-bar glass-card">
        <span>{t('filterUrgency')}:</span>
        {['all', 'Emergency', 'Warning', 'Normal', 'pending', 'handled'].map((f) => (
          <button
            key={f}
            type="button"
            className={`filter-chip ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {t(f.toLowerCase()) || f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="page-center"><div className="spinner" /></div>
      ) : !requests.length ? (
        <div className="empty-state glass-card">{t('noData')}</div>
      ) : (
        <div className="requests-grid">
          {requests.map((req) => (
            <RequestCard
              key={req._id}
              request={req}
              t={t}
              onHandled={handleHandled}
              onAddNote={setNoteModal}
            />
          ))}
        </div>
      )}

      <Modal open={!!noteModal} onClose={() => setNoteModal(null)} title={t('addNote')}>
        <FormInput
          as="textarea"
          label={t('addNote')}
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          rows={4}
        />
        <VoiceTranscription
          onTranscript={(transcript) =>
            setNoteText((previous) => `${previous.trim()} ${transcript}`.trim())
          }
          language={lang}
          showToast={showToast}
        />
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={() => setNoteModal(null)}>
            {t('cancel')}
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSaveNote}>
            {t('save')}
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

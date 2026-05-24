import { useCallback, useEffect, useRef, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import RequestCard from '../components/RequestCard';
import Modal from '../components/Modal';
import FormInput from '../components/FormInput';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { playAlertSound } from '../utils/voice';

export default function DoctorDashboard({ showToast }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [noteModal, setNoteModal] = useState(null);
  const [noteText, setNoteText] = useState('');
  const lastEmergencyCount = useRef(0);

  const sidebarItems = [
    { to: '/doctor', labelKey: 'dashboard', icon: '🩺', end: true },
    { to: '/profile', labelKey: 'profile', icon: '👤' },
  ];

  const loadRequests = useCallback(async () => {
    try {
      const params = {};
      if (filter !== 'all') {
        if (['Normal', 'Warning', 'Emergency'].includes(filter)) params.urgency = filter;
        else params.status = filter;
      }
      const data = await api.requests.list(params);
      const emergencyPending = data.filter(
        (r) => r.urgency === 'Emergency' && r.status === 'pending'
      ).length;
      if (emergencyPending > lastEmergencyCount.current) {
        playAlertSound();
        showToast?.('🚨 New emergency patient request!', 'error');
      }
      lastEmergencyCount.current = emergencyPending;
      setRequests(data);
    } catch (err) {
      showToast?.(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [filter, showToast]);

  useEffect(() => {
    loadRequests();
    const interval = setInterval(loadRequests, 8000);
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
    if (!noteText.trim() || !noteModal) return;
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
    <DashboardLayout sidebarItems={sidebarItems}>
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

import { useCallback, useEffect, useRef, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import EmergencyButton from '../components/EmergencyButton';
import VoicePlayer from '../components/VoicePlayer';
import UrgencyBadge from '../components/UrgencyBadge';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { playAlertSound } from '../utils/voice';

const SIGNS = ['pain', 'chest', 'breathing', 'doctor', 'help'];
const EMERGENCY_KEYS = [
  { key: 'chest_pain', labelKey: 'chestPain', icon: '❤️', variant: 'danger' },
  { key: 'breathing', labelKey: 'breathing', icon: '🫁', variant: 'danger' },
  { key: 'bleeding', labelKey: 'bleeding', icon: '🩸', variant: 'danger' },
  { key: 'water', labelKey: 'water', icon: '💧', variant: 'default' },
  { key: 'doctor', labelKey: 'needDoctor', icon: '👨‍⚕️', variant: 'warning' },
  { key: 'family', labelKey: 'callFamily', icon: '📞', variant: 'default' },
];

export default function PatientDashboard({ showToast }) {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [selectedSigns, setSelectedSigns] = useState([]);
  const [preview, setPreview] = useState(null);
  const [requests, setRequests] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [emergencyFlash, setEmergencyFlash] = useState(false);
  const videoRef = useRef(null);

  const sidebarItems = [
    { to: '/patient', labelKey: 'dashboard', icon: '🏠', end: true },
    { to: '/profile', labelKey: 'profile', icon: '👤' },
  ];

  const loadData = useCallback(async () => {
    try {
      const [reqs, temps] = await Promise.all([api.requests.list(), api.templates.list()]);
      setRequests(reqs);
      setTemplates(temps);
    } catch (err) {
      showToast?.(err.message, 'error');
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    let stream;
    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        /* camera optional */
      }
    }
    startCamera();
    return () => stream?.getTracks().forEach((tr) => tr.stop());
  }, []);

  const toggleSign = (sign) => {
    setSelectedSigns((prev) =>
      prev.includes(sign) ? prev.filter((s) => s !== sign) : [...prev, sign]
    );
  };

  const buildRawMessage = () => {
    if (text.trim()) return text.trim();
    if (selectedSigns.length) return selectedSigns.join(' ');
    return '';
  };

  const handlePreview = async () => {
    const message = buildRawMessage();
    if (!message) return showToast?.('Enter text or select signs', 'error');
    setLoading(true);
    try {
      const result = await api.ai.improve({ message, language: lang });
      const urgency = await api.ai.urgency({ message: result.improved });
      setPreview({ ...result, urgency: urgency.urgency });
    } catch (err) {
      showToast?.(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const submitRequest = async (payload) => {
    setLoading(true);
    try {
      const created = await api.requests.create(payload);
      if (created.urgency === 'Emergency') {
        setEmergencyFlash(true);
        playAlertSound();
        setTimeout(() => setEmergencyFlash(false), 5000);
        showToast?.('🚨 EMERGENCY ALERT SENT', 'error');
      } else {
        showToast?.('Message sent to medical staff', 'success');
      }
      setText('');
      setSelectedSigns([]);
      setPreview(null);
      loadData();
    } catch (err) {
      showToast?.(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    const rawMessage = preview?.improved || buildRawMessage();
    if (!rawMessage) return;
    submitRequest({
      rawMessage: buildRawMessage() || rawMessage,
      language: lang,
      source: selectedSigns.length ? 'sign' : 'text',
      detectedSigns: selectedSigns,
    });
  };

  const handleTemplate = (template) => {
    const msg = template.message[lang] || template.message.en;
    submitRequest({
      rawMessage: msg,
      language: lang,
      source: 'template',
      urgency: template.defaultUrgency,
    });
  };

  const handleEmergencyAlert = () => {
    submitRequest({
      rawMessage: 'Emergency! I need immediate medical assistance!',
      language: lang,
      source: 'emergency',
      urgency: 'Emergency',
    });
  };

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      {emergencyFlash && (
        <div className="emergency-banner pulse-emergency">
          🚨 {t('emergencyAlert')} — {t('emergency')}
        </div>
      )}

      <header className="page-header">
        <h1>{t('welcomeBack')}, {user?.name}</h1>
        <p>{t('tagline')}</p>
      </header>

      <div className="patient-grid">
        <section className="glass-card section-card">
          <h3>{t('cameraPreview')}</h3>
          <div className="camera-box">
            <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
            <div className="camera-overlay">Sign detection demo mode</div>
          </div>

          <h4>{t('signSimulation')}</h4>
          <div className="sign-buttons">
            {SIGNS.map((sign) => (
              <button
                key={sign}
                type="button"
                className={`sign-chip ${selectedSigns.includes(sign) ? 'active' : ''}`}
                onClick={() => toggleSign(sign)}
              >
                {t(sign) || sign}
              </button>
            ))}
          </div>
          {selectedSigns.length > 0 && (
            <p className="detected-signs">
              {t('detectedSigns')}: {selectedSigns.join(', ')}
            </p>
          )}
        </section>

        <section className="glass-card section-card">
          <h3>{t('quickEmergency')}</h3>
          <div className="emergency-grid">
            {EMERGENCY_KEYS.map((btn) => {
              const template = templates.find((tp) => tp.key === btn.key);
              return (
                <EmergencyButton
                  key={btn.key}
                  label={t(btn.labelKey)}
                  icon={btn.icon}
                  variant={btn.variant}
                  onClick={() =>
                    template
                      ? handleTemplate(template)
                      : submitRequest({
                          rawMessage: t(btn.labelKey),
                          language: lang,
                          source: 'template',
                        })
                  }
                />
              );
            })}
          </div>

          <button
            type="button"
            className="btn btn-danger btn-block emergency-alert-btn"
            onClick={handleEmergencyAlert}
          >
            🚨 {t('emergencyAlert')}
          </button>
        </section>

        <section className="glass-card section-card compose-section">
          <h3>{t('textInput')}</h3>
          <textarea
            className="form-input message-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="pain chest breathing hard"
            rows={4}
          />

          {preview && (
            <div className="preview-box">
              <p>
                <strong>{t('improvedMessage')}:</strong> {preview.improved}
              </p>
              <UrgencyBadge urgency={preview.urgency} />
            </div>
          )}

          <div className="compose-actions">
            <button type="button" className="btn btn-secondary" onClick={handlePreview} disabled={loading}>
              {t('preview')}
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSend} disabled={loading}>
              {loading ? t('loading') : t('convertSpeech')}
            </button>
          </div>
        </section>

        <section className="glass-card section-card history-section">
          <h3>{t('messageHistory')}</h3>
          {!requests.length ? (
            <div className="empty-state">{t('noData')}</div>
          ) : (
            <div className="history-list">
              {requests.map((req) => (
                <div key={req._id} className={`history-item ${req.urgency === 'Emergency' ? 'pulse-emergency' : ''}`}>
                  <div className="history-top">
                    <UrgencyBadge urgency={req.urgency} />
                    <span className="history-date">{new Date(req.createdAt).toLocaleString()}</span>
                  </div>
                  <p>{req.improvedMessage || req.rawMessage}</p>
                  <VoicePlayer request={req} label={t('playVoice')} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

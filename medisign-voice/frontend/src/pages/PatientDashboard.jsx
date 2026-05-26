import { useCallback, useEffect, useRef, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import EmergencyButton from '../components/EmergencyButton';
import VoicePlayer from '../components/VoicePlayer';
import UrgencyBadge from '../components/UrgencyBadge';
import VoiceTranscription from '../components/VoiceTranscription';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { playAlertSound } from '../utils/voice';
import { formatSriLankaDateTime } from '../utils/dateTime';

const SIGNS = ['pain', 'chest', 'breathing', 'doctor', 'help'];
const LIVE_GESTURES = {
  Closed_Fist: {
    sign: 'pain',
    label: 'Closed fist',
    icon: '✊',
    message: 'I am in pain and need assistance.',
    urgency: 'Warning',
  },
  Thumb_Down: {
    sign: 'chest',
    label: 'Thumb down',
    icon: '👎',
    message: 'I have chest pain and need urgent assistance.',
    urgency: 'Emergency',
  },
  Victory: {
    sign: 'breathing',
    label: 'Victory sign',
    icon: '✌️',
    message: 'I am having difficulty breathing. Please assist urgently.',
    urgency: 'Emergency',
  },
  Thumb_Up: {
    sign: 'doctor',
    label: 'Thumb up',
    icon: '👍',
    message: 'I need a doctor or nurse.',
    urgency: 'Warning',
  },
  Open_Palm: {
    sign: 'help',
    label: 'Open palm',
    icon: '✋',
    message: 'Help. I need assistance.',
    urgency: 'Warning',
  },
};
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20], [0, 17],
];
const GESTURE_CONFIDENCE = 0.65;
const GESTURE_HOLD_MS = 650;
const EMERGENCY_KEYS = [
  { key: 'chest_pain', labelKey: 'chestPain', icon: '❤️', variant: 'danger', urgency: 'Emergency' },
  { key: 'breathing', labelKey: 'breathing', icon: '🫁', variant: 'danger', urgency: 'Emergency' },
  { key: 'bleeding', labelKey: 'bleeding', icon: '🩸', variant: 'danger', urgency: 'Emergency' },
  { key: 'water', labelKey: 'water', icon: '💧', variant: 'default', urgency: 'Normal' },
  { key: 'doctor', labelKey: 'needDoctor', icon: '👨‍⚕️', variant: 'warning', urgency: 'Warning' },
  { key: 'family', labelKey: 'callFamily', icon: '📞', variant: 'default', urgency: 'Normal' },
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
  const [cameraStatus, setCameraStatus] = useState('Starting camera...');
  const [liveGesture, setLiveGesture] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const gestureSendingRef = useRef(false);
  const gestureQueueRef = useRef([]);

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

  const sendDetectedGesture = useCallback(async (gesture) => {
    setSelectedSigns([gesture.sign]);
    setPreview(null);
    try {
      const created = await api.requests.create({
        rawMessage: gesture.message,
        language: lang,
        source: 'sign',
        detectedSigns: [gesture.sign],
        urgency: gesture.urgency,
      });
      if (created.urgency === 'Emergency') {
        setEmergencyFlash(true);
        playAlertSound();
        setTimeout(() => setEmergencyFlash(false), 5000);
        showToast?.(`${gesture.label} detected. Emergency alert sent to doctor.`, 'error');
      } else {
        showToast?.(`${gesture.label} detected. Request sent to doctor.`, 'success');
      }
      setSelectedSigns([]);
      loadData();
    } catch (err) {
      showToast?.(err.message, 'error');
    }
  }, [lang, loadData, showToast]);

  const submitDetectedGesture = useCallback((gesture) => {
    gestureQueueRef.current.push(gesture);
    if (gestureSendingRef.current) return;

    gestureSendingRef.current = true;
    setLoading(true);

    async function sendQueuedGestures() {
      while (gestureQueueRef.current.length) {
        const nextGesture = gestureQueueRef.current.shift();
        await sendDetectedGesture(nextGesture);
      }
      gestureSendingRef.current = false;
      setLoading(false);
    }

    sendQueuedGestures();
  }, [sendDetectedGesture]);

  useEffect(() => {
    let stream;
    let recognizer;
    let animationFrame;
    let stopped = false;
    let lastVideoTime = -1;
    let lastInferenceAt = 0;
    const stableGesture = { name: null, since: 0, accepted: false };

    function drawLandmarks(hands) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !video.videoWidth || !video.videoHeight) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.strokeStyle = '#22d3ee';
      context.lineWidth = 3;
      context.fillStyle = '#38bdf8';

      hands.forEach((landmarks) => {
        HAND_CONNECTIONS.forEach(([from, to]) => {
          context.beginPath();
          context.moveTo(landmarks[from].x * canvas.width, landmarks[from].y * canvas.height);
          context.lineTo(landmarks[to].x * canvas.width, landmarks[to].y * canvas.height);
          context.stroke();
        });
        landmarks.forEach((point) => {
          context.beginPath();
          context.arc(point.x * canvas.width, point.y * canvas.height, 4, 0, Math.PI * 2);
          context.fill();
        });
      });
    }

    function processPrediction(prediction, timestamp) {
      const matched = prediction && LIVE_GESTURES[prediction.categoryName];
      if (!matched || prediction.score < GESTURE_CONFIDENCE) {
        stableGesture.name = null;
        stableGesture.accepted = false;
        setLiveGesture(null);
        return;
      }

      setLiveGesture({
        ...matched,
        confidence: Math.round(prediction.score * 100),
      });

      if (stableGesture.name !== prediction.categoryName) {
        stableGesture.name = prediction.categoryName;
        stableGesture.since = timestamp;
        stableGesture.accepted = false;
        return;
      }

      if (!stableGesture.accepted && timestamp - stableGesture.since >= GESTURE_HOLD_MS) {
        submitDetectedGesture(matched);
        stableGesture.accepted = true;
      }
    }

    function recognizeFrame(timestamp) {
      if (stopped) return;
      const video = videoRef.current;
      if (
        recognizer &&
        video?.readyState >= 2 &&
        video.currentTime !== lastVideoTime &&
        timestamp - lastInferenceAt >= 100
      ) {
        lastVideoTime = video.currentTime;
        lastInferenceAt = timestamp;
        const result = recognizer.recognizeForVideo(video, timestamp);
        drawLandmarks(result.landmarks || []);
        processPrediction(result.gestures?.[0]?.[0], timestamp);
      }
      animationFrame = window.requestAnimationFrame(recognizeFrame);
    }

    async function startLiveRecognition() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Camera access is unavailable in this browser.');
        }

        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        const video = videoRef.current;
        if (!video || stopped) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        video.srcObject = stream;
        await video.play();

        setCameraStatus('Loading live gesture model...');
        const { FilesetResolver, GestureRecognizer } = await import('@mediapipe/tasks-vision');
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'
        );
        recognizer = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-tasks/gesture_recognizer/gesture_recognizer.task',
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        if (stopped) {
          recognizer.close();
          return;
        }
        setCameraStatus('Live recognition ready. Hold a supported gesture.');
        animationFrame = window.requestAnimationFrame(recognizeFrame);
      } catch (err) {
        const denied = err?.name === 'NotAllowedError';
        setCameraStatus(
          denied
            ? 'Camera permission denied. Use the buttons below.'
            : 'Live recognition unavailable. Use the buttons below.'
        );
      }
    }

    startLiveRecognition();
    return () => {
      stopped = true;
      window.cancelAnimationFrame(animationFrame);
      recognizer?.close();
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [submitDetectedGesture]);

  const sendManualGesture = (sign) => {
    const gesture = Object.values(LIVE_GESTURES).find((item) => item.sign === sign);
    if (gesture) submitDetectedGesture(gesture);
  };

  const appendTranscript = (transcript) => {
    setText((previous) => `${previous.trim()} ${transcript}`.trim());
    setPreview(null);
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
    if (!rawMessage) {
      showToast?.('Enter text, speak, or select signs before sending.', 'error');
      return;
    }
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
            <canvas ref={canvasRef} className="camera-landmarks" aria-hidden="true" />
            <div className="camera-overlay">
              {liveGesture
                ? (
                    <>
                      <span className="gesture-icon" aria-hidden="true">{liveGesture.icon}</span>{' '}
                      {liveGesture.label}: {t(liveGesture.sign)} ({liveGesture.confidence}%)
                    </>
                  )
                : cameraStatus}
            </div>
          </div>

          <h4>Live Gesture Shortcuts</h4>
          <p className="gesture-help">
            Hold a pose briefly to send its medical message directly to the doctor. These
            are predefined shortcuts, not full sign-language translation.
          </p>
          <div className="gesture-guide">
            {Object.values(LIVE_GESTURES).map((gesture) => (
              <span className="gesture-map" key={gesture.sign}>
                <span className="gesture-icon" aria-hidden="true">{gesture.icon}</span>
                <span>{gesture.label}: {t(gesture.sign)} ({t(gesture.urgency.toLowerCase())})</span>
              </span>
            ))}
          </div>

          <h4 className="manual-sign-heading">Manual Gesture Shortcuts</h4>
          <div className="sign-buttons">
            {SIGNS.map((sign) => (
              <button
                key={sign}
                type="button"
                className={`sign-chip ${selectedSigns.includes(sign) ? 'active' : ''}`}
                onClick={() => sendManualGesture(sign)}
                disabled={loading}
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
                  disabled={loading}
                  onClick={() =>
                    template
                      ? handleTemplate(template)
                      : submitRequest({
                          rawMessage: t(btn.labelKey),
                          language: lang,
                          source: 'template',
                          urgency: btn.urgency,
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
            disabled={loading}
          >
            🚨 {t('emergencyAlert')}
          </button>
        </section>

        <section className="glass-card section-card compose-section">
          <h3>{t('textInput')}</h3>
          <textarea
            className="form-input message-textarea"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setPreview(null);
            }}
            placeholder="pain chest breathing hard"
            rows={4}
          />
          <VoiceTranscription
            onTranscript={appendTranscript}
            language={lang}
            disabled={loading}
            showToast={showToast}
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
                    <span className="history-date">{formatSriLankaDateTime(req.createdAt)}</span>
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

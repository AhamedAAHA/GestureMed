import { Link } from 'react-router-dom';
import AnimatedBackground from '../components/AnimatedBackground';
import LanguageSwitcher from '../components/LanguageSwitcher';
import Navbar from '../components/Navbar';
import { useLanguage } from '../context/LanguageContext';

export default function LandingPage() {
  const { t } = useLanguage();

  const features = [
    { icon: '🤟', title: t('signToSpeech'), desc: t('landingDesc') },
    { icon: '🧠', title: t('aiUrgency'), desc: 'OpenAI classifies Normal, Warning, Emergency instantly.' },
    { icon: '📝', title: t('aiImprove'), desc: 'Rough patient text becomes clear medical sentences.' },
    { icon: '🌐', title: t('multilingual'), desc: 'English, Tamil, Sinhala UI and translation.' },
    { icon: '🔊', title: t('voiceOutput'), desc: 'ElevenLabs speech with browser fallback.' },
  ];

  return (
    <div className="landing-page">
      <AnimatedBackground />
      <Navbar />
      <section className="hero">
        <div className="hero-content glass-card">
          <img
            className="hero-logo"
            src="/gesturemed-logo-ui-transparent.png"
            alt="GestureMed - AI Powered Care, Human Touch"
          />
          <LanguageSwitcher className="hero-lang" />
          <span className="hero-badge">🏥 Healthcare Communication Platform</span>
          <h1>{t('landingTitle')}</h1>
          <p>{t('landingDesc')}</p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary btn-lg">
              {t('getStarted')}
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg">
              {t('login')}
            </Link>
          </div>
        </div>
      </section>

      <section className="features-section">
        <h2>{t('features')}</h2>
        <div className="features-grid">
          {features.map((f) => (
            <div key={f.title} className="feature-card glass-card">
              <span className="feature-icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

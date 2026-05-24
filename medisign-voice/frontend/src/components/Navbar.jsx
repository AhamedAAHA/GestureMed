import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const dashPath =
    user?.role === 'patient'
      ? '/patient'
      : user?.role === 'doctor'
        ? '/doctor'
        : user?.role === 'admin'
          ? '/admin'
          : null;

  return (
    <nav className="navbar glass-card">
      <Link to="/" className="navbar-brand" aria-label={`${t('appName')} home`}>
        <img className="brand-logo" src="/gesturemed-logo.svg" alt="GestureMed - AI Powered Care, Human Touch" />
      </Link>
      <div className="navbar-actions">
        <LanguageSwitcher />
        <button type="button" className="btn-icon" onClick={toggleTheme} title={t('theme')}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        {user ? (
          <>
            {dashPath && (
              <Link to={dashPath} className="nav-link">
                {t('dashboard')}
              </Link>
            )}
            <Link to="/profile" className="nav-link">
              {t('profile')}
            </Link>
            <span className="nav-user">{user.name}</span>
            <button type="button" className="btn btn-ghost" onClick={handleLogout}>
              {t('logout')}
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-ghost">
              {t('login')}
            </Link>
            <Link to="/register" className="btn btn-primary">
              {t('register')}
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

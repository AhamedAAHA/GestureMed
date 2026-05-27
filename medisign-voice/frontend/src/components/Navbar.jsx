import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [compactLang, setCompactLang] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => setCompactLang(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    closeMenu();
    logout();
    navigate('/');
  };

  return (
    <nav
      className={`navbar glass-card${menuOpen ? ' navbar--menu-open' : ''}${user ? ' navbar--signed-in' : ''}`}
    >
      <Link
        to="/"
        className="navbar-brand"
        aria-label={`${t('appName')} home`}
        onClick={closeMenu}
      >
        <img className="brand-mark" src="/gesturemed-logo-ui-transparent.png" alt="GestureMed logo" />
      </Link>

      <div className="navbar-tools">
        <LanguageSwitcher compact={compactLang} />
        <button type="button" className="btn-icon" onClick={toggleTheme} title={t('theme')}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      {!user && (
        <button
          type="button"
          className="navbar-menu-btn"
          aria-expanded={menuOpen}
          aria-controls="navbar-menu"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      )}

      <div id="navbar-menu" className="navbar-actions">
        {user ? (
          <div className="navbar-user-actions">
            <span className="nav-user">{user.name}</span>
            <button type="button" className="btn btn-ghost" onClick={handleLogout}>
              {t('logout')}
            </button>
          </div>
        ) : (
          <div className="navbar-user-actions">
            <Link to="/login" className="btn btn-ghost" onClick={closeMenu}>
              {t('login')}
            </Link>
            <Link to="/register" className="btn btn-primary" onClick={closeMenu}>
              {t('register')}
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

import { NavLink } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function Sidebar({ items }) {
  const { t } = useLanguage();

  return (
    <aside className="sidebar glass-card">
      <nav className="sidebar-nav">
        {items.map((item) => (
          <NavLink
            key={`${item.to}-${item.labelKey}`}
            to={item.to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            end={item.end}
            onClick={item.onClick}
          >
            <span className="sidebar-icon">{item.icon}</span>
            {t(item.labelKey) || item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

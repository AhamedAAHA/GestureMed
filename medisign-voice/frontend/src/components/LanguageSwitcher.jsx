import { useLanguage } from '../context/LanguageContext';

const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'ta', label: 'தமிழ்', short: 'TA' },
  { code: 'si', label: 'සිංහල', short: 'SI' },
];

export default function LanguageSwitcher({ className = '', compact = false }) {
  const { lang, setLanguage } = useLanguage();

  return (
    <select
      className={`lang-switcher${compact ? ' lang-switcher--compact' : ''} ${className}`.trim()}
      value={lang}
      onChange={(e) => setLanguage(e.target.value)}
      aria-label="Select language"
    >
      {LANGUAGES.map((l) => (
        <option key={l.code} value={l.code}>
          {compact ? l.short : l.label}
        </option>
      ))}
    </select>
  );
}

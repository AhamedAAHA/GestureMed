import { useLanguage } from '../context/LanguageContext';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'si', label: 'සිංහල' },
];

export default function LanguageSwitcher({ className = '' }) {
  const { lang, setLanguage } = useLanguage();

  return (
    <select
      className={`lang-switcher ${className}`}
      value={lang}
      onChange={(e) => setLanguage(e.target.value)}
      aria-label="Select language"
    >
      {LANGUAGES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
  );
}

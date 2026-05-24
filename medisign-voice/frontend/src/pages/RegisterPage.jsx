import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AnimatedBackground from '../components/AnimatedBackground';
import FormInput from '../components/FormInput';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function RegisterPage() {
  const { t, lang } = useLanguage();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'patient',
    preferredLanguage: lang,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const user = await register(form);
      const path =
        user.role === 'patient' ? '/patient' : user.role === 'doctor' ? '/doctor' : '/admin';
      navigate(path);
    } catch (err) {
      setError(err.message || t('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <AnimatedBackground variant="auth" />
      <Navbar />
      <div className="auth-card glass-card page-transition">
        <h2>{t('createAccount')}</h2>
        <form onSubmit={handleSubmit}>
          <FormInput label={t('name')} value={form.name} onChange={update('name')} required />
          <FormInput
            label={t('email')}
            type="email"
            value={form.email}
            onChange={update('email')}
            required
          />
          <FormInput
            label={t('password')}
            type="password"
            value={form.password}
            onChange={update('password')}
            required
          />
          <FormInput
            label={t('role')}
            as="select"
            value={form.role}
            onChange={update('role')}
            options={[
              { value: 'patient', label: t('patient') },
              { value: 'doctor', label: t('doctor') },
              { value: 'admin', label: t('admin') },
            ]}
          />
          <FormInput
            label={t('preferredLanguage')}
            as="select"
            value={form.preferredLanguage}
            onChange={update('preferredLanguage')}
            options={[
              { value: 'en', label: 'English' },
              { value: 'ta', label: 'தமிழ்' },
              { value: 'si', label: 'සිංහල' },
            ]}
          />
          {error && <p className="form-error global-error">{error}</p>}
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? t('loading') : t('createAccount')}
          </button>
        </form>
        <p className="auth-footer">
          {t('login')}? <Link to="/login">{t('signIn')}</Link>
        </p>
      </div>
    </div>
  );
}

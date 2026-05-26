import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AnimatedBackground from '../components/AnimatedBackground';
import FormInput from '../components/FormInput';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function LoginPage() {
  const { t } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      const path =
        user.role === 'patient'
          ? '/patient'
          : ['doctor', 'nurse'].includes(user.role)
            ? '/doctor'
            : '/admin';
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
        <h2>{t('signIn')}</h2>
        <form onSubmit={handleSubmit}>
          <FormInput
            label={t('email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <FormInput
            label={t('password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="form-error global-error">{error}</p>}
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? t('loading') : t('signIn')}
          </button>
        </form>
        <p className="auth-footer">
          {t('register')}? <Link to="/register">{t('createAccount')}</Link>
        </p>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import FormInput from '../components/FormInput';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function ProfilePage({ showToast }) {
  const { t } = useLanguage();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const sidebarItems = [
    {
      to: user?.role === 'patient' ? '/patient' : user?.role === 'doctor' ? '/doctor' : '/admin',
      labelKey: 'dashboard',
      icon: '🏠',
    },
    { to: '/profile', labelKey: 'profile', icon: '👤', end: true },
  ];

  useEffect(() => {
    async function load() {
      try {
        const wardList = await api.wards.list();
        setWards(wardList);
        if (user?.role === 'patient') {
          const p = await api.patients.me();
          setProfile(p);
        } else if (user?.role === 'doctor') {
          const d = await api.doctors.me();
          setProfile(d);
        } else {
          setProfile({ name: user?.name, email: user?.email });
        }
      } catch (err) {
        showToast?.(err.message, 'error');
      } finally {
        setLoading(false);
      }
    }
    if (user) load();
  }, [user, showToast]);

  const update = (key) => (e) => {
    const val = e.target.value;
    if (key.startsWith('emergencyContact.')) {
      const field = key.split('.')[1];
      setProfile({
        ...profile,
        emergencyContact: { ...profile.emergencyContact, [field]: val },
      });
    } else if (key === 'allergies') {
      setProfile({ ...profile, allergies: val.split(',').map((a) => a.trim()).filter(Boolean) });
    } else {
      setProfile({ ...profile, [key]: val });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (user?.role !== 'patient') {
      showToast?.('Profile update available for patients', 'info');
      return;
    }
    setSaving(true);
    try {
      await api.patients.update(profile._id, profile);
      await refreshUser();
      showToast?.('Profile updated', 'success');
    } catch (err) {
      showToast?.(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      <header className="page-header">
        <h1>{t('profile')}</h1>
      </header>

      {loading ? (
        <div className="page-center"><div className="spinner" /></div>
      ) : (
        <form className="profile-form glass-card" onSubmit={handleSave}>
          {user.role === 'patient' ? (
            <>
              <FormInput label={t('name')} value={profile?.name || ''} onChange={update('name')} />
              <FormInput
                label={t('age')}
                type="number"
                value={profile?.age || ''}
                onChange={update('age')}
              />
              <FormInput
                label={t('gender')}
                as="select"
                value={profile?.gender || 'prefer_not_to_say'}
                onChange={update('gender')}
                options={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other' },
                  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
                ]}
              />
              <FormInput
                label={t('bloodGroup')}
                value={profile?.bloodGroup || ''}
                onChange={update('bloodGroup')}
              />
              <FormInput
                label={t('allergies')}
                value={profile?.allergies?.join(', ') || ''}
                onChange={update('allergies')}
                placeholder="Penicillin, Latex"
              />
              <FormInput
                label={t('medicalCondition')}
                value={profile?.medicalCondition || ''}
                onChange={update('medicalCondition')}
              />
              <FormInput
                label={`${t('emergencyContact')} — Name`}
                value={profile?.emergencyContact?.name || ''}
                onChange={update('emergencyContact.name')}
              />
              <FormInput
                label={`${t('emergencyContact')} — Phone`}
                value={profile?.emergencyContact?.phone || ''}
                onChange={update('emergencyContact.phone')}
              />
              <FormInput
                label={t('wardRoom')}
                value={profile?.roomNumber || ''}
                onChange={update('roomNumber')}
              />
              <FormInput
                label={t('preferredLanguage')}
                as="select"
                value={profile?.preferredLanguage || 'en'}
                onChange={update('preferredLanguage')}
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'ta', label: 'தமிழ்' },
                  { value: 'si', label: 'සිංහල' },
                ]}
              />
              <FormInput
                label="Ward"
                as="select"
                value={profile?.wardId?._id || profile?.wardId || ''}
                onChange={update('wardId')}
                options={[
                  { value: '', label: '—' },
                  ...wards.map((w) => ({ value: w._id, label: w.name })),
                ]}
              />
            </>
          ) : (
            <>
              <FormInput label={t('name')} value={profile?.name || ''} disabled />
              <p>{user.email}</p>
              <p>Role: {user.role}</p>
            </>
          )}

          {user.role === 'patient' && (
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? t('loading') : t('save')}
            </button>
          )}
        </form>
      )}
    </DashboardLayout>
  );
}

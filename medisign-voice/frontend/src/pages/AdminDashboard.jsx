import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import StatCard from '../components/StatCard';
import Table from '../components/Table';
import Modal from '../components/Modal';
import FormInput from '../components/FormInput';
import VoiceTranscription from '../components/VoiceTranscription';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { formatSriLankaDateTime } from '../utils/dateTime';

const TABS = ['analytics', 'patients', 'doctors', 'templates', 'wards', 'logs'];

export default function AdminDashboard({ showToast }) {
  const { t, lang } = useLanguage();
  const [tab, setTab] = useState('analytics');
  const [analytics, setAnalytics] = useState(null);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [wards, setWards] = useState([]);
  const [logs, setLogs] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const loadAnalytics = useCallback(async (notifyError = false) => {
    try {
      setAnalytics(await api.requests.analytics());
    } catch (err) {
      if (notifyError) showToast?.(err.message, 'error');
    }
  }, [showToast]);

  const loadTabData = useCallback(async (selectedTab, notifyError = false) => {
    const resources = {
      patients: [api.patients.list, setPatients],
      doctors: [api.doctors.list, setDoctors],
      templates: [api.templates.list, setTemplates],
      wards: [api.wards.list, setWards],
      logs: [api.audit.list, setLogs],
    };
    const resource = resources[selectedTab];
    if (!resource) return;

    try {
      const [fetchData, setData] = resource;
      setData(await fetchData());
    } catch (err) {
      if (notifyError) showToast?.(err.message, 'error');
    }
  }, [showToast]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        api.requests.analytics(),
        api.patients.list(),
        api.doctors.list(),
        api.templates.list(),
        api.wards.list(),
        api.audit.list(),
      ]);
      const setters = [setAnalytics, setPatients, setDoctors, setTemplates, setWards, setLogs];
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') setters[index](result.value);
      });
      const failed = results.find((result) => result.status === 'rejected');
      if (failed) showToast?.(failed.reason.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAll();
    const interval = setInterval(() => loadAnalytics(), 3000);
    return () => clearInterval(interval);
  }, [loadAll, loadAnalytics]);

  useEffect(() => {
    if (tab !== 'analytics') loadTabData(tab, true);
  }, [loadTabData, tab]);

  const openCreate = (type) => {
    setForm({});
    setFormErrors({});
    setModal({ type, mode: 'create' });
  };

  const openEdit = (type, record) => {
    let values;
    if (type === 'patient') {
      values = {
        name: record.name,
        roomNumber: record.roomNumber || '',
        preferredLanguage: record.preferredLanguage || 'en',
      };
    } else if (type === 'doctor') {
      values = {
        name: record.name,
        specialization: record.specialization || '',
        role: record.userId?.role || 'doctor',
      };
    } else if (type === 'template') {
      values = {
          key: record.key,
          labelEn: record.label?.en || '',
          messageEn: record.message?.en || '',
          defaultUrgency: record.defaultUrgency,
      };
    } else {
      values = {
        name: record.name,
        floor: record.floor || '',
        capacity: record.capacity ?? '',
      };
    }
    setForm(values);
    setFormErrors({});
    setModal({ type, mode: 'edit', id: record._id });
  };

  const validateForm = (type, mode) => {
    const errors = {};
    if (['patient', 'doctor', 'ward'].includes(type) && !form.name?.trim()) {
      errors.name = 'Name is required.';
    }
    if (mode === 'create' && ['patient', 'doctor'].includes(type)) {
      if (!form.email?.trim()) {
        errors.email = 'Email is required.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        errors.email = 'Enter a valid email address.';
      }
      if (!form.password) {
        errors.password = 'Password is required.';
      } else if (form.password.length < 6) {
        errors.password = 'Password must be at least 6 characters.';
      }
    }
    if (type === 'ward' && form.capacity !== '' && Number(form.capacity) < 0) {
      errors.capacity = 'Capacity cannot be negative.';
    }
    if (type === 'template') {
      if (!form.key?.trim()) errors.key = 'Key is required.';
      if (!form.labelEn?.trim()) errors.labelEn = 'Label is required.';
      if (!form.messageEn?.trim()) errors.messageEn = 'Message is required.';
    }
    return errors;
  };

  const handleSave = async () => {
    try {
      const { type, mode, id } = modal;
      const validationErrors = validateForm(type, mode);
      if (Object.keys(validationErrors).length) {
        setFormErrors(validationErrors);
        return;
      }
      setFormErrors({});
      if (type === 'patient') {
        if (mode === 'create') await api.patients.create(form);
        else await api.patients.update(id, form);
      } else if (type === 'doctor') {
        if (mode === 'create') await api.doctors.create({ ...form, role: form.role || 'doctor' });
        else await api.doctors.update(id, form);
      } else if (type === 'template') {
        const payload = {
          key: form.key,
          label: { en: form.labelEn || form.key },
          message: { en: form.messageEn || form.key },
          defaultUrgency: form.defaultUrgency || 'Warning',
        };
        if (mode === 'create') await api.templates.create(payload);
        else await api.templates.update(id, payload);
      } else if (type === 'ward') {
        if (mode === 'create') await api.wards.create(form);
        else await api.wards.update(id, form);
      }
      showToast?.('Saved successfully', 'success');
      setModal(null);
      loadAll();
    } catch (err) {
      const fieldErrors = Object.fromEntries(
        (err.errors || [])
          .filter((error) => error.path)
          .map((error) => [error.path, error.msg])
      );
      setFormErrors(fieldErrors);
      showToast?.(
        Object.values(fieldErrors)[0] || err.message,
        'error'
      );
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      if (type === 'patient') await api.patients.remove(id);
      else if (type === 'doctor') await api.doctors.remove(id);
      else if (type === 'template') await api.templates.remove(id);
      else if (type === 'ward') await api.wards.remove(id);
      showToast?.('Deleted', 'success');
      loadAll();
    } catch (err) {
      showToast?.(err.message, 'error');
    }
  };

  const updateForm = (key) => (e) => {
    setForm((previous) => ({ ...previous, [key]: e.target.value }));
    setFormErrors((previous) => ({ ...previous, [key]: undefined }));
  };

  return (
    <DashboardLayout
      sidebarItems={[
        { to: '/admin', labelKey: 'analytics', icon: '📊', active: tab === 'analytics', onClick: () => setTab('analytics') },
        { to: '/admin', labelKey: 'patients', icon: '🧑', active: tab === 'patients', onClick: () => setTab('patients') },
        { to: '/admin', labelKey: 'doctors', icon: '👨‍⚕️', active: tab === 'doctors', onClick: () => setTab('doctors') },
        { to: '/admin', labelKey: 'templates', icon: '📝', active: tab === 'templates', onClick: () => setTab('templates') },
        { to: '/admin', labelKey: 'wards', icon: '🏥', active: tab === 'wards', onClick: () => setTab('wards') },
        { to: '/admin', labelKey: 'logs', icon: '📜', active: tab === 'logs', onClick: () => setTab('logs') },
      ]}
    >
      <header className="page-header admin-header">
        <h1>{t('dashboard')} — {t('admin')}</h1>
        <div className="tab-bar">
          {TABS.map((tb) => (
            <button
              key={tb}
              type="button"
              className={`tab-btn ${tab === tb ? 'active' : ''}`}
              onClick={() => setTab(tb)}
            >
              {t(tb) || tb}
            </button>
          ))}
        </div>
      </header>

      {loading && <div className="spinner-inline" />}

      {tab === 'analytics' && (
        <div className="stats-grid">
          <StatCard title={t('totalPatients')} value={analytics?.totalPatients ?? '-'} icon="🧑" />
          <StatCard
            title={t('emergencyAlerts')}
            value={analytics?.emergencyAlerts ?? '-'}
            icon="🚨"
            variant="danger"
          />
          <StatCard
            title={t('pendingRequests')}
            value={analytics?.pendingRequests ?? '-'}
            icon="⏳"
            variant="warning"
          />
          <StatCard
            title={t('handledRequests')}
            value={analytics?.handledRequests ?? '-'}
            icon="✅"
            variant="success"
          />
        </div>
      )}

      {tab === 'patients' && (
        <section className="admin-section glass-card">
          <div className="section-toolbar">
            <h3>{t('patients')}</h3>
            <button type="button" className="btn btn-primary" onClick={() => openCreate('patient')}>
              + {t('add')}
            </button>
          </div>
          <Table
            columns={[
              { key: 'name', label: t('name'), render: (r) => r.name },
              { key: 'room', label: t('wardRoom'), render: (r) => r.roomNumber },
              { key: 'lang', label: t('language'), render: (r) => r.preferredLanguage },
              {
                key: 'actions',
                label: t('actions'),
                render: (r) => (
                  <div className="table-actions">
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit('patient', r)}>
                      {t('edit')}
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleDelete('patient', r._id)}>
                      {t('delete')}
                    </button>
                  </div>
                ),
              },
            ]}
            data={patients}
            emptyMessage={t('noData')}
          />
        </section>
      )}

      {tab === 'doctors' && (
        <section className="admin-section glass-card">
          <div className="section-toolbar">
            <h3>{t('doctors')}</h3>
            <button type="button" className="btn btn-primary" onClick={() => openCreate('doctor')}>
              + {t('add')}
            </button>
          </div>
          <Table
            columns={[
              { key: 'name', label: t('name'), render: (r) => r.name },
              { key: 'role', label: t('role'), render: (r) => r.userId?.role || 'doctor' },
              { key: 'spec', label: 'Specialization', render: (r) => r.specialization },
              {
                key: 'actions',
                label: t('actions'),
                render: (r) => (
                  <div className="table-actions">
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit('doctor', r)}>
                      {t('edit')}
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleDelete('doctor', r._id)}>
                      {t('delete')}
                    </button>
                  </div>
                ),
              },
            ]}
            data={doctors}
            emptyMessage={t('noData')}
          />
        </section>
      )}

      {tab === 'templates' && (
        <section className="admin-section glass-card">
          <div className="section-toolbar">
            <h3>{t('templates')}</h3>
            <button type="button" className="btn btn-primary" onClick={() => openCreate('template')}>
              + {t('add')}
            </button>
          </div>
          <Table
            columns={[
              { key: 'key', label: 'Key', render: (r) => r.key },
              { key: 'label', label: 'Label', render: (r) => r.label?.en },
              { key: 'urgency', label: t('urgency'), render: (r) => r.defaultUrgency },
              {
                key: 'actions',
                label: t('actions'),
                render: (r) => (
                  <div className="table-actions">
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit('template', r)}>
                      {t('edit')}
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleDelete('template', r._id)}>
                      {t('delete')}
                    </button>
                  </div>
                ),
              },
            ]}
            data={templates}
            emptyMessage={t('noData')}
          />
        </section>
      )}

      {tab === 'wards' && (
        <section className="admin-section glass-card">
          <div className="section-toolbar">
            <h3>{t('wards')}</h3>
            <button type="button" className="btn btn-primary" onClick={() => openCreate('ward')}>
              + {t('add')}
            </button>
          </div>
          <Table
            columns={[
              { key: 'name', label: t('name'), render: (r) => r.name },
              { key: 'floor', label: 'Floor', render: (r) => r.floor },
              { key: 'capacity', label: 'Capacity', render: (r) => r.capacity },
              {
                key: 'actions',
                label: t('actions'),
                render: (r) => (
                  <div className="table-actions">
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit('ward', r)}>
                      {t('edit')}
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleDelete('ward', r._id)}>
                      {t('delete')}
                    </button>
                  </div>
                ),
              },
            ]}
            data={wards}
            emptyMessage={t('noData')}
          />
        </section>
      )}

      {tab === 'logs' && (
        <section className="admin-section glass-card">
          <h3>{t('logs')}</h3>
          <Table
            columns={[
              { key: 'action', label: 'Action', render: (r) => r.action },
              { key: 'entity', label: 'Entity', render: (r) => r.entity },
              {
                key: 'user',
                label: 'User',
                render: (r) => r.userId?.email || '—',
              },
              {
                key: 'date',
                label: 'Date',
                render: (r) => formatSriLankaDateTime(r.createdAt),
              },
            ]}
            data={logs}
            emptyMessage={t('noData')}
          />
        </section>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={`${modal?.mode === 'create' ? t('add') : t('edit')} ${modal?.type}`}
      >
        {modal?.type === 'patient' && (
          <>
            <FormInput label={t('name')} value={form.name || ''} onChange={updateForm('name')} error={formErrors.name} required />
            {modal.mode === 'create' && (
              <>
                <FormInput label={t('email')} type="email" value={form.email || ''} onChange={updateForm('email')} error={formErrors.email} required />
                <FormInput label={t('password')} type="password" value={form.password || ''} onChange={updateForm('password')} error={formErrors.password} minLength={6} required />
              </>
            )}
            <FormInput label={t('wardRoom')} value={form.roomNumber || ''} onChange={updateForm('roomNumber')} />
            <FormInput
              label={t('preferredLanguage')}
              as="select"
              value={form.preferredLanguage || 'en'}
              onChange={updateForm('preferredLanguage')}
              options={[
                { value: 'en', label: 'English' },
                { value: 'ta', label: 'Tamil' },
                { value: 'si', label: 'Sinhala' },
              ]}
            />
          </>
        )}
        {modal?.type === 'doctor' && (
          <>
            <FormInput label={t('name')} value={form.name || ''} onChange={updateForm('name')} error={formErrors.name} required />
            {modal.mode === 'create' && (
              <>
                <FormInput label={t('email')} type="email" value={form.email || ''} onChange={updateForm('email')} error={formErrors.email} required />
                <FormInput label={t('password')} type="password" value={form.password || ''} onChange={updateForm('password')} error={formErrors.password} minLength={6} required />
              </>
            )}
            <FormInput
              label="Specialization"
              value={form.specialization || ''}
              onChange={updateForm('specialization')}
            />
            {modal.mode === 'create' && (
              <FormInput
                label={t('role')}
                as="select"
                value={form.role || 'doctor'}
                onChange={updateForm('role')}
                options={[
                  { value: 'doctor', label: 'Doctor' },
                  { value: 'nurse', label: 'Nurse' },
                ]}
              />
            )}
          </>
        )}
        {modal?.type === 'ward' && (
          <>
            <FormInput label={t('name')} value={form.name || ''} onChange={updateForm('name')} error={formErrors.name} required />
            <FormInput label="Floor" value={form.floor || ''} onChange={updateForm('floor')} />
            <FormInput
              label="Capacity"
              type="number"
              value={form.capacity ?? ''}
              onChange={updateForm('capacity')}
              error={formErrors.capacity}
              min={0}
            />
          </>
        )}
        {modal?.type === 'template' && (
          <>
            <FormInput label="Key" value={form.key || ''} onChange={updateForm('key')} error={formErrors.key} required />
            <FormInput
              label="Label (EN)"
              value={form.labelEn || ''}
              onChange={updateForm('labelEn')}
              error={formErrors.labelEn}
              required
            />
            <FormInput
              label="Message (EN)"
              as="textarea"
              value={form.messageEn || ''}
              onChange={updateForm('messageEn')}
              error={formErrors.messageEn}
              rows={3}
              required
            />
            <VoiceTranscription
              onTranscript={(transcript) =>
                setForm((previous) => ({
                  ...previous,
                  messageEn: `${previous.messageEn?.trim() || ''} ${transcript}`.trim(),
                }))
              }
              language={lang}
              showToast={showToast}
            />
            <FormInput
              label={t('urgency')}
              as="select"
              value={form.defaultUrgency || 'Warning'}
              onChange={updateForm('defaultUrgency')}
              options={[
                { value: 'Normal', label: t('normal') },
                { value: 'Warning', label: t('warning') },
                { value: 'Emergency', label: t('emergency') },
              ]}
            />
          </>
        )}
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>
            {t('cancel')}
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            {t('save')}
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import StatCard from '../components/StatCard';
import Table from '../components/Table';
import Modal from '../components/Modal';
import FormInput from '../components/FormInput';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';

const TABS = ['analytics', 'patients', 'doctors', 'templates', 'wards', 'logs'];

export default function AdminDashboard({ showToast }) {
  const { t } = useLanguage();
  const [tab, setTab] = useState('analytics');
  const [analytics, setAnalytics] = useState({});
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [wards, setWards] = useState([]);
  const [logs, setLogs] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [a, p, d, tp, w, l] = await Promise.all([
        api.requests.analytics(),
        api.patients.list(),
        api.doctors.list(),
        api.templates.list(),
        api.wards.list(),
        api.audit.list(),
      ]);
      setAnalytics(a);
      setPatients(p);
      setDoctors(d);
      setTemplates(tp);
      setWards(w);
      setLogs(l);
    } catch (err) {
      showToast?.(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const openCreate = (type) => {
    setForm({});
    setModal({ type, mode: 'create' });
  };

  const handleSave = async () => {
    try {
      const { type, mode, id } = modal;
      if (type === 'patient') {
        if (mode === 'create') await api.patients.create(form);
        else await api.patients.update(id, form);
      } else if (type === 'doctor') {
        if (mode === 'create') await api.doctors.create(form);
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
      showToast?.(err.message, 'error');
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

  const updateForm = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <DashboardLayout
      sidebarItems={[
        { to: '/admin', labelKey: 'analytics', icon: '📊', end: true },
        { to: '/admin', labelKey: 'patients', icon: '🧑', onClick: () => setTab('patients') },
        { to: '/admin', labelKey: 'doctors', icon: '👨‍⚕️', onClick: () => setTab('doctors') },
        { to: '/admin', labelKey: 'templates', icon: '📝', onClick: () => setTab('templates') },
        { to: '/admin', labelKey: 'wards', icon: '🏥', onClick: () => setTab('wards') },
        { to: '/admin', labelKey: 'logs', icon: '📜', onClick: () => setTab('logs') },
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
          <StatCard title={t('totalPatients')} value={analytics.totalPatients} icon="🧑" />
          <StatCard
            title={t('emergencyAlerts')}
            value={analytics.emergencyAlerts}
            icon="🚨"
            variant="danger"
          />
          <StatCard
            title={t('pendingRequests')}
            value={analytics.pendingRequests}
            icon="⏳"
            variant="warning"
          />
          <StatCard
            title={t('handledRequests')}
            value={analytics.handledRequests}
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
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleDelete('patient', r._id)}
                  >
                    {t('delete')}
                  </button>
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
              { key: 'spec', label: 'Specialization', render: (r) => r.specialization },
              {
                key: 'actions',
                label: t('actions'),
                render: (r) => (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleDelete('doctor', r._id)}
                  >
                    {t('delete')}
                  </button>
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
                render: (r) => new Date(r.createdAt).toLocaleString(),
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
            <FormInput label={t('name')} value={form.name || ''} onChange={updateForm('name')} />
            <FormInput label={t('email')} value={form.email || ''} onChange={updateForm('email')} />
            <FormInput
              label={t('password')}
              type="password"
              value={form.password || ''}
              onChange={updateForm('password')}
            />
          </>
        )}
        {modal?.type === 'doctor' && (
          <>
            <FormInput label={t('name')} value={form.name || ''} onChange={updateForm('name')} />
            <FormInput label={t('email')} value={form.email || ''} onChange={updateForm('email')} />
            <FormInput
              label={t('password')}
              type="password"
              value={form.password || ''}
              onChange={updateForm('password')}
            />
            <FormInput
              label="Specialization"
              value={form.specialization || ''}
              onChange={updateForm('specialization')}
            />
          </>
        )}
        {modal?.type === 'ward' && (
          <>
            <FormInput label={t('name')} value={form.name || ''} onChange={updateForm('name')} />
            <FormInput label="Floor" value={form.floor || ''} onChange={updateForm('floor')} />
            <FormInput
              label="Capacity"
              type="number"
              value={form.capacity || ''}
              onChange={updateForm('capacity')}
            />
          </>
        )}
        {modal?.type === 'template' && (
          <>
            <FormInput label="Key" value={form.key || ''} onChange={updateForm('key')} />
            <FormInput
              label="Label (EN)"
              value={form.labelEn || ''}
              onChange={updateForm('labelEn')}
            />
            <FormInput
              label="Message (EN)"
              value={form.messageEn || ''}
              onChange={updateForm('messageEn')}
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

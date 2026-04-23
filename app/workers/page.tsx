'use client';

import { useEffect, useRef, useState } from 'react';
import { getWorkers, saveWorkers, archiveWorker } from '../../lib/store';
import { Worker } from '../../lib/types';
import { useLang } from '../../components/LangProvider';

const emptyWorker = (): Omit<Worker, 'id'> => ({
  name: '', position: '', department: '', phone: '',
  startDate: new Date().toISOString().split('T')[0], photo: '',
});

function Avatar({ photo, name, size = 'md' }: { photo?: string; name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'sm' ? 'w-9 h-9 text-sm' : size === 'lg' ? 'w-20 h-20 text-2xl' : 'w-12 h-12 text-lg';
  if (photo) return <img src={photo} alt={name} className={`${sizeClass} rounded-full object-cover border-2 border-gray-200`} />;
  return <div className={`${sizeClass} rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold border-2 border-blue-200`}>{name.charAt(0)}</div>;
}

export default function WorkersPage() {
  const { t } = useLang();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyWorker());
  const [search, setSearch] = useState('');
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setWorkers(getWorkers()); }, []);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('حجم الصورة كبير جداً. الحد الأقصى 2MB'); return; }
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, photo: reader.result as string }));
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let updated: Worker[];
    if (editId) { updated = workers.map((w) => (w.id === editId ? { ...form, id: editId } : w)); }
    else { updated = [...workers, { ...form, id: crypto.randomUUID() }]; }
    saveWorkers(updated); setWorkers(updated);
    setShowForm(false); setEditId(null); setForm(emptyWorker());
  }

  function handleEdit(worker: Worker) {
    setForm({ name: worker.name, position: worker.position, department: worker.department, phone: worker.phone, startDate: worker.startDate, photo: worker.photo || '' });
    setEditId(worker.id); setShowForm(true);
  }

  function handleArchiveConfirm(id: string) {
    archiveWorker(id); setWorkers(getWorkers()); setArchiveId(null);
  }

  function handleCancel() { setShowForm(false); setEditId(null); setForm(emptyWorker()); }

  const filtered = workers.filter((w) => w.name.includes(search) || w.position.includes(search) || w.department.includes(search));

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-blue-900">{t.workers_title}</h2>
          <p className="text-gray-500 mt-1">{t.total}: {workers.length} {t.worker_count}</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(emptyWorker()); }}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium">
          {t.add_worker}
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-blue-900 mb-5">
              {editId ? t.edit_worker_title : t.add_worker_title}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col items-center gap-3 mb-2">
                <Avatar photo={form.photo} name={form.name || '؟'} size="lg" />
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-blue-600 hover:text-blue-800 border border-blue-300 px-4 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                  {form.photo ? t.change_photo : t.add_photo}
                </button>
                {form.photo && (
                  <button type="button" onClick={() => setForm({ ...form, photo: '' })}
                    className="text-xs text-red-500 hover:text-red-700">{t.delete_photo}</button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.full_name}</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder={t.name_ph} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.position_lbl}</label>
                <input required value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder={t.position_ph} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.dept_lbl}</label>
                <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder={t.dept_ph} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.phone_lbl}</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0XXXXXXXXX" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.start_date}</label>
                <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" dir="ltr" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-medium">
                  {editId ? t.save_changes : t.add_worker_btn}
                </button>
                <button type="button" onClick={handleCancel} className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-300 font-medium">
                  {t.cancel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Archive confirm modal */}
      {archiveId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl text-center">
            <div className="text-4xl mb-3">🗃️</div>
            <p className="text-lg font-semibold text-gray-800 mb-2">{t.archive_title}</p>
            <p className="text-gray-500 text-sm mb-6">{t.archive_msg}</p>
            <div className="flex gap-3">
              <button onClick={() => handleArchiveConfirm(archiveId)}
                className="flex-1 bg-orange-500 text-white py-2.5 rounded-lg hover:bg-orange-600 font-medium">{t.archive_btn}</button>
              <button onClick={() => setArchiveId(null)}
                className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-300 font-medium">{t.cancel}</button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={t.search_ph} />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center shadow">
          <p className="text-gray-400 text-lg">{workers.length === 0 ? t.no_workers : t.no_results}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-blue-900 text-white">
              <tr>
                <th className="px-4 py-3 text-right">{t.col_photo}</th>
                <th className="px-4 py-3 text-right">{t.col_name}</th>
                <th className="px-4 py-3 text-right">{t.col_position}</th>
                <th className="px-4 py-3 text-right">{t.col_dept}</th>
                <th className="px-4 py-3 text-right">{t.col_phone}</th>
                <th className="px-4 py-3 text-right">{t.col_start}</th>
                <th className="px-4 py-3 text-center">{t.col_actions}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((worker, idx) => (
                <tr key={worker.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3"><Avatar photo={worker.photo} name={worker.name} size="sm" /></td>
                  <td className="px-4 py-3 font-medium text-gray-800">{worker.name}</td>
                  <td className="px-4 py-3 text-gray-600">{worker.position}</td>
                  <td className="px-4 py-3 text-gray-600">{worker.department || '—'}</td>
                  <td className="px-4 py-3 text-gray-600" dir="ltr">{worker.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-600" dir="ltr">{worker.startDate}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleEdit(worker)} className="text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors ml-2">{t.edit}</button>
                    <button onClick={() => setArchiveId(worker.id)} className="text-orange-600 hover:text-orange-800 px-2 py-1 rounded hover:bg-orange-50 transition-colors">{t.archive_btn}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

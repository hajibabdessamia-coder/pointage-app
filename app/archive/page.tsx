'use client';

import { useEffect, useState } from 'react';
import {
  getArchivedWorkers,
  restoreWorker,
  deleteArchivedWorker,
  getAttendanceByWorker,
} from '../../lib/store';
import { Worker, AttendanceRecord, AttendanceStatus } from '../../lib/types';
import { useLang } from '../../components/LangProvider';

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  present:      'bg-green-100 text-green-800',
  absent:       'bg-red-100 text-red-800',
  late:         'bg-yellow-100 text-yellow-800',
  leave:        'bg-purple-100 text-purple-800',
  annual_leave: 'bg-teal-100 text-teal-800',
};

function formatDate(iso: string, lang: string) {
  const locale = lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-FR' : 'en-US';
  return new Date(iso).toLocaleDateString(locale, {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

export default function ArchivePage() {
  const { t, lang } = useLang();
  const [archived, setArchived] = useState<Worker[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<'restore' | 'delete' | null>(null);
  const [recordPage, setRecordPage] = useState(1);
  const PAGE_SIZE = 20;

  const STATUS_LABELS: Record<AttendanceStatus, string> = {
    present: t.present, absent: t.absent, late: t.late, leave: t.leave, annual_leave: t.annual_leave,
  };

  useEffect(() => {
    setArchived(getArchivedWorkers());
  }, []);

  function handleExpand(workerId: string) {
    if (expandedId === workerId) {
      setExpandedId(null);
      setRecords([]);
      setRecordPage(1);
    } else {
      const recs = getAttendanceByWorker(workerId).sort((a, b) => b.date.localeCompare(a.date));
      setRecords(recs);
      setExpandedId(workerId);
      setRecordPage(1);
    }
  }

  function handleRestore(id: string) {
    restoreWorker(id);
    setArchived(getArchivedWorkers());
    if (expandedId === id) setExpandedId(null);
    setConfirmId(null);
    setConfirmAction(null);
  }

  function handleDelete(id: string) {
    deleteArchivedWorker(id);
    setArchived(getArchivedWorkers());
    if (expandedId === id) setExpandedId(null);
    setConfirmId(null);
    setConfirmAction(null);
  }

  function workerStats(workerId: string) {
    const recs = getAttendanceByWorker(workerId);
    return {
      total: recs.length,
      present: recs.filter((r) => r.status === 'present').length,
      absent:  recs.filter((r) => r.status === 'absent').length,
      late:    recs.filter((r) => r.status === 'late').length,
      leave:   recs.filter((r) => r.status === 'leave').length,
    };
  }

  const pagedRecords = records.slice(0, recordPage * PAGE_SIZE);
  const hasMore = pagedRecords.length < records.length;
  const confirmWorker = confirmId ? archived.find((w) => w.id === confirmId) : null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-blue-900">{t.archive_page_title}</h2>
        <p className="text-gray-500 mt-1">{t.archived_count}: {archived.length}</p>
      </div>

      {confirmId && confirmAction && confirmWorker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl text-center">
            {confirmAction === 'restore' ? (
              <>
                <div className="text-4xl mb-3">♻️</div>
                <p className="text-lg font-semibold text-gray-800 mb-2">{t.restore_title}</p>
                <p className="text-gray-500 text-sm mb-6">
                  <strong>{confirmWorker.name}</strong> — {t.restore_msg}
                </p>
                <div className="flex gap-3">
                  <button onClick={() => handleRestore(confirmId)} className="flex-1 bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 font-medium">{t.restore_title}</button>
                  <button onClick={() => { setConfirmId(null); setConfirmAction(null); }} className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-300 font-medium">{t.cancel}</button>
                </div>
              </>
            ) : (
              <>
                <div className="text-4xl mb-3">🗑️</div>
                <p className="text-lg font-semibold text-gray-800 mb-2">{t.delete_perm_title}</p>
                <p className="text-gray-500 text-sm mb-6">
                  <strong>{confirmWorker.name}</strong> — {t.delete_perm_msg}
                </p>
                <div className="flex gap-3">
                  <button onClick={() => handleDelete(confirmId)} className="flex-1 bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 font-medium">{t.delete_perm_title}</button>
                  <button onClick={() => { setConfirmId(null); setConfirmAction(null); }} className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-300 font-medium">{t.cancel}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {archived.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow">
          <div className="text-5xl mb-4">🗃️</div>
          <p className="text-gray-400 text-lg">{t.empty_archive}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {archived.map((worker) => {
            const stats = workerStats(worker.id);
            const isExpanded = expandedId === worker.id;

            return (
              <div key={worker.id} className="bg-white rounded-xl shadow overflow-hidden">
                <div className="flex items-center gap-4 p-4">
                  <div className="shrink-0">
                    {worker.photo
                      ? <img src={worker.photo} alt={worker.name} className="w-12 h-12 rounded-full object-cover border-2 border-orange-200 grayscale" />
                      : <div className="w-12 h-12 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-lg font-bold">{worker.name.charAt(0)}</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-700 text-lg">{worker.name}</p>
                      <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-medium">{t.archived_badge}</span>
                    </div>
                    <p className="text-gray-500 text-sm">
                      {worker.position}{worker.department ? ` — ${worker.department}` : ''}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {t.archive_date_lbl} {worker.archivedAt ? formatDate(worker.archivedAt, lang) : '—'}
                    </p>
                  </div>

                  <div className="hidden sm:flex gap-2 flex-wrap justify-end">
                    <span title={t.present} className="bg-green-50 text-green-700 text-xs px-2.5 py-1 rounded-full font-semibold">{stats.present} ✅</span>
                    <span title={t.absent}  className="bg-red-50 text-red-700 text-xs px-2.5 py-1 rounded-full font-semibold">{stats.absent} ❌</span>
                    <span title={t.late}    className="bg-yellow-50 text-yellow-700 text-xs px-2.5 py-1 rounded-full font-semibold">{stats.late} ⏰</span>
                    <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">{stats.total}</span>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleExpand(worker.id)}
                      className="text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-lg hover:bg-blue-50 text-sm transition-colors">
                      {isExpanded ? t.hide_records : t.show_records}
                    </button>
                    <button onClick={() => { setConfirmId(worker.id); setConfirmAction('restore'); }}
                      className="text-green-700 hover:text-green-900 px-3 py-1.5 rounded-lg hover:bg-green-50 text-sm transition-colors">
                      {t.restore}
                    </button>
                    <button onClick={() => { setConfirmId(worker.id); setConfirmAction('delete'); }}
                      className="text-red-600 hover:text-red-800 px-3 py-1.5 rounded-lg hover:bg-red-50 text-sm transition-colors">
                      🗑️
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {records.length === 0 ? (
                      <p className="text-center text-gray-400 py-6 text-sm">{t.no_attendance_records}</p>
                    ) : (
                      <>
                        <div className="px-4 py-2 bg-gray-50 text-sm font-medium text-gray-600 flex gap-4 flex-wrap">
                          <span>{t.records_total} {records.length}</span>
                          <span className="text-green-700">{t.present}: {stats.present}</span>
                          <span className="text-red-700">{t.absent}: {stats.absent}</span>
                          <span className="text-yellow-700">{t.late}: {stats.late}</span>
                          <span className="text-purple-700">{t.leave}: {stats.leave}</span>
                          {stats.total > 0 && (
                            <span className="text-blue-700 font-semibold">
                              {t.attendance_rate}: {Math.round((stats.present / stats.total) * 100)}%
                            </span>
                          )}
                        </div>
                        <table className="w-full text-sm">
                          <thead className="bg-gray-100 text-gray-600">
                            <tr>
                              <th className="px-4 py-2 text-right">{t.excel_date}</th>
                              <th className="px-4 py-2 text-center">{t.col_status}</th>
                              <th className="px-4 py-2 text-center">{t.col_checkin}</th>
                              <th className="px-4 py-2 text-center">{t.col_checkout}</th>
                              <th className="px-4 py-2 text-right">{t.col_note}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pagedRecords.map((rec, idx) => (
                              <tr key={rec.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-4 py-2 text-gray-700 font-medium" dir="ltr">{rec.date}</td>
                                <td className="px-4 py-2 text-center">
                                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[rec.status]}`}>
                                    {STATUS_LABELS[rec.status]}
                                  </span>
                                </td>
                                <td className="px-4 py-2 text-center text-gray-500 text-xs" dir="ltr">{rec.checkIn || '—'}</td>
                                <td className="px-4 py-2 text-center text-gray-500 text-xs" dir="ltr">{rec.checkOut || '—'}</td>
                                <td className="px-4 py-2 text-gray-400 text-xs">{rec.note || ''}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {hasMore && (
                          <div className="text-center py-3">
                            <button onClick={() => setRecordPage((p) => p + 1)}
                              className="text-blue-600 hover:text-blue-800 text-sm underline">
                              {t.show_more} ({records.length - pagedRecords.length})
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

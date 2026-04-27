'use client';

import { useEffect, useState } from 'react';
import { getWorkers, getAttendanceByDate, upsertAttendance, getSettings } from '../../lib/store';
import { Worker, AttendanceRecord, AttendanceStatus } from '../../lib/types';
import { useLang } from '../../components/LangProvider';

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  present:      'bg-green-100 text-green-800 border-green-300',
  absent:       'bg-red-100 text-red-800 border-red-300',
  late:         'bg-yellow-100 text-yellow-800 border-yellow-300',
  leave:        'bg-purple-100 text-purple-800 border-purple-300',
  annual_leave: 'bg-teal-100 text-teal-800 border-teal-300',
};

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function nowTime() {
  const d = new Date();
  return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
}

export default function PointagePage() {
  const { t } = useLang();
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [noteModal, setNoteModal] = useState<{ workerId: string; note: string } | null>(null);
  const [offDays, setOffDays] = useState<number[]>([5]);

  const STATUS_LABELS: Record<AttendanceStatus, string> = {
    present:      t.present,
    absent:       t.absent,
    late:         t.late,
    leave:        t.leave,
    annual_leave: t.annual_leave,
  };

  useEffect(() => {
    async function init() {
      const [activeWorkers, settings] = await Promise.all([getWorkers(), getSettings()]);
      setWorkers(activeWorkers);
      setOffDays(settings.weeklyOffDays);
      await loadRecords(selectedDate, activeWorkers);
    }
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (workers.length > 0) loadRecords(selectedDate, workers);
  }, [selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadRecords(date: string, activeWorkers: Worker[]) {
    const activeIds = new Set(activeWorkers.map((w) => w.id));
    const recs = await getAttendanceByDate(date);
    setRecords(recs.filter((r) => activeIds.has(r.workerId)));
  }

  function getRecord(workerId: string): AttendanceRecord | undefined {
    return records.find((r) => r.workerId === workerId);
  }

  async function setStatus(worker: Worker, status: AttendanceStatus) {
    const existing = getRecord(worker.id);
    const record: AttendanceRecord = {
      id: existing?.id ?? crypto.randomUUID(),
      workerId: worker.id,
      date: selectedDate,
      status,
      checkIn: existing?.checkIn ?? '',
      checkOut: existing?.checkOut ?? '',
      note: existing?.note ?? '',
    };
    await upsertAttendance(record);
    await loadRecords(selectedDate, workers);
  }

  async function recordTimeNow(worker: Worker, field: 'checkIn' | 'checkOut') {
    const existing = getRecord(worker.id);
    if (!existing) return;
    await upsertAttendance({ ...existing, [field]: nowTime() });
    await loadRecords(selectedDate, workers);
  }

  async function saveNote() {
    if (!noteModal) return;
    const existing = getRecord(noteModal.workerId);
    if (!existing) return;
    await upsertAttendance({ ...existing, note: noteModal.note });
    await loadRecords(selectedDate, workers);
    setNoteModal(null);
  }

  async function markAll(status: AttendanceStatus) {
    await Promise.all(workers.map(async (w) => {
      const existing = getRecord(w.id);
      const record: AttendanceRecord = {
        id: existing?.id ?? crypto.randomUUID(),
        workerId: w.id,
        date: selectedDate,
        status,
        checkIn: existing?.checkIn ?? '',
        checkOut: existing?.checkOut ?? '',
        note: existing?.note ?? '',
      };
      return upsertAttendance(record);
    }));
    await loadRecords(selectedDate, workers);
  }

  const presentCount = workers.filter((w) => records.find((r) => r.workerId === w.id)?.status === 'present').length;
  const absentCount  = workers.filter((w) => records.find((r) => r.workerId === w.id)?.status === 'absent').length;
  const lateCount    = workers.filter((w) => records.find((r) => r.workerId === w.id)?.status === 'late').length;
  const leaveCount   = workers.filter((w) => records.find((r) => r.workerId === w.id)?.status === 'leave').length;

  if (workers.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <p className="text-gray-500 text-xl mb-4">{t.no_workers_pointage}</p>
        <a href="/workers" className="text-blue-600 underline">{t.go_add_workers}</a>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-blue-900">{t.pointage_title}</h2>
          <p className="text-gray-500 mt-1">{t.pointage_sub}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {offDays.includes(new Date(selectedDate).getDay()) && (
            <span className="bg-orange-100 text-orange-700 border border-orange-300 text-xs font-medium px-3 py-1.5 rounded-lg">
              ⚠️ {t.weekly_off}
            </span>
          )}
          <label className="text-sm font-medium text-gray-600">{t.date_lbl}</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            dir="ltr"
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-5">
        {([
          ['present', 'bg-green-500', presentCount],
          ['absent',  'bg-red-500',   absentCount],
          ['late',    'bg-yellow-500', lateCount],
          ['leave',   'bg-purple-500', leaveCount],
        ] as const).map(([status, color, count]) => (
          <div key={status} className={`${color} text-white rounded-xl p-4 shadow text-center`}>
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-sm opacity-90">{STATUS_LABELS[status]}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow mb-4 p-3 flex flex-wrap gap-2 items-center">
        <span className="text-sm text-gray-600 font-medium">{t.mark_all}</span>
        {(Object.keys(STATUS_LABELS) as AttendanceStatus[]).filter((s) => s !== 'late').map((s) => (
          <button
            key={s}
            onClick={() => markAll(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${STATUS_COLORS[s]}`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {noteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-gray-800 mb-3">{t.note_title}</h3>
            <textarea
              value={noteModal.note}
              onChange={(e) => setNoteModal({ ...noteModal, note: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder={t.note_ph}
            />
            <div className="flex gap-3 mt-3">
              <button onClick={saveNote} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium">{t.save}</button>
              <button onClick={() => setNoteModal(null)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 font-medium">{t.cancel}</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-blue-900 text-white">
            <tr>
              <th className="px-4 py-3 text-right">#</th>
              <th className="px-4 py-3 text-right">{t.col_name}</th>
              <th className="px-4 py-3 text-right">{t.col_position}</th>
              <th className="px-4 py-3 text-center">{t.col_status}</th>
              <th className="px-4 py-3 text-center">{t.col_checkin}</th>
              <th className="px-4 py-3 text-center">{t.col_checkout}</th>
              <th className="px-4 py-3 text-center">{t.col_note}</th>
            </tr>
          </thead>
          <tbody>
            {workers.map((worker, idx) => {
              const rec = getRecord(worker.id);
              return (
                <tr key={worker.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{worker.name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{worker.position}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-1 flex-wrap">
                      {(Object.keys(STATUS_LABELS) as AttendanceStatus[]).filter((s) => s !== 'late').map((s) => (
                        <button
                          key={s}
                          onClick={() => setStatus(worker, s)}
                          className={`px-2 py-1 rounded-lg text-xs font-medium border transition-all ${
                            rec?.status === s
                              ? STATUS_COLORS[s] + ' ring-2 ring-offset-1 ring-current'
                              : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                          }`}
                        >
                          {STATUS_LABELS[s]}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {rec?.checkIn ? (
                      <span className="font-mono text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded" dir="ltr">
                        {rec.checkIn}
                      </span>
                    ) : (
                      <button
                        onClick={() => recordTimeNow(worker, 'checkIn')}
                        disabled={!rec}
                        className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 border border-green-300 hover:bg-green-200 disabled:opacity-40 transition-colors"
                      >
                        ⏱ {t.col_checkin}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {rec?.checkOut ? (
                      <span className="font-mono text-xs text-red-700 bg-red-50 border border-red-200 px-2 py-1 rounded" dir="ltr">
                        {rec.checkOut}
                      </span>
                    ) : (
                      <button
                        onClick={() => recordTimeNow(worker, 'checkOut')}
                        disabled={!rec}
                        className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 border border-red-300 hover:bg-red-200 disabled:opacity-40 transition-colors"
                      >
                        ⏱ {t.col_checkout}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setNoteModal({ workerId: worker.id, note: rec?.note ?? '' })}
                      disabled={!rec}
                      className={`text-xs px-2 py-1 rounded transition-colors disabled:opacity-40 ${
                        rec?.note ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {rec?.note ? `📝 ${t.note_title}` : t.add_note}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getWorkers, getAttendance, getSettings } from '../../lib/store';
import { Worker, AttendanceRecord, AttendanceStatus } from '../../lib/types';
import { useLang } from '../../components/LangProvider';
import { exportWorkerExcel, exportAllWorkersExcel } from '../../lib/excel';

const STATUS_ICONS: Record<AttendanceStatus, string> = {
  present: '✅', absent: '❌', late: '⏰', leave: '🏖️', annual_leave: '📅',
};

export default function ReportsPage() {
  const { t } = useLang();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<string>('all');
  const [offDays, setOffDays] = useState<number[]>([5]);

  useEffect(() => {
    async function init() {
      const [ws, recs, settings] = await Promise.all([getWorkers(), getAttendance(), getSettings()]);
      setWorkers(ws);
      setAllRecords(recs);
      setOffDays(settings.weeklyOffDays);
    }
    init();
  }, []);

  const daysInMonth = new Date(year, month, 0).getDate();

  function getRecord(workerId: string, day: number) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return allRecords.find((r) => r.workerId === workerId && r.date === dateStr);
  }

  const workingDaysInMonth = Array.from({ length: daysInMonth }, (_, i) => i + 1)
    .filter((d) => !offDays.includes(new Date(year, month - 1, d).getDay())).length;

  function workerStats(workerId: string) {
    const s = { present: 0, absent: 0, late: 0, leave: 0, annual_leave: 0, recorded: 0 };
    for (let d = 1; d <= daysInMonth; d++) {
      const rec = getRecord(workerId, d);
      if (rec) { s[rec.status]++; s.recorded++; }
    }
    // النسبة = حاضر / أيام العمل الفعلية في الشهر (بدون الجمع)
    const rate = Math.round((s.present / workingDaysInMonth) * 100);
    return { ...s, rate };
  }

  function openPrint(workerId: string) {
    window.open(`/reports/print?workerId=${workerId}&year=${year}&month=${month}`, '_blank');
  }

  function handleExcelWorker(worker: Worker) {
    exportWorkerExcel(worker, allRecords, year, month, t, offDays);
  }

  function handleExcelAll() {
    exportAllWorkersExcel(workers, allRecords, year, month, t, offDays);
  }

  const filteredWorkers = selectedWorker === 'all' ? workers : workers.filter((w) => w.id === selectedWorker);
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-blue-900">{t.reports_title}</h2>
          <p className="text-gray-500 mt-1">{t.reports_sub}</p>
        </div>
        <Link href="/reports/annual"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors flex items-center gap-2">
          📅 {t.view_annual}
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow p-4 mb-5 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">{t.year_lbl}</label>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">{t.month_lbl}</label>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {t.months.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">{t.worker_lbl}</label>
          <select value={selectedWorker} onChange={(e) => setSelectedWorker(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">{t.all_workers}</option>
            {workers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <div className="flex gap-2 flex-wrap mr-auto">
          {selectedWorker !== 'all' && workers.find(w => w.id === selectedWorker) && (
            <>
              <button onClick={() => openPrint(selectedWorker)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-medium text-sm flex items-center gap-1">
                {t.download_pdf}
              </button>
              <button onClick={() => handleExcelWorker(workers.find(w => w.id === selectedWorker)!)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium text-sm flex items-center gap-1">
                {t.export_excel}
              </button>
            </>
          )}
          {selectedWorker === 'all' && workers.length > 0 && (
            <>
              <button onClick={() => openPrint('all')}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-medium text-sm">
                {t.print_all}
              </button>
              <button onClick={handleExcelAll}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium text-sm">
                {t.export_all_excel}
              </button>
            </>
          )}
        </div>
      </div>

      {workers.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center shadow">
          <p className="text-gray-400 text-lg">{t.no_workers_reports}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 mb-6">
            {filteredWorkers.map((worker) => {
              const stats = workerStats(worker.id);
              return (
                <div key={worker.id} className="bg-white rounded-xl shadow overflow-hidden">
                  <div className="bg-blue-900 text-white px-5 py-3 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      {worker.photo && <img src={worker.photo} alt={worker.name} className="w-10 h-10 rounded-full object-cover border-2 border-blue-400" />}
                      <div>
                        <p className="font-bold text-lg">{worker.name}</p>
                        <p className="text-blue-200 text-sm">{worker.position}{worker.department ? ` — ${worker.department}` : ''}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center flex-wrap">
                      <span className="bg-green-600 px-3 py-1 rounded-full text-sm">{stats.present} {t.days_present}</span>
                      <span className="bg-red-600 px-3 py-1 rounded-full text-sm">{stats.absent} {t.days_absent}</span>
                      <span className="bg-yellow-500 px-3 py-1 rounded-full text-sm">{stats.late} {t.days_late}</span>
                      <span className="bg-purple-600 px-3 py-1 rounded-full text-sm">{stats.leave} {t.days_leave}</span>
                      {stats.annual_leave > 0 && (
                        <span className="bg-teal-600 px-3 py-1 rounded-full text-sm">{stats.annual_leave} {t.days_annual_leave}</span>
                      )}
                      <button onClick={() => openPrint(worker.id)}
                        className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 transition-colors">
                        📄 PDF
                      </button>
                      <button onClick={() => handleExcelWorker(worker)}
                        className="bg-green-500 hover:bg-green-400 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 transition-colors">
                        📊 Excel
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex gap-1 flex-wrap">
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                        const rec = getRecord(worker.id, day);
                        const isOff = offDays.includes(new Date(year, month - 1, day).getDay());
                        return (
                          <div key={day}
                            title={rec ? `${day}/${month} — ${rec.status}` : `${day}/${month}`}
                            className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center text-xs font-medium border cursor-default ${
                              isOff ? 'bg-gray-100 text-gray-400 border-gray-200'
                              : rec
                                ? rec.status === 'present' ? 'bg-green-100 text-green-700 border-green-300'
                                : rec.status === 'absent' ? 'bg-red-100 text-red-700 border-red-300'
                                : rec.status === 'late' ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                                : rec.status === 'leave' ? 'bg-purple-100 text-purple-700 border-purple-300'
                                : 'bg-teal-100 text-teal-700 border-teal-300'
                              : 'bg-gray-50 text-gray-400 border-gray-200'
                            }`}>
                            <span className="leading-none">{day}</span>
                            {rec && <span className="leading-none">{STATUS_ICONS[rec.status]}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedWorker === 'all' && (
            <div className="bg-white rounded-xl shadow overflow-auto">
              <div className="bg-blue-900 text-white px-5 py-3">
                <p className="font-bold">{t.month_summary} — {t.months[month - 1]} {year}</p>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-right">{t.col_name}</th>
                    <th className="px-4 py-3 text-center text-green-700">{t.present}</th>
                    <th className="px-4 py-3 text-center text-red-700">{t.absent}</th>
                    <th className="px-4 py-3 text-center text-yellow-700">{t.late}</th>
                    <th className="px-4 py-3 text-center text-purple-700">{t.leave}</th>
                    <th className="px-4 py-3 text-center text-teal-700">{t.annual_leave}</th>
                    <th className="px-4 py-3 text-center text-blue-700">{t.attendance_rate}</th>
                    <th className="px-4 py-3 text-center text-emerald-700">{t.monthly_salary}</th>
                    <th className="px-4 py-3 text-center">{t.col_report}</th>
                  </tr>
                </thead>
                <tbody>
                  {workers.map((worker, idx) => {
                    const s = workerStats(worker.id);
                    const rate = s.rate;
                    return (
                      <tr key={worker.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {worker.photo
                              ? <img src={worker.photo} alt={worker.name} className="w-8 h-8 rounded-full object-cover" />
                              : <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">{worker.name.charAt(0)}</div>
                            }
                            <span className="font-medium text-gray-800">{worker.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-green-700 font-semibold">{s.present}</td>
                        <td className="px-4 py-3 text-center text-red-700 font-semibold">{s.absent}</td>
                        <td className="px-4 py-3 text-center text-yellow-700 font-semibold">{s.late}</td>
                        <td className="px-4 py-3 text-center text-purple-700 font-semibold">{s.leave}</td>
                        <td className="px-4 py-3 text-center text-teal-700 font-semibold">{s.annual_leave}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center gap-2 justify-center">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${rate}%` }} />
                            </div>
                            <span className="text-xs font-medium text-gray-700">{rate}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-emerald-700" dir="ltr">
                          {worker.dailyWage
                            ? (worker.dailyWage * s.present).toFixed(2) + ' د.م'
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-1 justify-center">
                            <button onClick={() => openPrint(worker.id)} className="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded hover:bg-red-50 transition-colors">📄</button>
                            <button onClick={() => handleExcelWorker(worker)} className="text-green-600 hover:text-green-800 text-xs px-2 py-1 rounded hover:bg-green-50 transition-colors">📊</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

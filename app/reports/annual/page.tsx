'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getWorkers, getAttendanceByYear, getSettings } from '../../../lib/store';
import { Worker, AttendanceRecord } from '../../../lib/types';
import { useLang } from '../../../components/LangProvider';
import { exportWorkerAnnualExcel, exportAllWorkersAnnualExcel } from '../../../lib/excel';

export default function AnnualReportsPage() {
  const { t } = useLang();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<string>('all');
  const [offDays, setOffDays] = useState<number[]>([5]);

  useEffect(() => {
    async function init() {
      const [ws, settings] = await Promise.all([getWorkers(), getSettings()]);
      setWorkers(ws);
      setOffDays(settings.weeklyOffDays);
    }
    init();
  }, []);

  useEffect(() => {
    getAttendanceByYear(year).then(setAllRecords);
  }, [year]);

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  function getWorkingDaysInMonth(m: number) {
    const daysInMonth = new Date(year, m, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1)
      .filter((d) => !offDays.includes(new Date(year, m - 1, d).getDay())).length;
  }

  function monthStats(workerId: string, month: number) {
    const daysInMonth = new Date(year, month, 0).getDate();
    let present = 0, absent = 0, late = 0, leave = 0, annual_leave = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const rec = allRecords.find((r) => r.workerId === workerId && r.date === dateStr);
      if (rec?.status === 'present') present++;
      else if (rec?.status === 'absent') absent++;
      else if (rec?.status === 'late') late++;
      else if (rec?.status === 'leave') leave++;
      else if (rec?.status === 'annual_leave') annual_leave++;
    }
    const workingDays = getWorkingDaysInMonth(month);
    const rate = workingDays > 0 ? Math.round((present / workingDays) * 100) : 0;
    return { present, absent, late, leave, annual_leave, workingDays, rate };
  }

  function workerAnnualTotals(workerId: string) {
    let present = 0, absent = 0, late = 0, leave = 0, annual_leave = 0, workingDays = 0;
    for (let m = 1; m <= 12; m++) {
      const s = monthStats(workerId, m);
      present += s.present; absent += s.absent; late += s.late;
      leave += s.leave; annual_leave += s.annual_leave; workingDays += s.workingDays;
    }
    const rate = workingDays > 0 ? Math.round((present / workingDays) * 100) : 0;
    return { present, absent, late, leave, annual_leave, workingDays, rate };
  }

  function rateColor(rate: number) {
    if (rate >= 90) return 'bg-green-100 text-green-800';
    if (rate >= 70) return 'bg-yellow-100 text-yellow-800';
    if (rate >= 50) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  }

  function rateBarColor(rate: number) {
    if (rate >= 90) return 'bg-green-500';
    if (rate >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  function openPrint(workerId: string) {
    window.open(`/reports/annual/print?workerId=${workerId}&year=${year}`, '_blank');
  }

  const specificWorker = selectedWorker !== 'all' ? workers.find((w) => w.id === selectedWorker) : null;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-blue-900">{t.annual_reports_title}</h2>
          <p className="text-gray-500 mt-1">{t.annual_reports_sub}</p>
        </div>
        <Link href="/reports"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors">
          {t.back_to_monthly}
        </Link>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white rounded-xl shadow p-4 mb-5 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">{t.year_lbl}</label>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
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
          {selectedWorker !== 'all' && specificWorker && (
            <>
              <button onClick={() => openPrint(selectedWorker)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-medium text-sm flex items-center gap-1">
                {t.annual_print_pdf}
              </button>
              <button onClick={() => exportWorkerAnnualExcel(specificWorker, allRecords, year, t, offDays)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium text-sm flex items-center gap-1">
                {t.annual_export_excel}
              </button>
            </>
          )}
          {selectedWorker === 'all' && workers.length > 0 && (
            <>
              <button onClick={() => openPrint('all')}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-medium text-sm">
                {t.annual_print_all}
              </button>
              <button onClick={() => exportAllWorkersAnnualExcel(workers, allRecords, year, t, offDays)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium text-sm">
                {t.annual_export_all_excel}
              </button>
            </>
          )}
        </div>
      </div>

      {workers.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center shadow">
          <p className="text-gray-400 text-lg">{t.no_workers_reports}</p>
        </div>
      ) : selectedWorker === 'all' ? (
        /* All workers: heatmap rate matrix */
        <div className="bg-white rounded-xl shadow overflow-auto">
          <div className="bg-blue-900 text-white px-5 py-3">
            <p className="font-bold">{t.annual_reports_title} — {year}</p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-right sticky left-0 bg-gray-50 z-10">{t.col_name}</th>
                {t.months.map((m, i) => (
                  <th key={i} className="px-2 py-3 text-center text-xs font-semibold text-gray-600 min-w-[50px]">
                    {m.slice(0, 3)}
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-blue-700 min-w-[100px]">{t.attendance_rate}</th>
                <th className="px-4 py-3 text-center">{t.col_report}</th>
              </tr>
            </thead>
            <tbody>
              {workers.map((worker, idx) => {
                const annual = workerAnnualTotals(worker.id);
                return (
                  <tr key={worker.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 border-b sticky left-0 bg-inherit z-10">
                      <div className="flex items-center gap-2">
                        {worker.photo
                          ? <img src={worker.photo} alt={worker.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                          : <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">{worker.name.charAt(0)}</div>
                        }
                        <span className="font-medium text-gray-800 whitespace-nowrap">{worker.name}</span>
                      </div>
                    </td>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                      const s = monthStats(worker.id, m);
                      return (
                        <td key={m} className="px-2 py-3 text-center border-b">
                          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${rateColor(s.rate)}`}>
                            {s.rate}%
                          </span>
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center border-b">
                      <div className="flex items-center gap-2 justify-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div className={`h-2 rounded-full ${rateBarColor(annual.rate)}`} style={{ width: `${annual.rate}%` }} />
                        </div>
                        <span className="text-xs font-bold text-gray-700 w-8">{annual.rate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center border-b">
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => openPrint(worker.id)}
                          className="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded hover:bg-red-50 transition-colors">📄</button>
                        <button onClick={() => exportWorkerAnnualExcel(worker, allRecords, year, t, offDays)}
                          className="text-green-600 hover:text-green-800 text-xs px-2 py-1 rounded hover:bg-green-50 transition-colors">📊</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : specificWorker ? (
        /* Specific worker: 12-month detail table */
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {/* Worker header */}
          <div className="bg-blue-900 text-white px-5 py-4 flex items-center gap-4 flex-wrap">
            {specificWorker.photo && (
              <img src={specificWorker.photo} alt={specificWorker.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-blue-400 shrink-0" />
            )}
            <div className="flex-1">
              <p className="font-bold text-lg">{specificWorker.name}</p>
              <p className="text-blue-200 text-sm">
                {specificWorker.position}{specificWorker.department ? ` — ${specificWorker.department}` : ''}
              </p>
            </div>
            <div className="text-center bg-white/10 rounded-lg px-5 py-2">
              <p className="text-blue-200 text-xs mb-0.5">{t.annual_reports_title}</p>
              <p className="font-bold text-2xl">{year}</p>
            </div>
          </div>

          {/* Annual totals summary bar */}
          {(() => {
            const totals = workerAnnualTotals(selectedWorker);
            return (
              <div className="grid grid-cols-3 sm:grid-cols-6 border-b">
                {[
                  { label: t.present, value: totals.present, cls: 'bg-green-50 text-green-700 border-green-100' },
                  { label: t.absent, value: totals.absent, cls: 'bg-red-50 text-red-700 border-red-100' },
                  { label: t.late, value: totals.late, cls: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
                  { label: t.leave, value: totals.leave, cls: 'bg-purple-50 text-purple-700 border-purple-100' },
                  { label: t.annual_leave, value: totals.annual_leave, cls: 'bg-teal-50 text-teal-700 border-teal-100' },
                  { label: t.attendance_rate, value: `${totals.rate}%`, cls: 'bg-blue-50 text-blue-700 border-blue-100' },
                ].map((item) => (
                  <div key={item.label} className={`${item.cls} border-r last:border-r-0 p-3 text-center`}>
                    <p className="text-2xl font-bold">{item.value}</p>
                    <p className="text-xs mt-0.5 opacity-80">{item.label}</p>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Monthly breakdown table */}
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-right">{t.col_month}</th>
                  <th className="px-4 py-3 text-center text-green-700">{t.present}</th>
                  <th className="px-4 py-3 text-center text-red-700">{t.absent}</th>
                  <th className="px-4 py-3 text-center text-yellow-700">{t.late}</th>
                  <th className="px-4 py-3 text-center text-purple-700">{t.leave}</th>
                  <th className="px-4 py-3 text-center text-teal-700">{t.annual_leave}</th>
                  <th className="px-4 py-3 text-center text-gray-600">{t.col_working_days}</th>
                  <th className="px-4 py-3 text-center text-blue-700">{t.attendance_rate}</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m, idx) => {
                  const s = monthStats(selectedWorker, m);
                  return (
                    <tr key={m} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 font-semibold text-gray-800">{t.months[m - 1]}</td>
                      <td className="px-4 py-3 text-center text-green-700 font-semibold">{s.present}</td>
                      <td className="px-4 py-3 text-center text-red-700 font-semibold">{s.absent}</td>
                      <td className="px-4 py-3 text-center text-yellow-700 font-semibold">{s.late}</td>
                      <td className="px-4 py-3 text-center text-purple-700 font-semibold">{s.leave}</td>
                      <td className="px-4 py-3 text-center text-teal-700 font-semibold">{s.annual_leave}</td>
                      <td className="px-4 py-3 text-center text-gray-500">{s.workingDays}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div className={`h-2 rounded-full ${rateBarColor(s.rate)}`} style={{ width: `${s.rate}%` }} />
                          </div>
                          <span className="text-xs font-bold text-gray-700 w-8">{s.rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-blue-50 border-t-2 border-blue-200 font-bold">
                {(() => {
                  const totals = workerAnnualTotals(selectedWorker);
                  return (
                    <tr>
                      <td className="px-4 py-3 text-blue-900">{t.annual_total}</td>
                      <td className="px-4 py-3 text-center text-green-700">{totals.present}</td>
                      <td className="px-4 py-3 text-center text-red-700">{totals.absent}</td>
                      <td className="px-4 py-3 text-center text-yellow-700">{totals.late}</td>
                      <td className="px-4 py-3 text-center text-purple-700">{totals.leave}</td>
                      <td className="px-4 py-3 text-center text-teal-700">{totals.annual_leave}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{totals.workingDays}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-16 bg-gray-300 rounded-full h-2">
                            <div className={`h-2 rounded-full ${rateBarColor(totals.rate)}`} style={{ width: `${totals.rate}%` }} />
                          </div>
                          <span className="text-sm font-bold text-blue-900 w-8">{totals.rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })()}
              </tfoot>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

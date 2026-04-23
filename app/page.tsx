'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getWorkers, getAttendance } from '../lib/store';
import { Worker, AttendanceRecord } from '../lib/types';
import { useLang } from '../components/LangProvider';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(dateStr: string, lang: string) {
  return new Date(dateStr).toLocaleDateString(
    lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-FR' : 'en-US',
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  );
}

export default function Dashboard() {
  const { t, lang } = useLang();
  const today = todayStr();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([]);

  function loadData() {
    const activeWorkers = getWorkers();
    const activeIds = new Set(activeWorkers.map((w) => w.id));
    const activeToday = getAttendance().filter((r) => r.date === todayStr() && activeIds.has(r.workerId));
    setWorkers(activeWorkers);
    setTodayRecords(activeToday);
  }

  useEffect(() => {
    loadData();
    document.addEventListener('visibilitychange', loadData);
    return () => document.removeEventListener('visibilitychange', loadData);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const totalWorkers = workers.length;

  function countStatus(status: string) {
    return workers.filter((w) => todayRecords.find((r) => r.workerId === w.id)?.status === status).length;
  }

  const presentCount = countStatus('present');
  const absentCount  = countStatus('absent');
  const lateCount    = countStatus('late');
  const leaveCount   = countStatus('leave');
  const recordedIds  = new Set(todayRecords.map((r) => r.workerId));
  const notRecorded  = workers.filter((w) => !recordedIds.has(w.id)).length;

  const cards = [
    { label: t.total_workers,  value: totalWorkers, color: 'bg-blue-600',   icon: '👷' },
    { label: t.present_today,  value: presentCount, color: 'bg-green-600',  icon: '✅' },
    { label: t.absent_today,   value: absentCount,  color: 'bg-red-600',    icon: '❌' },
    { label: t.late_today,     value: lateCount,    color: 'bg-yellow-500', icon: '⏰' },
    { label: t.on_leave,       value: leaveCount,   color: 'bg-purple-600', icon: '🏖️' },
    { label: t.not_recorded,   value: notRecorded,  color: 'bg-gray-500',   icon: '❓' },
  ];

  const recentAbsent = workers.filter((w) => todayRecords.find((r) => r.workerId === w.id)?.status === 'absent');

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-blue-900">{t.dash_title}</h2>
        <p className="text-gray-500 mt-1">{formatDate(today, lang)}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className={`${card.color} text-white rounded-xl p-5 shadow`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl font-bold">{card.value}</span>
              <span className="text-3xl">{card.icon}</span>
            </div>
            <p className="text-sm opacity-90">{card.label}</p>
          </div>
        ))}
      </div>

      {totalWorkers === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center shadow">
          <p className="text-gray-500 text-lg mb-4">{t.no_workers_msg}</p>
          <Link href="/workers" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
            {t.add_workers_btn}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-5 shadow">
            <h3 className="font-bold text-gray-700 mb-3 text-lg">{t.absent_list}</h3>
            {recentAbsent.length === 0 ? (
              <p className="text-gray-400 text-sm">{t.no_absents}</p>
            ) : (
              <ul className="space-y-2">
                {recentAbsent.map((w) => (
                  <li key={w.id} className="flex items-center gap-3 p-2 bg-red-50 rounded-lg">
                    <span className="text-red-500">❌</span>
                    <div><p className="font-medium text-gray-800">{w.name}</p><p className="text-xs text-gray-500">{w.position}</p></div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="bg-white rounded-xl p-5 shadow">
            <h3 className="font-bold text-gray-700 mb-3 text-lg">{t.quick_links}</h3>
            <div className="flex flex-col gap-3">
              <Link href="/pointage" className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                <span className="text-2xl">📋</span><span className="font-medium text-blue-800">{t.link_attendance}</span>
              </Link>
              <Link href="/workers" className="flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                <span className="text-2xl">👷</span><span className="font-medium text-green-800">{t.link_workers}</span>
              </Link>
              <Link href="/reports" className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                <span className="text-2xl">📊</span><span className="font-medium text-purple-800">{t.link_reports}</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

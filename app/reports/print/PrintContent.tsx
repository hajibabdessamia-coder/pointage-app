'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getWorkers, getAttendance, getSettings } from '../../../lib/store';
import { Worker, AttendanceRecord, AttendanceStatus } from '../../../lib/types';

const MONTHS = [
  'جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان',
  'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

const DAY_NAMES = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: 'حاضر', absent: 'غائب', late: 'متأخر', leave: 'إجازة', annual_leave: 'إجازة سنوية',
};

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: '#d1fae5', absent: '#fee2e2', late: '#fef9c3', leave: '#ede9fe', annual_leave: '#ccfbf1',
};

const STATUS_TEXT_COLORS: Record<AttendanceStatus, string> = {
  present: '#065f46', absent: '#991b1b', late: '#854d0e', leave: '#4c1d95', annual_leave: '#134e4a',
};

export default function PrintContent() {
  const params = useSearchParams();
  const workerId = params.get('workerId') || '';
  const year = parseInt(params.get('year') || String(new Date().getFullYear()));
  const month = parseInt(params.get('month') || String(new Date().getMonth() + 1));

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);
  const [offDays, setOffDays] = useState<number[]>([5]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setWorkers(getWorkers());
    setAllRecords(getAttendance());
    setOffDays(getSettings().weeklyOffDays);
    setReady(true);
  }, []);

  const daysInMonth = new Date(year, month, 0).getDate();
  const targetWorkers = workerId === 'all'
    ? workers
    : workers.filter((w) => w.id === workerId);

  function getRecord(wId: string, day: number) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return allRecords.find((r) => r.workerId === wId && r.date === dateStr);
  }

  function workerStats(wId: string) {
    let present = 0, absent = 0, late = 0, leave = 0, annual_leave = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const rec = getRecord(wId, d);
      if (rec?.status === 'present') present++;
      else if (rec?.status === 'absent') absent++;
      else if (rec?.status === 'late') late++;
      else if (rec?.status === 'leave') leave++;
      else if (rec?.status === 'annual_leave') annual_leave++;
    }
    return { present, absent, late, leave, annual_leave };
  }

  if (!ready) return <div style={{ padding: 40, textAlign: 'center', fontFamily: 'Arial' }}>جاري التحميل...</div>;
  if (targetWorkers.length === 0) return (
    <div style={{ padding: 40, textAlign: 'center', fontFamily: 'Arial' }}>
      <p>لم يتم العثور على العامل</p>
      <a href="/reports" style={{ color: '#2563eb' }}>رجوع</a>
    </div>
  );

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #fff; color: #111; direction: rtl; }
        .no-print { background: #1e3a5f; color: white; padding: 12px 20px; display: flex; align-items: center; gap: 12px; position: sticky; top: 0; z-index: 100; }
        .no-print button { background: white; color: #1e3a5f; border: none; padding: 8px 20px; border-radius: 6px; cursor: pointer; font-size: 15px; font-weight: bold; }
        .no-print button:hover { background: #e2e8f0; }
        .no-print a { color: #93c5fd; text-decoration: none; font-size: 14px; }
        .no-print a:hover { text-decoration: underline; }
        .report-page { padding: 30px; max-width: 900px; margin: 0 auto; }
        .page-break { page-break-after: always; padding-bottom: 30px; margin-bottom: 40px; border-bottom: 2px dashed #e5e7eb; }
        .page-break:last-child { page-break-after: avoid; border-bottom: none; }
        @media print {
          .no-print { display: none !important; }
          .report-page { padding: 15px; }
          .page-break { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; }
        }
      `}</style>

      <div className="no-print">
        <span style={{ fontSize: 20 }}>📄</span>
        <span style={{ fontWeight: 'bold', fontSize: 16 }}>معاينة التقرير — {MONTHS[month - 1]} {year}</span>
        <button onClick={() => window.print()}>🖨️ طباعة / حفظ كـ PDF</button>
        <a href="/reports">← رجوع</a>
      </div>

      <div className="report-page">
        {targetWorkers.map((worker, wIdx) => {
          const stats = workerStats(worker.id);
          const recordedDays = stats.present + stats.absent + stats.late + stats.leave;
          const attendanceRate = recordedDays > 0 ? Math.round((stats.present / recordedDays) * 100) : 0;

          return (
            <div key={worker.id} className={wIdx < targetWorkers.length - 1 ? 'page-break' : ''}>
              {/* Header */}
              <div style={{ background: '#1e3a5f', color: 'white', borderRadius: 12, padding: '20px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                {worker.photo && (
                  <img src={worker.photo} alt={worker.name}
                    style={{ width: 70, height: 70, borderRadius: '50%', objectFit: 'cover', border: '3px solid #60a5fa' }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 4 }}>{worker.name}</div>
                  <div style={{ color: '#93c5fd', fontSize: 14 }}>
                    {worker.position}{worker.department ? ` — ${worker.department}` : ''}
                    {worker.phone ? ` | ☎ ${worker.phone}` : ''}
                  </div>
                  <div style={{ color: '#bfdbfe', fontSize: 13, marginTop: 2 }}>
                    تاريخ الالتحاق: {worker.startDate}
                  </div>
                </div>
                <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '10px 20px' }}>
                  <div style={{ fontSize: 13, color: '#bfdbfe', marginBottom: 4 }}>التقرير الشهري</div>
                  <div style={{ fontSize: 18, fontWeight: 'bold' }}>{MONTHS[month - 1]}</div>
                  <div style={{ fontSize: 15, color: '#93c5fd' }}>{year}</div>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 20 }}>
                {[
                  { label: 'أيام الحضور', value: stats.present, bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
                  { label: 'أيام الغياب', value: stats.absent, bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
                  { label: 'أيام التأخر', value: stats.late, bg: '#fef9c3', color: '#854d0e', border: '#fde047' },
                  { label: 'أيام الإجازة', value: stats.leave, bg: '#ede9fe', color: '#4c1d95', border: '#c4b5fd' },
                  { label: 'إجازة سنوية', value: stats.annual_leave, bg: '#ccfbf1', color: '#134e4a', border: '#5eead4' },
                  { label: 'نسبة الحضور', value: `${attendanceRate}%`, bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
                ].map((item) => (
                  <div key={item.label} style={{ background: item.bg, border: `1.5px solid ${item.border}`, borderRadius: 10, padding: '12px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 26, fontWeight: 'bold', color: item.color }}>{item.value}</div>
                    <div style={{ fontSize: 11, color: item.color, marginTop: 2 }}>{item.label}</div>
                  </div>
                ))}
              </div>

              {/* Daily table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 20 }}>
                <thead>
                  <tr style={{ background: '#1e3a5f', color: 'white' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'right', borderRadius: '8px 0 0 0' }}>اليوم</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>التاريخ</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>الحالة</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>وقت الدخول</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>وقت الخروج</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', borderRadius: '0 8px 0 0' }}>ملاحظة</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                    const date = new Date(year, month - 1, day);
                    const dayName = DAY_NAMES[date.getDay()];
                    const isOff = offDays.includes(date.getDay());
                    const rec = getRecord(worker.id, day);
                    const dateStr = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;

                    return (
                      <tr key={day} style={{
                        background: isOff ? '#f9fafb' : rec ? STATUS_COLORS[rec.status] : '#ffffff',
                        borderBottom: '1px solid #e5e7eb',
                      }}>
                        <td style={{ padding: '7px 10px', fontWeight: isOff ? 'normal' : '600', color: isOff ? '#9ca3af' : '#111827' }}>
                          {dayName}
                        </td>
                        <td style={{ padding: '7px 10px', textAlign: 'center', direction: 'ltr', color: '#374151' }}>{dateStr}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                          {isOff ? (
                            <span style={{ color: '#9ca3af', fontSize: 12 }}>إجازة أسبوعية</span>
                          ) : rec ? (
                            <span style={{
                              background: STATUS_COLORS[rec.status],
                              color: STATUS_TEXT_COLORS[rec.status],
                              padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 'bold',
                              border: `1px solid ${STATUS_TEXT_COLORS[rec.status]}33`
                            }}>
                              {STATUS_LABELS[rec.status]}
                            </span>
                          ) : (
                            <span style={{ color: '#d1d5db', fontSize: 12 }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '7px 10px', textAlign: 'center', direction: 'ltr', color: '#374151', fontSize: 12 }}>
                          {rec?.checkIn || '—'}
                        </td>
                        <td style={{ padding: '7px 10px', textAlign: 'center', direction: 'ltr', color: '#374151', fontSize: 12 }}>
                          {rec?.checkOut || '—'}
                        </td>
                        <td style={{ padding: '7px 10px', color: '#6b7280', fontSize: 12 }}>
                          {rec?.note || ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Footer */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30, marginTop: 30, paddingTop: 20, borderTop: '2px solid #e5e7eb' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 50 }}>توقيع المسؤول</p>
                  <div style={{ borderTop: '1.5px solid #374151', paddingTop: 8, fontSize: 13, color: '#374151' }}>الاسم والتوقيع</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 50 }}>توقيع العامل</p>
                  <div style={{ borderTop: '1.5px solid #374151', paddingTop: 8, fontSize: 13, color: '#374151' }}>{worker.name}</div>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: '#9ca3af' }}>
                تم إنشاء هذا التقرير بواسطة نظام الحضور والغياب — {new Date().toLocaleDateString('ar-DZ')}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

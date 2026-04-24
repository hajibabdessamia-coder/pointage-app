'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getWorkers, getAttendanceByYear, getSettings } from '../../../../lib/store';
import { Worker, AttendanceRecord } from '../../../../lib/types';

const MONTHS_AR = [
  'جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان',
  'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

export default function AnnualPrintContent() {
  const params = useSearchParams();
  const workerId = params.get('workerId') || '';
  const year = parseInt(params.get('year') || String(new Date().getFullYear()));

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);
  const [offDays, setOffDays] = useState<number[]>([5]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      const [ws, recs, settings] = await Promise.all([
        getWorkers(), getAttendanceByYear(year), getSettings(),
      ]);
      setWorkers(ws);
      setAllRecords(recs);
      setOffDays(settings.weeklyOffDays);
      setReady(true);
    }
    init();
  }, [year]);

  const targetWorkers = workerId === 'all' ? workers : workers.filter((w) => w.id === workerId);

  function getWorkingDaysInMonth(m: number) {
    const daysInMonth = new Date(year, m, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1)
      .filter((d) => !offDays.includes(new Date(year, m - 1, d).getDay())).length;
  }

  function monthStats(wId: string, month: number) {
    const daysInMonth = new Date(year, month, 0).getDate();
    let present = 0, absent = 0, late = 0, leave = 0, annual_leave = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const rec = allRecords.find((r) => r.workerId === wId && r.date === dateStr);
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

  function annualTotals(wId: string) {
    let present = 0, absent = 0, late = 0, leave = 0, annual_leave = 0, workingDays = 0;
    for (let m = 1; m <= 12; m++) {
      const s = monthStats(wId, m);
      present += s.present; absent += s.absent; late += s.late;
      leave += s.leave; annual_leave += s.annual_leave; workingDays += s.workingDays;
    }
    const rate = workingDays > 0 ? Math.round((present / workingDays) * 100) : 0;
    return { present, absent, late, leave, annual_leave, workingDays, rate };
  }

  function rateStyle(rate: number): { bg: string; color: string } {
    if (rate >= 90) return { bg: '#d1fae5', color: '#065f46' };
    if (rate >= 70) return { bg: '#fef9c3', color: '#854d0e' };
    return { bg: '#fee2e2', color: '#991b1b' };
  }

  if (!ready) return <div style={{ padding: 40, textAlign: 'center', fontFamily: 'Arial' }}>جاري التحميل...</div>;
  if (targetWorkers.length === 0) return (
    <div style={{ padding: 40, textAlign: 'center', fontFamily: 'Arial' }}>
      <p>لم يتم العثور على العامل</p>
      <a href="/reports/annual" style={{ color: '#2563eb' }}>رجوع</a>
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
        .report-page { padding: 30px; max-width: 960px; margin: 0 auto; }
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
        <span style={{ fontSize: 20 }}>📅</span>
        <span style={{ fontWeight: 'bold', fontSize: 16 }}>التقرير السنوي — {year}</span>
        <button onClick={() => window.print()}>🖨️ طباعة / حفظ كـ PDF</button>
        <a href="/reports/annual">← رجوع</a>
      </div>

      <div className="report-page">
        {targetWorkers.map((worker, wIdx) => {
          const totals = annualTotals(worker.id);
          return (
            <div key={worker.id} className={wIdx < targetWorkers.length - 1 ? 'page-break' : ''}>

              {/* Worker header */}
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
                <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '12px 24px' }}>
                  <div style={{ fontSize: 13, color: '#bfdbfe', marginBottom: 4 }}>التقرير السنوي</div>
                  <div style={{ fontSize: 26, fontWeight: 'bold' }}>{year}</div>
                </div>
              </div>

              {/* Annual totals cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 20 }}>
                {[
                  { label: 'أيام الحضور',   value: totals.present,      bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
                  { label: 'أيام الغياب',   value: totals.absent,       bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
                  { label: 'أيام التأخر',   value: totals.late,         bg: '#fef9c3', color: '#854d0e', border: '#fde047' },
                  { label: 'أيام الإجازة',  value: totals.leave,        bg: '#ede9fe', color: '#4c1d95', border: '#c4b5fd' },
                  { label: 'إجازة سنوية',  value: totals.annual_leave,  bg: '#ccfbf1', color: '#134e4a', border: '#5eead4' },
                  { label: 'نسبة الحضور',  value: `${totals.rate}%`,    bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
                ].map((item) => (
                  <div key={item.label} style={{ background: item.bg, border: `1.5px solid ${item.border}`, borderRadius: 10, padding: '12px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 26, fontWeight: 'bold', color: item.color }}>{item.value}</div>
                    <div style={{ fontSize: 11, color: item.color, marginTop: 2 }}>{item.label}</div>
                  </div>
                ))}
              </div>

              {/* Monthly breakdown table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 24 }}>
                <thead>
                  <tr style={{ background: '#1e3a5f', color: 'white' }}>
                    <th style={{ padding: '9px 12px', textAlign: 'right' }}>الشهر</th>
                    <th style={{ padding: '9px 12px', textAlign: 'center' }}>حضور</th>
                    <th style={{ padding: '9px 12px', textAlign: 'center' }}>غياب</th>
                    <th style={{ padding: '9px 12px', textAlign: 'center' }}>تأخر</th>
                    <th style={{ padding: '9px 12px', textAlign: 'center' }}>إجازة</th>
                    <th style={{ padding: '9px 12px', textAlign: 'center' }}>إجازة سنوية</th>
                    <th style={{ padding: '9px 12px', textAlign: 'center' }}>أيام العمل</th>
                    <th style={{ padding: '9px 12px', textAlign: 'center' }}>نسبة الحضور</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m, idx) => {
                    const s = monthStats(worker.id, m);
                    const rs = rateStyle(s.rate);
                    return (
                      <tr key={m} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '8px 12px', fontWeight: '600', color: '#1e3a5f' }}>{MONTHS_AR[m - 1]}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', color: '#065f46', fontWeight: '600' }}>{s.present}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', color: '#991b1b', fontWeight: '600' }}>{s.absent}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', color: '#854d0e', fontWeight: '600' }}>{s.late}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', color: '#4c1d95', fontWeight: '600' }}>{s.leave}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', color: '#134e4a', fontWeight: '600' }}>{s.annual_leave}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', color: '#6b7280' }}>{s.workingDays}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <span style={{ background: rs.bg, color: rs.color, padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 'bold' }}>
                            {s.rate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#eff6ff', borderTop: '2px solid #bfdbfe', fontWeight: 'bold' }}>
                    <td style={{ padding: '10px 12px', color: '#1e3a5f', fontSize: 14 }}>المجموع السنوي</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: '#065f46' }}>{totals.present}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: '#991b1b' }}>{totals.absent}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: '#854d0e' }}>{totals.late}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: '#4c1d95' }}>{totals.leave}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: '#134e4a' }}>{totals.annual_leave}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: '#374151' }}>{totals.workingDays}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <span style={{ background: '#dbeafe', color: '#1e40af', padding: '3px 14px', borderRadius: 20, fontSize: 13, fontWeight: 'bold' }}>
                        {totals.rate}%
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Signature section */}
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

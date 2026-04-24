'use client';

import * as XLSX from 'xlsx';
import { Worker, AttendanceRecord } from './types';
import { Translations } from './lang';

function getStatusLabel(status: string, t: Translations): string {
  if (status === 'present') return t.excel_present;
  if (status === 'absent') return t.excel_absent;
  if (status === 'late') return t.excel_late;
  if (status === 'leave') return t.excel_leave;
  if (status === 'annual_leave') return t.annual_leave;
  return '—';
}

function buildWorkerSheet(worker: Worker, records: AttendanceRecord[], year: number, month: number, t: Translations, offDays: number[]) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const rows: (string | number)[][] = [];

  // Header info
  rows.push([t.excel_name, worker.name]);
  rows.push([t.excel_position, worker.position]);
  rows.push([t.excel_dept, worker.department || '—']);
  rows.push(['', '']);

  // Column headers
  rows.push([t.excel_day, t.excel_date, t.excel_status, t.excel_checkin, t.excel_checkout, t.excel_note]);

  let presentCount = 0, absentCount = 0, lateCount = 0, leaveCount = 0, annualLeaveCount = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const displayDate = `${String(d).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    const rec = records.find((r) => r.date === dateStr);
    const dayName = t.days[new Date(year, month - 1, d).getDay()];

    if (rec) {
      if (rec.status === 'present') presentCount++;
      else if (rec.status === 'absent') absentCount++;
      else if (rec.status === 'late') lateCount++;
      else if (rec.status === 'leave') leaveCount++;
      else if (rec.status === 'annual_leave') annualLeaveCount++;
    }

    rows.push([
      dayName,
      displayDate,
      rec ? getStatusLabel(rec.status, t) : '—',
      rec?.checkIn || '—',
      rec?.checkOut || '—',
      rec?.note || '',
    ]);
  }

  const recorded = presentCount + absentCount + lateCount + leaveCount;
  const workingDays = Array.from({ length: daysInMonth }, (_, i) => i + 1)
    .filter((d) => !offDays.includes(new Date(year, month - 1, d).getDay())).length;
  const rate = Math.round((presentCount / workingDays) * 100);

  rows.push(['', '']);
  rows.push([t.excel_present, presentCount, t.excel_absent, absentCount, t.excel_late, lateCount, t.excel_leave, leaveCount, t.annual_leave, annualLeaveCount]);
  rows.push([t.excel_rate, `${rate}%`, t.excel_total, recorded]);

  return rows;
}

export function exportWorkerExcel(worker: Worker, allRecords: AttendanceRecord[], year: number, month: number, t: Translations, offDays: number[]) {
  const workerRecords = allRecords.filter((r) => r.workerId === worker.id);
  const wb = XLSX.utils.book_new();
  const rows = buildWorkerSheet(worker, workerRecords, year, month, t, offDays);
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Column widths
  ws['!cols'] = [{ wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 25 }];

  XLSX.utils.book_append_sheet(wb, ws, worker.name.slice(0, 31));
  XLSX.writeFile(wb, `${worker.name}-${t.months[month - 1]}-${year}.xlsx`);
}

export function exportWorkerAnnualExcel(worker: Worker, allRecords: AttendanceRecord[], year: number, t: Translations, offDays: number[]) {
  const workerRecords = allRecords.filter((r) => r.workerId === worker.id);
  const wb = XLSX.utils.book_new();
  const rows: (string | number)[][] = [];

  rows.push([t.excel_name, worker.name]);
  rows.push([t.excel_position, worker.position]);
  rows.push([t.excel_dept, worker.department || '—']);
  rows.push(['', '']);
  rows.push([t.col_month, t.excel_present, t.excel_absent, t.excel_late, t.excel_leave, t.annual_leave, t.col_working_days, t.excel_rate]);

  let totalPresent = 0, totalAbsent = 0, totalLate = 0, totalLeave = 0, totalAnnual = 0, totalWorkingDays = 0;

  for (let m = 1; m <= 12; m++) {
    const daysInMonth = new Date(year, m, 0).getDate();
    let present = 0, absent = 0, late = 0, leave = 0, annual_leave = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const rec = workerRecords.find((r) => r.date === dateStr);
      if (rec?.status === 'present') present++;
      else if (rec?.status === 'absent') absent++;
      else if (rec?.status === 'late') late++;
      else if (rec?.status === 'leave') leave++;
      else if (rec?.status === 'annual_leave') annual_leave++;
    }
    const workingDays = Array.from({ length: daysInMonth }, (_, i) => i + 1)
      .filter((d) => !offDays.includes(new Date(year, m - 1, d).getDay())).length;
    const rate = workingDays > 0 ? `${Math.round((present / workingDays) * 100)}%` : '0%';
    rows.push([t.months[m - 1], present, absent, late, leave, annual_leave, workingDays, rate]);
    totalPresent += present; totalAbsent += absent; totalLate += late;
    totalLeave += leave; totalAnnual += annual_leave; totalWorkingDays += workingDays;
  }

  const annualRate = totalWorkingDays > 0 ? `${Math.round((totalPresent / totalWorkingDays) * 100)}%` : '0%';
  rows.push(['', '']);
  rows.push([t.annual_total, totalPresent, totalAbsent, totalLate, totalLeave, totalAnnual, totalWorkingDays, annualRate]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws, worker.name.slice(0, 31));
  XLSX.writeFile(wb, `${worker.name}-${year}.xlsx`);
}

export function exportAllWorkersAnnualExcel(workers: Worker[], allRecords: AttendanceRecord[], year: number, t: Translations, offDays: number[]) {
  const wb = XLSX.utils.book_new();

  // Summary sheet: rows = workers, columns = months + annual totals
  const summaryRows: (string | number)[][] = [];
  summaryRows.push([
    t.excel_name, t.excel_position,
    ...t.months,
    t.excel_present, t.excel_absent, t.excel_late, t.excel_leave, t.annual_leave, t.excel_rate,
  ]);

  for (const worker of workers) {
    const workerRecords = allRecords.filter((r) => r.workerId === worker.id);
    const monthRates: string[] = [];
    let totalPresent = 0, totalAbsent = 0, totalLate = 0, totalLeave = 0, totalAnnual = 0, totalWorkingDays = 0;

    for (let m = 1; m <= 12; m++) {
      const daysInMonth = new Date(year, m, 0).getDate();
      let p = 0, a = 0, l = 0, lv = 0, al = 0;
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const rec = workerRecords.find((r) => r.date === dateStr);
        if (rec?.status === 'present') p++;
        else if (rec?.status === 'absent') a++;
        else if (rec?.status === 'late') l++;
        else if (rec?.status === 'leave') lv++;
        else if (rec?.status === 'annual_leave') al++;
      }
      const workingDays = Array.from({ length: daysInMonth }, (_, i) => i + 1)
        .filter((d) => !offDays.includes(new Date(year, m - 1, d).getDay())).length;
      monthRates.push(workingDays > 0 ? `${Math.round((p / workingDays) * 100)}%` : '0%');
      totalPresent += p; totalAbsent += a; totalLate += l; totalLeave += lv; totalAnnual += al; totalWorkingDays += workingDays;
    }

    const annualRate = totalWorkingDays > 0 ? `${Math.round((totalPresent / totalWorkingDays) * 100)}%` : '0%';
    summaryRows.push([worker.name, worker.position || '—', ...monthRates, totalPresent, totalAbsent, totalLate, totalLeave, totalAnnual, annualRate]);
  }

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryRows);
  summaryWs['!cols'] = [{ wch: 20 }, { wch: 16 }, ...Array(12).fill({ wch: 8 }), { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, t.excel_summary);

  // One sheet per worker
  for (const worker of workers) {
    const workerRecords = allRecords.filter((r) => r.workerId === worker.id);
    const rows: (string | number)[][] = [];
    rows.push([t.excel_name, worker.name]);
    rows.push([t.excel_position, worker.position]);
    rows.push([t.col_month, t.excel_present, t.excel_absent, t.excel_late, t.excel_leave, t.annual_leave, t.col_working_days, t.excel_rate]);

    let totalPresent = 0, totalAbsent = 0, totalLate = 0, totalLeave = 0, totalAnnual = 0, totalWorkingDays = 0;
    for (let m = 1; m <= 12; m++) {
      const daysInMonth = new Date(year, m, 0).getDate();
      let p = 0, a = 0, l = 0, lv = 0, al = 0;
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const rec = workerRecords.find((r) => r.date === dateStr);
        if (rec?.status === 'present') p++;
        else if (rec?.status === 'absent') a++;
        else if (rec?.status === 'late') l++;
        else if (rec?.status === 'leave') lv++;
        else if (rec?.status === 'annual_leave') al++;
      }
      const workingDays = Array.from({ length: daysInMonth }, (_, i) => i + 1)
        .filter((d) => !offDays.includes(new Date(year, m - 1, d).getDay())).length;
      const rate = workingDays > 0 ? `${Math.round((p / workingDays) * 100)}%` : '0%';
      rows.push([t.months[m - 1], p, a, l, lv, al, workingDays, rate]);
      totalPresent += p; totalAbsent += a; totalLate += l; totalLeave += lv; totalAnnual += al; totalWorkingDays += workingDays;
    }
    const annualRate = totalWorkingDays > 0 ? `${Math.round((totalPresent / totalWorkingDays) * 100)}%` : '0%';
    rows.push([t.annual_total, totalPresent, totalAbsent, totalLate, totalLeave, totalAnnual, totalWorkingDays, annualRate]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws, worker.name.slice(0, 31));
  }

  XLSX.writeFile(wb, `rapport-annuel-${year}.xlsx`);
}

export function exportAllWorkersExcel(workers: Worker[], allRecords: AttendanceRecord[], year: number, month: number, t: Translations, offDays: number[]) {
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summaryRows: (string | number)[][] = [];
  summaryRows.push([t.excel_name, t.excel_position, t.excel_dept, t.excel_present, t.excel_absent, t.excel_late, t.excel_leave, t.annual_leave, t.excel_total, t.excel_rate]);

  for (const worker of workers) {
    const recs = allRecords.filter((r) => r.workerId === worker.id);
    const daysInMonth = new Date(year, month, 0).getDate();
    let p = 0, a = 0, l = 0, lv = 0, al = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const rec = recs.find((r) => r.date === dateStr);
      if (rec?.status === 'present') p++;
      else if (rec?.status === 'absent') a++;
      else if (rec?.status === 'late') l++;
      else if (rec?.status === 'leave') lv++;
      else if (rec?.status === 'annual_leave') al++;
    }
    const total = p + a + l + lv + al;
    const workingDays = Array.from({ length: daysInMonth }, (_, i) => i + 1)
      .filter((d) => !offDays.includes(new Date(year, month - 1, d).getDay())).length;
    const rate = `${Math.round((p / workingDays) * 100)}%`;
    summaryRows.push([worker.name, worker.position, worker.department || '—', p, a, l, lv, al, total, rate]);
  }

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryRows);
  summaryWs['!cols'] = [{ wch: 20 }, { wch: 16 }, { wch: 14 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, t.excel_summary);

  // One sheet per worker
  for (const worker of workers) {
    const workerRecords = allRecords.filter((r) => r.workerId === worker.id);
    const rows = buildWorkerSheet(worker, workerRecords, year, month, t, offDays);
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, ws, worker.name.slice(0, 31));
  }

  XLSX.writeFile(wb, `rapport-${t.months[month - 1]}-${year}.xlsx`);
}

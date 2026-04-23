'use client';

import { Worker, AttendanceRecord, AppSettings } from './types';

const WORKERS_KEY = 'pointage_workers';
const ARCHIVED_KEY = 'pointage_archived_workers';
const ATTENDANCE_KEY = 'pointage_attendance';

// يُرجع العمال النشطين فقط — بدون تكرار
export function getWorkers(): Worker[] {
  if (typeof window === 'undefined') return [];
  const raw: Worker[] = JSON.parse(localStorage.getItem(WORKERS_KEY) || '[]');
  // نحذف أي تكرار في الـ id
  const seen = new Set<string>();
  const unique = raw.filter((w) => {
    if (seen.has(w.id)) return false;
    seen.add(w.id);
    return true;
  });
  // إذا وُجد تكرار نصلحه مباشرة في localStorage
  if (unique.length !== raw.length) {
    localStorage.setItem(WORKERS_KEY, JSON.stringify(unique));
  }
  return unique;
}

export function saveWorkers(workers: Worker[]): void {
  localStorage.setItem(WORKERS_KEY, JSON.stringify(workers));
}

export function getArchivedWorkers(): Worker[] {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem(ARCHIVED_KEY) || '[]');
}

function saveArchivedWorkers(workers: Worker[]): void {
  localStorage.setItem(ARCHIVED_KEY, JSON.stringify(workers));
}

export function archiveWorker(id: string): void {
  const workers = getWorkers();
  const worker = workers.find((w) => w.id === id);
  if (!worker) return;
  saveWorkers(workers.filter((w) => w.id !== id));
  const archived = getArchivedWorkers();
  saveArchivedWorkers([...archived, { ...worker, archivedAt: new Date().toISOString() }]);
}

export function restoreWorker(id: string): void {
  const archived = getArchivedWorkers();
  const worker = archived.find((w) => w.id === id);
  if (!worker) return;
  saveArchivedWorkers(archived.filter((w) => w.id !== id));
  const { archivedAt: _, ...active } = worker;
  saveWorkers([...getWorkers(), active]);
}

export function deleteArchivedWorker(id: string): void {
  saveArchivedWorkers(getArchivedWorkers().filter((w) => w.id !== id));
  saveAttendance(getAttendance().filter((r) => r.workerId !== id));
}

// يُرجع سجلات الحضور — بدون تكرار لنفس العامل في نفس اليوم
export function getAttendance(): AttendanceRecord[] {
  if (typeof window === 'undefined') return [];
  const raw: AttendanceRecord[] = JSON.parse(localStorage.getItem(ATTENDANCE_KEY) || '[]');
  // لكل (workerId + date) نحتفظ بآخر سجل فقط
  const map = new Map<string, AttendanceRecord>();
  for (const r of raw) {
    map.set(`${r.workerId}_${r.date}`, r);
  }
  const unique = Array.from(map.values());
  if (unique.length !== raw.length) {
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(unique));
  }
  return unique;
}

export function saveAttendance(records: AttendanceRecord[]): void {
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(records));
}

export function getAttendanceByDate(date: string): AttendanceRecord[] {
  return getAttendance().filter((r) => r.date === date);
}

export function getAttendanceByWorker(workerId: string): AttendanceRecord[] {
  return getAttendance().filter((r) => r.workerId === workerId);
}

export function getAttendanceByWorkerAndMonth(workerId: string, year: number, month: number): AttendanceRecord[] {
  return getAttendance().filter((r) => {
    const d = new Date(r.date);
    return r.workerId === workerId && d.getFullYear() === year && d.getMonth() + 1 === month;
  });
}

const SETTINGS_KEY = 'pointage_settings';
const DEFAULT_SETTINGS: AppSettings = { weeklyOffDays: [5] };

export function getSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      weeklyOffDays: Array.isArray(parsed.weeklyOffDays) ? parsed.weeklyOffDays : [5],
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export function upsertAttendance(record: AttendanceRecord): void {
  const all = getAttendance();
  const idx = all.findIndex((r) => r.workerId === record.workerId && r.date === record.date);
  if (idx >= 0) {
    all[idx] = record;
  } else {
    all.push(record);
  }
  saveAttendance(all);
}

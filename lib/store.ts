'use client';

import { supabase } from './supabase';
import { Worker, AttendanceRecord, AppSettings } from './types';

// ─── Workers ────────────────────────────────────────────────────────────────

export async function getWorkers(): Promise<Worker[]> {
  const { data } = await supabase
    .from('workers')
    .select('*')
    .is('archived_at', null)
    .order('created_at');
  return (data || []).map(dbToWorker);
}

export async function getArchivedWorkers(): Promise<Worker[]> {
  const { data } = await supabase
    .from('workers')
    .select('*')
    .not('archived_at', 'is', null)
    .order('archived_at', { ascending: false });
  return (data || []).map(dbToWorker);
}

export async function addWorker(worker: Omit<Worker, 'id'>): Promise<Worker | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('workers')
    .insert({ ...workerToDB(worker as Worker), user_id: user.id })
    .select()
    .single();
  if (error) { console.error(error); return null; }
  return dbToWorker(data);
}

export async function updateWorker(worker: Worker): Promise<void> {
  await supabase.from('workers').update(workerToDB(worker)).eq('id', worker.id);
}

export async function archiveWorker(id: string): Promise<void> {
  await supabase
    .from('workers')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id);
}

export async function restoreWorker(id: string): Promise<void> {
  await supabase.from('workers').update({ archived_at: null }).eq('id', id);
}

export async function deleteArchivedWorker(id: string): Promise<void> {
  await supabase.from('workers').delete().eq('id', id);
}

// ─── Attendance ──────────────────────────────────────────────────────────────

export async function getAttendance(): Promise<AttendanceRecord[]> {
  const { data } = await supabase.from('attendance_records').select('*');
  return (data || []).map(dbToRecord);
}

export async function getAttendanceByDate(date: string): Promise<AttendanceRecord[]> {
  const { data } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('date', date);
  return (data || []).map(dbToRecord);
}

export async function getAttendanceByWorker(workerId: string): Promise<AttendanceRecord[]> {
  const { data } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('worker_id', workerId)
    .order('date', { ascending: false });
  return (data || []).map(dbToRecord);
}

export async function getAttendanceByWorkers(workerIds: string[]): Promise<AttendanceRecord[]> {
  if (workerIds.length === 0) return [];
  const { data } = await supabase
    .from('attendance_records')
    .select('*')
    .in('worker_id', workerIds)
    .order('date', { ascending: false });
  return (data || []).map(dbToRecord);
}

export async function getAttendanceByYear(year: number): Promise<AttendanceRecord[]> {
  const { data } = await supabase
    .from('attendance_records')
    .select('*')
    .gte('date', `${year}-01-01`)
    .lte('date', `${year}-12-31`);
  return (data || []).map(dbToRecord);
}

export async function getAttendanceByWorkerAndMonth(
  workerId: string, year: number, month: number
): Promise<AttendanceRecord[]> {
  const from = `${year}-${String(month).padStart(2, '0')}-01`;
  const to   = `${year}-${String(month).padStart(2, '0')}-31`;
  const { data } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('worker_id', workerId)
    .gte('date', from)
    .lte('date', to);
  return (data || []).map(dbToRecord);
}

export async function upsertAttendance(record: AttendanceRecord): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('attendance_records').upsert({
    id: record.id,
    user_id: user.id,
    worker_id: record.workerId,
    date: record.date,
    status: record.status,
    check_in: record.checkIn,
    check_out: record.checkOut,
    note: record.note,
  }, { onConflict: 'worker_id,date' });
}

// ─── Settings ────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<AppSettings> {
  const { data } = await supabase.from('app_settings').select('*').maybeSingle();
  return { weeklyOffDays: data?.weekly_off_days ?? [5] };
}

export async function saveSettings(s: AppSettings): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('app_settings').upsert(
    { user_id: user.id, weekly_off_days: s.weeklyOffDays },
    { onConflict: 'user_id' }
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function dbToWorker(row: Record<string, unknown>): Worker {
  return {
    id:          row.id as string,
    name:        row.name as string,
    position:    row.position as string,
    department:  (row.department as string) || '',
    phone:       (row.phone as string) || '',
    startDate:   row.start_date as string,
    photo:       (row.photo as string) || '',
    archivedAt:  (row.archived_at as string) || undefined,
    dailyWage:   (row.daily_wage as number) || 0,
  };
}

function workerToDB(w: Worker): Record<string, unknown> {
  return {
    id:          w.id,
    name:        w.name,
    position:    w.position,
    department:  w.department || '',
    phone:       w.phone || '',
    start_date:  w.startDate,
    photo:       w.photo || '',
    archived_at: w.archivedAt || null,
  };
}

export async function updateWorkerWage(workerId: string, dailyWage: number): Promise<string | null> {
  const { error } = await supabase
    .from('workers')
    .update({ daily_wage: dailyWage })
    .eq('id', workerId);
  return error ? error.message : null;
}

function dbToRecord(row: Record<string, unknown>): AttendanceRecord {
  return {
    id:        row.id as string,
    workerId:  row.worker_id as string,
    date:      row.date as string,
    status:    row.status as AttendanceRecord['status'],
    checkIn:   (row.check_in as string) || '',
    checkOut:  (row.check_out as string) || '',
    note:      (row.note as string) || '',
  };
}

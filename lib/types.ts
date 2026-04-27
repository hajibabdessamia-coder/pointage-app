export interface Worker {
  id: string;
  name: string;
  position: string;
  department: string;
  phone: string;
  startDate: string;
  photo?: string;
  archivedAt?: string;
  dailyWage?: number;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave' | 'annual_leave';

export interface AttendanceRecord {
  id: string;
  workerId: string;
  date: string;
  status: AttendanceStatus;
  checkIn: string;
  checkOut: string;
  note: string;
}

export interface AppSettings {
  weeklyOffDays: number[]; // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
}

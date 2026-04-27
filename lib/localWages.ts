const KEY = 'pointage_wages';

export function getLocalWages(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
}

export function setLocalWage(workerId: string, wage: number): void {
  const wages = getLocalWages();
  wages[workerId] = wage;
  localStorage.setItem(KEY, JSON.stringify(wages));
}

'use client';

const PASSWORD_KEY = 'pointage_password';
const SESSION_KEY = 'pointage_session';
const DEFAULT_PASSWORD = 'admin';

export function getStoredPassword(): string {
  if (typeof window === 'undefined') return DEFAULT_PASSWORD;
  return localStorage.getItem(PASSWORD_KEY) || DEFAULT_PASSWORD;
}

export function setStoredPassword(newPassword: string): void {
  localStorage.setItem(PASSWORD_KEY, newPassword);
}

export function login(password: string): boolean {
  if (password === getStoredPassword()) {
    sessionStorage.setItem(SESSION_KEY, 'true');
    return true;
  }
  return false;
}

export function logout(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(SESSION_KEY) === 'true';
}

'use client';

import { supabase } from './supabase';

export async function login(email: string, password: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  return { error: null };
}

export async function register(email: string, password: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };
  return { error: null };
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

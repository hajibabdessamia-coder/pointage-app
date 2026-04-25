import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eqittmiffxzjtawurbje.supabase.co';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxaXR0bWlmZnh6anRhd3VyYmplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MzI5OTAsImV4cCI6MjA5MjUwODk5MH0.fnwURmE7fafGthKB6nQakmZgSGVu0iwIx9Ik8EbyjlM';

export const supabase = createClient(url, key);

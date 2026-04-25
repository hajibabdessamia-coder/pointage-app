import { createClient } from '@supabase/supabase-js';

const url = 'https://eqittmiffxzjtawurbje.supabase.co';
const key = 'sb_publishable_hV8A-XKE3MJ7R8A7uFEksg_iEszdcrA';

export const supabase = createClient(url, key);

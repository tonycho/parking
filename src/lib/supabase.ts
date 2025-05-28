import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
});

// Initialize shared session
supabase.auth.signInWithPassword({
  email: import.meta.env.VITE_ADMIN_EMAIL,
  password: 'parking123'
}).then(() => {
  console.log('Supabase session initialized');
}).catch(error => {
  console.error('Error initializing Supabase session:', error);
});
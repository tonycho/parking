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
    detectSessionInUrl: false,
    flowType: 'pkce'
  }
});

// Helper function to register a user
export async function registerUser(email: string, password: string) {
  const { data, error } = await supabase.rpc('register_user', {
    p_email: email,
    p_password: password
  });
  
  if (error) throw error;
  return data;
}

// Helper function to authenticate a user
export async function authenticateUser(email: string, password: string) {
  const { data, error } = await supabase.rpc('authenticate_user', {
    p_email: email,
    p_password: password
  });
  
  if (error) throw error;
  return data;
}
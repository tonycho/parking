import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to authenticate a user
export async function authenticateUser(email: string, password: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error) throw error;
  if (!data) throw new Error('User not found');

  const { data: authData, error: authError } = await supabase.rpc('authenticate_user', {
    p_email: email,
    p_password: password
  });

  if (authError) throw authError;
  if (!authData) throw new Error('Invalid login credentials');

  // Store the user data in localStorage
  localStorage.setItem('parkingUser', JSON.stringify(authData));
  
  return { user: authData, session: true };
}
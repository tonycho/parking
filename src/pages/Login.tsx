import React, { useState } from 'react';
import { Lock, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Check if user exists by email
      const { data: users, error: userCheckError } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', email)
        .limit(1);

      if (userCheckError) throw userCheckError;

      if (users && users.length > 0) {
        // User exists, ensure ID matches
        if (users[0].id !== authData.user!.id) {
          // Update user ID to match auth ID
          const { error: updateError } = await supabase
            .from('users')
            .update({ id: authData.user!.id })
            .eq('email', email);
          
          if (updateError) throw updateError;
        }
      } else {
        // User doesn't exist, create new user
        const { error: createError } = await supabase
          .from('users')
          .insert({
            id: authData.user!.id,
            email: authData.user!.email
          });

        if (createError) throw createError;
      }

      // Force a page reload to ensure all states are updated
      window.location.href = '/';
    } catch (error: any) {
      setError(error.message || 'Invalid login credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen h-full bg-secondary flex flex-col items-center justify-center px-4 py-8">
      <div className="c3-card w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="c3-logo mb-3" aria-hidden />
          <Lock className="h-10 w-10 text-accent" aria-hidden />
        </div>
        <h2 className="text-center text-xl font-semibold text-primary mb-6">ParkSmart Login</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-1">
              <span className="flex items-center">
                <User className="w-4 h-4 mr-2 text-secondary" />
                Email
              </span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-weak rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-1">
              <span className="flex items-center">
                <Lock className="w-4 h-4 mr-2 text-secondary" />
                Password
              </span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-weak rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter password"
              required
            />
          </div>

          {error ? <div className="text-danger text-sm text-center">{error}</div> : null}

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-sm py-2.5 px-4 text-sm font-medium text-inverse bg-accent hover:bg-accent-hover transition-colors ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-secondary">Don&apos;t have an account? Contact your administrator.</p>
      </div>
    </div>
  );
};

export default Login;
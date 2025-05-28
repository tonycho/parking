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

      // Explicitly navigate to dashboard after successful login
      navigate('/', { replace: true });
    } catch (error: any) {
      setError(error.message || 'Invalid login credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-xs">
        <div className="flex items-center justify-center mb-4">
          <Lock className="h-12 w-12 text-blue-500" />
        </div>
        <h2 className="text-center text-xl font-bold text-gray-900 mb-4">ParkSmart Login</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center">
                <User className="w-4 h-4 mr-2" />
                Email
              </div>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter email"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center">
                <Lock className="w-4 h-4 mr-2" />
                Password
              </div>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter password"
              required
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-500">
          Don't have an account? Contact your administrator.
        </div>
      </div>
    </div>
  );
};

export default Login;
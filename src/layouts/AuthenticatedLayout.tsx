import React, { useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { AppContentTopNav } from '../components/AppContentTopNav';
import { AppSideNav } from '../components/AppSideNav';
import { supabase } from '../lib/supabase';

export function AuthenticatedLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const onLogout = useCallback(async () => {
    await supabase.auth.signOut();
    navigate('/login');
  }, [navigate]);

  return (
    <div className="flex h-screen max-w-full overflow-hidden bg-secondary">
      <AppSideNav onLogout={onLogout} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AppContentTopNav title="ParkSmart" />
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-secondary">
          <div
            key={pathname}
            className="flex min-h-0 flex-1 flex-col animate-fade-in-page"
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

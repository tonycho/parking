import React, { useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { AppContentTopNav } from '../components/AppContentTopNav';
import { AppSideNav } from '../components/AppSideNav';
import { useParking } from '../hooks/useParking';

export function AuthenticatedLayout() {
  const { pathname } = useLocation();
  const { handleLogout } = useParking();

  const onLogout = useCallback(async () => {
    await handleLogout();
  }, [handleLogout]);

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

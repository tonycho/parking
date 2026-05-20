import React, { useState } from 'react';
import { LogOut, Moon, Sun } from 'lucide-react';
import { NavLink } from 'react-router-dom';

import { navigationConfig } from '../config/navigation';
import { useTheme } from '../hooks/useTheme';

export type AppSideNavProps = {
  onLogout: () => void | Promise<void>;
};

export function AppSideNav({ onLogout }: AppSideNavProps) {
  const { currentTheme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  const navItemClasses = (active: boolean) =>
    active ? 'bg-secondary text-primary' : 'text-secondary hover:text-primary';

  return (
    <>
      <nav
        className="hidden sm:flex w-16 shrink-0 flex-col items-center border-r border-weak bg-primary z-20"
        aria-label="Primary"
      >
        <div className="mt-3 mb-2 flex w-full justify-center px-1">
          <div className="c3-logo" aria-hidden />
        </div>
        <ul className="flex w-full flex-1 flex-col gap-1">
          {navigationConfig.map((item) => {
            const Icon = item.iconActive ?? item.icon;
            return (
              <li key={item.id} className="relative flex w-full justify-center">
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  title={item.tooltip}
                  className={({ isActive }) =>
                    `flex w-full flex-col items-center justify-center gap-0.5 px-1 py-2 text-center transition-colors ${navItemClasses(isActive)}`
                  }
                >
                  <span className="flex h-6 w-6 items-center justify-center">
                    <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                  </span>
                  <span className="max-w-full truncate px-0.5 text-[10px] leading-tight">{item.label}</span>
                  {item.badge != null ? (
                    <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] text-white">
                      {item.badge}
                    </span>
                  ) : null}
                </NavLink>
              </li>
            );
          })}
        </ul>
        <div className="mb-3 mt-auto flex w-full flex-col items-center gap-2 px-1">
          <button
            type="button"
            className="flex w-full flex-col items-center py-1 text-secondary hover:text-primary"
            onClick={toggleTheme}
            aria-label="Toggle theme mode"
          >
            <span className="flex h-8 w-8 items-center justify-center">
              {currentTheme === 'dark' ? (
                <Sun className="h-5 w-5" strokeWidth={2} aria-hidden />
              ) : (
                <Moon className="h-5 w-5" strokeWidth={2} aria-hidden />
              )}
            </span>
            <span className="text-[10px] leading-tight">{currentTheme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
          <button
            type="button"
            className="flex w-full flex-col items-center py-1 text-secondary hover:text-primary"
            onClick={() => void onLogout()}
            aria-label="Log out"
          >
            <span className="flex h-8 w-8 items-center justify-center">
              <LogOut className="h-5 w-5" strokeWidth={2} aria-hidden />
            </span>
            <span className="text-[10px] leading-tight">Logout</span>
          </button>
        </div>
      </nav>

      <button
        type="button"
        onClick={() => setIsMenuOpen(true)}
        className="fixed left-0 top-1 z-50 px-1 text-secondary transition-colors hover:text-primary sm:hidden"
        aria-label="Open navigation menu"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {isMenuOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/50 sm:hidden"
          onClick={closeMenu}
          onKeyDown={(e) => {
            if (e.key === 'Escape') closeMenu();
          }}
          role="button"
          tabIndex={0}
          aria-label="Close navigation menu"
        />
      ) : null}

      {isMenuOpen ? (
        <nav
          className="fixed left-0 top-0 z-50 h-full w-80 overflow-y-auto border-r border-weak bg-primary sm:hidden"
          aria-label="Primary mobile"
        >
          <div className="p-4">
            <div className="mb-6 flex items-center justify-between">
              <div className="c3-logo" aria-hidden />
              <button
                type="button"
                onClick={closeMenu}
                className="p-2 text-secondary transition-colors hover:text-primary"
                aria-label="Close navigation menu"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <ul className="space-y-2">
              {navigationConfig.map((item) => {
                const Icon = item.iconActive ?? item.icon;
                return (
                  <li key={item.id}>
                    <NavLink
                      to={item.path}
                      end={item.path === '/'}
                      onClick={closeMenu}
                      className={({ isActive: navActive }) =>
                        `flex items-center gap-3 rounded-md px-4 py-3 text-base transition-colors ${
                          navActive
                            ? 'bg-secondary text-primary'
                            : 'text-secondary hover:bg-accent-weak hover:text-primary'
                        }`
                      }
                    >
                      <Icon className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>

            <div className="mt-8 border-t border-weak pt-4">
              <button
                type="button"
                className="flex w-full items-center gap-3 px-4 py-3 text-base text-secondary transition-colors hover:text-primary"
                onClick={toggleTheme}
                aria-label="Toggle theme mode"
              >
                {currentTheme === 'dark' ? (
                  <Sun className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
                ) : (
                  <Moon className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
                )}
                <span>{currentTheme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
              </button>
              <button
                type="button"
                className="mt-1 flex w-full items-center gap-3 px-4 py-3 text-base text-secondary transition-colors hover:text-primary"
                onClick={() => {
                  closeMenu();
                  void onLogout();
                }}
                aria-label="Log out"
              >
                <LogOut className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </nav>
      ) : null}
    </>
  );
}

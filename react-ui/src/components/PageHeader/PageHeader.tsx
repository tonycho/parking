import type { LucideIcon } from 'lucide-react';
import React from 'react';

export type PageHeaderProps = {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  /** Lucide color class for the icon (default matches c3genesis PageHeader). */
  iconColor?: string;
  iconSize?: number;
  rightContent?: React.ReactNode;
  className?: string;
  /**
   * Match horizontal padding to the scrollable page body (see c3genesis PageHeader
   * `contentWrapperClassName`).
   */
  contentWrapperClassName?: string;
};

/**
 * Page title row — API and layout aligned with c3genesis
 * `repo/genesis/ui/react/src/components/PageHeader/PageHeader.tsx` (this app stays on Tailwind v3).
 */
export function PageHeader({
  title,
  subtitle,
  icon,
  iconColor = 'text-secondary',
  iconSize = 24,
  rightContent,
  className = '',
  contentWrapperClassName = 'w-full min-w-0 px-4 md:px-8',
}: PageHeaderProps) {
  return (
    <div className={`bg-secondary py-6 min-w-0 shrink-0 ${className}`}>
      <div className={contentWrapperClassName}>
        <div className="flex min-w-0 flex-col items-center gap-4 text-center md:flex-row md:items-start md:justify-between md:text-left">
          <h1 className="flex shrink-0 items-center justify-center gap-1 text-2xl font-medium text-primary md:justify-start">
            {React.createElement(icon, { className: iconColor, size: iconSize, 'aria-hidden': true })}
            {title}
          </h1>
          {rightContent ? (
            <div className="flex w-full min-w-0 flex-col items-center gap-3 md:w-auto md:flex-row md:flex-wrap md:items-center md:justify-end md:gap-4 lg:flex-1 lg:flex-nowrap">
              {rightContent}
            </div>
          ) : null}
        </div>
        {subtitle ? (
          <p className="mt-1 max-w-3xl text-sm text-secondary mx-auto text-center md:mx-0 md:text-left">
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default PageHeader;

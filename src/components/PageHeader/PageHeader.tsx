import React from 'react';

/** Align header title row with the standard page body (full width, horizontal padding only). */
export const pageHeaderContentWrapperClassName = 'w-full min-w-0 px-4 md:px-8';

/** Scrollable page body below PageHeader — matches horizontal padding. */
export const pageBodyClassName =
  'flex min-h-0 flex-1 flex-col w-full min-w-0 px-4 md:px-8 pb-6';

export const pageBodyScrollClassName = `${pageBodyClassName} overflow-y-auto`;

export type PageHeaderProps = {
  title: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
  className?: string;
  contentWrapperClassName?: string;
};

/**
 * Page title row — API and layout aligned with c3genesis
 * `repo/genesis/ui/react/src/components/PageHeader/PageHeader.tsx` (this app stays on Tailwind v3).
 */
export function PageHeader({
  title,
  subtitle,
  rightContent,
  className = '',
  contentWrapperClassName = pageHeaderContentWrapperClassName,
}: PageHeaderProps) {
  return (
    <div className={`bg-secondary py-6 min-w-0 shrink-0 ${className}`}>
      <div className={contentWrapperClassName}>
        <div className="flex min-w-0 flex-col items-start gap-4 text-left sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-medium text-primary">{title}</h1>
            {subtitle ? (
              <p className="mt-1 text-sm text-secondary">{subtitle}</p>
            ) : null}
          </div>
          {rightContent ? (
            <div className="flex w-full min-w-0 shrink-0 flex-col items-start gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-4 lg:flex-1 lg:flex-nowrap">
              {rightContent}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default PageHeader;
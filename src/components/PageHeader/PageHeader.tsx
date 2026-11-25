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
        <div className="flex min-w-0 flex-col items-center gap-4 text-center md:flex-row md:items-start md:justify-between md:text-left">
          <h1 className="shrink-0 text-2xl font-medium text-primary">{title}</h1>
          {rightContent ? (
            <div className="flex w-full min-w-0 flex-col items-center gap-3 md:w-auto md:flex-row md:flex-wrap md:items-center md:justify-end md:gap-4 lg:flex-1 lg:flex-nowrap">
              {rightContent}
            </div>
          ) : null}
        </div>
        {subtitle ? (
          <p className="mt-1 text-sm text-secondary mx-auto text-center md:mx-0 md:text-left">
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default PageHeader;
import React from 'react';

/** Align header title row with the standard page body (full width, horizontal padding only). */
export const pageHeaderContentWrapperClassName = 'w-full min-w-0 px-4 md:px-8';

export const pageBodyPaddingClassName = 'w-full min-w-0 px-4 md:px-8 pb-6';

/** Page body that fills remaining height (table/list areas use nested overflow-auto). */
export const pageBodyClassName = `flex min-h-0 flex-1 flex-col ${pageBodyPaddingClassName}`;

/** Scroll viewport below PageHeader — sibling of header inside `overflow-hidden` page shell. */
export const pageBodyScrollClassName =
  'min-h-0 w-full min-w-0 flex-1 overflow-x-auto overflow-y-auto';

export const pageBodyScrollInnerClassName = `flex flex-col ${pageBodyPaddingClassName}`;

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
    <div className={`bg-secondary py-4 min-w-0 shrink-0 sm:py-6 ${className}`}>
      <div className={contentWrapperClassName}>
        <div className="flex min-w-0 flex-col items-stretch gap-4 text-left md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-medium text-primary sm:text-2xl">{title}</h1>
            {subtitle ? (
              <p className="mt-1 text-sm leading-relaxed text-secondary">{subtitle}</p>
            ) : null}
          </div>
          {rightContent ? (
            <div className="flex w-full min-w-0 shrink-0 flex-col gap-3 md:w-auto md:flex-row md:flex-wrap md:items-center md:justify-end md:gap-4 lg:flex-1 lg:flex-nowrap [&_button]:min-h-11 [&_button]:w-full md:[&_button]:w-auto">
              {rightContent}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default PageHeader;
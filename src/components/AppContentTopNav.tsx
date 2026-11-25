import React from 'react';

import { pageHeaderContentWrapperClassName } from './PageHeader/PageHeader';

export type AppContentTopNavProps = {
  title: string;
};

/**
 * Sticky app title strip — matches {@link PageHeader} padding; extra left inset below `sm` for the menu button.
 */
export function AppContentTopNav({ title }: AppContentTopNavProps) {
  return (
    <div className="sticky top-0 z-30 w-full shrink-0 border-b border-weak bg-primary">
      <div
        className={`${pageHeaderContentWrapperClassName} flex min-h-[2.25rem] items-center max-sm:pl-10`}
      >
        <h2 className="text-base font-medium leading-none text-primary">{title}</h2>
      </div>
    </div>
  );
}

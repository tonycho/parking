import React from 'react';

export type AppContentTopNavProps = {
  title: string;
};

/**
 * Sticky title strip below the icon rail — matches C3 example TopNav spacing
 * (content area offset, border-weak, primary background).
 */
export function AppContentTopNav({ title }: AppContentTopNavProps) {
  return (
    <div className="sticky top-0 z-30 flex w-full shrink-0 bg-primary">
      <div className="flex min-h-[2.25rem] flex-1 items-center border-b border-weak pl-10 sm:pl-6">
        <h2 className="pr-4 text-base font-medium leading-none text-primary">{title}</h2>
      </div>
    </div>
  );
}

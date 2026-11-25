import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

export type SortDirection = 'asc' | 'desc';

export function SortableTableHeader<T extends string>({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
  align = 'left',
  compact = false,
}: {
  label: string;
  sortKey: T;
  activeKey: T;
  direction: SortDirection;
  onSort: (key: T) => void;
  align?: 'left' | 'right';
  compact?: boolean;
}) {
  const active = activeKey === sortKey;
  const padding = compact ? 'px-4 py-3' : 'px-6 py-3';
  const alignClass = align === 'right' ? 'text-right' : 'text-left';

  return (
    <th
      scope="col"
      aria-sort={active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={`bg-primary ${padding} ${alignClass}`}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider transition-colors ${
          align === 'right' ? 'ml-auto' : ''
        } ${active ? 'text-primary' : 'text-secondary hover:text-primary'}`}
      >
        {label}
        {active ? (
          direction === 'asc' ? (
            <ArrowUp className="h-3.5 w-3.5 shrink-0" aria-hidden />
          ) : (
            <ArrowDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 shrink-0 opacity-40" aria-hidden />
        )}
      </button>
    </th>
  );
}

export function compareStrings(a: string, b: string) {
  return a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true });
}

/** Shared mobile list sort row — match select and direction toggle height and type size. */
export const mobileSortSelectClassName =
  'h-9 min-w-[8.5rem] max-w-full shrink-0 rounded-xs border border-weak bg-primary pl-3 pr-8 text-sm leading-none text-primary focus:border-accent focus:outline-none';

export const mobileSortDirectionClassName =
  'inline-flex h-9 shrink-0 items-center justify-center rounded-xs border border-weak bg-primary px-3 text-sm font-normal leading-none text-primary hover:bg-hover';
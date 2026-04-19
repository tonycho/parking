import type { LucideIcon } from 'lucide-react';

export interface NavigationItem {
  id: string;
  path: string;
  icon: LucideIcon;
  iconActive?: LucideIcon;
  label: string;
  tooltip: string;
  badge?: number;
  disabled?: boolean;
}

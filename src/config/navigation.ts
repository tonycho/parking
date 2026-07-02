import { Bell, Database, Map, AlertTriangle } from 'lucide-react';

import type { NavigationItem } from '../types/navigation';

export const navigationConfig: NavigationItem[] = [
  {
    id: 'map',
    path: '/',
    icon: Map,
    iconActive: Map,
    label: 'Map',
    tooltip: 'Parking map',
  },
  {
    id: 'vehicles',
    path: '/vehicles',
    icon: Database,
    iconActive: Database,
    label: 'Vehicles',
    tooltip: 'Vehicle directory and assignments',
  },
  {
    id: 'violations',
    path: '/violations',
    icon: AlertTriangle,
    iconActive: AlertTriangle,
    label: 'Violations',
    tooltip: 'Loading zone violations',
  },
  {
    id: 'notifications',
    path: '/settings/notifications',
    icon: Bell,
    iconActive: Bell,
    label: 'Alerts',
    tooltip: 'SMS notification settings',
  },
];

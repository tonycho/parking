import React from 'react';
import type { ParkingLot } from '../types';

type ParkingLotTabsProps = {
  lots: ParkingLot[];
  value: string;
  onChange: (lotId: string) => void;
  className?: string;
};

export function ParkingLotTabs({ lots, value, onChange, className = '' }: ParkingLotTabsProps) {
  if (lots.length <= 1) {
    return null;
  }

  return (
    <div
      className={`flex flex-wrap gap-2 ${className}`}
      role="tablist"
      aria-label="Parking lot"
    >
      {lots.map((lot) => {
        const selected = lot.id === value;
        const label = lot.tabLabel?.trim() || lot.name;
        return (
          <button
            key={lot.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(lot.id)}
            className={`rounded-xs border px-3 py-1.5 text-sm font-medium transition-colors ${
              selected
                ? 'border-accent bg-accent text-inverse'
                : 'border-weak bg-primary text-primary hover:bg-hover'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
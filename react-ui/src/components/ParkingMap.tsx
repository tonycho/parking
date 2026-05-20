import React, { useCallback, useMemo } from 'react';
import {
  parkingSpotMapGreenClass,
  parkingSpotMapOrangeClass,
} from '../constants/parkingSpotPalette';
import { ParkingSpot as ParkingSpotType } from '../types';

interface ParkingMapProps {
  spots: ParkingSpotType[];
  onSpotClick: (spot: ParkingSpotType) => void;
  selectedSpotId?: string;
  getDriverName: (spotId: string) => string | undefined;
}

const ParkingMap: React.FC<ParkingMapProps> = ({ 
  spots, 
  onSpotClick, 
  selectedSpotId, 
  getDriverName 
}) => {
  const getSpotColor = useCallback((spot: ParkingSpotType) => {
    if (spot.id === selectedSpotId) return 'bg-blue-500 border-blue-600';
    if (spot.status === 'occupied') return 'bg-red-500 border-red-600';
    return spot.priority === 2
      ? parkingSpotMapGreenClass
      : parkingSpotMapOrangeClass;
  }, [selectedSpotId]);

  // Sort spots by order
  const sortedSpots = [...spots].sort((a, b) => a.order - b.order);

  const legendCounts = useMemo(() => {
    const total = spots.length;
    const secondHourTotal = spots.filter((s) => s.priority === 2).length;
    const secondHourVacant = spots.filter(
      (s) => s.priority === 2 && s.status === 'available',
    ).length;
    const firstHourTotal = spots.filter((s) => s.priority !== 2).length;
    const firstHourVacant = spots.filter(
      (s) => s.priority !== 2 && s.status === 'available',
    ).length;
    const occupied = spots.filter((s) => s.status === 'occupied').length;
    return {
      total,
      secondHourTotal,
      secondHourVacant,
      firstHourTotal,
      firstHourVacant,
      occupied,
    };
  }, [spots]);

  return (
    <div className="relative flex h-full w-full flex-col">
      <div className="relative min-h-0 flex-1 bg-primary">
        {/* Inset plot so %-positioned spots get left breathing room without changing stored coordinates */}
        <div className="absolute inset-y-0 left-3 right-0 md:left-4">
          {sortedSpots.map((spot) => {
            const driverName = getDriverName(spot.id);
            const colorClasses = getSpotColor(spot);
            const isOccupied = spot.status === 'occupied';

            return (
              <div
                key={spot.id}
                className={`absolute cursor-pointer transition-all duration-300 ease-in-out ${colorClasses} 
                       border-2 rounded-xs flex flex-col items-center justify-center font-semibold text-white
                       hover:scale-105 overflow-hidden`}
                style={{
                  left: `${spot.position.x}%`,
                  top: `${spot.position.y}%`,
                  width: `${spot.size.width}%`,
                  height: `${spot.size.height}%`,
                  transform: spot.rotation ? `rotate(${spot.rotation}deg)` : undefined,
                }}
                onClick={() => onSpotClick(spot)}
              >
                {isOccupied ? (
                  <div className="flex flex-col items-center leading-none">
                    <div className="text-[0.6rem] opacity-75">{spot.label}</div>
                    {driverName && (
                      <div
                        className="w-full hyphens-auto break-words px-0.5 text-center text-xs"
                        style={{ wordBreak: 'break-word' }}
                      >
                        {driverName}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>{spot.label}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend — counts match map spots (filtered view when search is active) */}
      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2 px-3 py-2">
        <div className="flex max-w-[min(100%,20rem)] items-center gap-1.5">
          <div
            className={`h-3.5 w-3.5 shrink-0 rounded-xs border-2 ${parkingSpotMapGreenClass}`}
          />
          <span className="text-left text-xs leading-snug tabular-nums text-secondary">
            {legendCounts.secondHourVacant}/{legendCounts.secondHourTotal} (Stay for second hour)
          </span>
        </div>
        <div className="flex max-w-[min(100%,20rem)] items-center gap-1.5">
          <div
            className={`h-3.5 w-3.5 shrink-0 rounded-xs border-2 ${parkingSpotMapOrangeClass}`}
          />
          <span className="text-left text-xs leading-snug tabular-nums text-secondary">
            {legendCounts.firstHourVacant}/{legendCounts.firstHourTotal} (First hour only)
          </span>
        </div>
        <div className="flex max-w-[min(100%,20rem)] items-center gap-1.5">
          <div className="h-3.5 w-3.5 shrink-0 rounded-xs border-2 border-red-600 bg-red-500" />
          <span className="text-left text-xs leading-snug tabular-nums text-secondary">
            {legendCounts.occupied}/{legendCounts.total} (Occupied)
          </span>
        </div>
      </div>
    </div>
  );
};

export default ParkingMap;
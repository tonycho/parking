import React, { useCallback } from 'react';
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
    // Different colors based on priority
    return spot.priority === 2 ? 'bg-green-500 border-green-600' : 'bg-orange-200 border-orange-300';
  }, [selectedSpotId]);

  return (
    <div className="relative w-full h-full bg-gray-100">
      {spots.map((spot) => {
        const driverName = getDriverName(spot.id);
        const colorClasses = getSpotColor(spot);
        
        return (
          <div
            key={spot.id}
            className={`absolute cursor-pointer transition-all duration-300 ease-in-out ${colorClasses} 
                     border-2 rounded-sm flex flex-col items-center justify-center text-white font-semibold
                     hover:scale-105 hover:shadow-lg`}
            style={{
              left: `${spot.position.x}%`,
              top: `${spot.position.y}%`,
              width: `${spot.size.width}%`,
              height: `${spot.size.height}%`,
              transform: spot.rotation ? `rotate(${spot.rotation}deg)` : undefined,
            }}
            onClick={() => onSpotClick(spot)}
          >
            <div>{spot.label}</div>
            {driverName && (
              <div className="text-xs mt-1 whitespace-nowrap overflow-hidden text-ellipsis px-1">
                {driverName}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ParkingMap;
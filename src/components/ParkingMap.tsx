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
    return spot.priority === 2 ? 'bg-green-500 border-green-600' : 'bg-orange-400 border-orange-500';
  }, [selectedSpotId]);

  // Sort spots by order
  const sortedSpots = [...spots].sort((a, b) => a.order - b.order);

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="relative flex-1 bg-gray-100">
        {sortedSpots.map((spot) => {
          const driverName = getDriverName(spot.id);
          const colorClasses = getSpotColor(spot);
          const isOccupied = spot.status === 'occupied';
          
          return (
            <div
              key={spot.id}
              className={`absolute cursor-pointer transition-all duration-300 ease-in-out ${colorClasses} 
                       border-2 rounded-sm flex flex-col items-center justify-center text-white font-semibold
                       hover:scale-105 hover:shadow-lg overflow-hidden`}
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
                    <div className="text-xs text-center break-words hyphens-auto w-full px-0.5" style={{ wordBreak: 'break-word' }}>
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
      
      {/* Legend */}
      <div className="mt-4 flex justify-center space-x-6 bg-white p-4 rounded-lg shadow">
        <div className="flex items-center">
          <div className="w-6 h-6 bg-green-500 border-2 border-green-600 rounded-sm mr-2"></div>
          <span className="text-sm text-gray-600">Stay for second hour</span>
        </div>
        <div className="flex items-center">
          <div className="w-6 h-6 bg-orange-400 border-2 border-orange-500 rounded-sm mr-2"></div>
          <span className="text-sm text-gray-600">First hour only</span>
        </div>
        <div className="flex items-center">
          <div className="w-6 h-6 bg-red-500 border-2 border-red-600 rounded-sm mr-2"></div>
          <span className="text-sm text-gray-600">Occupied</span>
        </div>
      </div>
    </div>
  );
};

export default ParkingMap;
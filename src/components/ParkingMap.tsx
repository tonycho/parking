import React, { useCallback } from 'react';
import { ParkingSpot as ParkingSpotType } from '../types';
import ParkingSpotComponent from './ParkingSpot';

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
  return (
    <div className="relative w-full h-full bg-gray-200 overflow-hidden">
      {/* Church building outline */}
      <div className="absolute top-[5%] left-[5%] w-[90%] h-[60%] bg-gray-300 flex items-center justify-center text-gray-600 font-medium">
        Church Building
      </div>
      
      {/* Parking spots */}
      {spots.map((spot) => (
        <ParkingSpotComponent
          key={spot.id}
          spot={spot}
          onClick={() => onSpotClick(spot)}
          isSelected={spot.id === selectedSpotId}
          driverName={getDriverName(spot.id)}
        />
      ))}
    </div>
  );
};

export default ParkingMap;
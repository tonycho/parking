import React from 'react';
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
    <div className="relative w-full h-full bg-gray-100 overflow-hidden">
      {/* Building outline */}
      <div className="absolute right-[10%] top-[10%] w-[80%] h-[40%] bg-gray-300 flex items-center justify-center text-gray-600 font-medium rounded-lg">
        Building
      </div>

      {/* Driveway */}
      <div className="absolute right-[20%] top-[20%] w-[30%] h-[80%] bg-gray-200" />
      
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
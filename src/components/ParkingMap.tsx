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
      {/* Church building outline */}
      <div className="absolute top-[2%] left-[2%] w-[85%] h-[65%] bg-gray-300 flex items-center justify-center text-gray-600 font-medium rounded-lg">
        Cumberland Presbyterian Church
      </div>

      {/* Driveway/entrance */}
      <div className="absolute bottom-[5%] left-[40%] w-[20%] h-[15%] bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
        Entrance
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
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
    <div className="relative w-full h-full bg-white overflow-hidden">
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
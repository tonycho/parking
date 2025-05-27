import React from 'react';
import { ParkingSpot as ParkingSpotType } from '../types';
import ParkingSpotComponent from './ParkingSpot';

interface ParkingMapProps {
  spots: ParkingSpotType[];
  onSpotClick: (spot: ParkingSpotType) => void;
  selectedSpotId?: string;
  getDriverName: (spotId: string) => string | undefined;
}

const ParkingMap: React.FC<ParkingMapProps> = ({ spots, onSpotClick, selectedSpotId, getDriverName }) => {
  return (
    <div className="relative w-full h-full bg-gray-200 rounded-lg overflow-hidden shadow-md">
      {/* Background for the parking lot */}
      <div className="absolute inset-0 bg-gray-300">
        {/* Building outline */}
        <div className="absolute top-[20%] right-[20%] w-[30%] h-[40%] bg-slate-400 rounded-sm shadow-md" />
        
        {/* Road/driveway markings */}
        <div className="absolute top-[10%] left-[10%] w-[80%] h-[2px] bg-white" />
        <div className="absolute top-[10%] left-[10%] w-[2px] h-[80%] bg-white" />
      </div>
      
      {/* Render each parking spot */}
      {spots.map(spot => (
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
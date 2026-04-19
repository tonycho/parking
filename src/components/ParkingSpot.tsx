import React from 'react';
import { parkingSpotMapGreenClass } from '../constants/parkingSpotPalette';
import { ParkingSpot } from '../types';

interface ParkingSpotProps {
  spot: ParkingSpot;
  onClick: () => void;
  isSelected: boolean;
  driverName?: string;
}

const ParkingSpotComponent: React.FC<ParkingSpotProps> = ({ spot, onClick, isSelected, driverName }) => {
  // Determine the color based on status
  const getStatusColor = () => {
    if (isSelected) return 'bg-blue-500 border-blue-600';
    if (spot.status === 'available') return parkingSpotMapGreenClass;
    return 'bg-red-500 border-red-600';
  };

  // Style based on position, size, and rotation
  const style = {
    left: `${spot.position.x}%`,
    top: `${spot.position.y}%`,
    width: `${spot.size.width}%`,
    height: `${spot.size.height}%`,
    transform: spot.rotation ? `rotate(${spot.rotation}deg)` : undefined,
  };

  return (
    <div
      className={`absolute cursor-pointer transition-all duration-300 ease-in-out ${getStatusColor()} 
                 border-2 rounded-xs flex flex-col items-center justify-center text-white font-semibold
                 hover:scale-105`}
      style={style}
      onClick={onClick}
      aria-label={`Parking spot ${spot.label}, status: ${spot.status}`}
    >
      <div>{spot.label}</div>
      {driverName && (
        <div className="text-xs mt-1 whitespace-nowrap overflow-hidden text-ellipsis px-1">
          {driverName}
        </div>
      )}
    </div>
  );
};

export default ParkingSpotComponent;
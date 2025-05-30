import React from 'react';
import { Vehicle, ParkingSpot } from '../types';
import { CarFront, User, Phone, Tag, Clock } from 'lucide-react';

interface VehicleListProps {
  vehicles: Vehicle[];
  onVehicleClick: (spotId: string) => void;
  spots: ParkingSpot[];
}

const VehicleList: React.FC<VehicleListProps> = ({ vehicles, onVehicleClick, spots }) => {
  // Format date for display
  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleString();
  };

  // Get spot by spot ID
  const getSpot = (spotId: string): ParkingSpot | undefined => {
    return spots.find(s => s.id === spotId);
  };

  // Get color hex value
  const getColorHex = (colorName: string): string => {
    const colorMap: { [key: string]: string } = {
      'Black': '#000000',
      'White': '#FFFFFF',
      'Silver': '#C0C0C0',
      'Gray': '#808080',
      'Red': '#FF0000',
      'Blue': '#0000FF',
      'Brown': '#964B00',
      'Green': '#008000',
      'Beige': '#F5F5DC',
      'Gold': '#FFD700',
      'Orange': '#FFA500',
      'Yellow': '#FFFF00',
      'Purple': '#800080'
    };
    return colorMap[colorName] || '#808080';
  };

  // Sort vehicles by their parking spot's order
  const sortedVehicles = [...vehicles].sort((a, b) => {
    const spotA = getSpot(a.parkingSpotId);
    const spotB = getSpot(b.parkingSpotId);
    
    if (!spotA && !spotB) return 0;
    if (!spotA) return 1;
    if (!spotB) return -1;
    
    return spotA.order - spotB.order;
  });

  if (vehicles.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4 text-center text-gray-500">
        No vehicles found.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow divide-y">
      {sortedVehicles.map((vehicle) => {
        const spot = getSpot(vehicle.parkingSpotId);
        const colorHex = getColorHex(vehicle.color);
        
        return (
          <div 
            key={vehicle.id} 
            className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => onVehicleClick(vehicle.parkingSpotId)}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center">
                <CarFront className="w-5 h-5 text-blue-500 mr-2" />
                <div>
                  <div className="flex items-center">
                    <p className="font-medium text-gray-900">{vehicle.make} {vehicle.model}</p>
                    <div 
                      className="ml-2 w-4 h-4 rounded-full" 
                      style={{ 
                        backgroundColor: colorHex,
                        border: vehicle.color === 'White' ? '1px solid #e5e7eb' : 'none'
                      }}
                      title={vehicle.color}
                    />
                  </div>
                  <p className="text-sm text-gray-500">{vehicle.licensePlate}</p>
                </div>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Spot {spot?.label}
              </span>
            </div>
            
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center text-gray-700">
                <User className="w-4 h-4 mr-1 text-gray-400" />
                {vehicle.contact}
              </div>
              <div className="flex items-center text-gray-700">
                <Phone className="w-4 h-4 mr-1 text-gray-400" />
                {vehicle.phoneNumber}
              </div>
              <div className="flex items-center text-gray-700 col-span-2">
                <Clock className="w-4 h-4 mr-1 text-gray-400" />
                {formatTime(vehicle.timeParked)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default VehicleList;
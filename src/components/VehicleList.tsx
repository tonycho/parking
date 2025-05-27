import React from 'react';
import { Vehicle, ParkingSpot } from '../types';
import { CarFront, User, Phone, Tag, Clock } from 'lucide-react';

interface VehicleListProps {
  vehicles: Vehicle[];
  onVehicleClick: (spotId: string) => void;
}

const VehicleList: React.FC<VehicleListProps> = ({ vehicles, onVehicleClick }) => {
  // Format date for display
  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleString();
  };

  if (vehicles.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4 text-center text-gray-500">
        No vehicles found.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow divide-y">
      {vehicles.map((vehicle) => (
        <div 
          key={vehicle.id} 
          className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
          onClick={() => onVehicleClick(vehicle.parkingSpotId)}
        >
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <CarFront className="w-5 h-5 text-blue-500 mr-2" />
              <div>
                <p className="font-medium text-gray-900">{vehicle.make} ({vehicle.color})</p>
                <p className="text-sm text-gray-500">{vehicle.licensePlate}</p>
              </div>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Spot {vehicle.parkingSpotId.split('-')[1]}
            </span>
          </div>
          
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center text-gray-700">
              <User className="w-4 h-4 mr-1 text-gray-400" />
              {vehicle.driverName}
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
      ))}
    </div>
  );
};

export default VehicleList;
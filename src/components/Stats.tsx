import React from 'react';
import { ParkingSquare as ParkingSqaure, Car } from 'lucide-react';

interface StatsProps {
  totalSpots: number;
  availableSpots: number;
  occupiedSpots: number;
}

const Stats: React.FC<StatsProps> = ({ totalSpots, availableSpots, occupiedSpots }) => {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-white rounded-lg shadow-md p-4 flex items-center">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600">
          <ParkingSqaure size={20} />
        </div>
        <div className="ml-3">
          <p className="text-lg font-bold">{totalSpots}</p>
          <p className="text-sm text-gray-500">Total Spots</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 flex items-center">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-600">
          <ParkingSqaure size={20} />
        </div>
        <div className="ml-3">
          <p className="text-lg font-bold">{availableSpots}</p>
          <p className="text-sm text-gray-500">Available</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 flex items-center">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-600">
          <Car size={20} />
        </div>
        <div className="ml-3">
          <p className="text-lg font-bold">{occupiedSpots}</p>
          <p className="text-sm text-gray-500">Occupied</p>
        </div>
      </div>
    </div>
  );
};

export default Stats;
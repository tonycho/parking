import React, { useState } from 'react';
import { useParking } from '../hooks/useParking';
import SearchBar from '../components/SearchBar';
import { Car, Phone, Tag, LogOut, Database, Map as MapIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

function Vehicles() {
  const { knownVehicles, handleLogout } = useParking();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredVehicles = knownVehicles.filter(vehicle => {
    const query = searchQuery.toLowerCase();
    return (
      vehicle.contact.toLowerCase().includes(query) ||
      vehicle.phoneNumber.toLowerCase().includes(query) ||
      vehicle.licensePlate.toLowerCase().includes(query) ||
      vehicle.make.toLowerCase().includes(query) ||
      (vehicle.model && vehicle.model.toLowerCase().includes(query)) ||
      vehicle.color.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 w-full">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Car className="h-8 w-8 text-blue-500" />
              <h1 className="ml-2 text-xl font-semibold text-gray-900">ParkSmart</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <MapIcon className="w-4 h-4 mr-2" />
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Database className="mr-2 h-6 w-6 text-blue-500" />
              Vehicles
            </h2>
          </div>

          <div className="mb-6">
            <SearchBar 
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by contact, license plate, make, model..."
            />
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      License Plate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredVehicles.map((vehicle, index) => (
                    <tr key={vehicle.licensePlate} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center">
                          <Tag className="h-4 w-4 text-gray-400 mr-2" />
                          {vehicle.licensePlate}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Car className="h-4 w-4 text-gray-400 mr-2" />
                          {vehicle.make} {vehicle.model}
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {vehicle.color}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vehicle.contact || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 text-gray-400 mr-2" />
                          {vehicle.phoneNumber || '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Vehicles;
import React, { useState } from 'react';
import { useParking } from '../hooks/useParking';
import SearchBar from '../components/SearchBar';
import { Car, Phone, Tag, LogOut, Database, Map as MapIcon, X, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

function Vehicles() {
  const { knownVehicles, handleLogout, parkingLot, updateVehicle, removeVehicle } = useParking();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<typeof knownVehicles[0] | null>(null);
  const [showParkingModal, setShowParkingModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

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

  const availableSpots = parkingLot.spots
    .filter(spot => spot.status === 'available')
    .sort((a, b) => {
      // First sort by priority (higher priority first)
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      // Then sort by label
      return a.label.localeCompare(b.label);
    });

  const handlePark = (vehicle: typeof knownVehicles[0]) => {
    setSelectedVehicle(vehicle);
    setShowParkingModal(true);
  };

  const handleSpotSelect = async (spotId: string) => {
    if (selectedVehicle) {
      await updateVehicle(selectedVehicle, spotId);
      setShowParkingModal(false);
      setSelectedVehicle(null);
    }
  };

  const handleDelete = async (licensePlate: string) => {
    try {
      // Here you would call your API to delete the vehicle
      console.log('Deleting vehicle:', licensePlate);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting vehicle:', error);
    }
  };

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
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
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
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-4">
                          <button
                            onClick={() => handlePark(vehicle)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Park
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(vehicle.licensePlate)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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

      {/* Parking Spot Selection Modal */}
      {showParkingModal && selectedVehicle && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            <div className="fixed inset-0 transition-opacity">
              <div 
                className="absolute inset-0 bg-gray-500 opacity-75"
                onClick={() => setShowParkingModal(false)}
              ></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Select Parking Spot
                      </h3>
                      <button
                        onClick={() => setShowParkingModal(false)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                    
                    <div className="mt-2">
                      <div className="text-sm text-gray-500 mb-4">
                        Vehicle: {selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.licensePlate})
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        {availableSpots.map(spot => (
                          <button
                            key={spot.id}
                            onClick={() => handleSpotSelect(spot.id)}
                            className={`p-4 text-center rounded-lg border-2 transition-colors
                              ${spot.priority === 2 
                                ? 'border-green-600 bg-green-100 hover:bg-green-200' 
                                : 'border-orange-500 bg-orange-100 hover:bg-orange-200'
                              }`}
                          >
                            {spot.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            <div className="fixed inset-0 transition-opacity">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delete Vehicle
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this vehicle? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(null)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Vehicles;
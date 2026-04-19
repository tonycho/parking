import React, { useState } from 'react';
import {
  parkingSpotPickerGreenClass,
  parkingSpotPickerOrangeClass,
} from '../constants/parkingSpotPalette';
import { useParking } from '../hooks/useParking';
import SearchBar from '../components/SearchBar';
import { Car, Phone, Tag, Database, X, Trash2, Plus, ParkingSquare, MessageSquare, Loader2 } from 'lucide-react';
import VehicleForm from '../components/VehicleForm';
import { apiFetchJson } from '../lib/apiFetch';
import { PageHeader } from '../components/PageHeader/PageHeader';

function Vehicles() {
  const { knownVehicles, parkingLot, updateVehicle, removeVehicle, deleteVehicle, vehicles } = useParking();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<typeof knownVehicles[0] | null>(null);
  const [showParkingModal, setShowParkingModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [reminderStatus, setReminderStatus] = useState<{ licensePlate: string; type: 'success' | 'error'; message: string } | null>(null);

  const getParkedSpot = (licensePlate: string) => {
    const parkedVehicle = vehicles.find(v => v.licensePlate === licensePlate);
    if (parkedVehicle) {
      const spot = parkingLot.spots.find(s => s.id === parkedVehicle.parkingSpotId);
      return {
        label: spot?.label,
        priority: spot?.priority,
        id: spot?.id
      };
    }
    return null;
  };

  const getVehicleBySpotId = (spotId: string) => {
    return vehicles.find(v => v.parkingSpotId === spotId);
  };

  const allSpots = parkingLot.spots.sort((a, b) => a.order - b.order);

  const handlePark = (vehicle: typeof knownVehicles[0]) => {
    setSelectedVehicle(vehicle);
    setShowParkingModal(true);
  };

  const handleSpotSelect = async (spotId: string) => {
    if (selectedVehicle) {
      // Get the currently parked vehicle data if it exists
      const parkedVehicle = vehicles.find(v => v.licensePlate === selectedVehicle.licensePlate);
      
      // If the vehicle is already parked, include its ID in the update
      const vehicleData = {
        ...selectedVehicle,
        ...(parkedVehicle && { id: parkedVehicle.id }),
        parkingSpotId: spotId,
        timeParked: new Date().toISOString()
      };

      await updateVehicle(vehicleData, spotId);
      setShowParkingModal(false);
      setSelectedVehicle(null);
    }
  };

  const handleDelete = async (licensePlate: string) => {
    try {
      await deleteVehicle(licensePlate);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting vehicle:', error);
    }
  };

  const handleAddVehicle = async (vehicleData: any) => {
    try {
      await updateVehicle(vehicleData, '');
      setShowAddVehicleModal(false);
    } catch (error) {
      console.error('Error adding vehicle:', error);
    }
  };

  const handleEditVehicle = async (vehicleData: any) => {
    try {
      await updateVehicle(vehicleData, '');
      setShowEditModal(false);
      setSelectedVehicle(null);
    } catch (error) {
      console.error('Error updating vehicle:', error);
    }
  };

  const handleRemoveFromSpot = async (spotId: string) => {
    try {
      await removeVehicle(spotId);
    } catch (error) {
      console.error('Error removing vehicle from spot:', error);
    }
  };

  const handleSendReminder = async (vehicle: typeof knownVehicles[0]) => {
    if (!vehicle.phoneNumber || vehicle.phoneNumber.length !== 10) {
      setReminderStatus({ 
        licensePlate: vehicle.licensePlate, 
        type: 'error', 
        message: 'Valid phone number required' 
      });
      return;
    }

    const parkedSpot = getParkedSpot(vehicle.licensePlate);
    
    setSendingReminder(vehicle.licensePlate);
    setReminderStatus(null);

    try {
      await apiFetchJson('/api/send-reminder', {
        method: 'POST',
        body: {
          phoneNumber: vehicle.phoneNumber,
          contact: vehicle.contact,
          licensePlate: vehicle.licensePlate,
          spotLabel: parkedSpot?.label,
        },
      });

      setReminderStatus({ 
        licensePlate: vehicle.licensePlate, 
        type: 'success', 
        message: 'Reminder sent!' 
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setReminderStatus(prev => 
          prev?.licensePlate === vehicle.licensePlate ? null : prev
        );
      }, 3000);
    } catch (error) {
      setReminderStatus({ 
        licensePlate: vehicle.licensePlate, 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to send' 
      });
    } finally {
      setSendingReminder(null);
    }
  };

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

  const filteredVehicles = knownVehicles
    .filter(vehicle => {
      const query = searchQuery.toLowerCase();
      return (
        vehicle.contact.toLowerCase().includes(query) ||
        vehicle.licensePlate.toLowerCase().includes(query) ||
        vehicle.make.toLowerCase().includes(query) ||
        (vehicle.model && vehicle.model.toLowerCase().includes(query)) ||
        vehicle.color.toLowerCase().includes(query) ||
        vehicle.phoneNumber.includes(query)
      );
    })
    .sort((a, b) => a.licensePlate.localeCompare(b.licensePlate));

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-secondary">
      <PageHeader
        title="Vehicles"
        subtitle="Manage the vehicle directory, parking assignments, and SMS reminders."
        icon={Database}
        rightContent={
          <button
            type="button"
            onClick={() => setShowAddVehicleModal(true)}
            className="inline-flex items-center rounded-sm border border-weak bg-accent px-4 py-2 text-sm font-medium text-inverse hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add vehicle
          </button>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col px-4 py-6 md:px-8 max-w-7xl w-full mx-auto">
        <div className="mb-6 shrink-0">
          <SearchBar 
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by contact, license plate, make, model..."
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col bg-primary border border-weak rounded-sm overflow-hidden">
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="min-w-full divide-y divide-border-weak">
              <thead className="sticky top-0 z-10 border-b border-weak bg-primary">
                <tr>
                  <th className="bg-primary px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                    License Plate
                  </th>
                  <th className="bg-primary px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="bg-primary px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="bg-primary px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="bg-primary px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                    Current Spot
                  </th>
                  <th className="bg-primary px-6 py-3 text-right text-xs font-medium text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-weak">
                {filteredVehicles.map((vehicle) => {
                  const parkedSpot = getParkedSpot(vehicle.licensePlate);
                  const colorHex = getColorHex(vehicle.color);
                  
                  return (
                    <tr key={vehicle.licensePlate} className="bg-primary hover:bg-tertiary transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center">
                          <Tag className="h-4 w-4 text-gray-400 mr-2" />
                          <button
                            onClick={() => {
                              setSelectedVehicle(vehicle);
                              setShowEditModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            {vehicle.licensePlate}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Car className="h-4 w-4 text-gray-400 mr-2" />
                          {vehicle.make} {vehicle.model}
                          <div 
                            className="ml-2 w-4 h-4 rounded-full" 
                            style={{ 
                              backgroundColor: colorHex,
                              border: vehicle.color === 'White' ? '1px solid #e5e7eb' : 'none'
                            }}
                            title={vehicle.color}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vehicle.contact || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 text-gray-400 mr-2" />
                          {vehicle.phoneNumber ? (
                            <a 
                              href={`tel:${vehicle.phoneNumber}`}
                              className="text-blue-600 hover:text-blue-800"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {vehicle.phoneNumber}
                            </a>
                          ) : (
                            '-'
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handlePark(vehicle)}
                            className={`inline-flex items-center px-3 py-1.5 rounded-sm border border-weak transition-colors ${
                              parkedSpot
                                ? parkedSpot.priority === 2
                                  ? 'text-green-700 bg-green-100 hover:bg-green-200'
                                  : 'text-orange-700 bg-orange-100 hover:bg-orange-200'
                                : 'text-blue-700 bg-blue-100 hover:bg-blue-200'
                            }`}
                          >
                            <ParkingSquare className="h-4 w-4 mr-1" />
                            {parkedSpot ? `Spot ${parkedSpot.label}` : 'Park Vehicle'}
                          </button>
                          {parkedSpot && (
                            <button
                              onClick={() => handleRemoveFromSpot(parkedSpot.id)}
                              className="inline-flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                              title="Remove from spot"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {/* Send Reminder Button */}
                          {vehicle.phoneNumber && vehicle.phoneNumber.length === 10 && (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleSendReminder(vehicle)}
                                disabled={sendingReminder === vehicle.licensePlate}
                                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-600 bg-green-100 rounded-md hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Send move reminder SMS"
                              >
                                {sendingReminder === vehicle.licensePlate ? (
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                ) : (
                                  <MessageSquare className="h-4 w-4 mr-1" />
                                )}
                                {sendingReminder === vehicle.licensePlate ? 'Sending...' : 'Remind'}
                              </button>
                              {reminderStatus?.licensePlate === vehicle.licensePlate && (
                                <span className={`text-xs ${
                                  reminderStatus.type === 'success' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {reminderStatus.message}
                                </span>
                              )}
                            </div>
                          )}
                          <button
                            onClick={() => setShowDeleteConfirm(vehicle.licensePlate)}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Vehicle Modal */}
      {showAddVehicleModal && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-2 pb-20 pt-4 text-center sm:block sm:px-4 sm:p-0">
            <div className="fixed inset-0 transition-opacity">
              <div 
                className="absolute inset-0 bg-black/40"
                onClick={() => setShowAddVehicleModal(false)}
              />
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="inline-block w-[calc(100vw-1rem)] max-w-none align-bottom overflow-hidden rounded-sm border border-weak bg-primary text-left transform transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
              <VehicleForm
                spot={{ id: '', label: '', status: 'available', position: { x: 0, y: 0 }, size: { width: 0, height: 0 }, priority: 1, order: 0 }}
                onSave={handleAddVehicle}
                onCancel={() => setShowAddVehicleModal(false)}
                knownVehicles={knownVehicles}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Vehicle Modal */}
      {showEditModal && selectedVehicle && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-2 pb-20 pt-4 text-center sm:block sm:px-4 sm:p-0">
            <div className="fixed inset-0 transition-opacity">
              <div 
                className="absolute inset-0 bg-black/40"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedVehicle(null);
                }}
              />
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="inline-block w-[calc(100vw-1rem)] max-w-none align-bottom overflow-hidden rounded-sm border border-weak bg-primary text-left transform transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
              <VehicleForm
                spot={{ id: '', label: '', status: 'available', position: { x: 0, y: 0 }, size: { width: 0, height: 0 }, priority: 1, order: 0 }}
                existingVehicle={{
                  id: '',
                  ...selectedVehicle,
                  parkingSpotId: '',
                  timeParked: new Date().toISOString()
                }}
                onSave={handleEditVehicle}
                onCancel={() => {
                  setShowEditModal(false);
                  setSelectedVehicle(null);
                }}
                knownVehicles={knownVehicles}
              />
            </div>
          </div>
        </div>
      )}

      {/* Parking Spot Selection Modal */}
      {showParkingModal && selectedVehicle && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-2 pb-20 pt-4 text-center sm:px-4">
            <div className="fixed inset-0 transition-opacity">
              <div 
                className="absolute inset-0 bg-black/40"
                onClick={() => setShowParkingModal(false)}
              />
            </div>

            <div className="inline-block w-[calc(100vw-1rem)] max-w-none align-bottom overflow-hidden rounded-sm border border-weak bg-primary text-left transform transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
              <div className="bg-primary px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg leading-6 font-medium text-primary">
                        Select parking spot
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowParkingModal(false)}
                        className="text-secondary hover:text-primary rounded-sm p-1 hover:bg-tertiary"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                    
                    <div className="mt-2">
                      <div className="text-sm text-secondary mb-4">
                        Vehicle: {selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.licensePlate})
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        {allSpots.map(spot => {
                          const occupyingVehicle = getVehicleBySpotId(spot.id);
                          const isOccupied = spot.status === 'occupied';
                          const isCurrentVehicleSpot = occupyingVehicle?.licensePlate === selectedVehicle.licensePlate;
                          
                          return (
                            <button
                              type="button"
                              key={spot.id}
                              onClick={() => !isOccupied && handleSpotSelect(spot.id)}
                              disabled={isOccupied && !isCurrentVehicleSpot}
                              className={`p-4 text-center rounded-sm border-2 transition-colors relative ${
                                isOccupied
                                  ? isCurrentVehicleSpot
                                    ? 'border-blue-600 bg-blue-100'
                                    : 'border-red-600 bg-red-100 cursor-not-allowed'
                                  : spot.priority === 2
                                    ? parkingSpotPickerGreenClass
                                    : parkingSpotPickerOrangeClass
                              }`}
                            >
                              <div>{spot.label}</div>
                              {isOccupied && !isCurrentVehicleSpot && (
                                <div className="text-xs mt-1 text-red-600 font-medium">
                                  {occupyingVehicle?.contact || 'Occupied'}
                                </div>
                              )}
                            </button>
                          );
                        })}
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
          <div className="flex min-h-screen items-center justify-center px-2 pb-20 pt-4 text-center sm:px-4">
            <div className="fixed inset-0 transition-opacity">
              <div className="absolute inset-0 bg-black/40" />
            </div>

            <div className="inline-block w-[calc(100vw-1rem)] max-w-none align-bottom overflow-hidden rounded-sm border border-weak bg-primary text-left transform transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
              <div className="bg-primary px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-danger-weak sm:mx-0 sm:h-10 sm:w-10">
                    <Trash2 className="h-6 w-6 text-danger" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-primary">
                      Delete vehicle
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-secondary">
                        Are you sure you want to delete this vehicle? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-tertiary px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-weak">
                <button
                  type="button"
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="w-full inline-flex justify-center rounded-sm border border-transparent px-4 py-2 bg-danger text-base font-medium text-inverse hover:bg-danger-hover focus:outline-none focus:ring-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(null)}
                  className="mt-3 w-full inline-flex justify-center rounded-sm border border-weak px-4 py-2 bg-primary text-base font-medium text-primary hover:bg-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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

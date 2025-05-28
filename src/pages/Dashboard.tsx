import React, { useState, useEffect } from 'react';
import { Car, Map as MapIcon, Menu, X, RotateCcw, LogOut, Database, Image } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useParking } from '../hooks/useParking';
import ParkingMap from '../components/ParkingMap';
import VehicleForm from '../components/VehicleForm';
import Stats from '../components/Stats';
import SearchBar from '../components/SearchBar';
import VehicleList from '../components/VehicleList';

function Dashboard() {
  const {
    parkingLot,
    selectedSpot,
    setSelectedSpot,
    updateVehicle,
    removeVehicle,
    getVehicleBySpotId,
    searchQuery,
    setSearchQuery,
    filteredResults,
    availableSpots,
    occupiedSpots,
    resetParking,
    knownVehicles,
    handleLogout,
  } = useParking();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showMapImage, setShowMapImage] = useState(false);

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (selectedSpot) {
          setSelectedSpot(null);
        } else if (showResetConfirm) {
          setShowResetConfirm(false);
        } else if (showMapImage) {
          setShowMapImage(false);
        }
      }
    };

    window.addEventListener('keydown', handleEscapeKey);

    return () => {
      window.removeEventListener('keydown', handleEscapeKey);
    };
  }, [selectedSpot, showResetConfirm, showMapImage]);

  const { spots, filteredVehicles } = filteredResults();

  const handleSpotClick = (spot: typeof spots[0]) => {
    setSelectedSpot(spot);
  };

  const handleVehicleUpdate = (
    vehicleData: any,
    spotId: string
  ) => {
    updateVehicle(vehicleData, spotId);
    setSelectedSpot(null);
  };

  const handleVehicleRemove = (spotId: string) => {
    removeVehicle(spotId);
    setSelectedSpot(null);
  };

  const handleCancel = () => {
    setSelectedSpot(null);
  };

  const handleReset = () => {
    resetParking();
    setShowResetConfirm(false);
  };

  const getDriverName = (spotId: string) => {
    const vehicle = getVehicleBySpotId(spotId);
    return vehicle?.contact;
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
                to="/vehicles"
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Database className="w-4 h-4 mr-2" />
                Vehicles
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
              
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                {sidebarOpen ? (
                  <X className="block h-6 w-6\" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6\" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar for mobile */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="absolute inset-0 bg-gray-600 opacity-75" onClick={() => setSidebarOpen(false)}></div>
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white h-full">
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="px-2">
              <div className="flex items-center">
                <Car className="h-8 w-8 text-blue-500" />
                <h1 className="ml-2 text-xl font-semibold text-gray-900">ParkSmart</h1>
              </div>
            </div>
            <div className="mt-5 px-2 space-y-4">
              <SearchBar 
                value={searchQuery} 
                onChange={setSearchQuery}
              />
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Vehicles</h2>
                <div className="space-y-2">
                  <VehicleList 
                    vehicles={filteredVehicles}
                    spots={parkingLot.spots}
                    onVehicleClick={(spotId) => {
                      const spot = parkingLot.spots.find(s => s.id === spotId);
                      if (spot) {
                        setSelectedSpot(spot);
                        setSidebarOpen(false);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left column (map) */}
        <div className="flex-1 p-4 flex flex-col max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <MapIcon className="mr-2 h-6 w-6 text-blue-500" />
                Parking Map
              </h2>
              <button 
                onClick={() => setShowMapImage(true)}
                className="ml-2 text-blue-500 hover:text-blue-600 transition-colors"
              >
                <Image className="h-6 w-6" />
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Click on a spot to manage vehicle information
              </div>
              <button
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset All
              </button>
            </div>
          </div>
          
          <div className="mb-6">
            <Stats 
              totalSpots={parkingLot.spots.length} 
              availableSpots={availableSpots} 
              occupiedSpots={occupiedSpots}
            />
          </div>
          
          <div className="flex-1 relative h-0">
            <div className="absolute inset-0">
              <ParkingMap 
                spots={spots} 
                onSpotClick={handleSpotClick} 
                selectedSpotId={selectedSpot?.id}
                getDriverName={getDriverName}
              />
            </div>
          </div>
        </div>
        
        {/* Right column (sidebar) - Hidden on mobile */}
        <div className="hidden md:block md:w-96 bg-gray-50 p-4 overflow-y-auto border-l border-gray-200">
          <SearchBar 
            value={searchQuery} 
            onChange={setSearchQuery}
          />
          
          <div className="mt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Vehicles</h2>
            <VehicleList 
              vehicles={filteredVehicles}
              spots={parkingLot.spots}
              onVehicleClick={(spotId) => {
                const spot = parkingLot.spots.find(s => s.id === spotId);
                if (spot) {
                  setSelectedSpot(spot);
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Map Image Modal */}
      {showMapImage && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div 
                className="absolute inset-0 bg-gray-500 opacity-75"
                onClick={() => setShowMapImage(false)}
              ></div>
            </div>

            <div className="relative inline-block bg-white rounded-lg overflow-hidden shadow-xl transform transition-all max-w-4xl w-full">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                  onClick={() => setShowMapImage(false)}
                >
                  <span className="sr-only">Close</span>
                  <X className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              <img 
                src="/image.png" 
                alt="Parking Map" 
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal for vehicle form */}
      {selectedSpot && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={handleCancel}></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <VehicleForm
                spot={selectedSpot}
                existingVehicle={getVehicleBySpotId(selectedSpot.id)}
                onSave={handleVehicleUpdate}
                onCancel={handleCancel}
                onRemove={handleVehicleRemove}
                knownVehicles={knownVehicles}
              />
            </div>
          </div>
        </div>
      )}

      {/* Reset confirmation modal */}
      {showResetConfirm && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <RotateCcw className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Reset Parking Lot</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to reset all parking spots? This will remove all current vehicles but keep the vehicle history for autocomplete.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
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

export default Dashboard;
import React, { useState, useEffect } from 'react';
import { Map as MapIcon, Menu, X, RotateCcw, Image } from 'lucide-react';
import { useParking } from '../hooks/useParking';
import ParkingMap from '../components/ParkingMap';
import VehicleForm from '../components/VehicleForm';
import SearchBar from '../components/SearchBar';
import VehicleList from '../components/VehicleList';
import { PageHeader } from '../components/PageHeader/PageHeader';

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
    resetParking,
    knownVehicles,
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
        } else if (sidebarOpen) {
          setSidebarOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleEscapeKey);

    return () => {
      window.removeEventListener('keydown', handleEscapeKey);
    };
  }, [selectedSpot, showResetConfirm, showMapImage, sidebarOpen]);

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
    <div className="flex h-full min-h-0 flex-1 flex-col bg-secondary">
      {/* Sidebar for mobile — slides in from the right */}
      <div
        className={`fixed inset-0 z-40 lg:hidden ${
          sidebarOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ease-out ${
            sidebarOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden={!sidebarOpen}
        />
        <div
          className={`absolute right-0 top-0 flex h-full w-full max-w-xs flex-col border-l border-weak bg-primary transition-transform duration-300 ease-out ${
            sidebarOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="px-2">
              <p className="text-sm font-semibold text-primary px-2">Vehicles</p>
            </div>
            <div className="mt-5 px-2 space-y-4">
              <SearchBar 
                value={searchQuery} 
                onChange={setSearchQuery}
              />
              <div>
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

      {/* Below nav: sidebar is full height; PageHeader lives only in the left column */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden items-stretch">
        {/* Left column — title + map stack (does not span the sidebar) */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 lg:overflow-hidden">
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto px-4 md:px-8 pb-6 max-w-7xl mx-auto w-full">
          <div className="w-full">
            <PageHeader
              title="Parking map"
              subtitle="Tap a spot to assign or edit a vehicle."
              icon={MapIcon}
            />
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden inline-flex items-center rounded-sm border border-weak bg-primary p-2 text-secondary hover:text-primary hover:bg-tertiary"
                title="Vehicle list"
                aria-label="Open vehicle list"
              >
                <Menu className="h-5 w-5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setShowMapImage(true)}
                className="inline-flex items-center rounded-sm border border-weak bg-primary p-2 text-secondary hover:text-primary hover:bg-tertiary"
                title="View map image"
              >
                <Image className="h-5 w-5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="inline-flex shrink-0 items-center rounded-sm border border-danger bg-danger-weak px-2 py-2 text-xs font-medium text-danger hover:bg-danger hover:text-inverse sm:px-3 sm:text-sm"
            >
              <RotateCcw className="mr-1.5 h-4 w-4 shrink-0 sm:mr-2" />
              Reset all
            </button>
          </div>

          
          <div className="flex-1 min-h-[280px] relative rounded-sm border border-weak bg-primary overflow-hidden">
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
        </div>
        
        {/* Right column — full viewport band below nav (top/bottom flush with this row) */}
        <div className="hidden lg:flex lg:w-96 lg:shrink-0 lg:self-stretch lg:min-h-0 bg-primary border-l border-weak flex-col">
          <div className="px-4 pt-4 pb-4 shrink-0 border-b border-weak bg-primary">
            <SearchBar 
              value={searchQuery} 
              onChange={setSearchQuery}
            />
          </div>
          
          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
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
          <div className="flex items-center justify-center min-h-screen pt-4 px-2 pb-20 text-center sm:px-4">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div 
                className="absolute inset-0 bg-black/40"
                onClick={() => setShowMapImage(false)}
              />
            </div>

            <div className="relative inline-block w-[calc(100vw-1rem)] max-w-none overflow-hidden rounded-sm border border-weak bg-primary text-left transform transition-all sm:max-w-4xl sm:w-full">
              <div className="absolute top-0 right-0 pt-4 pr-4 z-10">
                <button
                  type="button"
                  className="bg-primary rounded-sm border border-weak p-1 text-secondary hover:text-primary focus:outline-none"
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
          <div className="flex min-h-screen items-center justify-center px-2 pb-20 pt-4 text-center sm:block sm:px-4 sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-black/40" onClick={handleCancel} />
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block w-[calc(100vw-1rem)] max-w-none align-bottom overflow-hidden rounded-sm border border-weak bg-primary text-left transform transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
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
          <div className="flex min-h-screen items-center justify-center px-2 pb-20 pt-4 text-center sm:block sm:px-4 sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-black/40" />
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block w-[calc(100vw-1rem)] max-w-none align-bottom overflow-hidden rounded-sm border border-weak bg-primary text-left transform transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
              <div className="bg-primary px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-danger-weak sm:mx-0 sm:h-10 sm:w-10">
                    <RotateCcw className="h-6 w-6 text-danger" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-primary">Reset parking lot</h3>
                    <div className="mt-2">
                      <p className="text-sm text-secondary">
                        Are you sure you want to reset all parking spots? This will remove all current vehicles but keep the vehicle history for autocomplete.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-tertiary px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-weak">
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full inline-flex justify-center rounded-sm border border-transparent px-4 py-2 bg-danger text-base font-medium text-inverse hover:bg-danger-hover focus:outline-none focus:ring-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
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

export default Dashboard;
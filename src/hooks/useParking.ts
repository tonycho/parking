import { useState, useEffect } from 'react';
import { ParkingLot, ParkingSpot, Vehicle } from '../types';

// Initial parking lot configuration based on the provided layout image
const initialParkingLot: ParkingLot = {
  id: 'main',
  name: 'Main Parking Lot',
  spots: [
    // First column (23-26 vertically)
    ...Array(4).fill(0).map((_, i) => ({
      id: `col1-${26 - i}`,
      label: `${26 - i}`,
      status: 'available',
      position: { x: 20, y: 25 + i * 15 },
      size: { width: 12, height: 8 },
      rotation: 0,
    })),

    // Second column, top row (17-19)
    ...Array(3).fill(0).map((_, i) => ({
      id: `col2-top-${19 - i}`,
      label: `${19 - i}`,
      status: 'available',
      position: { x: 35, y: 25 },
      size: { width: 8, height: 12 },
      rotation: 0,
    })),

    // Second column, bottom row (20-22)
    ...Array(3).fill(0).map((_, i) => ({
      id: `col2-bottom-${20 + i}`,
      label: `${20 + i}`,
      status: 'available',
      position: { x: 35, y: 45 },
      size: { width: 8, height: 12 },
      rotation: 0,
    })),

    // Third column, top row (1-8)
    ...Array(8).fill(0).map((_, i) => ({
      id: `col3-top-${8 - i}`,
      label: `${8 - i}`,
      status: 'available',
      position: { x: 50 + i * 10, y: 25 },
      size: { width: 8, height: 12 },
      rotation: 0,
    })),

    // Third column, bottom row (9-16)
    ...Array(8).fill(0).map((_, i) => ({
      id: `col3-bottom-${9 + i}`,
      label: `${9 + i}`,
      status: 'available',
      position: { x: 50 + i * 10, y: 45 },
      size: { width: 8, height: 12 },
      rotation: 0,
    })),
  ] as ParkingSpot[],
};

export function useParking() {
  const [parkingLot, setParkingLot] = useState<ParkingLot>(initialParkingLot);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [knownVehicles, setKnownVehicles] = useState<Omit<Vehicle, 'id' | 'timeParked' | 'parkingSpotId'>[]>([]);

  // Load data from localStorage on initial render
  useEffect(() => {
    const savedParkingLot = localStorage.getItem('parkingLot');
    const savedVehicles = localStorage.getItem('vehicles');
    const savedKnownVehicles = localStorage.getItem('knownVehicles');

    if (savedParkingLot) {
      setParkingLot(JSON.parse(savedParkingLot));
    }
    
    if (savedVehicles) {
      setVehicles(JSON.parse(savedVehicles));
    }

    if (savedKnownVehicles) {
      setKnownVehicles(JSON.parse(savedKnownVehicles));
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('parkingLot', JSON.stringify(parkingLot));
    localStorage.setItem('vehicles', JSON.stringify(vehicles));
    localStorage.setItem('knownVehicles', JSON.stringify(knownVehicles));
  }, [parkingLot, vehicles, knownVehicles]);

  // Add or update vehicle information
  const updateVehicle = (vehicleData: Omit<Vehicle, 'id' | 'timeParked'>, spotId: string) => {
    const now = new Date().toISOString();
    const spot = parkingLot.spots.find(s => s.id === spotId);
    
    if (!spot) return;

    // Update known vehicles list
    const vehicleInfo = {
      driverName: vehicleData.driverName,
      phoneNumber: vehicleData.phoneNumber,
      licensePlate: vehicleData.licensePlate,
      make: vehicleData.make,
      color: vehicleData.color,
    };

    setKnownVehicles(prev => {
      const exists = prev.some(v => v.licensePlate === vehicleInfo.licensePlate);
      if (!exists) {
        return [...prev, vehicleInfo];
      }
      return prev;
    });

    // Find if this spot already has a vehicle
    const existingVehicleIndex = vehicles.findIndex(v => v.parkingSpotId === spotId);
    
    if (existingVehicleIndex >= 0) {
      // Update existing vehicle
      const updatedVehicles = [...vehicles];
      updatedVehicles[existingVehicleIndex] = {
        ...updatedVehicles[existingVehicleIndex],
        ...vehicleData,
        timeParked: now
      };
      setVehicles(updatedVehicles);
    } else {
      // Add new vehicle
      const newVehicle: Vehicle = {
        id: `vehicle-${Date.now()}`,
        ...vehicleData,
        parkingSpotId: spotId,
        timeParked: now
      };
      setVehicles([...vehicles, newVehicle]);
    }

    // Update spot status
    updateSpotStatus(spotId, 'occupied', vehicleData.licensePlate);
  };

  // Remove vehicle and update spot status
  const removeVehicle = (spotId: string) => {
    setVehicles(vehicles.filter(v => v.parkingSpotId !== spotId));
    updateSpotStatus(spotId, 'available');
  };

  // Update a parking spot's status
  const updateSpotStatus = (spotId: string, status: 'available' | 'occupied', vehicleId?: string) => {
    setParkingLot(prevLot => ({
      ...prevLot,
      spots: prevLot.spots.map(spot => 
        spot.id === spotId 
          ? { ...spot, status, vehicleId: vehicleId || undefined } 
          : spot
      )
    }));
  };

  // Reset all parking data
  const resetParking = () => {
    setParkingLot(initialParkingLot);
    setVehicles([]);
    setSelectedSpot(null);
    setSearchQuery('');
    // Note: We don't reset knownVehicles as we want to keep the vehicle history
  };

  // Get a vehicle by parking spot ID
  const getVehicleBySpotId = (spotId: string): Vehicle | undefined => {
    return vehicles.find(v => v.parkingSpotId === spotId);
  };

  // Get known vehicle by license plate
  const getKnownVehicle = (licensePlate: string) => {
    return knownVehicles.find(v => v.licensePlate === licensePlate);
  };

  // Filter spots and vehicles based on search query
  const filteredResults = () => {
    if (!searchQuery.trim()) return { spots: parkingLot.spots, filteredVehicles: vehicles };

    const query = searchQuery.toLowerCase();
    const filteredVehicles = vehicles.filter(vehicle => 
      vehicle.driverName.toLowerCase().includes(query) ||
      vehicle.licensePlate.toLowerCase().includes(query) ||
      vehicle.make.toLowerCase().includes(query) ||
      vehicle.color.toLowerCase().includes(query) ||
      vehicle.phoneNumber.includes(query)
    );

    const spotIds = filteredVehicles.map(v => v.parkingSpotId);
    const spots = parkingLot.spots.map(spot => ({
      ...spot,
      highlighted: spotIds.includes(spot.id)
    }));

    return { spots, filteredVehicles };
  };

  return {
    parkingLot,
    vehicles,
    selectedSpot,
    setSelectedSpot,
    updateVehicle,
    removeVehicle,
    getVehicleBySpotId,
    searchQuery,
    setSearchQuery,
    filteredResults,
    availableSpots: parkingLot.spots.filter(s => s.status === 'available').length,
    occupiedSpots: parkingLot.spots.filter(s => s.status === 'occupied').length,
    resetParking,
    getKnownVehicle,
    knownVehicles,
  };
}
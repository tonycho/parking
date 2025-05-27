import { useState, useEffect } from 'react';
import { ParkingLot, ParkingSpot, Vehicle } from '../types';

const initialParkingLot: ParkingLot = {
  id: 'main',
  name: 'Main Parking Lot',
  spots: [
    // Main right area top row (1-8)
    ...Array(8).fill(0).map((_, i) => ({
      id: `spot-${i+1}`,
      label: `${i+1}`,
      status: 'available',
      position: { x: 35 + i * 8, y: 15 },
      size: { width: 12, height: 8 },
    })),

    // Main right area bottom row (9-16)
    ...Array(8).fill(0).map((_, i) => ({
      id: `spot-${i+9}`,
      label: `${i+9}`,
      status: 'available',
      position: { x: 35 + i * 8, y: 25 },
      size: { width: 12, height: 8 },
    })),

    // Left side top row (17-19)
    ...Array(3).fill(0).map((_, i) => ({
      id: `spot-${i+17}`,
      label: `${i+17}`,
      status: 'available',
      position: { x: 10 + i * 8, y: 5 },
      size: { width: 12, height: 8 },
    })),

    // Left side second row (20-22) - aligned with spots 1-8
    ...Array(3).fill(0).map((_, i) => ({
      id: `spot-${i+20}`,
      label: `${i+20}`,
      status: 'available',
      position: { x: 10 + i * 8, y: 15 },
      size: { width: 12, height: 8 },
    })),

    // Left side vertical column (23-26)
    ...Array(4).fill(0).map((_, i) => ({
      id: `spot-${i+23}`,
      label: `${i+23}`,
      status: 'available',
      position: { x: 5, y: 45 + i * 8 },
      size: { width: 12, height: 8 },
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
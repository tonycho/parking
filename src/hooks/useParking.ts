import { useState, useEffect } from 'react';
import { ParkingLot, ParkingSpot, Vehicle } from '../types';

const initialParkingLot: ParkingLot = {
  id: 'main',
  name: 'Main Parking Lot',
  spots: [
    // First column (23-26 vertically)
    {
      id: 'spot-26',
      label: '26',
      status: 'available',
      position: { x: 6, y: 15 }, // Added 1 to x
      size: { width: 12, height: 10 },
    },
    {
      id: 'spot-25',
      label: '25',
      status: 'available',
      position: { x: 6, y: 23 }, // Added 1 to x and y spacing
      size: { width: 12, height: 10 },
    },
    {
      id: 'spot-24',
      label: '24',
      status: 'available',
      position: { x: 6, y: 31 }, // Added 1 to x and y spacing
      size: { width: 12, height: 10 },
    },
    {
      id: 'spot-23',
      label: '23',
      status: 'available',
      position: { x: 6, y: 39 }, // Added 1 to x and y spacing
      size: { width: 12, height: 10 },
    },

    // Second column (17-22)
    // First row (17-19)
    {
      id: 'spot-17',
      label: '17',
      status: 'available',
      position: { x: 20, y: 5 },
      size: { width: 6, height: 12 },
    },
    {
      id: 'spot-18',
      label: '18',
      status: 'available',
      position: { x: 27, y: 5 },
      size: { width: 6, height: 12 },
    },
    {
      id: 'spot-19',
      label: '19',
      status: 'available',
      position: { x: 34, y: 5 },
      size: { width: 6, height: 12 },
    },
    // Second row (20-22)
    {
      id: 'spot-20',
      label: '20',
      status: 'available',
      position: { x: 20, y: 18 },
      size: { width: 6, height: 12 },
    },
    {
      id: 'spot-21',
      label: '21',
      status: 'available',
      position: { x: 27, y: 18 },
      size: { width: 6, height: 12 },
    },
    {
      id: 'spot-22',
      label: '22',
      status: 'available',
      position: { x: 34, y: 18 },
      size: { width: 6, height: 12 },
    },

    // Third column - top row (8-1)
    {
      id: 'spot-8',
      label: '8',
      status: 'available',
      position: { x: 43, y: 10 },
      size: { width: 6, height: 12 },
    },
    {
      id: 'spot-7',
      label: '7',
      status: 'available',
      position: { x: 50, y: 10 },
      size: { width: 6, height: 12 },
    },
    {
      id: 'spot-6',
      label: '6',
      status: 'available',
      position: { x: 57, y: 10 },
      size: { width: 6, height: 12 },
    },
    {
      id: 'spot-5',
      label: '5',
      status: 'available',
      position: { x: 64, y: 10 },
      size: { width: 6, height: 12 },
    },
    {
      id: 'spot-4',
      label: '4',
      status: 'available',
      position: { x: 71, y: 10 },
      size: { width: 6, height: 12 },
    },
    {
      id: 'spot-3',
      label: '3',
      status: 'available',
      position: { x: 78, y: 10 },
      size: { width: 6, height: 12 },
    },
    {
      id: 'spot-2',
      label: '2',
      status: 'available',
      position: { x: 85, y: 10 },
      size: { width: 6, height: 12 },
    },
    {
      id: 'spot-1',
      label: '1',
      status: 'available',
      position: { x: 92, y: 10 },
      size: { width: 6, height: 12 },
    },

    // Third column - bottom row (9-16)
    {
      id: 'spot-9',
      label: '9',
      status: 'available',
      position: { x: 43, y: 23 },
      size: { width: 6, height: 12 },
    },
    {
      id: 'spot-10',
      label: '10',
      status: 'available',
      position: { x: 50, y: 23 },
      size: { width: 6, height: 12 },
    },
    {
      id: 'spot-11',
      label: '11',
      status: 'available',
      position: { x: 57, y: 23 },
      size: { width: 6, height: 12 },
    },
    {
      id: 'spot-12',
      label: '12',
      status: 'available',
      position: { x: 64, y: 23 },
      size: { width: 6, height: 12 },
    },
    {
      id: 'spot-13',
      label: '13',
      status: 'available',
      position: { x: 71, y: 23 },
      size: { width: 6, height: 12 },
    },
    {
      id: 'spot-14',
      label: '14',
      status: 'available',
      position: { x: 78, y: 23 },
      size: { width: 6, height: 12 },
    },
    {
      id: 'spot-15',
      label: '15',
      status: 'available',
      position: { x: 85, y: 23 },
      size: { width: 6, height: 12 },
    },
    {
      id: 'spot-16',
      label: '16',
      status: 'available',
      position: { x: 92, y: 23 },
      size: { width: 6, height: 12 },
    },
  ],
};

export function useParking() {
  const [parkingLot, setParkingLot] = useState<ParkingLot>(initialParkingLot);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [knownVehicles, setKnownVehicles] = useState<Omit<Vehicle, 'id' | 'timeParked' | 'parkingSpotId'>[]>([]);

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

  useEffect(() => {
    localStorage.setItem('parkingLot', JSON.stringify(parkingLot));
    localStorage.setItem('vehicles', JSON.stringify(vehicles));
    localStorage.setItem('knownVehicles', JSON.stringify(knownVehicles));
  }, [parkingLot, vehicles, knownVehicles]);

  const updateVehicle = (vehicleData: Omit<Vehicle, 'id' | 'timeParked'>, spotId: string) => {
    const now = new Date().toISOString();
    const spot = parkingLot.spots.find(s => s.id === spotId);
    
    if (!spot) return;

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

    const existingVehicleIndex = vehicles.findIndex(v => v.parkingSpotId === spotId);
    
    if (existingVehicleIndex >= 0) {
      const updatedVehicles = [...vehicles];
      updatedVehicles[existingVehicleIndex] = {
        ...updatedVehicles[existingVehicleIndex],
        ...vehicleData,
        timeParked: now
      };
      setVehicles(updatedVehicles);
    } else {
      const newVehicle: Vehicle = {
        id: `vehicle-${Date.now()}`,
        ...vehicleData,
        parkingSpotId: spotId,
        timeParked: now
      };
      setVehicles([...vehicles, newVehicle]);
    }

    updateSpotStatus(spotId, 'occupied', vehicleData.licensePlate);
  };

  const removeVehicle = (spotId: string) => {
    setVehicles(vehicles.filter(v => v.parkingSpotId !== spotId));
    updateSpotStatus(spotId, 'available');
  };

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

  const resetParking = () => {
    setParkingLot(initialParkingLot);
    setVehicles([]);
    setSelectedSpot(null);
    setSearchQuery('');
  };

  const getVehicleBySpotId = (spotId: string): Vehicle | undefined => {
    return vehicles.find(v => v.parkingSpotId === spotId);
  };

  const getKnownVehicle = (licensePlate: string) => {
    return knownVehicles.find(v => v.licensePlate === licensePlate);
  };

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
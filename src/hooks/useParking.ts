import { useState, useEffect } from 'react';
import { ParkingLot, ParkingSpot, Vehicle } from '../types';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const initialParkingLot: ParkingLot = {
  id: 'main',
  name: 'Cumberland Parking',
  spots: [
    // First column (C1-C4)
    {
      id: 'spot-c1',
      label: 'C1',
      status: 'available',
      position: { x: 0, y: 15 },
      size: { width: 15, height: 10 },
      priority: 1
    },
    {
      id: 'spot-c2',
      label: 'C2',
      status: 'available',
      position: { x: 0, y: 26 },
      size: { width: 15, height: 10 },
      priority: 1
    },
    {
      id: 'spot-c3',
      label: 'C3',
      status: 'available',
      position: { x: 0, y: 37 },
      size: { width: 15, height: 10 },
      priority: 1
    },
    {
      id: 'spot-c4',
      label: 'C4',
      status: 'available',
      position: { x: 0, y: 48 },
      size: { width: 15, height: 10 },
      priority: 1
    },

    // Second column (B10-B12)
    {
      id: 'spot-b10',
      label: 'B10',
      status: 'available',
      position: { x: 16, y: 5 },
      size: { width: 6, height: 12 },
      priority: 1
    },
    {
      id: 'spot-b11',
      label: 'B11',
      status: 'available',
      position: { x: 23, y: 5 },
      size: { width: 6, height: 12 },
      priority: 1
    },
    {
      id: 'spot-b12',
      label: 'B12',
      status: 'available',
      position: { x: 30, y: 5 },
      size: { width: 6, height: 12 },
      priority: 1
    },

    // Third column - top row (A9-A1)
    {
      id: 'spot-a9',
      label: 'A9',
      status: 'available',
      position: { x: 37, y: 10 },
      size: { width: 6, height: 12 },
      priority: 2
    },
    {
      id: 'spot-a8',
      label: 'A8',
      status: 'available',
      position: { x: 44, y: 10 },
      size: { width: 6, height: 12 },
      priority: 2
    },
    {
      id: 'spot-a7',
      label: 'A7',
      status: 'available',
      position: { x: 51, y: 10 },
      size: { width: 6, height: 12 },
      priority: 2
    },
    {
      id: 'spot-a6',
      label: 'A6',
      status: 'available',
      position: { x: 58, y: 10 },
      size: { width: 6, height: 12 },
      priority: 2
    },
    {
      id: 'spot-a5',
      label: 'A5',
      status: 'available',
      position: { x: 65, y: 10 },
      size: { width: 6, height: 12 },
      priority: 2
    },
    {
      id: 'spot-a4',
      label: 'A4',
      status: 'available',
      position: { x: 72, y: 10 },
      size: { width: 6, height: 12 },
      priority: 2
    },
    {
      id: 'spot-a3',
      label: 'A3',
      status: 'available',
      position: { x: 79, y: 10 },
      size: { width: 6, height: 12 },
      priority: 2
    },
    {
      id: 'spot-a2',
      label: 'A2',
      status: 'available',
      position: { x: 86, y: 10 },
      size: { width: 6, height: 12 },
      priority: 2
    },
    {
      id: 'spot-a1',
      label: 'A1',
      status: 'available',
      position: { x: 93, y: 10 },
      size: { width: 6, height: 12 },
      priority: 2
    },

    // Third column - bottom row (B9-B1)
    {
      id: 'spot-b9',
      label: 'B9',
      status: 'available',
      position: { x: 37, y: 23 },
      size: { width: 6, height: 12 },
      priority: 1
    },
    {
      id: 'spot-b8',
      label: 'B8',
      status: 'available',
      position: { x: 44, y: 23 },
      size: { width: 6, height: 12 },
      priority: 1
    },
    {
      id: 'spot-b7',
      label: 'B7',
      status: 'available',
      position: { x: 51, y: 23 },
      size: { width: 6, height: 12 },
      priority: 1
    },
    {
      id: 'spot-b6',
      label: 'B6',
      status: 'available',
      position: { x: 58, y: 23 },
      size: { width: 6, height: 12 },
      priority: 1
    },
    {
      id: 'spot-b5',
      label: 'B5',
      status: 'available',
      position: { x: 65, y: 23 },
      size: { width: 6, height: 12 },
      priority: 1
    },
    {
      id: 'spot-b4',
      label: 'B4',
      status: 'available',
      position: { x: 72, y: 23 },
      size: { width: 6, height: 12 },
      priority: 1
    },
    {
      id: 'spot-b3',
      label: 'B3',
      status: 'available',
      position: { x: 79, y: 23 },
      size: { width: 6, height: 12 },
      priority: 1
    },
    {
      id: 'spot-b2',
      label: 'B2',
      status: 'available',
      position: { x: 86, y: 23 },
      size: { width: 6, height: 12 },
      priority: 1
    },
    {
      id: 'spot-b1',
      label: 'B1',
      status: 'available',
      position: { x: 93, y: 23 },
      size: { width: 6, height: 12 },
      priority: 1
    },
  ],
};

export function useParking() {
  const [parkingLot, setParkingLot] = useState<ParkingLot>(initialParkingLot);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [knownVehicles, setKnownVehicles] = useState<Omit<Vehicle, 'id' | 'timeParked' | 'parkingSpotId'>[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadParkingData();
    }
  }, [isAuthenticated]);

  const checkAuth = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) {
        setIsAuthenticated(false);
        navigate('/login');
        return;
      }

      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error checking auth:', error);
      setIsAuthenticated(false);
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const loadParkingData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsAuthenticated(false);
        navigate('/login');
        return;
      }

      const userId = session.user.id;

      // Get or create parking lot
      let { data: parkingLots, error: parkingLotError } = await supabase
        .from('parking_lots')
        .select('*')
        .eq('user_id', userId);

      if (parkingLotError) throw parkingLotError;

      let currentParkingLot;

      if (!parkingLots || parkingLots.length === 0) {
        // Create new parking lot
        const { data: newParkingLot, error: createError } = await supabase
          .from('parking_lots')
          .insert({
            name: initialParkingLot.name,
            user_id: userId
          })
          .select()
          .single();

        if (createError) throw createError;
        currentParkingLot = newParkingLot;

        // Create initial parking spots
        const spotsToCreate = initialParkingLot.spots.map(spot => ({
          label: spot.label,
          status: 'available',
          position_x: spot.position.x,
          position_y: spot.position.y,
          width: spot.size.width,
          height: spot.size.height,
          rotation: spot.rotation || 0,
          priority: spot.priority || 1,
          parking_lot_id: newParkingLot.id
        }));

        const { error: spotsError } = await supabase
          .from('parking_spots')
          .insert(spotsToCreate);

        if (spotsError) throw spotsError;

        // Fetch the newly created parking lot
        const { data: refreshedLot, error: refreshError } = await supabase
          .from('parking_lots')
          .select('*')
          .eq('id', newParkingLot.id)
          .single();

        if (refreshError) throw refreshError;
        currentParkingLot = refreshedLot;
      } else {
        currentParkingLot = parkingLots[0];
      }

      // Get parking spots
      const { data: spots, error: spotsError } = await supabase
        .from('parking_spots')
        .select('*')
        .eq('parking_lot_id', currentParkingLot.id);

      if (spotsError) throw spotsError;

      // Update state with fetched data
      setParkingLot({
        id: currentParkingLot.id,
        name: currentParkingLot.name,
        spots: spots.map((spot: any) => ({
          id: spot.id,
          label: spot.label,
          status: spot.status,
          position: { x: spot.position_x, y: spot.position_y },
          size: { width: spot.width, height: spot.height },
          rotation: spot.rotation,
          priority: spot.priority || 1,
        })),
      });

      // Get vehicles
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicle_parking_spot')
        .select('*')
        .eq('user_id', userId);

      if (vehiclesError) throw vehiclesError;

      // Get vehicle history
      const { data: vehicleHistory, error: historyError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', userId);

      if (historyError) throw historyError;

      // Map snake_case to camelCase for vehicles
      const mappedVehicles = (vehiclesData || []).map(vehicle => ({
        id: vehicle.id,
        contact: vehicle.contact,
        phoneNumber: vehicle.phone_number,
        licensePlate: vehicle.license_plate,
        make: vehicle.make,
        model: vehicle.model || '',
        color: vehicle.color,
        parkingSpotId: vehicle.parking_spot_id,
        timeParked: vehicle.time_parked
      }));

      setVehicles(mappedVehicles);

      // Set known vehicles from history
      const knownVehiclesMap = new Map();
      
      // First add current vehicles
      mappedVehicles.forEach(vehicle => {
        knownVehiclesMap.set(vehicle.licensePlate, {
          contact: vehicle.contact,
          phoneNumber: vehicle.phoneNumber,
          licensePlate: vehicle.licensePlate,
          make: vehicle.make,
          model: vehicle.model || '',
          color: vehicle.color
        });
      });

      // Then add historical vehicles
      vehicleHistory.forEach((vehicle: any) => {
        if (!knownVehiclesMap.has(vehicle.license_plate)) {
          knownVehiclesMap.set(vehicle.license_plate, {
            contact: vehicle.contact,
            phoneNumber: vehicle.phone_number,
            licensePlate: vehicle.license_plate,
            make: vehicle.make,
            model: vehicle.model || '',
            color: vehicle.color
          });
        }
      });

      setKnownVehicles(Array.from(knownVehiclesMap.values()));

    } catch (error) {
      console.error('Error loading parking data:', error);
      throw error;
    }
  };

  const updateVehicle = async (vehicleData: Omit<Vehicle, 'id' | 'timeParked'>, spotId: string) => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) {
        setIsAuthenticated(false);
        navigate('/login');
        return;
      }

      const now = new Date().toISOString();

      // Map camelCase to snake_case for database
      const dbVehicleData = {
        contact: vehicleData.contact,
        phone_number: vehicleData.phoneNumber,
        license_plate: vehicleData.licensePlate,
        make: vehicleData.make,
        model: vehicleData.model || '',
        color: vehicleData.color,
        user_id: session.user.id
      };

      // Update or insert into vehicles
      const { error: historyError } = await supabase
        .from('vehicles')
        .upsert([dbVehicleData], {
          onConflict: 'license_plate,user_id'
        });

      if (historyError) throw historyError;

      // Only update parking spot and add vehicle if a spot is provided
      if (spotId) {
        const spot = parkingLot.spots.find(s => s.id === spotId);
        if (!spot) return;

        const { error: spotError } = await supabase
          .from('parking_spots')
          .update({ status: 'occupied' })
          .eq('id', spotId);

        if (spotError) throw spotError;

        const existingVehicle = vehicles.find(v => v.parkingSpotId === spotId);
        
        if (existingVehicle) {
          const { error: vehicleError } = await supabase
            .from('vehicle_parking_spot')
            .update({
              ...dbVehicleData,
              time_parked: now,
            })
            .eq('id', existingVehicle.id);

          if (vehicleError) throw vehicleError;
        } else {
          const { error: vehicleError } = await supabase
            .from('vehicle_parking_spot')
            .insert({
              ...dbVehicleData,
              parking_spot_id: spotId,
              time_parked: now,
            });

          if (vehicleError) throw vehicleError;
        }
      }

      await loadParkingData();
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw error;
    }
  };

  const deleteVehicle = async (licensePlate: string) => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) {
        setIsAuthenticated(false);
        navigate('/login');
        return;
      }

      // Delete from vehicles
      const { error: historyError } = await supabase
        .from('vehicles')
        .delete()
        .eq('license_plate', licensePlate)
        .eq('user_id', session.user.id);

      if (historyError) throw historyError;

      await loadParkingData();
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      throw error;
    }
  };

  const removeVehicle = async (spotId: string) => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) {
        setIsAuthenticated(false);
        navigate('/login');
        return;
      }

      const { error: spotError } = await supabase
        .from('parking_spots')
        .update({ status: 'available' })
        .eq('id', spotId);

      if (spotError) throw spotError;

      const { error: vehicleError } = await supabase
        .from('vehicle_parking_spot')
        .delete()
        .eq('parking_spot_id', spotId);

      if (vehicleError) throw vehicleError;

      await loadParkingData();
    } catch (error) {
      console.error('Error removing vehicle:', error);
      throw error;
    }
  };

  const resetParking = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) {
        setIsAuthenticated(false);
        navigate('/login');
        return;
      }

      const { error: spotError } = await supabase
        .from('parking_spots')
        .update({ status: 'available' })
        .eq('parking_lot_id', parkingLot.id);

      if (spotError) throw spotError;

      const { error: vehicleError } = await supabase
        .from('vehicle_parking_spot')
        .delete()
        .eq('user_id', session.user.id);

      if (vehicleError) throw vehicleError;

      await loadParkingData();
      setSelectedSpot(null);
      setSearchQuery('');
    } catch (error) {
      console.error('Error resetting parking:', error);
      throw error;
    }
  };

  const getVehicleBySpotId = (spotId: string): Vehicle | undefined => {
    return vehicles.find(v => v.parkingSpotId === spotId);
  };

  const filteredResults = () => {
    if (!searchQuery.trim()) return { spots: parkingLot.spots, filteredVehicles: vehicles };

    const query = searchQuery.toLowerCase();
    const filteredVehicles = vehicles.filter(vehicle => 
      vehicle.contact.toLowerCase().includes(query) ||
      vehicle.licensePlate.toLowerCase().includes(query) ||
      vehicle.make.toLowerCase().includes(query) ||
      (vehicle.model && vehicle.model.toLowerCase().includes(query)) ||
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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setVehicles([]);
      setParkingLot(initialParkingLot);
      setSelectedSpot(null);
      setSearchQuery('');
      setKnownVehicles([]);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      // Even if there's an error, we'll reset the client state and redirect
      setIsAuthenticated(false);
      navigate('/login');
    }
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
    knownVehicles,
    isAuthenticated,
    isLoading,
    handleLogout,
    deleteVehicle,
  };
}
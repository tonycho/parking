import { useState, useEffect } from 'react';
import { ParkingLot, ParkingSpot, Vehicle } from '../types';
import { supabase } from '../lib/supabase';

const initialParkingLot: ParkingLot = {
  id: 'main',
  name: 'Main Parking Lot',
  spots: [
    // First column (23-26 vertically)
    {
      id: 'spot-26',
      label: '26',
      status: 'available',
      position: { x: 0, y: 15 },
      size: { width: 15, height: 10 },
    },
    {
      id: 'spot-25',
      label: '25',
      status: 'available',
      position: { x: 0, y: 26 },
      size: { width: 15, height: 10 },
    },
    {
      id: 'spot-24',
      label: '24',
      status: 'available',
      position: { x: 0, y: 37 },
      size: { width: 15, height: 10 },
    },
    {
      id: 'spot-23',
      label: '23',
      status: 'available',
      position: { x: 0, y: 48 },
      size: { width: 15, height: 10 },
    },

    // Second column (17-22)
    // First row (17-19)
    {
      id: 'spot-17',
      label: '17',
      status: 'available',
      position: { x: 16, y: 5 },
      size: { width: 6, height: 12 },
    },
    {
      id: 'spot-18',
      label: '18',
      status: 'available',
      position: { x: 23, y: 5 },
      size: { width: 6, height: 12 },
    },
    {
      id: 'spot-19',
      label: '19',
      status: 'available',
      position: { x: 30, y: 5 },
      size: { width: 6, height: 12 },
    },
    // Second row (20-22)
    {
      id: 'spot-20',
      label: '20',
      status: 'available',
      position: { x: 16, y: 18 },
      size: { width: 6, height: 12 },
    },
    {
      id: 'spot-21',
      label: '21',
      status: 'available',
      position: { x: 23, y: 18 },
      size: { width: 6, height: 12 },
    },
    {
      id: 'spot-22',
      label: '22',
      status: 'available',
      position: { x: 30, y: 18 },
      size: { width: 6, height: 12 },
    },

    // Third column - top row (8-1)
    {
      id: 'spot-8',
      label: '8',
      status: 'available',
      position: { x: 37, y: 10 },
      size: { width: 6, height: 12 },
    },
    {
      id: 'spot-7',
      label: '7',
      status: 'available',
      position: { x: 44, y: 10 },
      size: { width: 6, height: 12 },
    },
    {
      id: 'spot-6',
      label: '6',
      status: 'available',
      position: { x: 51, y: 10 },
      size: { width: 6, height: 12 },
    },
    {
      id: 'spot-5',
      label: '5',
      status: 'available',
      position: { x: 58, y: 10 },
      size: { width: 6, height: 12 },
    },
    {
      id: 'spot-4',
      label: '4',
      status: 'available',
      position: { x: 65, y: 10 },
      size: { width: 6, height: 12 },
    },
    {
      id: 'spot-3',
      label: '3',
      status: 'available',
      position: { x: 72, y: 10 },
      size: { width: 6, height: 12 },
    },
    {
      id: 'spot-2',
      label: '2',
      status: 'available',
      position: { x: 79, y: 10 },
      size: { width: 6, height: 12 },
    },
    {
      id: 'spot-1',
      label: '1',
      status: 'available',
      position: { x: 86, y: 10 },
      size: { width: 6, height: 12 },
    },

    // Third column - bottom row (9-16)
    {
      id: 'spot-9',
      label: '9',
      status: 'available',
      position: { x: 37, y: 23 },
      size: { width: 6, height: 12 },
    },
    {
      id: 'spot-10',
      label: '10',
      status: 'available',
      position: { x: 44, y: 23 },
      size: { width: 6, height: 12 },
    },
    {
      id: 'spot-11',
      label: '11',
      status: 'available',
      position: { x: 51, y: 23 },
      size: { width: 6, height: 12 },
    },
    {
      id: 'spot-12',
      label: '12',
      status: 'available',
      position: { x: 58, y: 23 },
      size: { width: 6, height: 12 },
    },
    {
      id: 'spot-13',
      label: '13',
      status: 'available',
      position: { x: 65, y: 23 },
      size: { width: 6, height: 12 },
    },
    {
      id: 'spot-14',
      label: '14',
      status: 'available',
      position: { x: 72, y: 23 },
      size: { width: 6, height: 12 },
    },
    {
      id: 'spot-15',
      label: '15',
      status: 'available',
      position: { x: 79, y: 23 },
      size: { width: 6, height: 12 },
    },
    {
      id: 'spot-16',
      label: '16',
      status: 'available',
      position: { x: 86, y: 23 },
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    } catch (error) {
      console.error('Error checking auth:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadParkingData = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) {
        setIsAuthenticated(false);
        return;
      }

      // First, ensure the user exists in the users table
      const { data: existingUser, error: userCheckError } = await supabase
        .from('users')
        .select('id')
        .eq('id', session.user.id)
        .single();

      if (userCheckError && userCheckError.code !== 'PGRST116') {
        throw userCheckError;
      }

      if (!existingUser) {
        const { error: createUserError } = await supabase
          .from('users')
          .insert({
            id: session.user.id,
            email: session.user.email
          });

        if (createUserError) throw createUserError;
      }

      const { data: parkingLots, error: parkingLotError } = await supabase
        .from('parking_lots')
        .select('*')
        .eq('user_id', session.user.id)
        .limit(1);

      if (parkingLotError) throw parkingLotError;

      if (!parkingLots || parkingLots.length === 0) {
        const { data: newParkingLot, error: createError } = await supabase
          .from('parking_lots')
          .insert({
            name: initialParkingLot.name,
            user_id: session.user.id
          })
          .select()
          .single();

        if (createError) throw createError;

        const spotsToCreate = initialParkingLot.spots.map(spot => ({
          label: spot.label,
          status: spot.status,
          position_x: spot.position.x,
          position_y: spot.position.y,
          width: spot.size.width,
          height: spot.size.height,
          rotation: spot.rotation || 0,
          parking_lot_id: newParkingLot.id
        }));

        const { error: spotsError } = await supabase
          .from('parking_spots')
          .insert(spotsToCreate);

        if (spotsError) throw spotsError;

        return loadParkingData();
      }

      const parkingLot = parkingLots[0];

      const { data: spots, error: spotsError } = await supabase
        .from('parking_spots')
        .select('*')
        .eq('parking_lot_id', parkingLot.id);

      if (spotsError) throw spotsError;

      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', session.user.id);

      if (vehiclesError) throw vehiclesError;

      setParkingLot({
        id: parkingLot.id,
        name: parkingLot.name,
        spots: spots.map((spot: any) => ({
          id: spot.id,
          label: spot.label,
          status: spot.status,
          position: { x: spot.position_x, y: spot.position_y },
          size: { width: spot.width, height: spot.height },
          rotation: spot.rotation,
        })),
      });

      setVehicles(vehiclesData || []);
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
        return;
      }

      const now = new Date().toISOString();
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
          .from('vehicles')
          .update({
            ...vehicleData,
            time_parked: now,
          })
          .eq('id', existingVehicle.id);

        if (vehicleError) throw vehicleError;
      } else {
        const { error: vehicleError } = await supabase
          .from('vehicles')
          .insert({
            ...vehicleData,
            parking_spot_id: spotId,
            time_parked: now,
            user_id: session.user.id,
          });

        if (vehicleError) throw vehicleError;
      }

      await loadParkingData();
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw error;
    }
  };

  const removeVehicle = async (spotId: string) => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) {
        setIsAuthenticated(false);
        return;
      }

      const { error: spotError } = await supabase
        .from('parking_spots')
        .update({ status: 'available' })
        .eq('id', spotId);

      if (spotError) throw spotError;

      const { error: vehicleError } = await supabase
        .from('vehicles')
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
        return;
      }

      const { error: spotError } = await supabase
        .from('parking_spots')
        .update({ status: 'available' })
        .eq('parking_lot_id', parkingLot.id);

      if (spotError) throw spotError;

      const { error: vehicleError } = await supabase
        .from('vehicles')
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
    knownVehicles,
    isAuthenticated,
    isLoading,
  };
}
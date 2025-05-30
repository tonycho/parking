import { useState, useEffect } from 'react';
import { ParkingLot, ParkingSpot, Vehicle } from '../types';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const initialParkingLot: ParkingLot = {
  id: 'main',
  name: 'Cumberland Parking',
  spots: []
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

      // Set up real-time subscription
      const channel = supabase.channel('db-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'parking_spots'
        }, (payload) => {
          console.log('Parking spot change:', payload);
          loadParkingData();
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'vehicle_parking_spot'
        }, (payload) => {
          console.log('Vehicle parking change:', payload);
          loadParkingData();
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'vehicles'
        }, (payload) => {
          console.log('Vehicle change:', payload);
          loadParkingData();
        })
        .subscribe((status, error) => {
          if (error) {
            console.error('Subscription error:', error);
            return;
          }
          console.log('Subscription status:', status);
        });

      // Cleanup subscription
      return () => {
        channel.unsubscribe();
      };
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

      // Get parking lots
      let { data: parkingLots, error: parkingLotError } = await supabase
        .from('parking_lots')
        .select('*');

      if (parkingLotError) throw parkingLotError;

      let currentParkingLot = parkingLots?.[0];

      if (!currentParkingLot) {
        // Create new parking lot
        const { data: newParkingLot, error: createError } = await supabase
          .from('parking_lots')
          .insert({
            name: initialParkingLot.name
          })
          .select()
          .single();

        if (createError) throw createError;
        currentParkingLot = newParkingLot;
      }

      // Get parking spots
      const { data: spots, error: spotsError } = await supabase
        .from('parking_spots')
        .select('*')
        .eq('parking_lot_id', currentParkingLot.id)
        .order('order');

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
          order: spot.order
        })),
      });

      // Get currently parked vehicles
      const { data: parkedVehicles, error: parkedVehiclesError } = await supabase
        .from('vehicle_parking_spot')
        .select('*');

      if (parkedVehiclesError) throw parkedVehiclesError;

      // Get all known vehicles
      const { data: knownVehiclesData, error: knownVehiclesError } = await supabase
        .from('vehicles')
        .select('*');

      if (knownVehiclesError) throw knownVehiclesError;

      // Map snake_case to camelCase for vehicles
      const mappedVehicles = (parkedVehicles || []).map(vehicle => ({
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
      knownVehiclesData.forEach((vehicle: any) => {
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
        phone_number: vehicleData.phoneNumber.replace(/\D/g, ''),
        license_plate: vehicleData.licensePlate,
        make: vehicleData.make,
        model: vehicleData.model || '',
        color: vehicleData.color
      };

      // Update or insert into vehicles (known vehicles)
      const { error: vehiclesError } = await supabase
        .from('vehicles')
        .upsert([dbVehicleData], {
          onConflict: 'license_plate'
        });

      if (vehiclesError) throw vehiclesError;

      // Only update parking spot and add vehicle if a spot is provided
      if (spotId) {
        const spot = parkingLot.spots.find(s => s.id === spotId);
        if (!spot) return;

        // First, free up any spot this vehicle might be occupying
        const currentVehicle = vehicles.find(v => v.licensePlate === vehicleData.licensePlate);
        if (currentVehicle) {
          // Update old spot to available
          const { error: oldSpotError } = await supabase
            .from('parking_spots')
            .update({ status: 'available' })
            .eq('id', currentVehicle.parkingSpotId);

          if (oldSpotError) throw oldSpotError;

          // Remove vehicle from old spot
          const { error: removeError } = await supabase
            .from('vehicle_parking_spot')
            .delete()
            .eq('parking_spot_id', currentVehicle.parkingSpotId);

          if (removeError) throw removeError;
        }

        // Update new spot status
        const { error: spotError } = await supabase
          .from('parking_spots')
          .update({ status: 'occupied' })
          .eq('id', spotId);

        if (spotError) throw spotError;

        // Add vehicle to new spot
        const { error: vehicleError } = await supabase
          .from('vehicle_parking_spot')
          .insert({
            ...dbVehicleData,
            parking_spot_id: spotId,
            time_parked: now,
          });

        if (vehicleError) throw vehicleError;
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
      const { error: deleteError } = await supabase
        .from('vehicles')
        .delete()
        .eq('license_plate', licensePlate);

      if (deleteError) throw deleteError;

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

      // Get all parking spot IDs for the current parking lot
      const { data: spots, error: spotsError } = await supabase
        .from('parking_spots')
        .select('id')
        .eq('parking_lot_id', parkingLot.id);

      if (spotsError) throw spotsError;

      const spotIds = spots.map(spot => spot.id);

      // Update all spots to available
      const { error: spotError } = await supabase
        .from('parking_spots')
        .update({ status: 'available' })
        .eq('parking_lot_id', parkingLot.id);

      if (spotError) throw spotError;

      // Delete vehicles from spots in the current parking lot
      const { error: vehicleError } = await supabase
        .from('vehicle_parking_spot')
        .delete()
        .in('parking_spot_id', spotIds);

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
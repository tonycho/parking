import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { ParkingLot, ParkingSpot, Vehicle } from '../types';
import { supabase } from '../lib/supabase';

const initialParkingLot: ParkingLot = {
  id: 'main',
  name: 'Cumberland Parking',
  spots: [],
};

function mapVpsRowToVehicle(row: Record<string, unknown>): Vehicle {
  return {
    id: row.id as string,
    contact: row.contact as string,
    phoneNumber: (row.phone_number as string) ?? '',
    licensePlate: row.license_plate as string,
    make: row.make as string,
    model: (row.model as string) || '',
    color: row.color as string,
    parkingSpotId: row.parking_spot_id as string,
    timeParked: row.time_parked as string,
  };
}

type ParkingContextValue = {
  parkingLot: ParkingLot;
  vehicles: Vehicle[];
  selectedSpot: ParkingSpot | null;
  setSelectedSpot: React.Dispatch<React.SetStateAction<ParkingSpot | null>>;
  updateVehicle: (vehicleData: Omit<Vehicle, 'id' | 'timeParked'>, spotId: string) => Promise<void>;
  removeVehicle: (spotId: string) => Promise<void>;
  getVehicleBySpotId: (spotId: string) => Vehicle | undefined;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  filteredResults: () => {
    spots: (ParkingSpot & { highlighted?: boolean })[];
    filteredVehicles: Vehicle[];
  };
  availableSpots: number;
  occupiedSpots: number;
  resetParking: () => Promise<void>;
  knownVehicles: Omit<Vehicle, 'id' | 'timeParked' | 'parkingSpotId'>[];
  isAuthenticated: boolean;
  isLoading: boolean;
  handleLogout: () => Promise<void>;
  deleteVehicle: (licensePlate: string) => Promise<void>;
};

const ParkingContext = createContext<ParkingContextValue | null>(null);

const REALTIME_RELOAD_MS = 250;

export function ParkingProvider({ children }: { children: React.ReactNode }) {
  const [parkingLot, setParkingLot] = useState<ParkingLot>(initialParkingLot);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [knownVehicles, setKnownVehicles] = useState<
    Omit<Vehicle, 'id' | 'timeParked' | 'parkingSpotId'>[]
  >([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const loadParkingDataRef = useRef<() => Promise<void>>(async () => {});
  const realtimeReloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleRealtimeReload = useCallback(() => {
    if (realtimeReloadTimerRef.current != null) {
      clearTimeout(realtimeReloadTimerRef.current);
    }
    realtimeReloadTimerRef.current = setTimeout(() => {
      realtimeReloadTimerRef.current = null;
      void loadParkingDataRef.current();
    }, REALTIME_RELOAD_MS);
  }, []);

  const loadParkingData = useCallback(async () => {
    try {
      // Get parking lots
      let { data: parkingLots, error: parkingLotError } = await supabase
        .from('parking_lots')
        .select('*');

      if (parkingLotError) throw parkingLotError;

      let currentParkingLot = parkingLots?.[0];

      if (!currentParkingLot) {
        const { data: newParkingLot, error: createError } = await supabase
          .from('parking_lots')
          .insert({
            name: initialParkingLot.name,
          })
          .select()
          .single();

        if (createError) throw createError;
        currentParkingLot = newParkingLot;
      }

      const { data: spots, error: spotsError } = await supabase
        .from('parking_spots')
        .select('*')
        .eq('parking_lot_id', currentParkingLot.id)
        .order('order');

      if (spotsError) throw spotsError;

      const spotIds = (spots || []).map((s: { id: string }) => s.id);

      const parkedQuery =
        spotIds.length === 0
          ? Promise.resolve({ data: [] as Record<string, unknown>[], error: null })
          : supabase.from('vehicle_parking_spot').select('*').in('parking_spot_id', spotIds);

      const [{ data: parkedVehicles, error: parkedVehiclesError }, { data: knownVehiclesData, error: knownVehiclesError }] =
        await Promise.all([parkedQuery, supabase.from('vehicles').select('*')]);

      if (parkedVehiclesError) throw parkedVehiclesError;
      if (knownVehiclesError) throw knownVehiclesError;

      setParkingLot({
        id: currentParkingLot.id,
        name: currentParkingLot.name,
        spots: (spots || []).map((spot: Record<string, unknown>) => ({
          id: spot.id as string,
          label: spot.label as string,
          status: spot.status as ParkingSpot['status'],
          position: { x: spot.position_x as number, y: spot.position_y as number },
          size: { width: spot.width as number, height: spot.height as number },
          rotation: spot.rotation as number,
          priority: (spot.priority as number) || 1,
          order: spot.order as number,
        })),
      });

      const mappedVehicles = (parkedVehicles || []).map(
        (vehicle: Record<string, unknown>) => ({
          id: vehicle.id as string,
          contact: vehicle.contact as string,
          phoneNumber: vehicle.phone_number as string,
          licensePlate: vehicle.license_plate as string,
          make: vehicle.make as string,
          model: (vehicle.model as string) || '',
          color: vehicle.color as string,
          parkingSpotId: vehicle.parking_spot_id as string,
          timeParked: vehicle.time_parked as string,
        })
      );

      setVehicles(mappedVehicles);

      const knownVehiclesMap = new Map<
        string,
        Omit<Vehicle, 'id' | 'timeParked' | 'parkingSpotId'>
      >();

      mappedVehicles.forEach((vehicle) => {
        knownVehiclesMap.set(vehicle.licensePlate, {
          contact: vehicle.contact,
          phoneNumber: vehicle.phoneNumber,
          licensePlate: vehicle.licensePlate,
          make: vehicle.make,
          model: vehicle.model || '',
          color: vehicle.color,
        });
      });

      (knownVehiclesData || []).forEach((vehicle: Record<string, unknown>) => {
        const plate = vehicle.license_plate as string;
        if (!knownVehiclesMap.has(plate)) {
          knownVehiclesMap.set(plate, {
            contact: vehicle.contact as string,
            phoneNumber: vehicle.phone_number as string,
            licensePlate: plate,
            make: vehicle.make as string,
            model: (vehicle.model as string) || '',
            color: vehicle.color as string,
          });
        }
      });

      setKnownVehicles(Array.from(knownVehiclesMap.values()));
    } catch (error) {
      console.error('Error loading parking data:', error);
      throw error;
    }
  }, []);

  loadParkingDataRef.current = loadParkingData;

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
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

    void checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    void loadParkingData();

    const channel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'parking_spots' },
        () => {
          scheduleRealtimeReload();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vehicle_parking_spot' },
        () => {
          scheduleRealtimeReload();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vehicles' },
        () => {
          scheduleRealtimeReload();
        }
      )
      .subscribe((status, error) => {
        if (error) {
          console.error('Subscription error:', error);
          return;
        }
        console.log('Subscription status:', status);
      });

    return () => {
      if (realtimeReloadTimerRef.current != null) {
        clearTimeout(realtimeReloadTimerRef.current);
        realtimeReloadTimerRef.current = null;
      }
      void channel.unsubscribe();
    };
  }, [isAuthenticated, loadParkingData, scheduleRealtimeReload]);

  const updateVehicle = async (
    vehicleData: Omit<Vehicle, 'id' | 'timeParked'>,
    spotId: string
  ) => {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) {
        setIsAuthenticated(false);
        navigate('/login');
        return;
      }

      const now = new Date().toISOString();

      const dbVehicleData = {
        contact: vehicleData.contact,
        phone_number: vehicleData.phoneNumber.replace(/\D/g, ''),
        license_plate: vehicleData.licensePlate,
        make: vehicleData.make,
        model: vehicleData.model || '',
        color: vehicleData.color,
      };

      const { error: vehiclesError } = await supabase.from('vehicles').upsert([dbVehicleData], {
        onConflict: 'license_plate',
      });

      if (vehiclesError) throw vehiclesError;

      if (spotId) {
        const spot = parkingLot.spots.find((s) => s.id === spotId);
        if (!spot) return;

        const currentVehicle = vehicles.find((v) => v.licensePlate === vehicleData.licensePlate);
        if (currentVehicle) {
          const { error: oldSpotError } = await supabase
            .from('parking_spots')
            .update({ status: 'available' })
            .eq('id', currentVehicle.parkingSpotId);

          if (oldSpotError) throw oldSpotError;

          const { error: removeError } = await supabase
            .from('vehicle_parking_spot')
            .delete()
            .eq('parking_spot_id', currentVehicle.parkingSpotId);

          if (removeError) throw removeError;
        }

        const insertPayload = {
          ...dbVehicleData,
          parking_spot_id: spotId,
          time_parked: now,
        };

        let insertedRow: Record<string, unknown>;

        if (currentVehicle) {
          const { error: spotError } = await supabase
            .from('parking_spots')
            .update({ status: 'occupied' })
            .eq('id', spotId);

          if (spotError) throw spotError;

          const { data: inserted, error: vehicleError } = await supabase
            .from('vehicle_parking_spot')
            .insert(insertPayload)
            .select('*')
            .single();

          if (vehicleError) throw vehicleError;
          if (!inserted) throw new Error('No row returned after parking vehicle');
          insertedRow = inserted as Record<string, unknown>;
        } else {
          const [spotRes, insertRes] = await Promise.all([
            supabase.from('parking_spots').update({ status: 'occupied' }).eq('id', spotId),
            supabase.from('vehicle_parking_spot').insert(insertPayload).select('*').single(),
          ]);

          if (spotRes.error) throw spotRes.error;
          if (insertRes.error) throw insertRes.error;
          if (!insertRes.data) throw new Error('No row returned after parking vehicle');
          insertedRow = insertRes.data as Record<string, unknown>;
        }

        const mapped = mapVpsRowToVehicle(insertedRow);

        setParkingLot((prev) => ({
          ...prev,
          spots: prev.spots.map((s) => {
            if (s.id === spotId) return { ...s, status: 'occupied' as const };
            if (currentVehicle && s.id === currentVehicle.parkingSpotId) {
              return { ...s, status: 'available' as const };
            }
            return s;
          }),
        }));

        setVehicles((prev) => {
          const without = currentVehicle
            ? prev.filter((v) => v.licensePlate !== vehicleData.licensePlate)
            : prev;
          return [...without, mapped];
        });

        setKnownVehicles((prev) => {
          const m = new Map(prev.map((v) => [v.licensePlate, v]));
          m.set(vehicleData.licensePlate, {
            contact: vehicleData.contact,
            phoneNumber: vehicleData.phoneNumber,
            licensePlate: vehicleData.licensePlate,
            make: vehicleData.make,
            model: vehicleData.model || '',
            color: vehicleData.color,
          });
          return Array.from(m.values());
        });

        void loadParkingData();
        return;
      }

      await loadParkingData();
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw error;
    }
  };

  const deleteVehicle = async (licensePlate: string) => {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) {
        setIsAuthenticated(false);
        navigate('/login');
        return;
      }

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
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
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
      console.error('Error removing vehicle from spot:', error);
      throw error;
    }
  };

  const resetParking = async () => {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) {
        setIsAuthenticated(false);
        navigate('/login');
        return;
      }

      const { data: spots, error: spotsError } = await supabase
        .from('parking_spots')
        .select('id')
        .eq('parking_lot_id', parkingLot.id);

      if (spotsError) throw spotsError;

      const spotIds = spots.map((s) => s.id);

      const { error: spotError } = await supabase
        .from('parking_spots')
        .update({ status: 'available' })
        .eq('parking_lot_id', parkingLot.id);

      if (spotError) throw spotError;

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
    return vehicles.find((v) => v.parkingSpotId === spotId);
  };

  const filteredResults = () => {
    if (!searchQuery.trim()) return { spots: parkingLot.spots, filteredVehicles: vehicles };

    const query = searchQuery.toLowerCase();
    const filteredVehicles = vehicles.filter(
      (vehicle) =>
        vehicle.contact.toLowerCase().includes(query) ||
        vehicle.licensePlate.toLowerCase().includes(query) ||
        vehicle.make.toLowerCase().includes(query) ||
        (vehicle.model && vehicle.model.toLowerCase().includes(query)) ||
        vehicle.color.toLowerCase().includes(query) ||
        vehicle.phoneNumber.includes(query)
    );

    const spotIds = filteredVehicles.map((v) => v.parkingSpotId);
    const spots = parkingLot.spots.map((spot) => ({
      ...spot,
      highlighted: spotIds.includes(spot.id),
    }));

    return { spots, filteredVehicles };
  };

  const handleLogout = useCallback(async () => {
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
      setIsAuthenticated(false);
      navigate('/login');
    }
  }, [navigate]);

  const value: ParkingContextValue = {
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
    availableSpots: parkingLot.spots.filter((s) => s.status === 'available').length,
    occupiedSpots: parkingLot.spots.filter((s) => s.status === 'occupied').length,
    resetParking,
    knownVehicles,
    isAuthenticated,
    isLoading,
    handleLogout,
    deleteVehicle,
  };

  return <ParkingContext.Provider value={value}>{children}</ParkingContext.Provider>;
}

export function useParking(): ParkingContextValue {
  const ctx = useContext(ParkingContext);
  if (!ctx) {
    throw new Error('useParking must be used within a ParkingProvider');
  }
  return ctx;
}

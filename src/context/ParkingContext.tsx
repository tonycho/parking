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
import { apiFetchJson } from '../lib/apiFetch';

type ArrivalFlags = Pick<Vehicle, 'notifyOnArrival' | 'arrivalNote'>;

const initialParkingLot: ParkingLot = {
  id: 'main',
  name: 'Cumberland Parking',
  tabLabel: 'Bank',
  mapSortOrder: 0,
  spots: [],
};

function mapSpotRow(spot: Record<string, unknown>): ParkingSpot {
  return {
    id: spot.id as string,
    label: spot.label as string,
    status: spot.status as ParkingSpot['status'],
    position: { x: spot.position_x as number, y: spot.position_y as number },
    size: { width: spot.width as number, height: spot.height as number },
    rotation: spot.rotation as number,
    priority: (spot.priority as number) || 1,
    order: spot.order as number,
  };
}

function mapLotRow(
  lot: Record<string, unknown>,
  spots: ParkingSpot[],
): ParkingLot {
  return {
    id: lot.id as string,
    name: lot.name as string,
    tabLabel: (lot.tab_label as string | null) ?? null,
    mapSortOrder: (lot.map_sort_order as number) ?? 0,
    spots,
  };
}

function sortParkingLots(lots: ParkingLot[]): ParkingLot[] {
  return [...lots].sort(
    (a, b) =>
      (a.mapSortOrder ?? 0) - (b.mapSortOrder ?? 0) ||
      a.name.localeCompare(b.name),
  );
}

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
  parkingLots: ParkingLot[];
  /** Primary lot (first by map sort) — used on Vehicles/Violations until those pages are multi-lot. */
  parkingLot: ParkingLot;
  vehicles: Vehicle[];
  selectedSpot: ParkingSpot | null;
  setSelectedSpot: React.Dispatch<React.SetStateAction<ParkingSpot | null>>;
  updateVehicle: (vehicleData: Omit<Vehicle, 'id' | 'timeParked'>, spotId: string) => Promise<void>;
  removeVehicle: (spotId: string) => Promise<void>;
  getVehicleBySpotId: (spotId: string) => Vehicle | undefined;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  filteredResultsForLot: (lotId: string) => {
    spots: (ParkingSpot & { highlighted?: boolean })[];
    filteredVehicles: Vehicle[];
  };
  availableSpotsForLot: (lotId: string) => number;
  occupiedSpotsForLot: (lotId: string) => number;
  resetParking: (lotId?: string) => Promise<void>;
  knownVehicles: Omit<Vehicle, 'id' | 'timeParked' | 'parkingSpotId'>[];
  isAuthenticated: boolean;
  isLoading: boolean;
  handleLogout: () => Promise<void>;
  deleteVehicle: (licensePlate: string) => Promise<void>;
};

const ParkingContext = createContext<ParkingContextValue | null>(null);

const REALTIME_RELOAD_MS = 250;

export function ParkingProvider({ children }: { children: React.ReactNode }) {
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([initialParkingLot]);
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
      let { data: lotRows, error: parkingLotError } = await supabase
        .from('parking_lots')
        .select('*')
        .order('map_sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (parkingLotError) throw parkingLotError;

      if (!lotRows?.length) {
        const { data: newParkingLot, error: createError } = await supabase
          .from('parking_lots')
          .insert({
            name: initialParkingLot.name,
            map_sort_order: 0,
            tab_label: initialParkingLot.tabLabel,
          })
          .select()
          .single();

        if (createError) throw createError;
        lotRows = [newParkingLot];
      }

      const lotIds = lotRows.map((l: { id: string }) => l.id);

      const { data: allSpots, error: spotsError } = await supabase
        .from('parking_spots')
        .select('*')
        .in('parking_lot_id', lotIds)
        .order('order');

      if (spotsError) throw spotsError;

      const spotsByLot = new Map<string, ParkingSpot[]>();
      for (const lotId of lotIds) {
        spotsByLot.set(lotId, []);
      }
      for (const spot of allSpots || []) {
        const lotId = spot.parking_lot_id as string;
        const list = spotsByLot.get(lotId);
        if (list) {
          list.push(mapSpotRow(spot as Record<string, unknown>));
        }
      }

      const mappedLots = sortParkingLots(
        lotRows.map((lot: Record<string, unknown>) =>
          mapLotRow(lot, spotsByLot.get(lot.id as string) ?? []),
        ),
      );

      setParkingLots(mappedLots);

      const spotIds = (allSpots || []).map((s: { id: string }) => s.id);

      const parkedQuery =
        spotIds.length === 0
          ? Promise.resolve({ data: [] as Record<string, unknown>[], error: null })
          : supabase.from('vehicle_parking_spot').select('*').in('parking_spot_id', spotIds);

      const [{ data: parkedVehicles, error: parkedVehiclesError }, { data: knownVehiclesData, error: knownVehiclesError }] =
        await Promise.all([parkedQuery, supabase.from('vehicles').select('*')]);

      if (parkedVehiclesError) throw parkedVehiclesError;
      if (knownVehiclesError) throw knownVehiclesError;

      const arrivalFlagsByPlate = new Map<string, ArrivalFlags>(
        (knownVehiclesData || []).map((vehicle: Record<string, unknown>) => [
          vehicle.license_plate as string,
          {
            notifyOnArrival: Boolean(vehicle.notify_on_arrival),
            arrivalNote: (vehicle.arrival_note as string) || '',
          },
        ])
      );

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
          ...arrivalFlagsByPlate.get(vehicle.license_plate as string),
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
          notifyOnArrival: vehicle.notifyOnArrival,
          arrivalNote: vehicle.arrivalNote,
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
            ...arrivalFlagsByPlate.get(plate),
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

      const knownFlags = knownVehicles.find((v) => v.licensePlate === vehicleData.licensePlate);
      const arrivalFlags: ArrivalFlags = {
        notifyOnArrival: vehicleData.notifyOnArrival ?? knownFlags?.notifyOnArrival ?? false,
        arrivalNote: vehicleData.arrivalNote ?? knownFlags?.arrivalNote ?? '',
      };

      // Arrival flags live only on `vehicles`; `vehicle_parking_spot` has no such columns.
      const vehiclesRow = {
        ...dbVehicleData,
        ...(vehicleData.notifyOnArrival !== undefined && {
          notify_on_arrival: vehicleData.notifyOnArrival,
          arrival_note: vehicleData.arrivalNote?.trim() || null,
        }),
      };

      const { error: vehiclesError } = await supabase.from('vehicles').upsert([vehiclesRow], {
        onConflict: 'license_plate',
      });

      if (vehiclesError) throw vehiclesError;

      if (spotId) {
        const spot = parkingLots
          .flatMap((lot) => lot.spots)
          .find((s) => s.id === spotId);
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

        const mapped = { ...mapVpsRowToVehicle(insertedRow), ...arrivalFlags };

        if (arrivalFlags.notifyOnArrival) {
          apiFetchJson('/api/arrival-alerts/notify', {
            method: 'POST',
            body: { licensePlate: vehicleData.licensePlate },
          }).catch((err) => console.error('Error sending arrival alert:', err));
        }

        setParkingLots((prev) =>
          prev.map((lot) => ({
            ...lot,
            spots: lot.spots.map((s) => {
              if (s.id === spotId) return { ...s, status: 'occupied' as const };
              if (currentVehicle && s.id === currentVehicle.parkingSpotId) {
                return { ...s, status: 'available' as const };
              }
              return s;
            }),
          })),
        );

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
            ...arrivalFlags,
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

  const resetParking = async (lotId?: string) => {
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

      const targetLotId = lotId ?? parkingLots[0]?.id;
      if (!targetLotId) return;

      const { data: spots, error: spotsError } = await supabase
        .from('parking_spots')
        .select('id')
        .eq('parking_lot_id', targetLotId);

      if (spotsError) throw spotsError;

      const spotIds = spots.map((s) => s.id);

      const { error: spotError } = await supabase
        .from('parking_spots')
        .update({ status: 'available' })
        .eq('parking_lot_id', targetLotId);

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

  const lotById = useCallback(
    (lotId: string) => parkingLots.find((lot) => lot.id === lotId),
    [parkingLots],
  );

  const vehiclesForLot = useCallback(
    (lotId: string) => {
      const lot = lotById(lotId);
      if (!lot) return [];
      const spotIds = new Set(lot.spots.map((s) => s.id));
      return vehicles.filter((v) => spotIds.has(v.parkingSpotId));
    },
    [lotById, vehicles],
  );

  const filteredResultsForLot = useCallback(
    (lotId: string) => {
      const lot = lotById(lotId);
      if (!lot) return { spots: [] as ParkingSpot[], filteredVehicles: [] as Vehicle[] };

      const lotVehicles = vehiclesForLot(lotId);
      if (!searchQuery.trim()) {
        return { spots: lot.spots, filteredVehicles: lotVehicles };
      }

      const query = searchQuery.toLowerCase();
      const filteredVehicles = lotVehicles.filter(
        (vehicle) =>
          vehicle.contact.toLowerCase().includes(query) ||
          vehicle.licensePlate.toLowerCase().includes(query) ||
          vehicle.make.toLowerCase().includes(query) ||
          (vehicle.model && vehicle.model.toLowerCase().includes(query)) ||
          vehicle.color.toLowerCase().includes(query) ||
          vehicle.phoneNumber.includes(query),
      );

      const spotIds = filteredVehicles.map((v) => v.parkingSpotId);
      const spots = lot.spots.map((spot) => ({
        ...spot,
        highlighted: spotIds.includes(spot.id),
      }));

      return { spots, filteredVehicles };
    },
    [lotById, searchQuery, vehiclesForLot],
  );

  const availableSpotsForLot = useCallback(
    (lotId: string) => lotById(lotId)?.spots.filter((s) => s.status === 'available').length ?? 0,
    [lotById],
  );

  const occupiedSpotsForLot = useCallback(
    (lotId: string) => lotById(lotId)?.spots.filter((s) => s.status === 'occupied').length ?? 0,
    [lotById],
  );

  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setVehicles([]);
      setParkingLots([initialParkingLot]);
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

  const parkingLot = parkingLots[0] ?? initialParkingLot;

  const value: ParkingContextValue = {
    parkingLots,
    parkingLot,
    vehicles,
    selectedSpot,
    setSelectedSpot,
    updateVehicle,
    removeVehicle,
    getVehicleBySpotId,
    searchQuery,
    setSearchQuery,
    filteredResultsForLot,
    availableSpotsForLot,
    occupiedSpotsForLot,
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

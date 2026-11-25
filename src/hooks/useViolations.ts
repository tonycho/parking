import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Violation } from '../types';
import { formatLicensePlate } from '../lib/formatLicensePlate';

interface ViolationInsert {
  licensePlate: string;
  make?: string;
  model?: string;
  color?: string;
  contact?: string;
  phoneNumber?: string;
  violationTime?: string;
  notes?: string;
  parkingLotId: string;
}

interface ViolationWithCount extends Violation {
  violationCount?: number;
}

export function useViolations(parkingLotId: string | null) {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchViolations = async () => {
    if (!parkingLotId) {
      setViolations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('violations')
        .select('*')
        .eq('parking_lot_id', parkingLotId)
        .order('violation_time', { ascending: false });

      if (fetchError) throw fetchError;

      const formattedViolations: Violation[] = (data || []).map(v => ({
        id: v.id,
        licensePlate: formatLicensePlate(v.license_plate),
        make: v.make,
        model: v.model,
        color: v.color,
        contact: v.contact,
        phoneNumber: v.phone_number,
        violationTime: v.violation_time,
        notes: v.notes,
        parkingLotId: v.parking_lot_id,
        recordedBy: v.recorded_by,
        createdAt: v.created_at,
      }));

      setViolations(formattedViolations);
      setError(null);
    } catch (err) {
      console.error('Error fetching violations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch violations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViolations();
  }, [parkingLotId]);

  const recordViolation = async (violationData: ViolationInsert): Promise<Violation | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error: insertError } = await supabase
        .from('violations')
        .insert({
          license_plate: formatLicensePlate(violationData.licensePlate),
          make: violationData.make,
          model: violationData.model,
          color: violationData.color,
          contact: violationData.contact,
          phone_number: violationData.phoneNumber,
          violation_time: violationData.violationTime || new Date().toISOString(),
          notes: violationData.notes,
          parking_lot_id: violationData.parkingLotId,
          recorded_by: user.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const newViolation: Violation = {
        id: data.id,
        licensePlate: formatLicensePlate(data.license_plate),
        make: data.make,
        model: data.model,
        color: data.color,
        contact: data.contact,
        phoneNumber: data.phone_number,
        violationTime: data.violation_time,
        notes: data.notes,
        parkingLotId: data.parking_lot_id,
        recordedBy: data.recorded_by,
        createdAt: data.created_at,
      };

      setViolations(prev => [newViolation, ...prev]);
      return newViolation;
    } catch (err) {
      console.error('Error recording violation:', err);
      setError(err instanceof Error ? err.message : 'Failed to record violation');
      return null;
    }
  };

  const getViolationsByLicensePlate = async (licensePlate: string): Promise<Violation[]> => {
    if (!parkingLotId) return [];

    try {
      const { data, error: fetchError } = await supabase
        .from('violations')
        .select('*')
        .eq('parking_lot_id', parkingLotId)
        .ilike('license_plate', licensePlate)
        .order('violation_time', { ascending: false });

      if (fetchError) throw fetchError;

      return (data || []).map(v => ({
        id: v.id,
        licensePlate: formatLicensePlate(v.license_plate),
        make: v.make,
        model: v.model,
        color: v.color,
        contact: v.contact,
        phoneNumber: v.phone_number,
        violationTime: v.violation_time,
        notes: v.notes,
        parkingLotId: v.parking_lot_id,
        recordedBy: v.recorded_by,
        createdAt: v.created_at,
      }));
    } catch (err) {
      console.error('Error fetching violations by license plate:', err);
      return [];
    }
  };

  const getViolationCount = async (licensePlate: string): Promise<number> => {
    if (!parkingLotId) return 0;

    try {
      const { count, error: countError } = await supabase
        .from('violations')
        .select('*', { count: 'exact', head: true })
        .eq('parking_lot_id', parkingLotId)
        .ilike('license_plate', licensePlate);

      if (countError) throw countError;
      return count || 0;
    } catch (err) {
      console.error('Error getting violation count:', err);
      return 0;
    }
  };

  const deleteViolation = async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('violations')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setViolations(prev => prev.filter(v => v.id !== id));
      return true;
    } catch (err) {
      console.error('Error deleting violation:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete violation');
      return false;
    }
  };

  return {
    violations,
    loading,
    error,
    recordViolation,
    getViolationsByLicensePlate,
    getViolationCount,
    deleteViolation,
    refreshViolations: fetchViolations,
  };
}

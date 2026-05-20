-- Enable realtime for parking_spots
ALTER PUBLICATION supabase_realtime ADD TABLE public.parking_spots;

-- Enable realtime for vehicle_parking_spot
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle_parking_spot;
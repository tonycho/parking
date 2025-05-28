export interface Vehicle {
  id: string;
  driverName: string;
  phoneNumber: string;
  licensePlate: string;
  make: string;
  model: string;
  color: string;
  parkingSpotId: string;
  timeParked: string;
}

export interface ParkingSpot {
  id: string;
  label: string; 
  status: 'available' | 'occupied';
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  rotation?: number;
  vehicleId?: string;
}

export interface ParkingLot {
  id: string;
  name: string;
  spots: ParkingSpot[];
}
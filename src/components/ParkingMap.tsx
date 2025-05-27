import React, { useCallback } from 'react';
import { ParkingSpot as ParkingSpotType } from '../types';

// Cumberland Presbyterian Church coordinates
const CENTER_LAT = 37.7028856;
const CENTER_LNG = -122.4634879;
const ZOOM = 20;

interface ParkingMapProps {
  spots: ParkingSpotType[];
  onSpotClick: (spot: ParkingSpotType) => void;
  selectedSpotId?: string;
  getDriverName: (spotId: string) => string | undefined;
}

const ParkingMap: React.FC<ParkingMapProps> = ({ 
  spots, 
  onSpotClick, 
  selectedSpotId, 
  getDriverName 
}) => {
  const getMarkerColor = useCallback((spot: ParkingSpotType) => {
    if (spot.id === selectedSpotId) return '#3B82F6'; // blue-500
    if (spot.status === 'available') return '#22C55E'; // green-500
    return '#EF4444'; // red-500
  }, [selectedSpotId]);

  // Create markers string for Google Static Maps API
  const markers = spots.map(spot => {
    const color = getMarkerColor(spot).replace('#', '0x');
    // Calculate marker position based on spot's relative position
    const scaleY = 0.0000025;
    const scaleX = 0.0000025;
    const lat = CENTER_LAT + (spot.position.y - 50) * scaleY;
    const lng = CENTER_LNG + (spot.position.x - 50) * scaleX;
    return `markers=color:${color}%7Clabel:${spot.label}%7C${lat},${lng}`;
  }).join('&');

  const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${CENTER_LAT},${CENTER_LNG}&zoom=${ZOOM}&size=800x600&maptype=satellite&${markers}&key=YOUR_GOOGLE_MAPS_API_KEY`;

  return (
    <div className="relative w-full h-full">
      <img 
        src={mapUrl} 
        alt="Parking Map"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0">
        {spots.map((spot) => {
          const driverName = getDriverName(spot.id);
          const color = getMarkerColor(spot);
          
          return (
            <button
              key={spot.id}
              onClick={() => onSpotClick(spot)}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-105"
              style={{
                left: `${spot.position.x}%`,
                top: `${spot.position.y}%`,
                transform: `rotate(${spot.rotation || 0}deg)`,
              }}
            >
              <div
                className="w-12 h-8 rounded-sm shadow-md flex items-center justify-center text-white text-sm font-semibold"
                style={{ backgroundColor: color }}
              >
                {spot.label}
              </div>
              {driverName && (
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow-sm text-xs whitespace-nowrap">
                  {driverName}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ParkingMap;
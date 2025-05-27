import React, { useCallback } from 'react';
import Map, { Marker } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ParkingSpot as ParkingSpotType } from '../types';

const MAPBOX_TOKEN = 'pk.eyJ1IjoidGNobzExMjAiLCJhIjoiY21iNzNya3oyMDZjaTJtcHQyOHpqZzhuayJ9.Y_KYYgREwSvUt3MzRdYtQA';

// Center coordinates for Cumberland Presbyterian Church parking lot
const CENTER_COORDINATES = {
  latitude: 37.7028856,
  longitude: -122.4634879,
  zoom: 19.5,
  pitch: 0, // Set pitch to 0 for top-down view
  bearing: 0 // Set bearing to 0 for north-up orientation
};

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

  return (
    <Map
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={CENTER_COORDINATES}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/satellite-v9"
    >
      {spots.map((spot) => {
        const driverName = getDriverName(spot.id);
        const color = getMarkerColor(spot);
        
        // Calculate marker position based on spot's relative position
        const scaleY = 0.0000015; // Adjusted scale for more precise positioning
        const scaleX = 0.0000015;
        
        const latitude = CENTER_COORDINATES.latitude + (spot.position.y - 50) * scaleY;
        const longitude = CENTER_COORDINATES.longitude + (spot.position.x - 50) * scaleX;

        return (
          <Marker
            key={spot.id}
            latitude={latitude}
            longitude={longitude}
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              onSpotClick(spot);
            }}
          >
            <div
              className="relative cursor-pointer transition-transform hover:scale-105"
              style={{ transform: `rotate(${spot.rotation || 0}deg)` }}
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
            </div>
          </Marker>
        );
      })}
    </Map>
  );
};

export default ParkingMap;
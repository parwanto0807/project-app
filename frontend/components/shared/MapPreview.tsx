'use client';

import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useMemo } from 'react';

// Fix Leaflet icon issue - move outside component
const icon = typeof window !== 'undefined' ? L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
}) : null;

interface MapPreviewProps {
  latitude: number;
  longitude: number;
  radius: number;
  name: string;
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center[0] !== 0 || center[1] !== 0) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

export default function MapPreview({ latitude, longitude, radius, name }: MapPreviewProps) {
  // Use useMemo to prevent new array creation on every render
  const position = useMemo<[number, number]>(() => 
    [latitude || -6.2088, longitude || 106.8456], // Default to Jakarta if empty
    [latitude, longitude]
  );

  return (
    <div className="h-[200px] w-full bg-muted/20 relative z-0">
      <MapContainer 
        center={position} 
        zoom={15} 
        scrollWheelZoom={false}
        dragging={false}
        touchZoom={false}
        doubleClickZoom={false}
        zoomControl={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ChangeView center={position} />
        {icon && <Marker position={position} icon={icon} />}
        <Circle 
          center={position} 
          pathOptions={{ color: '#0ea5e9', fillColor: '#0ea5e9', fillOpacity: 0.2 }} 
          radius={radius} 
        />
      </MapContainer>
    </div>
  );
}

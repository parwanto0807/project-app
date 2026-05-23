"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's default icon path issues in Next.js
const customIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export interface MapPhoto {
  latitude: number;
  longitude: number;
  imageUrl?: string;
  caption?: string;
}

interface SpkMapComponentProps {
  photos: MapPhoto[];
}

export default function SpkMapComponent({ photos }: SpkMapComponentProps) {
  // Center map on the first photo's coordinates, or fallback to Indonesia center
  const center: [number, number] = photos.length > 0
    ? [photos[0].latitude, photos[0].longitude]
    : [-0.7893, 113.9213];

  useEffect(() => {
    // This effect ensures we only run client-side code if needed
    // (though dynamic import with ssr: false should handle it)
  }, []);
  // Group photos by coordinate so we can show multiple photos in one marker popup if they share the exact location
  const groupedPhotos: Record<string, MapPhoto[]> = {};
  photos.forEach(photo => {
    const key = `${photo.latitude.toFixed(6)},${photo.longitude.toFixed(6)}`;
    if (!groupedPhotos[key]) {
      groupedPhotos[key] = [];
    }
    groupedPhotos[key].push(photo);
  });
  
  const groupedPhotosArray = Object.values(groupedPhotos);

  return (
    <div className="w-full h-[400px] sm:h-[500px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <MapContainer
        center={center}
        zoom={photos.length > 0 ? 13 : 5}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {groupedPhotosArray.map((group, index) => (
          <Marker
            key={`marker-group-${index}`}
            position={[group[0].latitude, group[0].longitude]}
            icon={customIcon}
          >
            <Popup>
              <div className="w-52 text-center flex flex-col gap-4 max-h-[300px] overflow-y-auto p-1 overflow-x-hidden pr-2">
                <p className="text-xs font-semibold text-gray-700 border-b pb-1 mb-1">
                  {group.length} Foto di Lokasi Ini
                </p>
                {group.map((photo, pIdx) => (
                  <div key={pIdx} className="flex flex-col gap-1 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    {photo.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo.imageUrl}
                        alt={photo.caption || "Foto Laporan"}
                        className="w-full h-auto rounded-md object-cover border border-gray-200 shadow-sm"
                        style={{ maxHeight: "150px" }}
                      />
                    ) : (
                      <div className="w-full h-24 bg-gray-100 flex items-center justify-center text-gray-400 text-xs rounded-md">
                        No Image Available
                      </div>
                    )}
                    {photo.caption && (
                      <p className="text-xs font-medium text-gray-800 m-0 leading-tight">
                        {photo.caption}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

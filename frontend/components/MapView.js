import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapView({ selectedHospital }) {
  const ambulancePos = [12.9716, 77.5946]; // Default coords

  return (
    <div className="h-full w-full relative">
      <MapContainer center={ambulancePos} zoom={13} className="h-full w-full">
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        {/* Ambulance Marker */}
        <Marker position={ambulancePos}>
          <Popup>Ambulance (Current Location)</Popup>
        </Marker>

        {/* Selected Hospital Marker */}
        {selectedHospital && (
          <Marker position={[12.9800, 77.6000]}> {/* Replace with real coords */}
            <Popup>{selectedHospital.name}</Popup>
          </Marker>
        )}
      </MapContainer>
      
      {/* Overlay for Navigation Stats */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/90 border border-slate-700 p-3 rounded-lg shadow-2xl">
        <p className="text-xs text-slate-400 uppercase font-bold">Traffic Status</p>
        <p className="text-emerald-400 font-medium">Clear Route Optimized</p>
      </div>
    </div>
  );
}

export default MapView;

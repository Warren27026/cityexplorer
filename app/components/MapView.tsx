'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';

// Reset des icônes Leaflet par défaut
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Icône personnalisée plus moderne (Violette)
const customIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Composant pour animer le zoom
function MapController({ center, zoom }: { center: { lat: number; lon: number }, zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([center.lat, center.lon], zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
}

interface MapViewProps {
  className?: string;
  center: { lat: number; lon: number };
  zoom: number;
  markers: { lat: number; lon: number; title: string }[];
}

export default function MapView({ className, center, zoom, markers }: MapViewProps) {
  return (
    <MapContainer center={[center.lat, center.lon]} zoom={zoom} className={className} scrollWheelZoom={true}>
      {/* Fond de carte sombre (CartoDB Dark Matter) */}
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <MapController center={center} zoom={zoom} />
      
      {markers.map((m, i) => (
        <Marker key={i} position={[m.lat, m.lon]} icon={customIcon}>
          <Popup>
            <div className="font-sans text-sm font-bold text-gray-800">{m.title}</div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
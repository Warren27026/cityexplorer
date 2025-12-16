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

const customIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const userIcon = new L.DivIcon({
  className: 'user-pin', // Classe CSS définie dans globals.css
  iconSize: [20, 20],
  popupAnchor: [0, -10]
});

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
  userLocation?: { lat: number; lon: number } | null;
  markers: { 
    lat: number; 
    lon: number; 
    title: string; 
    desc?: string;
    googleMapsLink?: string; 
  }[];
}

export default function MapView({ className, center, zoom, markers, userLocation }: MapViewProps) {
  return (
    <MapContainer center={[center.lat, center.lon]} zoom={zoom} className={className} scrollWheelZoom={true}>
      <TileLayer
        attribution='&copy; CARTO'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <MapController center={center} zoom={zoom} />
      
      {/* Marqueur Utilisateur */}
      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lon]} icon={userIcon}>
          <Popup>
            <div className="text-black font-bold text-center">
              📍 Vous êtes ici<br/>
              <span className="text-[10px] font-normal text-gray-500">Prêt à explorer ?</span>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Marqueurs Lieux */}
      {markers.map((m, i) => (
        <Marker key={i} position={[m.lat, m.lon]} icon={customIcon}>
          <Popup>
            <div className="min-w-[180px]">
              <div className="font-bold text-sm text-[#7C3AED] mb-1 truncate">{m.title}</div>
              {m.desc && <div className="text-[10px] text-gray-500 uppercase font-bold mb-2">{m.desc}</div>}
              
              {m.googleMapsLink && (
                <a 
                  href={m.googleMapsLink} 
                  target="_blank" 
                  className="block text-center w-full py-1.5 rounded bg-[#06B6D4] text-white text-[11px] font-bold hover:bg-[#0891b2] transition-colors no-underline shadow-md"
                >
                  🚗 Itinéraire
                </a>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
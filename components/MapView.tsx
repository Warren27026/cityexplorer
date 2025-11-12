'use client';

import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

// 🔧 Corrige les icônes manquantes
function useLeafletDefaultIcon() {
  useEffect(() => {
    // @ts-ignore
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);
}

export type MarkerData = {
  id: number;
  name: string;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
};

type Props = {
  center: { lat: number; lon: number };
  markers: MarkerData[];
  zoom?: number;
};

// 📍 Composant pour localiser l’utilisateur en cliquant
function LocationMarker() {
  const [position, setPosition] = useState<L.LatLng | null>(null);

  const map = useMapEvents({
    click() {
      map.locate();
    },
    locationfound(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : (
    <Marker position={position}>
      <Popup>📍 Vous êtes ici</Popup>
    </Marker>
  );
}

export default function MapView({ center, markers, zoom = 13 }: Props) {
  useLeafletDefaultIcon();

  const [ready, setReady] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  // ✅ Assure que la carte s’affiche bien
  useEffect(() => {
    if (!mapRef.current) return;
    const m = mapRef.current;
    const t1 = setTimeout(() => m.invalidateSize(), 0);
    const t2 = setTimeout(() => m.invalidateSize(), 250);
    const onResize = () => m.invalidateSize();
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', onResize);
    };
  }, [ready]);

  return (
    <div className="w-full h-[70vh] min-h-[400px] rounded-2xl overflow-hidden border bg-white shadow-sm">
      <MapContainer
        center={[center.lat, center.lon]}
        zoom={zoom}
        scrollWheelZoom
        className="w-full h-full"
        whenCreated={(m) => {
          mapRef.current = m;
          setReady(true);
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 🔍 Marqueurs existants */}
        {markers.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lon]}>
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">{m.name}</div>
                {m.tags?.website && (
                  <a
                    className="underline"
                    href={m.tags.website}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Site web
                  </a>
                )}
                {m.tags?.addr_full && <div>{m.tags.addr_full}</div>}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 📍 Marqueur de localisation (clic sur la carte) */}
        <LocationMarker />
      </MapContainer>
    </div>
  );
}

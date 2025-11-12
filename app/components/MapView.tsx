'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

// Fix default marker icons in Leaflet on Next.js
function useLeafletDefaultIcon() {
  useEffect(() => {
    // @ts-ignore
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl:
        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl:
        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
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

export default function MapView({ center, markers, zoom = 13 }: Props) {
  useLeafletDefaultIcon();
  return (
    <div className="w-full h-[70vh] rounded-2xl overflow-hidden border">
      <MapContainer
        center={[center.lat, center.lon]}
        zoom={zoom}
        scrollWheelZoom
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lon]}>
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">{m.name}</div>
                {m.tags?.website && (
                  <a className="underline" href={m.tags.website} target="_blank" rel="noreferrer">
                    Site web
                  </a>
                )}
                {m.tags?.addr_full && <div>{m.tags.addr_full}</div>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

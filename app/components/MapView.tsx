'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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
'use client';

import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useRef, useState } from 'react';

// Icônes Leaflet par défaut (sinon les marqueurs n’apparaissent pas)
function useLeafletDefaultIcon() {
  useEffect(() => {
    // @ts-ignore
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
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
  className?: string;
};

type UserLoc = { lat: number; lon: number; accuracy: number } | null;

export default function MapView({ center, markers, zoom = 13, className }: Props) {
  useLeafletDefaultIcon();

  const [ready, setReady] = useState(false);
  const [userLoc, setUserLoc] = useState<UserLoc>(null);
  const [locating, setLocating] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  // Sécurise la taille de la carte
  useEffect(() => {
    if (!mapRef.current) return;
    const m = mapRef.current;
    const t1 = setTimeout(() => m.invalidateSize(), 0);
    const t2 = setTimeout(() => m.invalidateSize(), 250);
    const onResize = () => m.invalidateSize();
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(t1); clearTimeout(t2);
      window.removeEventListener('resize', onResize);
    };
  }, [ready]);

  useEffect(() => {
    mapRef.current?.invalidateSize();
  }, [center.lat, center.lon]);

  async function locateMe() {
    if (!('geolocation' in navigator)) {
      alert("La géolocalisation n'est pas supportée par ce navigateur.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setUserLoc({ lat: latitude, lon: longitude, accuracy: accuracy || 50 });
        // centre et zoome un peu
        if (mapRef.current) mapRef.current.flyTo([latitude, longitude], Math.max(14, zoom ?? 13), { duration: 0.8 });
        setLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        let msg = "Impossible d'obtenir la position.";
        if (err.code === err.PERMISSION_DENIED) msg = "Permission refusée. Autorise la localisation dans le navigateur.";
        if (err.code === err.POSITION_UNAVAILABLE) msg = "Position indisponible (GPS/ réseau).";
        if (err.code === err.TIMEOUT) msg = "Délai dépassé pour la localisation.";
        alert(msg);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  return (
    <div
      className={`relative w-full h-[70vh] min-h-[400px] rounded-2xl overflow-hidden border bg-white shadow-sm ${className ?? ''}`}
      style={{ contain: 'layout paint' }}
    >
      {/* Bouton "Me localiser" en overlay */}
      <div className="absolute z-[1000] top-3 right-3">
        <button
          onClick={locateMe}
          disabled={locating}
          className="px-3 py-1.5 rounded-lg border bg-white/90 hover:bg-white text-sm shadow"
          title="Centrer la carte sur ma position"
        >
          {locating ? '🔎 Localisation...' : '📍 Me localiser'}
        </button>
      </div>

      <MapContainer
        center={[center.lat, center.lon]}
        zoom={zoom}
        scrollWheelZoom
        className="w-full h-full"
        style={{ width: '100%', height: '100%' }}
        whenCreated={(m) => { mapRef.current = m; setReady(true); }}
        key={`${Math.round(center.lat*1e4)}-${Math.round(center.lon*1e4)}`}
      >
        {ready && (
          <>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              crossOrigin="anonymous"
              detectRetina
            />

            {/* Marqueurs des lieux */}
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

            {/* Position de l'utilisateur + cercle de précision */}
            {userLoc && (
              <>
                <Marker position={[userLoc.lat, userLoc.lon]}>
                  <Popup>
                    <div className="text-sm">
                      <div className="font-semibold">Vous êtes ici</div>
                      <div>Précision ~ {Math.round(userLoc.accuracy)} m</div>
                    </div>
                  </Popup>
                </Marker>
                <Circle
                  center={[userLoc.lat, userLoc.lon]}
                  radius={Math.min(Math.max(userLoc.accuracy, 20), 300)} // 20–300 m pour lisibilité
                  pathOptions={{ color: '#2563eb', fillColor: '#60a5fa', fillOpacity: 0.25 }}
                />
              </>
            )}
          </>
        )}
      </MapContainer>
    </div>
  );
}
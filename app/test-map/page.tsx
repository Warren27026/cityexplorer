'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';

// Plusieurs fournisseurs de tuiles (fallback auto)
const PROVIDERS = [
  {
    name: 'OSM main',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  {
    name: 'OpenStreetMap.fr',
    url: 'https://tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap France',
  },
  {
    name: 'Carto Light',
    url: 'https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
  },
];

export default function TestMap() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // 1) créer la carte
    const map = L.map(el).setView([48.0061, 0.1996], 13); // Le Mans

    // 2) fonction pour poser une couche tuiles + fallback sur erreur
    let layer: L.TileLayer | null = null;
    let idx = 0;

    function useProvider(i: number) {
      const p = PROVIDERS[i];
      if (layer) {
        layer.off(); // enlever anciens handlers
        map.removeLayer(layer);
      }
      console.log('➡️ provider:', p.name);
      layer = L.tileLayer(p.url, {
        attribution: p.attribution,
        crossOrigin: true,
        detectRetina: true,
        updateWhenZooming: true,
        updateWhenIdle: false,
      });
      layer.on('tileerror', () => {
        idx = (idx + 1) % PROVIDERS.length;
        useProvider(idx);
      });
      layer.addTo(map);
    }

    useProvider(idx);

    // 3) s'assurer de la taille réelle
    setTimeout(() => map.invalidateSize(), 0);
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);

    return () => {
      ro.disconnect();
      map.remove();
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{
        width: '100%',
        height: '70vh',
        minHeight: 400,
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid #e5e7eb',
      }}
    />
  );
}

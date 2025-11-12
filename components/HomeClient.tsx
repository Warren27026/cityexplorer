'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('../components/MapView'), { ssr: false });
import type { Place } from '@/lib/overpass';
import { searchPlaces } from '@/lib/overpass';



type City = { display_name: string; lat: number; lon: number };

async function geocodeCity(q: string): Promise<City[]> {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', q);
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '0');
  url.searchParams.set('limit', '5');
  const res = await fetch(url.toString(), { headers: { 'Accept-Language': 'fr' } });
  if (!res.ok) throw new Error('geocoding failed');
  const data = await res.json();
  return data.map((d: any) => ({
    display_name: d.display_name,
    lat: parseFloat(d.lat),
    lon: parseFloat(d.lon),
  }));
}

const ALL_CATEGORIES = ['musique', 'lecture', 'sport', 'art', 'nature'];

export default function HomeClient() {
  const [query, setQuery] = useState('Le Mans');
  const [suggestions, setSuggestions] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  const [selectedCats, setSelectedCats] = useState<string[]>(['musique', 'lecture']);
  const [radius, setRadius] = useState(3000);
  const [loading, setLoading] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Live suggestions for city field (debounced)
  useEffect(() => {
    const id = setTimeout(async () => {
      if (!query || query.length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const s = await geocodeCity(query);
        setSuggestions(s);
      } catch (e) {
        // ignore
      }
    }, 300);
    return () => clearTimeout(id);
  }, [query]);

  const center = useMemo(() => {
    if (selectedCity) return { lat: selectedCity.lat, lon: selectedCity.lon };
    return { lat: 48.0061, lon: 0.1996 }; // default: Le Mans
  }, [selectedCity]);

  async function runSearch() {
    if (!center) return;
    setLoading(true);
    setError(null);
    try {
      const results = await searchPlaces({
        cityCenter: center,
        radiusMeters: radius,
        categories: selectedCats
      });
      setPlaces(results);
    } catch (e: any) {
      setError(e.message || 'Erreur pendant la recherche.');
    } finally {
      setLoading(false);
    }
  }

  function toggleCat(c: string) {
    setSelectedCats(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    );
  }

  useEffect(() => {
    const id = setTimeout(() => {
      runSearch();
    }, 400);
    return () => clearTimeout(id);
  }, [center.lat, center.lon, radius, JSON.stringify(selectedCats)]);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">CityExplorer</h1>
        <p className="text-gray-600">
          Choisis une ville, sélectionne des thématiques, et découvre les lieux qui correspondent à tes centres d'intérêt.
        </p>
      </header>

      <div className="grid md:grid-cols-3 gap-4 items-start">
        {/* Controls */}
        <div className="space-y-4 md:col-span-1">
          <div>
            <label className="text-sm font-medium">Ville</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none"
              placeholder="Paris, Lyon, Le Mans…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {suggestions.length > 0 && (
              <div className="mt-1 border rounded-xl bg-white shadow overflow-hidden">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50"
                    onClick={() => { setSelectedCity(s); setQuery(s.display_name); setSuggestions([]);}}
                  >
                    {s.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Thématiques</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {ALL_CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => toggleCat(c)}
                  className={
                    'px-3 py-1 rounded-full border text-sm ' +
                    (selectedCats.includes(c)
                      ? 'bg-black text-white'
                      : 'bg-white hover:bg-gray-50')
                  }
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Rayon (m)</label>
            <input
              type="range"
              min={500}
              max={10000}
              step={500}
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value, 10))}
              className="w-full"
            />
            <div className="text-sm text-gray-600">{radius} m</div>
          </div>

          <button
            onClick={runSearch}
            disabled={loading}
            className="rounded-xl px-4 py-2 bg-black text-white disabled:opacity-60"
          >
            {loading ? 'Recherche…' : 'Rechercher'}
          </button>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div className="mt-4">
            <div className="text-sm font-medium mb-2">Résultats ({places.length})</div>
            <div className="max-h-[40vh] overflow-auto pr-1 space-y-2">
              {places.map((p) => (
                <div key={p.id} className="border rounded-xl p-2">
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-xs text-gray-600">{p.tags?.amenity || p.tags?.shop || p.tags?.tourism}</div>
                  {p.tags?.website && (
                    <a href={p.tags.website} target="_blank" rel="noreferrer" className="text-xs underline">
                      {p.tags.website}
                    </a>
                  )}
                </div>
              ))}
              {places.length === 0 && <div className="text-sm text-gray-500">Aucun lieu à afficher pour le moment.</div>}
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="md:col-span-2">
          <MapView
  className="rounded-3xl border shadow-sm"
  center={{ lat: 48.8566, lon: 2.3522 }}
  markers={[]}
  zoom={12}
/>

        </div>
      </div>
    </div>
  );
}

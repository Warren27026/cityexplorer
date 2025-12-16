'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type { Place } from '@/lib/overpass';
import { searchPlaces } from '@/lib/overpass';

// Chargement dynamique de la carte pour éviter les erreurs SSR
const MapView = dynamic(() => import('../components/MapView'), { 
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-[#0F172A] text-white/50">Chargement de la carte...</div>
});

type City = { display_name: string; lat: number; lon: number };

// Configuration des catégories avec icônes
const CATEGORIES = [
  { id: 'musique', label: 'Musique', icon: '🎵' },
  { id: 'lecture', label: 'Lecture', icon: '📚' },
  { id: 'sport', label: 'Sport', icon: '⚽' },
  { id: 'art', label: 'Art', icon: '🎨' },
  { id: 'cinema', label: 'Cinéma', icon: '🎬' },
  { id: 'gastronomie', label: 'Food', icon: '🍽️' },
  { id: 'nature', label: 'Nature', icon: '🌳' },
  { id: 'technologie', label: 'Tech', icon: '💻' },
];

async function geocodeCity(q: string): Promise<City[]> {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', q);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '5');
  // Ajout de l'adresse pour être plus précis
  url.searchParams.set('addressdetails', '1'); 
  
  try {
    const res = await fetch(url.toString());
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    return [];
  }
}

export default function HomeClient() {
  const [query, setQuery] = useState('Le Mans');
  const [suggestions, setSuggestions] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  
  const [selectedCats, setSelectedCats] = useState<string[]>(['musique']);
  const [radius, setRadius] = useState(3000);
  const [loading, setLoading] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Autocomplete
  useEffect(() => {
    const id = setTimeout(async () => {
      if (!query || query.length < 3) { setSuggestions([]); return; }
      const s = await geocodeCity(query);
      setSuggestions(s);
    }, 400);
    return () => clearTimeout(id);
  }, [query]);

  // Centre de la carte
  const center = useMemo(() => {
    if (selectedCity) return { lat: selectedCity.lat, lon: selectedCity.lon };
    return { lat: 48.0061, lon: 0.1996 }; // Le Mans par défaut
  }, [selectedCity]);

  // Recherche Overpass
  async function runSearch() {
    if (!center) return;
    setLoading(true); setError(null);
    try {
      const results = await searchPlaces({
        cityCenter: center,
        radiusMeters: radius,
        categories: selectedCats
      });
      setPlaces(results);
    } catch (e: any) {
      setError("Erreur réseau ou zone trop large.");
    } finally {
      setLoading(false);
    }
  }

  function toggleCat(c: string) {
    setSelectedCats(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  }

  // Auto-refresh quand on change de rayon ou de ville
  useEffect(() => {
    const id = setTimeout(() => runSearch(), 500);
    return () => clearTimeout(id);
  }, [center.lat, center.lon, radius, selectedCats.length]);

  return (
    <div className="max-w-[1440px] mx-auto p-4 md:p-6 min-h-screen flex flex-col font-sans">
      
      {/* HEADER */}
      <header className="flex justify-between items-center mb-8 py-4 border-b border-white/10">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            City<span className="text-[#7C3AED]">Explorer</span>.
          </h1>
          <p className="text-sm text-gray-400 font-medium">L'Open Data au service de vos sorties.</p>
        </div>
        <button 
          onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(pos => {
                setSelectedCity({ 
                  lat: pos.coords.latitude, 
                  lon: pos.coords.longitude, 
                  display_name: "Ma Position" 
                });
                setQuery("Ma Position");
              });
            }
          }}
          className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-bold hover:bg-[#7C3AED] transition-colors"
        >
          📍 Ma Position
        </button>
      </header>

      {/* GRID LAYOUT */}
      <div className="grid lg:grid-cols-[380px_1fr] gap-6 flex-1 items-start">
        
        {/* === SIDEBAR (Gauche) === */}
        <div className="space-y-6">
          
          {/* 1. Module Recherche */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-xs uppercase tracking-[2px] text-[#06B6D4] font-bold mb-4 flex items-center gap-2">
              <span>1.</span> Exploration
            </h2>
            
            <div className="relative">
              <input
                className="input-glass w-full rounded-xl px-4 py-3 text-sm placeholder-gray-500 font-medium"
                placeholder="Chercher une ville..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button 
                onClick={runSearch}
                className="absolute right-2 top-2 p-1.5 bg-[#7C3AED] rounded-lg hover:bg-[#06B6D4] transition-colors shadow-lg"
              >
                🔍
              </button>

              {/* Suggestions */}
              {suggestions.length > 0 && query !== selectedCity?.display_name && (
                <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-[#0F172A]/95 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden shadow-2xl">
                  {suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-[#7C3AED]/20 hover:text-white transition-colors border-b border-white/5 last:border-0"
                      onClick={() => { 
                        setSelectedCity({ lat: parseFloat(s.lat as any), lon: parseFloat(s.lon as any), display_name: s.display_name }); 
                        setQuery(s.display_name); 
                        setSuggestions([]);
                      }}
                    >
                      {s.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-5">
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>Rayon</span>
                <span>{radius}m</span>
              </div>
              <input
                type="range"
                min={500} max={5000} step={500}
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#06B6D4]"
              />
            </div>
          </div>

          {/* 2. Module Filtres */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-xs uppercase tracking-[2px] text-[#7C3AED] font-bold mb-4 flex items-center gap-2">
              <span>2.</span> Vos Envies
            </h2>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => toggleCat(cat.id)}
                  className={`
                    px-3 py-2 rounded-full text-xs font-bold border transition-all duration-300 flex items-center gap-2
                    ${selectedCats.includes(cat.id) 
                      ? 'bg-[#7C3AED] border-[#7C3AED] text-white shadow-[0_0_15px_rgba(124,58,237,0.4)] transform scale-105' 
                      : 'bg-white/5 border-white/10 text-gray-400 hover:border-[#06B6D4] hover:text-white'}
                  `}
                >
                  <span>{cat.icon}</span> {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Module Résultats */}
          <div className="glass-card rounded-2xl p-6 flex flex-col h-[400px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs uppercase tracking-[2px] text-white font-bold flex items-center gap-2">
                <span>3.</span> Résultats
              </h2>
              <span className="bg-[#06B6D4] text-black text-[10px] font-extrabold px-2 py-1 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                {places.length}
              </span>
            </div>

            <div className="overflow-y-auto pr-2 flex-1 space-y-3 custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 animate-pulse">
                  <div className="text-2xl mb-2">📡</div>
                  <p className="text-xs">Scan en cours...</p>
                </div>
              ) : places.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <div className="text-4xl mb-4 opacity-50">🚀</div>
                  <p className="font-bold text-sm">Prêt à explorer ?</p>
                  <p className="text-xs mt-1">Sélectionnez une catégorie.</p>
                </div>
              ) : (
                places.map((p) => (
                  <div key={p.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 hover:border-[#06B6D4] transition-all group cursor-pointer relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#06B6D4] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="font-bold text-sm text-gray-100 group-hover:text-[#06B6D4] truncate">{p.name || 'Lieu sans nom'}</div>
                    <div className="text-[11px] text-gray-500 mt-1 capitalize">{p.tags?.amenity || p.tags?.leisure || 'Divers'}</div>
                    
                    {(p.tags?.['addr:street'] || p.tags?.['addr:city']) && (
                       <div className="text-[10px] text-gray-400 mt-2 flex items-center gap-1 truncate">
                         📍 {p.tags['addr:housenumber'] || ''} {p.tags['addr:street'] || p.tags['addr:city']}
                       </div>
                    )}
                    
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lon}`} 
                      target="_blank"
                      className="mt-3 flex items-center justify-center w-full py-2 rounded-lg bg-[#06B6D4]/10 text-[#06B6D4] text-xs font-bold hover:bg-[#06B6D4] hover:text-black transition-colors"
                    >
                      🚗 Y aller
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* === MAP (Droite) === */}
        <div className="glass-card rounded-3xl p-1 overflow-hidden relative h-[500px] lg:h-[830px] shadow-2xl">
          <MapView
            className="w-full h-full rounded-2xl"
            center={center}
            markers={places.map(p => ({ lat: p.lat, lon: p.lon, title: p.name || 'Lieu' }))}
            zoom={13}
          />
          
          {/* Overlay Stats Flottant */}
          <div className="absolute bottom-8 left-8 right-8 bg-[#0F172A]/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex justify-around shadow-2xl z-[400]">
             <div className="text-center">
               <div className="text-2xl font-black text-[#7C3AED]">{places.length}</div>
               <div className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Lieux</div>
             </div>
             <div className="text-center border-l border-white/10 pl-8">
               <div className="text-2xl font-black text-[#06B6D4]">{selectedCats.length}</div>
               <div className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Filtres</div>
             </div>
             <div className="text-center border-l border-white/10 pl-8">
               <div className="text-xl font-bold text-white mt-1 truncate max-w-[100px]">{selectedCity ? 'Ville' : 'Le Mans'}</div>
               <div className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Zone</div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
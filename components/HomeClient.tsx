'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type { Place } from '@/lib/overpass';
import { searchPlaces } from '@/lib/overpass';

// Carte dynamique avec loader stylé
const MapView = dynamic(() => import('../components/MapView'), { 
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex flex-col items-center justify-center bg-gray-900 text-white/50 gap-4">
      <div className="w-8 h-8 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin"></div>
      <span className="text-xs font-medium tracking-widest uppercase">Initialisation de la carte...</span>
    </div>
  )
});

type City = { display_name: string; lat: number; lon: number };

const CATEGORIES = [
  { id: 'musique', label: 'Musique', icon: '🎵', desc: 'Concerts & Clubs' },
  { id: 'lecture', label: 'Lecture', icon: '📚', desc: 'Biblio & Librairies' },
  { id: 'sport', label: 'Sport', icon: '⚽', desc: 'Stades & Gymnases' },
  { id: 'art', label: 'Art', icon: '🎨', desc: 'Musées & Galeries' },
  { id: 'cinema', label: 'Cinéma', icon: '🎬', desc: 'Salles obscures' },
  { id: 'gastronomie', label: 'Miam', icon: '🍽️', desc: 'Restos & Cafés' },
  { id: 'nature', label: 'Nature', icon: '🌳', desc: 'Parcs & Forêts' },
  { id: 'technologie', label: 'Tech', icon: '💻', desc: 'Coworking & Fablab' },
];

const LOADING_MESSAGES = [
  "📡 Scan du secteur en cours...",
  "🛰️ Interrogation des satellites...",
  "🧐 Recherche des meilleures pépites...",
  "🗺️ Déploiement de la carte...",
  "✨ Un instant, la magie opère..."
];

async function geocodeCity(q: string): Promise<City[]> {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', q);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '5');
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
  const [query, setQuery] = useState(''); 
  const [suggestions, setSuggestions] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number, lon: number } | null>(null);
  
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [radius, setRadius] = useState(3000);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLightMode, setIsLightMode] = useState(false);

  // Rotation des messages
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingMsg(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [loading]);

  // Autocomplete
  useEffect(() => {
    const id = setTimeout(async () => {
      if (!query || query.length < 3 || query === "Ma Position") { 
        setSuggestions([]); 
        return; 
      }
      const s = await geocodeCity(query);
      setSuggestions(s);
    }, 400);
    return () => clearTimeout(id);
  }, [query]);

  const center = useMemo(() => {
    if (selectedCity) return { lat: selectedCity.lat, lon: selectedCity.lon };
    return { lat: 48.0061, lon: 0.1996 }; // Le Mans
  }, [selectedCity]);

  const locateMe = () => {
    if (!navigator.geolocation) return setError("Géolocalisation non supportée.");
    setLoading(true);
    setLoadingMsg("🛰️ Triangulation de votre position...");
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setSelectedCity({ ...loc, display_name: "Ma Position" });
        setUserLocation(loc);
        setQuery("Ma Position");
        setLoading(false);
      },
      () => { setError("Impossible de vous localiser."); setLoading(false); }
    );
  };

  const toggleTheme = () => {
    setIsLightMode(!isLightMode);
    document.documentElement.classList.toggle('light');
  };

  async function runSearch() {
    if (!center) return;
    if (selectedCats.length === 0) { setPlaces([]); return; }

    setLoading(true); setError(null);
    try {
      const results = await searchPlaces({
        cityCenter: center,
        radiusMeters: radius,
        categories: selectedCats
      });
      setPlaces(results.slice(0, 10));
    } catch (e: any) {
      setError("Oups, petite erreur de réseau.");
    } finally {
      setLoading(false);
    }
  }

  function toggleCat(c: string) {
    setSelectedCats(prev => {
        const newSelection = prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c];
        if (newSelection.length === 0) setPlaces([]);
        return newSelection;
    });
  }

  useEffect(() => {
    const id = setTimeout(() => runSearch(), 500);
    return () => clearTimeout(id);
  }, [center.lat, center.lon, radius, selectedCats.length]);

  return (
    <div className="h-screen w-full flex flex-col font-sans overflow-hidden text-current transition-colors duration-500">
      
      {/* HEADER AGRANDI */}
      <header className="flex-none flex justify-between items-center px-8 py-6 border-b border-gray-500/10 bg-inherit backdrop-blur-md z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-gradient-to-br from-[#7C3AED] to-[#4C1D95] rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-purple-500/20 transform hover:scale-105 transition-transform duration-300">
            🚀
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter leading-none">
              City<span className="text-[#06B6D4]">Explorer</span>
            </h1>
            <p className="text-xs font-bold tracking-widest uppercase opacity-60 mt-1">L'aventure commence ici</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
            {/* Bouton Thème */}
            <button 
                onClick={toggleTheme}
                className="p-3 rounded-xl bg-gray-500/10 hover:bg-gray-500/20 transition-all text-xl"
                title="Changer le thème"
            >
                {isLightMode ? '🌙' : '☀️'}
            </button>

            <button 
            onClick={locateMe}
            className="group relative px-6 py-3 rounded-xl bg-[#06B6D4]/10 border border-[#06B6D4]/30 text-sm font-bold hover:bg-[#06B6D4] hover:text-white transition-all flex items-center gap-2 overflow-hidden shadow-lg"
            >
            <span className="relative z-10">🧭 Me Localiser</span>
            </button>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="flex-1 grid lg:grid-cols-[400px_1fr] overflow-hidden">
        
        {/* === SIDEBAR === */}
        <div className="glass-panel flex flex-col h-full overflow-hidden z-20 shadow-2xl">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
            
            {/* 1. Recherche */}
            <div className="space-y-5 animate-fade-in" style={{animationDelay: '0.1s'}}>
              <div className="flex items-center justify-between">
                <h2 className="text-sm uppercase tracking-widest text-[#06B6D4] font-bold">1. Point de départ</h2>
                {userLocation && <span className="text-[10px] bg-[#06B6D4]/20 text-[#06B6D4] px-2 py-0.5 rounded animate-pulse font-bold">GPS ACTIF</span>}
              </div>
              
              <div className="relative group">
                <input
                  className="input-glass w-full rounded-2xl pl-12 pr-4 py-4 text-base font-medium placeholder-gray-400 group-hover:border-[#06B6D4]/30"
                  placeholder="Quelle ville vous tente ?"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <span className="absolute left-4 top-4 text-gray-400 text-lg group-hover:text-[#06B6D4] transition-colors">🔍</span>
                
                {suggestions.length > 0 && query !== "Ma Position" && query !== selectedCity?.display_name && (
                  <div className="absolute z-50 top-full mt-2 w-full bg-[#1E293B] border border-white/10 rounded-xl overflow-hidden shadow-2xl transform origin-top animate-fade-in">
                    {suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-[#7C3AED]/20 hover:text-white transition-colors border-b border-white/5 last:border-0 flex items-center gap-2"
                        onClick={() => { 
                          setSelectedCity({ lat: parseFloat(s.lat as any), lon: parseFloat(s.lon as any), display_name: s.display_name }); 
                          setQuery(s.display_name); 
                          setSuggestions([]);
                          setUserLocation(null); 
                        }}
                      >
                        <span className="opacity-50">📍</span> {s.display_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                 <div className="flex justify-between text-xs font-bold uppercase text-gray-500 mb-3">
                   <span>Rayon d'action</span>
                   <span className="text-[#06B6D4]">{radius} m</span>
                 </div>
                 <input 
                   type="range" min={500} max={5000} step={500} 
                   value={radius} onChange={(e) => setRadius(parseInt(e.target.value))} 
                   className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#06B6D4] hover:accent-[#7C3AED] transition-all" 
                 />
              </div>
            </div>

            {/* 2. Filtres */}
            <div className="space-y-5 animate-fade-in" style={{animationDelay: '0.2s'}}>
                <h2 className="text-sm uppercase tracking-widest text-[#7C3AED] font-bold">2. Vos Envies</h2>
                <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map((cat) => (
                    <button
                    key={cat.id}
                    onClick={() => toggleCat(cat.id)}
                    className={`
                        p-4 rounded-2xl border text-left transition-all duration-300 group
                        ${selectedCats.includes(cat.id) 
                        ? 'bg-[#7C3AED]/10 border-[#7C3AED] shadow-[0_0_15px_rgba(124,58,237,0.15)] transform scale-[1.02]' 
                        : 'bg-gray-500/5 border-transparent hover:bg-gray-500/10 hover:border-gray-500/20'}
                    `}
                    >
                    <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300 origin-left">{cat.icon}</div>
                    <div className={`text-sm font-bold ${selectedCats.includes(cat.id) ? 'text-[#7C3AED]' : 'opacity-70 group-hover:opacity-100'}`}>{cat.label}</div>
                    <div className="text-[10px] opacity-50 truncate font-medium">{cat.desc}</div>
                    </button>
                ))}
                </div>
            </div>

            {/* 3. Résultats */}
            <div className="space-y-5 pb-20 animate-fade-in" style={{animationDelay: '0.3s'}}>
              <div className="flex justify-between items-end border-b border-gray-500/10 pb-2">
                <h2 className="text-sm uppercase tracking-widest font-bold opacity-80">3. Pépites trouvées</h2>
                <span className="text-xs font-bold bg-[#06B6D4]/10 text-[#06B6D4] px-2 py-1 rounded-lg">{places.length}</span>
              </div>

              <div className="space-y-3">
                {loading ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-pulse opacity-70">
                    <div className="text-4xl animate-bounce">📡</div>
                    <p className="text-sm font-bold">{loadingMsg}</p>
                  </div>
                ) : places.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 border-2 border-dashed border-gray-500/20 rounded-2xl opacity-60">
                    <div className="text-5xl opacity-80 mb-2">🔭</div>
                    <p className="text-base font-bold">Prêt à explorer ?</p>
                    <p className="text-xs max-w-[200px] leading-relaxed">
                        {selectedCats.length > 0 
                        ? "Zone calme... Essayez un autre filtre ou bougez la carte !" 
                        : "Sélectionnez une catégorie ci-dessus pour lancer le scan."}
                    </p>
                  </div>
                ) : (
                  places.map((p, i) => (
                    <div 
                      key={p.id} 
                      className="group bg-gray-500/5 hover:bg-[#06B6D4]/5 border border-gray-500/10 hover:border-[#06B6D4]/30 rounded-2xl p-5 transition-all duration-300 cursor-pointer animate-fade-in hover:shadow-lg"
                      style={{animationDelay: `${i * 0.05}s`}}
                    >
                      <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 min-w-0">
                              {/* Remplacement du nom si vide */}
                              <h3 className="font-bold text-base group-hover:text-[#06B6D4] truncate transition-colors">
                                {p.name || `${p.tags?.amenity || p.tags?.leisure || 'Lieu'} à découvrir`}
                              </h3>
                              <p className="text-[10px] text-[#7C3AED] font-bold uppercase mt-1 tracking-wider">{p.tags?.amenity || 'Divers'}</p>
                              
                              {(p.tags?.['addr:street'] || p.tags?.['addr:city']) && (
                                <div className="flex items-center gap-1.5 mt-3 text-xs opacity-60 group-hover:opacity-100 transition-opacity">
                                  <span>📍</span>
                                  <span className="truncate">{p.tags['addr:housenumber']} {p.tags['addr:street']} {p.tags['addr:city']}</span>
                                </div>
                              )}
                          </div>
                          <a 
                            href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}`} 
                            target="_blank"
                            className="flex-none p-3 bg-gray-500/10 rounded-xl text-gray-400 hover:bg-[#06B6D4] hover:text-white hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all"
                            title="Y aller"
                            onClick={(e) => e.stopPropagation()}
                          >
                            🚗
                          </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* === MAP === */}
        <div className="relative h-full w-full bg-gray-900 shadow-inner">
          <div className="absolute inset-0 z-0">
            <MapView
              className="w-full h-full"
              center={center}
              userLocation={userLocation}
              markers={places.map(p => ({ 
                  lat: p.lat, 
                  lon: p.lon, 
                  // Utilise aussi le nom de remplacement ici pour le marqueur
                  title: p.name || `${p.tags?.amenity || p.tags?.leisure || 'Lieu'} à découvrir`,
                  desc: p.tags?.amenity,
                  googleMapsLink: `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}` 
              }))}
              zoom={13}
            />
          </div>
          
          {/* Overlay Stats Flottant */}
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-full px-10 py-4 flex gap-10 shadow-2xl z-10 hover:scale-105 transition-transform duration-300 ring-1 ring-white/5">
             <div className="text-center">
               <span className="block text-2xl font-black text-[#7C3AED] leading-none">{places.length}</span>
               <span className="text-[10px] uppercase opacity-60 font-bold tracking-widest mt-1 block">Lieux</span>
             </div>
             <div className="w-px bg-white/10"></div>
             <div className="text-center">
               <span className="block text-2xl font-black text-[#06B6D4] leading-none">{selectedCats.length}</span>
               <span className="text-[10px] uppercase opacity-60 font-bold tracking-widest mt-1 block">Filtres</span>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
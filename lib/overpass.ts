export type Place = {
  id: number;
  name: string;
  lat: number;
  lon: number;
  tags: Record<string, string>;
};

export type Filters = {
  cityCenter: { lat: number; lon: number };
  radiusMeters: number;
  categories: string[];
};

const CATEGORY_TO_FILTERS: Record<string, string[]> = {
  musique: [
    'amenity=music_school',
    'amenity=theatre',
    'amenity=arts_centre',
    'shop=musical_instrument'
  ],
  lecture: [
    'amenity=library',
    'shop=books'
  ],
  sport: [
    'leisure=fitness_centre',
    'sport=*',
    'amenity=dojo',
    'leisure=sports_centre'
  ],
  art: [
    'tourism=museum',
    'amenity=arts_centre',
    'amenity=theatre',
    'amenity=community_centre'
  ],
  nature: [
    'leisure=park',
    'natural=wood',
    'leisure=garden'
  ]
};

function buildOverpassQuery(filters: Filters) {
  const { cityCenter, radiusMeters, categories } = filters;
  const tagClauses: string[] = [];

  categories.forEach((cat) => {
    const pairs = CATEGORY_TO_FILTERS[cat] || [];
    for (const pair of pairs) {
      const [k, v] = pair.split("=");
      tagClauses.push(`node["${k}"="${v}"](around:${radiusMeters},${cityCenter.lat},${cityCenter.lon});`);
      tagClauses.push(`way["${k}"="${v}"](around:${radiusMeters},${cityCenter.lat},${cityCenter.lon});`);
      tagClauses.push(`relation["${k}"="${v}"](around:${radiusMeters},${cityCenter.lat},${cityCenter.lon});`);
    }
  });

  if (tagClauses.length === 0) {
    tagClauses.push(`node["amenity"](around:${radiusMeters},${cityCenter.lat},${cityCenter.lon});`);
  }

  return `
  [out:json][timeout:25];
  (
    ${tagClauses.join("\n    ")}
  );
  out center 60;
  `;
}

const OVERPASS_ENDPOINTS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
  'https://overpass-api.nextzen.org/api/interpreter',
  'https://overpass-api.de/api/interpreter'
];

async function callOverpass(query: string) {
  const headers: HeadersInit = {
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'User-Agent': 'CityExplorer (contact: example@example.com)'
  };

  let lastError: any = null;
  for (const url of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: new URLSearchParams({ data: query })
      });
      if (!res.ok) {
        lastError = new Error(`Overpass ${res.status}`);
        continue;
      }
      return await res.json();
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError ?? new Error('Overpass: no endpoint available');
}

export async function searchPlaces(filters: Filters): Promise<Place[]> {
  const query = buildOverpassQuery(filters);
  const data = await callOverpass(query);

  const elements = data.elements || [];
  const places: Place[] = elements.map((el: any) => ({
    id: el.id,
    name: el.tags?.name || "(sans nom)",
    lat: el.type === "node" ? el.lat : el.center?.lat,
    lon: el.type === "node" ? el.lon : el.center?.lon,
    tags: el.tags || {}
  })).filter((p: Place) => p.lat && p.lon);
  return places;
}

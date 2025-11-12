export const TAGS_MAP: Record<string, [string,string][]> = {
  lecture: [['amenity','library'], ['shop','books'], ['amenity','public_bookcase']],
  musique: [['amenity','music_school'], ['amenity','theatre'], ['amenity','arts_centre'], ['shop','musical_instrument']],
  sport: [['leisure','sports_centre'], ['leisure','fitness_centre'], ['sport','*']],
  sante: [['amenity','hospital'], ['amenity','clinic'], ['amenity','pharmacy']],
  etudes: [['amenity','school'], ['amenity','college'], ['amenity','university']],
  loisirs: [['amenity','community_centre'], ['leisure','park'], ['amenity','arts_centre']],
  nature: [['leisure','park'],['leisure','garden'], ['natural','woods']],
};

export function buildOverpassAround(lat:number, lon:number, radiusKm:number, topics:string[]) {
  const radiusM = Math.floor((radiusKm || 2) * 1000);
  const selected = topics?.length ? topics : ['lecture'];
  const blocks:string[] = [];
  selected.forEach(key => {
    (TAGS_MAP[key] || []).forEach(([k,v]) => {
      const filt = v==='*' ? `[${k}]` : `[${k}="${v}"]`;
      blocks.push(`node(around:${radiusM},${lat},${lon})${filt};`);
      blocks.push(`way(around:${radiusM},${lat},${lon})${filt};`);
      blocks.push(`relation(around:${radiusM},${lat},${lon})${filt};`);
    });
  });
  const body = blocks.join('\n  ');
  return `[out:json][timeout:25];
(
  ${body}
);
out center;`;
}

export function haversineKm([lat1, lon1]:[number,number], [lat2, lon2]:[number,number]) {
  const R = 6371, toRad = (d:number)=>d*Math.PI/180;
  const dLat=toRad(lat2-lat1), dLon=toRad(lon2-lon1);
  const a=Math.sin(dLat/2)**2+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return R*(2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a)));
}

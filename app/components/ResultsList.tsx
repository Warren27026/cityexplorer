'use client';
export default function ResultsList({ features = [], center = [48.006, 0.199], distFn }:{features:any[];center:[number,number];distFn?:(c:[number,number],p:[number,number])=>number;}){
  const withDist = (features as any[]).map(f => {
    const [lon, lat] = f.geometry.coordinates as [number, number];
    const name = f.properties?.name || f.properties?.['addr:housename'] || 'Lieu sans nom';
    const dist = distFn ? distFn(center, [lat, lon]) : null;
    return { name, dist, props: f.properties };
  }).sort((a,b) => (a.dist ?? 0) - (b.dist ?? 0));

  return (
    <div style={{ height:'100vh', overflowY:'auto', padding:10, borderRight:'1px solid #eee', width:360 }}>
      <h3>Résultats ({features.length})</h3>
      {withDist.map((it, i) => (
        <div key={i} style={{ background:'#f8fafc', border:'1px solid #e5e7eb', borderRadius:10, padding:10, margin:'8px 0' }}>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <b>{it.name}</b>
            <br />
            <div {it.amenity}{it.shop}{it.sport}/>
          
            <span style={{ color:'#6b7280' }}>{it.dist ? it.dist.toFixed(2)+' km' : ''}</span>
          </div>
          <div style={{ color:'#6b7280', fontSize:12 }}>{it.props?.['addr:street'] || ''} {it.props?.['addr:housenumber'] || ''}</div>
          {it.props?.website && <a href={it.props.website} target="_blank" rel="noreferrer">Site web</a>}
        </div>
      ))}
    </div>
  );
}

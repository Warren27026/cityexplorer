'use client';
import { useState } from 'react';

const TOPICS = [
  { key: 'lecture', label: 'Lecture' },
  { key: 'musique', label: 'Musique' },
  { key: 'sport',   label: 'Sport' },
  { key: 'sante',   label: 'Santé' },
  { key: 'etudes',  label: 'Études' },
  { key: 'loisirs', label: 'Loisirs' },
];

export default function SearchBar({ onSearch }:{ onSearch:(args:{city:string;radius:number;topics:string[];kw:string})=>void }) {
  const [city, setCity] = useState('Le Mans');
  const [radius, setRadius] = useState(2);
  const [selected, setSelected] = useState<string[]>(['lecture']);
  const [kw, setKw] = useState('');

  function toggleTopic(k:string){
    setSelected(prev => prev.includes(k) ? prev.filter(x=>x!==k) : [...prev, k]);
  }
  function handleSubmit(e:React.FormEvent){
    e.preventDefault();
    onSearch({ city, radius, topics: selected, kw });
  }

  return (
    <form onSubmit={handleSubmit} style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap', padding:10, borderBottom:'1px solid #eee' }}>
      <input value={kw} onChange={e=>setKw(e.target.value)} placeholder="Mots-clés (facultatif)" style={{ padding:8, border:'1px solid #ddd', borderRadius:8 }}/>
      <select value={city} onChange={e=>setCity(e.target.value)} style={{ padding:8, border:'1px solid #ddd', borderRadius:8 }}>
        <option>Le Mans</option><option>Paris</option><option>Rennes</option><option>Lyon</option>
      </select>
      <label>Rayon: {radius} km</label>
      <input type="range" min={1} max={10} value={radius} onChange={e=>setRadius(Number(e.target.value))}/>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {TOPICS.map(t => (
          <button type="button" key={t.key}
            onClick={()=>toggleTopic(t.key)}
            style={{ padding:'6px 10px', borderRadius:999, border:'1px solid #ddd', background: selected.includes(t.key) ? '#d1fae5' : '#f1f5f9' }}>
            {t.label}
          </button>
        ))}
      </div>
      <button type="submit" style={{ padding:'8px 14px', borderRadius:10, border:'1px solid #10b981', background:'#10b981', color:'#fff' }}>Chercher</button>
    </form>
  );
}

import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {parseResearchCatalog} from './researchCatalog';
import {parseResearchPackManifest,mergeResearchPacks} from './researchPacks';
const read=(path:string)=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8')) as unknown;
const base=parseResearchCatalog(read('../public/research/partidas-work-951-v1.json'),
 readFileSync(new URL('../public/research/partidas-work-extras-68-v1.txt',import.meta.url),'utf8'));
const manifest=parseResearchPackManifest(read('../public/research/packs/manifest-v1.json'));
const raw=manifest.map(x=>read('../public/research/packs/'+x.file));
const all=mergeResearchPacks(base,manifest,raw);
describe('Pesquisa experimental de 31/10 — MLS 2025 e jogos LV4',()=>{
 it('integra 509 MLS + 17 resultados verificados e preserva os 3.260 anteriores',()=>{
  expect(base.total).toBe(1019);
  expect(all.total).toBe(3786);
  expect(all.data.matches.filter(m=>m.competition==='MLS 2025')).toHaveLength(509);
  expect(all.data.matches.find(m=>m.research?.sourceId==='23cRvyme')).toBeUndefined();
  expect(manifest.filter(x=>x.file.endsWith('_lv4_20261031.json')).reduce((s,x)=>s+x.count,0)).toBe(17);
  expect(all.data.matches.filter(m=>m.date==='2026-10-31')).toHaveLength(17);
 });
 it('conserva todos os IDs únicos e valida os períodos',()=>{
  const ids=all.data.matches.map(x=>x.research?.sourceId).filter(Boolean);
  expect(ids.length).toBe(3786);
  expect(new Set(ids).size).toBe(ids.length);
  const added=all.data.matches.filter(m=>m.competition==='MLS 2025'||m.date==='2026-10-31');
  for(const m of added){
   for(const [s,full] of [0,1].map(i=>[i,m.research!.full[i]] as const)){
    for(const metric of ['goals','shots','target','corners'] as const){
     expect(m.first[s][metric]!+m.second[s][metric]!).toBe(full[metric]);
    }
   }
  }
 });
});

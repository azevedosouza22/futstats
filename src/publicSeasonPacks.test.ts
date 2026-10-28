import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {parseResearchCatalog} from './researchCatalog';
import {mergeResearchPacks,parseResearchPackManifest} from './researchPacks';
import {createPrivateSeasonPack,unpublishedPrivatePacks} from './privateSeasonPacks';
import type {Data,Match} from './model';

const source=(relative:string)=>JSON.parse(readFileSync(new URL(relative,import.meta.url),'utf8'));
const main=source('../public/research/partidas-work-951-v1.json');
const recent=readFileSync(new URL('../public/research/partidas-work-extras-68-v1.txt',import.meta.url),'utf8');
const baseline=parseResearchCatalog(main,recent);
const manifest=source('../public/research/packs/manifest-v1.json');
const entries=parseResearchPackManifest(manifest);
const packs=[
 source('../public/research/packs/premier_league_2025_26.json'),
 source('../public/research/packs/la_liga_2025_26.json')
];
const loaded=mergeResearchPacks(baseline,entries,packs);
const bySource=(m:Match)=>m.research!.sourceId;
describe('Publicação dos 760 jogos históricos nas duas edições 2025/26',()=>{
 it('carrega automaticamente os pacotes autorizados, sem alterar os 1.019 anteriores',()=>{
  const original=JSON.stringify(baseline.data);
  expect(entries).toHaveLength(2);
  expect(entries.map(x=>x.count)).toEqual([380,380]);
  expect(loaded.total).toBe(1779);
  expect(loaded.dateConflicts).toBe(48);
  expect(loaded.data.matches).toHaveLength(1779);
  expect(loaded.data.radarSnapshots).toBeUndefined();
  expect(JSON.stringify(baseline.data)).toBe(original);
 });
 it('sem IDs repetidos, preservando liga, três períodos e proveniência Flashscore',()=>{
  expect(new Set(loaded.data.matches.map(bySource)).size).toBe(1779);
  expect(new Set(loaded.data.matches.map(m=>m.id)).size).toBe(1779);
  for(const pack of packs){
   expect(pack.data.matches).toHaveLength(380);
   expect(pack.data.teams).toHaveLength(20);
   expect(new Set(pack.data.matches.map((m:Match)=>m.research!.sourceId)).size).toBe(380);
   for(const m of pack.data.matches as Match[]){
    expect(m.competition).toBe(pack.competition);
    expect(m.research!.dateDiscrepancy).toBe(false);
    expect(m.research!.sourceUrl).toContain('?mid='+m.research!.sourceId);
    for(const k of ['goals','shots','target','corners'] as const)
     for(const i of [0,1])
      expect(m.first[i][k]!+m.second[i][k]!).toBe(m.research!.full[i][k]);
   }
  }
  expect(loaded.leagues.find(x=>x.competition==='Premier League inglesa 2025/26')?.count).toBe(380);
  expect(loaded.leagues.find(x=>x.competition==='La Liga espanhola 2025/26')?.count).toBe(380);
 });
 it('reconcilia variações Athletic Bilbao e Celta entre as temporadas',()=>{
  const liga=loaded.data.matches.filter(m=>m.competition.startsWith('La Liga espanhola '));
  const ids=new Set(liga.flatMap(m=>[m.home,m.away]));
  const names=loaded.data.teams.filter(t=>ids.has(t.id)).map(t=>t.name.toLowerCase());
  expect(names.filter(n=>n.includes('bilbao'))).toHaveLength(1);
  expect(names.filter(n=>n.includes('celta'))).toHaveLength(1);
 });
 it('não duplica partidas se um usuário já importou os mesmos 380 na prévia antiga',()=>{
  const oldPack=packs[0] as ReturnType<typeof createPrivateSeasonPack>;
  expect(unpublishedPrivatePacks(loaded,[oldPack])).toHaveLength(0);
  const conflicting=structuredClone(oldPack);
  conflicting.data.matches[0].research!.sourceUrl+='&revision=alterada';
  expect(()=>unpublishedPrivatePacks(loaded,[conflicting])).toThrow(/Conflito/);
 });
});

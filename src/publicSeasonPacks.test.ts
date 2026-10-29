import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {parseResearchCatalog} from './researchCatalog';
import {mergeResearchPacks,parseResearchPackManifest} from './researchPacks';
import {createPrivateSeasonPack,unpublishedPrivatePacks} from './privateSeasonPacks';
import {applyBrazilResearchDateReview} from './brazilResearchReview';
import type {Data,Match} from './model';

const source=(relative:string)=>JSON.parse(readFileSync(new URL(relative,import.meta.url),'utf8'));
const main=source('../public/research/partidas-work-951-v1.json');
const recent=readFileSync(new URL('../public/research/partidas-work-extras-68-v1.txt',import.meta.url),'utf8');
const baseline=parseResearchCatalog(main,recent);
const manifest=source('../public/research/packs/manifest-v1.json');
const entries=parseResearchPackManifest(manifest);
const packs=[
 source('../public/research/packs/premier_league_2025_26.json'),
 source('../public/research/packs/la_liga_2025_26.json'),
 source('../public/research/packs/serie_a_italiana_2025_26.json'),
 source('../public/research/packs/ligue_1_francesa_2025_26.json'),
 source('../public/research/packs/liga_portugal_2025_26.json'),
 source('../public/research/packs/brasileirao_2026_incremental_20261029.json'),
 source('../public/research/packs/liga_portugal_2026_27.json'),
 source('../public/research/packs/saudi_pro_league_2026_27.json')
];
const loaded=applyBrazilResearchDateReview(mergeResearchPacks(baseline,entries,packs),source('../public/research/brasileirao-2026-review-20261029.json'));
const bySource=(m:Match)=>m.research!.sourceId;
describe('Pesquisa pública: Saudi Pro League 2026/27 e 2.856 jogos anteriores preservados',()=>{
 it('carrega automaticamente os pacotes autorizados, sem alterar os 1.019 anteriores',()=>{
  const original=JSON.stringify(baseline.data);
  expect(entries).toHaveLength(8);
  expect(entries.map(x=>x.count)).toEqual([380,380,380,305,306,5,81,98]);
  expect(loaded.total).toBe(2954);
  expect(loaded.dateConflicts).toBe(0);
  expect(loaded.data.matches).toHaveLength(2954);
  expect(loaded.data.radarSnapshots).toBeUndefined();
  expect(JSON.stringify(baseline.data)).toBe(original);
 });
 it('sem IDs repetidos, preservando liga, três períodos e proveniência Flashscore',()=>{
  expect(new Set(loaded.data.matches.map(bySource)).size).toBe(2954);
  expect(loaded.data.matches.some(m=>m.research?.sourceId==='z9FNO7c2')).toBe(false);
  expect(new Set(loaded.data.matches.map(m=>m.id)).size).toBe(2954);
  for(const [index,pack] of packs.entries()){
   expect(pack.data.matches).toHaveLength(entries[index].count);
   expect(pack.data.teams).toHaveLength(index===5?10:index>=3?18:20);
   expect(new Set(pack.data.matches.map((m:Match)=>m.research!.sourceId)).size).toBe(entries[index].count);
   for(const m of pack.data.matches as Match[]){
    expect(m.competition).toBe(pack.competition);
    expect(m.research!.dateDiscrepancy).toBe(m.research!.titleDate!==undefined&&m.research!.titleDate!==m.date);
    expect(m.research!.sourceUrl).toContain('?mid='+m.research!.sourceId);
    for(const k of ['goals','shots','target','corners'] as const)
     for(const i of [0,1])
      expect(m.first[i][k]!+m.second[i][k]!).toBe(m.research!.full[i][k]);
   }
  }
  expect(loaded.leagues.find(x=>x.competition==='Premier League inglesa 2025/26')?.count).toBe(380);
  expect(loaded.leagues.find(x=>x.competition==='La Liga espanhola 2025/26')?.count).toBe(380);
  expect(loaded.leagues.find(x=>x.competition==='Serie A italiana 2025/26')?.count).toBe(380);
  expect(loaded.leagues.find(x=>x.competition==='Ligue 1 francesa 2025/26')?.count).toBe(305);
  expect(loaded.leagues.find(x=>x.competition==='Liga Portugal 2025/26')?.count).toBe(306);
  expect(loaded.leagues.find(x=>x.competition==='Liga Portugal 2026/27')?.count).toBe(81);
  expect(loaded.leagues.find(x=>x.competition==='Saudi Pro League 2026/27')?.count).toBe(98);
 });
 it('Serie A 2025/26 cobre 20 equipes e 38 jogos por equipe, sem dados ausentes',()=>{
   const pack=packs.find(p=>p.competition==='Serie A italiana 2025/26')!;
   const games=pack.data.matches as Match[];
   const appearances=new Map<string,number>();
   for(const m of games){
    for(const id of [m.home,m.away])appearances.set(id,(appearances.get(id)??0)+1);
    expect(m.date>='2025-08-01'&&m.date<'2026-07-01').toBe(true);
    for(const period of [m.first,m.second,m.research!.full])
     for(const side of period)
      for(const k of ['goals','shots','target','corners'] as const)
       expect(Number.isSafeInteger(side[k])&&side[k]!>=0).toBe(true);
   }
   expect(appearances.size).toBe(20);
   expect([...appearances.values()].every(n=>n===38)).toBe(true);
 });
 it('Ligue 1 2025/26 preserva a partida Awarded incompleta fora do pacote e inclui 305 completas',()=>{
  const pack=packs.find(p=>p.competition==='Ligue 1 francesa 2025/26')!;
  const games=pack.data.matches as Match[];
  const appearances=new Map<string,number>();
  const names=new Map(pack.data.teams.map((t:{id:string;name:string})=>[t.id,t.name]));
  for(const m of games){
    for(const id of [m.home,m.away])appearances.set(id,(appearances.get(id)??0)+1);
    expect(m.date>='2025-08-01'&&m.date<'2026-07-01').toBe(true);
    for(const period of [m.first,m.second,m.research!.full])
      for(const side of period)
        for(const k of ['goals','shots','target','corners'] as const)
          expect(Number.isSafeInteger(side[k])&&side[k]!>=0).toBe(true);
  }
  expect(appearances.size).toBe(18);
  const absent=[...appearances].filter(([,n])=>n===33)
    .map(([id])=>names.get(id)).sort();
  expect(absent).toEqual(['Nantes','Toulouse']);
  expect([...appearances.values()].every(n=>n===33||n===34)).toBe(true);
  expect(games.some(m=>m.research?.sourceId==='z9FNO7c2')).toBe(false);
 });
 it('Liga Portugal 2025/26 cobre 18 equipes com 17 jogos por mando e períodos íntegros',()=>{
  const pack=packs.find(p=>p.competition==='Liga Portugal 2025/26')!;
  const games=pack.data.matches as Match[];
  const home=new Map<string,number>(),away=new Map<string,number>();
  for(const m of games){
    home.set(m.home,(home.get(m.home)??0)+1);
    away.set(m.away,(away.get(m.away)??0)+1);
    expect(m.date>='2025-08-01'&&m.date<'2026-07-01').toBe(true);
    for(const period of [m.first,m.second,m.research!.full])
      for(const side of period){
        for(const k of ['goals','shots','target','corners'] as const)
          expect(Number.isSafeInteger(side[k])&&side[k]!>=0).toBe(true);
        expect(side.target!).toBeLessThanOrEqual(side.shots!);
      }
  }
  expect(home.size).toBe(18);
  expect(away.size).toBe(18);
  expect([...home.values()].every(n=>n===17)).toBe(true);
  expect([...away.values()].every(n=>n===17)).toBe(true);
 });
 it('Liga Portugal 2026/27: 81 partidas em 9 rodadas, sem datas futuras nem partidas duplicadas',()=>{
  const pack=packs.find(p=>p.competition==='Liga Portugal 2026/27')!;
  const games=pack.data.matches as (Match&{round?:string})[];
  const appearances=new Map<string,number>();
  const rounds=new Map<string,number>();
  const home=new Map<string,number>(),away=new Map<string,number>();
  for(const m of games){
    rounds.set(String(m.round),(rounds.get(String(m.round))??0)+1);
    appearances.set(m.home,(appearances.get(m.home)??0)+1);
    appearances.set(m.away,(appearances.get(m.away)??0)+1);
    home.set(m.home,(home.get(m.home)??0)+1);
    away.set(m.away,(away.get(m.away)??0)+1);
    expect(m.date>='2026-08-07'&&m.date<='2026-10-29').toBe(true);
    expect(m.research!.dateDiscrepancy).toBe(false);
    for(const period of [m.first,m.second,m.research!.full])
     for(const side of period){
      for(const k of ['goals','shots','target','corners'] as const)
       expect(Number.isSafeInteger(side[k])&&side[k]!>=0).toBe(true);
      expect(side.target!).toBeLessThanOrEqual(side.shots!);
     }
  }
  expect(appearances.size).toBe(18);
  expect([...appearances.values()].every(n=>n===9)).toBe(true);
  expect([...rounds].sort(([a],[b])=>Number(a)-Number(b)))
   .toEqual(Array.from({length:9},(_,i)=>[String(i+1),9]));
  expect([...home.values()].every(n=>n>=4&&n<=5)).toBe(true);
  expect([...away.values()].every(n=>n>=4&&n<=5)).toBe(true);
  expect(loaded.data.matches.filter(m=>m.competition==='Liga Portugal 2025/26')).toHaveLength(306);
  expect(loaded.data.matches.filter(m=>m.competition==='Liga Portugal 2026/27')).toHaveLength(81);
  expect(loaded.data.radarSnapshots).toBeUndefined();
 });
 it('Saudi Pro League 2026/27: 98 jogos encerrados, 18 equipes e períodos consistentes',()=>{
  const pack=packs.find(p=>p.competition==='Saudi Pro League 2026/27')!;
  const matches=pack.data.matches as (Match&{round?:string})[];
  const expected=[9,9,9,9,9,9,9,9,6,8,9,3];
  const rounds=new Map<number,number>();
  const teams=new Map<string,{home:number,away:number}>();
  for(const m of matches){
    const r=Number(m.round);
    rounds.set(r,(rounds.get(r)??0)+1);
    for(const [id,side] of [[m.home,'home'],[m.away,'away']] as const){
      const t=teams.get(id)??{home:0,away:0};t[side]++;teams.set(id,t);
    }
    expect(m.date>='2026-08-13'&&m.date<='2026-10-29').toBe(true);
    expect(m.research!.dateDiscrepancy).toBe(false);
    for(const period of [m.first,m.second,m.research!.full]){
      for(const team of period){
        for(const k of ['goals','shots','target','corners'] as const)
          expect(Number.isSafeInteger(team[k])&&team[k]!>=0).toBe(true);
        expect(team.target!).toBeLessThanOrEqual(team.shots!);
      }
    }
  }
  expect([...rounds].sort((a,b)=>a[0]-b[0])).toEqual(expected.map((n,i)=>[i+1,n]));
  expect(teams.size).toBe(18);
  expect([...teams.values()].reduce((sum,x)=>sum+x.home+x.away,0)).toBe(196);
  expect(loaded.data.matches.filter(m=>m.competition==='Saudi Pro League 2026/27')).toHaveLength(98);
  expect(loaded.data.matches.filter(m=>m.competition==='Liga Portugal 2026/27')).toHaveLength(81);
  expect(loaded.data.matches.filter(m=>m.competition==='Liga Portugal 2025/26')).toHaveLength(306);
  expect(loaded.data.radarSnapshots).toBeUndefined();
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


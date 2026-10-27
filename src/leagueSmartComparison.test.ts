import {describe,it,expect} from 'vitest';
import type {Data} from './model';
import {demoFourContextData} from './radarFourLensesDemo';
import {
 availableSmartLeagues,smartLeagueOptions,calculateSmartLeagueComparison,BOTH_SEASONS
} from './leagueSmartComparison';

const season='Bundesliga';
const options=smartLeagueOptions(demoFourContextData,season);
const home=options.teams.find(t=>t.name.includes('Hoffenheim'))!;
const away=options.teams.find(t=>t.name.includes('Schalke'))!;
const selected=(seasonChoice:string,date='2026-10-27')=>({
 league:season,season:seasonChoice,home:home.id,away:away.id,date,
 metric:'shots' as const,period:'full' as const,line:28.5,
});
const get=(result:ReturnType<typeof calculateSmartLeagueComparison>,key:string)=>
 result.report!.lenses.find(l=>l.id===key)!;

describe('Etapa 80 — Comparação Inteligente por liga, temporada e mando',()=>{
 it('monta seleção só das ligas reais e identifica as duas temporadas existentes',()=>{
  expect(availableSmartLeagues(demoFourContextData)).toEqual([season]);
  expect(options.seasons).toEqual(['2026/27','2025/26']);
  expect(options.competition).toBe('Bundesliga 2026/27');
  expect(options.teams.filter(t=>t.name.includes('Hoffenheim'))).toHaveLength(1);
  expect(options.teams.filter(t=>t.name.includes('Schalke'))).toHaveLength(1);
 });
 it('isola os jogos atuais, anteriores e ambas as temporadas sem adulterar a base',()=>{
  const before=JSON.stringify(demoFourContextData);
  const now=calculateSmartLeagueComparison(demoFourContextData,selected('2026/27'));
  const beforeSeason=calculateSmartLeagueComparison(demoFourContextData,selected('2025/26'));
  const both=calculateSmartLeagueComparison(demoFourContextData,selected(BOTH_SEASONS));
  expect(get(now,'home-direct').last10.count).toBe(1);
  expect(get(beforeSeason,'home-direct').last10.count).toBe(2);
  expect(get(both,'home-direct').last10.count).toBe(3);
  expect(get(now,'away-direct').matchIds).toEqual(get(now,'home-direct').matchIds);
  expect(get(beforeSeason,'away-direct').matchIds).toEqual(get(beforeSeason,'home-direct').matchIds);
  expect(get(both,'home-any').last10.count).toBe(10);
  expect(get(now,'home-any').last10.count).toBe(7);
  expect(get(beforeSeason,'home-any').last10.count).toBe(9);
  expect(JSON.stringify(demoFourContextData)).toBe(before);
 });
 it('retorna contagem e frequências Over/Under sem fabricar probabilidade',()=>{
  const r=calculateSmartLeagueComparison(demoFourContextData,selected('2026/27'));
  const homeAll=get(r,'home-any');
  expect(homeAll.last5.over+homeAll.last5.under).toBe(homeAll.last5.count);
  expect(homeAll.last10.over+homeAll.last10.under).toBe(homeAll.last10.count);
  expect(homeAll.last5.count).toBe(5);
  expect(homeAll.last5.mean).not.toBeNull();
  expect(r.report?.overlappingSamples).toBe(true);
  expect(Object.keys(r.report!)).not.toContain('winProbability');
 });
 it('bloqueia jogos a partir da data de referência, inclusive confronto direto',()=>{
  const r=calculateSmartLeagueComparison(demoFourContextData,
    selected('2026/27','2026-10-21'));
  expect(get(r,'home-direct').last10.count).toBe(0);
  expect(get(r,'away-direct').last10.count).toBe(0);
 });
 it('valida time duplicado, temporada e linhas desconhecidas',()=>{
  expect(calculateSmartLeagueComparison(demoFourContextData,
   {...selected(BOTH_SEASONS),away:home.id}).report).toBeNull();
  expect(calculateSmartLeagueComparison(demoFourContextData,
   selected('2023/24')).report).toBeNull();
  expect(calculateSmartLeagueComparison(demoFourContextData,
   {...selected(BOTH_SEASONS),line:99.5}).report).toBeNull();
 });
 it('não mistura outra liga nem inclui temporadas antigas além das duas mais recentes',()=>{
  const extra=demoFourContextData.matches[0];
  const d:Data={...demoFourContextData,
   matches:[...demoFourContextData.matches,
    {...extra,id:'u-old',competition:'Bundesliga 2024/25'},
    {...extra,id:'u-other',competition:'La Liga 2026/27'}]};
  const result=calculateSmartLeagueComparison(d,selected(BOTH_SEASONS));
  expect(smartLeagueOptions(d,season).seasons).toEqual(['2026/27','2025/26']);
  expect(result.matchCount).toBe(demoFourContextData.matches.length);
 });
 it('mostra N/D quando não existem registros válidos no confronto, sem inventar',()=>{
  const d:Data={teams:demoFourContextData.teams,
   matches:demoFourContextData.matches.filter(m=>m.home!==home.id||m.away!==away.id)};
  const r=calculateSmartLeagueComparison(d,selected(BOTH_SEASONS));
  expect(get(r,'home-direct').last10).toMatchObject({count:0,mean:null,overRate:null});
 });
});

import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {parseResearchCatalog,RESEARCH_COUNTS} from './researchCatalog';
import {smartLeagueOptions,calculateSmartLeagueComparison,BOTH_SEASONS} from './leagueSmartComparison';
import {radarMetricIntegrity} from './radarHistoricalIntegrity';
const main=JSON.parse(readFileSync(
 new URL('../public/research/partidas-work-951-v1.json',import.meta.url),'utf8'
)) as unknown;
const recent=readFileSync(
 new URL('../public/research/partidas-work-extras-68-v1.txt',import.meta.url),'utf8'
);
const research=parseResearchCatalog(main,recent);

describe('Etapa 81 — integração isolada de 1.019 jogos reais de pesquisa',()=>{
 it('valida exatamente 951 + 68 registros, sem duplicar identidade',()=>{
  expect(research.total).toBe(RESEARCH_COUNTS.total);
  expect(research.data.matches).toHaveLength(1019);
  expect(new Set(research.data.matches.map(m=>m.id)).size).toBe(1019);
  expect(new Set(research.data.matches.map(m=>m.research!.sourceId)).size).toBe(1019);
  expect(research.data.radarSnapshots).toBeUndefined();
  expect(research.dateConflicts).toBe(48);
 });
 it('distribui as sete edições de seis ligas, sem misturar temporadas',()=>{
  expect(Object.fromEntries(research.leagues.map(l=>[l.competition,l.count]))).toEqual({
   'Brasileirão Série A 2026':319,
   'Bundesliga 2025/26':306,
   'Bundesliga 2026/27':63,
   'La Liga espanhola 2026/27':99,
   'Premier League inglesa 2026/27':80,
   'Serie A italiana 2026/27':80,
   'Ligue 1 francesa 2026/27':72
  });
 });
 it('exclui conflitos de data na análise sem remover as partidas do catálogo',()=>{
  const conflicts=research.data.matches.filter(m=>m.research?.dateDiscrepancy);
  expect(conflicts).toHaveLength(48);
  for(const m of conflicts)expect(radarMetricIntegrity(m,'shots')).toBe('date_conflict');
 });
 it('permite Hoffenheim em casa × Leverkusen com H2H antes e depois da rodada 7',()=>{
  const opts=smartLeagueOptions(research.data,'Bundesliga');
  expect(opts.seasons).toEqual(['2026/27','2025/26']);
  const home=opts.teams.find(t=>t.name==='Hoffenheim')!;
  const away=opts.teams.find(t=>t.name==='Leverkusen')!;
  expect(home&&away).toBeTruthy();
  const params={
   league:'Bundesliga',season:BOTH_SEASONS,home:home.id,away:away.id,
   metric:'shots' as const,period:'full' as const,line:28.5
  };
  const pre=calculateSmartLeagueComparison(research.data,{
   ...params,date:'2026-10-25'
  });
  const post=calculateSmartLeagueComparison(research.data,{
   ...params,date:'2026-10-27'
  });
  const direct=(r:typeof pre)=>r.report!.lenses.find(x=>x.id==='home-direct')!;
  expect(direct(pre).last10.count).toBe(2);
  expect(direct(post).last10.count).toBe(3);
  const sameVenue=calculateSmartLeagueComparison(research.data,{
    ...params,date:'2026-10-25',directVenue:'current'
  });
  expect(direct(sameVenue).last10.count).toBe(1);
  expect(direct(post).matchIds).toEqual(
    post.report!.lenses.find(x=>x.id==='away-direct')!.matchIds
  );
 });
 it('falha fechada se arquivo recente ou consolidado vier adulterado',()=>{
  expect(()=>parseResearchCatalog(main,recent.split('\n').slice(1).join('\n')))
    .toThrow(/incompletas/);
  expect(()=>parseResearchCatalog(main,recent.replace('?mid=0MmjRHRa','?mid=OTHER')))
    .toThrow(/origem inválida/);
  const mutated={...(main as Record<string,unknown>),version:2};
  expect(()=>parseResearchCatalog(mutated,recent)).toThrow(/consolidado/);
 });
});

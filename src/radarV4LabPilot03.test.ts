/** Radar V4 Lab Pilot 03: 8 leagues × 30 most recent eligible matches × 12 markets.
 * Experiment is read-only, historical, period-aware, and never writes to user storage.
 * It is not an evaluation of V2/V3, live odds, payouts, nor a production signal.
 */
import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {parseResearchCatalog} from './researchCatalog';
import {mergeResearchPacks,parseResearchPackManifest} from './researchPacks';
import {applyBrazilResearchDateReview} from './brazilResearchReview';
import type {Match} from './model';

const source=(path:string)=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const baseline=parseResearchCatalog(
 source('../public/research/partidas-work-951-v1.json'),
 readFileSync(new URL('../public/research/partidas-work-extras-68-v1.txt',import.meta.url),'utf8')
);
const entries=parseResearchPackManifest(source('../public/research/packs/manifest-v1.json'));
const packs=entries.map(e=>source('../public/research/packs/'+e.file));
const research=applyBrazilResearchDateReview(
 mergeResearchPacks(baseline,entries,packs),
 source('../public/research/brasileirao-2026-review-20261029.json')
);
const competitions=[
 'Brasileirão Série A 2026','Bundesliga 2025/26','Premier League inglesa 2025/26',
 'La Liga espanhola 2025/26','Serie A italiana 2025/26','Ligue 1 francesa 2025/26',
 'Liga Portugal 2025/26','Saudi Pro League 2025/26'
] as const;
type Period='full'|'first'|'second';
type Metric='shots'|'corners'|'target'|'goals';
const periods:Period[]=['full','first','second'];
const metrics:Metric[]=['shots','corners','target','goals'];
// Defined before outcomes; distinct line sets for each period/market.
const lines:Record<Period,Record<Metric,readonly number[]>>={
 full:{
  shots:[20.5,22.5,24.5,26.5],corners:[6.5,7.5,8.5,9.5],
  target:[5.5,6.5,7.5,8.5],goals:[1.5,2.5,3.5]
 },
 first:{
  shots:[8.5,10.5,12.5],corners:[2.5,3.5,4.5,5.5],
  target:[2.5,3.5,4.5],goals:[0.5,1.5,2.5]
 },
 second:{
  shots:[9.5,11.5,13.5],corners:[2.5,3.5,4.5,5.5],
  target:[2.5,3.5,4.5],goals:[0.5,1.5,2.5]
 }
};
const value=(m:Match,period:Period,metric:Metric)=>{
 const pair=period==='full'?m.research!.full:m[period];
 const result=pair[0][metric]!+pair[1][metric]!;
 if(!Number.isSafeInteger(result)||result<0)throw Error('Invalid '+period+'/'+metric+'/'+m.id);
 return result;
};
type Signal={line:number|null;actual:number;hit:boolean|null};
type Sample={league:string;game:Match;history:Match[];
 signals:Record<Period,Record<Metric,Signal>>};
const score=(items:Signal[])=>({
 signals:items.filter(x=>x.line!==null).length,
 correct:items.filter(x=>x.hit===true).length,
 wrong:items.filter(x=>x.hit===false).length,
 abstained:items.filter(x=>x.line===null).length
});
function pilot(){
 const rows:Sample[]=[];
 for(const league of competitions){
  const games=research.data.matches.filter(m=>m.competition===league&&!!m.research)
   .sort((a,b)=>a.date.localeCompare(b.date)||a.research!.sourceId.localeCompare(b.research!.sourceId));
  let chosen=0;
  for(const game of [...games].reverse()){
   if(game.date>'2026-10-29')continue;
   // No results from same-date games; no future games, even from another season.
   const previous=games.filter(m=>m.date<game.date);
   const lastFive=(team:string)=>previous.filter(m=>m.home===team||m.away===team).slice(-5);
   const home=lastFive(game.home),away=lastFive(game.away);
   const history=[...new Map([...home,...away].map(m=>[m.research!.sourceId,m])).values()];
   if(home.length!==5||away.length!==5||history.length<8)continue;
   const signals={} as Sample['signals'];
   for(const period of periods){
    signals[period]={} as Record<Metric,Signal>;
    for(const metric of metrics){
     const historical=history.map(m=>value(m,period,metric));
     const allowed=lines[period][metric].filter(line=>
      historical.filter(n=>n>line).length/history.length>=0.70);
     const line=allowed.at(-1)??null;
     const actual=value(game,period,metric);
     signals[period][metric]={line,actual,hit:line===null?null:actual>line};
    }
   }
   rows.push({league,game,history,signals});
   if(++chosen===30)break;
  }
  expect(chosen).toBe(30);
 }
 return rows;
}
const expectedByLeague=[
 [350,257,93,10],[352,265,87,8],[339,248,91,21],
 [305,213,92,55],[271,189,82,89],[342,247,95,18],
 [286,199,87,74],[346,228,118,14]
];
const expectedByPeriod={
 full:{shots:[196,145,51,44],corners:[235,156,79,5],
  target:[229,162,67,11],goals:[208,144,64,32]},
 first:{shots:[204,156,48,36],corners:[228,163,65,12],
  target:[217,148,69,23],goals:[179,129,50,61]},
 second:{shots:[216,158,58,24],corners:[238,156,82,2],
  target:[232,166,66,8],goals:[209,163,46,31]}
};
describe('Radar V4 Lab Piloto 03: 240 jogos × 4 métricas × 3 períodos',()=>{
 it('seleciona 30 por liga, todos os históricos anteriores e sem sourceIds repetidos',()=>{
  expect(research.data.matches).toHaveLength(3260);
  const rows=pilot();
  expect(rows).toHaveLength(240);
  for(const [index,league] of competitions.entries()){
   const subset=rows.filter(r=>r.league===league);
   expect(subset).toHaveLength(30);
   const parts=subset.map(r=>r.game);
   const sorted=[...parts].sort((a,b)=>b.date.localeCompare(a.date)||b.research!.sourceId.localeCompare(a.research!.sourceId));
   expect(parts.map(m=>m.research!.sourceId)).toEqual(sorted.map(m=>m.research!.sourceId));
   expect(new Set(parts.map(m=>m.research!.sourceId)).size).toBe(30);
   const sigs=subset.flatMap(r=>periods.flatMap(p=>metrics.map(k=>r.signals[p][k])));
   const out=score(sigs);
   expect([out.signals,out.correct,out.wrong,out.abstained]).toEqual(expectedByLeague[index]);
  }
  for(const {game,history,signals} of rows){
   expect(history.length).toBeGreaterThanOrEqual(8);
   expect(history.length).toBeLessThanOrEqual(10);
   expect(new Set(history.map(m=>m.research!.sourceId)).size).toBe(history.length);
   expect(history.every(m=>m.date<game.date&&m.competition===game.competition)).toBe(true);
   expect(history.some(m=>m.research!.sourceId===game.research!.sourceId)).toBe(false);
   for(const p of periods)for(const k of metrics)expect(signals[p][k].actual).toBe(value(game,p,k));
  }
 });
 it('confere separadamente FT, 1T e 2T; sem ajustes depois dos desfechos',()=>{
  const rows=pilot();
  let all:Signal[]=[];
  for(const p of periods)for(const k of metrics){
   const s=rows.map(r=>r.signals[p][k]);all=all.concat(s);
   const z=score(s);
   expect([z.signals,z.correct,z.wrong,z.abstained]).toEqual(expectedByPeriod[p][k]);
  }
  const total=score(all);
  expect(total).toEqual({signals:2591,correct:1846,wrong:745,abstained:289});
  expect(total.signals+total.abstained).toBe(240*4*3);
  // Purely hypothetical fixed stake R$10, uniformly offered decimal odds 1.50.
  // This is NOT a historical ROI because real odds are unknown.
  expect(1846*15-2591*10).toBe(1780);
 });
});
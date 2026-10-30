/** Radar V4 Lab Pilot 04: matched fixed-line baseline and historical 70% selection.
 * Read-only extension of Pilot 03; no app changes and no betting profitability claims.
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

/**
 * Lines fixed in advance: index 1 of each published Pilot 03 line grid.
 * All comparisons concern exactly the same 240 fixtures, metric and period.
 * Filtered and unfiltered predictions use the SAME fixed Over line.
 * Filter effects are assessed using emitted vs withheld fixtures (selection).
 * This is retrospective and does NOT run legacy Radar V2/V3 algorithms.
 */
type FilterCount={n:number;hits:number;misses:number};
const emptyCount=():FilterCount=>({n:0,hits:0,misses:0});
const add=(s:FilterCount,hit:boolean)=>{s.n++;if(hit)s.hits++;else s.misses++;};
const percent=(n:number,d:number)=>d?Math.round(10000*n/d)/100:null;
type AuditRow={period:Period;metric:Metric;line:number;sample:number;
  all:FilterCount;retained70:FilterCount;withheld70:FilterCount;
  retained60:FilterCount;withheld60:FilterCount;adaptive:ReturnType<typeof score>;
  retained70Rate:number|null;withheld70Rate:number|null;allRate:number|null;
};
function matchedAudit(){
 const rows=pilot();
 const published=score(rows.flatMap(r=>periods.flatMap(p=>metrics.map(k=>r.signals[p][k]))));
 // The audit must not silently proceed if the reproduced sample differs.
 expect(rows).toHaveLength(240);
 expect(new Set(rows.map(r=>r.game.research!.sourceId)).size).toBe(240);
 expect(published).toEqual({signals:2591,correct:1840,wrong:751,abstained:289});
 const audit:AuditRow[]=[];
 for(const period of periods)for(const metric of metrics){
  const fixedLine=lines[period][metric][1]; // predeclared, not tuned to outcomes
  const all=emptyCount(),retained70=emptyCount(),withheld70=emptyCount();
  const retained60=emptyCount(),withheld60=emptyCount();
  for(const row of rows){
   expect(row.history.length).toBeGreaterThanOrEqual(8);
   expect(row.history.every(m=>m.date<row.game.date&&m.competition===row.game.competition)).toBe(true);
   const previous=row.history.map(m=>value(m,period,metric));
   const rate=previous.filter(n=>n>fixedLine).length/previous.length;
   const actual=value(row.game,period,metric);
   const hit=actual>fixedLine;
   add(all,hit);
   add(rate>=0.70?retained70:withheld70,hit);
   add(rate>=0.60?retained60:withheld60,hit);
  }
  const adaptive=score(rows.map(r=>r.signals[period][metric]));
  expect(all.n).toBe(240);
  expect(retained70.n+withheld70.n).toBe(240);
  expect(retained60.n+withheld60.n).toBe(240);
  expect(retained70.hits+withheld70.hits).toBe(all.hits);
  expect(retained70.misses+withheld70.misses).toBe(all.misses);
  expect(retained60.hits+withheld60.hits).toBe(all.hits);
  expect(adaptive.signals+adaptive.abstained).toBe(240);
  audit.push({period,metric,line:fixedLine,sample:240,all,retained70,
   withheld70,retained60,withheld60,adaptive,
   retained70Rate:percent(retained70.hits,retained70.n),
   withheld70Rate:percent(withheld70.hits,withheld70.n),
   allRate:percent(all.hits,all.n)});
 }
 expect(audit).toHaveLength(12);
 return {matches:240,groups:12,opportunities:2880,
  adaptiveTotal:published,referenceRule:'Second published line, fixed before outcomes',
  limitations:['No real historical odds','Retrospective, non-independent correlated markets',
   'No V2/V3 execution','No statistical or commercial superiority implied'],rows:audit};
}
describe('Radar V4 Pilot 04 — paired same-fixture, same-line, same-period controls',()=>{
 it('reproduces Pilot 03 and measures fixed Over vs prior-data filters',()=>{
  const report=matchedAudit();
  console.info('RADAR_V4_MATCHED_AUDIT_JSON='+JSON.stringify(report));
 });
});

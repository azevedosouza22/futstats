/** Read-only averages of ONE team's actions at its venue (not match totals).
 * Based on the same selected league and season subset as the smart comparison.
 * An individual game contributes at most once to a context and period.
 */
import {stats,type Data,type Match,type Period} from './model';
import {comparisonTeamKey,directMatchSides,type DirectVenueMode} from './smartDirectH2H';
import {radarMetricIntegrity} from './radarHistoricalIntegrity';
import type {RadarFixture} from './radar';
import type {FourLensMetric,LensKind} from './radarFourLenses';

export type IndividualMean={count:number;mean:number|null;observations:number[]};
export type TeamFrequency={
 count:number;over:number;under:number;overRate:number|null;underRate:number|null;
};
/** Half-integer lines avoid ties: every observed integer is either Over or Under. */
export function individualLineFrequency(sample:IndividualMean,line:number):TeamFrequency{
 if(!Number.isFinite(line)||line<0.5||line>999.5||!Number.isInteger(line-0.5)){
  throw Error('Linha inválida. Use um valor terminado em ,5.');
 }
 const n=sample.observations.length;
 const over=sample.observations.filter(value=>value>line).length;
 const under=n-over;
 return {count:n,over,under,overRate:n?over/n:null,underRate:n?under/n:null};
}
/** A neutral reference near the historical mean, not an odds line or bet tip. */
export function suggestedIndividualLine(mean:number|null):number|null{
 return mean===null||!Number.isFinite(mean)||mean<0?null:
  Math.min(999.5,Math.max(0.5,Math.floor(mean)+0.5));
}

export type TeamPeriodRow={period:Period;last5:IndividualMean;last10:IndividualMean};
export type IndividualLens={id:LensKind;periods:TeamPeriodRow[]};
export type TeamOnlyReport={lenses:IndividualLens[];metric:FourLensMetric;
 directVenue:DirectVenueMode;directMatchCount:number;};

const periods:readonly Period[]=['first','second','full'];
const kinds:readonly LensKind[]=['home-any','away-any','home-direct','away-direct'];
function avg(values:number[]):IndividualMean{
 return {count:values.length,mean:values.length
  ?values.reduce((sum,n)=>sum+n,0)/values.length:null,observations:[...values]};
}
export function analyzeTeamOnlyPeriods(
 data:Data,fixture:RadarFixture,metric:FourLensMetric,directVenue:DirectVenueMode='all'
):TeamOnlyReport{
 const teamNames=new Map(data.teams.map(t=>[t.id,comparisonTeamKey(t.name,fixture.competition)]));
 const key=(id:string)=>teamNames.get(id)??comparisonTeamKey(id,fixture.competition);
 const home=key(fixture.home),away=key(fixture.away);
 // The caller scopes this Data to exactly the selected league and one/two seasons.
 // Still require the same fixture league and season family.
 const eligible=data.matches.filter(m=>
  m.date<fixture.date&&
  (!m.research?.titleDate||m.research.titleDate<fixture.date)&&
  !m.research?.dateDiscrepancy&&
  (!m.external||['FT','Match Finished'].includes(m.external.status))&&
  radarMetricIntegrity(m,metric)==='ok'
 );
 // Quarantine ALL duplicate copies, including copies sharing their local ID.
 const copies=new Map<string,Match[]>();
 for(const m of eligible){
  const identity=[m.competition,m.date,...[key(m.home),key(m.away)].sort()].join('|');
  const rows=copies.get(identity)??[];
  rows.push(m);copies.set(identity,rows);
 }
 const blocked=new Set<Match>();
 for(const group of copies.values())if(group.length>1)for(const m of group)blocked.add(m);
 const matches=eligible.filter(m=>!blocked.has(m)).sort(
  (a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id));
 const lenses=kinds.map(id=>{
  const teamSide=id.startsWith('home')?0:1;
  const rows=matches.filter(m=>{
   const h=key(m.home),a=key(m.away);
   if(id==='home-any')return h===home;
   if(id==='away-any')return a===away;
   return directMatchSides(m,home,away,key,directVenue)!==null;
  });
  return {id,periods:periods.map(period=>{
   const values=rows.map(m=>{
     const sides=id.endsWith('direct')?directMatchSides(m,home,away,key,directVenue):null;
     return stats(m,sides?sides[teamSide]:teamSide,period)[metric];
   })
     .filter((n):n is number=>typeof n==='number'&&Number.isFinite(n)&&n>=0);
   return {period,last5:avg(values.slice(0,5)),last10:avg(values.slice(0,10))};
  })};
 });
 return {metric,lenses,directVenue,
  directMatchCount:matches.filter(m=>directMatchSides(m,home,away,key,directVenue)!==null).length};
}

/** Radar V4 laboratory — prospective, read-only calculations.
 * Historical frequency is not a calibrated probability or betting recommendation.
 * Keep all saved V2/V3 data and the user's local match database untouched.
 */
import type {Data,Match} from './model';
import {stats,researchDateBefore} from './model';
import type {ScheduledFixture} from './calendar';
import {competitionParts,NO_SEASON} from './leagueCatalog';
import {resolveCalendarFixture} from './radarCalendarSelection';

export type V4Period='full'|'first'|'second';
export type V4Metric='shots'|'corners'|'target'|'goals';
export const V4_PERIODS:readonly V4Period[]=['full','first','second'];
export const V4_METRICS:readonly V4Metric[]=['shots','corners','target','goals'];
export const V4_LINES:Record<V4Period,Record<V4Metric,readonly number[]>>={
 full:{shots:[20.5,22.5,24.5,26.5],corners:[6.5,7.5,8.5,9.5],target:[5.5,6.5,7.5,8.5],goals:[1.5,2.5,3.5]},
 first:{shots:[8.5,10.5,12.5],corners:[2.5,3.5,4.5,5.5],target:[2.5,3.5,4.5],goals:[0.5,1.5,2.5]},
 second:{shots:[9.5,11.5,13.5],corners:[2.5,3.5,4.5,5.5],target:[2.5,3.5,4.5],goals:[0.5,1.5,2.5]}
};
export type V4Pick={
 period:V4Period;metric:V4Metric;line:number|null;overs:number|null;
 observed:number;mean:number|null;reason:'qualified'|'below_70'|'missing_stats';
};
export type V4FixtureReport={
 fixture:ScheduledFixture;competition:string|null;status:'ready'|'unresolved'|'insufficient';
 reason:string;homeHistoryCount:number;awayHistoryCount:number;
 historyIds:string[];picks:V4Pick[];
};

function exactCompetition(data:Data,fixture:ScheduledFixture):string|null{
 const entered=fixture.competition.trim();
 const existing=new Set(data.matches.filter(m=>!!m.research).map(m=>m.competition));
 if(existing.has(entered))return entered;
 // Only Brazil's seasonless official label can be mapped safely by calendar year.
 const parts=competitionParts(entered);
 if(parts.season!==NO_SEASON)return null;
 const inferred=entered+' '+fixture.date.slice(0,4);
 return existing.has(inferred)?inferred:null;
}
/** Confirmed label variants for the V4 lab ONLY; no changes to shared Radar aliases. */
function v4KnownName(name:string,competition:string):string{
 const lookup:Record<string,Record<string,string>>={
  'Bundesliga 2026/27':{'SV Elversberg':'Elversberg','1. FSV Mainz 05':'Mainz'},
  'La Liga espanhola 2026/27':{'Villarreal CF':'Villarreal','RCD Espanyol':'Espanyol'}
 };
 return lookup[competition]?.[name]??name;
}
function wholeMatchTotal(match:Match,period:V4Period,metric:V4Metric):number|null{
 const a=stats(match,0,period)[metric],b=stats(match,1,period)[metric];
 if(a===null||b===null)return null;
 const n=a+b;
 return Number.isSafeInteger(n)&&n>=0?n:null;
}
/** Isolate 10 past team-games, remove shared sourceIds, exclude same-day/future data. */
export function analyzeV4Fixture(data:Data,fixture:ScheduledFixture):V4FixtureReport {
 const base={fixture,competition:null as string|null,homeHistoryCount:0,awayHistoryCount:0,
  historyIds:[] as string[],picks:[] as V4Pick[]};
 const league=exactCompetition(data,fixture);
 if(!league)return {...base,status:'unresolved',reason:'Temporada não encontrada na pesquisa.'};
 const resolved=resolveCalendarFixture(data,{...fixture,competition:league,
  home:v4KnownName(fixture.home,league),away:v4KnownName(fixture.away,league)});
 if(!resolved)return {...base,competition:league,status:'unresolved',
  reason:'Equipes não reconhecidas nesta temporada; não houve correspondência aproximada.'};
 const prior=data.matches.filter(m=>m.competition===league&&m.research&&
  researchDateBefore(m,fixture.date))
  .sort((a,b)=>a.date.localeCompare(b.date)||
   (a.research?.sourceId??'').localeCompare(b.research?.sourceId??''));
 const lastFive=(id:string)=>prior.filter(m=>m.home===id||m.away===id).slice(-5);
 const home=lastFive(resolved.homeId),away=lastFive(resolved.awayId);
 const history=[...new Map([...home,...away].map(m=>[m.research!.sourceId,m])).values()];
 const context={...base,competition:league,homeHistoryCount:home.length,
  awayHistoryCount:away.length,historyIds:history.map(m=>m.research!.sourceId)};
 if(home.length!==5||away.length!==5||history.length<8)
  return {...context,status:'insufficient',reason:'Histórico insuficiente (mínimo de 5 jogos por equipe e 8 IDs distintos).'};
 const picks:V4Pick[]=[];
 for(const period of V4_PERIODS)for(const metric of V4_METRICS){
  const values=history.map(m=>wholeMatchTotal(m,period,metric));
  const observed=values.filter((v):v is number=>v!==null);
  if(observed.length<8){
   picks.push({period,metric,line:null,overs:null,observed:observed.length,
    mean:null,reason:'missing_stats'});continue;
  }
  const choices=V4_LINES[period][metric].map(line=>({
   line,overs:observed.filter(v=>v>line).length
  })).filter(v=>v.overs/observed.length>=0.7);
  const selected=choices.at(-1);
  picks.push({period,metric,line:selected?.line??null,
   overs:selected?.overs??null,observed:observed.length,
   mean:Math.round(observed.reduce((a,b)=>a+b,0)/observed.length*10)/10,
   reason:selected?'qualified':'below_70'});
 }
 return {...context,status:'ready',reason:'Regra V4: maior Over com frequência histórica ≥70%, sem consulta ao resultado atual.',picks};
}
export function analyzeV4Day(data:Data,fixtures:ScheduledFixture[],date:string){
 const seen=new Set<string>();
 return fixtures.filter(f=>f.date===date).filter(f=>{
  const key=[f.date,f.competition,f.home,f.away].join('|');
  if(seen.has(key))return false;seen.add(key);return true;
 }).map(f=>analyzeV4Fixture(data,f));
}

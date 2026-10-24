/**
 * Ephemeral adapter only. Radar Work uses existing V2/V3 algorithms on a
 * synthesized in-memory Data view; it does not write/merge localStorage
 * historical matches or change immutable Radar prediction snapshots.
 */
import type {Data,Stats,Match} from './model';
import {
 WORK_ANALYSIS_LEAGUES,type WorkAnalysisMatch,type WorkLeague
} from './workAnalysis';
import type {MetricPairs} from './europeWorkResearch';
import {
 predictVenueV2,venueV2Markets,type VenueV2Prediction
} from './radarVenueV2';
import {
 predictVenueV3,type VenueV3Prediction
} from './radarVenueV3';
import {evaluateVenueV3,type VenueV3Report} from './radarVenueV3Backtest';

function toStats(period:MetricPairs,side:0|1):Stats{
 return {
  goals:period.goals[side],shots:period.shots[side],
  target:period.target[side],corners:period.corners[side],
  yellow:null,red:null
 };
}
const pair=(period:MetricPairs):[Stats,Stats]=>
 [toStats(period,0),toStats(period,1)];
const leagueName=(league:WorkLeague)=>
 WORK_ANALYSIS_LEAGUES.find(x=>x.id===league)?.label??league;

export function workRadarData(matches:readonly WorkAnalysisMatch[],league:WorkLeague):Data{
 const scoped=matches.filter(m=>m.league===league);
 const names=[...new Set(scoped.flatMap(m=>[m.home,m.away]))];
 const teamIds=new Map(names.map((name,index)=>[name,'work-v4-'+league+'-'+index]));
 const teams=names.map(name=>({id:teamIds.get(name)!,name,color:'#777777'}));
 const competition=leagueName(league);
 const dataMatches:Match[]=scoped.map(m=>({
  id:'work-radar-preview-'+m.id,
  home:teamIds.get(m.home)!,away:teamIds.get(m.away)!,
  date:m.date,competition,
  first:pair(m.first),second:pair(m.second),
  research:{
   provider:'work-csv',source:'Flashscore',
   sourceId:m.sourceId,sourceUrl:m.sourceUrl,
   importedAt:'2026-10-23T00:00:00.000Z',
   full:pair(m.full),dateDiscrepancy:false
  }
 }));
 return {teams,matches:dataMatches};
}
export type WorkRadarProjection={
 homeCount:number;awayCount:number; v2:VenueV2Prediction;v3:VenueV3Prediction;
 label:string;line:number;marketId:string
};
export function projectWorkRadar(
 data:Data,homeName:string,awayName:string,fixtureDate:string
):WorkRadarProjection[]{
 const home=data.teams.find(t=>t.name===homeName),away=data.teams.find(t=>t.name===awayName);
 if(!home||!away||home.id===away.id||!fixtureDate)return [];
 const competition=data.matches[0]?.competition;
 if(!competition)return [];
 const fixture={home:home.id,away:away.id,date:fixtureDate,competition};
 return venueV2Markets.map(market=>{
  const v2=predictVenueV2(data,fixture,market);
  const v3=predictVenueV3(data,fixture,market);
  return {homeCount:v3.homeCount,awayCount:v3.awayCount,
   label:market.label,line:market.line,marketId:market.id,v2,v3};
 });
}
export function backtestWorkRadar(data:Data):VenueV3Report|null{
 const competition=data.matches[0]?.competition;
 if(!competition)return null;
 return evaluateVenueV3(data,competition);
}

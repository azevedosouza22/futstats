/**
 * READ-ONLY pre-match statistics from completed Work research in PRIVATE stores.
 * No mutation, copies into the historical futstats:v1 or Radar, or use of CC0
 * results as if they were independently sourced match statistics.
 */
import {
 EUROPE_WORK_STORAGE,readEuropeWork,type MetricPairs
} from './europeWorkResearch';
import {
 EUROPE_RESEARCH_STORAGE,readStoredEuropeanResearch,type EuropeLeagueId
} from './europeLeagueResearch';
import {FPL_WORK_STORAGE,readFplWork} from './fplWorkStore';

export const WORK_ANALYSIS_LEAGUES=[
 {id:'serie-a',label:'Serie A italiana 2026/27'},
 {id:'la-liga',label:'La Liga espanhola 2026/27'},
 {id:'ligue-1',label:'Ligue 1 francesa 2026/27'},
 {id:'premier-league',label:'Premier League inglesa 2026/27'}
] as const;
export type WorkLeague=typeof WORK_ANALYSIS_LEAGUES[number]['id'];
export type WorkPeriod='first'|'second'|'full';
export type WorkVenue='all'|'home'|'away';
export type WorkMetric='goals'|'shots'|'target'|'corners';
export const WORK_ANALYSIS_METRICS=[
 {key:'goals',label:'Gols'},
 {key:'shots',label:'Finalizações'},
 {key:'target',label:'Chutes no gol'},
 {key:'corners',label:'Escanteios'}
] as const;
export type WorkAnalysisMatch={
 id:string;league:WorkLeague;date:string;home:string;away:string;
 sourceId:string;sourceUrl:string;
 full:MetricPairs;first:MetricPairs;second:MetricPairs;
 discrepancies:string[];
};
export type WorkAnalysisRead={
 matches:WorkAnalysisMatch[];europeCount:number;premierCount:number;unresolved:number
};
type LocalStores={europe:string|null;research:string|null;premier:string|null};
const validLeague=(id:EuropeLeagueId):id is Extract<WorkLeague,EuropeLeagueId>=>
 ['serie-a','la-liga','ligue-1'].includes(id);
export function readWorkAnalysis({europe,research,premier}:LocalStores):WorkAnalysisRead{
 const europeEntries=readEuropeWork(europe).entries;
 const historic=readStoredEuropeanResearch(research).matches;
 const premierEntries=readFplWork(premier).entries;
 const byId=new Map(historic.map(m=>[m.id,m]));
 const matches:WorkAnalysisMatch[]=[];
 let unresolved=0;
 for(const e of europeEntries){
  const fixture=e.fixture??byId.get(e.europeId);
  if(!fixture||!validLeague(fixture.league)||fixture.id!==e.europeId){
   unresolved++;continue;
  }
  matches.push({
   id:'europe|'+e.sourceId,league:fixture.league,
   date:fixture.date,home:fixture.home,away:fixture.away,
   sourceId:e.sourceId,sourceUrl:e.sourceUrl,
   full:e.full,first:e.first,second:e.second,discrepancies:[]
  });
 }
 for(const e of premierEntries){
  matches.push({
   id:'premier|'+e.sourceId,league:'premier-league',
   date:e.date,home:e.home,away:e.away,
   sourceId:e.sourceId,sourceUrl:e.sourceUrl,
   full:e.full,first:e.first,second:e.second,
   discrepancies:e.discrepancies
  });
 }
 return {matches,europeCount:europeEntries.length,
  premierCount:premierEntries.length,unresolved};
}
export function readBrowserWorkAnalysis():WorkAnalysisRead{
 return readWorkAnalysis({
  europe:localStorage.getItem(EUROPE_WORK_STORAGE),
  research:localStorage.getItem(EUROPE_RESEARCH_STORAGE),
  premier:localStorage.getItem(FPL_WORK_STORAGE)
 });
}
export function workTeamNames(matches:WorkAnalysisMatch[],league:WorkLeague):string[]{
 return [...new Set(matches.filter(m=>m.league===league).flatMap(m=>[m.home,m.away]))]
  .sort((a,b)=>a.localeCompare(b,'pt-BR'));
}
export type WorkTeamSample={
 count:number;
 values:Record<WorkMetric,{for:number|null;against:number|null}>;
 selected:WorkAnalysisMatch[];
};
export function workTeamAverage(
 matches:WorkAnalysisMatch[],league:WorkLeague,team:string,
 period:WorkPeriod,venue:WorkVenue,limit:5|10,beforeDate:string
):WorkTeamSample{
 const selected=matches.filter(m=>
   m.league===league&&(m.home===team||m.away===team)&&
   m.date<beforeDate&&
   (venue==='all'||(venue==='home'?m.home===team:m.away===team)))
   .sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id))
   .slice(0,limit);
 const values={} as WorkTeamSample['values'];
 for(const {key} of WORK_ANALYSIS_METRICS){
  if(!selected.length){values[key]={for:null,against:null};continue;}
  const totals=selected.reduce((s,m)=>{
   const isHome=m.home===team,nums=m[period][key];
   s[0]+=nums[isHome?0:1];s[1]+=nums[isHome?1:0];
   return s;
  },[0,0] as [number,number]);
  values[key]={for:totals[0]/selected.length,against:totals[1]/selected.length};
 }
 return {count:selected.length,values,selected};
}

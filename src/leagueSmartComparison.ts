/** Read-only catalog and filter for the existing comparison screen.
 * Only the two most recent labeled seasons per league are selectable.
 * Never imports archived Work data or writes to the source Data.
 */
import type {Data,Match,Period} from './model';
import {normalizeTeam} from './calendar';
import {leagueOptions,competitionParts,NO_SEASON} from './leagueCatalog';
import {
 analyzeFourLenses,type FourLensMetric,type FourLensReport
} from './radarFourLenses';

export const BOTH_SEASONS='both' as const;
export type LeagueTeamOption={id:string;name:string;key:string};
export type SmartLeagueOptions={
 league:string;seasons:string[];competition:string;
 teams:LeagueTeamOption[];dataCount:number;
};
export type LeagueComparisonSelection={
 league:string;season:string;home:string;away:string;
 date:string;metric:FourLensMetric;period:Period;line:number;
};
const latest=(a:string,b:string)=>b.localeCompare(a,'pt-BR');
export function availableSmartLeagues(data:Data):string[]{
 return leagueOptions(data.matches).filter(league=>
   data.matches.some(m=>competitionParts(m.competition).league===league&&
     competitionParts(m.competition).season!==NO_SEASON));
}
export function smartLeagueOptions(data:Data,league:string):SmartLeagueOptions{
 const all=data.matches.filter(m=>competitionParts(m.competition).league===league);
 const seasons=[...new Set(all.map(m=>competitionParts(m.competition).season)
   .filter(s=>s!==NO_SEASON))].sort(latest).slice(0,2);
 const filtered=all.filter(m=>seasons.includes(competitionParts(m.competition).season));
 const current=filtered.find(m=>competitionParts(m.competition).season===seasons[0]);
 const competition=current?.competition??'';
 const byId=new Map(data.teams.map(t=>[t.id,t]));
 const teamIds=new Set(filtered.flatMap(m=>[m.home,m.away]));
 const names=new Map<string,LeagueTeamOption>();
 // Prefer the newest-season display name and ID for aliases that repeat
 // across the two seasons; preserve stored teams and records unchanged.
 for(const season of seasons)for(const m of filtered){
   if(competitionParts(m.competition).season!==season)continue;
   for(const id of [m.home,m.away]){
     const t=byId.get(id);
     if(!t||!teamIds.has(t.id))continue;
     const key=normalizeTeam(t.name);
     if(!key||names.has(key))continue;
     names.set(key,{id:t.id,name:t.name,key});
   }
 }
 return {league,seasons,competition,
   teams:[...names.values()].sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')),
   dataCount:filtered.length};
}
export function calculateSmartLeagueComparison(data:Data,selection:LeagueComparisonSelection):
 {report:FourLensReport|null;matchCount:number;status:string}{
 const options=smartLeagueOptions(data,selection.league);
 const home=options.teams.find(t=>t.id===selection.home);
 const away=options.teams.find(t=>t.id===selection.away);
 if(!options.seasons.length||!options.competition||
   !home||!away||home.key===away.key||
   (selection.season!==BOTH_SEASONS&&!options.seasons.includes(selection.season))){
   return {report:null,matchCount:0,status:'Escolha liga, temporada e duas equipes diferentes com histórico.'};
 }
 if(!/^\d{4}-\d{2}-\d{2}$/.test(selection.date)){
   return {report:null,matchCount:0,status:'Data de referência indisponível.'};
 }
 if(!Number.isFinite(selection.line)||selection.line<0.5||selection.line>999.5||
   !Number.isInteger(selection.line-0.5)){
   return {report:null,matchCount:0,status:'Informe uma linha positiva terminada em ,5.'};
 }
 const subset:Match[]=data.matches.filter(m=>
   competitionParts(m.competition).league===selection.league&&
   options.seasons.includes(competitionParts(m.competition).season)&&
   (selection.season===BOTH_SEASONS||
      competitionParts(m.competition).season===selection.season)&&
   m.date<selection.date
 );
 const report=analyzeFourLenses({...data,matches:subset},
   {home:home.id,away:away.id,date:selection.date,
    competition:options.competition},selection.metric,selection.period,selection.line);
 return {report,matchCount:subset.length,status:subset.length
  ?'Histórico disponível na base deste navegador.':'Nenhum jogo anterior elegível para esta seleção.'};
}

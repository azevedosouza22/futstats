/** Read-only counters for the home dashboard.
 * Describes observed historical frequencies, NEVER future probabilities.
 */
import {stats,type Data,type Metric} from './model';
import {competitionParts,NO_LEAGUE} from './leagueCatalog';

export const HOME_MARKETS=[
 {metric:'goals',line:2.5,label:'Gols',description:'Over 2,5'},
 {metric:'shots',line:24.5,label:'Finalizações',description:'Over 24,5'},
 {metric:'target',line:7.5,label:'Chutes no gol',description:'Over 7,5'},
 {metric:'corners',line:8.5,label:'Escanteios',description:'Over 8,5'}
] as const;
export type HomeMarket={
 metric:Metric;line:number;label:string;description:string;
 observed:number;over:number;percent:number|null;
};
export function homeHistoricalMarkets(data:Data):HomeMarket[]{
 // Data conflicts are retained in the archive, never analyzed by date-sensitive UI.
 const matches=data.matches.filter(m=>!m.research?.dateDiscrepancy);
 return HOME_MARKETS.map(def=>{
  let observed=0,over=0;
  for(const match of matches){
   const home=stats(match,0,'full')[def.metric];
   const away=stats(match,1,'full')[def.metric];
   if(home===null||away===null)continue;
   observed++;
   if(home+away>def.line)over++;
  }
  return {...def,observed,over,
   percent:observed>0?Math.round(over/observed*100):null};
 });
}
export function homeLeagueCount(data:Data):number{
 return new Set(data.matches.map(m=>competitionParts(m.competition).league)
  .filter(league=>league!==NO_LEAGUE)).size;
}

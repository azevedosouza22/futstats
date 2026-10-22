/**
 * Discover newly completed Premier League 2026/27 rounds without creating
 * FutStats history records or modifying stored Radar forecasts.
 *
 * The source publishes future rounds with finished=False and blank stats.
 * Promote the NEXT round only when all ten matches are finished and have
 * the required full-time fields. Future / incomplete rounds never count.
 */
import {parseCsv,FPL_PREVIEW_ROUNDS} from './fplFreePilot';

export const FPL_MAX_ROUNDS=38;
const need=['gameweek','match_id','finished','home_score','away_score',
 'home_total_shots','away_total_shots','home_shots_on_target',
 'away_shots_on_target','home_corners','away_corners'];
const numeric=(s:string|undefined)=>s!==undefined&&/^(?:0|[1-9]\d*)(?:\.0+)?$/.test(s.trim());
export function isCompleteFplRound(text:string,round:number):boolean{
 if(!Number.isInteger(round)||round<1||round>FPL_MAX_ROUNDS)return false;
 let rows:Record<string,string>[];
 try{rows=parseCsv(text);}catch{return false;}
 if(rows.length!==10)return false;
 const ids=new Set<string>();
 for(const row of rows){
  if(need.some(k=>!(k in row))||row.gameweek!==String(round)||
     !row.match_id||ids.has(row.match_id)||row.finished!=='True'||
     (row.stats_processed!=='True'&&row.stats_processed!=='False')||
     need.slice(3).some(k=>!numeric(row[k])))return false;
  ids.add(row.match_id);
 }
 return true;
}
export type DiscoveryResult={
 /** Validated raw CSVs from round 1 onwards; provisional rows excluded. */
 completedCsvs:string[];
 lastCompleteRound:number;
 nextRoundPending:number|null;
 reason:'partial'|'missing'|'maximum';
};
export async function discoverNewFplRounds(
 baseline:string[],
 loadRound:(n:number)=>Promise<string|null>,
 maxRound=FPL_MAX_ROUNDS
):Promise<DiscoveryResult>{
 if(baseline.length!==FPL_PREVIEW_ROUNDS||
    !Number.isInteger(maxRound)||maxRound<FPL_PREVIEW_ROUNDS||
    maxRound>FPL_MAX_ROUNDS||
    baseline.some((csv,i)=>!isCompleteFplRound(csv,i+1)))
  throw Error('As rodadas iniciais da fonte estão incompletas ou inconsistentes.');
 const completedCsvs=[...baseline];
 for(let n=FPL_PREVIEW_ROUNDS+1;n<=maxRound;n++){
  const csv=await loadRound(n);
  if(csv===null)return {completedCsvs,lastCompleteRound:n-1,nextRoundPending:n,reason:'missing'};
  if(!isCompleteFplRound(csv,n))
   return {completedCsvs,lastCompleteRound:n-1,nextRoundPending:n,reason:'partial'};
  completedCsvs.push(csv);
 }
 return {completedCsvs,lastCompleteRound:completedCsvs.length,nextRoundPending:null,reason:'maximum'};
}

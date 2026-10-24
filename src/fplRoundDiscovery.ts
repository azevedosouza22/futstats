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
const safeTotal=(s:string|undefined)=>numeric(s)&&Number.isSafeInteger(Number(s))&&Number(s)<=999;
export function isCompleteFplRound(text:string,round:number):boolean{
 if(!Number.isInteger(round)||round<1||round>FPL_MAX_ROUNDS)return false;
 let rows:Record<string,string>[];
 try{rows=parseCsv(text);}catch{return false;}
 if(rows.length!==10)return false;
 const ids=new Set<string>();
 for(const row of rows){
  if(need.some(k=>!(k in row))||row.gameweek!==String(round)||
     !row.match_id||!/^26-27-prem-[a-z0-9-]+$/.test(row.match_id)||
     ids.has(row.match_id)||row.finished!=='True'||
     (row.stats_processed!=='True'&&row.stats_processed!=='False')||
     need.slice(3).some(k=>!safeTotal(row[k]))||
     Number(row.home_shots_on_target)>Number(row.home_total_shots)||
     Number(row.away_shots_on_target)>Number(row.away_total_shots))return false;
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
 const baselineIds=baseline.flatMap(csv=>parseCsv(csv).map(row=>row.match_id));
 if(new Set(baselineIds).size!==baselineIds.length)
  throw Error('IDs duplicados entre as sete rodadas iniciais.');
 const seenMatchIds=new Set(baselineIds);
 for(let n=FPL_PREVIEW_ROUNDS+1;n<=maxRound;n++){
  const csv=await loadRound(n);
  if(csv===null)return {completedCsvs,lastCompleteRound:n-1,nextRoundPending:n,reason:'missing'};
  if(!isCompleteFplRound(csv,n))
   return {completedCsvs,lastCompleteRound:n-1,nextRoundPending:n,reason:'partial'};
  const newMatchIds=parseCsv(csv).map(row=>row.match_id);
  if(newMatchIds.some(id=>seenMatchIds.has(id)))
   return {completedCsvs,lastCompleteRound:n-1,nextRoundPending:n,reason:'partial'};
  newMatchIds.forEach(id=>seenMatchIds.add(id));
  completedCsvs.push(csv);
 }
 return {completedCsvs,lastCompleteRound:completedCsvs.length,nextRoundPending:null,reason:'maximum'};
}


/** Read-only fixture statuses for the NEXT round, before all matches finish. */
export type NextRoundFixture={
 id:string;gw:number;date:string;home:string;away:string;
 status:'a-jogar'|'em-revisao'|'concluido';
 fullTime:[number,number]|null;
};
const toCode=(value:string|undefined):number|null=>{
 if(!value||!/^(?:0|[1-9]\d*)(?:\.0+)?$/.test(value))return null;
 const n=Number(value);return Number.isSafeInteger(n)?n:null;
};
const validDate=(v:string|undefined)=>!!v&&
 /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(v)&&
 !Number.isNaN(Date.parse(v+'Z'))&&new Date(v+'Z').toISOString().slice(0,19)===v;
/**
 * Missing stats must never be represented by zero. Completed but unprocessed
 * matches are displayed as "em revisão", not added to the FutStats history.
 * Never blend source seasons or derive team identities from fuzzy name matching.
 */
export function inspectNextFplRound(
 csv:string,
 round:number,
 teamsCsv:string
):NextRoundFixture[]{
 if(!Number.isInteger(round)||round<1||round>FPL_MAX_ROUNDS)
  throw Error('Rodada de acompanhamento inválida.');
 const teamRows=parseCsv(teamsCsv),teams=new Map<number,string>();
 if(teamRows.length!==20)throw Error('Clubes da temporada incompletos.');
 for(const t of teamRows){
  const id=toCode(t.code);
  if(id===null||!t.name||teams.has(id))throw Error('Clube duplicado ou desconhecido.');
  teams.set(id,t.name);
 }
 const rows=parseCsv(csv);
 if(rows.length!==10)throw Error('A próxima rodada não possui dez partidas.');
 const used=new Set<string>();
 const fixtures:NextRoundFixture[]=[];
 for(const r of rows){
  if(!r.match_id||used.has(r.match_id)||!/^26-27-prem-[a-z0-9-]+$/.test(r.match_id)||
   r.gameweek!==String(round)||!validDate(r.kickoff_time)||
   (r.finished!=='True'&&r.finished!=='False'))
   throw Error('A próxima rodada tem jogos duplicados ou dados inválidos.');
  used.add(r.match_id);
  const h=teams.get(toCode(r.home_team)??-1),a=teams.get(toCode(r.away_team)??-1);
  if(!h||!a||h===a)throw Error('Equipes da próxima rodada não identificadas.');
  const score=(r.finished==='True'&&numeric(r.home_score)&&numeric(r.away_score))
   ?[Number(r.home_score),Number(r.away_score)] as [number,number]:null;
  const hasFullStats=[
   'home_total_shots','away_total_shots','home_shots_on_target','away_shots_on_target',
   'home_corners','away_corners'
  ].every(k=>numeric(r[k]));
  const status:NextRoundFixture['status']=r.finished==='False'?'a-jogar':
   r.stats_processed==='True'&&score&&hasFullStats?'concluido':'em-revisao';
  fixtures.push({id:r.match_id,gw:round,date:r.kickoff_time,home:h,away:a,status,fullTime:score});
 }
 return fixtures.sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
}

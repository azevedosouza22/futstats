/**
 * One-off review of Work research CSV inside the Premier League pilot.
 * Read-only: no localStorage writes, imports, downloads or provider requests.
 * The imported source ID is preserved independently of the FPL match ID.
 */
import {parseWorkResearchCsv} from './workCsv';
import type {FplPilotGame,Pair} from './fplFreePilot';

export const PILOT_WORK_METRICS=['goals','shots','target','corners'] as const;
type WorkMetric=typeof PILOT_WORK_METRICS[number];

export type ReviewedWorkGame={
 gameId:string;sourceId:string;sourceUrl:string;date:string;
 home:string;away:string;
 first:Record<WorkMetric,Pair>;
 second:Record<WorkMetric,Pair>;
};
export type WorkPilotReview={checked:number;approved:ReviewedWorkGame[];rejected:{sourceId:string;reason:string}[]};

const normalize=(input:string)=>{
 const normalized=input.normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 if(['tottenham','tottenham hotspur','spurs'].includes(normalized))return 'spurs';
 if(['coventry','coventry city'].includes(normalized))return 'coventry city';
 return normalized;
};
const number=(value:number|null|undefined):value is number=>
 typeof value==='number'&&Number.isSafeInteger(value)&&value>=0&&value<=999;
const asPair=(home:number|null|undefined,away:number|null|undefined):Pair|null=>
 number(home)&&number(away)?[home,away]:null;

/** Reject missing or conflicting values, never replace them with zero. */
export function reviewWorkResearchForFpl(csv:string,games:FplPilotGame[]):WorkPilotReview{
 const rows=parseWorkResearchCsv(csv);
 const approved:ReviewedWorkGame[]=[],rejected:WorkPilotReview['rejected']=[];
 const seen=new Set<string>();
 for(const row of rows){
  if(row.dateDiscrepancy){
   rejected.push({sourceId:row.sourceId,reason:'A data do título do Flashscore diverge da data da partida.'});
   continue;
  }
  if(normalize(row.competition)!=='premier league 2026 27'){
   rejected.push({sourceId:row.sourceId,reason:'Temporada ou competição diferente da Premier League 2026/27.'});
   continue;
  }
  const candidates=games.filter(g=>g.date===row.date&&
   normalize(g.home)===normalize(row.home)&&normalize(g.away)===normalize(row.away));
  if(candidates.length!==1){
   rejected.push({sourceId:row.sourceId,reason:'Partida não identificada de maneira única na temporada atual.'});
   continue;
  }
  const game=candidates[0];
  if(seen.has(game.id)){
   const index=approved.findIndex(r=>r.gameId===game.id);
   if(index>=0)approved.splice(index,1);
   rejected.push({sourceId:row.sourceId,reason:'Mais de uma pesquisa aponta para a mesma partida.'});
   continue;
  }
  seen.add(game.id);
  if(!game.sourceStatsProcessed){
   rejected.push({sourceId:row.sourceId,reason:'A fonte principal ainda não validou esta partida.'});
   continue;
  }
  const first={} as Record<WorkMetric,Pair>,second={} as Record<WorkMetric,Pair>;
  const expected:Record<WorkMetric,Pair>={goals:game.goals,shots:game.shots,
   target:game.onTarget,corners:game.corners};
  let problem='';
  for(const metric of PILOT_WORK_METRICS){
   const full=asPair(row.full[0][metric],row.full[1][metric]);
   const p1=asPair(row.first[0][metric],row.first[1][metric]);
   const p2=asPair(row.second[0][metric],row.second[1][metric]);
   if(!full||!p1||!p2){problem='Valores ausentes em '+metric+' (N/D).';break;}
   if(full.some((v,i)=>v!==expected[metric][i])||
      p1.some((v,i)=>v+p2[i]!==full[i])){
    problem='Totais incompatíveis em '+metric+'.';break;
   }
   first[metric]=p1;second[metric]=p2;
  }
  if(problem){rejected.push({sourceId:row.sourceId,reason:problem});continue;}
  approved.push({gameId:game.id,sourceId:row.sourceId,sourceUrl:row.sourceUrl,
   date:row.date,home:game.home,away:game.away,first,second});
 }
 return {checked:rows.length,approved,rejected};
}

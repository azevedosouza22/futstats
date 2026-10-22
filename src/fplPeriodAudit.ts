/**
 * Shot-event consistency check. Never use it to create a new FutStats Match.
 * Events only cover shots and on-target outcomes; no per-half corner data.
 * Dates, season and goal values stay unchanged.
 */
import {parseCsv,type FplPilotGame,type Pair,FPL_PREVIEW_ROUNDS} from './fplFreePilot';

export type VerifiedPeriod={shots:Pair;onTarget:Pair};
export type VerifiedPeriods={first:VerifiedPeriod;second:VerifiedPeriod};
export type ShotAudit={
 reconciled:number;divergent:number;pending:number;checked:number;
 eventRows:number;reconciledIds:string[];divergentIds:string[];pendingIds:string[];
 /** Only published for games whose every event reconciles to full-time totals. */
 periodsById:Record<string,VerifiedPeriods>;
};
type Event={id:string;side:'True'|'False';minute:number;outcome:string;index:string};
const outcomes=new Set(['save','goal','miss','block','post','owngoal']);
function parseEvents(csv:string):{rows:Event[];invalidIds:Set<string>}{
 const data=parseCsv(csv);
 const result:Event[]=[];const invalidIds=new Set<string>();
 const seen=new Set<string>();
 for(const row of data){
  const id=row.match_id??'',side=row.is_home,minute=Number(row.minute),
   outcome=(row.outcome??'').toLowerCase(),index=row.shot_index??'',
   addedTime=(row.added_time??'').trim();
  // The current provider encodes 45+3 as minute=45, added_time=3.0.
  // Never assign an ambiguous added-time representation to either half.
  const invalidStoppage=addedTime!==''&&(
    !/^(?:[1-9]\\d*)(?:\\.0+)?$/.test(addedTime)||
    (minute!==45&&minute!==90)
  );
  const key=id+'|'+index;
  if(!id||!index||seen.has(key)||!['True','False'].includes(side)||
     !/^\d{1,3}$/.test(row.minute??'')||!Number.isInteger(minute)||
     minute<1||minute>120||invalidStoppage||!outcomes.has(outcome)){
   invalidIds.add(id);
   continue;
  }
  seen.add(key);
  result.push({id,side:side as 'True'|'False',minute,outcome,index});
 }
 return {rows:result,invalidIds};
}
export function auditFplShotEvents(games:FplPilotGame[],shotCsvByGw:string[]):ShotAudit{
 const maxGameRound=Math.max(FPL_PREVIEW_ROUNDS,...games.map(g=>g.gw));
 if(shotCsvByGw.length!==maxGameRound)
  throw Error('A auditoria exige arquivos de eventos para todas as rodadas concluídas.');
 const all=new Map<string,Event[]>(),invalidIds=new Set<string>();
 let eventRows=0;
 shotCsvByGw.forEach((raw,i)=>{
  const group=parseEvents(raw);
  eventRows+=group.rows.length;
  group.invalidIds.forEach(id=>invalidIds.add(id));
  for(const e of group.rows){
   // Events with wrong gameweek must not be accepted.
   const id=i+'|'+e.id;
   const prev=all.get(id)??[];
   prev.push(e);all.set(id,prev);
  }
 });
 const reconciledIds:string[]=[],divergentIds:string[]=[],pendingIds:string[]=[];
 const periodsById:Record<string,VerifiedPeriods>={};
 for(const game of games){
  if(!game.sourceStatsProcessed){pendingIds.push(game.id);continue;}
  const events=all.get((game.gw-1)+'|'+game.id)??[];
  if(!events.length||invalidIds.has(game.id)){divergentIds.push(game.id);continue;}
  const home=events.filter(e=>e.side==='True'),away=events.filter(e=>e.side==='False');
  const totals=[home.length,away.length,
    home.filter(e=>e.outcome==='goal'||e.outcome==='save').length,
    away.filter(e=>e.outcome==='goal'||e.outcome==='save').length];
  const expected=[...game.shots,...game.onTarget];
  if(totals.every((n,i)=>n===expected[i])){
   // Minutes 1..45, including 45+ stoppage, belong to first half.
   // Minutes 46..120, including 90+ stoppage, belong to second half.
   // No corners per half are reported by this source.
   const period=(first:boolean):VerifiedPeriod=>{
    const inHalf=(e:Event)=>first?e.minute<=45:e.minute>45;
    const count=(side:'True'|'False',target:boolean)=>
     events.filter(e=>e.side===side&&inHalf(e)&&
       (!target||e.outcome==='goal'||e.outcome==='save')).length;
    return {shots:[count('True',false),count('False',false)],
      onTarget:[count('True',true),count('False',true)]};
   };
   const first=period(true),second=period(false);
   if(first.shots.some((v,i)=>v+second.shots[i]!==game.shots[i])||
      first.onTarget.some((v,i)=>v+second.onTarget[i]!==game.onTarget[i])){
    divergentIds.push(game.id);
    continue;
   }
   periodsById[game.id]={first,second};
   reconciledIds.push(game.id);
  }else divergentIds.push(game.id);
 }
 return {
  reconciled:reconciledIds.length,divergent:divergentIds.length,
  pending:pendingIds.length,checked:games.length,eventRows,
  reconciledIds,divergentIds,pendingIds,periodsById
 };
}

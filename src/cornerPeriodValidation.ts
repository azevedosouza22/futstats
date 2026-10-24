/**
 * Corner periods: strict audit of NORMALIZED events from a licensed provider.
 *
 * Deliberately no fetching, API keys, new user statistics or Radar integration.
 * Do not adapt a provider's response until its schema has been verified against
 * a real response and its reuse rights have been reviewed.
 */
export type CornersBySide={home:number;away:number};
export type NormalizedCornerEvent={
 /** Stable provider event id, unique within a match. */
 id:string;
 matchId:string;
 /** Exact source team ID, not display name. */
 teamId:string;
 /** Explicit match half from the source, NOT guessed from minute. */
 half:1|2;
 minute:number;
 /** Added time, if provided by source; null means unavailable. */
 addedMinute:number|null;
};
export type CornerFixture={
 matchId:string;homeTeamId:string;awayTeamId:string;
 /** Reliable, independently documented full-match totals. */
 full:CornersBySide;
 firstHalf?:CornersBySide;
 finished:boolean;
};
export type CornerProvenance={
 provider:string;
 sourceUrl:string;
 /** A completed provider response, not a partial or paginated event slice. */
 eventsComplete:boolean;
 /** Separate evaluation of contractual rights; "reviewed" is not implied by free access. */
 reuseRights:'unreviewed'|'reviewed'|'restricted';
};
export type CornerCheck={
 status:'verified'|'incomplete'|'invalid'|'mismatch';
 first:CornersBySide|null;
 second:CornersBySide|null;
 full:CornersBySide;
 eventCount:number;
 errors:string[];
 /** Stronger than mathematical reconciliation; still does not modify the FutStats base. */
 eligibleForImport:boolean;
};
const validCount=(n:unknown):n is number=>Number.isSafeInteger(n)&&typeof n==='number'&&n>=0&&n<=99;
const validPair=(p:unknown):p is CornersBySide=>!!p&&typeof p==='object'&&!Array.isArray(p)&&
  validCount((p as CornersBySide).home)&&validCount((p as CornersBySide).away);
const validName=(s:unknown):s is string=>typeof s==='string'&&s.length>=1&&s.length<=256&&!s.includes('\n');
const blank=(p:CornersBySide,status:CornerCheck['status'],errors:string[],length:number):CornerCheck=>
 ({status,first:null,second:null,full:p,eventCount:length,errors,eligibleForImport:false});
const same=(a:CornersBySide,b:CornersBySide)=>a.home===b.home&&a.away===b.away;
/**
 * No inference if a provider gives only "minute": injury-time minute 45 may
 * belong to either period in some feeds. The explicit half field is mandatory.
 */
export function auditCornerPeriods(
  fixture:CornerFixture,
  eventPayload:unknown,
  provenance:CornerProvenance
):CornerCheck{
 const full=validPair(fixture.full)?fixture.full:{home:0,away:0};
 if(!validPair(fixture.full)||!validName(fixture.matchId)||
    !validName(fixture.homeTeamId)||!validName(fixture.awayTeamId)||
    fixture.homeTeamId===fixture.awayTeamId||
    (fixture.firstHalf!==undefined&&!validPair(fixture.firstHalf)))
   return blank(full,'invalid',['Fixture incompleta ou dados totais inválidos.'],0);
 if(!fixture.finished||!provenance.eventsComplete)
   return blank(full,'incomplete',['Partida ou coleta de eventos ainda não concluída.'],0);
 if(!validName(provenance.provider)||!/^https:\/\//.test(provenance.sourceUrl))
   return blank(full,'invalid',['Origem e URL HTTPS verificável são obrigatórias.'],0);
 if(!Array.isArray(eventPayload)||eventPayload.length>500)
   return blank(full,'invalid',['Eventos devem ser uma coleção com até 500 registros.'],0);
 const events=eventPayload as unknown[];
 const ids=new Set<string>();
 const result=[{home:0,away:0},{home:0,away:0}];
 const errors:string[]=[];
 for(const v of events){
  if(!v||typeof v!=='object'||Array.isArray(v)){
    errors.push('Formato de evento inválido.');continue;
  }
  const e=v as Record<string,unknown>;
  if(!validName(e.id)||ids.has(e.id)){
    errors.push('Identificador de evento ausente ou repetido.');continue;
  }
  ids.add(e.id);
  if(e.matchId!==fixture.matchId||
     (e.teamId!==fixture.homeTeamId&&e.teamId!==fixture.awayTeamId)||
     (e.half!==1&&e.half!==2)||
     !Number.isInteger(e.minute)||typeof e.minute!=='number'||
     e.minute<0||e.minute>130||
     !(e.addedMinute===null||(Number.isInteger(e.addedMinute)&&
       typeof e.addedMinute==='number'&&e.addedMinute>=0&&e.addedMinute<=30))){
    errors.push('Evento sem partida, equipe, período ou minuto comprovável.');continue;
  }
  const team=e.teamId===fixture.homeTeamId?'home':'away';
  result[e.half-1][team]++;
 }
 if(errors.length)return blank(full,'invalid',errors,events.length);
 const [first,second]=result;
 const combined={home:first.home+second.home,away:first.away+second.away};
 if(!same(combined,full)){
   return blank(full,'mismatch',
    ['A soma dos escanteios registrados não corresponde ao total do jogo para ambas as equipes.'],events.length);
 }
 if(fixture.firstHalf&&!same(first,fixture.firstHalf)){
   return blank(full,'mismatch',
    ['O primeiro tempo não corresponde ao total parcial independente informado pela fonte.'],events.length);
 }
 const errorsRights=provenance.reuseRights==='reviewed'?[]:[
  'Conferência numérica aprovada; direitos de reutilização não autorizam integração ainda.'
 ];
 return {status:'verified',first,second,full,eventCount:events.length,
  errors:errorsRights,eligibleForImport:provenance.reuseRights==='reviewed'};
}

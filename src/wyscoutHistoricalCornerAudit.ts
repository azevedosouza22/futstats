/**
 * Historical real-event audit adapter for Pappalardo et al. (Wyscout), CC BY 4.0.
 * https://doi.org/10.6084/m9.figshare.c.4415000.v5
 *
 * This is an isolated contract test for 2017/18 data, NOT a 2026/27
 * Premier League feed. Independent full-time corner totals are mandatory.
 * Do not import these events into FutStats and do not mark rights reviewed.
 */
import {auditCornerPeriods,type CornerCheck,type CornerFixture,type CornerProvenance,type NormalizedCornerEvent} from './cornerPeriodValidation';
export type WyscoutOpenEvent={
 id:number;matchId:number;teamId:number;matchPeriod:string;
 eventSec:number;eventName:string;subEventName:string;
};
export type WyscoutHistoricalSpec={
 id:number;homeId:number;awayId:number;home:string;away:string;
 total:[number,number];checkUrl:string;sourceUrl:string;
 sourceEventTotal:number;corners:WyscoutOpenEvent[];
};
const historicalTag='English Premier League 2017/18';
export function normalizeWyscoutCornerEvents(matchId:number,events:unknown):NormalizedCornerEvent[]{
 if(!Number.isSafeInteger(matchId)||matchId<1||!Array.isArray(events)||
   events.length>200000)throw Error('Wyscout: partida ou eventos ausentes.');
 const normalized:NormalizedCornerEvent[]=[];
 for(const raw of events){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Wyscout: evento inválido.');
  const e=raw as Record<string,unknown>;
  if(e.eventName!=='Free Kick'||e.subEventName!=='Corner')continue;
  if(!Number.isSafeInteger(e.id)||typeof e.id!=='number'||e.id<=0||
     e.matchId!==matchId||!Number.isSafeInteger(e.teamId)||typeof e.teamId!=='number'||
     e.teamId<=0||(e.matchPeriod!=='1H'&&e.matchPeriod!=='2H')||
     typeof e.eventSec!=='number'||!Number.isFinite(e.eventSec)||e.eventSec<0||e.eventSec>5400)
    throw Error('Wyscout: escanteio sem partida, equipe, período ou tempo válido.');
  const half=e.matchPeriod==='1H'?1:2;
  // eventSec is elapsed seconds within the explicit half, not full-match time.
  // In stoppage time the known half remains authoritative; do not infer it.
  const minute=(half===1?0:45)+Math.floor(e.eventSec/60)+1;
  if(minute>130)throw Error('Wyscout: minuto fora do intervalo do validador.');
  normalized.push({
   id:String(e.id),matchId:String(matchId),teamId:String(e.teamId),
   half,minute,addedMinute:null
  });
 }
 return normalized;
}
export function auditWyscoutHistoricalCorners(spec:WyscoutHistoricalSpec):{
 competition:string;fixture:string;audit:CornerCheck;
}{
 if(!Number.isSafeInteger(spec.id)||!spec.sourceUrl.startsWith('https://')||
    !spec.checkUrl.startsWith('https://')||!Number.isInteger(spec.sourceEventTotal)||
    spec.sourceEventTotal<spec.corners.length||
    spec.sourceEventTotal<100)
  throw Error('Dados de proveniência do teste histórico incompletos.');
 const events=normalizeWyscoutCornerEvents(spec.id,spec.corners);
 const fixture:CornerFixture={
  matchId:String(spec.id),homeTeamId:String(spec.homeId),awayTeamId:String(spec.awayId),
  full:{home:spec.total[0],away:spec.total[1]},finished:true
 };
 const provenance:CornerProvenance={
  provider:'Pappalardo/Wyscout open historical event sample',
  sourceUrl:spec.sourceUrl,eventsComplete:true,
  // The event compilation is CC BY 4.0, but this project has not vetted
  // redistribution rights for each derived output and independent total.
  reuseRights:'unreviewed'
 };
 return {competition:historicalTag,fixture:spec.home+' × '+spec.away,
  audit:auditCornerPeriods(fixture,events,provenance)};
}

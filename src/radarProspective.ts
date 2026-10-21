import type {Data,Match} from './model';
import {brasiliaDate,normalizeTeam} from './calendar';
import {matchTotal,type RadarFixture} from './radar';
import {venueV2Markets} from './radarVenueV2';
import {predictVenueV3,type VenueV3Check} from './radarVenueV3';

// Predictions are copied once, BEFORE kick-off. Never recalculate saved signals
// from a newer data set when evaluating the eventual result.
export type SavedVenuePrediction = {
  marketId:string; label:string; line:number;
  v2:'Over'|'Under'|'Sem sinal'; v3:'Over'|'Under'|'Sem sinal';
  projectedTotal:number|null; failedChecks:VenueV3Check[];
};
export function captureVenuePredictions(data:Data,fixture:RadarFixture):SavedVenuePrediction[]{
 return venueV2Markets.map(m=>{
  const result=predictVenueV3(data,fixture,m);
  return {marketId:m.id,label:m.label,line:m.line,
   v2:result.v2Decision,v3:result.decision,
   projectedTotal:result.projectedTotal,failedChecks:[...result.failedChecks]};
 });
}

type Signal='Over'|'Under'|'Sem sinal';
export type SavedFixtureIdentity={
 savedAt:string;matchAt:string;home:string;away:string;competition:string;
 venue?:SavedVenuePrediction[];
};
export type SignalVerdict='Acertou'|'Errou'|'Sem sinal'|'N/D';
export type SettledMarket={marketId:string;label:string;v2:SignalVerdict;v3:SignalVerdict;
  alwaysOver:SignalVerdict;alwaysUnder:SignalVerdict};
export type Settlement={status:'future'|'pending'|'ambiguous'|'late'|'legacy'|'complete';
 markets:SettledMarket[]};

function verdict(direction:Signal,actualOver:boolean|null):SignalVerdict{
 if(direction==='Sem sinal')return 'Sem sinal';
 if(actualOver===null)return 'N/D';
 return (direction==='Over')===actualOver?'Acertou':'Errou';
}
function namesMatch(data:Data,match:Match,fixture:SavedFixtureIdentity){
 const teamName=(id:string)=>data.teams.find(t=>t.id===id)?.name??'';
 return normalizeTeam(teamName(match.home))===normalizeTeam(fixture.home)&&
  normalizeTeam(teamName(match.away))===normalizeTeam(fixture.away);
}
export function settleVenuePredictions(
 data:Data,record:SavedFixtureIdentity,now=brasiliaDate(),
):Settlement{
 if(!record.venue?.length)return {status:'legacy',markets:[]};
 const gameStart=record.matchAt.slice(0,16);
 const savedBR=brasiliaDate(new Date(record.savedAt));
 if(savedBR.date+'T'+savedBR.time>=gameStart)return {status:'late',markets:[]};
 if(now.date+'T'+now.time<=gameStart)return {status:'future',markets:[]};
 const matches=data.matches.filter(m=>m.date===record.matchAt.slice(0,10)&&
  m.competition.trim()===record.competition.trim()&&namesMatch(data,m,record));
 if(matches.length===0)return {status:'pending',markets:[]};
 // Ambiguous identity or conflicting source dates must not become a scored result.
 if(matches.length!==1||matches[0].research?.dateDiscrepancy)return {status:'ambiguous',markets:[]};
 const match=matches[0];
 const markets=record.venue.map(p=>{
  const metric=venueV2Markets.find(m=>m.id===p.marketId&&m.line===p.line);
  const actual=metric?matchTotal(match,metric.metric,metric.period):null;
  const over=actual===null?null:actual>p.line;
  return {marketId:p.marketId,label:p.label,
   v2:verdict(p.v2,over),v3:verdict(p.v3,over),
   alwaysOver:verdict('Over',over),alwaysUnder:verdict('Under',over)};
 });
 return {status:'complete',markets};
}
export function scoreSettlements(sets:Settlement[]){
 const fields=['v2','v3','alwaysOverV2','alwaysOverV3','alwaysUnderV2','alwaysUnderV3'] as const;
 const scores=Object.fromEntries(fields.map(k=>[k,{correct:0,signals:0}])) as Record<typeof fields[number],{correct:number;signals:number}>;
 function add(key:typeof fields[number],value:SignalVerdict){
  if(value!=='Acertou'&&value!=='Errou')return;
  scores[key].signals++;
  if(value==='Acertou')scores[key].correct++;
 }
 for(const s of sets)if(s.status==='complete')for(const m of s.markets){
  add('v2',m.v2);add('v3',m.v3);
  if(m.v2==='Acertou'||m.v2==='Errou'){
   add('alwaysOverV2',m.alwaysOver);add('alwaysUnderV2',m.alwaysUnder);
  }
  if(m.v3==='Acertou'||m.v3==='Errou'){
   add('alwaysOverV3',m.alwaysOver);add('alwaysUnderV3',m.alwaysUnder);
  }
 }
 return scores;
}

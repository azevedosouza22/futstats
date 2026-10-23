/**
 * Frozen V2/V3 Work Radar forecasts, separate from both the 659-match history
 * and the user's original immutable Radar snapshots.
 * Every stored signal and the baseline are captured BEFORE kick-off.
 * No background polling, automatic fixture discovery, or silent rewrites.
 */
import {brasiliaDate,normalizeTeam} from './calendar';
import {venueV2Markets} from './radarVenueV2';
import {captureVenuePredictions,type SavedVenuePrediction} from './radarProspective';
import {workRadarData} from './workRadar';
import type {WorkAnalysisMatch,WorkLeague} from './workAnalysis';

export const WORK_RADAR_PROSPECTIVE_STORAGE='futstats:work-radar-prospective:v1';
const FORMAT=WORK_RADAR_PROSPECTIVE_STORAGE;
export type FrozenWorkMarket=SavedVenuePrediction&{
 baseline:'Over'|'Under'|null;
 historicalObserved:number;
};
export type FrozenWorkForecast={
 id:string;
 league:WorkLeague;home:string;away:string;matchAt:string;savedAt:string;
 sourceCount:number;model:'venue-v2-v3-fixed-2026-10-23';
 markets:FrozenWorkMarket[];
};
type BrasiliaClock={date:string;time:string};
const eligibleLeague=(x:unknown):x is WorkLeague=>
 x==='serie-a'||x==='la-liga'||x==='ligue-1'||x==='premier-league';
const datePattern=/^\d{4}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/;
const timePattern=/^([01]\d|2[0-3]):[0-5]\d$/;
const isoDate=(s:string)=>datePattern.test(s)&&!Number.isNaN(Date.parse(s))&&
 new Date(s).toISOString().slice(0,10)===s;
const identity=(league:WorkLeague,date:string,home:string,away:string)=>
 [league,date,normalizeTeam(home),normalizeTeam(away)].join('|');
const record=(x:unknown):x is Record<string,unknown>=>
 x!==null&&typeof x==='object'&&!Array.isArray(x);
const choice=(x:unknown)=>x==='Over'||x==='Under'||x==='Sem sinal';
function validateEntry(v:unknown):v is FrozenWorkForecast{
 if(!record(v)||typeof v.id!=='string'||!eligibleLeague(v.league)||
  typeof v.home!=='string'||!v.home.trim()||v.home.length>120||
  typeof v.away!=='string'||!v.away.trim()||v.away.length>120||
  normalizeTeam(v.home)===normalizeTeam(v.away)||
  typeof v.matchAt!=='string'||v.matchAt.length!==16||
  !isoDate(v.matchAt.slice(0,10))||v.matchAt[10]!=='T'||!timePattern.test(v.matchAt.slice(11))||
  v.id!==identity(v.league,v.matchAt.slice(0,10),v.home,v.away)||
  typeof v.savedAt!=='string'||Number.isNaN(Date.parse(v.savedAt))||
  v.model!=='venue-v2-v3-fixed-2026-10-23'||
  !Number.isSafeInteger(v.sourceCount)||Number(v.sourceCount)<0||
  !Array.isArray(v.markets)||v.markets.length!==venueV2Markets.length)return false;
 const saved=brasiliaDate(new Date(v.savedAt));
 if(saved.date+'T'+saved.time>=v.matchAt)return false;
 return venueV2Markets.every((market,i)=>{
  const m=v.markets[i];
  return record(m)&&m.marketId===market.id&&m.line===market.line&&
   typeof m.label==='string'&&m.label===market.label&&choice(m.v2)&&choice(m.v3)&&
   (m.baseline===null||m.baseline==='Over'||m.baseline==='Under')&&
   Number.isSafeInteger(m.historicalObserved)&&m.historicalObserved>=0&&
   (m.projectedTotal===null||(typeof m.projectedTotal==='number'&&Number.isFinite(m.projectedTotal)&&m.projectedTotal>=0))&&
   Array.isArray(m.failedChecks)&&m.failedChecks.every((x:unknown)=>
    x==='homeMean'||x==='awayMean'||x==='homeFrequency'||x==='awayFrequency');
 });
}
export function readFrozenWorkForecasts(raw:string|null):FrozenWorkForecast[]{
 if(raw===null)return [];
 let parsed:unknown;
 try{parsed=JSON.parse(raw);}catch{throw Error('Registros anteriores do Radar Work ilegíveis. Nenhum registro será substituído.');}
 if(!Array.isArray(parsed)||parsed.length>200||!parsed.every(validateEntry)||
  new Set(parsed.map((x:FrozenWorkForecast)=>x.id)).size!==parsed.length)
  throw Error('Registros antigos do Radar Work inconsistentes. Nada será substituído.');
 return parsed;
}
function actualTotal(m:WorkAnalysisMatch,metric:'goals'|'shots'|'target'):number{
 return m.full[metric][0]+m.full[metric][1];
}
export function freezeWorkForecast(
 matches:readonly WorkAnalysisMatch[],
 league:WorkLeague,home:string,away:string,
 matchAt:string,now=new Date(),
):FrozenWorkForecast{
 if(!eligibleLeague(league)||!home||!away||normalizeTeam(home)===normalizeTeam(away))
  throw Error('Escolha campeonato, mandante e visitante diferentes.');
 const day=matchAt.slice(0,10);
 if(matchAt.length!==16||matchAt[10]!=='T'||!isoDate(day)||
  !timePattern.test(matchAt.slice(11)))throw Error('Informe uma data e um horário de Brasília válidos.');
 const current=brasiliaDate(now);
 if(matchAt<=current.date+'T'+current.time)
  throw Error('Para registrar uma previsão, informe um confronto com início futuro.');
 const previous=matches.filter(m=>m.league===league&&m.date<day);
 const participants=new Set(previous.flatMap(m=>[m.home,m.away]));
 if(!participants.has(home)||!participants.has(away))
  throw Error('As equipes ainda não têm histórico Work nesta competição.');
 if(matches.some(m=>m.league===league&&m.date===day&&
  normalizeTeam(m.home)===normalizeTeam(home)&&
  normalizeTeam(m.away)===normalizeTeam(away)))
  throw Error('Esse confronto já consta como encerrado na pesquisa Work.');
 const view=workRadarData(previous,league);
 const h=view.teams.find(t=>t.name===home);
 const a=view.teams.find(t=>t.name===away);
 if(!h||!a)throw Error('Não foi possível reconhecer as equipes no histórico Work.');
 const fixture={home:h.id,away:a.id,date:day,competition:view.matches[0]?.competition??''};
 const projections=captureVenuePredictions(view,fixture);
 const markets:FrozenWorkMarket[]=projections.map(p=>{
  const market=venueV2Markets.find(m=>m.id===p.marketId&&m.line===p.line);
  if(!market)throw Error('Indicador Radar desconhecido.');
  const eligible=previous.map(m=>actualTotal(m,market.metric as 'goals'|'shots'|'target'));
  const over=eligible.filter(x=>x>p.line).length;
  const baseline:FrozenWorkMarket['baseline']=eligible.length?
   (2*over>=eligible.length?'Over':'Under'):null;
  return {...p,baseline,historicalObserved:eligible.length};
 });
 const out:FrozenWorkForecast={
  id:identity(league,day,home,away),league,home,away,
  matchAt,savedAt:now.toISOString(),
  sourceCount:previous.length,model:'venue-v2-v3-fixed-2026-10-23',markets
 };
 if(!validateEntry(out))throw Error('Sinais V2/V3 inválidos; nenhuma previsão foi salva.');
 return out;
}
export function appendFrozenWorkForecast(
 raw:string|null,forecast:FrozenWorkForecast
):FrozenWorkForecast[]{
 const saved=readFrozenWorkForecasts(raw);
 if(!validateEntry(forecast))throw Error('Previsão inválida, não registrada.');
 if(saved.some(x=>x.id===forecast.id))
  throw Error('Já existe uma previsão Work congelada para esse confronto. Ela não será sobrescrita.');
 if(saved.length>=200)throw Error('Limite de registros atingido. Exporte seus registros antes de continuar.');
 return [forecast,...saved];
}
export type WorkScore='Acertou'|'Errou'|'Sem sinal'|'N/D';
export type WorkProspectiveResult={
 status:'future'|'waiting'|'ambiguous'|'complete';
 actual:Record<string,number>;
 markets:{label:string;v2:WorkScore;v3:WorkScore;baseline:WorkScore}[];
};
const score=(decision:'Over'|'Under'|'Sem sinal'|null,actualOver:boolean):WorkScore=>
 decision===null?'N/D':decision==='Sem sinal'?'Sem sinal':
 ((decision==='Over')===actualOver?'Acertou':'Errou');
/** Read-only: results appear only after the fixture day and a new Work CSV is imported. */
export function settleFrozenWorkForecast(
 snapshot:FrozenWorkForecast,matches:readonly WorkAnalysisMatch[],
 clock:BrasiliaClock=brasiliaDate(),
):WorkProspectiveResult{
 const empty=(status:WorkProspectiveResult['status']):WorkProspectiveResult=>({
  status,actual:{},markets:[]
 });
 if(!validateEntry(snapshot))return empty('ambiguous');
 const day=snapshot.matchAt.slice(0,10);
 if(clock.date<=day)return empty('future');
 const found=matches.filter(m=>m.league===snapshot.league&&m.date===day&&
  normalizeTeam(m.home)===normalizeTeam(snapshot.home)&&
  normalizeTeam(m.away)===normalizeTeam(snapshot.away));
 if(!found.length)return empty('waiting');
 if(found.length!==1)return empty('ambiguous');
 const game=found[0];
 const actual:Record<string,number>={};
 const markets=snapshot.markets.map(p=>{
  const market=venueV2Markets.find(m=>m.id===p.marketId&&m.line===p.line);
  if(!market)throw Error('Modelo de mercado original indisponível.');
  const total=actualTotal(game,market.metric as 'goals'|'shots'|'target');
  actual[p.marketId]=total;
  return {label:p.label,
   v2:score(p.v2,total>p.line),
   v3:score(p.v3,total>p.line),
   baseline:score(p.baseline,total>p.line)
  };
 });
 return {status:'complete',actual,markets};
}
export type ProspectiveCounters={evaluated:number;pending:number;v2:{hits:number;signals:number};v3:{hits:number;signals:number};baseline:{hits:number;signals:number}};
export function scoreFrozenWorkForecasts(saved:readonly FrozenWorkForecast[],matches:readonly WorkAnalysisMatch[],clock:BrasiliaClock=brasiliaDate()):ProspectiveCounters{
 const r:ProspectiveCounters={evaluated:0,pending:0,
  v2:{hits:0,signals:0},v3:{hits:0,signals:0},baseline:{hits:0,signals:0}};
 for(const entry of saved){
  const settled=settleFrozenWorkForecast(entry,matches,clock);
  if(settled.status!=='complete'){r.pending++;continue;}
  r.evaluated++;
  for(const m of settled.markets){
   for(const k of ['v2','v3'] as const){
    if(m[k]==='Acertou'||m[k]==='Errou'){
     r[k].signals++;
     if(m[k]==='Acertou')r[k].hits++;
    }
   }
   // Compare baseline only when V3 emitted a signal, same market/game.
   if((m.v3==='Acertou'||m.v3==='Errou')&&
     (m.baseline==='Acertou'||m.baseline==='Errou')){
    r.baseline.signals++;
    if(m.baseline==='Acertou')r.baseline.hits++;
   }
  }
 }
 return r;
}

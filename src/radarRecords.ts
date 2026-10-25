import {normalizeTeam} from './calendar';
import type {RadarMarketResult} from './radar';
import type {SavedVenuePrediction} from './radarProspective';
import type {LeagueNumericMarket} from './radarNumericContext';

export type SavedRadarRecord={
  key:string; savedAt:string; matchAt:string; competition:string;
  home:string; away:string; homeCount:number; awayCount:number;
  markets:Pick<RadarMarketResult,'id'|'label'|'line'|'historyRate'|'observed'|'overs'|'historicalMean'>[];
  venue?:SavedVenuePrediction[];
  /** Frozen at registration; absent in legacy records, never reconstructed later. */
  leagueContext?:LeagueNumericMarket[];
};

const obj=(v:unknown):v is Record<string,unknown>=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const text=(v:unknown,max=180):v is string=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
const number=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
const rate=(v:unknown):v is number|null=>v===null||(number(v)&&v<=1);
const optionalNumber=(v:unknown):v is number|null=>v===null||number(v);
const validDate=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&
  !Number.isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
const matchTime=(s:string)=>/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(s)&&validDate(s.slice(0,10));
const decision=(v:unknown)=>v==='Over'||v==='Under'||v==='Sem sinal';
const validMarket=(v:unknown):v is SavedRadarRecord['markets'][number]=>
  obj(v)&&text(v.id)&&text(v.label)&&number(v.line)&&rate(v.historyRate)&&
  Number.isSafeInteger(v.observed)&&Number(v.observed)>=0&&
  Number.isSafeInteger(v.overs)&&Number(v.overs)>=0&&Number(v.overs)<=Number(v.observed)&&
  optionalNumber(v.historicalMean);
const validLeagueContext=(v:unknown):v is LeagueNumericMarket=>
  obj(v)&&text(v.id)&&optionalNumber(v.mean)&&
  Number.isSafeInteger(v.observed)&&Number(v.observed)>=0;
const validVenue=(v:unknown):v is SavedVenuePrediction=>
  obj(v)&&text(v.marketId)&&text(v.label)&&number(v.line)&&
  decision(v.v2)&&decision(v.v3)&&optionalNumber(v.projectedTotal)&&
  Array.isArray(v.failedChecks)&&v.failedChecks.length<=25;

/** The existing exported format is a plain JSON array. Reject malformed or
 * unexpectedly large files rather than changing any saved forecast. */
export function parseRadarRecords(input:unknown):SavedRadarRecord[]{
  if(!Array.isArray(input)||input.length>50)throw Error('Arquivo de previsões inválido. Selecione o JSON exportado pelo Radar.');
  const seenKeys=new Set<string>();
  return input.map((value,i)=>{
    if(!obj(value)||!text(value.key,128)||!text(value.savedAt,60)||
      !Number.isFinite(Date.parse(value.savedAt))||!text(value.matchAt,30)||!matchTime(value.matchAt)||
      !text(value.competition)||!text(value.home)||!text(value.away)||
      normalizeTeam(value.home)===normalizeTeam(value.away)||
      !Number.isSafeInteger(value.homeCount)||Number(value.homeCount)<0||
      !Number.isSafeInteger(value.awayCount)||Number(value.awayCount)<0||
      !Array.isArray(value.markets)||value.markets.length>25||!value.markets.every(validMarket)||
      (value.venue!==undefined&&(!Array.isArray(value.venue)||value.venue.length>20||!value.venue.every(validVenue)))||
      (value.leagueContext!==undefined&&(!Array.isArray(value.leagueContext)||value.leagueContext.length>8||
        !value.leagueContext.every(validLeagueContext)||
        new Set(value.leagueContext.map((x:LeagueNumericMarket)=>x.id)).size!==value.leagueContext.length))) {
      throw Error('Registro '+(i+1)+' inválido. Nenhuma previsão foi restaurada.');
    }
    if(seenKeys.has(value.key))throw Error('Arquivo contém identificadores repetidos. Nada foi restaurado.');
    seenKeys.add(value.key);
    return {
      key:value.key as string,savedAt:value.savedAt as string,matchAt:value.matchAt as string,
      competition:value.competition as string,home:value.home as string,away:value.away as string,
      homeCount:value.homeCount as number,awayCount:value.awayCount as number,
      markets:value.markets as SavedRadarRecord['markets'],
      ...(value.venue!==undefined?{venue:value.venue as SavedVenuePrediction[]}:{}),
      ...(value.leagueContext!==undefined?{leagueContext:value.leagueContext as LeagueNumericMarket[]}:{}),
    };
  });
}
export const recordIdentity=(r:Pick<SavedRadarRecord,'matchAt'|'competition'|'home'|'away'>)=>
 [r.matchAt.slice(0,10),r.competition,r.home,r.away].map(normalizeTeam).join('|');
/** Existing forecasts have precedence. Never silently replace an old snapshot. */
export function mergeRadarRecords(existing:SavedRadarRecord[],incoming:SavedRadarRecord[]){
 const seen=new Set(existing.map(recordIdentity));
 const keys=new Set(existing.map(r=>r.key));
 const added:SavedRadarRecord[]=[];
 let skipped=0;
 for(const record of incoming){
  const id=recordIdentity(record);
  if(seen.has(id)){skipped++;continue;}
  if(keys.has(record.key))throw Error('Conflito de identificador. Nada foi restaurado.');
  if(existing.length+added.length>=50){skipped++;continue;}
  seen.add(id);keys.add(record.key);added.push(record);
 }
 return {entries:[...existing,...added],added:added.length,skipped};
}

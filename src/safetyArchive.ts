/**
 * Full-fidelity offline archive of FutStats V4 local data.
 *
 * EXPORT ONLY. Never imports/writes or sends private/third-party statistics
 * to GitHub, Vercel or external servers.
 *
 * The legacy "fullBackup.ts" is intentionally unchanged; its legacy restore
 * format is separate, so these new files must NOT be passed to that importer.
 */
import {STORAGE,validData,type Data} from './model';
import {RADAR_STORAGE} from './fullBackup';
import {parseRadarRecords} from './radarRecords';
import {EUROPE_WORK_STORAGE,readEuropeWork} from './europeWorkResearch';
import {EUROPE_RESEARCH_STORAGE,readStoredEuropeanResearch} from './europeLeagueResearch';
import {FPL_WORK_STORAGE,readFplWork} from './fplWorkStore';
import {
 WORK_RADAR_PROSPECTIVE_STORAGE,readFrozenWorkForecasts
} from './workRadarProspective';
import {AUTO_WORK_RADAR_SETTING} from './workRadarAutoFixtures';
import {EUROPE_VERIFIED_WORK_OPT_IN} from './verifiedEuropeWorkFixtures';
import {CALENDAR_STORAGE,parseStoredCalendar} from './calendarStorage';

export const SAFETY_ARCHIVE_V1_FORMAT='futstats-v4-integral-seguro-v1';
export const SAFETY_ARCHIVE_FORMAT='futstats-v4-integral-seguro-v2';
export const SAFETY_V1_KEYS=[
 STORAGE,RADAR_STORAGE,EUROPE_RESEARCH_STORAGE,EUROPE_WORK_STORAGE,
 FPL_WORK_STORAGE,WORK_RADAR_PROSPECTIVE_STORAGE,
 AUTO_WORK_RADAR_SETTING,EUROPE_VERIFIED_WORK_OPT_IN
] as const;
export const SAFETY_KEYS=[...SAFETY_V1_KEYS,CALENDAR_STORAGE] as const;
type SafetyKey=typeof SAFETY_KEYS[number];
type LegacyKey=typeof SAFETY_V1_KEYS[number];
export type SafetyArchive={
 format:typeof SAFETY_ARCHIVE_FORMAT;version:2;exportedAt:string;
 stores:Record<SafetyKey,string|null>;
};
export type SafetyArchiveV1={
 format:typeof SAFETY_ARCHIVE_V1_FORMAT;version:1;exportedAt:string;
 stores:Record<LegacyKey,string|null>;
};
export type SafetyArchiveFile=SafetyArchive|SafetyArchiveV1;
export type SafetyStatus={
 key:SafetyKey;label:string;status:'ok'|'absent'|'invalid';
 count:number|null;error:string|null;
};
export type SafetyInspection={
 entries:SafetyStatus[];ok:boolean;present:number;missing:number;
 invalid:number;matches:number;workMatches:number;workForecasts:number;calendarFixtures:number;
};

const names:Record<SafetyKey,string>={
 [STORAGE]:'Histórico original',
 [RADAR_STORAGE]:'Previsões originais V2/V3',
 [EUROPE_RESEARCH_STORAGE]:'Resultados CC0 da Europa',
 [EUROPE_WORK_STORAGE]:'Pesquisas Work da Europa',
 [FPL_WORK_STORAGE]:'Pesquisas Work da Premier League',
 [WORK_RADAR_PROSPECTIVE_STORAGE]:'Testes prospectivos Radar Work',
 [AUTO_WORK_RADAR_SETTING]:'Preferência da automação Premier',
 [EUROPE_VERIFIED_WORK_OPT_IN]:'Preferência do piloto europeu',
 [CALENDAR_STORAGE]:'Agenda CSV local de confrontos'
};
const maxStoredValueBytes=15_000_000;
function inspectValue(key:SafetyKey,raw:string):number|null{
 if(raw.length>maxStoredValueBytes)
  throw Error('Registro acima do limite de segurança de 15 MB');
 switch(key){
  case STORAGE:{
   let decoded:unknown;
   try{decoded=JSON.parse(raw);}catch{throw Error('Histórico em formato JSON inválido');}
   if(!validData(decoded))throw Error('Histórico original não passou na validação');
   return (decoded as Data).matches.length;
  }
  case RADAR_STORAGE:{
   let decoded:unknown;
   try{decoded=JSON.parse(raw);}catch{throw Error('Previsões originais em formato inválido');}
   return parseRadarRecords(decoded).length;
  }
  case EUROPE_RESEARCH_STORAGE:return readStoredEuropeanResearch(raw).matches.length;
  case EUROPE_WORK_STORAGE:return readEuropeWork(raw).entries.length;
  case FPL_WORK_STORAGE:return readFplWork(raw).entries.length;
  case WORK_RADAR_PROSPECTIVE_STORAGE:return readFrozenWorkForecasts(raw).length;
  case CALENDAR_STORAGE:return parseStoredCalendar(raw).length;
  case AUTO_WORK_RADAR_SETTING:
  case EUROPE_VERIFIED_WORK_OPT_IN:
   if(raw!=='enabled')throw Error('Preferência automática não reconhecida');
   return null;
 }
}
export function inspectSafetyStorage(storage:Pick<Storage,'getItem'>):SafetyInspection{
 const entries:SafetyStatus[]=SAFETY_KEYS.map(key=>{
  const label=names[key];
  let raw:string|null=null;
  try{raw=storage.getItem(key);}
  catch{return{key,label,status:'invalid' as const,count:null,
    error:'Não foi possível ler o armazenamento do dispositivo'};}
  if(raw===null)return {key,label,status:'absent' as const,count:null,error:null};
  try{return {key,label,status:'ok' as const,count:inspectValue(key,raw),error:null};}
  catch(e){return {key,label,status:'invalid' as const,count:null,
   error:e instanceof Error?e.message:'Formato incompatível'};}
 });
 const find=(key:SafetyKey)=>entries.find(e=>e.key===key)?.count??0;
 return {
  entries,ok:entries.every(e=>e.status!=='invalid'),
  present:entries.filter(e=>e.status==='ok').length,
  missing:entries.filter(e=>e.status==='absent').length,
  invalid:entries.filter(e=>e.status==='invalid').length,
  matches:find(STORAGE),
  workMatches:find(EUROPE_WORK_STORAGE)+find(FPL_WORK_STORAGE),
  workForecasts:find(WORK_RADAR_PROSPECTIVE_STORAGE),
  calendarFixtures:find(CALENDAR_STORAGE)
 };
}

/**
 * Includes untouched raw contents, so the archive does not recompute
 * predictions or silently drop fields that parsers don't display.
 * Absence is preserved explicitly as null, not an empty fabricated store.
 */
export function createSafetyArchive(
 storage:Pick<Storage,'getItem'>,now=new Date()
):SafetyArchive{
 // Read one candidate snapshot and validate precisely THESE bytes. The old
 // inspect-then-reread flow could export a changed value that wasn't inspected.
 const stores={} as SafetyArchive['stores'];
 for(const key of SAFETY_KEYS){
  try{stores[key]=storage.getItem(key);}
  catch{throw Error('Falha de leitura de '+key+'. Nenhum arquivo foi criado.');}
 }
 const inspection=inspectSafetyStorage({
  getItem:(key:string)=>stores[key as SafetyKey]??null
 });
 if(!inspection.ok)
  throw Error('Foi encontrado um dado local inconsistente. O arquivo integral não foi criado para evitar uma cópia incompleta. Confira os avisos abaixo.');
 // localStorage cannot promise a multi-key atomic read. A second pass detects
 // a change while the snapshot was captured; never silently export stale or
 // inconsistent bytes. The archive keeps the exact validated first pass.
 for(const key of SAFETY_KEYS){
  let current:string|null;
  try{current=storage.getItem(key);}
  catch{throw Error('A leitura de '+key+' mudou durante o backup. Nenhum arquivo foi criado.');}
  if(current!==stores[key])
   throw Error('Os dados locais mudaram durante o backup ('+key+'). Nenhum arquivo foi criado.');
 }
 return {
  format:SAFETY_ARCHIVE_FORMAT,version:2,
  exportedAt:now.toISOString(),stores
 };
}
/** Validate either V4 v1 (eight stores) or v2 (nine) without writes. */
export function inspectSafetyArchive(data:unknown):SafetyInspection{
 if(!data||typeof data!=='object'||Array.isArray(data))
  throw Error('Arquivo de segurança inválido.');
 const v=data as Partial<SafetyArchiveFile>;
 const legacy=v.format===SAFETY_ARCHIVE_V1_FORMAT&&v.version===1;
 const latest=v.format===SAFETY_ARCHIVE_FORMAT&&v.version===2;
 if(!legacy&&!latest)
  throw Error('Versão do arquivo de segurança desconhecida.');
 if(typeof v.exportedAt!=='string'||!Number.isFinite(Date.parse(v.exportedAt))||
    !v.stores||typeof v.stores!=='object'||Array.isArray(v.stores))
  throw Error('Arquivo de segurança inválido ou incompleto.');
 const keys:readonly string[]=legacy?SAFETY_V1_KEYS:SAFETY_KEYS;
 const stores=v.stores as Record<string,unknown>;
 if(Object.keys(stores).length!==keys.length||
    Object.keys(stores).some(k=>!keys.includes(k)))
  throw Error('Arquivo de segurança contém grupos ausentes ou desconhecidos.');
 for(const key of keys){
  if(!Object.hasOwn(stores,key)||
    stores[key]!==null&&typeof stores[key]!=='string')
   throw Error('Campo de armazenamento inválido: '+key);
 }
 const report=inspectSafetyStorage({
  getItem:(key:string)=>{
   // v1 never had a calendar group. Preserve it as ABSENT, not [].
   return keys.includes(key)?stores[key] as string|null:null;
  }
 });
 if(!report.ok)throw Error('Um dos arquivos internos não passou na validação.');
 return report;
}

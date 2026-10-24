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

export const SAFETY_ARCHIVE_FORMAT='futstats-v4-integral-seguro-v1';
export const SAFETY_KEYS=[
 STORAGE,RADAR_STORAGE,EUROPE_RESEARCH_STORAGE,EUROPE_WORK_STORAGE,
 FPL_WORK_STORAGE,WORK_RADAR_PROSPECTIVE_STORAGE,
 AUTO_WORK_RADAR_SETTING,EUROPE_VERIFIED_WORK_OPT_IN
] as const;
type SafetyKey=typeof SAFETY_KEYS[number];
export type SafetyArchive={
 format:typeof SAFETY_ARCHIVE_FORMAT;version:1;exportedAt:string;
 stores:Record<SafetyKey,string|null>;
};
export type SafetyStatus={
 key:SafetyKey;label:string;status:'ok'|'absent'|'invalid';
 count:number|null;error:string|null;
};
export type SafetyInspection={
 entries:SafetyStatus[];ok:boolean;present:number;missing:number;
 invalid:number;matches:number;workMatches:number;workForecasts:number;
};

const names:Record<SafetyKey,string>={
 [STORAGE]:'Histórico original',
 [RADAR_STORAGE]:'Previsões originais V2/V3',
 [EUROPE_RESEARCH_STORAGE]:'Resultados CC0 da Europa',
 [EUROPE_WORK_STORAGE]:'Pesquisas Work da Europa',
 [FPL_WORK_STORAGE]:'Pesquisas Work da Premier League',
 [WORK_RADAR_PROSPECTIVE_STORAGE]:'Testes prospectivos Radar Work',
 [AUTO_WORK_RADAR_SETTING]:'Preferência da automação Premier',
 [EUROPE_VERIFIED_WORK_OPT_IN]:'Preferência do piloto europeu'
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
  workForecasts:find(WORK_RADAR_PROSPECTIVE_STORAGE)
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
 const inspection=inspectSafetyStorage(storage);
 if(!inspection.ok)
  throw Error('Foi encontrado um dado local inconsistente. O arquivo integral não foi criado para evitar uma cópia incompleta. Confira os avisos abaixo.');
 const stores={} as SafetyArchive['stores'];
 for(const key of SAFETY_KEYS)stores[key]=storage.getItem(key);
 return {
  format:SAFETY_ARCHIVE_FORMAT,version:1,
  exportedAt:now.toISOString(),stores
 };
}
/** Validate a candidate off-device archive without restoring or mutating anything. */
export function inspectSafetyArchive(data:unknown):SafetyInspection{
 if(!data||typeof data!=='object'||Array.isArray(data))
  throw Error('Arquivo de segurança inválido.');
 const v=data as Partial<SafetyArchive>;
 if(v.format!==SAFETY_ARCHIVE_FORMAT||v.version!==1||
  typeof v.exportedAt!=='string'||!Number.isFinite(Date.parse(v.exportedAt))||
  !v.stores||typeof v.stores!=='object'||Array.isArray(v.stores)||
  Object.keys(v.stores).length!==SAFETY_KEYS.length||
  Object.keys(v.stores).some(k=>!SAFETY_KEYS.includes(k as SafetyKey)))
  throw Error('Formato de segurança desconhecido ou arquivo incompleto.');
 for(const key of SAFETY_KEYS){
  const value=v.stores[key];
  if(value!==null&&typeof value!=='string')
   throw Error('Campo de armazenamento inválido: '+key);
 }
 const report=inspectSafetyStorage({
  getItem:(key:string)=>v.stores?.[key as SafetyKey]??null
 });
 if(!report.ok)throw Error('Um dos arquivos internos não passou na validação.');
 return report;
}

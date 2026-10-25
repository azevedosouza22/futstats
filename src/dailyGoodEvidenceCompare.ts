/**
 * Compare a USER-SUPPLIED documentary transcription with a local CSV result.
 *
 * Never fetches a web page, verifies a remote source's actual contents,
 * changes saved Radar snapshots or calculates prediction success. An agreement
 * between two entered numbers is NOT independently verified evidence.
 */
import {normalizeTeam} from './calendar';
import type {SavedRadarRecord} from './radarRecords';
import type {PickAuditReport} from './dailyGoodAudit';

export const DOCUMENTARY_COMPARISON_FORMAT='futstats-segunda-fonte-informada-v1' as const;
type EvidenceMarket={id:string;actual:number};
export type ExternalEvidence={
 format:typeof DOCUMENTARY_COMPARISON_FORMAT;
 recordKey:string;matchAt:string;competition:string;home:string;away:string;
 checkedAt:string;sourceUrl:string;indicators:EvidenceMarket[];
};
export type DocumentaryMarket={
 id:string;label:string;local:number|null;reported:number|null;
 status:'COINCIDE'|'DIVERGE'|'N/D';
};
export type DocumentaryComparison={
 recordKey:string;fixture:string;sourceUrl:string;checkedAt:string;
 markets:DocumentaryMarket[];
 agreement:number;disagreement:number;unknown:number;
 conclusion:'DOCUMENTAÇÃO INFORMADA — NÃO VERIFICADA NA WEB';
};

const o=(v:unknown):v is Record<string,unknown>=>
 v!==null&&typeof v==='object'&&!Array.isArray(v);
const exactKeys=(v:Record<string,unknown>,keys:string[])=>
 Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const text=(v:unknown,max=200):v is string=>
 typeof v==='string'&&v.trim().length>0&&v.length<=max;
const utc=(v:unknown):v is string=>
 typeof v==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(v)&&
 Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
const knownSecondHosts=new Set([
 'www.sofascore.com','www.espn.com.br','www.espn.com','www.fotmob.com'
]);
const trustedSecondSource=(s:string):boolean=>{
 try{
  const u=new URL(s);
  return u.protocol==='https:'&&!u.username&&!u.password&&
   knownSecondHosts.has(u.hostname.toLowerCase())&&u.pathname.length>1;
 }catch{return false;}
};
const originalHost=(s:string|null):string|null=>{
 if(!s)return null;
 try{return new URL(s).hostname.toLowerCase();}catch{return null;}
};

/** Strict format with no "verified" field; fill from an actual independent
 * source manually or through a future authenticated tool, never fake it.
 * Reading/parsing the format NEVER asserts the source URL was opened.
 */
export function parseDocumentaryEvidence(input:unknown,now=new Date()):ExternalEvidence{
 if(!o(input)||!exactKeys(input,[
  'format','recordKey','matchAt','competition','home','away',
  'checkedAt','sourceUrl','indicators'
 ]))throw Error('Modelo de segunda fonte incompatível; nenhuma alteração realizada.');
 if(input.format!==DOCUMENTARY_COMPARISON_FORMAT||
    !text(input.recordKey,128)||!text(input.competition)||
    !text(input.home)||!text(input.away)||!text(input.sourceUrl,700)||
    !/^\d{4}-\d\d-\d\dT(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(String(input.matchAt))||
    !utc(input.checkedAt)||!trustedSecondSource(input.sourceUrl))
  throw Error('Identidade, data ou domínio da segunda fonte inválidos.');
 const cutoff=Date.parse(input.matchAt+'-03:00')+120*60*1000;
 const checked=Date.parse(input.checkedAt);
 if(!Number.isFinite(cutoff)||checked<cutoff||checked>now.getTime())
  throw Error('A conferência deve ocorrer após a partida (+120 min), nunca no futuro.');
 if(!Array.isArray(input.indicators)||input.indicators.length<1||input.indicators.length>3)
  throw Error('Informe de 1 a 3 indicadores, sem inventar valores ausentes.');
 const seen=new Set<string>();
 for(const v of input.indicators){
  if(!o(v)||!exactKeys(v,['id','actual'])||!text(v.id,100)||
     !Number.isSafeInteger(v.actual)||Number(v.actual)<0||seen.has(v.id))
   throw Error('Indicadores inválidos ou repetidos; nenhuma comparação gerada.');
  seen.add(v.id);
 }
 return input as ExternalEvidence;
}

/** Template is intentionally INCOMPLETE (null and empty placeholders).
 * A template cannot be accepted by parseDocumentaryEvidence as proof.
 */
export function documentaryTemplate(record:SavedRadarRecord,report:PickAuditReport):string{
 const row=report.rows.find(r=>r.key===record.key);
 if(!record.goodPicks||!row||row.status!=='scored'||!row.markets.some(m=>m.actual!==null))
  throw Error('Esta partida não está pronta para comparar fontes.');
 return JSON.stringify({
  format:DOCUMENTARY_COMPARISON_FORMAT,recordKey:record.key,
  matchAt:record.matchAt,competition:record.competition,
  home:record.home,away:record.away,checkedAt:'',sourceUrl:'',
  indicators:row.markets.filter(m=>m.actual!==null).map(m=>({id:m.id,actual:null}))
 },null,2)+'\n';
}

/** Reconcile only a valid, explicitly saved prospective snapshot and
 * a structurally accepted local result. No predictions or denominators change.
 */
export function reconcileDocumentaryEvidence(
 evidence:ExternalEvidence,records:readonly SavedRadarRecord[],report:PickAuditReport
):DocumentaryComparison{
 if(records.length!==report.rows.length)
  throw Error('Auditoria e registros divergentes; nada foi comparado.');
 const index=records.findIndex(r=>r.key===evidence.recordKey);
 if(index<0)throw Error('Nenhum registro salvo corresponde à segunda fonte.');
 const record=records[index],row=report.rows[index];
 if(row.key!==record.key||!record.goodPicks||row.status!=='scored'||
  !row.markets.some(m=>m.actual!==null))
  throw Error('Registro sem resultado local elegível à comparação.');
 if(evidence.matchAt!==record.matchAt||
  evidence.competition!==record.competition||
  normalizeTeam(evidence.home)!==normalizeTeam(record.home)||
  normalizeTeam(evidence.away)!==normalizeTeam(record.away))
  throw Error('Partida, campeonato ou horário divergentes; comparação recusada.');
 if(originalHost(evidence.sourceUrl)===originalHost(row.sourceUrl)||
    !row.sourceUrl)
  throw Error('A segunda fonte deve ser diferente da origem do CSV local.');
 const localIds=new Set(row.markets.map(m=>m.id));
 if(evidence.indicators.some(m=>!localIds.has(m.id)))
  throw Error('Indicador externo não pertence à previsão congelada.');
 const reported=new Map(evidence.indicators.map(m=>[m.id,m.actual]));
 const markets:DocumentaryMarket[]=row.markets.map(m=>{
  const value=reported.get(m.id)??null;
  return {id:m.id,label:m.label,local:m.actual,reported:value,
   status:m.actual===null||value===null?'N/D'
    :m.actual===value?'COINCIDE':'DIVERGE'};
 });
 return {recordKey:record.key,fixture:record.home+' × '+record.away,
  sourceUrl:evidence.sourceUrl,checkedAt:evidence.checkedAt,markets,
  agreement:markets.filter(m=>m.status==='COINCIDE').length,
  disagreement:markets.filter(m=>m.status==='DIVERGE').length,
  unknown:markets.filter(m=>m.status==='N/D').length,
  conclusion:'DOCUMENTAÇÃO INFORMADA — NÃO VERIFICADA NA WEB'};
}

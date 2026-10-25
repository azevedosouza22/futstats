/**
 * Portable review packet for ONE user-provided comparison.
 * SHA-256 detects accidental mismatch with the local record/audit. It is NOT
 * a signature, online verification, proof of source access or proof of outcome.
 * Entirely local; no network/storage writes or automatic result collection.
 */
import type {SavedRadarRecord} from './radarRecords';
import type {PickAuditReport,PickAuditRow} from './dailyGoodAudit';
import {
 parseDocumentaryEvidence,reconcileDocumentaryEvidence,
 type ExternalEvidence,type DocumentaryComparison
} from './dailyGoodEvidenceCompare';

export const DOSSIER_FORMAT='futstats-dossie-comparacao-documental-v1' as const;
export const DOSSIER_WARNING='DOCUMENTAÇÃO INFORMADA — NÃO VERIFICADA NA WEB' as const;
type Core={
 format:typeof DOSSIER_FORMAT;exportedAt:string;
 originalRecord:SavedRadarRecord;localAuditRow:PickAuditRow;
 secondarySource:ExternalEvidence;comparison:DocumentaryComparison;
 independentVerification:'PENDENTE';warning:typeof DOSSIER_WARNING;
};
export type DocumentaryDossier=Core&{sha256:string};

const object=(x:unknown):x is Record<string,unknown>=>
 x!==null&&typeof x==='object'&&!Array.isArray(x);
const exactly=(x:Record<string,unknown>,keys:readonly string[])=>
 Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const isUtc=(v:unknown):v is string=>typeof v==='string'&&
 /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(v)&&
 Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
const canonical=(v:unknown)=>JSON.stringify(v);
async function digest(s:string):Promise<string>{
 if(typeof crypto==='undefined'||!crypto.subtle)
  throw Error('Este dispositivo não permite calcular SHA-256 seguro.');
 const bytes=new TextEncoder().encode(s);
 const hashed=await crypto.subtle.digest('SHA-256',bytes);
 return Array.from(new Uint8Array(hashed),n=>n.toString(16).padStart(2,'0')).join('');
}
function locate(records:readonly SavedRadarRecord[],report:PickAuditReport,key:string){
 if(report.rows.length!==records.length)
  throw Error('A auditoria não corresponde à lista de previsões atuais.');
 const index=records.findIndex(r=>r.key===key);
 if(index<0||records.filter(r=>r.key===key).length!==1)
  throw Error('Registro ausente ou duplicado neste dispositivo.');
 const record=records[index],row=report.rows[index];
 if(row.key!==key||!record.goodPicks||row.status!=='scored'||!row.sourceUrl)
  throw Error('Registro não elegível para dossiê documental.');
 return {record,row};
}

/** Returns a new JSON file, never touches the original prediction or CSV. */
export async function createDocumentaryDossier(
 input:ExternalEvidence,records:readonly SavedRadarRecord[],report:PickAuditReport,
 now=new Date()
):Promise<string>{
 const source=parseDocumentaryEvidence(input,now);
 const {record,row}=locate(records,report,source.recordKey);
 const comparison=reconcileDocumentaryEvidence(source,records,report);
 const core:Core={
  format:DOSSIER_FORMAT,exportedAt:now.toISOString(),
  originalRecord:record,localAuditRow:row,secondarySource:source,
  comparison,independentVerification:'PENDENTE',warning:DOSSIER_WARNING
 };
 const sha256=await digest(canonical(core));
 return JSON.stringify({...core,sha256},null,2)+'\n';
}

/** Rechecks the packet, then compares to CURRENT local snapshots.
 * The hash is unkeyed: it detects accidental changes, NOT deliberate forgery.
 * Even a completely matching packet is still UNVERIFIED EXTERNALLY.
 */
export async function inspectDocumentaryDossier(
 input:unknown,records:readonly SavedRadarRecord[],report:PickAuditReport,
 now=new Date()
):Promise<{comparison:DocumentaryComparison;source:ExternalEvidence;integrity:'CONSISTENTE';warning:typeof DOSSIER_WARNING}>{
 if(!object(input)||!exactly(input,[
  'format','exportedAt','originalRecord','localAuditRow','secondarySource',
  'comparison','independentVerification','warning','sha256'
 ])||input.format!==DOSSIER_FORMAT||input.warning!==DOSSIER_WARNING||
    input.independentVerification!=='PENDENTE'||!isUtc(input.exportedAt)||
    Date.parse(input.exportedAt)>now.getTime()||
    typeof input.sha256!=='string'||!/^[a-f0-9]{64}$/.test(input.sha256))
  throw Error('Dossiê inválido ou com alegação de verificação não autorizada.');
 const {sha256,...core}=input;
 const actual=await digest(canonical(core));
 if(actual!==sha256)
  throw Error('Conteúdo do dossiê foi alterado; integridade SHA-256 falhou.');
 const source=parseDocumentaryEvidence(input.secondarySource,now);
 const {record,row}=locate(records,report,source.recordKey);
 if(canonical(input.originalRecord)!==canonical(record)||
    canonical(input.localAuditRow)!==canonical(row))
  throw Error('Dossiê não corresponde ao registro ou resultado CSV local atual.');
 const calculated=reconcileDocumentaryEvidence(source,records,report);
 if(canonical(input.comparison)!==canonical(calculated))
  throw Error('Comparação do dossiê é incompatível com as evidências informadas.');
 return {comparison:calculated,source,integrity:'CONSISTENTE',warning:DOSSIER_WARNING};
}

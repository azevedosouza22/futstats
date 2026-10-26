/**
 * Quick-entry adapter for a USER-TRANSCRIBED second result source.
 * Reuses the same strict parser and reconciler as the documented JSON flow.
 * Never visits sources, validates external facts, or mutates forecast storage.
 */
import type {SavedRadarRecord} from './radarRecords';
import type {PickAuditReport} from './dailyGoodAudit';
import {DOCUMENTARY_COMPARISON_FORMAT,parseDocumentaryEvidence,
 reconcileDocumentaryEvidence,type DocumentaryComparison,type ExternalEvidence
} from './dailyGoodEvidenceCompare';

export type QuickEvidenceInput={
 recordKey:string;sourceUrl:string;checkedAtBrasilia:string;
 values:Readonly<Record<string,string>>;
};

/** The user chooses the Brasília wall-clock check time (UTC-3). We do NOT
 * silently stamp now, infer a provider result or supply unknown values.
 */
function enteredBrasiliaAsUtc(s:string):string{
 if(!/^\d{4}-\d\d-\d\dT(?:[01]\d|2[0-3]):[0-5]\d$/.test(s))
  throw Error('Informe a data e hora real da consulta em Brasília.');
 const t=Date.parse(s+':00-03:00');
 if(!Number.isFinite(t)||!new Date(t).toISOString())
  throw Error('Data da consulta inválida.');
 const iso=new Date(t).toISOString();
 // Reject silently normalized impossible dates such as 31 February.
 const formatter=new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Sao_Paulo',
  year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
 const parts=Object.fromEntries(formatter.formatToParts(new Date(t))
  .filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
 if(parts.year+'-'+parts.month+'-'+parts.day+'T'+parts.hour+':'+parts.minute!==s)
  throw Error('Data da consulta inválida.');
 return iso;
}

export function compareQuickEnteredSource(
 input:QuickEvidenceInput,records:readonly SavedRadarRecord[],
 report:PickAuditReport,now=new Date()
):{source:ExternalEvidence;comparison:DocumentaryComparison}{
 if(records.length!==report.rows.length)
  throw Error('Registros e auditoria divergentes. Nenhuma comparação realizada.');
 const index=records.findIndex(r=>r.key===input.recordKey);
 if(index<0)throw Error('Selecione uma indicação salva existente.');
 const record=records[index],row=report.rows[index];
 if(row.key!==record.key||!record.goodPicks||row.status!=='scored'||
    !row.markets.some(m=>m.actual!==null))
  throw Error('A indicação não está pronta para comparar resultados.');
 // Compare ONLY frozen market ids whose local result is known.
 // Empty input is N/D: do not copy the local CSV value as a shortcut.
 const permitted=new Set(row.markets.filter(m=>m.actual!==null).map(m=>m.id));
 const indicators: {id:string;actual:number}[]=[];
 for(const [id,raw] of Object.entries(input.values)){
  if(!permitted.has(id))throw Error('Indicador informado não pertence ao resultado original.');
  if(raw==='')continue;
  if(!/^(0|[1-9]\d*)$/.test(raw)||!Number.isSafeInteger(Number(raw)))
   throw Error('Digite quantidades inteiras positivas ou zero; deixe vazio quando N/D.');
  indicators.push({id,actual:Number(raw)});
 }
 const filled:ExternalEvidence={
  format:DOCUMENTARY_COMPARISON_FORMAT,recordKey:record.key,
  matchAt:record.matchAt,competition:record.competition,
  home:record.home,away:record.away,checkedAt:enteredBrasiliaAsUtc(input.checkedAtBrasilia),
  sourceUrl:input.sourceUrl.trim(),indicators
 };
 const source=parseDocumentaryEvidence(filled,now);
 const comparison=reconcileDocumentaryEvidence(source,records,report);
 return {source,comparison};
}

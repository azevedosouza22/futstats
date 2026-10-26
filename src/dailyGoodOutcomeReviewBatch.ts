/**
 * Etapa 70: one-click, strictly LOCAL, minimum-data package for human or
 * explicitly requested assistant research into genuinely independent results.
 * This is not an API, an authenticated timestamp, an external verification
 * service, a prediction accuracy calculation, or a backup/restore format.
 */
import {normalizeTeam} from './calendar';
import type {SavedRadarRecord} from './radarRecords';
import type {PickAuditReport} from './dailyGoodAudit';
import type {ExternalReviewQueue} from './dailyGoodIndependentReview';
import type {FrozenResultTrace} from './dailyGoodFrozenResultTrace';

export const OUTCOME_REVIEW_BATCH_FORMAT='futstats-conferencia-independente-lote-v1' as const;
export type OutcomeReviewEntry={
 recordKey:string;competition:string;home:string;away:string;
 matchAtBrasilia:string;savedAtUtc:string;
 calendarSource:{url:string;verifiedAt:string};
 localCsv:{matchId:string;providerSourceId:string;provider:string;
   importedAtUtc:string;url:string};
 frozenSignals:{id:string;label:string;direction:'Over'|'Under';
   line:number;localActual:number|null}[];
 externalVerification:'PENDENTE';
};
export type OutcomeReviewBatch={
 format:typeof OUTCOME_REVIEW_BATCH_FORMAT;exportedAtUtc:string;
 purpose:'INSUMO PARA CONFERENCIA EXTERNA — NAO E RESULTADO VALIDADO';
 externallyVerified:0;externalStatus:'PENDENTE';
 minimumVerifiedFixturesPerLeague:30;
 count:number;skipped:{awaitKickoff:number;noLocalResult:number;excluded:number};
 records:OutcomeReviewEntry[];
};

const identity=(r:SavedRadarRecord)=>[
 r.competition,r.matchAt,normalizeTeam(r.home),normalizeTeam(r.away)
].join('|');
const reject=(reason:string):never=>{
 throw Error('Lote recusado: '+reason+'. Nada foi validado ou modificado.');
};

/** Uses only the original frozen snapshot, current strict local audit and
 * source-ID trace. Never invents a fixture result from a URL or file name.
 * Rejects record/queue/trace drift instead of silently dropping candidates.
 */
export function prepareOutcomeReviewBatch(
 records:readonly SavedRadarRecord[],report:PickAuditReport,
 queue:ExternalReviewQueue,traces:readonly FrozenResultTrace[],now=new Date()
):OutcomeReviewBatch{
 if(records.length!==report.rows.length||traces.length!==report.attributed||
    queue.entries.length!==report.attributed)
  reject('auditoria, fila e previsões divergentes');
 const byRecord=new Map(records.map((r,i)=>[r.key,{r,row:report.rows[i]}]));
 const byQueue=new Map(queue.entries.map(e=>[e.key,e]));
 const byTrace=new Map(traces.map(t=>[t.key,t]));
 if(byRecord.size!==records.length||byQueue.size!==queue.entries.length||
    byTrace.size!==traces.length)
  reject('identificadores duplicados');
 const exported:OutcomeReviewEntry[]=[];
 const fixtureIds=new Set<string>(),sourceIds=new Set<string>();
 for(const entry of queue.entries){
  if(entry.state!=='check_external')continue;
  const paired=byRecord.get(entry.key),trace=byTrace.get(entry.key);
  if(!paired||!trace)reject('resultado sem previsão congelada');
  const {r,row}=paired!;
  if(!r.goodPicks||r.key!==row.key||row.status!=='scored'||
    trace.status!=='scored'||trace.localStatus!=='CSV_LOCAL_DOCUMENTADO'||
    entry.auditStatus!=='scored'||entry.externalCheck!=='PENDENTE'||
    trace.independentVerification!=='PENDENTE'||
    trace.key!==r.key||trace.matchAt!==r.matchAt||
    trace.competition!==r.competition||trace.home!==r.home||trace.away!==r.away||
    entry.matchAt!==r.matchAt||entry.competition!==r.competition||
    entry.home!==r.home||entry.away!==r.away||
    trace.resultUrl!==row.sourceUrl||!trace.resultSourceId||
    !trace.resultImportedAt||!trace.resultMatchId||!trace.resultProvider||
    !r.goodPicks.sourceUrl||!r.goodPicks.verifiedAt)
   reject('partida ou procedência CSV inconsistente');
  // Local timestamps are only declarations, never proof of real chronology.
  const kickoff=Date.parse(r.matchAt+'-03:00');
  const saved=Date.parse(r.savedAt);
  if(!Number.isFinite(kickoff)||!Number.isFinite(saved)||saved>=kickoff)
   reject('previsão não anterior ao jogo');
  if(fixtureIds.has(identity(r)))reject('mesmo confronto repetido');
  fixtureIds.add(identity(r));
  const csvId=trace.resultProvider+'|'+trace.resultSourceId;
  if(sourceIds.has(csvId))reject('mesmo ID de resultado reutilizado');
  sourceIds.add(csvId);
  const signals=r.goodPicks.signals.map(s=>{
   const local=trace.markets.find(m=>m.id===s.id);
   if(!local||local.direction!==s.direction||local.line!==s.line)
    reject('mercado congelado divergente');
   return {id:s.id,label:s.label,direction:s.direction,line:s.line,
     localActual:local!.actual};
  });
  if(!signals.some(s=>s.localActual!==null))
   reject('nenhum indicador local pontuável');
  exported.push({recordKey:r.key,competition:r.competition,home:r.home,
   away:r.away,matchAtBrasilia:r.matchAt,savedAtUtc:r.savedAt,
   calendarSource:{url:r.goodPicks.sourceUrl,verifiedAt:r.goodPicks.verifiedAt},
   localCsv:{matchId:trace.resultMatchId!,providerSourceId:trace.resultSourceId!,
    provider:trace.resultProvider!,importedAtUtc:trace.resultImportedAt!,
    url:trace.resultUrl!},
   frozenSignals:signals,externalVerification:'PENDENTE'});
 }
 if(exported.length!==queue.checkExternal)
  reject('quantidade da fila e do lote divergente');
 exported.sort((a,b)=>a.competition.localeCompare(b.competition,'pt-BR')||
    a.matchAtBrasilia.localeCompare(b.matchAtBrasilia)||a.recordKey.localeCompare(b.recordKey));
 return {format:OUTCOME_REVIEW_BATCH_FORMAT,exportedAtUtc:now.toISOString(),
  purpose:'INSUMO PARA CONFERENCIA EXTERNA — NAO E RESULTADO VALIDADO',
  externallyVerified:0,externalStatus:'PENDENTE',
  minimumVerifiedFixturesPerLeague:30,count:exported.length,
  skipped:{awaitKickoff:queue.awaitKickoff,noLocalResult:queue.needLocalResult,
   excluded:queue.excluded},records:exported};
}
export function exportOutcomeReviewBatchJson(batch:OutcomeReviewBatch):string{
 return JSON.stringify(batch,null,2)+'\n';
}

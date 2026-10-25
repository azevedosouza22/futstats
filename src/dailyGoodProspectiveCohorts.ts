/**
 * Etapa 52: conservative, read-only local cohort map by championship.
 * Observing a saved pre-kickoff timestamp or documented CSV outcome in the
 * browser is NOT independent validation, nor proof that the timestamp is true.
 * No web verification implementation exists: confirmed external = ZERO.
 */
import {normalizeTeam} from './calendar';
import type {SavedRadarRecord} from './radarRecords';
import type {PickAuditReport,PickAuditStatus} from './dailyGoodAudit';
import type {ExternalReviewQueue,ExternalReviewState} from './dailyGoodIndependentReview';

export const MIN_EXTERNAL_FIXTURES_PER_LEAGUE=30 as const;
export type ProspectiveCohortLeague={
 league:string;attributed:number;eligibleLocal:number;
 localResults:number;needsLocalResult:number;awaitKickoff:number;excluded:number;
 externalPending:number;externalVerified:0;missingExternal:number;
 readyForModelValidation:false;
};
export type ProspectiveCohortPlan={
 leagues:ProspectiveCohortLeague[];totalAttributed:number;
 totalEligibleLocal:number;totalLocalResults:number;
 totalExternalVerified:0;externalValidation:'PENDENTE';
};

const eligible=new Set<PickAuditStatus>(['future','waiting','source_missing','scored']);
function csvCell(value:string):string{
 const escaped=/^[\s\u0000-\u001f]*[=+\-@]/u.test(value)?"'"+value:value;
 return '"'+escaped.replace(/"/g,'""')+'"';
}

/** Fail closed on report/queue drift, duplicate keys and duplicate distinct
 * fixtures. No independent result is ever inferred from a CSV, a second-source
 * JSON user submitted, or a SHA-256 of that user-submitted evidence.
 */
export function buildProspectiveCohortPlan(
 records:readonly SavedRadarRecord[],report:PickAuditReport,
 queue:ExternalReviewQueue
):ProspectiveCohortPlan{
 if(records.length!==report.rows.length)
  throw Error('Amostra: registros e auditoria divergem. Nada foi validado.');
 const byKey=new Map(queue.entries.map(e=>[e.key,e]));
 if(byKey.size!==queue.entries.length)
  throw Error('Amostra: revisão com registros repetidos. Nada foi validado.');
 const uniqueKeys=new Set<string>();
 const leagues=new Map<string,ProspectiveCohortLeague>();
 const eligibleIdentities=new Set<string>();
 let attributed=0;
 for(let i=0;i<records.length;i++){
  const rec=records[i],row=report.rows[i];
  if(uniqueKeys.has(rec.key)||rec.key!==row.key||
    rec.competition!==row.competition||rec.matchAt!==row.matchAt||
    rec.home!==row.home||rec.away!==row.away)
   throw Error('Amostra: identidade ou ordem divergente. Nada foi validado.');
  uniqueKeys.add(rec.key);
  if(!rec.goodPicks){
   if(row.status!=='legacy'||byKey.has(rec.key))
    throw Error('Amostra: previsão Radar legado atribuída à lista.');
   continue;
  }
  if(row.status==='legacy')throw Error('Amostra: origem da indicação ausente.');
  attributed++;
  const review=byKey.get(rec.key);
  if(!review||review.competition!==row.competition||
    review.matchAt!==row.matchAt||review.auditStatus!==row.status||
    review.externalCheck!=='PENDENTE')
   throw Error('Amostra: fila de revisão divergente ou sem pendência.');
  const group=leagues.get(row.competition)??{
   league:row.competition,attributed:0,eligibleLocal:0,
   localResults:0,needsLocalResult:0,awaitKickoff:0,excluded:0,
   externalPending:0,externalVerified:0 as const,
   missingExternal:MIN_EXTERNAL_FIXTURES_PER_LEAGUE,
   readyForModelValidation:false as const
  };
  if(!leagues.has(row.competition))leagues.set(row.competition,group);
  group.attributed++;
  if(eligible.has(row.status)){
   const identity=[row.matchAt.slice(0,10),row.competition,row.home,row.away]
    .map(normalizeTeam).join('|');
   if(eligibleIdentities.has(identity))
    throw Error('Amostra: confronto duplicado entre elegíveis.');
   eligibleIdentities.add(identity);
   group.eligibleLocal++;
  }
  if(review.state==='excluded'){
   if(!['invalid','late','ambiguous'].includes(row.status))
    throw Error('Amostra: exclusão incompatível.');
   group.excluded++;
  }else if(review.state==='await_kickoff'){
   group.awaitKickoff++;
  }else if(review.state==='need_local_result'){
   group.needsLocalResult++;
  }else if(review.state==='check_external'){
   if(row.status!=='scored'||!row.markets.some(m=>m.actual!==null))
    throw Error('Amostra: CSV sem indicador pontuável.');
   group.localResults++;
   group.externalPending++;
  }else{
   throw Error('Amostra: estado de revisão desconhecido.');
  }
 }
 if(attributed!==report.attributed||byKey.size!==attributed)
  throw Error('Amostra: totais ou registros de revisão inconsistentes.');
 const result=[...leagues.values()].sort((a,b)=>a.league.localeCompare(b.league,'pt-BR'));
 return {leagues:result,totalAttributed:attributed,
  totalEligibleLocal:result.reduce((n,l)=>n+l.eligibleLocal,0),
  totalLocalResults:result.reduce((n,l)=>n+l.localResults,0),
  totalExternalVerified:0,externalValidation:'PENDENTE'};
}

/** Summary CSV is a planning sheet, not a restore file or proof of prediction
 * accuracy. Never mark a user-provided source as authenticated or sufficient.
 */
export function exportProspectiveCohortCsv(plan:ProspectiveCohortPlan):string{
 const headings=['campeonato','indicacoes_atribuidas','jogos_elegiveis_localmente',
  'resultados_csv_local','aguardando_jogo','aguardando_resultado_local',
  'excluidos','resultados_aguardando_fonte_externa',
  'resultados_externos_confirmados','meta_30_por_liga',
  'faltam_verificacoes_externas','avaliacao_modelo','status_verificacao_externa'];
 const rows=[headings.map(csvCell).join(';')];
 for(const l of plan.leagues){
  rows.push([l.league,String(l.attributed),String(l.eligibleLocal),
   String(l.localResults),String(l.awaitKickoff),String(l.needsLocalResult),
   String(l.excluded),String(l.externalPending),'0',
   String(MIN_EXTERNAL_FIXTURES_PER_LEAGUE),
   String(l.missingExternal),'N/D','PENDENTE'].map(csvCell).join(';'));
 }
 return '\uFEFF'+rows.join('\r\n')+'\r\n';
}

/**
 * On-demand, read-only worklist for independent external result verification.
 * No provider APIs, automatic result retrieval or "verified" status are
 * created. A CSV-linked result is only LOCAL evidence, not an external check.
 */
import type {SavedRadarRecord} from './radarRecords';
import type {PickAuditReport,PickAuditRow} from './dailyGoodAudit';
import {safeOfficialFixtureUrl} from './officialSourceTrust';

export type ExternalReviewState='check_external'|'need_local_result'|'await_kickoff'|'excluded';
export type ExternalReviewEntry={
 key:string;competition:string;home:string;away:string;matchAt:string;
 savedAt:string;state:ExternalReviewState;auditStatus:PickAuditRow['status'];
 reason:string;officialUrl:string|null;csvSourceUrl:string|null;
 indicators:string;localResults:string;externalCheck:'PENDENTE';
};
export type ExternalReviewQueue={
 entries:ExternalReviewEntry[];
 checkExternal:number;needLocalResult:number;awaitKickoff:number;excluded:number;
};

const stateOrder:Record<ExternalReviewState,number>={
 check_external:0,need_local_result:1,await_kickoff:2,excluded:3
};
function validHttps(s:string|null):string|null{
 if(!s)return null;
 try{
  const u=new URL(s);
  return u.protocol==='https:'&&!u.username&&!u.password?s:null;
 }catch{return null;}
}
function kickoffUTC(local:string):number{
 if(!/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(local))return NaN;
 return Date.parse(local+'-03:00');
}

/** Uses the audit disposition, not team-name heuristics or later model runs.
 * A game is ready to CHECK when a local, attributed and post-match CSV result
 * exists; readiness never implies independent verification happened.
 */
export function buildIndependentReviewQueue(
 records:readonly SavedRadarRecord[],report:PickAuditReport,now=new Date()
):ExternalReviewQueue{
 if(records.length!==report.rows.length)
  throw Error('Registros e auditoria divergem. Nenhuma conferência gerada.');
 const entries:ExternalReviewEntry[]=[];
 for(let i=0;i<records.length;i++){
  const r=records[i],row=report.rows[i];
  if(row.key!==r.key)throw Error('Auditoria fora de ordem. Nenhuma conferência gerada.');
  if(!r.goodPicks){
   if(row.status!=='legacy')throw Error('Registro Radar legado atribuído indevidamente.');
   continue;
  }
  if(row.status==='legacy')throw Error('Indicação explícita sem auditoria correspondente.');
  const cutoff=kickoffUTC(r.matchAt)+120*60*1000;
  const elapsed=Number.isFinite(cutoff)&&now.getTime()>=cutoff;
  let state:ExternalReviewState;
  let reason:string;
  if(['invalid','late','ambiguous'].includes(row.status)){
   state='excluded';reason='Não elegível: '+row.reason;
  }else if(row.status==='future'||!elapsed){
   state='await_kickoff';reason='Aguardar partida e período mínimo pós-jogo';
  }else if(row.status==='scored'&&row.markets.some(m=>m.actual!==null)){
   state='check_external';reason='Comparar cada indicador do CSV local com fonte independente';
  }else{
   state='need_local_result';
   reason=row.status==='scored'
    ?'Indicadores N/D; dados locais insuficientes'
    :'Obter e validar resultado local documentado antes de comparar fontes';
  }
  // A valid official schedule link is only a locator, not an outcome source.
  // Imported/old snapshots may be shallowly readable but structurally invalid.
  // Preserve their exclusion without trusting nested, possibly corrupt fields.
  const signals=Array.isArray(r.goodPicks.signals)
   ?r.goodPicks.signals.filter(x=>x&&typeof x.label==='string'&&
      typeof x.direction==='string'&&typeof x.line==='number'):[];
  const officialUrl=safeOfficialFixtureUrl(r.goodPicks.sourceUrl)?
   r.goodPicks.sourceUrl:null;
  entries.push({
   key:r.key,competition:r.competition,home:r.home,away:r.away,
   matchAt:r.matchAt,savedAt:r.savedAt,state,auditStatus:row.status,
   reason,officialUrl,csvSourceUrl:validHttps(row.sourceUrl),
   indicators:signals.length?signals.map(s=>s.label+' ('+s.direction+' '+s.line+')').join(' | '):'N/D',
   localResults:row.status==='scored'?row.markets.map(m=>
    m.label+': '+(m.actual===null?'N/D':m.actual)).join(' | '):'N/D',
   externalCheck:'PENDENTE'
  });
 }
 entries.sort((a,b)=>stateOrder[a.state]-stateOrder[b.state]||
  a.matchAt.localeCompare(b.matchAt)||a.key.localeCompare(b.key));
 return {entries,
  checkExternal:entries.filter(e=>e.state==='check_external').length,
  needLocalResult:entries.filter(e=>e.state==='need_local_result').length,
  awaitKickoff:entries.filter(e=>e.state==='await_kickoff').length,
  excluded:entries.filter(e=>e.state==='excluded').length};
}

/** Safe for opening in spreadsheet software, but NOT a proof or restore file. */
function csvCell(v:string|null):string{
 const s=v??'N/D';
 const protectedText=/^[\s\u0000-\u001f]*[=+\-@]/u.test(s)?"'"+s:s;
 return '"'+protectedText.replace(/"/g,'""')+'"';
}
export function exportIndependentReviewQueueCsv(queue:ExternalReviewQueue):string{
 const headings=['registro_id','salvo_em_utc','inicio_brasilia','campeonato',
  'mandante','visitante','prioridade','situacao_original','motivo',
  'indicadores_congelados','resultado_csv_local','fonte_agenda_oficial',
  'fonte_resultado_csv','verificacao_externa_independente'];
 const lines=[headings.map(csvCell).join(';')];
 for(const e of queue.entries){
  lines.push([e.key,e.savedAt,e.matchAt,e.competition,e.home,e.away,
   e.state,e.auditStatus,e.reason,e.indicators,e.localResults,
   e.officialUrl,e.csvSourceUrl,e.externalCheck].map(csvCell).join(';'));
 }
 return '\uFEFF'+lines.join('\r\n')+'\r\n';
}

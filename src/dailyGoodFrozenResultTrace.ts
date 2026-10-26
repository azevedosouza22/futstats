/**
 * Etapa 68 — source-by-source trace of a FROZEN prediction to the matching
 * LOCAL CSV record. Never asserts that the underlying provider page was read.
 * No network, writes, result inference, model reruns, or automatic matching.
 */
import type {Data,Match} from './model';
import {normalizeTeam} from './calendar';
import type {SavedRadarRecord} from './radarRecords';
import type {PickAuditReport,PickAuditRow} from './dailyGoodAudit';

export type FrozenResultTrace={
 key:string;home:string;away:string;competition:string;matchAt:string;savedAt:string;
 status:PickAuditRow['status'];reason:string;
 originVerifiedAt:string|null;originUrl:string|null;
 localStatus:'CSV_LOCAL_DOCUMENTADO'|'RESULTADO_PENDENTE'|'EXCLUIDO';
 resultMatchId:string|null;resultSourceId:string|null;
 resultProvider:string|null;resultImportedAt:string|null;resultUrl:string|null;
 markets:{id:string;direction:'Over'|'Under';line:number;actual:number|null}[];
 independentVerification:'PENDENTE';
};
const same=(d:Data,m:Match,r:SavedRadarRecord)=>
 m.date===r.matchAt.slice(0,10)&&m.competition.trim()===r.competition.trim()&&
 normalizeTeam(d.teams.find(x=>x.id===m.home)?.name??'')===normalizeTeam(r.home)&&
 normalizeTeam(d.teams.find(x=>x.id===m.away)?.name??'')===normalizeTeam(r.away);

export function traceFrozenResults(
 data:Data,records:readonly SavedRadarRecord[],audit:PickAuditReport
):FrozenResultTrace[]{
 if(records.length!==audit.rows.length)throw Error('Trilha: auditoria e registros divergentes.');
 const used=new Set<string>();
 const result:FrozenResultTrace[]=[];
 for(let i=0;i<records.length;i++){
  const r=records[i],row=audit.rows[i];
  if(row.key!==r.key||row.matchAt!==r.matchAt||row.competition!==r.competition||
     row.home!==r.home||row.away!==r.away||used.has(r.key))
   throw Error('Trilha: identidade, ordem ou ID do registro divergente.');
  used.add(r.key);
  if(!r.goodPicks){
   if(row.status!=='legacy')throw Error('Trilha: Radar legado não pode virar As Boas.');
   continue;
  }
  if(row.status==='legacy')throw Error('Trilha: previsão atribuída sem auditoria.');
  let found:Match|null=null;
  if(row.status==='scored'){
   const matches=data.matches.filter(m=>same(data,m,r));
   if(matches.length!==1||!matches[0].research||
      matches[0].research.sourceUrl!==row.sourceUrl)
    throw Error('Trilha: vínculo entre previsão e resultado CSV é ambíguo.');
   found=matches[0];
  }
  const source=found?.research;
  result.push({
   key:r.key,home:r.home,away:r.away,competition:r.competition,
   matchAt:r.matchAt,savedAt:r.savedAt,status:row.status,reason:row.reason,
   originVerifiedAt:r.goodPicks.verifiedAt,originUrl:r.goodPicks.sourceUrl,
   localStatus:source?'CSV_LOCAL_DOCUMENTADO':
    ['invalid','late','ambiguous'].includes(row.status)?'EXCLUIDO':'RESULTADO_PENDENTE',
   resultMatchId:found?.id??null,resultSourceId:source?.sourceId??null,
   resultProvider:source?source.provider+' / '+source.source:null,
   resultImportedAt:source?.importedAt??null,resultUrl:source?.sourceUrl??null,
   markets:r.goodPicks.signals.map(s=>{
    const audited=row.markets.find(m=>m.id===s.id);
    return {id:s.id,direction:s.direction,line:s.line,
     actual:source?audited?.actual??null:null};
   }),
   independentVerification:'PENDENTE'
  });
 }
 if(result.length!==audit.attributed)
  throw Error('Trilha: total de indicações diverge da auditoria.');
 return result;
}

const cell=(value:string|null)=>{
 const s=value??'N/D';
 const safe=/^[\s\u0000-\u001f]*[=+\-@]/u.test(s)?"'"+s:s;
 return '"'+safe.replace(/"/g,'""')+'"';
};
/** One row per frozen signal: source IDs/dates are provenance metadata, not
 * proof of the real score. Never mark independent verification complete. */
export function exportFrozenResultTraceCsv(rows:readonly FrozenResultTrace[]):string{
 const heads=['previsao_id','campeonato','mandante','visitante','jogo_brasilia',
  'previsao_salva_utc','fonte_agenda','conferida_agenda_em',
  'status_local','situacao_auditoria','motivo','partida_csv_id','fonte_csv_id',
  'provedor_csv','importado_em_utc','url_csv','indicador_congelado',
  'direcao_congelada','linha_congelada','resultado_csv_local',
  'verificacao_independente'];
 const lines=[heads.map(cell).join(';')];
 for(const r of rows)for(const m of r.markets){
  lines.push([r.key,r.competition,r.home,r.away,r.matchAt,r.savedAt,
   r.originUrl,r.originVerifiedAt,r.localStatus,r.status,r.reason,
   r.resultMatchId,r.resultSourceId,r.resultProvider,r.resultImportedAt,r.resultUrl,
   m.id,m.direction,String(m.line),m.actual===null?null:String(m.actual),
   r.independentVerification].map(cell).join(';'));
 }
 return '\uFEFF'+lines.join('\r\n')+'\r\n';
}

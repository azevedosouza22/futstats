/**
 * Etapa 72 — portable roster of ORIGINAL local pre-kickoff shortlist snapshots.
 *
 * This is a research INPUT, not a remotely authenticated timestamp, source
 * confirmation, prediction accuracy report or backup. No outcome/score can be
 * reconstructed from a schedule URL or a saved forecast.
 */
import {normalizeTeam} from './calendar';
import type {SavedRadarRecord} from './radarRecords';
import type {PickAuditReport,PickAuditStatus} from './dailyGoodAudit';

export const PREMATCH_RESEARCH_FORMAT='futstats-previsoes-originais-para-pesquisa-v1' as const;
export type PrematchResearchEntry={
 recordKey:string;competition:string;home:string;away:string;
 savedAtUtc:string;matchAtBrasilia:string;
 officialSourceUrl:string;officialVerifiedAt:string;
 localDisposition:'future'|'waiting'|'source_missing'|'scored';
 frozenSignals:{id:string;label:string;direction:'Over'|'Under';line:number;
  projection:number;historicalMean:number;historicalSample:number;leagueSample:number}[];
 externalCheck:'PENDENTE';externalResult:'N/D';
};
export type PrematchResearchPackage={
 format:typeof PREMATCH_RESEARCH_FORMAT;
 exportedAtUtc:string;
 purpose:'PREVISOES LOCAIS PARA PESQUISA — HORARIOS NAO AUTENTICADOS';
 externallyVerified:0;accuracy:'N/D';
 total:number;byLeague:{competition:string;entries:number}[];
 skipped:{legacy:number;invalid:number;late:number;ambiguous:number};
 entries:PrematchResearchEntry[];
};
const allowed=new Set<PickAuditStatus>(['future','waiting','source_missing','scored']);
const reject=(reason:string):never=>{throw Error('Exportação recusada: '+reason+'. Nada foi alterado.');};
export function preparePrematchResearchPackage(
 records:readonly SavedRadarRecord[],report:PickAuditReport,now=new Date()
):PrematchResearchPackage{
 if(records.length!==report.rows.length||report.snapshots!==records.length)
  reject('previsões e auditoria divergentes');
 const seenKeys=new Set<string>(),seenFixtures=new Set<string>();
 const entries:PrematchResearchEntry[]=[];
 const skipped={legacy:0,invalid:0,late:0,ambiguous:0};
 let attributed=0;
 for(let i=0;i<records.length;i++){
  const r=records[i],row=report.rows[i];
  if(r.key!==row.key||r.competition!==row.competition||r.home!==row.home||
     r.away!==row.away||r.matchAt!==row.matchAt||seenKeys.has(r.key))
    reject('registro duplicado ou fora de ordem');
  seenKeys.add(r.key);
  if(!r.goodPicks){
   if(row.status!=='legacy')reject('Radar legado atribuído indevidamente');
   skipped.legacy++;continue;
  }
  attributed++;
  if(!allowed.has(row.status)){
   if(row.status==='legacy')reject('indicação sem auditoria');
   if(row.status==='invalid'||row.status==='late'||row.status==='ambiguous')
    skipped[row.status]++;
   else reject('estado de auditoria desconhecido');
   continue;
  }
  const good=r.goodPicks;
  if(!good||!Array.isArray(good.signals)||good.signals.length===0)
   reject('sinais congelados ausentes');
  const saved=Date.parse(r.savedAt),kickoff=Date.parse(r.matchAt+'-03:00');
  if(!Number.isFinite(saved)||!Number.isFinite(kickoff)||saved>=kickoff||
     saved>now.getTime())
   reject('cronologia da previsão incompatível com a consulta');
  const identity=[r.matchAt.slice(0,10),r.competition,r.home,r.away]
    .map(normalizeTeam).join('|');
  if(seenFixtures.has(identity))reject('mesmo confronto elegível repetido');
  seenFixtures.add(identity);
  const signals=good.signals.map(s=>({
   id:s.id,label:s.label,direction:s.direction,line:s.line,
   projection:s.projection,historicalMean:s.historicalMean,
   historicalSample:s.historicalSample,leagueSample:s.leagueSample
  }));
  entries.push({
   recordKey:r.key,competition:r.competition,home:r.home,away:r.away,
   savedAtUtc:r.savedAt,matchAtBrasilia:r.matchAt,
   officialSourceUrl:good.sourceUrl,officialVerifiedAt:good.verifiedAt,
   localDisposition:row.status as PrematchResearchEntry['localDisposition'],
   frozenSignals:signals,externalCheck:'PENDENTE',externalResult:'N/D'
  });
 }
 if(attributed!==report.attributed)reject('quantidade de indicações divergente');
 entries.sort((a,b)=>a.competition.localeCompare(b.competition,'pt-BR')||
   a.matchAtBrasilia.localeCompare(b.matchAtBrasilia)||
   a.recordKey.localeCompare(b.recordKey));
 const byLeague=[...new Set(entries.map(e=>e.competition))].sort((a,b)=>
   a.localeCompare(b,'pt-BR')).map(competition=>({
     competition,entries:entries.filter(e=>e.competition===competition).length
   }));
 return {
  format:PREMATCH_RESEARCH_FORMAT,exportedAtUtc:now.toISOString(),
  purpose:'PREVISOES LOCAIS PARA PESQUISA — HORARIOS NAO AUTENTICADOS',
  externallyVerified:0,accuracy:'N/D',total:entries.length,
  byLeague,skipped,entries
 };
}
export function exportPrematchResearchPackageJson(pkg:PrematchResearchPackage):string{
 return JSON.stringify(pkg,null,2)+'\n';
}

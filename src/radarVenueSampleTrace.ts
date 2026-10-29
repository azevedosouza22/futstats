import {researchDateBefore} from './model';
/**
 * Etapa 60 — source-by-source trail for the EXISTING venue sample of Etapa 59.
 * This report does not select new matches, fetch sites, backfill N/D, verify
 * imported figures, or change the snapshot already frozen in Radar V2/V3.
 */
import {stats,type Data,type Match} from './model';
import {radarUpcoming,type RadarFixture} from './radar';
import {auditedRadarMetricValues} from './radarPeriodCoverage';
import {COVERAGE_METRICS,COVERAGE_PERIODS} from './leagueCoverageAudit';
import {assessGapSource,type GapSourceStatus} from './statGapSource';
import type {VenuePeriodProfile,VenueSide} from './radarVenuePeriodProfile';

export type VenueTrailDisposition='included'|'different_venue'|'excluded_source'|'duplicate_id';
export type VenueTrailRow={
 side:VenueSide;matchId:string;date:string;opponents:string;
 disposition:VenueTrailDisposition;reason:string;
 missingCells:number;conflictingMetrics:number;
 sourceId:string|null;sourceUrl:string|null;sourceStatus:GapSourceStatus;
};
export type VenueTrailGroup={
 side:VenueSide;selected:number;included:number;notVenue:number;excluded:number;
 rows:VenueTrailRow[];
};
export type VenueTrailReport={
 league:string;fixtureDate:string;home:VenueTrailGroup;away:VenueTrailGroup;
 consistent:boolean;independentCheck:'PENDENTE';
};

function trailFor(data:Data,fixture:RadarFixture,selected:readonly Match[],side:VenueSide):
 VenueTrailGroup{
 const home=side==='home',clubId=home?fixture.home:fixture.away,seen=new Set<string>();
 const rows:VenueTrailRow[]=[];
 for(const m of selected){
  let disposition:VenueTrailDisposition='included';
  let reason='Entrou na amostra de mando; dados por período sujeitos a N/D';
  if(home?m.home!==clubId:m.away!==clubId){
   disposition='different_venue';reason='Fora do recorte de mando (não substituído por jogo antigo)';
  }else if(seen.has(m.id)){
   disposition='duplicate_id';reason='ID repetido na mesma amostra';
  }else if(m.competition.trim()!==fixture.competition.trim()||
   m.date>=fixture.date||m.research?.dateDiscrepancy||
   !researchDateBefore(m,fixture.date)||
   (m.external&&!['FT','Match Finished'].includes(m.external.status))){
   disposition='excluded_source';reason='Data, campeonato ou origem em revisão';
  }
  if(disposition!=='different_venue')seen.add(m.id);
  let missingCells=0,conflictingMetrics=0;
  if(disposition==='included'){
   for(const metric of COVERAGE_METRICS){
    const values=auditedRadarMetricValues(m,metric);
    if(values===null){conflictingMetrics++;continue;}
    for(const period of COVERAGE_PERIODS){
     const a=stats(m,home?0:1,period)[metric];
     const b=stats(m,home?1:0,period)[metric];
     if(a===null||b===null)missingCells++;
    }
   }
  }
  const source=assessGapSource(m.research?.sourceUrl,m.research?.sourceId,false);
  const homeName=data.teams.find(t=>t.id===m.home)?.name??m.home;
  const awayName=data.teams.find(t=>t.id===m.away)?.name??m.away;
  rows.push({side,matchId:m.id,date:m.date,opponents:homeName+' × '+awayName,
    disposition,reason,missingCells,conflictingMetrics,
    sourceId:source.sourceId,sourceUrl:source.sourceUrl,
    sourceStatus:source.status});
 }
 return {side,selected:selected.length,
  included:rows.filter(r=>r.disposition==='included').length,
  notVenue:rows.filter(r=>r.disposition==='different_venue').length,
  excluded:rows.filter(r=>r.disposition==='excluded_source'||r.disposition==='duplicate_id').length,
  rows};
}

/** The exact five per club come from radarUpcoming, as in the venue averages.
 * Reconcile all three public summary counters to the already computed report:
 * unexpected policy divergence fails closed and disables the export UI.
 */
export function traceVenueSamples(data:Data,fixture:RadarFixture,
 profile:VenuePeriodProfile):VenueTrailReport{
 const sample=radarUpcoming(data,fixture);
 const home=trailFor(data,fixture,sample.homeHistory,'home');
 const away=trailFor(data,fixture,sample.awayHistory,'away');
 const consistent=profile.competition===fixture.competition&&
   profile.date===fixture.date&&
   home.selected===profile.home.recentCount&&
   home.included===profile.home.venueCount&&
   home.excluded===profile.home.excluded&&
   away.selected===profile.away.recentCount&&
   away.included===profile.away.venueCount&&
   away.excluded===profile.away.excluded;
 return {league:fixture.competition,fixtureDate:fixture.date,home,away,
  consistent,independentCheck:'PENDENTE'};
}
const csv=(s:string)=>{
 const v=/^[\s\u0000-\u001f]*[=+\-@]/u.test(s)?"'"+s:s;
 return '"'+v.replace(/"/g,'""')+'"';
};
export function exportVenueTrailCsv(report:VenueTrailReport):string{
 if(!report.consistent)throw Error('Amostras divergentes; exportação bloqueada.');
 const columns=['campeonato','data_previsao','lado','id_partida','data_partida',
  'confronto','estado','motivo','campos_nd','indicadores_em_conflito',
  'id_fonte','url_fonte_permitida','situacao_fonte','checagem_externa'];
 const rows=[columns.map(csv).join(';')];
 for(const group of [report.home,report.away])for(const m of group.rows){
  rows.push([report.league,report.fixtureDate,m.side,m.matchId,m.date,
   m.opponents,m.disposition,m.reason,String(m.missingCells),
   String(m.conflictingMetrics),m.sourceId??'N/D',m.sourceUrl??'N/D',
   m.sourceStatus,'PENDENTE'].map(csv).join(';'));
 }
 return '\uFEFF'+rows.join('\r\n')+'\r\n';
}


/**
 * Etapa 56 — a read-only coverage matrix for the same last-five-match sample
 * selected by the existing Radar. These are match totals (two sides), NOT
 * club averages, forecasts, or calibrated probabilities.
 *
 * Values are N/D whenever either side of one period is absent. Never infer a
 * missing half from the full match. A contradictory full=first+second record
 * is excluded for the affected metric, without modifying its original data.
 */
import {stats,type Match} from './model';
import {radarUpcoming,type RadarFixture} from './radar';
import {assessGapSource,type GapSourceStatus} from './statGapSource';
import {COVERAGE_METRICS,COVERAGE_PERIODS,type CoverageMetric,type CoveragePeriod} from './leagueCoverageAudit';
export {COVERAGE_METRICS,COVERAGE_PERIODS};
export type RadarPeriodCell={period:CoveragePeriod;valid:number;missing:number;conflicts:number;mean:number|null};
export type RadarPeriodRow={metric:CoverageMetric;label:string;cells:Record<CoveragePeriod,RadarPeriodCell>};
export type RadarPeriodGap={
  matchId:string;date:string;label:string;
  gaps:{metric:CoverageMetric;period:CoveragePeriod;kind:'missing'|'conflict'}[];
  sourceUrl:string|null;sourceId:string|null;sourceStatus:GapSourceStatus;
};
export type RadarPeriodCoverage={
  selectedHome:number;selectedAway:number;distinct:number;
  skippedAmbiguous:number;duplicateIds:number;completeAll:number;
  rows:RadarPeriodRow[];
  /** Only locally observed gaps; this is NOT a request to download data. */
  gaps:RadarPeriodGap[];
};
const labels:Record<CoverageMetric,string>={
 goals:'Gols',shots:'Finalizações',target:'Chutes no alvo',corners:'Escanteios'
};
const total=(m:Match,metric:CoverageMetric,period:CoveragePeriod):number|null=>{
 const a=stats(m,0,period)[metric],b=stats(m,1,period)[metric];
 return a===null||b===null?null:a+b;
};
export function auditedRadarMetricValues(m:Match,metric:CoverageMetric):
 Record<CoveragePeriod,number|null>|null{
 const full=total(m,metric,'full'),first=total(m,metric,'first'),
  second=total(m,metric,'second');
 // Compare HOME and AWAY independently. Comparing only the combined total
 // could accidentally cancel a +1 error on home with a -1 error on away.
 for(const side of [0,1] as const){
  const f=stats(m,side,'full')[metric],a=stats(m,side,'first')[metric],
    b=stats(m,side,'second')[metric];
  if(f!==null&&a!==null&&b!==null&&f!==a+b)
   return null;
 }
 if(full!==null&&first!==null&&second!==null&&full!==first+second)
  return null;
 return {full,first,second};
}
export function radarPeriodCoverage(data:Parameters<typeof radarUpcoming>[0],
 fixture:RadarFixture):RadarPeriodCoverage{
 const sample=radarUpcoming(data,fixture);
 const seen=new Set<string>();const unique:Match[]=[];
 let skippedAmbiguous=0,duplicateIds=0;
 for(const match of [...sample.homeHistory,...sample.awayHistory]){
  if(seen.has(match.id)){duplicateIds++;continue;}
  seen.add(match.id);
  // Do not claim coverage for an item with contradictory source dates.
  if(match.research?.dateDiscrepancy){skippedAmbiguous++;continue;}
  // Defense in depth even if sample policy evolves.
  if(match.competition.trim()!==fixture.competition.trim()||
     match.date>=fixture.date||
     (match.research?.titleDate!==undefined&&
      match.research.titleDate>=fixture.date)||
     (match.external&&!['FT','Match Finished'].includes(match.external.status)))
   {skippedAmbiguous++;continue;}
  unique.push(match);
 }
 const rows:RadarPeriodRow[]=COVERAGE_METRICS.map(metric=>{
  const counters=Object.fromEntries(COVERAGE_PERIODS.map(period=>
   [period,{period,valid:0,missing:0,conflicts:0,mean:null as number|null,subtotal:0}]
  )) as Record<CoveragePeriod,RadarPeriodCell&{subtotal:number}>;
  for(const match of unique){
   const values=auditedRadarMetricValues(match,metric);
   if(values===null){
    for(const period of COVERAGE_PERIODS)counters[period].conflicts++;
    continue;
   }
   for(const period of COVERAGE_PERIODS){
    const value=values[period],cell=counters[period];
    if(value===null)cell.missing++;
    else {cell.valid++;cell.subtotal+=value;}
   }
  }
  const cells={} as RadarPeriodRow['cells'];
  for(const period of COVERAGE_PERIODS){
   const {subtotal,...cell}=counters[period];
   cells[period]={...cell,mean:cell.valid?subtotal/cell.valid:null};
  }
  return {metric,label:labels[metric],cells};
 });
 const completeAll=unique.filter(m=>COVERAGE_METRICS.every(metric=>{
  const values=auditedRadarMetricValues(m,metric);
  return values!==null&&COVERAGE_PERIODS.every(period=>values[period]!==null);
 })).length;
 const gaps:RadarPeriodGap[]=[];
 for(const match of unique){
  const problems:RadarPeriodGap['gaps']=[];
  for(const metric of COVERAGE_METRICS){
   const values=auditedRadarMetricValues(match,metric);
   if(values===null){
    problems.push({metric,period:'full',kind:'conflict'});
   }else{
    for(const period of COVERAGE_PERIODS)
     if(values[period]===null)problems.push({metric,period,kind:'missing'});
   }
  }
  if(!problems.length)continue;
  const source=assessGapSource(match.research?.sourceUrl,
    match.research?.sourceId,false);
  const home=data.teams.find(t=>t.id===match.home)?.name??match.home;
  const away=data.teams.find(t=>t.id===match.away)?.name??match.away;
  gaps.push({matchId:match.id,date:match.date,label:home+' × '+away,
   gaps:problems,sourceUrl:source.sourceUrl,sourceId:source.sourceId,
   sourceStatus:source.status});
 }
 gaps.sort((a,b)=>b.gaps.filter(g=>g.kind==='conflict').length-
  a.gaps.filter(g=>g.kind==='conflict').length||
  b.gaps.length-a.gaps.length||b.date.localeCompare(a.date)||
  a.matchId.localeCompare(b.matchId));
 return {selectedHome:sample.homeHistory.length,selectedAway:sample.awayHistory.length,
  distinct:unique.length,duplicateIds,skippedAmbiguous,completeAll,rows,gaps};
}

/** A review checklist only. Never changes an original CSV, never verifies a
 * third-party webpage, and never converts missing values into zero. */
export function exportRadarPeriodGapCsv(report:RadarPeriodCoverage):string{
 const cell=(value:string)=>{
  const guarded=/^[\s\u0000-\u001f]*[=+\-@]/u.test(value)?"'"+value:value;
  return '"'+guarded.replace(/"/g,'""')+'"';
 };
 const columns=['id_partida','data','confronto','indicador','periodo','situacao',
  'id_fonte','url_fonte_permitida','revisao_externa'];
 const rows=[columns.map(cell).join(';')];
 for(const match of report.gaps)for(const gap of match.gaps){
  rows.push([match.matchId,match.date,match.label,gap.metric,gap.period,
    gap.kind==='missing'?'N/D':'SOMA_DIVERGENTE',match.sourceId??'N/D',
    match.sourceUrl??'N/D','PENDENTE'].map(cell).join(';'));
 }
 return '\uFEFF'+rows.join('\r\n')+'\r\n';
}

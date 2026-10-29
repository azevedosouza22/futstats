import {researchDateBefore} from './model';
/**
 * Etapa 58 — Period-aware historical Over/Under COUNTS.
 * This is descriptive only: not bookmaker odds, forecasts, calibrated win
 * probabilities or V2/V3 recommendations. Small samples are explicitly N/D
 * for percentages. Never invent halves from a known full match.
 */
import type {Data} from './model';
import {radarUpcoming,type RadarFixture} from './radar';
import {auditedRadarMetricValues,radarPeriodCoverage} from './radarPeriodCoverage';
import {COVERAGE_METRICS,COVERAGE_PERIODS,type CoverageMetric,type CoveragePeriod}
 from './leagueCoverageAudit';

export const MIN_PERIOD_LINE_SAMPLE=5;
export const PERIOD_LINE_LABELS:Record<CoveragePeriod,string>={
 full:'Jogo completo',first:'1º tempo',second:'2º tempo'
};
const LABELS:Record<CoverageMetric,string>={
 goals:'Gols',shots:'Finalizações',target:'Chutes no alvo',corners:'Escanteios'
};
/** Reference thresholds for HALF periods are different from full-time lines.
 * These are illustrative values, no fetched odds or available book markets.
 */
export const PERIOD_REFERENCE_LINES:Record<CoveragePeriod,Record<CoverageMetric,readonly number[]>>={
 full:{
  goals:[0.5,1.5,2.5,3.5,4.5],
  shots:[17.5,20.5,22.5,24.5,27.5,29.5,32.5],
  target:[3.5,4.5,5.5,6.5,7.5,8.5,9.5,10.5,11.5],
  corners:[4.5,5.5,6.5,7.5,8.5,9.5,10.5,11.5,12.5]
 },
 first:{
  goals:[0.5,1.5,2.5],
  shots:[5.5,7.5,9.5,11.5,13.5,15.5],
  target:[1.5,2.5,3.5,4.5,5.5,6.5],
  corners:[1.5,2.5,3.5,4.5,5.5,6.5]
 },
 second:{
  goals:[0.5,1.5,2.5],
  shots:[5.5,7.5,9.5,11.5,13.5,15.5],
  target:[1.5,2.5,3.5,4.5,5.5,6.5],
  corners:[1.5,2.5,3.5,4.5,5.5,6.5]
 }
};
export type PeriodLineResult={
 line:number;over:number;under:number;
 overShare:number|null;underShare:number|null;
};
export type PeriodLineDistribution={
 metric:CoverageMetric;period:CoveragePeriod;label:string;
 observed:number;missing:number;conflicts:number;
 distinct:number;mean:number|null;isAdequateSample:boolean;
 lines:PeriodLineResult[];
};
export type PeriodLineComparison={groups:PeriodLineDistribution[];fixtureDate:string;league:string;};

/**
 * All 12 groups use the same historical (5+5) selection and exact
 * competition as the verified coverage matrix. If validity drifts across the
 * implementations, refuse to display misleading frequencies.
 */
export function comparePeriodRadarLines(data:Data,fixture:RadarFixture):PeriodLineComparison{
 const sample=radarUpcoming(data,fixture);
 const seen=new Set<string>();
 const matches=[...sample.homeHistory,...sample.awayHistory].filter(match=>{
  if(seen.has(match.id))return false;
  seen.add(match.id);
  return match.competition.trim()===fixture.competition.trim()&&
   match.date<fixture.date&&!match.research?.dateDiscrepancy&&
   researchDateBefore(match,fixture.date)&&
   (!match.external||['FT','Match Finished'].includes(match.external.status));
 });
 const coverage=radarPeriodCoverage(data,fixture);
 if(coverage.distinct!==matches.length)
  throw Error('Comparação histórica divergente da matriz por período.');
 const groups:PeriodLineDistribution[]=[];
 for(const metric of COVERAGE_METRICS){
  for(const period of COVERAGE_PERIODS){
   const values=matches.map(m=>auditedRadarMetricValues(m,metric));
   const totals=values.map(x=>x?.[period]??null)
    .filter((n):n is number=>n!==null);
   const cell=coverage.rows.find(x=>x.metric===metric)!.cells[period];
   if(cell.valid!==totals.length)
    throw Error('Amostra de linha diferente da cobertura histórica validada.');
   const observed=totals.length;
   const isAdequateSample=observed>=MIN_PERIOD_LINE_SAMPLE;
   groups.push({
    metric,period,label:LABELS[metric],
    distinct:coverage.distinct,observed,missing:cell.missing,
    conflicts:cell.conflicts,mean:cell.mean,isAdequateSample,
    lines:PERIOD_REFERENCE_LINES[period][metric].map(line=>{
     const over=totals.filter(x=>x>line).length;
     const under=observed-over; // half-integer threshold, no pushes
     return {line,over,under,
      overShare:isAdequateSample?over/observed:null,
      underShare:isAdequateSample?under/observed:null};
    })
   });
  }
 }
 return {groups,fixtureDate:fixture.date,league:fixture.competition};
}


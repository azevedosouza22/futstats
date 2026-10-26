/**
 * Etapa 63: one user-specified historical line for one metric and period.
 * READ-ONLY; exact pre-game match sample, no odds or V2/V3 prediction.
 * Integer lines may produce ties/pushes and therefore Over+Under!=sample.
 */
import type {Data} from './model';
import {radarUpcoming,type RadarFixture} from './radar';
import {radarPeriodCoverage,auditedRadarMetricValues} from './radarPeriodCoverage';
import {MIN_PERIOD_LINE_SAMPLE} from './radarPeriodLineComparison';
import type {CoverageMetric,CoveragePeriod} from './leagueCoverageAudit';

export type CustomPeriodLineResult={
 metric:CoverageMetric;period:CoveragePeriod;line:number;
 sample:number;distinct:number;missing:number;conflicts:number;
 over:number;under:number;push:number;
 overShare:number|null;underShare:number|null;pushShare:number|null;
 sampleAdequate:boolean;isHistoricalOnly:true;
};

export function compareCustomPeriodLine(data:Data,fixture:RadarFixture,
 metric:CoverageMetric,period:CoveragePeriod,line:number):CustomPeriodLineResult{
 if(!['goals','shots','target','corners'].includes(metric)||
    !['full','first','second'].includes(period))
  throw Error('Indicador ou período inválido.');
 if(!Number.isFinite(line)||line<0||line>500||
    !Number.isSafeInteger(line*2))
  throw Error('Linha inválida: use um valor de 0 até 500, com passos de 0,5.');
 const selected=radarUpcoming(data,fixture);
 const seen=new Set<string>();
 const matches=[...selected.homeHistory,...selected.awayHistory].filter(m=>{
  if(seen.has(m.id))return false;
  seen.add(m.id);
  return m.competition.trim()===fixture.competition.trim()&&
   m.date<fixture.date&&!m.research?.dateDiscrepancy&&
   (m.research?.titleDate===undefined||m.research.titleDate<fixture.date)&&
   (!m.external||['FT','Match Finished'].includes(m.external.status));
 });
 const matrix=radarPeriodCoverage(data,fixture);
 if(matrix.distinct!==matches.length)
  throw Error('Amostra da linha diverge da matriz histórica.');
 const values=matches.map(m=>auditedRadarMetricValues(m,metric)?.[period]??null);
 const totals=values.filter((v):v is number=>v!==null);
 const cell=matrix.rows.find(x=>x.metric===metric)?.cells[period];
 if(!cell||totals.length!==cell.valid||
    cell.valid+cell.missing+cell.conflicts!==matrix.distinct)
  throw Error('Amostra válida diverge do controle de cobertura.');
 const over=totals.filter(v=>v>line).length;
 const under=totals.filter(v=>v<line).length;
 const push=totals.filter(v=>v===line).length;
 if(over+under+push!==totals.length)
  throw Error('Os denominadores de Over/Under não conferem.');
 const enough=totals.length>=MIN_PERIOD_LINE_SAMPLE;
 return {
  metric,period,line,sample:totals.length,distinct:matrix.distinct,
  missing:cell.missing,conflicts:cell.conflicts,
  over,under,push,overShare:enough?over/totals.length:null,
  underShare:enough?under/totals.length:null,
  pushShare:enough?push/totals.length:null,
  sampleAdequate:enough,isHistoricalOnly:true
 };
}

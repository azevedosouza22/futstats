/**
 * Etapa 66 — central policy for historical V2/V3 metric admissibility.
 * A CSV with divergent fixture dates, or FT values contradictory to 1T+2T
 * for either team, cannot silently influence a Radar mean or signal.
 *
 * This is a pure structural check, not independent verification of source.
 * No missing total/half is inferred from other periods.
 */
import {stats,type Match,type Metric} from './model';
export type RadarMetricIntegrity='ok'|'date_conflict'|'period_conflict';
export function radarMetricIntegrity(m:Match,metric:Metric):RadarMetricIntegrity{
 if(m.research?.dateDiscrepancy)return 'date_conflict';
 for(const side of [0,1] as const){
  const full=stats(m,side,'full')[metric];
  const first=stats(m,side,'first')[metric];
  const second=stats(m,side,'second')[metric];
  if(full!==null&&first!==null&&second!==null&&full!==first+second)
   return 'period_conflict';
 }
 return 'ok';
}

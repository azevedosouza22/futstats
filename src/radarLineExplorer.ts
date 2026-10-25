import type {Data} from './model';
import {matchTotal,radarUpcoming,type RadarFixture} from './radar';

export const RADAR_LINE_METRICS = ['goals','shots','target','corners'] as const;
export type RadarLineMetric = typeof RADAR_LINE_METRICS[number];
export type RadarLineReference = {line:number;overs:number};
export type RadarLineGroup = {
  metric:RadarLineMetric;
  label:string;
  observed:number;
  historicalMean:number|null;
  lines:RadarLineReference[];
};

/** Fixed illustrative thresholds, not provider odds or betting recommendations. */
const fixedLines:Record<RadarLineMetric,readonly number[]>={
  goals:[0.5,1.5,2.5,3.5,4.5],
  shots:[17.5,20.5,22.5,24.5,27.5,29.5,32.5],
  target:[3.5,4.5,5.5,6.5,7.5,8.5,9.5,10.5,11.5],
  corners:[4.5,5.5,6.5,7.5,8.5,9.5,10.5,11.5,12.5],
};
const labels:Record<RadarLineMetric,string>={
  goals:'Gols',shots:'Finalizações',target:'Chutes no gol',corners:'Escanteios'
};

/**
 * A frozen pre-match line comparison using the same retrospective sample as
 * the descriptive Radar: last five matches per side, no fixture at/after
 * cutoff, unique IDs. This is NOT the venue-specific V2/V3 signal model.
 */
export function compareRadarLines(data:Data,fixture:RadarFixture):RadarLineGroup[]{
  const sample=radarUpcoming(data,fixture);
  const seen=new Set<string>();
  const unique=[...sample.homeHistory,...sample.awayHistory].filter(m=>{
    if(m.date>=fixture.date || m.research?.dateDiscrepancy || seen.has(m.id))return false;
    seen.add(m.id);
    return true;
  });
  return RADAR_LINE_METRICS.map(metric=>{
    const totals=unique.map(m=>matchTotal(m,metric,'full'))
      .filter((v):v is number=>v!==null);
    const observed=totals.length;
    return {
      metric,label:labels[metric],observed,
      historicalMean:observed?totals.reduce((a,b)=>a+b,0)/observed:null,
      lines:fixedLines[metric].map(line=>({
        line,overs:totals.filter(total=>total>line).length
      })),
    };
  });
}

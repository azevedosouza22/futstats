/**
 * Etapa 59 — Venue-specific descriptive coverage, without conflating
 * "five recent fixtures" with "five home/away fixtures". The last five
 * in the competition are selected BEFORE the venue filter is applied.
 * Never infer absent halves, sources, outcome probabilities or new V2/V3.
 */
import {stats,type Data,type Match} from './model';
import {radarUpcoming,type RadarFixture} from './radar';
import {auditedRadarMetricValues} from './radarPeriodCoverage';
import {COVERAGE_METRICS,COVERAGE_PERIODS,type CoverageMetric,type CoveragePeriod} from './leagueCoverageAudit';

export const MIN_VENUE_PERIOD_SAMPLE=3;
export type VenueSide='home'|'away';
export type VenueMetricCell={
 metric:CoverageMetric;period:CoveragePeriod;label:string;
 valid:number;missing:number;conflicts:number;
 forMean:number|null;againstMean:number|null;
};
export type VenueTeamProfile={
 side:VenueSide;clubId:string;recentCount:number;
 venueCount:number;excluded:number;cells:VenueMetricCell[];
};
export type VenuePeriodProfile={
 competition:string;date:string;
 home:VenueTeamProfile;away:VenueTeamProfile;
 minimumSample:number;disclaimer:'DESCRITIVO — NÃO É PROBABILIDADE';
};
const names:Record<CoverageMetric,string>={
 goals:'Gols',shots:'Finalizações',target:'Chutes no alvo',corners:'Escanteios'
};
function profile(matches:readonly Match[],clubId:string,side:VenueSide,
 fixture:RadarFixture):VenueTeamProfile{
 const home=side==='home',relevant:Match[]=[];
 const seen=new Set<string>();let excluded=0;
 for(const m of matches){
  if((home?m.home!==clubId:m.away!==clubId))continue;
  if(seen.has(m.id)){excluded++;continue;}
  seen.add(m.id);
  if(m.competition.trim()!==fixture.competition.trim()||m.date>=fixture.date||
     m.research?.dateDiscrepancy||
     (m.research?.titleDate!==undefined&&m.research.titleDate>=fixture.date)||
     (m.external&&!['FT','Match Finished'].includes(m.external.status))){
    excluded++;continue;
  }
  relevant.push(m);
 }
 const cells:VenueMetricCell[]=[];
 for(const metric of COVERAGE_METRICS)for(const period of COVERAGE_PERIODS){
  let valid=0,missing=0,conflicts=0,sumFor=0,sumAgainst=0;
  for(const m of relevant){
   if(auditedRadarMetricValues(m,metric)===null){conflicts++;continue;}
   const own=stats(m,home?0:1,period)[metric];
   const conceded=stats(m,home?1:0,period)[metric];
   if(own===null||conceded===null){missing++;continue;}
   valid++;sumFor+=own;sumAgainst+=conceded;
  }
  cells.push({
   metric,period,label:names[metric],valid,missing,conflicts,
   forMean:valid>=MIN_VENUE_PERIOD_SAMPLE?sumFor/valid:null,
   againstMean:valid>=MIN_VENUE_PERIOD_SAMPLE?sumAgainst/valid:null
  });
 }
 return {side,clubId,recentCount:matches.length,venueCount:relevant.length,
  excluded,cells};
}
export function compareVenuePeriodSamples(data:Data,fixture:RadarFixture):VenuePeriodProfile{
 const history=radarUpcoming(data,fixture);
 return {competition:fixture.competition,date:fixture.date,
  home:profile(history.homeHistory,fixture.home,'home',fixture),
  away:profile(history.awayHistory,fixture.away,'away',fixture),
  minimumSample:MIN_VENUE_PERIOD_SAMPLE,
  disclaimer:'DESCRITIVO — NÃO É PROBABILIDADE'};
}

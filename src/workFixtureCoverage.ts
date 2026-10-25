/**
 * READ-ONLY coverage probe across the separately stored Work research.
 * This code NEVER copies Work games into the FutStats historical base,
 * never computes main Radar V2/V3 signals using Work data, and never saves
 * a prediction. It only reports whether prior statistics exist locally.
 */
import type {ScheduledFixture} from './calendar';
import type {WorkAnalysisMatch,WorkLeague,WorkMetric} from './workAnalysis';
import {WORK_ANALYSIS_LEAGUES,WORK_ANALYSIS_METRICS} from './workAnalysis';
import {canonicalTeamInCompetition} from './radarTeamAliases';

export type WorkFixtureCoverage={
  league:WorkLeague;
  homeName:string;awayName:string;
  homeCount:number;awayCount:number;
  uniqueGames:number;
  metricGames:Record<WorkMetric,number>;
  /** Samples exist for both clubs; never implies a validated V2/V3 signal. */
  bothTeamsHaveHistory:boolean;
};
const normalize=(name:string,competition:string)=>
  canonicalTeamInCompetition(name,competition);

function resolveWorkClub(
  matches:readonly WorkAnalysisMatch[],league:WorkLeague,competition:string,requested:string
):string|null{
  const names=new Set(matches.filter(m=>m.league===league)
    .flatMap(m=>[m.home,m.away]));
  const canonical=normalize(requested,competition);
  const candidates=[...names].filter(name=>normalize(name,competition)===canonical);
  // Two distinct names in one local dataset must not be silently conflated.
  return candidates.length===1?candidates[0]:null;
}
const validPair=(value:unknown):value is [number,number]=>
  Array.isArray(value)&&value.length===2&&
  value.every(v=>Number.isSafeInteger(v)&&v>=0);

/**
 * Strictly earlier than the fixture date, in the exact league and season.
 * Up to five previous games for each side. Conflicted dates and duplicates
 * by source ID are excluded. Values are counts of games with complete pairs,
 * not promises of predictive accuracy or odds.
 */
export function workFixtureCoverage(
  matches:readonly WorkAnalysisMatch[],fixture:ScheduledFixture
):WorkFixtureCoverage|null{
  const definition=WORK_ANALYSIS_LEAGUES.find(x=>x.label===fixture.competition.trim());
  if(!definition)return null;
  const league=definition.id;
  const home=resolveWorkClub(matches,league,definition.label,fixture.home);
  const away=resolveWorkClub(matches,league,definition.label,fixture.away);
  if(!home||!away||home===away)return null;
  const valid=matches.filter(m=>m.league===league&&m.date<fixture.date&&
    m.discrepancies.length===0)
    .sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id));
  const distinct=(team:string)=>{
    const seen=new Set<string>();
    return valid.filter(m=>{
      if((m.home!==team&&m.away!==team)||seen.has(m.sourceId))return false;
      seen.add(m.sourceId);return true;
    }).slice(0,5);
  };
  const homeMatches=distinct(home),awayMatches=distinct(away);
  const selected=new Map<string,WorkAnalysisMatch>();
  for(const game of [...homeMatches,...awayMatches])selected.set(game.sourceId,game);
  const historical=[...selected.values()];
  const metricGames={} as Record<WorkMetric,number>;
  for(const {key} of WORK_ANALYSIS_METRICS)
    metricGames[key]=historical.filter(m=>validPair(m.full[key])).length;
  return {
    league,homeName:home,awayName:away,homeCount:homeMatches.length,
    awayCount:awayMatches.length,uniqueGames:historical.length,metricGames,
    bothTeamsHaveHistory:homeMatches.length>0&&awayMatches.length>0,
  };
}

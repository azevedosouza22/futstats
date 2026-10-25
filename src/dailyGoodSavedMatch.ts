/**
 * Read-only correspondence of today's "As Boas" fixture to a saved Radar
 * record. Never creates forecasts, changes storage or retrospectively credits
 * a generic Radar prediction as an "As Boas" pick.
 */
import type {DailyGoodFixture} from './dailyGoodSignals';
import type {SavedRadarRecord} from './radarRecords';
import {normalizeTeam,brasiliaDate} from './calendar';
import {officialSnapshotFreshAt} from './officialSourceTrust';

export type GoodSavedState='not_saved'|'from_good_picks'|'from_radar'|'needs_review'|'duplicates';
export type GoodSavedMatch={state:GoodSavedState;recordKey:string|null};

export function savedGoodPickMatch(
 candidate:DailyGoodFixture,records:readonly SavedRadarRecord[]
):GoodSavedMatch{
 const f=candidate.fixture;
 const found=records.filter(r=>
   r.matchAt.slice(0,10)===f.date&&
   normalizeTeam(r.competition)===normalizeTeam(f.competition)&&
   normalizeTeam(r.home)===normalizeTeam(f.home)&&
   normalizeTeam(r.away)===normalizeTeam(f.away));
 if(!found.length)return {state:'not_saved',recordKey:null};
 if(found.length!==1||!found[0].key||records.filter(r=>r.key===found[0].key).length!==1)
  return {state:'duplicates',recordKey:null};
 const rec=found[0],sameTime=!!f.time&&rec.matchAt.slice(0,16)===f.date+'T'+f.time;
 if(!sameTime)return {state:'needs_review',recordKey:rec.key};
 if(!rec.goodPicks)return {state:'from_radar',recordKey:rec.key};
 const saved=new Date(rec.savedAt);
 const kickoff=Date.parse(rec.matchAt.slice(0,16)+':00-03:00');
 const pregame=Number.isFinite(saved.getTime())&&
   Number.isFinite(kickoff)&&saved.getTime()<kickoff;
 const dated=pregame&&officialSnapshotFreshAt(
   rec.goodPicks.verifiedAt,brasiliaDate(saved).date);
 const exactSource=rec.goodPicks.sourceUrl===f.sourceUrl&&
   rec.goodPicks.verifiedAt===candidate.verifiedAt;
 const signals=Array.isArray(rec.goodPicks.signals)&&
   JSON.stringify(rec.goodPicks.signals)===JSON.stringify(candidate.signals);
 return {state:pregame&&dated&&exactSource&&signals?'from_good_picks':'needs_review',
   recordKey:rec.key};
}

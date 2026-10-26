/**
 * Etapa 67 — conservative historical identity gate.
 *
 * Different local IDs / different Flashscore IDs do NOT make the exact
 * same dated home-v-away fixture two independent observations. If multiple
 * IDs claim the same game, quarantine ALL copies for the Radar rather than
 * choosing one or silently refilling its last-five/last-ten sample.
 *
 * Read-only, exact competition + date + team IDs, no fuzzy/alias matching.
 * This does NOT prove whether either source actually describes a real game.
 */
import type {Data,Match} from './model';
import {recentMatches} from './pregame';

export type RadarHistoryFixture=Pick<Match,'date'|'competition'>;

export function duplicateRadarFixtureIds(
 matches:readonly Match[],competition:string,beforeDate:string
):ReadonlySet<string>{
 const groups=new Map<string,Set<string>>();
 for(const m of matches){
  if(m.competition.trim()!==competition.trim()||m.date>=beforeDate)continue;
  const key=[m.competition.trim(),m.date,m.home,m.away].join('\u0000');
  const ids=groups.get(key)??new Set<string>();
  ids.add(m.id);groups.set(key,ids);
 }
 const suspicious=new Set<string>();
 for(const ids of groups.values())if(ids.size>1)for(const id of ids)suspicious.add(id);
 return suspicious;
}

/** Select the existing newest N first, THEN suppress suspect identities.
 * No substitution by an older N+1 game is allowed. */
export function recentRadarMatches(
 data:Data,team:string,limit:5|10,fixture:RadarHistoryFixture
):Match[]{
 const selected=recentMatches(data.matches,team,limit,fixture.date,
  {competition:fixture.competition});
 const blocked=duplicateRadarFixtureIds(data.matches,fixture.competition,fixture.date);
 return selected.filter(m=>!blocked.has(m.id));
}

/** Diagnostic only: missing and invalid source values still follow their
 * separate metric-level gates. Does not mutate or delete source records. */
export function radarSelectedDuplicateCount(
 data:Data,team:string,limit:5|10,fixture:RadarHistoryFixture
):number{
 const selected=recentMatches(data.matches,team,limit,fixture.date,
  {competition:fixture.competition});
 const blocked=duplicateRadarFixtureIds(data.matches,fixture.competition,fixture.date);
 return selected.filter(m=>blocked.has(m.id)).length;
}

import type {Data} from './model';
import {normalizeTeam,type ScheduledFixture} from './calendar';
import {teamsInCompetition} from './radarTeamFilters';

export type SelectedCalendarFixture={
  homeId:string;awayId:string;competition:string;date:string;time:string;
  sourceUrl:string;hasKickoffTime:boolean;
};

/** Resolve only teams that actually occur in the exact league/season.
 * The schedule is local/reference data, never a live verified fixture feed.
 * Missing kickoff times stay blank rather than being invented.
 */
export function resolveCalendarFixture(
  data:Data,fixture:ScheduledFixture
):SelectedCalendarFixture|null {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(fixture.date)||
    (fixture.time!==null&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(fixture.time)))return null;
  // Do not expose untrusted local-calendar URLs as clickable links.
  try {
    const source=new URL(fixture.sourceUrl);
    if(source.protocol!=='https:'||source.username||source.password||
      !source.hostname.includes('.'))return null;
  }catch{return null;}
  const teams=teamsInCompetition(data,fixture.competition);
  const homeMatches=teams.filter(t=>normalizeTeam(t.name)===normalizeTeam(fixture.home));
  const awayMatches=teams.filter(t=>normalizeTeam(t.name)===normalizeTeam(fixture.away));
  if(homeMatches.length!==1||awayMatches.length!==1||
    homeMatches[0].id===awayMatches[0].id)return null;
  return {homeId:homeMatches[0].id,awayId:awayMatches[0].id,
    competition:fixture.competition,date:fixture.date,
    time:fixture.time??'',hasKickoffTime:fixture.time!==null,
    sourceUrl:fixture.sourceUrl};
}

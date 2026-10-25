import type {Data} from './model';
import {type ScheduledFixture} from './calendar';
import {resolveTeamInCompetition} from './radarTeamAliases';

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
  const home=resolveTeamInCompetition(data,fixture.competition,fixture.home);
  const away=resolveTeamInCompetition(data,fixture.competition,fixture.away);
  if(!home||!away||home.id===away.id)return null;
  return {homeId:home.id,awayId:away.id,
    competition:fixture.competition,date:fixture.date,
    time:fixture.time??'',hasKickoffTime:fixture.time!==null,
    sourceUrl:fixture.sourceUrl};
}

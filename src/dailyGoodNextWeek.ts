/**
 * Seven-day preparation queue for official fixtures AFTER today.
 * It is NOT "As Boas", a prediction, provider verification or an auto-save.
 * No network, Work data, storage, probabilistic scores or live results.
 */
import type {Data} from './model';
import {brasiliaDate,normalizeTeam,type ScheduledFixture} from './calendar';
import {canonicalTeamInCompetition} from './radarTeamAliases';
import {buildRadarDailyOverview} from './radarDailyOverview';
import type {OfficialCalendarItem} from './officialCalendar';
import {safeOfficialFixtureUrl,officialSnapshotFreshAt} from './officialSourceTrust';

export type NextGoodAction='preview'|'needs_history'|'needs_recheck'|'conflict';
export type NextGoodOpportunity={
 fixture:ScheduledFixture;
 verifiedAt:string;
 state:NextGoodAction;
 homeCount:number|null;
 awayCount:number|null;
 reason:string;
};
export type NextGoodQueue={
 entries:NextGoodOpportunity[];
 preview:number;needsHistory:number;needsRecheck:number;conflicts:number;
 dateFrom:string;dateThrough:string;
};
const priorities:Record<NextGoodAction,number>={
 preview:0,needs_history:1,needs_recheck:2,conflict:3
};
const validDay=(date:string)=>/^\d{4}-\d{2}-\d{2}$/.test(date)&&
 Number.isFinite(Date.parse(date))&&new Date(date).toISOString().slice(0,10)===date;
const kickoffTime=(s:string|null)=>s!==null&&/^([01]\d|2[0-3]):[0-5]\d$/.test(s);

/** Uses only a local, dated and formerly reviewed fixture register.
 * Stale references remain stale regardless of whether the user opens them.
 * A competing fresh official kickoff conflicts and blocks any preview.
 */
export function nextGoodPreparationQueue(
 data:Data,official:readonly OfficialCalendarItem[],now=new Date()
):NextGoodQueue{
 const today=brasiliaDate(now).date;
 const end=new Date(today+'T00:00:00Z');
 end.setUTCDate(end.getUTCDate()+7);
 const through=end.toISOString().slice(0,10);
 const byFixture=new Map<string,OfficialCalendarItem[]>();
 for(const item of official){
  const f=item.fixture;
  if(!validDay(f.date)||f.date<=today||f.date>through)continue;
  const key=[f.date,normalizeTeam(f.competition),
   canonicalTeamInCompetition(f.home,f.competition),
   canonicalTeamInCompetition(f.away,f.competition)].join('|');
  const list=byFixture.get(key)??[];
  list.push(item);byFixture.set(key,list);
 }
 const entries:NextGoodOpportunity[]=[];
 for(const list of byFixture.values()){
  const trusted=list.filter(item=>
   safeOfficialFixtureUrl(item.fixture.sourceUrl)&&
   item.fresh&&officialSnapshotFreshAt(item.verifiedAt,today)&&
   kickoffTime(item.fixture.time));
  const times=new Set(trusted.map(x=>x.fixture.time));
  // Contradictory, equally current verified schedules must fail CLOSED.
  const conflicting=times.size>1;
  const picked=trusted[0]??list[0];
  const fixture=picked.fixture;
  let state:NextGoodAction,reason:string;
  let homeCount:number|null=null,awayCount:number|null=null;
  if(conflicting){
   state='conflict';reason='Horários oficiais divergentes: reconfirmar antes de analisar';
  }else if(!trusted.length){
   state='needs_recheck';reason='Fonte vencida ou horário N/D: reconfirmar oficialmente';
  }else{
   const overview=buildRadarDailyOverview(data,fixture);
   homeCount=overview?.homeCount??0;
   awayCount=overview?.awayCount??0;
   if(!overview||!overview.hasKickoffTime||
      homeCount<5||awayCount<5){
    state='needs_history';
    reason='Histórico insuficiente nesta temporada e competição';
   }else{
    state='preview';
    reason='Histórico básico disponível; prévia possível, sem indicação de As Boas';
   }
  }
  entries.push({fixture,verifiedAt:picked.verifiedAt,state,
   homeCount,awayCount,reason});
 }
 entries.sort((a,b)=>
  priorities[a.state]-priorities[b.state]||
  a.fixture.date.localeCompare(b.fixture.date)||
  (a.fixture.time??'99:99').localeCompare(b.fixture.time??'99:99')||
  a.fixture.id.localeCompare(b.fixture.id));
 return {entries,dateFrom:today,dateThrough:through,
  preview:entries.filter(x=>x.state==='preview').length,
  needsHistory:entries.filter(x=>x.state==='needs_history').length,
  needsRecheck:entries.filter(x=>x.state==='needs_recheck').length,
  conflicts:entries.filter(x=>x.state==='conflict').length};
}

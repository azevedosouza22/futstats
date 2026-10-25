/**
 * Priority-only checklist for on-demand human rechecking of official fixtures.
 * This never fetches URLs, renews verifiedAt, writes browser storage, or
 * elevates a provisional/community fixture to a trustworthy source.
 */
import type {OfficialCalendarItem} from './officialCalendar';
import {brasiliaDate} from './calendar';

export type OfficialRecheckReason='expired'|'soon'|'later';
export type OfficialRecheckEntry={
 item:OfficialCalendarItem;
 reason:OfficialRecheckReason;
};
export type OfficialRecheckQueue={
 entries:OfficialRecheckEntry[];
 expired:number;soon:number;later:number;
};

/** Time is explicitly interpreted as Brasília's UTC−03 reference for 2026.
 * Expired records have time=null; NEVER reconstruct their previous hour.
 */
function within48h(item:OfficialCalendarItem,now:Date):boolean{
 const {fixture}=item;
 if(!fixture.time)return false;
 const utc=Date.parse(fixture.date+'T'+fixture.time+':00-03:00');
 return Number.isFinite(utc)&&utc>now.getTime()&&utc-now.getTime()<=48*60*60*1000;
}
const priority:Record<OfficialRecheckReason,number>={expired:0,soon:1,later:2};

/** Takes ONLY prefiltered official fixtures (all have original source links).
 * A click in the UI merely opens the original page; it is not verification.
 */
export function officialRecheckQueue(
 official:readonly OfficialCalendarItem[],now=new Date()
):OfficialRecheckQueue{
 const today=brasiliaDate(now).date;
 const entries:OfficialRecheckEntry[]=[];
 const seen=new Set<string>();
 for(const item of official){
  const f=item.fixture;
  if(seen.has(f.id)||f.date<today)continue;
  seen.add(f.id);
  const reason:OfficialRecheckReason=(!item.fresh||f.time===null)
   ?'expired':within48h(item,now)?'soon':'later';
  entries.push({item,reason});
 }
 entries.sort((a,b)=>priority[a.reason]-priority[b.reason]||
  a.item.fixture.date.localeCompare(b.item.fixture.date)||
  (a.item.fixture.time??'99:99').localeCompare(b.item.fixture.time??'99:99')||
  a.item.fixture.id.localeCompare(b.item.fixture.id));
 return {
  entries,
  expired:entries.filter(x=>x.reason==='expired').length,
  soon:entries.filter(x=>x.reason==='soon').length,
  later:entries.filter(x=>x.reason==='later').length
 };
}

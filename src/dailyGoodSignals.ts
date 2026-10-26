/**
 * "As Boas do Dia" — conservative, EXPLAINABLE shortlist using the existing
 * frozen-design V2/V3 heuristics, not a trained or calibrated AI model.
 *
 * Explicit constraints: only today's future fixtures whose kickoff is in a
 * recently verified official snapshot; prior matches from the exact league;
 * no Work/Main blending; no corners signals without a supported model.
 * The result is read-only and NEVER saves predictions automatically.
 */
import type {Data} from './model';
import {brasiliaDate,normalizeTeam,type ScheduledFixture} from './calendar';
import type {OfficialCalendarItem} from './officialCalendar';
import {buildRadarDailyOverview} from './radarDailyOverview';
import {safeOfficialFixtureUrl,officialSnapshotFreshAt} from './officialSourceTrust';
import {canonicalTeamInCompetition} from './radarTeamAliases';

export type DailyGoodSignal={
  id:string;label:string;line:number;direction:'Over'|'Under';
  projection:number;historicalMean:number;historicalSample:number;
  leagueSample:number;relativeDistance:number;
};
export type DailyGoodFixture={
  fixture:ScheduledFixture;verifiedAt:string;signals:DailyGoodSignal[];
};
/** Read-only explanation for each league; never outcome measurements. */
export type DailyGoodLeagueReadiness={
  competition:string;scheduledFuture:number;needsRecheck:number;
  otherDates:number;todayVerified:number;insufficientHistory:number;
  noConsistentSignal:number;qualified:number;featured:number;conflictingKickoff:number;
};
export type DailyGoodKickoffConflict={
  fixture:ScheduledFixture;
  references:{time:string;verifiedAt:string;sourceUrl:string}[];
};
export type DailyGoodResult={
  date:string;checked:number;withAdequateHistory:number;
  items:DailyGoodFixture[];readiness:DailyGoodLeagueReadiness[];
  conflicts:DailyGoodKickoffConflict[];
};
const validDate=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&
  !Number.isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
function verifiable(item:OfficialCalendarItem,today:string,clock:string){
 const f=item.fixture;
 if(!item.fresh||!validDate(item.verifiedAt)||!validDate(f.date)||
    f.date!==today||!f.time||!/^([01]\d|2[0-3]):[0-5]\d$/.test(f.time)||
    f.time<=clock)return false;
 return officialSnapshotFreshAt(item.verifiedAt,today)&&
   safeOfficialFixtureUrl(f.sourceUrl);
}
const safeNumber=(n:number|null):n is number=>
 typeof n==='number'&&Number.isFinite(n)&&n>=0;

/**
 * Conservative inclusion policy, not a claim of prediction accuracy:
 * five earlier games per club, eight usable match totals, ten league
 * observations, both algorithms signaling the SAME direction and a V2
 * projection at least 15% from the illustrative threshold.
 */
export function selectDailyGoodSignals(
 data:Data,official:readonly OfficialCalendarItem[],now=new Date()
):DailyGoodResult{
 const {date,time}=brasiliaDate(now);
 const found:DailyGoodFixture[]=[];
 const conflicts:DailyGoodKickoffConflict[]=[];
 // Canonical aliases are scoped to the exact competition/season. Do not
 // select a convenient kickoff when equally current trusted URLs disagree.
 // All of this is a read-only view of caller-owned snapshots.
 const groups=new Map<string,OfficialCalendarItem[]>();
 for(const entry of official){
   const f=entry.fixture;
   const id=[f.date,normalizeTeam(f.competition),
     canonicalTeamInCompetition(f.home,f.competition),
     canonicalTeamInCompetition(f.away,f.competition)].join('|');
   const group=groups.get(id)??[];
   group.push(entry);groups.set(id,group);
 }
 const byLeague=new Map<string,DailyGoodLeagueReadiness>();
 const league=(competition:string)=>{
   let item=byLeague.get(competition);
   if(!item){
     item={competition,scheduledFuture:0,needsRecheck:0,otherDates:0,
       todayVerified:0,insufficientHistory:0,noConsistentSignal:0,
       qualified:0,featured:0,conflictingKickoff:0};
     byLeague.set(competition,item);
   }
   return item;
 };
 let checked=0,withAdequateHistory=0;
 for(const group of groups.values()){
   // A stale/untrusted entry cannot contradict a genuinely fresh official
   // observation. But two fresh observations with different clocks are a
   // hard conflict, INCLUDING when one kickoff has already passed.
   const trusted=group.filter(item=>
     item.fresh&&validDate(item.verifiedAt)&&
     officialSnapshotFreshAt(item.verifiedAt,date)&&
     safeOfficialFixtureUrl(item.fixture.sourceUrl)&&
     validDate(item.fixture.date)&&
     item.fixture.time!==null&&
     /^([01]\\d|2[0-3]):[0-5]\\d$/.test(item.fixture.time));
   const trustedTimes=new Set(trusted.map(item=>item.fixture.time));
   const entry=[...trusted].sort((a,b)=>b.verifiedAt.localeCompare(a.verifiedAt))[0]??group[0];
   const f=entry.fixture;
   // Count a conflicting same-day schedule only if a candidate is still
   // future, even when an alternate source reports a past kickoff.
   const potentiallyFuture=group.some(item=>
     item.fixture.date>date||
     (item.fixture.date===date&&
       (item.fixture.time===null||item.fixture.time>time)));
   if(f.date<date||!potentiallyFuture)continue;
   const stat=league(f.competition);
   stat.scheduledFuture++;
   if(trustedTimes.size>1){
     stat.needsRecheck++;
     stat.conflictingKickoff++;
     conflicts.push({fixture:{...f,time:null},references:trusted.map(item=>({
       time:item.fixture.time!,verifiedAt:item.verifiedAt,
       sourceUrl:item.fixture.sourceUrl
     })).sort((a,b)=>a.time.localeCompare(b.time)||a.sourceUrl.localeCompare(b.sourceUrl))});
     continue;
   }
   if(!entry.fresh||!f.time||
     !officialSnapshotFreshAt(entry.verifiedAt,date)||
     !safeOfficialFixtureUrl(f.sourceUrl)){
     stat.needsRecheck++;
     continue;
   }
   if(f.date!==date){stat.otherDates++;continue;}
   if(!verifiable(entry,date,time)){stat.needsRecheck++;continue;}
   checked++;stat.todayVerified++;
   const overview=buildRadarDailyOverview(data,f);
   if(!overview||!overview.hasKickoffTime||
      overview.homeCount<5||overview.awayCount<5){
     stat.insufficientHistory++;
     continue;
   }
   withAdequateHistory++;
   const signals:DailyGoodSignal[]=[];
   for(const metric of overview.indicators){
     if(metric.id==='corners-full-8.5'||metric.v2===null||metric.v3===null||
        metric.v2!==metric.v3||metric.v2==='Sem sinal'||metric.v3==='Sem sinal'||
        !safeNumber(metric.historicalMean)||!safeNumber(metric.projectedTotal)||
        metric.historicalSample<8||metric.leagueSample<10||
        metric.line<=0||!Number.isFinite(metric.line))continue;
     const distance=Math.abs(metric.projectedTotal-metric.line)/metric.line;
     if(distance<0.15||!Number.isFinite(distance)||
       (metric.v2==='Over'&&metric.projectedTotal<=metric.line)||
       (metric.v2==='Under'&&metric.projectedTotal>=metric.line))continue;
     signals.push({
       id:metric.id,label:metric.name,line:metric.line,
       direction:metric.v2,projection:metric.projectedTotal,
       historicalMean:metric.historicalMean,
       historicalSample:metric.historicalSample,
       leagueSample:metric.leagueSample,relativeDistance:distance
     });
   }
   if(!signals.length){stat.noConsistentSignal++;continue;}
   stat.qualified++;
   signals.sort((a,b)=>b.relativeDistance-a.relativeDistance||
     a.id.localeCompare(b.id));
   found.push({fixture:f,verifiedAt:entry.verifiedAt,signals:signals.slice(0,3)});
 }
 found.sort((a,b)=>b.signals.length-a.signals.length||
   b.signals[0].relativeDistance-a.signals[0].relativeDistance||
   (a.fixture.time??'').localeCompare(b.fixture.time??'')||
   a.fixture.id.localeCompare(b.fixture.id));
 const featured=found.slice(0,3);
 for(const entry of featured)league(entry.fixture.competition).featured++;
 return {date,checked,withAdequateHistory,items:featured,conflicts,
   readiness:[...byLeague.values()].sort((a,b)=>a.competition.localeCompare(b.competition,'pt-BR'))};
}

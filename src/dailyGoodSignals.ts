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
import {brasiliaDate,type ScheduledFixture} from './calendar';
import type {OfficialCalendarItem} from './officialCalendar';
import {buildRadarDailyOverview} from './radarDailyOverview';

export type DailyGoodSignal={
  id:string;label:string;line:number;direction:'Over'|'Under';
  projection:number;historicalMean:number;historicalSample:number;
  leagueSample:number;relativeDistance:number;
};
export type DailyGoodFixture={
  fixture:ScheduledFixture;verifiedAt:string;signals:DailyGoodSignal[];
};
export type DailyGoodResult={
  date:string;checked:number;withAdequateHistory:number;
  items:DailyGoodFixture[];
};
const validDate=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&
  !Number.isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
const officialHosts=new Set([
  'www.cbf.com.br','www.laliga.com','www.lfp.fr','www.asroma.com'
]);
function verifiable(item:OfficialCalendarItem,today:string,clock:string){
 const f=item.fixture;
 if(!item.fresh||!validDate(item.verifiedAt)||!validDate(f.date)||
    f.date!==today||!f.time||!/^([01]\d|2[0-3]):[0-5]\d$/.test(f.time)||
    f.time<=clock)return false;
 const age=Math.floor((Date.parse(today+'T12:00:00Z')-
    Date.parse(item.verifiedAt+'T12:00:00Z'))/86400000);
 if(age<0||age>2)return false;
 try{
   const url=new URL(f.sourceUrl);
   if(url.protocol!=='https:'||url.username||url.password||
      !officialHosts.has(url.hostname.toLowerCase()))return false;
 }catch{return false;}
 return true;
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
 const seen=new Set<string>();
 let checked=0,withAdequateHistory=0;
 for(const entry of official){
   if(!verifiable(entry,date,time))continue;
   const f=entry.fixture;
   const identity=[f.date,f.competition,f.home.toLowerCase().trim(),f.away.toLowerCase().trim()].join('|');
   if(seen.has(identity))continue;
   seen.add(identity);
   checked++;
   const overview=buildRadarDailyOverview(data,f);
   if(!overview||!overview.hasKickoffTime||
      overview.homeCount<5||overview.awayCount<5)continue;
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
   if(!signals.length)continue;
   signals.sort((a,b)=>b.relativeDistance-a.relativeDistance||
     a.id.localeCompare(b.id));
   found.push({fixture:f,verifiedAt:entry.verifiedAt,signals:signals.slice(0,3)});
 }
 found.sort((a,b)=>b.signals.length-a.signals.length||
   b.signals[0].relativeDistance-a.signals[0].relativeDistance||
   (a.fixture.time??'').localeCompare(b.fixture.time??'')||
   a.fixture.id.localeCompare(b.fixture.id));
 return {date,checked,withAdequateHistory,items:found.slice(0,3)};
}

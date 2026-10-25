/**
 * Small, manually verified, read-only fixture register.
 *
 * Each entry cites an official event URL, a verified-on date, an explicit
 * timezone and a UTC kickoff. NEVER call this a live schedule/feed.
 * The Work records here are only used as fixture metadata: no Work statistics
 * or predictions are imported into the main FutStats database.
 */
import {brasiliaDate,normalizeTeam,type ScheduledFixture} from './calendar';
import {VERIFIED_EUROPE_FIXTURES,fixtureWithOfficialTime} from './verifiedEuropeWorkFixtures';

export type OfficialCalendarRecord={
  id:string;competition:string;home:string;away:string;
  localDate:string;localTime:string;timezone:string;utcKickoff:string;
  officialUrl:string;verifiedAt:string;
};
export type OfficialCalendarItem={
  fixture:ScheduledFixture;
  verifiedAt:string;
  /** Stale references never transfer kickoff time to prediction controls. */
  fresh:boolean;
};

const CBF_FIXTURES:readonly OfficialCalendarRecord[]=[
  {id:'cbf-coritiba-gremio-20261026',competition:'Brasileirão Série A',
   home:'Coritiba',away:'Grêmio',localDate:'2026-10-26',localTime:'19:30',
   timezone:'America/Sao_Paulo',utcKickoff:'2026-10-26T22:30:00Z',
   officialUrl:'https://www.cbf.com.br/futebol-brasileiro/jogos/campeonato-brasileiro/serie-a/2026/coritiba-saf-x-gremio/832208?view=escala-de-arbitros',
   verifiedAt:'2026-10-25'},
  {id:'cbf-flamengo-atletico-20261026',competition:'Brasileirão Série A',
   home:'Flamengo',away:'Atlético-MG',localDate:'2026-10-26',localTime:'20:00',
   timezone:'America/Sao_Paulo',utcKickoff:'2026-10-26T23:00:00Z',
   officialUrl:'https://www.cbf.com.br/futebol-brasileiro/jogos/campeonato-brasileiro/serie-a/2026/x/832201',
   verifiedAt:'2026-10-25'},
  {id:'cbf-santos-palmeiras-20261028',competition:'Brasileirão Série A',
   home:'Santos',away:'Palmeiras',localDate:'2026-10-28',localTime:'19:30',
   timezone:'America/Sao_Paulo',utcKickoff:'2026-10-28T22:30:00Z',
   officialUrl:'https://www.cbf.com.br/futebol-brasileiro/jogos/campeonato-brasileiro/serie-a/2026/santos-fc-x-palmeiras/832213?view=escala-de-arbitros',
   verifiedAt:'2026-10-25'},
  {id:'cbf-bahia-sao-paulo-20261028',competition:'Brasileirão Série A',
   home:'Bahia',away:'São Paulo',localDate:'2026-10-28',localTime:'21:30',
   timezone:'America/Sao_Paulo',utcKickoff:'2026-10-29T00:30:00Z',
   officialUrl:'https://www.cbf.com.br/futebol-brasileiro/jogos/campeonato-brasileiro/serie-a/2026/bahia-x-sao-paulo/832219?view=escala-de-arbitros',
   verifiedAt:'2026-10-25'},
];

const WORK_LEAGUES:Record<string,string>={
  'serie-a':'Serie A italiana 2026/27',
  'la-liga':'La Liga espanhola 2026/27',
  'ligue-1':'Ligue 1 francesa 2026/27',
};
const supportedHosts=new Set([
  'www.cbf.com.br','www.laliga.com','www.lfp.fr','www.asroma.com'
]);
const dateValid=(value:string)=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&
  !Number.isNaN(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
const timestamp=(value:string)=>/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value)&&
  !Number.isNaN(Date.parse(value));
const stamp=(when:Date,zone:string)=>{
  const fields=new Intl.DateTimeFormat('en-GB',{
    timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',
    hour:'2-digit',minute:'2-digit',hourCycle:'h23'
  }).formatToParts(when);
  const part=(key:string)=>fields.find(v=>v.type===key)?.value??'';
  return part('year')+'-'+part('month')+'-'+part('day')+'T'+part('hour')+':'+part('minute');
};
const daysSinceVerification=(verifiedAt:string,today:string)=>
  (Date.parse(today+'T00:00:00Z')-Date.parse(verifiedAt+'T00:00:00Z'))/86400000;

function safeOfficialSource(url:string){
  try {
    const parsed=new URL(url);
    return parsed.protocol==='https:'&&!parsed.username&&!parsed.password&&
      supportedHosts.has(parsed.hostname);
  }catch{return false;}
}

/** Pure projection of a reviewed reference. Null means malformed/past. */
export function officialCalendarItem(record:OfficialCalendarRecord,now=new Date()):OfficialCalendarItem|null{
  if(!dateValid(record.localDate)||!dateValid(record.verifiedAt)||
    !timestamp(record.utcKickoff)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(record.localTime)||
    !safeOfficialSource(record.officialUrl)||!record.competition.trim()||
    !record.home.trim()||!record.away.trim()||
    normalizeTeam(record.home)===normalizeTeam(record.away))return null;
  const kickoff=new Date(record.utcKickoff);
  if(kickoff.getTime()<=now.getTime())return null;
  try{
    if(stamp(kickoff,record.timezone)!==record.localDate+'T'+record.localTime)return null;
  }catch{return null;}
  const br=brasiliaDate(kickoff);
  const elapsed=daysSinceVerification(record.verifiedAt,brasiliaDate(now).date);
  if(elapsed<0)return null;
  const fresh=elapsed<=2;
  return {
    fixture:{
      id:['official',record.id,br.date,
        normalizeTeam(record.home),normalizeTeam(record.away)].join('|'),
      date:br.date,time:fresh?br.time:null,competition:record.competition,
      home:record.home,away:record.away,sourceUrl:record.officialUrl,
    },
    verifiedAt:record.verifiedAt,fresh
  };
}

/** Only a few manually checked fixtures; NO network fetch or auto-refresh. */
export function readOfficialCalendar(now=new Date()):OfficialCalendarItem[]{
  const entries:OfficialCalendarRecord[]=[...CBF_FIXTURES];
  for(const item of VERIFIED_EUROPE_FIXTURES){
    if(!fixtureWithOfficialTime(item,now))continue;
    const competition=WORK_LEAGUES[item.league];
    if(!competition)continue;
    entries.push({
      id:item.key,competition,home:item.home,away:item.away,
      localDate:item.localDate,localTime:item.localTime,
      timezone:item.timezone,utcKickoff:item.utcKickoff,
      officialUrl:item.officialUrl,verifiedAt:item.verifiedAt
    });
  }
  const unique=new Map<string,OfficialCalendarItem>();
  for(const record of entries){
    const item=officialCalendarItem(record,now);
    if(!item)continue;
    const f=item.fixture;
    const identity=[f.date,f.competition,normalizeTeam(f.home),normalizeTeam(f.away)].join('|');
    if(!unique.has(identity))unique.set(identity,item);
  }
  return [...unique.values()].sort((a,b)=>
    a.fixture.date.localeCompare(b.fixture.date)||
    (a.fixture.time??'99:99').localeCompare(b.fixture.time??'99:99')||
    a.fixture.home.localeCompare(b.fixture.home));
}

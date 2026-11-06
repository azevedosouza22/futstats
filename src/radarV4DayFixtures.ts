/** Experimental full-day fixture discovery for Radar V4 ONLY.
 * Community calendar dates may be in a foreign timezone; all entries remain
 * unverified candidates without authoritative kickoff (time=null).
 * NEVER writes into FutStats historical games or saved V2/V3 forecasts.
 */
import {normalizeTeam,type ScheduledFixture} from './calendar';
import {EUROPE_LEAGUES} from './europeLeagueResearch';
import {OPENFOOTBALL_URL,OPENFOOTBALL_PAGE,parseFreePremier} from './openFootball';
import type {OfficialCalendarItem} from './officialCalendar';
import {competitionParts} from './leagueCatalog';

export type V4DayListing={fixture:ScheduledFixture;origin:'official'|'csv'|'community';
 label:string;fresh:boolean};
const limitBytes=1_200_000;
const validDay=(d:string)=>/^20\d\d-\d\d-\d\d$/.test(d)&&
 !Number.isNaN(Date.parse(d))&&new Date(d+'T00:00:00Z').toISOString().slice(0,10)===d;
const obj=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x);
const name=(x:unknown):x is string=>typeof x==='string'&&!!x.trim()&&x.length<=120;

export type V4CommunityResult={fixtures:ScheduledFixture[];errors:string[]};
/** Unlike the existing future-only calendar, this includes fixtures with posted scores. */
export function parseV4CommunityDay(raw:unknown,competition:string,day:string,url:string):ScheduledFixture[]{
 if(!validDay(day)||!obj(raw)||!Array.isArray(raw.matches)||raw.matches.length>500)
  throw Error('Calendário comunitário do V4 inválido.');
 const ids=new Set<string>(),fixtures:ScheduledFixture[]=[];
 for(const entry of raw.matches){
  if(!obj(entry)||entry.date!==day)continue;
  if(!name(entry.team1)||!name(entry.team2)||normalizeTeam(entry.team1)===normalizeTeam(entry.team2))
   throw Error('Confronto sem identidade confirmável no catálogo V4.');
  const id=['v4-community',day,competition,normalizeTeam(entry.team1),
   normalizeTeam(entry.team2)].join('|');
  if(ids.has(id))continue;ids.add(id);
  fixtures.push({id,date:day,time:null,competition,home:entry.team1,
   away:entry.team2,sourceUrl:url});
 }
 return fixtures;
}
async function getJson(url:string,signal:AbortSignal|undefined,fetcher:typeof fetch){
 const response=await fetcher(url,{signal,cache:'no-store'});
 if(!response.ok)throw Error('Resposta HTTP '+response.status);
 const bytes=response.headers.get('content-length');
 if(bytes&&Number(bytes)>limitBytes)throw Error('Catálogo excedeu limite permitido.');
 const body=await response.text();
 if(body.length>limitBytes)throw Error('Catálogo excedeu limite permitido.');
 return JSON.parse(body) as unknown;
}
/** Four supported free leagues (Premier, Spanish, Italian, French).
 * Portugal, Germany, Brazil, Saudi require other verified/date-scoped sources.
 */
export async function consultV4CommunityDay(
 day:string,signal?:AbortSignal,fetcher:typeof fetch=fetch
):Promise<V4CommunityResult>{
 if(!validDay(day))throw Error('Data inválida para descoberta V4.');
 const fixtures:ScheduledFixture[]=[],errors:string[]=[];
 const catalogues=[...EUROPE_LEAGUES.map(x=>({
  name:x.name,competition:x.competition,url:x.url,page:x.page})),
  {name:'Premier League',competition:'Premier League inglesa 2026/27',
   url:OPENFOOTBALL_URL,page:OPENFOOTBALL_PAGE}];
 await Promise.all(catalogues.map(async source=>{
  try{
   const raw=await getJson(source.url,signal,fetcher);
   // Premier parser validates season/fixture rows with the current project schema.
   if(source.url===OPENFOOTBALL_URL){
    const pl=parseFreePremier(raw);
    fixtures.push(...pl.fixtures.filter(x=>x.date===day).map(x=>({
     id:'v4-community|'+x.id,date:day,time:null,
     competition:source.competition,home:x.home,away:x.away,sourceUrl:source.page
    })));
   }else fixtures.push(...parseV4CommunityDay(raw,source.competition,day,source.page));
  }catch(e){
   errors.push(source.name+': '+(e instanceof Error?e.message:'indisponível'));
  }
 }));
 return {fixtures:fixtures.sort((a,b)=>a.competition.localeCompare(b.competition)||
  a.home.localeCompare(b.home)),errors};
}
/** Conservative club aliases used for grouping list entries only. */
function matchingName(name:string,competition:string){
 const v=normalizeTeam(name).replace(/[^a-z0-9]+/g,' ').trim();
 const aliases:Record<string,string>={
  'sv elversberg':'elversberg','1 fsv mainz 05':'mainz','mainz 05':'mainz',
  'villarreal cf':'villarreal','rcd espanyol':'espanyol',
  'paris saint germain':'psg','paris saint germain fc':'psg'
 };
 return competition+'|'+(aliases[v]??v);
}
function fixtureKey(f:ScheduledFixture){
 const parts=competitionParts(f.competition);
 const season=parts.season==='Sem temporada'&&parts.league==='Brasileirão Série A'
  ?f.date.slice(0,4):parts.season;
 return [f.date,parts.league,season,
  matchingName(f.home,parts.league),matchingName(f.away,parts.league)].join('|');
}
export function combineV4DayListings(
 day:string,official:readonly OfficialCalendarItem[],
 csv:readonly ScheduledFixture[],community:readonly ScheduledFixture[]
):V4DayListing[]{
 const listed:V4DayListing[]=[];
 const seen=new Set<string>();
 const add=(f:ScheduledFixture,origin:V4DayListing['origin'],label:string,fresh=false)=>{
  if(f.date!==day)return;
  const id=fixtureKey(f);
  if(seen.has(id))return;seen.add(id);
  listed.push({fixture:f,origin,label,fresh});
 };
 for(const x of official)add(x.fixture,'official',x.fresh?
  'Fonte oficial recentemente conferida':'Fonte oficial histórica — horário precisa de reconferência',x.fresh);
 for(const f of csv)add(f,'csv','Agenda CSV local — horário e fonte não reconfirmados');
 for(const f of community)add(f,'community',
  'Catálogo comunitário — data provisória, fuso não verificado');
 return listed;
}

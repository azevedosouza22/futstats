/**
 * On-demand, READ-ONLY discovery of candidate 2026/27 fixtures from free
 * OpenFootball catalogues already used elsewhere in FutStats.
 *
 * The catalogue is community maintained: fixture dates may be stale; kickoff
 * strings lack an authoritative timezone. Therefore all candidates have
 * time=null and may NEVER be auto-registered as verified predictions.
 * No timers, polling, localStorage writes or import into historical matches.
 */
import {type ScheduledFixture,brasiliaDate,normalizeTeam} from './calendar';
import {EUROPE_LEAGUES} from './europeLeagueResearch';
import {parseEuropeSchedule} from './europeWorkSchedule';
import {OPENFOOTBALL_URL,OPENFOOTBALL_PAGE,parseFreePremier} from './openFootball';

export type FreeAgendaCandidate={
  fixture:ScheduledFixture;
  origin:'community-catalogue';
  /** Source league-date; NOT confirmed Brasilia date or official kickoff. */
  provisionalDate:true;
};
export type FreeAgendaResult={
  candidates:FreeAgendaCandidate[];
  errors:string[];
  consultedAt:string;
};
const maxResponseBytes=1_200_000;
const maxCandidates=160;
const endOfPeriod=(today:string)=>{
  const d=new Date(today+'T12:00:00Z');
  d.setUTCDate(d.getUTCDate()+30);
  return d.toISOString().slice(0,10);
};
const candidate=(league:string,date:string,home:string,away:string,sourceUrl:string):FreeAgendaCandidate=>({
  fixture:{
    id:['community',league,date,normalizeTeam(home),normalizeTeam(away)].join('|'),
    date,time:null,competition:league,home,away,sourceUrl
  },
  origin:'community-catalogue',provisionalDate:true
});
async function download(url:string,signal:AbortSignal|undefined,get:typeof fetch){
  const response=await get(url,{signal,cache:'no-store'});
  if(!response.ok)throw Error('fonte não respondeu ('+response.status+')');
  // No size guarantees in third-party HTTP responses; enforce a strict cap.
  const length=response.headers?.get('content-length');
  if(length&&Number(length)>maxResponseBytes)throw Error('arquivo muito grande');
  const raw=await response.text();
  if(raw.length>maxResponseBytes)throw Error('arquivo muito grande');
  return JSON.parse(raw) as unknown;
}
export async function consultFreeAgenda(
  now=new Date(),signal?:AbortSignal,get:typeof fetch=fetch
):Promise<FreeAgendaResult>{
  const today=brasiliaDate(now).date;
  const last=endOfPeriod(today);
  const candidates:FreeAgendaCandidate[]=[];
  const errors:string[]=[];
  await Promise.all([
    ...EUROPE_LEAGUES.map(async league=>{
      try{
        const raw=await download(league.url,signal,get);
        const fixtures=parseEuropeSchedule(raw,league.id,league.page,today,100);
        for(const f of fixtures)if(f.date<=last)
          candidates.push(candidate(league.competition,f.date,f.home,f.away,league.page));
      }catch(e){
        if(signal?.aborted)return;
        errors.push(league.name+': '+(e instanceof Error?e.message:'consulta indisponível'));
      }
    }),
    (async()=>{
      try{
        const raw=await download(OPENFOOTBALL_URL,signal,get);
        const fixtures=parseFreePremier(raw).fixtures;
        for(const f of fixtures)if(f.fullTime===null&&f.date>=today&&f.date<=last)
          candidates.push(candidate('Premier League inglesa 2026/27',f.date,f.home,f.away,OPENFOOTBALL_PAGE));
      }catch(e){
        if(signal?.aborted)return;
        errors.push('Premier League: '+(e instanceof Error?e.message:'consulta indisponível'));
      }
    })()
  ]);
  const byId=new Map<string,FreeAgendaCandidate>();
  for(const item of candidates)byId.set(item.fixture.id,item);
  const sorted=[...byId.values()].sort((a,b)=>
    a.fixture.date.localeCompare(b.fixture.date)||
    a.fixture.competition.localeCompare(b.fixture.competition)||
    a.fixture.home.localeCompare(b.fixture.home)
  );
  return {candidates:sorted.slice(0,maxCandidates),errors,consultedAt:now.toISOString()};
}

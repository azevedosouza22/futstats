/**
 * Read-only overview of 2026/27 European league fixtures from the CC0
 * OpenFootball JSON catalogue already used by the FutStats pilot.
 *
 * IMPORTANT: time strings in this catalogue do NOT include an explicit
 * timezone. Display them only as "horário local da liga" and NEVER turn
 * them into Brasilia timestamps or freeze a prospective signal from them.
 * Some sources are stale. Do not imply these are confirmed match times.
 */
import type {WorkLeague} from './workAnalysis';
import {EUROPE_LEAGUES} from './europeLeagueResearch';

export type EuropeScheduleLeague=Exclude<WorkLeague,'premier-league'>;
export type EuropeScheduleFixture={
 key:string;league:EuropeScheduleLeague;date:string;localTime:string|null;
 home:string;away:string;sourceUrl:string;
};
const isRecord=(x:unknown):x is Record<string,unknown>=>
 !!x&&typeof x==='object'&&!Array.isArray(x);
const isDate=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&
 !Number.isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
const localTime=(v:unknown):string|null=>
 typeof v==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(v)?v:null;
export function parseEuropeSchedule(
 json:unknown,league:EuropeScheduleLeague,sourceUrl:string,
 afterDay:string,limit=20
):EuropeScheduleFixture[]{
 if(!isRecord(json)||!Array.isArray(json.matches)||json.matches.length>500)
  throw Error('Arquivo de calendário inválido ou muito grande.');
 if(!isDate(afterDay)||limit<1||limit>100)
  throw Error('Período de consulta inválido.');
 const out:EuropeScheduleFixture[]=[];
 const seen=new Set<string>();
 for(const m of json.matches){
  if(!isRecord(m)||typeof m.date!=='string'||!isDate(m.date)||
   m.date<afterDay||typeof m.team1!=='string'||typeof m.team2!=='string'||
   !m.team1.trim()||!m.team2.trim()||m.team1===m.team2||
   'score' in m)continue;
  const key=[league,m.date,m.team1,m.team2].join('|');
  if(seen.has(key))continue;seen.add(key);
  out.push({key,league,date:m.date,localTime:localTime(m.time),
   home:m.team1,away:m.team2,sourceUrl});
 }
 return out.sort((a,b)=>a.date.localeCompare(b.date)||
  (a.localTime??'99:99').localeCompare(b.localTime??'99:99')).slice(0,limit);
}
export async function loadEuropeSchedule(
 now=new Date(),signal?:AbortSignal,get:typeof fetch=fetch
):Promise<{fixtures:EuropeScheduleFixture[];errors:string[]}>{
 const today=new Intl.DateTimeFormat('en-CA',{
  timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'
 }).format(now);
 // Only tomorrow+; we cannot distinguish elapsed from future matches today
 // because OpenFootball's wall-clock time has no authoritative UTC offset.
 const tomorrow=new Date(today+'T12:00:00Z');
 tomorrow.setUTCDate(tomorrow.getUTCDate()+1);
 const date=tomorrow.toISOString().slice(0,10);
 const fixtures:EuropeScheduleFixture[]=[];
 const errors:string[]=[];
 await Promise.all(EUROPE_LEAGUES.map(async (league)=>{
  try{
   const response=await get(league.url,{signal,cache:'no-store'});
   if(!response.ok)throw Error('fonte temporariamente indisponível');
   const raw=await response.text();
   if(raw.length>1_200_000)throw Error('arquivo excedeu o limite');
   const parsed:unknown=JSON.parse(raw);
   fixtures.push(...parseEuropeSchedule(parsed,league.id,league.url,date,10));
  }catch(e){
   if(signal?.aborted)return;
   errors.push(league.competition+': '+(e instanceof Error?e.message:'falha ao ler agenda'));
  }
 }));
 return {fixtures:fixtures.sort((a,b)=>a.date.localeCompare(b.date)||
   a.league.localeCompare(b.league)),errors};
}

/**
 * Free, public fixture-calendar adapter for Premier League 2026/27.
 *
 * Uses the already integrated FPL Core Insights public CSVs. This is a
 * non-official fixture feed and can be revised. It supplies FUTURE schedule
 * metadata only; never fabricate stats, assume final scores or change a
 * previously frozen prediction.
 *
 * No user historic/Work data are sent to this provider. No API key required.
 */
import {parseCsv,FPL_PREVIEW_RAW,FPL_PREVIEW_ROUNDS} from './fplFreePilot';
import {inspectNextFplRound,FPL_MAX_ROUNDS} from './fplRoundDiscovery';
import {brasiliaDate,normalizeTeam} from './calendar';
import type {WorkAnalysisMatch} from './workAnalysis';
import {
 freezeWorkForecast,appendFrozenWorkForecast,readFrozenWorkForecasts,
 type FrozenWorkForecast
} from './workRadarProspective';

export type AutoWorkFixture={
 id:string;gw:number;home:string;away:string;
 kickoffUtc:string;date:string;time:string;sourceUrl:string;
};
export type AutomaticCaptureResult={
 saved:FrozenWorkForecast[];added:number;
 duplicates:number;skipped:number;errors:string[];
};
export const AUTO_WORK_RADAR_SETTING='futstats:work-radar-auto-open:v1';
export const AUTO_WORK_RADAR_HOURS=72;
const maxSourceSize=250000;
const url=(gw:number)=>
 FPL_PREVIEW_RAW+'By%20Tournament/Premier%20League/GW'+gw+'/matches.csv';
export function parseUpcomingPremierWeek(
 teamsCsv:string,gameweekCsv:string,gw:number,now:Date
):AutoWorkFixture[]{
 const fixtures=inspectNextFplRound(gameweekCsv,gw,teamsCsv);
 const result:AutoWorkFixture[]=[];
 for(const f of fixtures){
  // Date is a precisely formatted UTC kickoff in the upstream source.
  if(f.status!=='a-jogar')continue;
  const parsed=new Date(f.date+'Z');
  if(Number.isNaN(parsed.getTime())||parsed.getTime()<=now.getTime())continue;
  const br=brasiliaDate(parsed);
  result.push({
   id:f.id,gw:f.gw,home:f.home,away:f.away,
   kickoffUtc:f.date+'Z',date:br.date,time:br.time,sourceUrl:url(gw)
  });
 }
 return result;
}
export async function loadUpcomingPremierFixtures(
 now=new Date(),signal?:AbortSignal,
 get:typeof fetch=fetch
):Promise<AutoWorkFixture[]>{
 const teamsResponse=await get(FPL_PREVIEW_RAW+'teams.csv',
  {signal,cache:'no-store'});
 if(!teamsResponse.ok)throw Error('Calendário gratuito da Premier League indisponível.');
 const teamsCsv=await teamsResponse.text();
 if(teamsCsv.length>maxSourceSize)throw Error('Arquivo de equipes acima do limite.');
 const found:AutoWorkFixture[]=[];
 const ids=new Set<string>();
 let seenUpcoming=false;
 // Fetch just a few rounds at a time. This is reading an already public CSV,
 // not bulk extracting proprietary game statistics.
 for(let gw=FPL_PREVIEW_ROUNDS+1;gw<=FPL_MAX_ROUNDS;gw+=4){
  const rounds=Array.from({length:Math.min(4,FPL_MAX_ROUNDS-gw+1)},(_,i)=>gw+i);
  const replies=await Promise.all(rounds.map(async n=>{
   const response=await get(url(n),{signal,cache:'no-store'});
   if(response.status===404)return {n,csv:null};
   if(!response.ok)throw Error('Agenda pública indisponível, tente novamente quando abrir o app.');
   const csv=await response.text();
   if(csv.length>maxSourceSize)throw Error('CSV da próxima rodada excede 250 KB.');
   return {n,csv};
  }));
  if(replies.every(r=>r.csv===null)&&!found.length)
   throw Error('A fonte ainda não publicou as próximas rodadas.');
  for(const {n,csv} of replies){
   if(csv===null)continue;
   let fixtures:AutoWorkFixture[];
   try{fixtures=parseUpcomingPremierWeek(teamsCsv,csv,n,now);}
   catch{continue;} // Never use a malformed/partial fixture list.
   for(const f of fixtures){
    if(ids.has(f.id))continue;
    ids.add(f.id);found.push(f);
   }
  }
  if(found.length){seenUpcoming=true;break;}
  if(seenUpcoming)break;
 }
 return found.sort((a,b)=>a.kickoffUtc.localeCompare(b.kickoffUtc)||a.id.localeCompare(b.id));
}
export function automaticCaptureCandidates(fixtures:readonly AutoWorkFixture[],now=new Date()){
 const cutoff=now.getTime()+AUTO_WORK_RADAR_HOURS*3600*1000;
 return fixtures.filter(f=>{
  const t=Date.parse(f.kickoffUtc);
  return Number.isFinite(t)&&t>now.getTime()&&t<=cutoff;
 });
}
function resolveWorkTeam(matches:readonly WorkAnalysisMatch[],name:string):string|null{
 const normalize=(v:string)=>normalizeTeam(v)
  .replace(/\b(fc|afc|hotspur|united|city)\b/g,'').replace(/\s+/g,' ').trim();
 const aliases:Record<string,string>={
  'spurs':'tottenham','tottenham hotspur':'tottenham','tottenham hotspur fc':'tottenham',
  'nott m forest':'nottingham','nottingham forest':'nottingham',
  'man utd':'manchester','manchester united':'manchester',
  'man city':'manchester city',
 };
 const canon=(v:string)=>{
  const n=normalizeTeam(v).replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
  return aliases[n]??n;
 };
 const names=[...new Set(matches.filter(m=>m.league==='premier-league')
  .flatMap(m=>[m.home,m.away]))];
 const nameCanon=canon(name);
 const equals=names.filter(v=>canon(v)===nameCanon);
 return equals.length===1?equals[0]:null;
}
export function captureUpcomingWorkPredictions(
 matches:readonly WorkAnalysisMatch[],fixtures:readonly AutoWorkFixture[],
 raw:string|null,now=new Date()
):AutomaticCaptureResult{
 let saved=readFrozenWorkForecasts(raw);
 let current=JSON.stringify(saved);
 let added=0,duplicates=0,skipped=0;
 const errors:string[]=[];
 for(const fixture of automaticCaptureCandidates(fixtures,now)){
  // Case-insensitive alias mapping only for exact identities in the Premier
  // Work history. Unknown names are skipped rather than guessed.
  const localHome=resolveWorkTeam(matches,fixture.home);
  const localAway=resolveWorkTeam(matches,fixture.away);
  if(!localHome||!localAway){skipped++;continue;}
  const key=['premier-league',fixture.date,
   normalizeTeam(localHome),normalizeTeam(localAway)].join('|');
  if(saved.some(s=>s.id===key)){duplicates++;continue;}
  try{
   const forecast=freezeWorkForecast(matches,'premier-league',
    localHome,localAway,fixture.date+'T'+fixture.time,now);
   saved=appendFrozenWorkForecast(current,forecast);
   current=JSON.stringify(saved);
   added++;
  }catch(e){
   skipped++;
   if(errors.length<3)errors.push(e instanceof Error?e.message:'Dados incompatíveis para registrar jogo.');
  }
 }
 return {saved,added,duplicates,skipped,errors};
}

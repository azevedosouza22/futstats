/**
 * Carefully scoped experimental official-source pilot, NOT a complete live
 * schedule feed. These three fixtures were verified on 2026-10-23.
 *
 * New fixtures must NOT be inferred from the community OpenFootball calendar,
 * because its Toulouse-Troyes match was outdated (24th instead of 25th).
 * Every new candidate needs its own authoritative source and timezone-checked
 * UTC kickoff before it is added here.
 */
import {brasiliaDate,normalizeTeam} from './calendar';
import type {WorkAnalysisMatch,WorkLeague} from './workAnalysis';
import {
 readFrozenWorkForecasts,freezeWorkForecast,appendFrozenWorkForecast,
 type FrozenWorkForecast
} from './workRadarProspective';

export const EUROPE_VERIFIED_WORK_OPT_IN='futstats:work-radar-europe-verified-opt-in:v1';
export type OfficialFixture={
 key:string;league:Exclude<WorkLeague,'premier-league'>;
 home:string;away:string;
 localDate:string;localTime:string;timezone:string;utcKickoff:string;
 officialUrl:string;verifiedAt:string;
};
export const VERIFIED_EUROPE_FIXTURES:readonly OfficialFixture[]=[
 {
  key:'ita-napoli-roma-2026-10-24',league:'serie-a',
  home:'SSC Napoli',away:'AS Roma',localDate:'2026-10-24',localTime:'18:00',
  timezone:'Europe/Rome',utcKickoff:'2026-10-24T16:00:00Z',
  officialUrl:'https://www.asroma.com/it/notizie/75872/date-e-orari-delle-gare-dalla-sesta-alla-dodicesima-giornata',
  verifiedAt:'2026-10-23'
 },
 {
  key:'fra-toulouse-troyes-2026-10-25',league:'ligue-1',
  home:'Toulouse FC',away:'ES Troyes AC',localDate:'2026-10-25',localTime:'17:15',
  timezone:'Europe/Paris',utcKickoff:'2026-10-25T16:15:00Z',
  officialUrl:'https://www.lfp.fr/article/toulouse-fc-estac-troyes-decale-au-dimanche-25-octobre-a-17-h15',
  verifiedAt:'2026-10-23'
 },
 {
  key:'esp-barcelona-real-madrid-2026-10-25',league:'la-liga',
  home:'FC Barcelona',away:'Real Madrid CF',localDate:'2026-10-25',localTime:'21:00',
  timezone:'Europe/Madrid',utcKickoff:'2026-10-25T20:00:00Z',
  officialUrl:'https://www.laliga.com/partidazos/el-clasico',
  verifiedAt:'2026-10-23'
 }
];
const normalize=(v:string)=>normalizeTeam(v).replace(/[^a-z0-9 ]/g,' ')
 .replace(/\s+/g,' ').trim();
const aliases:Record<string,string>={
 'ssc napoli':'napoli','napoli':'napoli',
 'as roma':'roma','roma':'roma',
 'fc barcelona':'barcelona','barcelona':'barcelona',
 'real madrid cf':'real madrid','real madrid':'real madrid',
 'toulouse fc':'toulouse','toulouse':'toulouse',
 'es troyes ac':'troyes','estac troyes':'troyes','troyes':'troyes'
};
const canonical=(v:string)=>aliases[normalize(v)]??normalize(v);
function resolveTeam(matches:readonly WorkAnalysisMatch[],fixture:OfficialFixture,
 name:string):string|null{
 const local=[...new Set(matches.filter(x=>x.league===fixture.league)
  .flatMap(x=>[x.home,x.away]))];
 const exact=local.filter(x=>canonical(x)===canonical(name));
 return exact.length===1?exact[0]:null;
}
const localStamp=(date:Date,timezone:string)=>{
 const fields=new Intl.DateTimeFormat('en-GB',{
  timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit',
  hour:'2-digit',minute:'2-digit',hourCycle:'h23'
 }).formatToParts(date);
 const get=(type:string)=>fields.find(x=>x.type===type)?.value??'';
 return get('year')+'-'+get('month')+'-'+get('day')+'T'+get('hour')+':'+get('minute');
};
export function fixtureWithOfficialTime(f:OfficialFixture,now=new Date()):{
 fixture:OfficialFixture;matchAt:string
}|null{
 if(!/^https:\/\/[a-z0-9.-]+\/[^\s]+$/i.test(f.officialUrl)||
  !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(f.utcKickoff))return null;
 const utc=new Date(f.utcKickoff);
 if(!Number.isFinite(utc.getTime())||utc.getTime()<=now.getTime())return null;
 if(localStamp(utc,f.timezone)!==f.localDate+'T'+f.localTime)return null;
 const br=brasiliaDate(utc);
 return {fixture:f,matchAt:br.date+'T'+br.time};
}
export type VerifiedEuropeCapture={
 saved:FrozenWorkForecast[];added:number;duplicate:number;notMatched:number;
 failed:string[];eligible:number;
};
export function captureVerifiedEuropeFixtures(
 matches:readonly WorkAnalysisMatch[],raw:string|null,now=new Date(),
 fixtures:readonly OfficialFixture[]=VERIFIED_EUROPE_FIXTURES,
):VerifiedEuropeCapture{
 let saved=readFrozenWorkForecasts(raw);
 let current=JSON.stringify(saved);
 let added=0,duplicate=0,notMatched=0;
 const failed:string[]=[];
 let eligible=0;
 for(const rawFixture of fixtures){
  const possible=fixtureWithOfficialTime(rawFixture,now);
  if(!possible)continue;
  eligible++;
  const home=resolveTeam(matches,rawFixture,rawFixture.home);
  const away=resolveTeam(matches,rawFixture,rawFixture.away);
  if(!home||!away||home===away){notMatched++;continue;}
  const duplicateId=[rawFixture.league,possible.matchAt.slice(0,10),
   normalizeTeam(home),normalizeTeam(away)].join('|');
  if(saved.some(v=>v.id===duplicateId)){duplicate++;continue;}
  try{
   const entry=freezeWorkForecast(matches,rawFixture.league,
    home,away,possible.matchAt,now);
   saved=appendFrozenWorkForecast(current,entry);
   current=JSON.stringify(saved);
   added++;
  }catch(e){
   if(failed.length<3)failed.push(e instanceof Error?e.message:'Falha ao preparar previsão.');
  }
 }
 return {saved,added,duplicate,notMatched,failed,eligible};
}

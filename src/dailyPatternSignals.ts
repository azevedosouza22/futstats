import {researchDateBefore} from './model';
/**
 * Radar de Padrões V1 — exploratório e somente leitura.
 *
 * NÃO altera V2/V3 nem a lista legada As Boas do Dia; NÃO estima chances,
 * cotações ou retorno. Frequência de jogos passados não é probabilidade.
 * Cada valor é estritamente anterior à data do confronto em análise.
 */
import type {Data,Match,Period} from './model';
import {stats} from './model';
import {normalizeTeam,brasiliaDate,type ScheduledFixture} from './calendar';
import type {OfficialCalendarItem} from './officialCalendar';
import {safeOfficialFixtureUrl,officialSnapshotFreshAt} from './officialSourceTrust';
import {canonicalTeamInCompetition} from './radarTeamAliases';
import {radarMetricIntegrity} from './radarHistoricalIntegrity';
import {previousSeasonCompetition,type FourLensMetric} from './radarFourLenses';

type Scope='home'|'away'|'total';
type Direction='Over'|'Under';
export type DailyPatternSignal={
 id:string;metric:FourLensMetric;metricLabel:string;period:Period;
 scope:Scope;scopeLabel:string;line:number;direction:Direction;
 teamHits:number;teamCount:number;recentHits:number;recentCount:number;
 opponentHits:number;opponentCount:number;
 mean:number;opponentMean:number;score:number;
};
export type DailyPatternFixture={
 fixture:ScheduledFixture;verifiedAt:string;signals:DailyPatternSignal[];
};
export type DailyPatternResult={date:string;verified:number;items:DailyPatternFixture[]};

const metricLabels:Record<FourLensMetric,string>={
 goals:'Gols',shots:'Finalizações',target:'Chutes no gol',corners:'Escanteios'
};
const periods:readonly Period[]=['full','first','second'];
const metrics:readonly FourLensMetric[]=['goals','shots','target','corners'];
const SCOPES:readonly Scope[]=['home','away','total'];
const lines:Record<FourLensMetric,{individual:{full:number[];half:number[]};total:{full:number[];half:number[]}}>={
 goals:{individual:{full:[0.5,1.5,2.5,3.5],half:[0.5,1.5,2.5]},
        total:{full:[0.5,1.5,2.5,3.5,4.5],half:[0.5,1.5,2.5,3.5]}},
 shots:{individual:{full:[7.5,9.5,11.5,13.5,15.5,17.5,19.5,21.5],half:[2.5,4.5,6.5,8.5,10.5,12.5]},
        total:{full:[17.5,20.5,23.5,26.5,29.5,32.5],half:[7.5,9.5,11.5,13.5,15.5,17.5]}},
 target:{individual:{full:[1.5,2.5,3.5,4.5,5.5,6.5,7.5],half:[0.5,1.5,2.5,3.5,4.5]},
        total:{full:[3.5,5.5,7.5,9.5,11.5],half:[1.5,2.5,3.5,4.5,6.5]}},
 corners:{individual:{full:[1.5,2.5,3.5,4.5,5.5,6.5,7.5,8.5],half:[0.5,1.5,2.5,3.5,4.5,5.5]},
         total:{full:[4.5,6.5,8.5,10.5,12.5,14.5],half:[1.5,3.5,5.5,7.5,9.5]}}
};

const avg=(n:readonly number[])=>n.reduce((s,v)=>s+v,0)/n.length;
const hits=(values:readonly number[],line:number,d:Direction)=>
 values.filter(v=>d==='Over'?v>line:v<line).length;
const observed=(m:Match,side:0|1|2,p:Period,metric:FourLensMetric):number|null=>{
 if(radarMetricIntegrity(m,metric)!=='ok')return null;
 const a=stats(m,0,p)[metric],b=stats(m,1,p)[metric];
 if(side===2)return a!==null&&b!==null?a+b:null;
 return (side===0?a:b);
};

/** Only completed source rows from current/previous league edition. */
function venueMatches(data:Data,fixture:ScheduledFixture){
 const teams=new Map(data.teams.map(t=>[t.id,normalizeTeam(t.name)]));
 const key=(id:string)=>teams.get(id)??'';
 const home=normalizeTeam(fixture.home),away=normalizeTeam(fixture.away);
 const preceding=previousSeasonCompetition(fixture.competition);
 const allowed=new Set([fixture.competition,...(preceding?[preceding]:[])]);
 const grouped=new Map<string,Match[]>();
 for(const m of data.matches){
  if(!allowed.has(m.competition)||m.date>=fixture.date||
     !researchDateBefore(m,fixture.date)||
     m.research?.dateDiscrepancy||
     (m.external&&!['FT','Match Finished'].includes(m.external.status)))continue;
  const identity=[m.competition,m.date,key(m.home),key(m.away)].join('|');
  const group=grouped.get(identity)??[];
  group.push(m);grouped.set(identity,group);
 }
 const unique=[...grouped.values()].filter(g=>g.length===1).map(g=>g[0])
  .sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id));
 return {
  home:unique.filter(m=>key(m.home)===home).slice(0,10),
  away:unique.filter(m=>key(m.away)===away).slice(0,10),
 };
}

/** Predefined line scan; never trained or optimized against outcome of fixture. */
export function scanDailyFixturePatterns(data:Data,fixture:ScheduledFixture):DailyPatternSignal[]{
 const {home,away}=venueMatches(data,fixture);
 const candidates:DailyPatternSignal[]=[];
 for(const metric of metrics)for(const period of periods)for(const scope of SCOPES){
  // "For" of selected side, vs "allowed" by opposing team at its venue.
  // Total-market evidence is total match count at each venue.
  const s:0|1|2=scope==='home'?0:scope==='away'?1:2;
  const o:0|1|2=scope==='home'?0:scope==='away'?1:2;
  const origin=scope==='away'?away:home;
  const opposing=scope==='away'?home:away;
  const teamValues=origin.map(m=>observed(m,s,period,metric))
   .filter((n):n is number=>n!==null&&Number.isSafeInteger(n)&&n>=0);
  const opponentValues=opposing.map(m=>observed(m,o,period,metric))
   .filter((n):n is number=>n!==null&&Number.isSafeInteger(n)&&n>=0);
  if(teamValues.length<8||opponentValues.length<5)continue;
  const actualMean=avg(teamValues),oppMean=avg(opponentValues);
  const options=lines[metric][scope==='total'?'total':'individual']
   [period==='full'?'full':'half'];
  for(const line of options){
   // Reject trivially low/high lines far from the joint observed context.
   const center=(actualMean+oppMean)/2;
   if(Math.abs(line-center)>Math.max(1.1,center*0.28))continue;
   for(const direction of ['Over','Under'] as const){
    const teamHits=hits(teamValues,line,direction);
    const recentHits=hits(teamValues.slice(0,5),line,direction);
    const opponentHits=hits(opponentValues,line,direction);
    const teamRate=teamHits/teamValues.length;
    const oppRate=opponentHits/opponentValues.length;
    if(teamRate<0.8||recentHits<4||oppRate<0.6||
       hits(opponentValues.slice(0,5),line,direction)<3)continue;
    const score=teamRate*0.50+(recentHits/5)*0.20+oppRate*0.30
     -Math.abs(line-center)/(center+2)*0.03;
    const scopeLabel=scope==='home'?fixture.home+' (em casa)'
      :scope==='away'?fixture.away+' (fora)':'Total das duas equipes';
    candidates.push({
      id:[scope,metric,period,line,direction].join('|'),
      metric,metricLabel:metricLabels[metric],period,scope,scopeLabel,
      line,direction,teamHits,teamCount:teamValues.length,
      recentHits,recentCount:5,opponentHits,opponentCount:opponentValues.length,
      mean:actualMean,opponentMean:oppMean,score
    });
   }
  }
 }
 // One market per metric; prevent a 0.5-step ladder from flooding the shortlist.
 candidates.sort((a,b)=>b.score-a.score||
  Math.abs(a.line-(a.mean+a.opponentMean)/2)-
  Math.abs(b.line-(b.mean+b.opponentMean)/2)||
  a.id.localeCompare(b.id));
 const selected:DailyPatternSignal[]=[],used=new Set<string>();
 for(const item of candidates){
  if(used.has(item.metric))continue;
  selected.push(item);used.add(item.metric);
  if(selected.length===3)break;
 }
 return selected;
}
function keyFor(f:ScheduledFixture){
 return [f.date,f.competition,canonicalTeamInCompetition(f.home,f.competition),
   canonicalTeamInCompetition(f.away,f.competition)].join('|');
}
const validDate=(s:string)=>/^20\d{2}-\d{2}-\d{2}$/.test(s)&&
 !Number.isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;

/** Same trustworthy, non-conflicting future schedule gate as As Boas. */
export function selectDailyPatterns(
 data:Data,official:readonly OfficialCalendarItem[],now=new Date()
):DailyPatternResult{
 const {date,time}=brasiliaDate(now);
 const groups=new Map<string,OfficialCalendarItem[]>();
 for(const item of official){
  const key=keyFor(item.fixture),items=groups.get(key)??[];
  items.push(item);groups.set(key,items);
 }
 const items:DailyPatternFixture[]=[];
 let verified=0;
 for(const group of groups.values()){
  const trusted=group.filter(x=>{
   const f=x.fixture;
   return x.fresh&&validDate(x.verifiedAt)&&validDate(f.date)&&
     f.date===date&&!!f.time&&
     /^([01]\d|2[0-3]):[0-5]\d$/.test(f.time)&&
     officialSnapshotFreshAt(x.verifiedAt,date)&&safeOfficialFixtureUrl(f.sourceUrl);
  });
  if(!trusted.length||new Set(trusted.map(x=>x.fixture.time)).size!==1)continue;
  const chosen=[...trusted].sort((a,b)=>b.verifiedAt.localeCompare(a.verifiedAt))[0];
  if(!chosen.fixture.time||chosen.fixture.time<=time)continue;
  verified++;
  const signals=scanDailyFixturePatterns(data,chosen.fixture);
  if(signals.length)items.push({fixture:chosen.fixture,
    verifiedAt:chosen.verifiedAt,signals});
 }
 items.sort((a,b)=>b.signals.length-a.signals.length||
  b.signals[0].score-a.signals[0].score||
  a.fixture.id.localeCompare(b.fixture.id));
 return {date,verified,items:items.slice(0,3)};
}


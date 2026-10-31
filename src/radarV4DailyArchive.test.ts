import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {parseV4Archive} from './radarV4DailyArchive';
import {readKnownV4DaySources} from './officialCalendar';
import {combineV4DayListings,parseV4CommunityDay} from './radarV4DayFixtures';
import {parseResearchCatalog} from './researchCatalog';
import {mergeResearchPacks,parseResearchPackManifest} from './researchPacks';
import {applyBrazilResearchDateReview} from './brazilResearchReview';
import {analyzeV4Fixture,V4_METRICS,V4_PERIODS} from './radarV4LabToday';

const raw=JSON.parse(readFileSync(new URL('../public/research/v4-lab/2026-10-30.json',
 import.meta.url),'utf8')) as unknown;
const archival=parseV4Archive(raw);
const input=(path:string)=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8')) as unknown;
const source=parseResearchCatalog(
 input('../public/research/partidas-work-951-v1.json'),
 readFileSync(new URL('../public/research/partidas-work-extras-68-v1.txt',import.meta.url),'utf8')
);
const manifest=parseResearchPackManifest(input('../public/research/packs/manifest-v1.json'));
const packs=manifest.map(x=>input('../public/research/packs/'+x.file));
const research=applyBrazilResearchDateReview(
 mergeResearchPacks(source,manifest,packs),
 input('../public/research/brasileirao-2026-review-20261029.json')
);

describe('V4: historical 30 October frozen laboratory vs daily explorer',()=>{
 it('shows the actual original ten games, 105 signals and 15 abstentions unchanged',()=>{
  expect(archival.date).toBe('2026-10-30');
  expect(archival.createdAt).toBe('2026-10-30T08:55:11.563Z');
  expect(archival.reports).toHaveLength(10);
  expect(archival.signals).toBe(105);
  expect(archival.abstentions).toBe(15);
  expect(archival.reports.flatMap(r=>r.picks)).toHaveLength(120);
  expect(archival.reports.every(r=>r.historyIds.length===10)).toBe(true);
  expect(archival.reports.every(r=>r.fixture.date==='2026-10-30')).toBe(true);
 });
 it('still lists the full date AFTER matches have started, without inventing times',()=>{
  const late=new Date('2026-10-31T02:15:00Z');
  const source=readKnownV4DaySources('2026-10-30',late);
  for(const names of [['Corinthians','Mirassol'],['SV Elversberg','1. FSV Mainz 05'],
    ['Villarreal CF','RCD Espanyol']]){
   const match=source.find(x=>x.fixture.home===names[0]&&x.fixture.away===names[1]);
   expect(match).toBeDefined();
   expect(match?.fresh).toBe(false);
   expect(match?.fixture.time).toBeNull();
  }
 });
 it('includes completed catalogue entries as provisional and deduplicates sources',()=>{
  const day='2026-10-30';
  const community=parseV4CommunityDay({matches:[
   {date:day,team1:'Villarreal CF',team2:'RCD Espanyol',score:{ft:[2,0]}},
   {date:day,team1:'Club Z',team2:'Club X',score:{ft:[0,0]}}
  ]},'La Liga espanhola 2026/27',day,'https://example.com/source.json');
  expect(community).toHaveLength(2);
  expect(community.every(x=>x.time===null)).toBe(true);
  const official=readKnownV4DaySources(day,new Date('2026-10-31T02:15:00Z'));
  const combined=combineV4DayListings(day,official,[],community);
  expect(combined.filter(x=>x.fixture.home==='Villarreal CF')).toHaveLength(1);
  expect(combined.some(x=>x.fixture.home==='Club Z'&&x.origin==='community')).toBe(true);
 });
 it('compares same 120 lines with the actual 3,260-game catalog before each kickoff',()=>{
  expect(research.data.matches).toHaveLength(3260);
  const differences:string[]=[];
  for(const stored of archival.reports){
   const replay=analyzeV4Fixture(research.data,stored.fixture);
   if(replay.status!=='ready'){
    differences.push(stored.fixture.home+' × '+stored.fixture.away+': '+replay.reason);continue;
   }
   if(JSON.stringify([...replay.historyIds].sort())!==
      JSON.stringify([...stored.historyIds].sort()))
    differences.push(stored.fixture.home+' × '+stored.fixture.away+': IDs históricos diferentes');
   for(const period of V4_PERIODS)for(const metric of V4_METRICS){
    const expected=stored.picks.find(p=>p.period===period&&p.metric===metric)!;
    const actual=replay.picks.find(p=>p.period===period&&p.metric===metric)!;
    if(expected.line!==actual.line||expected.overs!==actual.overs||
       expected.observed!==actual.observed||expected.mean!==actual.mean)
     differences.push(stored.fixture.home+' × '+stored.fixture.away+
      ' '+period+'/'+metric+': snapshot '+expected.line+'/'+expected.overs+
      ' vs engine '+actual.line+'/'+actual.overs);
   }
  }
  // Expose differences in CI; no rewriting of an already published pregame record.
  expect(differences).toEqual([]);
 });
 it('fails closed if any original count or individual signal is modified',()=>{
  const changed=structuredClone(raw) as {signal_count:number;fixtures:{picks:{line:number|null}[]}[]};
  changed.signal_count=106;
  expect(()=>parseV4Archive(changed)).toThrow();
  changed.signal_count=105;changed.fixtures[0].picks[0].line=null;
  expect(()=>parseV4Archive(changed)).toThrow();
 });
});

const rawTomorrow=JSON.parse(readFileSync(new URL('../public/research/v4-lab/2026-10-31.json',
 import.meta.url),'utf8')) as unknown;
const tomorrow=parseV4Archive(rawTomorrow);

describe('V4 31 October 2026 — immutable prospectively selected programme',()=>{
 it('contains 29 pregame matches, 316 signals, 32 abstentions and 348 decisions',()=>{
  expect(tomorrow.date).toBe('2026-10-31');
  expect(tomorrow.createdAt).toBe('2026-10-31T01:57:27.197Z');
  expect(tomorrow.reports).toHaveLength(29);
  expect(tomorrow.signals).toBe(316);
  expect(tomorrow.abstentions).toBe(32);
  expect(tomorrow.reports.flatMap(x=>x.picks)).toHaveLength(348);
  expect(tomorrow.reports.every(x=>x.fixture.date==='2026-10-31'&&
   x.fixture.time!==null&&x.historyIds.length>=8)).toBe(true);
  expect(tomorrow.reports.every(x=>x.fixture.home!=='Nice'&&
   x.competition!=='Brasileirão Série A 2026')).toBe(true);
 });
 it('replays ALL 348 decisions and the original IDs against the 3,260-game research',()=>{
  const discrepancies:string[]=[];
  expect(research.data.matches).toHaveLength(3260);
  for(const report of tomorrow.reports){
   const fresh=analyzeV4Fixture(research.data,report.fixture);
   if(fresh.status!=='ready'){
    discrepancies.push(report.fixture.home+' × '+report.fixture.away+': '+fresh.reason);
    continue;
   }
   if(JSON.stringify([...fresh.historyIds].sort())!==
    JSON.stringify([...report.historyIds].sort()))
    discrepancies.push(report.fixture.home+' × '+report.fixture.away+': wrong historic IDs');
   for(const period of V4_PERIODS)for(const metric of V4_METRICS){
    const a=fresh.picks.find(p=>p.period===period&&p.metric===metric)!;
    const b=report.picks.find(p=>p.period===period&&p.metric===metric)!;
    if(a.line!==b.line||a.overs!==b.overs||a.observed!==b.observed||a.mean!==b.mean)
     discrepancies.push(report.fixture.home+' × '+report.fixture.away+' '+
      period+'/'+metric+': replay differed');
   }
  }
  expect(discrepancies).toEqual([]);
 });
 it('rejects tampered signals or missing fixtures and never changes the 30th archive',()=>{
  const damaged=structuredClone(rawTomorrow) as
   {signal_count:number;fixtures:{picks:{line:number|null}[]}[]};
  damaged.signal_count=317;
  expect(()=>parseV4Archive(damaged)).toThrow();
  damaged.signal_count=316;damaged.fixtures[0].picks[0].line=null;
  expect(()=>parseV4Archive(damaged)).toThrow();
  expect(archival.signals).toBe(105);
  expect(archival.abstentions).toBe(15);
 });
});

const rawCoritibaVitoria=JSON.parse(readFileSync(new URL(
 '../public/research/v4-lab/2026-10-31-adendo-coritiba-vitoria.json',
 import.meta.url),'utf8')) as unknown;
const coritibaVitoria=parseV4Archive(rawCoritibaVitoria);
describe('V4 31 October: corrected Coritiba x Vitoria 16h schedule with separate frozen pregame archive',()=>{
 it('preserves original 29 matches while tracking correction in a new 1-game addendum',()=>{
  expect(tomorrow.reports).toHaveLength(29);
  expect(tomorrow.signals).toBe(316);
  expect(coritibaVitoria.archiveKey).toBe('2026-10-31-adendo-coritiba-vitoria');
  expect(coritibaVitoria.date).toBe('2026-10-31');
  expect(coritibaVitoria.createdAt).toBe('2026-10-31T13:00:44.063Z');
  expect(coritibaVitoria.reports).toHaveLength(1);
  expect(coritibaVitoria.signals).toBe(12);
  expect(coritibaVitoria.abstentions).toBe(0);
  const r=coritibaVitoria.reports[0];
  expect(r.fixture.home).toBe('Coritiba');
  expect(r.fixture.away).toBe('Vitória');
  expect(r.fixture.time).toBe('16:00');
  expect(r.historyIds).toHaveLength(10);
  expect(r.picks.find(x=>x.period==='first'&&x.metric==='target')).toMatchObject({
   line:3.5,overs:10,observed:10});
 });
 it('matches all 12 decisions and historical IDs against exact published engine',()=>{
  const expected=coritibaVitoria.reports[0];
  const actual=analyzeV4Fixture(research.data,expected.fixture);
  expect(actual.status).toBe('ready');
  expect([...actual.historyIds].sort()).toEqual([...expected.historyIds].sort());
  for(const p of expected.picks){
   const a=actual.picks.find(x=>x.period===p.period&&x.metric===p.metric);
   expect(a).toMatchObject({line:p.line,overs:p.overs,observed:p.observed,mean:p.mean});
  }
 });
 it('refuses tampering and never allows a post-match revision of the original',()=>{
  const tampered=structuredClone(rawCoritibaVitoria) as {signal_count:number};
  tampered.signal_count=11;
  expect(()=>parseV4Archive(tampered)).toThrow();
  expect(tomorrow.reports).toHaveLength(29);
  expect(archival.reports).toHaveLength(10);
 });
});

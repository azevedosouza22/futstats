import {describe,it,expect} from 'vitest';
import type {WorkAnalysisMatch} from './workAnalysis';
import type {MetricPairs} from './europeWorkResearch';
import {
 parseUpcomingPremierWeek,automaticCaptureCandidates,
 captureUpcomingWorkPredictions,AUTO_WORK_RADAR_HOURS
} from './workRadarAutoFixtures';

const now=new Date('2026-10-23T20:00:00.000Z'); // 17h Brasília
const headers=[
 'gameweek','kickoff_time','home_team','away_team','finished',
 'stats_processed','match_id','home_score','away_score',
 'home_total_shots','away_total_shots','home_shots_on_target',
 'away_shots_on_target','home_corners','away_corners'
];
const teams='code,name\n'+Array.from({length:20},(_,i)=>
 String(i+1)+',Team '+String(i+1)).join('\n');
const fixturesCsv=[headers.join(','),
 ...Array.from({length:10},(_,i)=>[
  '8','2026-10-24T14:00:00',String(i*2+1),String(i*2+2),
  i===0?'True':'False','False',
  '26-27-prem-team-'+(i*2+1)+'-vs-'+(i*2+2),
  i===0?'2':'',i===0?'0':'','','','','','',''
 ].join(','))].join('\n');
const first:MetricPairs={goals:[1,0],shots:[5,2],target:[2,1],corners:[3,1]};
const second:MetricPairs={goals:[1,1],shots:[4,3],target:[2,1],corners:[1,1]};
const full:MetricPairs={goals:[2,1],shots:[9,5],target:[4,2],corners:[4,2]};
const games:WorkAnalysisMatch[]=Array.from({length:12},(_,i)=>({
 id:'prem-'+i,league:'premier-league',
 date:'2026-10-'+String(i+1).padStart(2,'0'),
 home:i%2?'Team 1':'Team 2',
 away:i%2?'Team 2':'Team 1',
 sourceId:'fl'+i,sourceUrl:'https://www.flashscore.com.br/?mid=fl'+i,
 first,second,full,discrepancies:[]
}));
const fixture={id:'26-27-prem-team-1-vs-team-2',gw:8,
 home:'Team 1',away:'Team 2',
 kickoffUtc:'2026-10-24T14:00:00Z',date:'2026-10-24',
 time:'11:00',sourceUrl:'https://raw.githubusercontent.com/example/GW8/matches.csv'};
describe('Agenda pública e registro automático da Premier League',()=>{
 it('não inventa partidas concluídas e converte UTC para horário de Brasília',()=>{
  const ready=parseUpcomingPremierWeek(teams,fixturesCsv,8,now);
  expect(ready).toHaveLength(9);
  expect(ready[0].home).toBe('Team 3');
  expect(ready[0].date).toBe('2026-10-24');
  expect(ready[0].time).toBe('11:00');
  expect(ready.some(x=>x.home==='Team 1')).toBe(false);
  expect(()=>parseUpcomingPremierWeek(teams,'não é CSV',8,now)).toThrow();
 });
 it('registra um lote de confrontos válidos sem duplicar ou alterar anteriores',()=>{
  const early={...fixture};
  const late={...fixture,id:'far-future',date:'2026-12-25',kickoffUtc:'2026-12-25T14:00:00Z'};
  expect(automaticCaptureCandidates([early,late],now)).toHaveLength(1);
  expect(AUTO_WORK_RADAR_HOURS).toBe(72);
  const result=captureUpcomingWorkPredictions(games,[early,late],null,now);
  expect(result.added).toBe(1);
  expect(result.saved).toHaveLength(1);
  expect(result.saved[0].matchAt).toBe('2026-10-24T11:00');
  expect(result.saved[0].league).toBe('premier-league');
  const again=captureUpcomingWorkPredictions(games,[early],JSON.stringify(result.saved),now);
  expect(again.added).toBe(0);
  expect(again.duplicates).toBe(1);
  expect(again.saved).toEqual(result.saved);
 });
 it('não altera dados salvos ilegíveis e ignora nomes não identificados',()=>{
  expect(()=>captureUpcomingWorkPredictions(games,[fixture],'{',now)).toThrow();
  const unknown=captureUpcomingWorkPredictions(games,[{...fixture,home:'Time estranho'}],null,now);
  expect(unknown.added).toBe(0);
  expect(unknown.skipped).toBe(1);
  expect(unknown.saved).toHaveLength(0);
 });
});

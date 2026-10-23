import {describe,it,expect} from 'vitest';
import {
 readWorkAnalysis,workTeamAverage,workTeamNames,type WorkAnalysisMatch
} from './workAnalysis';
import {EUROPE_WORK_STORAGE,type MetricPairs} from './europeWorkResearch';
import {EUROPE_RESEARCH_STORAGE} from './europeLeagueResearch';
import {FPL_WORK_STORAGE} from './fplWorkStore';

const period=(goals:[number,number],shots:[number,number],
 target:[number,number],corners:[number,number]):MetricPairs=>
 ({goals,shots,target,corners});
const first=period([1,0],[4,2],[2,0],[3,1]);
const second=period([1,1],[5,3],[2,1],[1,1]);
const full=period([2,1],[9,5],[4,1],[4,2]);
const snap={
 id:'serie-a|1|2026-08-22|team a|team b',
 league:'serie-a',competition:'Serie A italiana 2026/27',
 date:'2026-08-22',round:1,home:'Team A',away:'Team B',
 full:[2,1],half:[1,0],second:[1,1]
};
const cc0={
 id:'la-liga|1|2026-08-23|team c|team d',
 league:'la-liga',competition:'La Liga espanhola 2026/27',
 date:'2026-08-23',round:1,home:'Team C',away:'Team D',
 full:[2,1],half:[1,0],second:[1,1]
};
const europeEntry=(id:string,sourceId:string,fixture?:typeof snap)=>({
 europeId:id,sourceId,
 sourceUrl:'https://www.flashscore.com.br/jogo/futebol/teste/?mid='+sourceId,
 ...(fixture?{fixture}:{}),
 full,first,second
});
const premier={
 gameId:'26-27-prem-team-x-vs-team-y',gw:1,
 date:'2026-08-24',home:'Team X',away:'Team Y',
 sourceId:'PremAAA',
 sourceUrl:'https://www.flashscore.com.br/jogo/futebol/teste/?mid=PremAAA',
 full,first,second,discrepancies:['Divergência documentada'],pilotUnprocessed:false
};
const source=(europeEntries:unknown[],historic:unknown[],fpl:unknown[])=>({
 europe:JSON.stringify({format:EUROPE_WORK_STORAGE,entries:europeEntries}),
 research:JSON.stringify({format:EUROPE_RESEARCH_STORAGE,matches:historic}),
 premier:JSON.stringify({format:FPL_WORK_STORAGE,entries:fpl})
});
describe('Análises Work isoladas dos históricos e do Radar',()=>{
 it('combina as duas bases Work e associa jogos CC0 sem inventar partidas',()=>{
  const r=readWorkAnalysis(source([
   europeEntry(snap.id,'EuAAA',snap),
   europeEntry(cc0.id,'EuBBB')
  ],[cc0],[premier]));
  expect(r.europeCount).toBe(2);
  expect(r.premierCount).toBe(1);
  expect(r.unresolved).toBe(0);
  expect(r.matches).toHaveLength(3);
  expect(r.matches.map(x=>x.league)).toEqual(['serie-a','la-liga','premier-league']);
  expect(r.matches[1].home).toBe('Team C');
  expect(r.matches[2].discrepancies).toHaveLength(1);
 });
 it('identifica referências Work órfãs sem apagá-las ou atribuir equipes arbitrárias',()=>{
  const r=readWorkAnalysis(source([
   europeEntry('la-liga|2|2026-09-01|missing a|missing b','EuBBB')
  ],[],[]));
  expect(r.europeCount).toBe(1);
  expect(r.unresolved).toBe(1);
  expect(r.matches).toHaveLength(0);
 });
 it('seleciona mando e exclui o próprio jogo, os posteriores e outras ligas',()=>{
  const make=(id:string,date:string,home:string,away:string,league:'serie-a'|'la-liga'='serie-a'):WorkAnalysisMatch=>({
   id,league,date,home,away,sourceId:id,
   sourceUrl:'https://www.flashscore.com.br/?mid='+id,
   first,second,full,discrepancies:[]
  });
  const matches=[
   make('a','2026-08-01','A','B'),
   make('b','2026-08-02','B','A'),
   make('c','2026-08-03','A','B'),
   make('d','2026-08-04','A','B'),
   make('e','2026-08-05','A','B','la-liga')
  ];
  const casa=workTeamAverage(matches,'serie-a','A','full','home',5,'2026-08-04');
  expect(casa.count).toBe(2);
  expect(casa.selected.map(x=>x.id)).toEqual(['c','a']);
  expect(casa.values.goals.for).toBe(2);
  expect(casa.values.goals.against).toBe(1);
  const fora=workTeamAverage(matches,'serie-a','A','first','away',5,'2026-08-04');
  expect(fora.count).toBe(1);
  expect(fora.values.goals.for).toBe(0);
  expect(fora.values.goals.against).toBe(1);
  const none=workTeamAverage(matches,'serie-a','A','full','away',5,'2026-08-02');
  expect(none.count).toBe(0);
  expect(none.values.corners.for).toBeNull();
  expect(workTeamNames(matches,'serie-a')).toEqual(['A','B']);
 });
 it('não mistura ligas nem apresenta médias de amostras vazias como zero',()=>{
  const result=readWorkAnalysis(source([],[],[]));
  expect(result.matches).toHaveLength(0);
  expect(workTeamAverage(result.matches,'serie-a','A','full','home',10,'2026-10-23')
   .values.shots.for).toBeNull();
 });
});

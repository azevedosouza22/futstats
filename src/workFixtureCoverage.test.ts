import {describe,it,expect} from 'vitest';
import type {WorkAnalysisMatch,WorkLeague} from './workAnalysis';
import type {MetricPairs} from './europeWorkResearch';
import type {ScheduledFixture} from './calendar';
import {workFixtureCoverage} from './workFixtureCoverage';

const full:MetricPairs={
 goals:[1,2],shots:[12,13],target:[4,5],corners:[6,7]
};
const game=(id:string,league:WorkLeague,date:string,home:string,away:string,
 discrepancies:string[]=[],sourceId=id):WorkAnalysisMatch=>({
 id,league,date,home,away,sourceId,sourceUrl:'https://www.flashscore.com.br/?mid='+sourceId,
 full,first:full,second:full,discrepancies
});
const fixture=(competition:string,home:string,away:string):ScheduledFixture=>({
 id:'future',competition,home,away,date:'2026-10-25',time:null,
 sourceUrl:'https://www.laliga.com/'
});

describe('Cobertura isolada da pesquisa Work',()=>{
 it('reconhece o confronto La Liga com nomes da fonte e conta quatro métricas sem somar históricos',()=>{
  const league='la-liga';
  const input:WorkAnalysisMatch[]=[
   game('1',league,'2026-10-15','Barcelona','Real Madrid'),
   game('dup',league,'2026-10-15','Barcelona','Real Madrid',[],'1'),
   game('2',league,'2026-10-16','Barcelona','Getafe'),
   game('3',league,'2026-10-17','Sevilla','Real Madrid'),
   game('not-yet',league,'2026-10-25','Barcelona','Real Madrid'),
   game('future',league,'2026-10-29','Barcelona','Real Madrid'),
   game('conflict',league,'2026-10-18','Barcelona','Real Madrid',['diferença de data']),
   game('other','serie-a','2026-10-21','Barcelona','Real Madrid'),
  ];
  const previous=JSON.stringify(input);
  const result=workFixtureCoverage(input,fixture('La Liga espanhola 2026/27','FC Barcelona','Real Madrid CF'));
  expect(result).toMatchObject({
   league:'la-liga',homeName:'Barcelona',awayName:'Real Madrid',
   homeCount:2,awayCount:2,uniqueGames:3,
   metricGames:{goals:3,shots:3,target:3,corners:3},
   bothTeamsHaveHistory:true
  });
  expect(JSON.stringify(input)).toBe(previous);
 });
 it('não confunde falta de amostra de uma equipe com previsão válida',()=>{
  const result=workFixtureCoverage([
   game('1','ligue-1','2026-10-01','Toulouse FC','Opponent'),
   game('2','ligue-1','2026-10-02','ES Troyes AC','Opponent')
  ],fixture('Ligue 1 francesa 2026/27','Toulouse','ES Troyes AC'));
  expect(result).toMatchObject({homeCount:1,awayCount:1,bothTeamsHaveHistory:true,uniqueGames:2});
  const solo=workFixtureCoverage([
   game('1','ligue-1','2026-10-01','Toulouse FC','ES Troyes AC')
  ],fixture('Ligue 1 francesa 2026/27','Toulouse','ES Troyes AC'));
  expect(solo?.uniqueGames).toBe(1);
 });
 it('recusa liga de outra temporada, clube desconhecido e nomes ambíguos',()=>{
  const games=[
   game('1','serie-a','2026-10-01','Napoli','Roma'),
   game('2','serie-a','2026-10-02','SSC Napoli','Roma')
  ];
  expect(workFixtureCoverage(games,fixture('Serie A italiana 2025/26','SSC Napoli','AS Roma'))).toBeNull();
  expect(workFixtureCoverage(games,fixture('Serie A italiana 2026/27','Juventus','AS Roma'))).toBeNull();
  // Two distinct source spellings that map to one canonical name: do not guess.
  expect(workFixtureCoverage(games,fixture('Serie A italiana 2026/27','SSC Napoli','AS Roma'))).toBeNull();
 });
 it('ignora liga que não é Work e não reusa partida da competição errada',()=>{
  const games=[game('1','premier-league','2026-10-01','Manchester United','Liverpool')];
  expect(workFixtureCoverage(games,fixture('Brasileirão Série A','Manchester United','Liverpool'))).toBeNull();
  expect(workFixtureCoverage(games,fixture('Premier League inglesa 2026/27',
   'Manchester United FC','Liverpool FC'))?.metricGames.corners).toBe(1);
 });
 it('preserva ausência de jogos passados sem inventar um percentual',()=>{
  const result=workFixtureCoverage([
   game('1','la-liga','2026-10-25','Barcelona','Real Madrid')
  ],fixture('La Liga espanhola 2026/27','Barcelona','Real Madrid'));
  expect(result).toMatchObject({
   homeCount:0,awayCount:0,uniqueGames:0,
   metricGames:{goals:0,shots:0,target:0,corners:0},
   bothTeamsHaveHistory:false
  });
 });
});

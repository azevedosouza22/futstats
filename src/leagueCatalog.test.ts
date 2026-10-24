import {describe,expect,it} from 'vitest';
import {ALL_LEAGUES,competitionParts,filterMatchesByLeague,leagueOptions,paginateMatches,seasonOptions} from './leagueCatalog';
import type {Match} from './model';
const sample=(competition:string,id:string):Match=>({
 id,home:'a',away:'b',date:'2026-10-21',competition,first:[{} as Match['first'][0],{} as Match['first'][0]],second:[{} as Match['first'][0],{} as Match['first'][0]],
});
const games=[
 sample('Brasileirão Série A 2026','1'),
 sample('Bundesliga 2025/26','2'),
 sample('Bundesliga 2026/27','3'),
 sample('Bundesliga 2026/27','4'),
 sample('','5'),
];
describe('navegação V4 por campeonato e temporada',()=>{
 it('separa liga e temporada sem modificar o nome original nem misturar edições',()=>{
  expect(competitionParts('Bundesliga 2026/27')).toEqual({league:'Bundesliga',season:'2026/27'});
  expect(competitionParts('Brasileirão Série A 2026')).toEqual({league:'Brasileirão Série A',season:'2026'});
  expect(competitionParts('UEFA Champions League 2026/27')).toEqual({league:'UEFA Champions League',season:'2026/27'});
  expect(competitionParts('')).toEqual({league:'Sem competição',season:'Sem temporada'});
 });
 it('mostra uma única liga com temporadas distintas',()=>{
  expect(leagueOptions(games)).toEqual(['Brasileirão Série A','Bundesliga','Sem competição']);
  expect(seasonOptions(games,'Bundesliga')).toEqual(['2026/27','2025/26']);
  expect(filterMatchesByLeague(games,'Bundesliga','2026/27').map(m=>m.id)).toEqual(['3','4']);
  expect(filterMatchesByLeague(games,'Brasileirão Série A',ALL_LEAGUES).map(m=>m.id)).toEqual(['1']);
  expect(filterMatchesByLeague(games,ALL_LEAGUES,ALL_LEAGUES)).toHaveLength(5);
 });
 it('divide históricos grandes em páginas sem perder a ordem',()=>{
  const items=Array.from({length:659},(_,i)=>i);
  expect(paginateMatches(items,1)).toMatchObject({page:1,pages:33,total:659});
  expect(paginateMatches(items,33).items).toHaveLength(19);
  expect(paginateMatches(items,999).page).toBe(33);
  expect(paginateMatches([],1)).toMatchObject({page:1,pages:1,total:0,items:[]});
 });
});

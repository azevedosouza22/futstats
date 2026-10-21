import {describe,it,expect} from 'vitest';
import {teamsInCompetition} from './radarTeamFilters';
import type {Data,Match,Stats} from './model';
const empty=():Stats=>({goals:null,shots:null,target:null,corners:null,yellow:null,red:null});
const match=(id:string,home:string,away:string,competition:string):Match=>
 ({id,home,away,date:'2026-10-19',competition,first:[empty(),empty()],second:[empty(),empty()]});
const data:Data={teams:[
 {id:'a',name:'Bayern',color:'#123456'},
 {id:'b',name:'Stuttgart',color:'#123456'},
 {id:'c',name:'Flamengo',color:'#123456'},
 {id:'d',name:'Palmeiras',color:'#123456'},
],matches:[
 match('1','a','b','Bundesliga 2026/27'),
 match('2','c','d','Brasileirão Série A 2026'),
 match('3','b','a','Bundesliga 2025/26'),
]};
describe('filtro de equipes do Radar por competição',()=>{
 it('mostra somente clubes da liga e temporada escolhidas',()=>{
  expect(teamsInCompetition(data,'Bundesliga 2026/27').map(t=>t.name)).toEqual(['Bayern','Stuttgart']);
  expect(teamsInCompetition(data,'Brasileirão Série A 2026').map(t=>t.name)).toEqual(['Flamengo','Palmeiras']);
  expect(teamsInCompetition(data,'Bundesliga 2025/26').map(t=>t.name)).toEqual(['Bayern','Stuttgart']);
 });
 it('não oferece clubes nem palpites sem competição selecionada',()=>{
  expect(teamsInCompetition(data,'')).toEqual([]);
  expect(teamsInCompetition(data,'La Liga 2026/27')).toEqual([]);
 });
});

import {describe,it,expect} from 'vitest';
import {buildMatchPanel,statisticLabel} from './matchPanel';
import type {AutoFixture,StatTeam} from './apiFootball';
const fixture:AutoFixture={id:1492402,date:null,status:'FT',statusLabel:null,minute:90,league:null,country:null,home:{id:1,name:'Equipe de teste A'},away:{id:2,name:'Equipe de teste B'},goals:[2,1]};
const team=(id:number,values:Record<string,number|string|null>):StatTeam=>({team:{id,name:'Simulada'},statistics:Object.entries(values).map(([type,value])=>({type,value})),statistics_1h:null,statistics_2h:null});
// All data here is synthetic. No live API results or user records.
describe('Painel Inteligente V1',()=>{
 it('sums only available additive values, preserving zero and N/D',()=>{
  const p=buildMatchPanel([team(2,{'Total Shots':4,'Shots on Goal':null,'Corner Kicks':0}),team(1,{'Total Shots':8,'Shots on Goal':3,'Corner Kicks':0})],fixture,'statistics');
  expect(p.summary.map(c=>c.total)).toEqual([3,12,null,0]);expect(p.summary[2].values).toEqual([3,null]);expect(p.summary[3].values).toEqual([0,0]);
 });
 it('does not copy header score or accumulated stats into a half; accepts explicit half goals only',()=>{
  const rows=[team(1,{'Total Shots':8}),team(2,{'Total Shots':4})];expect(buildMatchPanel(rows,fixture,'statistics_1h').summary.map(c=>c.total)).toEqual([null,null,null,null]);
  rows[0].statistics_1h=[{type:'Goals',value:0},{type:'Total Shots',value:2}];rows[1].statistics_1h=[{type:'Goals',value:1},{type:'Total Shots',value:3}];
  const first=buildMatchPanel(rows,fixture,'statistics_1h');expect(first.summary[0].values).toEqual([0,1]);expect(first.summary[0].total).toBe(1);expect(first.summary[1].total).toBe(5);
  expect(buildMatchPanel(rows,fixture,'statistics_2h').summary[0].total).toBeNull();expect(buildMatchPanel(rows,fixture,'statistics').summary[0].total).toBe(3);
 });
 it('keeps every extra indicator and translates known labels without inventing definitions',()=>{
  const p=buildMatchPanel([team(1,{'Blocked Shots':2,'Offsides':1,'Fouls':5,'Free Kicks':3,'Goalkeeper Saves':4,'Total passes':400,'Passes accurate':300,'Passes %':'75%','new_provider_metric':1.5})],fixture,'statistics');
  expect(p.more.map(c=>c.label)).toEqual(expect.arrayContaining(['Finalizações bloqueadas','Impedimentos','Faltas','Tiros livres','Defesas do goleiro','Passes totais','Passes certos','Precisão dos passes (%)','Indicador da fonte: new_provider_metric']));
  expect(p.more.find(c=>c.key==='source:Passes %')?.unit).toBe('%');expect(p.more.every(c=>c.total===undefined)).toBe(true);expect(statisticLabel('Shots off Goal')).toBe('Finalizações para fora');
 });
 it('does not total partial score, invalid counts, duplicate or missing team statistics',()=>{
  const a=team(1,{'Total Shots':1.5,'Corner Kicks':2});a.statistics!.push({type:'Corner Kicks',value:3});
  const p=buildMatchPanel([a,team(2,{'Total Shots':2,'Corner Kicks':4})],{...fixture,goals:[0,null]},'statistics');expect(p.summary.map(c=>c.total)).toEqual([null,null,null,null]);
  expect(buildMatchPanel([a,a],fixture,'statistics').summary[1].values).toEqual([null,null]);
  expect(buildMatchPanel([team(1,{'Goals':1}),team(2,{'Goals':2})],{...fixture,goals:[null,null]},'statistics').summary[0].total).toBe(3);
 });
});

import {describe,it,expect} from 'vitest';
import {auditFixtureCoverage} from './apiCoverageAudit';
import type {AutoFixture,StatTeam} from './apiFootball';

const fixture:AutoFixture={
 id:1492402,date:'2026-10-13T20:00:00Z',status:'FT',statusLabel:'Finished',minute:90,
 league:'Teste',country:'N/D',home:{id:1,name:'A'},away:{id:2,name:'B'},
 goals:[2,1],halfGoals:[1,0]
};
const makeTeam=(id:number,full:[number,number,number],h1:[number,number,number],h2:[number,number,number]):StatTeam=>({
 team:{id,name:'Equipe de teste'},statistics:[
  {type:'Total Shots',value:full[0]},{type:'Shots on Goal',value:full[1]},
  {type:'Corner Kicks',value:full[2]}
 ],statistics_1h:[
  {type:'Total Shots',value:h1[0]},{type:'Shots on Goal',value:h1[1]},
  {type:'Corner Kicks',value:h1[2]}
 ],statistics_2h:[
  {type:'Total Shots',value:h2[0]},{type:'Shots on Goal',value:h2[1]},
  {type:'Corner Kicks',value:h2[2]}
 ]
});
const players=[
 makeTeam(1,[9,5,3],[4,2,1],[5,3,2]),
 makeTeam(2,[10,3,5],[3,1,2],[7,2,3])
];
// Synthetic cases, not evidence of actual API coverage or any real match.
describe('Cobertura API-Football - auditoria pontual sem escrita',()=>{
 it('confirma 24 de 24 apenas com as tres fases coerentes e HT explicito',()=>{
  const r=auditFixtureCoverage(fixture,players,players);
  expect(r.status).toBe('ready');
  expect(r.available).toBe(24);
  expect(r.periods.map(p=>p.found)).toEqual([8,8,8]);
  expect(r.issues).toEqual([]);
 });
 it('falta real de estatisticas nos tempos nao e substituida por totais',()=>{
  const empty=players.map(x=>({...x,statistics_1h:null,statistics_2h:null}));
  const r=auditFixtureCoverage(fixture,players,empty);
  expect(r.status).toBe('incomplete');
  expect(r.available).toBe(12);
  expect(r.periods.map(p=>p.found)).toEqual([8,2,2]);
 });
 it('sem resultado de intervalo nao declara cobertura perfeita',()=>{
  const missing={...fixture,halfGoals:undefined};
  const r=auditFixtureCoverage(missing,players,players);
  expect(r.status).toBe('incomplete');
  expect(r.available).toBe(20);
 });
 it('divergencias de tempos e alvo maior que finalizacoes bloqueiam aprovacao',()=>{
  const wrong=players.map(x=>({...x,statistics_2h:x.statistics_2h?.map(r=>r.type==='Total Shots'?{...r,value:44}:r)??null}));
  const r=auditFixtureCoverage(fixture,players,wrong);
  expect(r.status).toBe('conflict');
  expect(r.issues.some(x=>x.includes('diferente do jogo'))).toBe(true);
 });
 it('partida nao encerrada nao e aprovada mesmo que numeros parecam completos',()=>{
  const r=auditFixtureCoverage({...fixture,status:'2H'},players,players);
  expect(r.status).toBe('not-final');
 });
 it('dados de outra equipe, duplicados ou null permanecem ausentes',()=>{
  const wrong=players.map(x=>({...x,team:{...x.team,id:x.team.id+100}}));
  const r=auditFixtureCoverage(fixture,wrong,wrong);
  expect(r.available).toBe(6);
  expect(r.status).toBe('incomplete');
 });
});

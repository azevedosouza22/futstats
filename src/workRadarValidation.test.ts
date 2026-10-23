import {describe,expect,it} from 'vitest';
import type {WorkAnalysisMatch} from './workAnalysis';
import type {MetricPairs} from './europeWorkResearch';
import {validateWorkRadar} from './workRadarValidation';

const halfA:MetricPairs={goals:[1,0],shots:[8,4],target:[3,1],corners:[4,1]};
const halfB:MetricPairs={goals:[1,1],shots:[7,5],target:[2,2],corners:[3,2]};
const full:MetricPairs={goals:[2,1],shots:[15,9],target:[5,3],corners:[7,3]};
const make=(league:'serie-a'|'premier-league',index:number):WorkAnalysisMatch=>({
 id:league+'-'+index,
 league,date:'2026-'+(index<=20?'08':'09')+'-'+String(((index-1)%20)+1).padStart(2,'0'),
 home:index%2?'Club A':'Club B',away:index%2?'Club B':'Club A',
 sourceId:'Example'+league+index,
 sourceUrl:'https://www.flashscore.com.br/jogo/futebol/?mid=Example'+index,
 first:halfA,second:halfB,full,discrepancies:[]
});
describe('Validação V2 × V3 somente leitura com referência justa',()=>{
 it('com base vazia, não cria sinais nem declara porcentagens',()=>{
  const actual=validateWorkRadar([]);
  expect(actual.leagues).toEqual([]);
  expect(actual.total).toEqual({
   fixtures:0,v2:{signals:0,correct:0},
   v3:{signals:0,correct:0},baseline:{signals:0,correct:0}
  });
 });
 it('separa campeonatos e limita referências exatamente aos mesmos sinais aceitos pelo V3',()=>{
  const fixtures=[
   ...Array.from({length:30},(_,i)=>make('serie-a',i+1)),
   ...Array.from({length:30},(_,i)=>make('premier-league',i+1))
  ];
  const before=JSON.stringify(fixtures);
  const actual=validateWorkRadar(fixtures);
  expect(actual.leagues.map(x=>x.id)).toEqual(['serie-a','premier-league']);
  expect(actual.total.fixtures).toBe(60);
  expect(actual.leagues.every(l=>
   l.v3.signals===l.baseline.signals &&
   l.v2.signals>=l.v3.signals &&
   l.markets.every(m=>m.v3.signals===m.baseline.signals))).toBe(true);
  expect(JSON.stringify(fixtures)).toBe(before);
 });
 it('não soma temporadas ausentes nem transforma falta de sinais em acertos',()=>{
  const actual=validateWorkRadar([make('serie-a',1)]);
  expect(actual.total.fixtures).toBe(1);
  expect(actual.total.v2.signals).toBe(0);
  expect(actual.total.v3.signals).toBe(0);
  expect(actual.total.baseline.signals).toBe(0);
  expect(actual.leagues.map(x=>x.id)).toEqual(['serie-a']);
 });
});

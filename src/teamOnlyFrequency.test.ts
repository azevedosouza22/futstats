import {describe,it,expect} from 'vitest';
import type {Data,Match,Stats} from './model';
import {
 analyzeTeamOnlyPeriods,individualLineFrequency,suggestedIndividualLine
} from './teamOnlyPeriods';
import {individualWindowAvailability} from './TeamOnlyCards';

const fixture={home:'Milan',away:'Bologna',date:'2026-11-08',competition:'Serie A italiana 2026/27'};
const st=(shots:number):Stats=>({
 goals:0,shots,target:Math.min(2,shots),corners:2,yellow:0,red:0
});
const values=[23,16,25,18,24];
const records:Match[]=values.map((full,i)=>{
 const a=[12,7,11,8,12][i],b=full-a;
 return {id:'match'+i,date:'2026-10-'+String(i+1).padStart(2,'0'),
 competition:fixture.competition,home:'Milan',away:'op'+i,
 first:[st(a),st(4)],second:[st(b),st(5)]};
});
const data:Data={teams:[
 {id:'Milan',name:'AC Milan',color:'#888'},
 {id:'Bologna',name:'Bologna',color:'#888'},
 ...values.map((_,i)=>({id:'op'+i,name:'Other '+i,color:'#888'}))
],matches:records};
const sample=(period:'first'|'second'|'full')=>
 analyzeTeamOnlyPeriods(data,fixture,'shots').lenses[0].periods.find(x=>x.period===period)!;

describe('Etapa 85 — frequência numérica e percentual, sem prever probabilidades',()=>{
 it('expõe exatamente 3/5 Over 20,5 (60%) e 2/5 Under (40%) para o time',()=>{
  const actual=sample('full');
  expect(actual.last5).toMatchObject({count:5,mean:21.2});
  expect(actual.last5.observations).toEqual(values.slice().reverse());
  expect(individualLineFrequency(actual.last5,20.5)).toEqual({
   count:5,over:3,under:2,overRate:0.6,underRate:0.4
  });
 });
 it('não mistura os números do adversário, e calcula por períodos separados',()=>{
  const first=sample('first'),second=sample('second');
  expect(individualLineFrequency(first.last5,10.5)).toMatchObject({
   count:5,over:3,under:2,overRate:0.6
  });
  expect(first.last5.mean).toBe(10);
  expect(second.last5.mean).toBeCloseTo(11.2,6);
  expect(first.last5.observations.every(x=>x!==4)).toBe(true);
 });
 it('quando há 3 ou 4 partidas, mostra fração real e não inventa 5 ou 10',()=>{
  const r=analyzeTeamOnlyPeriods({...data,matches:records.slice(0,4)},fixture,'shots');
  const row=r.lenses[0].periods.find(x=>x.period==='full')!;
  expect(individualLineFrequency(row.last5,20.5)).toMatchObject({
   count:4,over:2,under:2,overRate:0.5
  });
  expect(row.last10).toEqual(row.last5);
  expect(individualWindowAvailability(r).hasExtendedSample).toBe(false);
 });
 it('não calcula percentuais para amostras vazias e distingue N/D de 0%',()=>{
  const empty=analyzeTeamOnlyPeriods({...data,matches:[]},fixture,'shots');
  const r=empty.lenses[0].periods.find(x=>x.period==='full')!;
  expect(individualLineFrequency(r.last5,0.5)).toMatchObject({
   count:0,over:0,under:0,overRate:null,underRate:null
  });
  expect(suggestedIndividualLine(null)).toBeNull();
 });
 it('aceita linhas individuais ajustadas e veta valores inválidos',()=>{
  const row=sample('full');
  expect(individualLineFrequency(row.last5,24.5)).toMatchObject({
   count:5,over:1,under:4,overRate:0.2,underRate:0.8
  });
  expect(suggestedIndividualLine(row.last10.mean)).toBe(21.5);
  for(const invalid of [-0.5,0,10,20.2,1000.5,Number.NaN]){
   expect(()=>individualLineFrequency(row.last5,invalid)).toThrow();
  }
 });
 it('não permite usar dados da partida futura para elevar uma frequência',()=>{
  const future:Match={...records[0],id:'future',date:'2026-11-08',
   first:[st(40),st(3)],second:[st(40),st(3)]};
  const altered=analyzeTeamOnlyPeriods({...data,matches:[...records,future]},fixture,'shots');
  const row=altered.lenses[0].periods.find(x=>x.period==='full')!;
  expect(individualLineFrequency(row.last5,20.5)).toMatchObject({
   count:5,over:3,under:2
  });
 });
});

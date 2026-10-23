import {describe,it,expect} from 'vitest';
import {
 workRadarData,projectWorkRadar,backtestWorkRadar
} from './workRadar';
import type {WorkAnalysisMatch} from './workAnalysis';
import type {MetricPairs} from './europeWorkResearch';
import type {Data} from './model';
import {validData} from './model';

const values=(goals:[number,number]):MetricPairs=>({
 goals,shots:[18,8],target:[6,2],corners:[7,3]
});
const first:MetricPairs={
 goals:[2,0],shots:[10,3],target:[4,1],corners:[4,1]
};
const second:MetricPairs={
 goals:[1,1],shots:[8,5],target:[2,1],corners:[3,2]
};
const fixture=(i:number,league:'serie-a'|'la-liga'='serie-a'):WorkAnalysisMatch=>({
 id:league+'|'+i,league,date:'2026-10-'+String(i+1).padStart(2,'0'),
 home:'A',away:'B',sourceId:'TestId'+i+league.replace('-',''),
 sourceUrl:'https://www.flashscore.com.br/jogo/futebol/teste/?mid=TestId'+i+league.replace('-',''),
 first,second,full:values([3,1]),discrepancies:[]
});
const modelData:Data={teams:[{id:'original',name:'Histórico local',color:'#999999'}],matches:[]};
describe('Radar Work V2/V3 leitura isolada',()=>{
 it('cria partida sintética apenas em memória sem alterar o Histórico nem o Radar original',()=>{
  const original=JSON.stringify(modelData);
  const input=Object.freeze([fixture(1),fixture(2,'la-liga')]);
  const result=workRadarData(input,'serie-a');
  expect(result.matches).toHaveLength(1);
  expect(result.teams.map(t=>t.name)).toEqual(['A','B']);
  expect(result.matches[0].competition).toBe('Serie A italiana 2026/27');
  expect(result.matches[0].research?.full[0].goals).toBe(3);
  expect(result.matches[0].first[0].corners).toBe(4);
  expect(result.matches[0].second[0].corners).toBe(3);
  expect(JSON.stringify(modelData)).toBe(original);
  expect(result.radarSnapshots).toBeUndefined();
  expect(validData(result)).toBe(true);
 });
 it('reutiliza os filtros originais V2 e V3; nunca vê jogos posteriores ao confronto',()=>{
  const base=Array.from({length:12},(_,i)=>fixture(i));
  const after=fixture(27);after.full=values([99,99]);
  const data=workRadarData([...base,after],'serie-a');
  const predictions=projectWorkRadar(data,'A','B','2026-10-20');
  const goals=predictions.find(x=>x.marketId==='goals-full-2.5');
  expect(goals?.v2.decision).toBe('Over');
  expect(goals?.v3.decision).toBe('Over');
  expect(goals?.v2.projectedTotal).toBe(4);
  expect(goals?.homeCount).toBe(10);
  expect(goals?.awayCount).toBe(10);
  const sameDay=fixture(18);sameDay.full=values([100,100]);
  const withoutLeak=projectWorkRadar(workRadarData([...base,after,sameDay],'serie-a'),'A','B','2026-10-19');
  expect(withoutLeak.find(x=>x.marketId==='goals-full-2.5')?.v2.projectedTotal).toBe(4);
 });
 it('recusa sinal sem histórico suficiente por mando, usando critério do V2/V3',()=>{
  const result=projectWorkRadar(workRadarData([fixture(1),fixture(2)],'serie-a'),
   'A','B','2026-10-23');
  expect(result.every(x=>x.v2.decision==='Sem sinal'&&x.v3.decision==='Sem sinal')).toBe(true);
  expect(result[0].v2.reason).toBe('insufficient_venue_history');
  expect(projectWorkRadar(workRadarData([fixture(1)],'serie-a'),'A','A','2026-10-23')).toEqual([]);
 });
 it('gera avaliação cronológica apenas dos jogos da liga selecionada',()=>{
  const input=Array.from({length:15},(_,i)=>fixture(i));
  const dataset=workRadarData([...input,fixture(1,'la-liga')],'serie-a');
  const report=backtestWorkRadar(dataset);
  expect(report?.fixtures).toBe(15);
  expect(report?.markets.length).toBe(3);
  expect(report?.validationStart).not.toBeNull();
  expect(report?.trainingEnd).not.toBeNull();
  expect(report!.trainingEnd!<report!.validationStart!).toBe(true);
  expect(backtestWorkRadar(workRadarData([],'serie-a'))).toBeNull();
 });
});

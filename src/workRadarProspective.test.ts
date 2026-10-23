import {describe,expect,it} from 'vitest';
import type {MetricPairs} from './europeWorkResearch';
import type {WorkAnalysisMatch} from './workAnalysis';
import {
 WORK_RADAR_PROSPECTIVE_STORAGE,readFrozenWorkForecasts,
 freezeWorkForecast,appendFrozenWorkForecast,
 settleFrozenWorkForecast,scoreFrozenWorkForecasts
} from './workRadarProspective';
const one:MetricPairs={goals:[1,0],shots:[10,4],target:[3,1],corners:[3,2]};
const two:MetricPairs={goals:[1,1],shots:[8,6],target:[3,2],corners:[2,1]};
const full:MetricPairs={goals:[2,1],shots:[18,10],target:[6,3],corners:[5,3]};
const fixtures:Array<WorkAnalysisMatch>=Array.from({length:12},(_,i)=>({
 id:'serie-a-'+i,league:'serie-a' as const,
 date:'2026-10-'+String(i+1).padStart(2,'0'),
 home:i%2?'A':'B',away:i%2?'B':'A',
 sourceId:'Work'+i,sourceUrl:'https://www.flashscore.com.br/?mid=Work'+i,
 first:one,second:two,full,discrepancies:[]
}));
const now=new Date('2026-10-23T19:00:00.000Z'); // 16:00 Brasília
const kickoff='2026-10-24T19:00';
const completed:WorkAnalysisMatch={
 ...fixtures[0],id:'new-fixture',sourceId:'WorkResult1',
 date:'2026-10-24',home:'A',away:'B'
};
describe('Radar Work prospectivo congelado antes do início',()=>{
 it('registra todas as decisões e a referência pré-jogo sem alterar os jogos usados',()=>{
  const before=JSON.stringify(fixtures);
  const snap=freezeWorkForecast(fixtures,'serie-a','A','B',kickoff,now);
  expect(snap.id).toBe('serie-a|2026-10-24|a|b');
  expect(snap.markets).toHaveLength(3);
  expect(snap.markets.map(m=>m.baseline)).toEqual(['Over','Over','Over']);
  expect(snap.sourceCount).toBe(12);
  expect(JSON.stringify(fixtures)).toBe(before);
  const added=appendFrozenWorkForecast(null,snap);
  expect(readFrozenWorkForecasts(JSON.stringify(added))).toHaveLength(1);
  expect(()=>appendFrozenWorkForecast(JSON.stringify(added),snap)).toThrow('Já existe');
  expect(JSON.stringify(added)).toBe(JSON.stringify([snap]));
  expect(snap.markets.every(p=>p.marketId&&p.v2&&p.v3)).toBe(true);
 });
 it('bloqueia previsões antigas, duplicatas e pares incompatíveis sem salvar nada',()=>{
  expect(()=>freezeWorkForecast(fixtures,'serie-a','A','B','2026-10-22T19:00',now)).toThrow('futuro');
  expect(()=>freezeWorkForecast(fixtures,'serie-a','A','A',kickoff,now)).toThrow('diferentes');
  expect(()=>freezeWorkForecast(fixtures,'ligue-1','A','B',kickoff,now)).toThrow('histórico');
  expect(()=>freezeWorkForecast(fixtures,'serie-a','A','B','2026-10-24T25:61',now)).toThrow('válidos');
  expect(()=>readFrozenWorkForecasts('{')).toThrow('ilegíveis');
  const snap=freezeWorkForecast(fixtures,'serie-a','A','B',kickoff,now);
  expect(()=>readFrozenWorkForecasts(JSON.stringify([snap,snap]))).toThrow('inconsistentes');
  expect(()=>readFrozenWorkForecasts(JSON.stringify([{...snap,matchAt:'2026-10-23T15:00'}]))).toThrow('inconsistentes');
  expect(()=>freezeWorkForecast([...fixtures,completed],'serie-a','A','B',kickoff,now)).toThrow('já consta');
 });
 it('aguarda a data e a chegada de resultado completo; não recalcula as previsões congeladas',()=>{
  const snap=freezeWorkForecast(fixtures,'serie-a','A','B',kickoff,now);
  const frozen=JSON.stringify(snap);
  expect(settleFrozenWorkForecast(snap,fixtures,{date:'2026-10-24',time:'23:00'}).status).toBe('future');
  expect(settleFrozenWorkForecast(snap,fixtures,{date:'2026-10-25',time:'00:01'}).status).toBe('waiting');
  const settled=settleFrozenWorkForecast(snap,[...fixtures,completed],{date:'2026-10-25',time:'09:00'});
  expect(settled.status).toBe('complete');
  expect(settled.actual['goals-full-2.5']).toBe(3);
  expect(settled.markets).toHaveLength(3);
  expect(settled.markets.map(x=>x.baseline)).toEqual(['Acertou','Acertou','Acertou']);
  expect(JSON.stringify(snap)).toBe(frozen);
  const scored=scoreFrozenWorkForecasts([snap],[...fixtures,completed],{date:'2026-10-25',time:'09:00'});
  expect(scored.evaluated).toBe(1);
  expect(scored.pending).toBe(0);
  expect(scored.baseline.signals).toBe(scored.v3.signals);
  expect(scored.v2.signals).toBeGreaterThanOrEqual(scored.v3.signals);
  expect(WORK_RADAR_PROSPECTIVE_STORAGE).not.toBe('futstats-radar-previews-v1');
  expect(WORK_RADAR_PROSPECTIVE_STORAGE).not.toBe('futstats:v1');
 });
 it('não conta sinal neutro nem pontua confrontos sem estatística',()=>{
  const tiny=fixtures.slice(0,2);
  const snap=freezeWorkForecast(tiny,'serie-a','A','B',kickoff,now);
  expect(snap.markets.every(p=>p.v2==='Sem sinal'&&p.v3==='Sem sinal')).toBe(true);
  const done=scoreFrozenWorkForecasts([snap],[...tiny,completed],{date:'2026-10-25',time:'12:00'});
  expect(done.evaluated).toBe(1);
  expect(done.v2.signals).toBe(0);
  expect(done.v3.signals).toBe(0);
  expect(done.baseline.signals).toBe(0);
 });
});

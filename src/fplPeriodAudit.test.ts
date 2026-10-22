import {describe,it,expect} from 'vitest';
import {auditFplShotEvents} from './fplPeriodAudit';
import type {FplPilotGame} from './fplFreePilot';
const fixture=(gw:number,id:string,processed=true):FplPilotGame=>({
 id,gw,date:'2026-08-21',sourceKickoff:'2026-08-21T19:00:00',home:'A',away:'B',
 goals:[1,0],shots:[2,1],onTarget:[1,0],corners:[4,2],sourceStatsProcessed:processed
});
const header='match_id,shot_index,minute,is_home,outcome';
const rows=[
 'ok,1,10,True,goal','ok,2,47,True,miss','ok,3,60,False,block',
 'mismatch,1,10,True,save','mismatch,2,47,True,miss','mismatch,3,60,False,block',
 'pending,1,10,True,goal','pending,2,47,True,miss','pending,3,60,False,block',
];
describe('auditoria rigorosa dos eventos da Premier League',()=>{
 it('somente soma períodos quando os eventos correspondem aos totais do jogo',()=>{
  const games=[fixture(1,'ok'),fixture(1,'mismatch'),fixture(1,'pending',false)];
  const csv=header+'\n'+rows.filter(x=>!x.startsWith('mismatch,2,')).join('\n');
  const shots=[csv,...Array(6).fill(header+'\nnotused,1,55,False,miss')];
  const a=auditFplShotEvents(games,shots);
  expect(a.checked).toBe(3);
  expect(a.reconciledIds).toEqual(['ok']);
  expect(a.divergentIds).toEqual(['mismatch']);
  expect(a.pendingIds).toEqual(['pending']);
  expect(a.periodsById['ok']).toEqual({
   first:{shots:[1,0],onTarget:[1,0]},
   second:{shots:[1,1],onTarget:[0,0]}
  });
  expect(a.periodsById['mismatch']).toBeUndefined();
  expect(a.periodsById['pending']).toBeUndefined();
 });
 it('classifies minute 45 as first half, minute 46 and minute 90 as second',()=>{
  const csv=header+'\n'+'ok,1,45,True,goal\nok,2,46,True,miss\nok,3,90,False,block';
  const a=auditFplShotEvents([fixture(1,'ok')],[csv,...Array(6).fill(header+'\nnotused,1,55,False,miss')]);
  expect(a.reconciled).toBe(1);
  expect(a.periodsById['ok']?.first).toEqual({shots:[1,0],onTarget:[1,0]});
  expect(a.periodsById['ok']?.second).toEqual({shots:[1,1],onTarget:[0,0]});
 });
 it('inclui 45+3 no primeiro tempo e 90+4 no segundo, conforme o CSV real',()=>{
  const h='match_id,shot_index,minute,added_time,is_home,outcome';
  const csv=h+'\n'+'ok,1,45,3.0,True,goal\nok,2,46,,True,miss\nok,3,90,4.0,False,block';
  const a=auditFplShotEvents([fixture(1,'ok')],[csv,...Array(6).fill(h+'\nnotused,1,55,,False,miss')]);
  expect(a.reconciled).toBe(1);
  expect(a.periodsById['ok']?.first).toEqual({shots:[1,0],onTarget:[1,0]});
  expect(a.periodsById['ok']?.second).toEqual({shots:[1,1],onTarget:[0,0]});
 });
 it('rejeita periodo ambiguo quando added_time nao corresponde a 45 ou 90',()=>{
  const h='match_id,shot_index,minute,added_time,is_home,outcome';
  const csv=h+'\n'+'ok,1,48,3.0,True,goal\nok,2,46,,True,miss\nok,3,90,4.0,False,block';
  const a=auditFplShotEvents([fixture(1,'ok')],[csv,...Array(6).fill(h+'\nnotused,1,55,,False,miss')]);
  expect(a.reconciled).toBe(0);
  expect(a.divergentIds).toEqual(['ok']);
  expect(a.periodsById['ok']).toBeUndefined();
 });
 it('valida gols por tempo de modo independente, mesmo se faltam finalizacoes',()=>{
  const csv=header+'\n'+'ok,1,45,True,goal\nok,2,60,False,miss';
  const a=auditFplShotEvents([fixture(1,'ok')],[csv,...Array(6).fill(header+'\nunused,1,50,True,miss')]);
  expect(a.reconciled).toBe(0);
  expect(a.goalReconciled).toBe(1);
  expect(a.goalPeriodsById['ok']).toEqual({first:[1,0],second:[0,0]});
 });
 it('conta gols em 45+3 no primeiro tempo e 90+4 no segundo',()=>{
  const h='match_id,shot_index,minute,added_time,is_home,outcome';
  const csv=h+'\n'+'ok,1,45,3.0,True,goal\nok,2,90,4.0,True,goal\nok,3,60,,False,goal';
  const game={...fixture(1,'ok'),goals:[2,1] as [number,number],shots:[2,1] as [number,number],onTarget:[2,1] as [number,number]};
  const a=auditFplShotEvents([game],[csv,...Array(6).fill(h+'\nunused,1,50,,True,miss')]);
  expect(a.goalReconciled).toBe(1);
  expect(a.goalPeriodsById['ok']).toEqual({first:[1,0],second:[1,1]});
  expect(a.reconciled).toBe(1);
 });
 it('nao divide gols quando ha gol contra ou placar inconciliavel',()=>{
  const csv=header+'\n'+'ok,1,45,True,goal\nok,2,60,False,owngoal';
  const a=auditFplShotEvents([fixture(1,'ok')],[csv,...Array(6).fill(header+'\nunused,1,50,True,miss')]);
  expect(a.goalReconciled).toBe(0);
  expect(a.goalDivergentIds).toEqual(['ok']);
  expect(a.goalPeriodsById['ok']).toBeUndefined();
  const b=auditFplShotEvents([fixture(1,'ok')],[header+'\n'+'ok,1,45,True,miss',...Array(6).fill(header+'\nunused,1,50,True,miss')]);
  expect(b.goalReconciled).toBe(0);
 });
 it('conta bloqueios em cima da linha como chute no alvo quando coincidem com o total',()=>{
  const game={...fixture(1,'ok'),onTarget:[2,0] as [number,number]};
  const csv=header+'\n'+'ok,1,15,True,goal\nok,2,33,True,blocked-off-line\nok,3,60,False,miss';
  const a=auditFplShotEvents([game],[csv,...Array(6).fill(header+'\nunused,1,50,True,miss')]);
  expect(a.reconciled).toBe(1);
  expect(a.periodsById['ok']?.first.onTarget).toEqual([2,0]);
 });
 it('rejeita eventos com minutos ausentes ou valores de minuto inválidos',()=>{
  const csv=header+'\n'+'ok,1,,True,goal\nok,2,47,True,miss\nok,3,60,False,block';
  const a=auditFplShotEvents([fixture(1,'ok')],[csv,...Array(6).fill(header+'\nnotused,1,55,False,miss')]);
  expect(a.reconciled).toBe(0);expect(a.divergent).toBe(1);
 });
});

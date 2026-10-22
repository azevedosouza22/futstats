import {describe, expect, it} from 'vitest';
import {unavailableFplIndicators} from './fplFallback';
import type {FplPilotGame} from './fplFreePilot';

const game: FplPilotGame = {
 id:'26-27-prem-fixture',gw:7,date:'2026-10-18',sourceKickoff:'2026-10-18T14:00:00',
 home:'A',away:'B',goals:[1,0],shots:[12,9],onTarget:[4,2],corners:[6,3],
 sourceStatsProcessed:true
};

describe('fallback informativo Flashscore sem importar dados',()=>{
 it('lista só os períodos não disponíveis quando as finalizações foram conciliadas',()=>{
  expect(unavailableFplIndicators(game,true)).toEqual({
   missing:['Gols por tempo','Escanteios por tempo'],auditPending:false
  });
 });
 it('sinaliza finalizações sem conciliação como ausentes, não as inventa',()=>{
  const result=unavailableFplIndicators(game,false);
  expect(result.missing).toContain('Finalizações e chutes no gol por tempo');
  expect(result.auditPending).toBe(false);
 });
 it('aguarda auditoria de finalizações em vez de declarar ausência definitiva',()=>{
  const result=unavailableFplIndicators(game,null);
  expect(result.missing).not.toContain('Finalizações e chutes no gol por tempo');
  expect(result.auditPending).toBe(true);
 });
 it('não usa totais de partida marcada como não processada',()=>{
  const result=unavailableFplIndicators({...game,sourceStatsProcessed:false},true);
  expect(result.missing[0]).toContain('jogo completo');
  expect(result.missing[1]).toContain('1º/2º tempo');
 });
 it('retira gols por tempo das pendencias somente quando os placares por periodo conferem',()=>{
  expect(unavailableFplIndicators(game,true,true)).toEqual({
   missing:['Escanteios por tempo'],auditPending:false
  });
  expect(unavailableFplIndicators(game,false,true).missing).toEqual([
   'Escanteios por tempo','Finalizações e chutes no gol por tempo'
  ]);
 });
 it('sinaliza que gols ainda estao em conferencia em vez de adivinhar valores',()=>{
  const pending=unavailableFplIndicators(game,null,null);
  expect(pending.auditPending).toBe(true);
  expect(pending.missing).toEqual(['Escanteios por tempo']);
 });
 it('não altera a partida recebida',()=>{
  const before=JSON.stringify(game);
  unavailableFplIndicators(game,false);
  expect(JSON.stringify(game)).toBe(before);
 });
});

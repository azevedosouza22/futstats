import {describe,expect,it} from 'vitest';
import {evaluateV4OddsValue as evalOdds} from './radarV4OddsValue';

describe('Radar V4 odds simulation — manual, hypothetical and never auto-recommended',()=>{
 it('finds theoretical break-even at odd 1,50 (66,67%)',()=>{
  const r=evalOdds('1,50','70','2');
  expect(r.status).toBe('positive');
  expect(r.breakEvenPercent).toBeCloseTo(66.6666666667);
  expect(r.expectedRoiPercent).toBeCloseTo(5);
  expect(r.expectedProfit).toBeCloseTo(.10);
  expect(r.winningReturn).toBeCloseTo(3);
  expect(r.winningProfit).toBeCloseTo(1);
  expect(r.losingProfit).toBe(-2);
 });
 it('shows negative value even with 76,3% hypothetical chance when odd is 1,30',()=>{
  const r=evalOdds('1.30','76,3','2');
  expect(r.status).toBe('negative');
  expect(r.expectedRoiPercent).toBeCloseTo(-.81);
  expect(r.expectedProfit).toBeCloseTo(-.0162);
 });
 it('does not claim value without an independently supplied probability',()=>{
  const r=evalOdds('1,50','','2');
  expect(r.status).toBe('missing_probability');
  expect(r.breakEvenPercent).toBeCloseTo(66.6667);
  expect(r.expectedProfit).toBeNull();
 });
 it('does not turn missing or invalid probability into zero',()=>{
  for(const p of ['N/D','-5','101','70%','70,1,2']){
   const r=evalOdds('1,50',p,'2');
   expect(r.status).toBe('invalid_probability');
   expect(r.expectedProfit).toBeNull();
  }
 });
 it('rejects zero, nonsense and invalid odds or stakes',()=>{
  for(const odd of ['','0','1','1,00','N/D','1,5e3','1,2,3','1001'])
   expect(evalOdds(odd,'80','2').status).toBe('invalid_odds');
  for(const stake of ['','0','-2','1e6'])
   expect(evalOdds('1,5','80',stake).status).toBe('invalid_stake');
 });
 it('makes exact break-even neutral and preserves zero/100 boundary cases',()=>{
  const neutral=evalOdds('2','50','2');
  expect(neutral.status).toBe('neutral');
  expect(neutral.expectedProfit).toBeCloseTo(0);
  expect(evalOdds('2','0','2').expectedProfit).toBe(-2);
  expect(evalOdds('2','100','2').expectedProfit).toBe(2);
 });
 it('does not conflate stake, projected profit and total winning return',()=>{
  const r=evalOdds('2,00','55','10');
  expect(r.status).toBe('positive');
  expect(r.expectedRoiPercent).toBeCloseTo(10);
  expect(r.expectedProfit).toBeCloseTo(1);
  expect(r.winningProfit).toBe(10);
  expect(r.winningReturn).toBe(20);
 });
});

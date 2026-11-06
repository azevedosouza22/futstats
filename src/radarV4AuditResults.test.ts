import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {parseV4Audit,summarizeV4Audit} from './radarV4AuditResults';
const auditRaw=JSON.parse(readFileSync(new URL(
 '../public/research/v4-lab/auditoria-2026-10-31.json',import.meta.url),'utf8')) as unknown;
describe('LV4 — auditoria Work de 31/10 (não altera previsões)',()=>{
 it('exige 360 decisões, 30 jogos e 188 sinais efetivamente avaliados',()=>{
  const a=parseV4Audit(auditRaw);
  expect(a.summary).toMatchObject({fixtures:30,games_complete:17,games_pending:13,
   opportunities:360,signals:328,abstentions:32,evaluated_signals:188,hits:128,misses:60,pending_signals:140});
  expect(a.decisions).toHaveLength(360);
 });
 it('separa acerto, erro e abstenção por tempo e mercado',()=>{
  const a=parseV4Audit(auditRaw);
  const byPeriod=summarizeV4Audit(a,'period');
  expect(byPeriod.reduce((s,r)=>s+r.acertos,0)).toBe(128);
  expect(byPeriod.reduce((s,r)=>s+r.erros,0)).toBe(60);
  expect(byPeriod.reduce((s,r)=>s+r.abstencoes,0)).toBe(32);
  const second=byPeriod.find(r=>r.label==='2º tempo')!;
  expect(second.acertos).toBe(52);
  expect(second.erros).toBe(16);
  expect(second.taxa).toBeCloseTo(52/68,9);
  const goals=summarizeV4Audit(a,'metric').find(x=>x.label==='Gols')!;
  expect(goals.acertos).toBe(33);
  expect(goals.erros).toBe(12);
  expect(goals.taxa).toBeCloseTo(33/45,9);
 });
 it('não atribui lucro real, não converte abstenções e rejeita registros adulterados',()=>{
  const a=parseV4Audit(auditRaw);
  expect(a.decisions.some(x=>x.historical_odds!=='N/D')).toBe(false);
  const copy=structuredClone(auditRaw) as {decisions: Array<{decision:string}>};
  copy.decisions[0].decision='ERRO';
  expect(()=>parseV4Audit(copy)).toThrow();
  const modified=structuredClone(auditRaw) as {decisions:Array<{original_pick:{line:number|null}}>} ;
  modified.decisions[0].original_pick.line=1000;
  expect(()=>parseV4Audit(modified)).toThrow();
 });
});

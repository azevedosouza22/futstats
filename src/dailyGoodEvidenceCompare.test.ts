import {describe,it,expect} from 'vitest';
import type {SavedRadarRecord} from './radarRecords';
import type {PickAuditReport,PickAuditRow} from './dailyGoodAudit';
import {
 DOCUMENTARY_COMPARISON_FORMAT,documentaryTemplate,parseDocumentaryEvidence,
 reconcileDocumentaryEvidence
} from './dailyGoodEvidenceCompare';

const kickoff='2026-10-25T20:00:00';
const clock=new Date('2026-10-26T15:00:00.000Z');
const evidence=()=>({
 format:DOCUMENTARY_COMPARISON_FORMAT,recordKey:'snapshot-01',
 matchAt:kickoff,competition:'Campeonato X',home:'Casa',away:'Fora',
 checkedAt:'2026-10-26T10:00:00.000Z',
 sourceUrl:'https://www.sofascore.com/pt/futebol/jogo/casa-fora/123',
 indicators:[{id:'goals-full-2.5',actual:2}]
});
const saved=():SavedRadarRecord=>({
 key:'snapshot-01',savedAt:'2026-10-25T18:00:00.000Z',
 matchAt:kickoff,competition:'Campeonato X',home:'Casa',away:'Fora',
 homeCount:5,awayCount:5,markets:[],
 goodPicks:{verifiedAt:'2026-10-25',
  sourceUrl:'https://www.cbf.com.br/futebol-brasileiro/jogos/123',
  signals:[{id:'goals-full-2.5',label:'Gols',line:2.5,
   direction:'Under',projection:1.3,historicalMean:1.8,
   historicalSample:10,leagueSample:20,relativeDistance:0.48}]}
});
const auditRow=():PickAuditRow=>({
 key:'snapshot-01',home:'Casa',away:'Fora',competition:'Campeonato X',
 matchAt:kickoff,status:'scored',
 reason:'Resultado com CSV local documentado, sem confirmação externa',
 sourceUrl:'https://www.flashscore.com.br/jogo/?mid=abc-123',
 markets:[{id:'goals-full-2.5',label:'Gols',line:2.5,actual:2,
  direction:'Under',v2:'Acertou',v3:'Acertou',constantOver:'Errou',
  historicalBaseline:'Acertou',historicalMean:1.8,
  historicalSample:10,leagueSample:20}]
});
const report=(row=auditRow()):PickAuditReport=>({
 snapshots:1,attributed:1,scoredFixtures:1,rows:[row],leagues:[]
});

describe('Etapa 45 — comparação documental sem alegar fonte acessada',()=>{
 it('compara valores informados, mas nunca converte concordância em fato verificado',()=>{
  const r=saved(),p=report(),input=evidence();
  const snapshot=JSON.stringify({r,p,input});
  const verified=parseDocumentaryEvidence(input,clock);
  const compared=reconcileDocumentaryEvidence(verified,[r],p);
  expect(compared).toMatchObject({recordKey:'snapshot-01',
   agreement:1,disagreement:0,unknown:0,
   conclusion:'DOCUMENTAÇÃO INFORMADA — NÃO VERIFICADA NA WEB',
   markets:[{id:'goals-full-2.5',local:2,reported:2,status:'COINCIDE'}]});
  expect(JSON.stringify({r,p,input})).toBe(snapshot);
 });
 it('preserva divergências e indicadores faltantes como DIVERGE ou N/D',()=>{
  const wrong={...evidence(),indicators:[{id:'goals-full-2.5',actual:3}]};
  expect(reconcileDocumentaryEvidence(parseDocumentaryEvidence(wrong,clock),
   [saved()],report()).markets[0].status).toBe('DIVERGE');
  const p=report({...auditRow(),markets:[...auditRow().markets,{
   ...auditRow().markets[0],id:'shots-full-24.5',label:'Finalizações',actual:null
  }]});
  const x=reconcileDocumentaryEvidence(parseDocumentaryEvidence(evidence(),clock),
   [saved()],p);
  expect(x).toMatchObject({agreement:1,unknown:1});
  expect(x.markets[1]).toMatchObject({local:null,reported:null,status:'N/D'});
 });
 it('modelo exportado jamais é evidência validável até preenchimento',()=>{
  const template=documentaryTemplate(saved(),report());
  const json=JSON.parse(template);
  expect(json).toMatchObject({format:DOCUMENTARY_COMPARISON_FORMAT,
   checkedAt:'',sourceUrl:'',indicators:[{id:'goals-full-2.5',actual:null}]});
  expect(()=>parseDocumentaryEvidence(json,clock)).toThrow();
  expect(template).not.toContain('VERIFICADO');
 });
 it('impede fórmula, falsificação de campo e host semelhante',()=>{
  const fake={...evidence(),sourceUrl:'https://www.sofascore.com.evil.invalid/1'};
  expect(()=>parseDocumentaryEvidence(fake,clock)).toThrow();
  expect(()=>parseDocumentaryEvidence({...evidence(),sourceUrl:'http://www.sofascore.com/1'},clock)).toThrow();
  expect(()=>parseDocumentaryEvidence({...evidence(),verified:true},clock)).toThrow();
  expect(()=>parseDocumentaryEvidence({...evidence(),indicators:[{id:'goals-full-2.5',actual:2,verified:true}]},clock)).toThrow();
  expect(()=>parseDocumentaryEvidence({...evidence(),indicators:[{id:'goals-full-2.5',actual:-1}]},clock)).toThrow();
  expect(()=>parseDocumentaryEvidence({...evidence(),indicators:[
   {id:'goals-full-2.5',actual:2},{id:'goals-full-2.5',actual:2}]},clock)).toThrow();
 });
 it('recusa conferência antes do prazo pós-jogo, futura e sem timestamp ISO',()=>{
  expect(()=>parseDocumentaryEvidence({...evidence(),
   checkedAt:'2026-10-25T23:10:00.000Z'},clock)).toThrow();
  expect(()=>parseDocumentaryEvidence({...evidence(),
   checkedAt:'2026-10-27T00:00:00.000Z'},clock)).toThrow();
  expect(()=>parseDocumentaryEvidence({...evidence(),
   checkedAt:'2026-10-26'},clock)).toThrow();
 });
 it('recusa campeonato, confronto, data, ID, fonte local e mercado divergentes',()=>{
  const valid=parseDocumentaryEvidence(evidence(),clock);
  expect(()=>reconcileDocumentaryEvidence(valid,[],report())).toThrow();
  expect(()=>reconcileDocumentaryEvidence({...valid,recordKey:'desconhecido'},[saved()],report())).toThrow();
  expect(()=>reconcileDocumentaryEvidence({...valid,competition:'Outra liga'},[saved()],report())).toThrow();
  expect(()=>reconcileDocumentaryEvidence({...valid,matchAt:'2026-10-26T20:00:00'},[saved()],report())).toThrow();
  expect(()=>reconcileDocumentaryEvidence({...valid,home:'Time contrário'},[saved()],report())).toThrow();
  expect(()=>reconcileDocumentaryEvidence({...valid,indicators:[{id:'outro',actual:1}]},[saved()],report())).toThrow();
  expect(()=>reconcileDocumentaryEvidence(valid,[saved()],report({...auditRow(),status:'waiting'}))).toThrow();
  expect(()=>reconcileDocumentaryEvidence(valid,[{...saved(),goodPicks:undefined}],report())).toThrow();
  expect(()=>reconcileDocumentaryEvidence(valid,[saved()],report({...auditRow(),
   sourceUrl:'https://www.sofascore.com/pt/outro'}))).toThrow();
 });
});

import {describe,expect,it} from 'vitest';
import type {SavedRadarRecord} from './radarRecords';
import type {PickAuditReport,PickAuditRow} from './dailyGoodAudit';
import {compareQuickEnteredSource} from './dailyGoodQuickEvidence';

const at=new Date('2026-10-26T15:00:00Z');
const row:PickAuditRow={
 key:'pick-1',competition:'Campeonato X',home:'Casa',away:'Fora',
 matchAt:'2026-10-25T20:00:00',status:'scored',reason:'CSV local',
 sourceUrl:'https://www.flashscore.com.br/jogo/?mid=source-001',
 markets:[
  {id:'goals-full-2.5',label:'Gols',line:2.5,actual:2,direction:'Under',
   v2:'Acertou',v3:'Acertou',constantOver:'Errou',historicalBaseline:'Acertou',
   historicalMean:2,historicalSample:10,leagueSample:20},
  {id:'shots-full-24.5',label:'Finalizações',line:24.5,actual:null,direction:'Over',
   v2:'N/D',v3:'N/D',constantOver:'N/D',historicalBaseline:'N/D',
   historicalMean:25,historicalSample:10,leagueSample:20}
 ]
};
const record:SavedRadarRecord={
 key:'pick-1',savedAt:'2026-10-25T18:00:00Z',matchAt:row.matchAt,
 competition:row.competition,home:row.home,away:row.away,homeCount:5,awayCount:5,
 markets:[],
 goodPicks:{sourceUrl:'https://www.cbf.com.br/jogos/abc',
 verifiedAt:'2026-10-25',signals:[{
  id:'goals-full-2.5',label:'Gols',line:2.5,direction:'Under',
  projection:1.4,historicalMean:2,historicalSample:10,leagueSample:20,
  relativeDistance:.44
 }]}
};
const report:PickAuditReport={rows:[row],snapshots:1,attributed:1,scoredFixtures:1,leagues:[]};
const input=()=>({recordKey:'pick-1',checkedAtBrasilia:'2026-10-26T07:00',
 sourceUrl:'https://www.sofascore.com/pt/futebol/jogo/casa-fora/abc',
 values:{'goals-full-2.5':'2'}});
const check=(arg=input(),r=report,records=[record])=>
 compareQuickEnteredSource(arg,records,r,at);
describe('Etapa 53 — comparação direta, sem fabricar consulta externa',()=>{
 it('monta documento com consulta em Brasília explicitamente informada e compara sem mutações',()=>{
  const snap=JSON.stringify({record,report});const {source,comparison}=check();
  expect(source).toMatchObject({
   checkedAt:'2026-10-26T10:00:00.000Z',
   indicators:[{id:'goals-full-2.5',actual:2}]
  });
  expect(comparison).toMatchObject({
   agreement:1,disagreement:0,unknown:1,
   conclusion:'DOCUMENTAÇÃO INFORMADA — NÃO VERIFICADA NA WEB'
  });
  expect(JSON.stringify({record,report})).toBe(snap);
  expect(comparison).not.toHaveProperty('verified');
 });
 it('não preenche dados com o CSV local; N/D continua N/D',()=>{
  expect(()=>check({...input(),values:{'goals-full-2.5':''}}))
   .toThrow('Informe de 1 a 3');
  expect(check({...input(),values:{'goals-full-2.5':'0'}}).comparison)
   .toMatchObject({disagreement:1,agreement:0,unknown:1});
 });
 it('rejeita fonte forjada, HTTP, original ou falta de origem',()=>{
  for(const url of [
   'http://www.sofascore.com/match/1',
   'https://www.sofascore.com.evil.invalid/jogo',
   'https://www.flashscore.com.br/jogo/?mid=source-001',
   'https://www.sofascore.com@evil.invalid/jogo'
  ])expect(()=>check({...input(),sourceUrl:url})).toThrow();
 });
 it('não aceita tempo antes do pós-jogo, no futuro ou impossível',()=>{
  for(const checkedAtBrasilia of [
   '2026-10-25T21:00','2026-10-26T13:00',
   '2026-02-31T07:00','2026-10-26T25:00',''
  ])expect(()=>check({...input(),checkedAtBrasilia})).toThrow();
 });
 it('recusa número negativo, decimal, científico, desconhecido ou resultado N/D',()=>{
  for(const value of ['-1','2.5','1e2','NaN','+2','9007199254740992'])
   expect(()=>check({...input(),values:{'goals-full-2.5':value}})).toThrow();
  expect(()=>check({...input(),values:{'shots-full-24.5':'2'}}))
   .toThrow('não pertence ao resultado');
  expect(()=>check({...input(),values:{'outro-id':'2'}}))
   .toThrow('não pertence ao resultado');
 });
 it('não reatribui Radar genérico nem aceita auditoria inconsistente',()=>{
  expect(()=>check(input(),report,[{...record,goodPicks:undefined}])).toThrow();
  expect(()=>check(input(),{...report,rows:[{...row,status:'waiting'}]})).toThrow();
  expect(()=>check(input(),{...report,rows:[]})).toThrow('divergentes');
  expect(()=>check({...input(),recordKey:'inexistente'})).toThrow();
 });
});

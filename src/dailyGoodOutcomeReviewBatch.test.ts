import {describe,expect,it} from 'vitest';
import {empty,type Data,type Match} from './model';
import type {SavedRadarRecord} from './radarRecords';
import {auditDailyGoodPicks} from './dailyGoodAudit';
import {buildIndependentReviewQueue} from './dailyGoodIndependentReview';
import {traceFrozenResults} from './dailyGoodFrozenResultTrace';
import {prepareOutcomeReviewBatch,exportOutcomeReviewBatchJson} from './dailyGoodOutcomeReviewBatch';

const at=new Date('2026-10-26T17:00:00.000Z');
const signal={id:'goals-full-2.5',label:'Gols',line:2.5,direction:'Under' as const,
 projection:1.4,historicalMean:2.1,historicalSample:10,leagueSample:20,
 relativeDistance:.44};
const forecast=():SavedRadarRecord=>({
 key:'save-001',savedAt:'2026-10-25T15:00:00.000Z',
 matchAt:'2026-10-25T20:00:00',competition:'Liga X',
 home:'Casa',away:'Fora',homeCount:5,awayCount:5,
 markets:[{id:signal.id,label:'Gols',line:2.5,historyRate:0.3,
   observed:10,overs:3,historicalMean:2.1}],
 venue:[{marketId:signal.id,label:'Gols',line:2.5,
   v2:'Under',v3:'Under',projectedTotal:1.4,failedChecks:[]}],
 leagueContext:[{id:signal.id,mean:2,observed:20}],
 goodPicks:{verifiedAt:'2026-10-25',
  sourceUrl:'https://www.cbf.com.br/jogos/fixture',
  signals:[signal]}
});
const match=():Match=>({
 id:'local-match-11',date:'2026-10-25',competition:'Liga X',home:'a',away:'b',
 first:[{...empty(),goals:2,shots:12,target:6,corners:3},
  {...empty(),goals:0,shots:8,target:2,corners:2}],
 second:[{...empty(),goals:0,shots:0,target:0,corners:0},
  {...empty(),goals:0,shots:0,target:0,corners:0}],
 research:{provider:'work-csv',source:'Flashscore',sourceId:'fl-11',
  sourceUrl:'https://www.flashscore.com.br/jogo/?mid=fl-11',
  importedAt:'2026-10-26T03:00:00Z',dateDiscrepancy:false,
  full:[{...empty(),goals:2,shots:12,target:6,corners:3},
    {...empty(),goals:0,shots:8,target:2,corners:2}]}
});
const data=(games:Match[]=[]):Data=>({teams:[
 {id:'a',name:'Casa',color:'#112233'},
 {id:'b',name:'Fora',color:'#334455'}],matches:games});
const bundle=(records:SavedRadarRecord[],d:Data,now=at)=>{
 const audit=auditDailyGoodPicks(d,records,now);
 const queue=buildIndependentReviewQueue(records,audit,now);
 const trace=traceFrozenResults(d,records,audit);
 return {audit,queue,trace,
  package:prepareOutcomeReviewBatch(records,audit,queue,trace,now)};
};
describe('Etapa 70 — pacote mínimo para conferir várias previsões em lote',()=>{
 it('captura somente previsão original atribuída e o resultado CSV documentado',()=>{
  const r=forecast(),d=data([match()]),original=JSON.stringify({r,d});
  const result=bundle([r],d);
  expect(result.package).toMatchObject({
   format:'futstats-conferencia-independente-lote-v1',
   count:1,externallyVerified:0,externalStatus:'PENDENTE',
   minimumVerifiedFixturesPerLeague:30,
   records:[{recordKey:'save-001',home:'Casa',away:'Fora',
    savedAtUtc:'2026-10-25T15:00:00.000Z',
    matchAtBrasilia:'2026-10-25T20:00:00',
    localCsv:{matchId:'local-match-11',providerSourceId:'fl-11',
     provider:'work-csv / Flashscore'},
    frozenSignals:[{id:'goals-full-2.5',direction:'Under',line:2.5,localActual:2}],
    externalVerification:'PENDENTE'}]
  });
  const json=exportOutcomeReviewBatchJson(result.package);
  expect(json).not.toContain('CONFIRMADO');
  expect(json).not.toContain('historicalGames');
  expect(json).not.toContain('workForecasts');
  expect(JSON.stringify({r,d})).toBe(original);
 });
 it('previsão salva sem resultado nunca vira pacote com resultado inventado',()=>{
  const result=bundle([forecast()],data());
  expect(result.package).toMatchObject({count:0,records:[],
   externallyVerified:0,skipped:{noLocalResult:1}});
  expect(exportOutcomeReviewBatchJson(result.package)).toContain('PENDENTE');
 });
 it('registro antigo do Radar não entra e não atribui boas do dia',()=>{
  const legacy={...forecast(),goodPicks:undefined};
  const result=bundle([legacy],data([match()]));
  expect(result.package).toMatchObject({count:0,records:[],externallyVerified:0});
 });
 it('registro depois do início é excluído mesmo com CSV local',()=>{
  const late={...forecast(),savedAt:'2026-10-26T01:00:00Z'};
  const result=bundle([late],data([match()]));
  expect(result.package).toMatchObject({count:0,skipped:{excluded:1}});
 });
 it('rejeita fila e trilha adulteradas sem criar confirmação falsa',()=>{
  const r=forecast(),d=data([match()]),{audit,queue,trace}=bundle([r],d);
  const run=(q=queue,t=trace)=>
    prepareOutcomeReviewBatch([r],audit,q,t,at);
  expect(()=>run({...queue,checkExternal:0})).toThrow('quantidade');
  expect(()=>run(queue,[{...trace[0],resultSourceId:'outro'}]))
   .toThrow('ID da fonte CSV');
  expect(()=>run(queue,[{...trace[0],resultUrl:'https://invalid.example/'}]))
   .toThrow('procedência CSV');
  expect(()=>run({...queue,entries:[]})).toThrow('divergentes');
  expect(()=>run({...queue,entries:[{...queue.entries[0],externalCheck:'CONFIRMADO' as any}]}))
   .toThrow('procedência CSV');
 });
 it('não transforma uma previsão salva no futuro em amostra externa confirmada',()=>{
  const r=forecast(),d=data([match()]),{audit,queue,trace}=bundle([r],d);
  const bogus={...r,savedAt:'2026-10-26T00:00:00Z'};
  expect(()=>prepareOutcomeReviewBatch([bogus],audit,queue,trace,at))
   .toThrow('procedência CSV'); // a trilha original permanece congelada
 });
});

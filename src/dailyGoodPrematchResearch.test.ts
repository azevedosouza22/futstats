import {describe,expect,it} from 'vitest';
import type {Data} from './model';
import type {SavedRadarRecord} from './radarRecords';
import {auditDailyGoodPicks} from './dailyGoodAudit';
import {preparePrematchResearchPackage,exportPrematchResearchPackageJson} from './dailyGoodPrematchResearch';

const before=new Date('2026-10-25T19:00:00Z');
const after=new Date('2026-10-26T17:00:00Z');
const signal={id:'goals-full-2.5',label:'Gols',line:2.5,
 direction:'Under' as const,projection:1.4,historicalMean:2.1,
 historicalSample:10,leagueSample:20,relativeDistance:.44};
const forecast=(key='pick-1',league='Liga X'):SavedRadarRecord=>({
 key,savedAt:'2026-10-25T15:00:00.000Z',
 matchAt:'2026-10-25T20:00:00',competition:league,
 home:'Casa '+key,away:'Fora '+key,homeCount:5,awayCount:5,
 markets:[{id:signal.id,label:signal.label,line:2.5,historyRate:.3,
 observed:10,overs:3,historicalMean:2.1}],
 venue:[{marketId:signal.id,label:signal.label,line:2.5,v2:'Under',
 v3:'Under',projectedTotal:1.4,failedChecks:[]}],
 leagueContext:[{id:signal.id,mean:2.2,observed:20}],
 goodPicks:{verifiedAt:'2026-10-25',
 sourceUrl:'https://www.cbf.com.br/jogos/fixture',
 signals:[signal]}
});
const data:Data={teams:[],matches:[]};
const pack=(records:SavedRadarRecord[],at=before)=>{
 const audit=auditDailyGoodPicks(data,records,at);
 return preparePrematchResearchPackage(records,audit,at);
};
describe('Etapa 72 — pacote local original de previsões pré-jogo',()=>{
 it('exporta a previsão congelada ANTES do jogo sem inventar resultado CSV',()=>{
  const saved=forecast();const original=JSON.stringify(saved);
  const p=pack([saved]);
  expect(p).toMatchObject({total:1,externallyVerified:0,accuracy:'N/D',
   byLeague:[{competition:'Liga X',entries:1}],
   entries:[{recordKey:'pick-1',savedAtUtc:'2026-10-25T15:00:00.000Z',
    localDisposition:'future',externalResult:'N/D',externalCheck:'PENDENTE',
    frozenSignals:[{id:'goals-full-2.5',direction:'Under',line:2.5}]}]});
  const json=exportPrematchResearchPackageJson(p);
  expect(json).not.toContain('localCsv');
  expect(json).not.toContain('CONFIRMADO');
  expect(json).not.toContain('actual');
  expect(JSON.stringify(saved)).toBe(original);
 });
 it('após o jogo sem CSV preserva a previsão como aguardando resultado',()=>{
  expect(pack([forecast()],after)).toMatchObject({
   total:1,entries:[{localDisposition:'waiting',externalResult:'N/D'}]
  });
 });
 it('ignora Radar genérico e registros tardios/ambíguos sem conceder acerto',()=>{
  const legacy={...forecast('generic'),goodPicks:undefined};
  const late={...forecast('late'),savedAt:'2026-10-25T23:00:00Z'};
  const duplicated={...forecast('duplicate'),home:'Casa 1',away:'Fora 1'};
  const one=forecast('1');
  const p=pack([legacy,late,one,duplicated]);
  expect(p).toMatchObject({total:0,externallyVerified:0,accuracy:'N/D',
   skipped:{legacy:1,late:1,ambiguous:2,invalid:0}});
 });
 it('separa ligas, IDs e não mistura calendários nem reexecuta V2/V3',()=>{
  const a=forecast('a','Liga A'),b=forecast('b','Liga B');
  const p=pack([b,a]);
  expect(p.byLeague).toEqual([{competition:'Liga A',entries:1},
   {competition:'Liga B',entries:1}]);
  expect(p.entries.map(e=>e.recordKey)).toEqual(['a','b']);
  expect(p.entries.every(e=>e.frozenSignals[0].projection===1.4)).toBe(true);
 });
 it('recusa adulteração na ordem, data e origem das previsões',()=>{
  const records=[forecast('a'),forecast('b')];
  const report=auditDailyGoodPicks(data,records,before);
  expect(()=>preparePrematchResearchPackage(records.slice().reverse(),report,before))
   .toThrow('fora de ordem');
  expect(()=>preparePrematchResearchPackage(records.slice(0,1),report,before))
   .toThrow('divergentes');
  expect(()=>preparePrematchResearchPackage([records[0],records[0]],report,before))
   .toThrow('duplicado');
 });
 it('não aceita tempo salvo no futuro perante o relógio da exportação',()=>{
  const record=forecast(); // salvo às 15:00 UTC, no futuro relativo à consulta
  const early=new Date('2026-10-25T14:00:00Z');
  const row=auditDailyGoodPicks(data,[record],early);
  expect(()=>preparePrematchResearchPackage([record],row,early))
   .toThrow('Nada foi alterado');
 });
 it('pacote vazio é transparente e não apresenta resultados sintéticos como reais',()=>{
  const p=pack([]);
  expect(p).toMatchObject({total:0,entries:[],externallyVerified:0,
   byLeague:[],accuracy:'N/D'});
  expect(exportPrematchResearchPackageJson(p)).toContain('NAO AUTENTICADOS');
 });
});

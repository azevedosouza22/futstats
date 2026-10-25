import {describe,expect,it} from 'vitest';
import {empty,type Data,type Match} from './model';
import type {SavedRadarRecord} from './radarRecords';
import {auditDailyGoodPicks} from './dailyGoodAudit';

const when=new Date('2026-10-26T18:00:00.000Z');
const prior='2026-10-25T15:00:00.000Z';
const one=()=>({...empty(),goals:2,shots:15,target:5,corners:4});
const two=()=>({...empty(),goals:0,shots:5,target:2,corners:3});
const source='https://www.flashscore.com.br/jogo/?mid=game-001';
const result=():Match=>({
 id:'unique-result',date:'2026-10-25',home:'h',away:'a',competition:'Liga X',
 first:[one(),two()],second:[two(),two()],
 research:{provider:'work-csv',source:'Flashscore',sourceId:'game-001',
   sourceUrl:source,importedAt:'2026-10-26T03:00:00.000Z',
   dateDiscrepancy:false,
   full:[{...empty(),goals:2,shots:20,target:7,corners:7},
    {...empty(),goals:0,shots:10,target:4,corners:6}]}
});
const data=(matches:Match[]=[]):Data=>({teams:[
 {id:'h',name:'Casa',color:'#123456'},
 {id:'a',name:'Fora',color:'#123456'}
],matches});
const signal={id:'goals-full-2.5',label:'Gols',line:2.5,
 direction:'Under' as const,projection:1.4,historicalMean:2.1,
 historicalSample:10,leagueSample:20,relativeDistance:0.44};
const rec=():SavedRadarRecord=>({
 key:'frozen-1',savedAt:prior,matchAt:'2026-10-25T20:00:00',
 competition:'Liga X',home:'Casa',away:'Fora',
 homeCount:5,awayCount:5,
 markets:[{id:signal.id,label:signal.label,line:signal.line,
   historyRate:0.3,observed:10,overs:3,historicalMean:signal.historicalMean}],
 venue:[{marketId:signal.id,label:signal.label,line:signal.line,
   v2:'Under',v3:'Under',projectedTotal:1.4,failedChecks:[]}],
 leagueContext:[{id:signal.id,mean:2.2,observed:20}],
 goodPicks:{verifiedAt:'2026-10-25',sourceUrl:'https://www.cbf.com.br/futebol-brasileiro/jogos/fixture',
   signals:[signal]}
});
describe('Etapa 38 — auditoria prospectiva das Boas do Dia',()=>{
 it('não atribui uma previsão Radar antiga à lista de indicações',()=>{
  const old={...rec(),goodPicks:undefined};
  const before=JSON.stringify(old);
  const a=auditDailyGoodPicks(data([result()]),[old],when);
  expect(a).toMatchObject({attributed:0,scoredFixtures:0,leagues:[]});
  expect(a.rows[0].status).toBe('legacy');
  expect(JSON.stringify(old)).toBe(before);
 });
 it('congela V2/V3 e compara com resultado de fonte documentada e duas referências',()=>{
  const record=rec();const matches=data([result()]);
  const before=JSON.stringify({record,matches});
  const a=auditDailyGoodPicks(matches,[record],when);
  expect(a).toMatchObject({attributed:1,scoredFixtures:1});
  expect(a.rows[0]).toMatchObject({status:'scored',sourceUrl:source});
  expect(a.rows[0].markets[0]).toMatchObject({
   actual:2,v2:'Acertou',v3:'Acertou',constantOver:'Errou',
   historicalBaseline:'Acertou',historicalSample:10,leagueSample:20
  });
  expect(a.leagues[0]).toMatchObject({scoredMarkets:1,picks:{hits:1,observed:1},
   constantOver:{hits:0,observed:1},historicalBaseline:{hits:1,observed:1}});
  expect(JSON.stringify({record,matches})).toBe(before);
 });
 it('não marca resultado antes do jogo nem após registro tardio',()=>{
  expect(auditDailyGoodPicks(data([result()]),[rec()],
   new Date('2026-10-25T18:00:00Z')).rows[0].status).toBe('future');
  const late={...rec(),savedAt:'2026-10-25T23:10:00.000Z'};
  expect(auditDailyGoodPicks(data([result()]),[late],when).rows[0].status).toBe('late');
 });
 it('não pontua resultado ausente, manual, duplicado ou data divergente',()=>{
  expect(auditDailyGoodPicks(data([]),[rec()],when).rows[0].status).toBe('waiting');
  const manual={...result(),research:undefined};
  expect(auditDailyGoodPicks(data([manual]),[rec()],when).rows[0].status).toBe('source_missing');
  expect(auditDailyGoodPicks(data([result(),{...result(),id:'another'}]),[rec()],when).rows[0].status).toBe('ambiguous');
  const wrong={...result(),research:{...result().research!,dateDiscrepancy:true,titleDate:'2026-10-24'}};
  expect(auditDailyGoodPicks(data([wrong]),[rec()],when).rows[0].status).toBe('ambiguous');
 });
 it('recusa identidade Good Picks sem referências ou sinais congelados coerentes',()=>{
  const bad={...rec(),goodPicks:{...rec().goodPicks!,
   signals:[{...signal,projection:9.9}]}};
  expect(auditDailyGoodPicks(data([result()]),[bad],when).rows[0].status).toBe('invalid');
  const badDate={...rec(),goodPicks:{...rec().goodPicks!,verifiedAt:'2026-10-26'}};
  expect(auditDailyGoodPicks(data([result()]),[badDate],when).rows[0].status).toBe('invalid');
  const duplicate={...rec(),key:'other'};
  expect(auditDailyGoodPicks(data([result()]),[rec(),duplicate],when).rows.every(r=>r.status==='ambiguous')).toBe(true);
 });
 it('N/D não vira zero e não entra no denominador de acertos',()=>{
  const missing=result();
  missing.research!.full[0].goals=null;
  missing.first[0].goals=null;
  missing.second[0].goals=null;
  const a=auditDailyGoodPicks(data([missing]),[rec()],when);
  expect(a.rows[0].markets[0].actual).toBeNull();
  expect(a.rows[0].markets[0].v3).toBe('N/D');
  expect(a.leagues[0]).toMatchObject({scoredMarkets:0,missingMarkets:1,picks:{hits:0,observed:0}});
 });
 it('não pontua CSV registrado antes do término do jogo',()=>{
  const m=result();
  m.research!.importedAt='2026-10-25T23:20:00Z';
  expect(auditDailyGoodPicks(data([m]),[rec()],when).rows[0].status).toBe('source_missing');
 });
});

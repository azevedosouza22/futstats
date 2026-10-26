import {describe,it,expect} from 'vitest';
import {empty,type Data,type Match} from './model';
import type {SavedRadarRecord} from './radarRecords';
import {auditDailyGoodPicks} from './dailyGoodAudit';
import {traceFrozenResults,exportFrozenResultTraceCsv} from './dailyGoodFrozenResultTrace';

const now=new Date('2026-10-26T17:00:00.000Z');
const sourceUrl='https://www.flashscore.com.br/jogo/?mid=fixture-777';
const signal={id:'goals-full-2.5',label:'Gols',line:2.5,direction:'Under' as const,
 projection:1.4,historicalMean:2.1,historicalSample:10,leagueSample:20,relativeDistance:.44};
const rec=():SavedRadarRecord=>({
 key:'frozen-id',savedAt:'2026-10-25T15:00:00.000Z',
 matchAt:'2026-10-25T20:00:00',competition:'Liga X',
 home:'Casa',away:'Fora',homeCount:5,awayCount:5,
 markets:[{id:signal.id,label:signal.label,line:2.5,historyRate:.3,
   observed:10,overs:3,historicalMean:2.1}],
 venue:[{marketId:signal.id,label:'Gols',line:2.5,v2:'Under',v3:'Under',
   projectedTotal:1.4,failedChecks:[]}],
 leagueContext:[{id:signal.id,mean:2,observed:20}],
 goodPicks:{verifiedAt:'2026-10-25',
   sourceUrl:'https://www.cbf.com.br/fixtures/fixture',signals:[signal]}
});
const outcome=():Match=>({
 id:'local-777',date:'2026-10-25',home:'h',away:'a',competition:'Liga X',
 first:[{...empty(),goals:2,shots:15,target:5,corners:4},
  {...empty(),goals:0,shots:5,target:2,corners:3}],
 second:[{...empty(),goals:0,shots:5,target:2,corners:3},
  {...empty(),goals:0,shots:5,target:2,corners:3}],
 research:{provider:'work-csv',source:'Flashscore',sourceId:'fixture-777',
   sourceUrl,importedAt:'2026-10-26T03:00:00.000Z',dateDiscrepancy:false,
   full:[{...empty(),goals:2,shots:20,target:7,corners:7},
    {...empty(),goals:0,shots:10,target:4,corners:6}]}
});
const data=(matches:Match[]=[]):Data=>({
 teams:[{id:'h',name:'Casa',color:'#123456'},{id:'a',name:'Fora',color:'#654321'}],
 matches
});
const trace=(d:Data,records:SavedRadarRecord[])=>{
 const a=auditDailyGoodPicks(d,records,now);
 return traceFrozenResults(d,records,a);
};

describe('Etapa 68 — vínculo auditável entre snapshot pré-jogo e resultado CSV',()=>{
 it('usa ID e importação EXATOS do CSV local sem inferir verificação externa',()=>{
  const r=rec(),d=data([outcome()]);
  const before=JSON.stringify({r,d});
  const rows=trace(d,[r]);
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({
   key:'frozen-id',status:'scored',localStatus:'CSV_LOCAL_DOCUMENTADO',
   originVerifiedAt:'2026-10-25',resultMatchId:'local-777',
   resultSourceId:'fixture-777',resultProvider:'work-csv / Flashscore',
   resultImportedAt:'2026-10-26T03:00:00.000Z',resultUrl:sourceUrl,
   markets:[{id:'goals-full-2.5',line:2.5,direction:'Under',actual:2}],
   independentVerification:'PENDENTE'
  });
  expect(JSON.stringify({r,d})).toBe(before);
  const csv=exportFrozenResultTraceCsv(rows);
  expect(csv).toContain('"fixture-777"');
  expect(csv).toContain('"local-777"');
  expect(csv).toContain('"PENDENTE"');
  expect(csv).not.toContain('"CONFIRMADO"');
  expect(csv.split('\r\n').filter(Boolean)).toHaveLength(2);
 });
 it('não inventa sourceId ou gols quando CSV ainda não foi cadastrado',()=>{
  const rows=trace(data(),[rec()]);
  expect(rows[0]).toMatchObject({status:'waiting',localStatus:'RESULTADO_PENDENTE',
   resultMatchId:null,resultSourceId:null,resultImportedAt:null,
   markets:[{actual:null}],independentVerification:'PENDENTE'});
  const csv=exportFrozenResultTraceCsv(rows);
  expect(csv).toContain('"N/D"');
  expect(csv).not.toContain('"fixture-777"');
 });
 it('não atribui previsão legada nem registro salvo depois do kickoff',()=>{
  const old={...rec(),key:'legacy-id',goodPicks:undefined};
  expect(trace(data(),[old])).toHaveLength(0);
  const late={...rec(),savedAt:'2026-10-25T23:20:00.000Z'};
  const l=trace(data([outcome()]),[late]);
  expect(l).toMatchObject([{status:'late',localStatus:'EXCLUIDO',
   resultMatchId:null,markets:[{actual:null}]}]);
 });
 it('recusa dupla partida local, sem escolher arbitrariamente seu sourceId',()=>{
  const a=outcome(),b={...outcome(),id:'local-778',
   research:{...outcome().research!,sourceId:'fixture-778',
     sourceUrl:'https://www.flashscore.com.br/jogo/?mid=fixture-778'}};
  const rows=trace(data([a,b]),[rec()]);
  expect(rows).toMatchObject([{status:'ambiguous',localStatus:'EXCLUIDO',
   resultSourceId:null,independentVerification:'PENDENTE'}]);
 });
 it('não aceita relatório fora de ordem nem mudança silenciosa de IDs',()=>{
  const r=rec(),d=data([outcome()]);
  const report=auditDailyGoodPicks(d,[r],now);
  expect(()=>traceFrozenResults(d,[{...r,key:'alterado'}],report))
   .toThrow('identidade');
  expect(()=>traceFrozenResults(d,[r,r],report)).toThrow('divergentes');
  expect(()=>traceFrozenResults(d,[r],{...report,rows:[{...report.rows[0],sourceUrl:'https://invalid.invalid'}]}))
   .toThrow('vínculo');
  expect(()=>traceFrozenResults(d,[r],{...report,attributed:0}))
   .toThrow('total');
 });
 it('neutraliza fórmula de planilha sem transformar string em comando',()=>{
  const rows=trace(data(),[{...rec(),competition:'=HYPERLINK("https://mal.invalid";"abrir")'}]);
  const csv=exportFrozenResultTraceCsv(rows);
  expect(csv).toContain('"\'=HYPERLINK(""https://mal.invalid"";""abrir"")"');
  expect(csv).toContain('"PENDENTE"');
 });
});

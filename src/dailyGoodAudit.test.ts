import {describe,expect,it} from 'vitest';
import {empty,type Data,type Match} from './model';
import type {SavedRadarRecord} from './radarRecords';
import {auditDailyGoodPicks} from './dailyGoodAudit';
import {exportDailyGoodEvidenceCsv} from './dailyGoodEvidenceExport';

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
 it('recusa verificação oficial já vencida no dia da previsão congelada',()=>{
  const r=rec();
  const older={...r,goodPicks:{...r.goodPicks!,verifiedAt:'2026-10-22'}};
  const verifiedLater={...r,goodPicks:{...r.goodPicks!,verifiedAt:'2026-10-26'}};
  const valid={...r,goodPicks:{...r.goodPicks!,verifiedAt:'2026-10-23'}};
  expect(auditDailyGoodPicks(data([result()]),[older],when).rows[0].status).toBe('invalid');
  expect(auditDailyGoodPicks(data([result()]),[verifiedLater],when).rows[0].status).toBe('invalid');
  expect(auditDailyGoodPicks(data([result()]),[valid],when).rows[0].status).toBe('scored');
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
 it('contabiliza a fila prospectiva por liga, sem transformar exclusões em acerto',()=>{
  const waiting={...rec(),key:'outro',home:'Time C',away:'Time D',matchAt:'2026-10-25T21:00:00'};
  const late={...rec(),key:'tardio',home:'Time E',away:'Time F',
    savedAt:'2026-10-26T00:05:00.000Z'};
  const invalid={...rec(),key:'invalido',home:'Time G',away:'Time H',
    goodPicks:{...rec().goodPicks!,sourceUrl:'https://example.com/unsupported'}};
  const p=auditDailyGoodPicks(data([result()]),[rec(),waiting,late,invalid],when);
  expect(p).toMatchObject({attributed:4,scoredFixtures:1});
  expect(p.leagues[0]).toMatchObject({snapshots:4,scoredFixtures:1,
    statusCounts:{scored:1,waiting:1,late:1,invalid:1,future:0,
      ambiguous:0,source_missing:0}});
  expect(p.leagues[0].picks.observed).toBe(1);
  expect(p.leagues[0].statusCounts.scored+
    p.leagues[0].statusCounts.waiting+
    p.leagues[0].statusCounts.late+
    p.leagues[0].statusCounts.invalid).toBe(4);
 });
 it('aceita origem da Premier League validada em HTTPS para análise futura',()=>{
  const record={...rec(),goodPicks:{...rec().goodPicks!,
    sourceUrl:'https://www.premierleague.com/en/news/4688862/fixture-amendments-for-premier-league-matches-in-october-and-november'}};
  expect(auditDailyGoodPicks(data([result()]),[record],when).rows[0].status).toBe('scored');
 });
 it('não pontua CSV registrado antes do término do jogo',()=>{
  const m=result();
  m.research!.importedAt='2026-10-25T23:20:00Z';
  expect(auditDailyGoodPicks(data([m]),[rec()],when).rows[0].status).toBe('source_missing');
 });
});


describe('Etapa 43 — acompanhamento portátil de evidências prospectivas',()=>{
 it('exporta apenas a seleção congelada e nunca promove registros Radar legados',()=>{
  const pick=rec();
  const legacy={...rec(),key:'radar-legado',goodPicks:undefined};
  const records=[legacy,pick];
  const before=JSON.stringify(records);
  const report=auditDailyGoodPicks(data(),records,new Date('2026-10-25T19:00:00Z'));
  const csv=exportDailyGoodEvidenceCsv(records,report);
  expect(csv.startsWith('\uFEFF"registro_id";')).toBe(true);
  expect(csv.split('\r\n').filter(Boolean)).toHaveLength(2);
  expect(csv).toContain('"frozen-1"');
  expect(csv).not.toContain('radar-legado');
  expect(csv).toContain('"future"');
  expect(csv).toContain('"Under"');
  expect(csv).toContain('"1.4"');
  expect(csv).toContain('"PENDENTE"');
  expect(csv).toContain('"N/D"');
  expect(JSON.stringify(records)).toBe(before);
 });
 it('distingue resultado com CSV local de conferência externa INEXISTENTE',()=>{
  const record=rec();
  const report=auditDailyGoodPicks(data([result()]),[record],when);
  const csv=exportDailyGoodEvidenceCsv([record],report);
  expect(csv).toContain('"scored"');
  expect(csv).toContain('"2";"Acertou";"https://www.flashscore.com.br/jogo/?mid=game-001";"PENDENTE"');
  expect(csv).not.toContain('"CONFIRMADO"');
  expect(csv).not.toContain('"validado externamente"');
 });
 it('mantém pendências e excluídos, sem reconstruir estatística ausente',()=>{
  const waiting={...rec(),key:'sem-resultado'};
  const late={...rec(),key:'depois-do-inicio',savedAt:'2026-10-25T23:10:00Z'};
  const report=auditDailyGoodPicks(data(),[waiting,late],when);
  const csv=exportDailyGoodEvidenceCsv([waiting,late],report);
  expect(csv.split('\r\n').filter(Boolean)).toHaveLength(3);
  expect(csv).toContain('"waiting"');
  expect(csv).toContain('"late"');
  expect(csv.match(/"PENDENTE"/g)).toHaveLength(2);
  expect(csv).not.toContain('"Acertou"');
  expect(csv).not.toContain('"Errou"');
 });
 it('protege planilhas de fórmula injetada sem perder delimitadores nem acentos',()=>{
  const malicious={...rec(),key:'teste-export',
   home:' =HYPERLINK("https://phishing.invalid";"abrir")',
   away:'Clube "São Paulo"; B'};
  const report=auditDailyGoodPicks(data(),[malicious],when);
  const csv=exportDailyGoodEvidenceCsv([malicious],report);
  expect(csv).toContain('"\' =HYPERLINK(""https://phishing.invalid"";""abrir"")"');
  expect(csv).toContain('"Clube ""São Paulo""; B"');
  expect(csv).toContain('"PENDENTE"');
 });
 it('não produz relatório associando snapshots a auditorias de outra ordem',()=>{
  const a=rec(),b={...rec(),key:'segundo'};
  const audit=auditDailyGoodPicks(data(),[a,b],when);
  expect(()=>exportDailyGoodEvidenceCsv([b,a],audit)).toThrow('Ordem de auditoria');
  expect(()=>exportDailyGoodEvidenceCsv([a],audit)).toThrow('divergente');
 });
});

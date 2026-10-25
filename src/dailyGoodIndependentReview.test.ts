import {describe,expect,it} from 'vitest';
import type {SavedRadarRecord} from './radarRecords';
import type {PickAuditReport,PickAuditRow,PickAuditStatus} from './dailyGoodAudit';
import {buildIndependentReviewQueue,exportIndependentReviewQueueCsv} from './dailyGoodIndependentReview';

const record=(key:string,home='Casa'):SavedRadarRecord=>({
 key,savedAt:'2026-10-25T15:00:00Z',matchAt:'2026-10-25T20:00:00',
 competition:'Liga X',home,away:'Fora',homeCount:5,awayCount:5,
 markets:[],
 goodPicks:{verifiedAt:'2026-10-25',
  sourceUrl:'https://www.cbf.com.br/futebol-brasileiro/jogos/fixture',
  signals:[{id:'goals-full-2.5',label:'Gols',direction:'Under',line:2.5,
   projection:1.4,historicalMean:2.1,historicalSample:10,
   leagueSample:20,relativeDistance:0.44}]}
});
const row=(key:string,status:PickAuditStatus):PickAuditRow=>({
 key,home:'Casa',away:'Fora',competition:'Liga X',
 matchAt:'2026-10-25T20:00:00',status,reason:status,
 sourceUrl:status==='scored'?'https://www.flashscore.com.br/jogo/fixture':null,
 markets:status==='scored'?[{
  id:'goals-full-2.5',label:'Gols',line:2.5,actual:2,
  direction:'Under',v2:'Acertou',v3:'Acertou',constantOver:'Errou',
  historicalBaseline:'Acertou',historicalMean:2.1,
  historicalSample:10,leagueSample:20
 }]:[]
});
const report=(rows:PickAuditRow[]):PickAuditReport=>({
 snapshots:rows.length,attributed:rows.filter(r=>r.status!=='legacy').length,
 scoredFixtures:rows.filter(r=>r.status==='scored').length,rows,leagues:[]
});
const now=new Date('2026-10-26T18:00:00Z');

describe('Etapa 44 — fila de conferência independente sem resultados fabricados',()=>{
 it('separa CSV local de revisão externa e nunca marca confirmação',()=>{
  const r=record('ok');
  const a=report([row('ok','scored')]);
  const before=JSON.stringify({r,a});
  const queue=buildIndependentReviewQueue([r],a,now);
  expect(queue).toMatchObject({checkExternal:1,needLocalResult:0,awaitKickoff:0,excluded:0});
  expect(queue.entries[0]).toMatchObject({
   state:'check_external',externalCheck:'PENDENTE',auditStatus:'scored',
   localResults:'Gols: 2',csvSourceUrl:'https://www.flashscore.com.br/jogo/fixture'
  });
  expect(exportIndependentReviewQueueCsv(queue)).toContain('"PENDENTE"');
  expect(exportIndependentReviewQueueCsv(queue)).not.toContain('"CONFIRMADO"');
  expect(JSON.stringify({r,a})).toBe(before);
 });
 it('prioriza resultável, dados locais faltantes, jogos futuros e excluídos',()=>{
  const records=[record('futuro','A'),record('pendente','B'),
   record('resultado','C'),record('tardio','D')];
  const rows=[row('futuro','future'),row('pendente','waiting'),
   row('resultado','scored'),row('tardio','late')];
  const q=buildIndependentReviewQueue(records,report(rows),now);
  expect(q).toMatchObject({checkExternal:1,needLocalResult:1,
   awaitKickoff:1,excluded:1});
  expect(q.entries.map(e=>e.key)).toEqual(['resultado','pendente','futuro','tardio']);
  expect(q.entries.every(e=>e.externalCheck==='PENDENTE')).toBe(true);
  expect(q.entries.find(e=>e.key==='tardio')?.state).toBe('excluded');
 });
 it('aguarda 120 minutos desde o início, inclusive horário UTC na virada de dia',()=>{
  const r={...record('jogo'),matchAt:'2026-10-25T23:30:00'};
  const p=report([row('jogo','waiting')]);
  expect(buildIndependentReviewQueue([r],p,new Date('2026-10-26T03:00:00Z')).entries[0]
   .state).toBe('await_kickoff'); // Brasilia 00:00; only 30 minutes elapsed
  expect(buildIndependentReviewQueue([r],p,new Date('2026-10-26T04:31:00Z')).entries[0]
   .state).toBe('need_local_result');
 });
 it('CSV documentado com métricas ausentes NÃO vira candidato a conferência',()=>{
  const missing=row('n/d','scored');missing.markets[0].actual=null;
  const queue=buildIndependentReviewQueue([record('n/d')],report([missing]),now);
  expect(queue.entries[0].state).toBe('need_local_result');
  expect(queue.entries[0].localResults).toBe('Gols: N/D');
 });
 it('não promove registros Radar sem identificação explícita e bloqueia discrepâncias',()=>{
  const old={...record('legado'),goodPicks:undefined};
  const r=record('selecionado');
  const q=buildIndependentReviewQueue([old,r],report([
   row('legado','legacy'),row('selecionado','waiting')
  ]),now);
  expect(q.entries.map(x=>x.key)).toEqual(['selecionado']);
  expect(()=>buildIndependentReviewQueue([r],report([]),now)).toThrow('divergem');
  expect(()=>buildIndependentReviewQueue([r],report([row('troca','waiting')]),now))
   .toThrow('fora de ordem');
  expect(()=>buildIndependentReviewQueue([old],report([row('legado','scored')]),now))
   .toThrow('legado');
 });
 it('não converte fonte suspeita em link oficial ou de resultado',()=>{
  const bad=record('x');bad.goodPicks!.sourceUrl='https://www.cbf.com.br.evil.invalid/a';
  const rr=row('x','scored');rr.sourceUrl='javascript:alert(1)';
  const q=buildIndependentReviewQueue([bad],report([rr]),now);
  expect(q.entries[0]).toMatchObject({officialUrl:null,csvSourceUrl:null,externalCheck:'PENDENTE'});
 });
 it('protege CSV contra fórmulas, aspas e ponto e vírgula em nomes',()=>{
  const bad={...record('z'),home:'  =HYPERLINK("https://x";"y")',away:'Águia; "V" '};
  const q=buildIndependentReviewQueue([bad],report([row('z','waiting')]),now);
  const csv=exportIndependentReviewQueueCsv(q);
  expect(csv.startsWith('\uFEFF"registro_id";')).toBe(true);
  expect(csv).toContain('"\'  =HYPERLINK(""https://x"";""y"")"');
  expect(csv).toContain('"Águia; ""V"" "');
  expect(csv.split('\r\n').filter(Boolean)).toHaveLength(2);
  expect(csv).toContain('"PENDENTE"');
 });
});

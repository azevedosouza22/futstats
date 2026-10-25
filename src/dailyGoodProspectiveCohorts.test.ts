import {describe,expect,it} from 'vitest';
import {empty,type Data,type Match} from './model';
import type {SavedRadarRecord} from './radarRecords';
import {auditDailyGoodPicks} from './dailyGoodAudit';
import {buildIndependentReviewQueue} from './dailyGoodIndependentReview';
import {buildProspectiveCohortPlan,exportProspectiveCohortCsv} from './dailyGoodProspectiveCohorts';

const before=new Date('2026-10-25T19:00:00Z'); // 16h Brasília
const after=new Date('2026-10-26T16:00:00Z');
const signal={id:'goals-full-2.5',label:'Gols',line:2.5,
 direction:'Under' as const,projection:1.4,historicalMean:2.1,
 historicalSample:10,leagueSample:20,relativeDistance:0.44};
function record(id:string,league='Liga X'):SavedRadarRecord{
 return {key:id,savedAt:'2026-10-25T15:00:00.000Z',
  matchAt:'2026-10-25T20:00:00',competition:league,
  home:'Casa '+id,away:'Fora '+id,homeCount:5,awayCount:5,
  markets:[{id:signal.id,label:signal.label,line:signal.line,
   historyRate:0.3,observed:10,overs:3,historicalMean:2.1}],
  venue:[{marketId:signal.id,label:signal.label,line:signal.line,
   v2:'Under',v3:'Under',projectedTotal:1.4,failedChecks:[]}],
  leagueContext:[{id:signal.id,mean:2.2,observed:20}],
  goodPicks:{sourceUrl:'https://www.cbf.com.br/jogos/fixture',
   verifiedAt:'2026-10-25',signals:[signal]}
 };
}
const noMatches:Data={teams:[],matches:[]};
const make=(records:SavedRadarRecord[],data=noMatches,now=before)=>{
 const audit=auditDailyGoodPicks(data,records,now);
 const queue=buildIndependentReviewQueue(records,audit,now);
 return {audit,queue,plan:buildProspectiveCohortPlan(records,audit,queue)};
};
function outcome():{data:Data,record:SavedRadarRecord}{
 const r=record('1');
 const one={...empty(),goals:2,shots:15,target:5,corners:4};
 const two={...empty(),goals:0,shots:5,target:2,corners:3};
 const match:Match={id:'result-001',date:'2026-10-25',competition:'Liga X',
  home:'home',away:'away',first:[one,two],second:[two,two],
  research:{provider:'work-csv',source:'Flashscore',sourceId:'result-001',
   sourceUrl:'https://www.flashscore.com.br/jogo/?mid=result-001',
   importedAt:'2026-10-26T03:00:00Z',dateDiscrepancy:false,
   full:[{...empty(),goals:2,shots:20,target:7,corners:7},
     {...empty(),goals:0,shots:10,target:4,corners:6}]}
 };
 return {record:r,data:{teams:[{id:'home',name:'Casa 1',color:'#112233'},
  {id:'away',name:'Fora 1',color:'#445566'}],matches:[match]}};
}
describe('Etapa 52 — prontidão realista da amostra por campeonato',()=>{
 it('sem previsões: todas as taxas N/D, sem simular 30 jogos ou verificação',()=>{
  const {plan}=make([]);
  expect(plan).toEqual({leagues:[],totalAttributed:0,totalEligibleLocal:0,
   totalLocalResults:0,totalExternalVerified:0,externalValidation:'PENDENTE'});
  expect(exportProspectiveCohortCsv(plan).split('\r\n').filter(Boolean))
   .toHaveLength(1);
 });
 it('conta somente indicação explícita futura; exclui Radar legado',()=>{
  const p=record('1'),legacy={...record('2'),goodPicks:undefined};
  const input=[p,legacy],snapshot=JSON.stringify(input);
  const {plan}=make(input);
  expect(plan).toMatchObject({totalAttributed:1,totalEligibleLocal:1,
   totalLocalResults:0,totalExternalVerified:0,leagues:[{
    league:'Liga X',attributed:1,eligibleLocal:1,awaitKickoff:1,
    localResults:0,excluded:0,externalPending:0,externalVerified:0,
    missingExternal:30,readyForModelValidation:false
   }]});
  expect(JSON.stringify(input)).toBe(snapshot);
 });
 it('resultado CSV local libera tarefa externa, NUNCA valida fonte nem taxa real',()=>{
  const {record:r,data}=outcome(),snapshot=JSON.stringify({r,data});
  const {plan}=make([r],data,after);
  expect(plan).toMatchObject({totalAttributed:1,totalEligibleLocal:1,
   totalLocalResults:1,totalExternalVerified:0,leagues:[{
    localResults:1,externalPending:1,externalVerified:0,
    missingExternal:30,readyForModelValidation:false
   }]});
  const csv=exportProspectiveCohortCsv(plan);
  expect(csv).toContain('"Liga X";"1";"1";"1"');
  expect(csv).toContain('"30";"30";"N/D";"PENDENTE"');
  expect(csv).not.toContain('CONFIRMADO');
  expect(JSON.stringify({r,data})).toBe(snapshot);
 });
 it('30 partidas locais distintas por liga ainda NÃO são 30 resultados verificados',()=>{
  const records=Array.from({length:30},(_,i)=>record('jogo-'+i));
  const {plan}=make(records);
  expect(plan).toMatchObject({totalAttributed:30,totalEligibleLocal:30,
   totalLocalResults:0,totalExternalVerified:0,
   leagues:[{attributed:30,eligibleLocal:30,awaitKickoff:30,
    externalVerified:0,missingExternal:30,readyForModelValidation:false}]});
  expect(exportProspectiveCohortCsv(plan)).toContain('"N/D";"PENDENTE"');
 });
 it('separa campeonatos e mantém previsões duplicadas ou tardias excluídas',()=>{
  const one=record('1'),duplicate={...record('2'),key:'duplicado',
   home:one.home,away:one.away};
  const late={...record('3','Liga Y'),savedAt:'2026-10-25T23:10:00Z'};
  const actual=[one,duplicate,late,record('4','Liga Y')];
  const {plan}=make(actual);
  expect(plan).toMatchObject({totalAttributed:4,totalEligibleLocal:1,
   leagues:[
    {league:'Liga X',attributed:2,eligibleLocal:0,excluded:2},
    {league:'Liga Y',attributed:2,eligibleLocal:1,excluded:1}
   ]});
  expect(plan.leagues.every(l=>l.externalVerified===0&&
   l.readyForModelValidation===false)).toBe(true);
 });
 it('recusa auditoria fora de ordem, divergente e chaves repetidas',()=>{
  const p=record('1'),q=record('2');
  const {audit,queue}=make([p,q]);
  expect(()=>buildProspectiveCohortPlan([q,p],audit,queue)).toThrow('ordem divergente');
  expect(()=>buildProspectiveCohortPlan([p],audit,queue)).toThrow('divergem');
  expect(()=>buildProspectiveCohortPlan([p,p],audit,queue)).toThrow('identidade');
  expect(()=>buildProspectiveCohortPlan([p,q],audit,{
   ...queue,entries:[queue.entries[0],queue.entries[0]]
  })).toThrow('repetidos');
  expect(()=>buildProspectiveCohortPlan([p,q],audit,{
   ...queue,entries:queue.entries.map((e,i)=>i?{...e,externalCheck:'CONFIRMADO' as any}:e)
  })).toThrow('sem pendência');
 });
 it('CSV impede fórmula em nome de liga e mantém N/D, sem gravar estado',()=>{
  const p=record('1',' =HYPERLINK("https://bad.invalid";"x")');
  const {plan}=make([p]);
  const csv=exportProspectiveCohortCsv(plan);
  expect(csv).toContain('"\' =HYPERLINK(""https://bad.invalid"";""x"")"');
  expect(csv).toContain('"N/D";"PENDENTE"');
 });
});

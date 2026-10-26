import {describe,it,expect} from 'vitest';
import {empty,stats,type Data,type Match,type Stats} from './model';
import {radarMetricIntegrity} from './radarHistoricalIntegrity';
import {matchTotal,radarUpcoming} from './radar';
import {radarPeriodCoverage} from './radarPeriodCoverage';
import {leagueNumericContext} from './radarNumericContext';
import {predictVenueV2,venueV2Markets} from './radarVenueV2';
import {predictVenueV3} from './radarVenueV3';

const comp='Liga teste 2026/27';
const fixture={home:'a',away:'b',date:'2026-10-25',competition:comp};
const st=(shots:number,goals=1):Stats=>({...empty(),shots,goals,
 target:Math.floor(shots/4),corners:2});
const match=(id:string,date:string,home:string,away:string,shots=18):Match=>({
 id,date,home,away,competition:comp,
 first:[st(Math.floor(shots/2)),st(3,0)],
 second:[st(shots-Math.floor(shots/2),0),st(3,0)]
});
function imported(m:Match){
 return {...m,research:{provider:'work-csv' as const,source:'Flashscore' as const,
  sourceId:'history-'+m.id,sourceUrl:'https://www.flashscore.com.br/jogo/?mid=history-'+m.id,
  importedAt:'2026-10-20T10:00:00Z',dateDiscrepancy:false,
  full:[stats(m,0,'first'),stats(m,1,'first')].map((v,i)=>({
   ...v,shots:(m.first[i].shots??0)+(m.second[i].shots??0),
   goals:(m.first[i].goals??0)+(m.second[i].goals??0),
   target:(m.first[i].target??0)+(m.second[i].target??0),
   corners:(m.first[i].corners??0)+(m.second[i].corners??0)
  })) as [Stats,Stats]}};
}
const data=(...matches:Match[]):Data=>({teams:[],matches});
const shotsMarket=venueV2Markets.find(m=>m.id==='shots-full-24.5')!;
describe('Etapa 66 — barreira estrutural em TODOS os cálculos atuais do Radar',()=>{
 it('bloqueia data de origem contraditória mesmo que o jogo seja antigo',()=>{
  const m=imported(match('source-conflict','2026-10-18','a','c'));
  m.research.titleDate='2026-10-19';m.research.dateDiscrepancy=true;
  expect(radarMetricIntegrity(m,'shots')).toBe('date_conflict');
  expect(matchTotal(m,'shots','full')).toBeNull();
  const context=leagueNumericContext(data(m),comp,'2026-10-25');
  expect(context.find(x=>x.id==='shots-full-24.5')).toMatchObject({mean:null,observed:0});
  const r=radarUpcoming(data(m),fixture);
  expect(r.homeHistory).toHaveLength(1); // still visible for source-review trace
  expect(r.markets.find(x=>x.id==='shots-full-24.5')).toMatchObject({observed:0,historicalMean:null});
  expect(r.homeAtHome.shotsFor).toMatchObject({valid:0,mean:null});
  expect(radarPeriodCoverage(data(m),fixture)).toMatchObject({skippedAmbiguous:1,distinct:0});
 });
 it('conflito FT/1T/2T de um lado desativa só a métrica, inclusive para o V2/V3',()=>{
  const m=imported(match('bad-period','2026-10-19','a','c',18));
  m.research.full[0].shots=36; // 18 registered in periods, but FT=36
  expect(radarMetricIntegrity(m,'shots')).toBe('period_conflict');
  expect(radarMetricIntegrity(m,'goals')).toBe('ok');
  expect(matchTotal(m,'shots','full')).toBeNull();
  expect(matchTotal(m,'shots','first')).toBeNull();
  expect(matchTotal(m,'goals','full')).toBe(1);
  const r=radarUpcoming(data(m),fixture);
  expect(r.markets.find(x=>x.id==='shots-full-24.5')).toMatchObject({observed:0,historicalMean:null});
  expect(r.markets.find(x=>x.id==='goals-full-2.5')).toMatchObject({observed:1,historicalMean:1});
  expect(leagueNumericContext(data(m),comp,fixture.date)
   .find(x=>x.id==='shots-full-24.5')).toMatchObject({observed:0,mean:null});
  expect(radarPeriodCoverage(data(m),fixture).rows.find(x=>x.metric==='shots')!.cells.full.conflicts).toBe(1);
 });
 it('dados de lados que cancelariam o erro no total agregado também são recusados',()=>{
  const m=imported(match('cancel','2026-10-19','a','c',18));
  m.research.full[0].shots=(m.research.full[0].shots??0)+2;
  m.research.full[1].shots=(m.research.full[1].shots??0)-2;
  expect(radarMetricIntegrity(m,'shots')).toBe('period_conflict');
  expect(matchTotal(m,'shots','full')).toBeNull();
 });
 it('V2 e V3 reduzem contagem de origem inconsistente sem preencher com jogos antigos',()=>{
  const home=Array.from({length:4},(_,i)=>imported(match('h'+i,'2026-10-0'+(i+1),'a','x'+i,18)));
  const away=Array.from({length:4},(_,i)=>imported(match('v'+i,'2026-10-0'+(i+1),'y'+i,'b',10)));
  const all=[...home,...away];
  const original=predictVenueV2(data(...all),fixture,shotsMarket);
  expect(original).toMatchObject({homeAtHomeValid:4,awayAtAwayValid:4,decision:'Under'});
  home[0].research.dateDiscrepancy=true;home[0].research.titleDate='2026-09-30';
  home[1].research.full[0].shots=50;
  const snapshot=JSON.stringify(all);
  const v2=predictVenueV2(data(...all),fixture,shotsMarket);
  const v3=predictVenueV3(data(...all),fixture,shotsMarket);
  expect(v2).toMatchObject({homeAtHomeValid:2,awayAtAwayValid:4,
   decision:'Sem sinal',projectedTotal:null,reason:'insufficient_venue_history'});
  expect(v3).toMatchObject({homeCount:2,awayCount:4,
   decision:'Sem sinal',reason:'insufficient_venue_history'});
  expect(JSON.stringify(all)).toBe(snapshot); // no mutation of original source
 });
 it('N/D nunca vira zero e zero legítimo continua permitido',()=>{
  const good=imported(match('zero','2026-10-20','a','c',0));
  expect(radarMetricIntegrity(good,'shots')).toBe('ok');
  expect(matchTotal(good,'shots','full')).toBe(6);
  good.research.full[1].shots=null;
  expect(matchTotal(good,'shots','full')).toBeNull();
  expect(matchTotal(good,'shots','first')).toBe(3);
 });
 it('não misturar competição, jogo futuro ou outras fontes em médias gerais',()=>{
  const ok=imported(match('ok','2026-10-15','a','c'));
  const different={...imported(match('other','2026-10-15','a','c')),competition:'Outra liga'};
  const future=imported(match('future','2026-10-26','a','c'));
  const results=radarUpcoming(data(ok,different,future),fixture);
  expect(results.homeHistory.map(x=>x.id)).toEqual(['ok']);
  expect(results.markets.find(x=>x.id==='shots-full-24.5')?.observed).toBe(1);
 });
});

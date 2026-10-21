import {describe,it,expect} from 'vitest';
import {empty,type Match,type Data} from './model';
import {captureVenuePredictions,settleVenuePredictions,scoreSettlements,type SavedFixtureIdentity} from './radarProspective';

const s=(shots:number)=>({...empty(),shots,goals:1,target:Math.floor(shots/4)});
const game=(id:string,date:string,home:string,away:string,hs:number,as:number,discrepancy=false):Match=>({
 id,home,away,date,competition:'Liga',
 first:[s(Math.floor(hs/2)),s(Math.floor(as/2))],
 second:[s(hs-Math.floor(hs/2)),s(as-Math.floor(as/2))],
 research:{provider:'work-csv',source:'Flashscore',sourceId:'forecast-'+id,
  sourceUrl:'https://www.flashscore.com.br/?mid=forecast-'+id,
  importedAt:'2026-10-19T00:00:00Z',
  dateDiscrepancy:discrepancy,...(discrepancy?{titleDate:'2026-10-25'}:{}),
  full:[s(hs),s(as)]}
});
const teams=[
 {id:'a',name:'Equipe Casa',color:'#23573b'},
 {id:'b',name:'Equipe Fora',color:'#23573b'},
];
const history:Match[]=[
 ...Array.from({length:4},(_,i)=>game('home'+i,'2026-10-0'+(i+1),'a','x'+i,20,15)),
 ...Array.from({length:4},(_,i)=>game('away'+i,'2026-10-0'+(i+1),'y'+i,'b',15,20)),
];
const data=(matches:Match[]):Data=>({teams,matches});
const fixture={home:'a',away:'b',date:'2026-10-23',competition:'Liga'};
function saved():SavedFixtureIdentity{
 return {home:'Equipe Casa',away:'Equipe Fora',competition:'Liga',
  matchAt:'2026-10-23T20:00:00',savedAt:'2026-10-22T12:00:00Z',
  venue:captureVenuePredictions(data(history),fixture)};
}
const after={date:'2026-10-24',time:'12:00'};
describe('registro prospectivo V2 e V3',()=>{
 it('congela as decisões antes da partida e aguarda um resultado',()=>{
  const record=saved();
  expect(record.venue).toHaveLength(3);
  expect(record.venue?.find(m=>m.marketId==='shots-full-24.5')?.v2).toBe('Over');
  expect(record.venue?.find(m=>m.marketId==='shots-full-24.5')?.v3).toBe('Over');
  expect(settleVenuePredictions(data(history),record,{date:'2026-10-22',time:'15:00'}).status).toBe('future');
  expect(settleVenuePredictions(data(history),record,after).status).toBe('pending');
 });
 it('avalia o resultado sem recalcular o V2 e V3 ou misturar outros confrontos',()=>{
  const record=saved();
  const result=settleVenuePredictions(data([...history,game('target','2026-10-23','a','b',20,15)]),record,after);
  expect(result.status).toBe('complete');
  expect(result.markets.find(m=>m.marketId==='shots-full-24.5')?.v2).toBe('Acertou');
  expect(result.markets.find(m=>m.marketId==='shots-full-24.5')?.v3).toBe('Acertou');
  const scores=scoreSettlements([result]);
  expect(scores.v2.signals).toBe(scores.alwaysOverV2.signals);
  expect(scores.v3.signals).toBe(scores.alwaysOverV3.signals);
  expect(scores.v3.signals).toBeGreaterThan(0);
 });
 it('não pontua datas conflitantes, partida duplicada ou registro tardio',()=>{
  const record=saved(), played=game('target','2026-10-23','a','b',20,15,true);
  expect(settleVenuePredictions(data([...history,played]),record,after).status).toBe('ambiguous');
  const unique=game('target2','2026-10-23','a','b',20,15);
  expect(settleVenuePredictions(data([...history,unique,played]),record,after).status).toBe('ambiguous');
  expect(settleVenuePredictions(data([...history,unique]),{...record,savedAt:'2026-10-24T01:00:00Z'},after).status).toBe('late');
 });
 it('mantém registros antigos legíveis e sem pontuação inventada',()=>{
  expect(settleVenuePredictions(data(history),{...saved(),venue:undefined},after).status).toBe('legacy');
  expect(scoreSettlements([]).v3.signals).toBe(0);
 });
});

import {describe,it,expect} from 'vitest';
import {empty,type Data,type Match} from './model';
import {predictVenueV2,venueV2Markets} from './radarVenueV2';
import {evaluateVenueV2} from './radarVenueV2Backtest';

const game=(id:string,date:string,home:string,away:string,shots:number):Match=>{
 const data=(s:number)=>({...empty(),goals:s===0?0:1,shots:s,target:Math.floor(s/4),corners:2});
 return {id,date,home,away,competition:'Liga',
  first:[data(Math.floor(shots/2)),data(3)],
  second:[data(shots-Math.floor(shots/2)),data(3)],
  research:{provider:'work-csv',source:'Flashscore',sourceId:'venue-'+id,
   sourceUrl:'https://www.flashscore.com.br/?mid=venue-'+id,
   importedAt:'2026-10-20T00:00:00.000Z',dateDiscrepancy:false,
   full:[data(shots),data(6)]}};
};
const data=(matches:Match[]):Data=>({teams:[],matches});
const market=venueV2Markets.find(m=>m.id==='shots-full-24.5')!;

describe('Radar V2 por mando',()=>{
 it('não usa a partida avaliada nem dados posteriores',()=>{
  const history:Match[]=[
   ...Array.from({length:4},(_,i)=>game('home'+i,'2026-09-0'+(i+1),'a','h'+i,18)),
   ...Array.from({length:4},(_,i)=>game('away'+i,'2026-09-0'+(i+1),'v'+i,'b',10)),
  ];
  const future=game('future','2026-09-12','a','b',300);
  const input=data([...history,future]);
  const prediction=predictVenueV2(input,future,market);
  expect(prediction.homeAtHomeValid).toBe(4);
  expect(prediction.awayAtAwayValid).toBe(4);
  expect(prediction.projectedTotal).toBe(20);
  expect(prediction.decision).toBe('Under');
  const changed={...future,date:'2026-09-18'};
  expect(predictVenueV2(data([...history,changed]),future,market).projectedTotal).toBe(20);
 });
 it('retorna sem sinal quando falta mando, sem inventar 0',()=>{
  const history=Array.from({length:5},(_,i)=>game('home'+i,'2026-09-0'+(i+1),'a','v'+i,20));
  const result=predictVenueV2(data(history),game('target','2026-09-12','a','b',10),market);
  expect(result.decision).toBe('Sem sinal');
  expect(result.projectedTotal).toBeNull();
  expect(result.reason).toBe('insufficient_venue_history');
 });
 it('rejeita dados do próprio dia e de outra liga, e valores N/D',()=>{
  const fixtures:Match[]=[
   ...Array.from({length:3},(_,i)=>game('h'+i,'2026-09-0'+(i+1),'a','h'+i,20)),
   ...Array.from({length:3},(_,i)=>game('b'+i,'2026-09-0'+(i+1),'v'+i,'b',10)),
  ];
  fixtures[0].research!.full[0].shots=null;
  fixtures.push({...game('same','2026-09-12','a','x',20)});
  fixtures.push({...game('cop','2026-09-06','a','x',20),competition:'Copa'});
  const result=predictVenueV2(data(fixtures),game('target','2026-09-12','a','b',10),market);
  expect(result.homeAtHomeValid).toBe(2);
  expect(result.reason).toBe('insufficient_venue_history');
 });
 it('não avalia divergência de data, separa holdout e usa direção base do treino',()=>{
  const matches:Match[]=[];
  for(let i=1;i<=12;i++){
   const date='2026-09-'+String(i).padStart(2,'0');
   matches.push(game('a'+i,date,'a','x'+i,10));
   matches.push(game('b'+i,date,'y'+i,'b',12));
  }
  const inHoldout=game('target','2026-09-13','a','b',20);
  matches.push(inHoldout);
  const report=evaluateVenueV2(data(matches),'Liga');
  expect(report.validationStart).not.toBeNull();
  expect(report.markets).toHaveLength(3);
  const shots=report.markets.find(m=>m.id==='shots-full-24.5')!;
  expect(shots.trainingObserved).toBeGreaterThan(0);
  expect(shots.baseline).toBe('Under');
  expect(shots.constant.signals).toBe(shots.validation.signals);
  expect(shots.validation.signals).toBeGreaterThan(0);
  expect(shots.validation.correct+shots.validation.incorrect).toBe(shots.validation.signals);
  expect(shots.constant.correct+shots.constant.incorrect).toBe(shots.constant.signals);
 });
});

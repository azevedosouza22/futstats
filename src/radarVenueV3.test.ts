import {describe,it,expect} from 'vitest';
import {empty,type Match,type Data} from './model';
import {predictVenueV3} from './radarVenueV3';
import {venueV2Markets} from './radarVenueV2';
import {evaluateVenueV3} from './radarVenueV3Backtest';

const market=venueV2Markets.find(m=>m.id==='shots-full-24.5')!;
const data=(matches:Match[]):Data=>({teams:[],matches});
const game=(id:string,date:string,home:string,away:string,h:number,a:number):Match=>{
 const s=(shots:number)=>({...empty(),goals:1,shots,target:Math.floor(shots/4),corners:2});
 return {id,date,home,away,competition:'Liga',
  first:[s(Math.floor(h/2)),s(Math.floor(a/2))],
  second:[s(h-Math.floor(h/2)),s(a-Math.floor(a/2))],
  research:{provider:'work-csv',source:'Flashscore',sourceId:'v3-'+id,
    sourceUrl:'https://www.flashscore.com.br/?mid=v3-'+id,
    importedAt:'2026-10-20T00:00:00.000Z',dateDiscrepancy:false,
    full:[s(h),s(a)]}};
};
const history=(total:number)=>[
 ...Array.from({length:4},(_,i)=>game('home-'+i,'2026-09-0'+(i+1),'a','x'+i,total-6,6)),
 ...Array.from({length:4},(_,i)=>game('away-'+i,'2026-09-0'+(i+1),'y'+i,'b',6,total-6)),
];
describe('Radar V3 filtro por concordância',()=>{
 it('confirma Over quando os dois históricos concordam com projeção V2',()=>{
  const target=game('target','2026-09-15','a','b',15,15);
  const result=predictVenueV3(data([...history(35),target]),target,market);
  expect(result.decision).toBe('Over');
  expect(result.homeCount).toBe(4);
  expect(result.awayCount).toBe(4);
  expect(result.homeOverRate).toBe(1);
  expect(result.awayOverRate).toBe(1);
 });
 it('recusa divergência entre casa e fora mesmo com projeção V2 de Over',()=>{
  const matches=[
   ...Array.from({length:4},(_,i)=>game('h'+i,'2026-09-0'+(i+1),'a','x'+i,40,6)),
   ...Array.from({length:4},(_,i)=>game('v'+i,'2026-09-0'+(i+1),'y'+i,'b',8,7)),
  ];
  const target=game('target','2026-09-15','a','b',15,15);
  const r=predictVenueV3(data(matches),target,market);
  expect(r.v2Decision).toBe('Over');
  expect(r.decision).toBe('Sem sinal');
  expect(r.reason).toBe('venue_disagreement');
 });
 it('não transforma N/D em zero nem consulta jogos no mesmo dia ou posteriores',()=>{
  const matches=history(35);
  matches[0].research!.full[0].shots=null;
  const target=game('target','2026-09-15','a','b',15,15);
  const r=predictVenueV3(data([...matches,target,game('later','2026-09-16','a','b',200,200)]),target,market);
  expect(r.homeCount).toBe(3);
  expect(r.awayCount).toBe(4);
  expect(r.decision).toBe('Over');
  const same=game('same','2026-09-15','a','another',0,0);
  expect(predictVenueV3(data([...matches,target,same]),target,market).homeCount).toBe(3);
 });
 it('compara V3, V2 e baseline em exatos mesmos jogos posteriores',()=>{
  const matches:Match[]=[];
  for(let i=1;i<=15;i++){
   const day='2026-09-'+String(i).padStart(2,'0');
   matches.push(game('a'+i,day,'a','x'+i,24,8));
   matches.push(game('b'+i,day,'y'+i,'b',8,24));
   matches.push(game('z'+i,day,i===15?'a':'c'+i,i===15?'b':'d'+i,14,10));
  }
  const report=evaluateVenueV3(data(matches),'Liga');
  const shots=report.markets.find(m=>m.id==='shots-full-24.5')!;
  expect(report.validationStart).toBe('2026-09-11');
  expect(shots.baseline).toBe('Over');
  expect(shots.v3.signals).toBeGreaterThan(0);
  expect(shots.v3.signals).toBe(shots.v2.signals);
  expect(shots.v3.signals).toBe(shots.constant.signals);
  expect(shots.v3.correct+shots.v3.incorrect).toBe(shots.v3.signals);
 });
});

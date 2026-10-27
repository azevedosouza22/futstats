import {describe,expect,it} from 'vitest';
import type {Data,Match,Stats} from './model';
import type {ScheduledFixture} from './calendar';
import type {DailyGoodSignal} from './dailyGoodSignals';
import {reviewDailyGoodFourLenses} from './dailyGoodFourLensReview';

const competition='Liga fictícia 2026/27';
const previous='Liga fictícia 2025/26';
const signal:DailyGoodSignal={
 id:'shots-full-24.5',label:'Finalizações',line:24.5,
 direction:'Over',projection:32,historicalMean:30,
 historicalSample:10,leagueSample:25,relativeDistance:0.3
};
const s=(shots:number):Stats=>({
 goals:0,shots,target:0,corners:0,yellow:0,red:0
});
const match=(id:string,date:string,league:string,home:string,away:string,total:number):Match=>({
 id,date,home,away,competition:league,
 first:[s(Math.floor(total/2)),s(total-Math.floor(total/2))],
 second:[s(0),s(0)]
});
const members=[
 {id:'h',name:'Hoffenheim',color:'#aaa'},
 {id:'a',name:'Schalke',color:'#aaa'},
 ...Array.from({length:22},(_,i)=>({id:'o'+i,name:'Oponente '+i,color:'#aaa'}))
];
const fixture:ScheduledFixture={
 id:'official-test',home:'Hoffenheim',away:'Schalke',date:'2026-11-08',
 time:'18:00',competition,sourceUrl:'https://www.bundesliga.com/en/bundesliga/matchday'
};
function histories(count=10,total=32):Match[]{
 const rows:Match[]=[];
 for(let i=0;i<count;i++){
  const dd=String(i+1).padStart(2,'0');
  rows.push(match('h'+i,'2026-10-'+dd,competition,'h','o'+i,total));
  rows.push(match('a'+i,'2026-10-'+dd,competition,'o'+(i+10),'a',total));
 }
 return rows;
}
const data=(matches:Match[]):Data=>({teams:members,matches});
describe('Etapa 79 — As Boas exibe quatro contextos sem alterar V2/V3',()=>{
 it('mostra concordância com frequências de 5/10 e preserva tudo',()=>{
  const d=data(histories()),before=JSON.stringify(d);
  const r=reviewDailyGoodFourLenses(d,fixture,signal);
  expect(r.status).toBe('aligned');
  expect(r.rows).toHaveLength(4);
  expect(r.rows[0]).toMatchObject({
   count:5,over:5,overRate:1,lastTenCount:10,lastTenOverRate:1,mean:32
  });
  expect(r.rows[2]).toMatchObject({count:5,over:5,lastTenCount:10});
  expect(r.rows[1].count).toBe(0);
  expect(r.rows[3].count).toBe(0);
  expect(r.overlapping).toBe(true);
  expect(JSON.stringify(d)).toBe(before);
 });
 it('indica divergência quando sinal V2/V3 é Under e históricos são Over',()=>{
  const r=reviewDailyGoodFourLenses(data(histories()),fixture,{
   ...signal,direction:'Under',projection:17
  });
  expect(r.status).toBe('divergent');
  expect(r.note).toMatch(/direção contrária/);
  expect(r.direction).toBe('Under');
 });
 it('não confirma com apenas quatro jogos por mando',()=>{
  const r=reviewDailyGoodFourLenses(data(histories(4)),fixture,signal);
  expect(r.status).toBe('insufficient');
  expect(r.rows[0].count).toBe(4);
  expect(r.rows[2].count).toBe(4);
 });
 it('confrontos diretos usam os mesmos jogos, não quatro votos',()=>{
  const m=[
   ...histories(),match('d1','2025-09-07',previous,'h','a',36),
   match('d2','2025-09-08',previous,'h','a',34),
   match('d3','2025-09-09',previous,'h','a',31)
  ];
  const r=reviewDailyGoodFourLenses(data(m),fixture,signal);
  expect(r.rows[1].lastTenCount).toBe(3);
  expect(r.rows[3].lastTenCount).toBe(3);
  expect(r.rows[1].overRate).toBe(1);
  expect(r.rows[3].overRate).toBe(1);
  expect(r.overlapping).toBe(true);
 });
 it('não permite dados da data do jogo ou futuros alterarem a revisão',()=>{
  const d=data([
   ...histories(),
   match('today','2026-11-08',competition,'h','a',2),
   match('future','2026-11-15',competition,'h','a',2)
  ]);
  const r=reviewDailyGoodFourLenses(d,fixture,signal);
  expect(r.status).toBe('aligned');
  expect(r.rows[1].count).toBe(0);
 });
 it('desconhecido e outra liga não criam palpites ou médias inventadas',()=>{
  const d=data(histories());
  expect(reviewDailyGoodFourLenses(d,{...fixture,away:'Desconhecido'},signal)).toMatchObject({
   status:'unavailable',rows:[]
  });
  expect(reviewDailyGoodFourLenses(d,fixture,{...signal,id:'corners-full-24.5'})).toMatchObject({
   status:'insufficient',metric:'corners'
  });
  expect(reviewDailyGoodFourLenses(d,fixture,{...signal,id:'shots-first-24.5'})).toMatchObject({
   status:'unavailable',rows:[]
  });
 });
});

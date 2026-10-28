import {describe,it,expect} from 'vitest';
import {homeHistoricalMarkets,homeLeagueCount} from './homeDashboardModel';
import type {Data,Match,Stats} from './model';
const st=(goals:number,shots:number,target:number,corners:number):Stats=>({
 goals,shots,target,corners,yellow:0,red:0
});
const game=(id:string,a:Stats,b:Stats,conflict=false):Match=>({
 id,date:'2026-10-10',competition:'Bundesliga 2026/27',
 home:'home',away:'away',first:[a,b],second:[st(0,0,0,0),st(0,0,0,0)],
 research:conflict?{
  provider:'work-csv',source:'Flashscore',sourceId:id,
  sourceUrl:'https://www.flashscore.com.br/jogo/?mid='+id,
  importedAt:'2026-10-27T00:00:00Z',titleDate:'2026-10-11',
  dateDiscrepancy:true,full:[a,b]
 }:undefined
});
const data:Data={teams:[
 {id:'home',name:'Mandante',color:'#111111'},
 {id:'away',name:'Visitante',color:'#222222'}
],matches:[
 game('one',st(2,18,6,5),st(1,12,4,6)),
 game('two',st(0,5,1,1),st(1,8,2,1)),
 game('conflict',st(7,40,20,13),st(7,40,20,13),true)
]};
describe('Home dashboard — resumo histórico honesto e somente leitura',()=>{
 it('separa linhas por indicador, com denominador explícito e sem previsão',()=>{
  const before=JSON.stringify(data);
  const rows=homeHistoricalMarkets(data);
  expect(rows.map(r=>({metric:r.metric,observed:r.observed,over:r.over,percent:r.percent}))).toEqual([
   {metric:'goals',observed:2,over:1,percent:50},
   {metric:'shots',observed:2,over:1,percent:50},
   {metric:'target',observed:2,over:1,percent:50},
   {metric:'corners',observed:2,over:1,percent:50}
  ]);
  expect(JSON.stringify(data)).toBe(before);
  expect(Object.keys(rows[0])).not.toContain('winProbability');
 });
 it('indica N/D sem jogos, sem falsa frequência de 0%',()=>{
  const empty:Data={teams:[],matches:[]};
  expect(homeHistoricalMarkets(empty).every(x=>x.observed===0&&x.percent===null)).toBe(true);
  expect(homeLeagueCount(empty)).toBe(0);
  expect(homeLeagueCount(data)).toBe(1);
 });
 it('não conta métrica com N/D no denominador',()=>{
  const extra:Data={...data,matches:[...data.matches,
   game('missing',st(1,4,1,1),{...st(1,4,1,1),corners:null})]};
  const rows=homeHistoricalMarkets(extra);
  expect(rows.find(x=>x.metric==='corners')?.observed).toBe(2);
  expect(rows.find(x=>x.metric==='goals')?.observed).toBe(3);
 });
});

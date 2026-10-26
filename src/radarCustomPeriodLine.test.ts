import {describe,expect,it} from 'vitest';
import type {Data,Match,Stats} from './model';
import {compareCustomPeriodLine} from './radarCustomPeriodLine';
const league='Bundesliga 2026/27';
const fixture={home:'A',away:'B',date:'2026-10-25',competition:league};
const st=(goals:number|null,shots:number|null=8,target:number|null=3,
 corners:number|null=5):Stats=>({goals,shots,target,corners,yellow:0,red:0});
const zero=():Stats=>st(0,0,0,0);
const make=(id:string,day:string,g:number,home='A',away='Z'):Match=>({
 id,date:day,home,away,competition:league,
 first:[st(g),zero()],second:[zero(),zero()]
});
const data=(...matches:Match[]):Data=>({teams:[],matches});
describe('Etapa 63 — linha personalizada com empate, N/D e preservação',()=>{
 it('com 10 jogos, linha inteira separa empate de Over e Under',()=>{
  const matches=Array.from({length:10},(_,i)=>
   make('m'+i,'2026-10-'+String(10+i),i<6?1:2,
    i<5?'A':'Z',i<5?'Z':'B'));
  const d=data(...matches),before=JSON.stringify(d);
  const result=compareCustomPeriodLine(d,fixture,'goals','full',1);
  expect(result).toMatchObject({
   sample:10,distinct:10,missing:0,conflicts:0,over:4,under:0,push:6,
   overShare:0.4,underShare:0,pushShare:0.6,sampleAdequate:true,
   isHistoricalOnly:true
  });
  const half=compareCustomPeriodLine(d,fixture,'goals','full',1.5);
  expect(half).toMatchObject({over:4,under:6,push:0,
   overShare:0.4,underShare:0.6,pushShare:0});
  expect(JSON.stringify(d)).toBe(before);
 });
 it('menos de cinco históricos retorna taxas N/D mesmo com zero válido',()=>{
  const r=compareCustomPeriodLine(data(make('m1','2026-10-13',0)),
   fixture,'goals','first',0);
  expect(r).toMatchObject({
   sample:1,over:0,under:0,push:1,
   overShare:null,underShare:null,pushShare:null,
   sampleAdequate:false
  });
 });
 it('sem histórico, nenhuma taxa se torna zero e sem dividir por zero',()=>{
  const r=compareCustomPeriodLine(data(),fixture,'shots','second',11.5);
  expect(r).toMatchObject({sample:0,over:0,under:0,push:0,
   overShare:null,underShare:null,pushShare:null,missing:0});
 });
 it('não mistura temporadas, jogo atual/futuro ou duplica jogo entre os clubes',()=>{
  const shared=make('same','2026-10-13',1,'A','B');
  const past=make('past','2026-10-14',2);
  const another={...make('old','2026-10-12',30),competition:'Bundesliga 2025/26'};
  const now=make('current','2026-10-25',30,'A','B');
  const r=compareCustomPeriodLine(data(shared,past,another,now),fixture,
   'goals','full',1);
  expect(r).toMatchObject({distinct:2,sample:2,over:1,push:1,under:0});
 });
 it('pula campos N/D e conflito FT / 1T / 2T, não inventa um tempo',()=>{
  const missing=make('missing','2026-10-14',1);
  missing.research={provider:'work-csv',source:'Flashscore',sourceId:'source-21',
   sourceUrl:'https://www.flashscore.com.br/jogo/?mid=source-21',
   importedAt:'2026-10-24T10:00:00Z',dateDiscrepancy:false,
   full:[st(1,8,3,5),zero()]};
  missing.first[0].corners=null;
  const conflict=make('conflict','2026-10-15',1);
  conflict.research={provider:'work-csv',source:'Flashscore',sourceId:'source-22',
   sourceUrl:'https://www.flashscore.com.br/jogo/?mid=source-22',
   importedAt:'2026-10-24T10:00:00Z',dateDiscrepancy:false,
   full:[st(2,8,3,5),zero()]};
  const d=data(missing,conflict);
  const goals=compareCustomPeriodLine(d,fixture,'goals','full',1);
  expect(goals).toMatchObject({distinct:2,sample:1,conflicts:1,missing:0});
  const corners=compareCustomPeriodLine(d,fixture,'corners','first',4.5);
  expect(corners).toMatchObject({distinct:2,sample:1,missing:1,conflicts:0,
   over:1,under:0,push:0,overShare:null});
 });
 it('bloqueia decimal fora dos passos, linhas negativas e valores inválidos',()=>{
  for(const line of [-0.5,0.25,1.1,501,Infinity,NaN])
   expect(()=>compareCustomPeriodLine(data(),fixture,'goals','full',line))
    .toThrow('Linha inválida');
  for(const line of [0,0.5,1,7.5,500])
   expect(()=>compareCustomPeriodLine(data(),fixture,'goals','full',line))
    .not.toThrow();
 });
});

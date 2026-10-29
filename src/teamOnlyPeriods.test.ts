import {describe,it,expect} from 'vitest';
import type {Data,Match,Stats} from './model';
import {analyzeTeamOnlyPeriods} from './teamOnlyPeriods';
import {individualWindowAvailability} from './TeamOnlyCards';
import {calculateSmartLeagueComparison,BOTH_SEASONS} from './leagueSmartComparison';

const comp='Liga fictícia 2026/27',prior='Liga fictícia 2025/26';
const fixture={home:'H',away:'S',date:'2026-11-08',competition:comp};
const stat=(shots:number):Stats=>({
  goals:0,shots,target:Math.min(2,shots),corners:2,yellow:0,red:0
});
const match=(id:string,date:string,competition:string,
 home:string,away:string,h1:number,h2:number,a1:number,a2:number):Match=>({
  id,date,competition,home,away,
  first:[stat(h1),stat(a1)],second:[stat(h2),stat(a2)]
});
const base:Match[]=[
  match('h1','2026-10-01',comp,'H','X',8,10,3,3),
  match('direct1','2026-10-02',comp,'H','S',5,7,4,6),
  match('away1','2026-10-03',comp,'Y','S',2,3,7,8),
  match('away2','2026-10-04',comp,'Z','S',1,4,4,5),
  match('direct2','2026-10-05',comp,'H','S',10,8,7,4),
];
const teams=['H','S','X','Y','Z'].map(id=>({id,name:id,color:'#999'}));
const data=(matches:Match[]):Data=>({teams,matches});
const row=(r:ReturnType<typeof analyzeTeamOnlyPeriods>,id:string,period:string)=>
 r.lenses.find(l=>l.id===id)!.periods.find(p=>p.period===period)!;

describe('Etapa 83 — médias do próprio time com 1T, 2T e jogo completo',()=>{
 it('não oferece 10 jogos quando a base só possui 3 ou 4 registros por mando',()=>{
  const report=analyzeTeamOnlyPeriods(data(base),fixture,'shots');
  const coverage=individualWindowAvailability(report);
  expect(coverage).toMatchObject({
   homeCount:3,awayCount:4,hasExtendedSample:false
  });
  // O seletor deve manter a janela de 5; a média 10 seria a mesma por falta de jogos.
  const home=report.lenses[0].periods.find(p=>p.period==='full')!;
  expect(home.last5).toEqual(home.last10);
 });
 it('libera 10 jogos quando ao menos um clube possui mais de cinco jogos válidos',()=>{
  const series=Array.from({length:7},(_,i)=>match('new'+i,
   '2026-10-'+String(i+12).padStart(2,'0'),comp,'H','X',i+1,i+2,1,2));
  const coverage=individualWindowAvailability(analyzeTeamOnlyPeriods(data(series),fixture,'shots'));
  expect(coverage).toMatchObject({homeCount:7,awayCount:0,hasExtendedSample:true});
 });

 it('não soma ao adversário; respeita casa e fora em todos os períodos',()=>{
  const source=data(base),frozen=JSON.stringify(source);
  const report=analyzeTeamOnlyPeriods(source,fixture,'shots');
  expect(row(report,'home-any','first').last10).toMatchObject({count:3,mean:23/3});
  expect(row(report,'home-any','second').last10).toMatchObject({count:3,mean:25/3});
  expect(row(report,'home-any','full').last10).toMatchObject({count:3,mean:16});
  expect(row(report,'away-any','full').last10).toMatchObject({count:4,mean:11.25});
  expect(row(report,'away-any','first').last10.mean).toBeCloseTo(5.5,6);
  expect(row(report,'away-any','second').last10.mean).toBeCloseTo(5.75,6);
  expect(JSON.stringify(source)).toBe(frozen);
 });
 it('separa os confrontos diretos por equipe sem criar partidas extras',()=>{
  const report=analyzeTeamOnlyPeriods(data(base),fixture,'shots');
  expect(row(report,'home-direct','full').last10).toMatchObject({count:2,mean:15});
  expect(row(report,'away-direct','full').last10).toMatchObject({count:2,mean:10.5});
  expect(row(report,'home-any','full').last10.count).toBe(3);
  expect(row(report,'away-any','full').last10.count).toBe(4);
 });
 it('não usa a partida alvo, dados futuros, conflitos de data, partidas duplicadas ou outra liga',()=>{
  const unknown:Match=match('date-conflict','2026-10-06',comp,'H','W',15,20,3,7);
  unknown.research={provider:'work-csv',source:'Flashscore',
   sourceId:'wrong-date',sourceUrl:'https://www.flashscore.com.br/jogo/?mid=wrong-date',
   importedAt:'2026-10-07T12:00:00Z',
   full:[stat(35),stat(10)],titleDate:'2026-10-07',dateDiscrepancy:true};
  const source=data([
   ...base,
   match('today','2026-11-08',comp,'H','S',40,50,3,4),
   match('future','2026-11-09',comp,'H','S',40,50,3,4),
   match('other','2026-10-07','Outra Liga 2026/27','H','S',55,55,3,3),
   unknown,
   match('duplicate','2026-10-01',comp,'H','X',8,10,3,3)
  ]);
  // The caller always scopes by league; here test the actual integration path.
  const r=calculateSmartLeagueComparison(source,{
   league:'Liga fictícia',season:BOTH_SEASONS,home:'H',away:'S',
   date:'2026-11-08',metric:'shots',period:'full',line:20.5
  });
  expect(r.teamOnly).not.toBeNull();
  expect(row(r.teamOnly!,'home-any','full').last10).toMatchObject({count:2,mean:15});
  expect(row(r.teamOnly!,'away-any','full').last10.count).toBe(4);
  expect(row(r.teamOnly!,'home-direct','full').last10.count).toBe(2);
 });
 it('respeita 5/10 jogos e variações da amostra conforme período',()=>{
  const rows=Array.from({length:12},(_,i)=>
   match('many'+i,'2026-10-'+String(i+1).padStart(2,'0'),comp,
    'H','X',i+1,i+2,1,2));
  const report=analyzeTeamOnlyPeriods(data(rows),fixture,'shots');
  expect(row(report,'home-any','first').last5.count).toBe(5);
  expect(row(report,'home-any','first').last10.count).toBe(10);
  expect(row(report,'home-any','full').last5.mean).toBeCloseTo(
   ((12+13)+(11+12)+(10+11)+(9+10)+(8+9))/5,6);
  const m=match('partial','2026-10-25',prior,'H','S',4,7,3,3);
  m.first[0].shots=null;
  const partial=analyzeTeamOnlyPeriods(data([m]),fixture,'shots');
  expect(row(partial,'home-any','first').last10).toMatchObject({count:0,mean:null});
  expect(row(partial,'away-any','first').last10).toMatchObject({count:1,mean:3});
 });
 it('confrontos diretos consultam os dois mandos, recuperam temporada arquivada e contam cada jogo uma vez',()=>{
  const archived='Liga fictícia 2024/25';
  const extended:Data={teams:[
    ...teams,{id:'H-old',name:'H',color:'#999'},{id:'S-old',name:'S',color:'#999'}
   ],matches:[
    match('same','2026-10-01',comp,'H','S',5,7,4,6),
    match('reverse','2026-10-02',comp,'S','H',8,9,3,4),
    match('old-reverse','2025-10-03',prior,'S-old','H-old',4,3,6,5),
    match('archive','2024-10-04',archived,'H-old','S-old',9,8,2,3),
    match('future-reverse','2026-11-09',comp,'S','H',90,90,90,90)
   ]};
  const before=JSON.stringify(extended);
  const params={league:'Liga fictícia',season:BOTH_SEASONS,home:'H',away:'S',
    date:'2026-11-08',metric:'shots' as const,period:'full' as const,line:20.5};
  const all=calculateSmartLeagueComparison(extended,params);
  expect(all.matchCount).toBe(4);
  expect(all.report?.directMatchCount).toBe(4);
  expect(all.teamOnly?.directMatchCount).toBe(4);
  expect(row(all.teamOnly!,'home-direct','full').last10).toMatchObject({count:4,mean:11.75});
  expect(row(all.teamOnly!,'away-direct','full').last10).toMatchObject({count:4,mean:9.75});
  const home=all.report!.lenses.find(x=>x.id==='home-direct')!;
  const away=all.report!.lenses.find(x=>x.id==='away-direct')!;
  expect(home.matchIds).toEqual(away.matchIds);
  expect(home.matchIds).toContain('reverse');
  expect(home.matchIds).toContain('archive');
  const current=calculateSmartLeagueComparison(extended,{...params,directVenue:'current'});
  expect(current.report?.directMatchCount).toBe(2);
  expect(current.teamOnly?.directMatchCount).toBe(2);
  expect(row(current.teamOnly!,'home-direct','full').last10).toMatchObject({count:2,mean:14.5});
  expect(row(current.teamOnly!,'away-direct','full').last10).toMatchObject({count:2,mean:7.5});
  expect(current.report!.lenses.find(x=>x.id==='home-direct')?.matchIds).toEqual(['same','archive']);
  const onlyOld=calculateSmartLeagueComparison(extended,{...params,season:archived.split(' ').at(-1)!});
  expect(onlyOld.report?.directMatchCount).toBe(1);
  expect(JSON.stringify(extended)).toBe(before);
 });
 it('reconhece Grêmio FBPA e Grêmio por alias explícito, sem misturar outros campeonatos',()=>{
  const brasil='Brasileirão Série A 2026';
  const matchSet:Data={teams:[
    {id:'g1',name:'Grêmio FBPA',color:'#999'},
    {id:'g2',name:'Grêmio',color:'#999'},
    {id:'f',name:'Flamengo',color:'#999'},
    {id:'x',name:'Flamengo',color:'#999'}
   ],matches:[
    match('a','2026-08-01',brasil,'g1','f',3,4,2,3),
    match('b','2026-09-01',brasil,'x','g2',1,2,5,6),
    match('c','2026-09-02','Outra Liga 2026','g1','f',20,20,20,20)
   ]};
  const r=calculateSmartLeagueComparison(matchSet,{
    league:'Brasileirão Série A',season:BOTH_SEASONS,home:'g1',away:'f',
    date:'2026-10-30',metric:'shots',period:'full',line:10.5
   });
  expect(r.report?.directMatchCount).toBe(2);
  expect(r.teamOnly?.directMatchCount).toBe(2);
  expect(r.matchCount).toBe(2);
 }); 
 it('retorna média individual para outros indicadores, inclusive escanteios',()=>{
  const report=analyzeTeamOnlyPeriods(data(base),fixture,'corners');
  expect(row(report,'home-any','full').last10).toMatchObject({count:3,mean:4});
  expect(row(report,'away-any','first').last10).toMatchObject({count:4,mean:2});
 });
});

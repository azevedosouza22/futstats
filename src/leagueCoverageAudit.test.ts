import {describe,it,expect} from 'vitest';
import type {Data,Match,Stats} from './model';
import type {WorkAnalysisMatch} from './workAnalysis';
import type {MetricPairs} from './europeWorkResearch';
import {auditMainLeagueCoverage,auditWorkLeagueCoverage} from './leagueCoverageAudit';

const value=(corners:number|null):Stats=>({
 goals:1,shots:12,target:4,corners,yellow:0,red:0
});
const team=(id:string,name:string)=>({id,name,color:'#334455'});
const match=(id:string,date:string,competition:string,corners:number|null):Match=>({
 id,date,competition,home:'a',away:'b',
 first:[value(corners),value(corners)],
 second:[value(corners),value(corners)]
});
const mainLeague='Brasileirão Série A';
const mainData:Data={
 teams:[team('a','Mandante A'),team('b','Visitante B')],
 matches:[
  match('1','2026-10-20',mainLeague,3),
  // Second half corners N/D on both teams; full cannot be inferred.
  {...match('2','2026-10-21',mainLeague,2),
    second:[value(null),value(null)]},
  // A complete sourced full-game pair without complete half breakdown.
  {...match('3','2026-10-22',mainLeague,null),
    research:{
      provider:'work-csv',source:'Flashscore',sourceId:'source3',
      sourceUrl:'https://www.flashscore.com.br/?mid=source3',
      importedAt:'2026-10-23T00:00:00Z',
      dateDiscrepancy:false,
      full:[value(4),value(4)]
    }},
  {...match('4','2026-10-22',mainLeague,10),
    research:{
      provider:'work-csv',source:'Flashscore',sourceId:'source4',
      sourceUrl:'https://www.flashscore.com.br/?mid=source4',
      importedAt:'2026-10-23T00:00:00Z',
      titleDate:'2026-10-23',dateDiscrepancy:true,full:[value(10),value(10)]
    }},
  {...match('5','2026-10-23',mainLeague,null),
    external:{provider:'thesportsdb',id:'5',importedAt:'2026-10-23T00:00:00Z',
      status:'Not Started',full:[value(null),value(null)]}},
  match('6','2026-10-25',mainLeague,20),
  match('1','2026-10-24',mainLeague,99), // duplicate ID
  match('7','2026-10-20','Bundesliga 2026/27',2),
 ]
};
const workLeague='La Liga espanhola 2026/27';
const pairs:MetricPairs={
 goals:[1,0],shots:[10,12],target:[3,5],corners:[4,6]
};
const workGame=(id:string,date:string,discrepancies:string[]=[],sourceId=id):WorkAnalysisMatch=>({
 id:'work|'+id,date,league:'la-liga',home:'FC Barcelona',away:'Real Madrid CF',
 sourceId,sourceUrl:'https://www.flashscore.com.br/?mid='+sourceId,
 full:pairs,first:pairs,second:pairs,discrepancies
});

describe('diagnóstico de lacunas por campeonato — bases isoladas',()=>{
 it('contabiliza jogo completo, 1T e 2T separadamente, com N/D e nomes legíveis',()=>{
  const snapshot=JSON.stringify(mainData);
  const rows=auditMainLeagueCoverage(mainData,'2026-10-25');
  const br=rows.find(x=>x.competition===mainLeague)!;
  expect(br).toMatchObject({
    source:'main',eligible:3,review:2,duplicates:1,
    completeFull:2,completeAll:1
  });
  expect(br.counts.corners).toEqual({full:2,first:2,second:1});
  expect(br.counts.shots).toEqual({full:3,first:3,second:3});
  expect(br.cornerGaps).toHaveLength(1);
  expect(br.cornerGaps[0]).toMatchObject({
    id:'2',date:'2026-10-21',label:'Mandante A × Visitante B'
  });
  expect(rows.find(x=>x.competition==='Bundesliga 2026/27')?.eligible).toBe(1);
  expect(JSON.stringify(mainData)).toBe(snapshot);
 });
 it('não conta partidas na data de hoje ou após, nem campeonatos vazios',()=>{
  expect(auditMainLeagueCoverage({teams:mainData.teams,matches:[
    match('future','2026-10-25',mainLeague,8)
  ]},'2026-10-25')).toEqual([]);
 });
 it('contabiliza Work só na temporada correta, sem fundir duplicatas de fonte',()=>{
  const entries=[
    workGame('1','2026-10-20'),
    workGame('dupe','2026-10-21',[],'1'),
    workGame('2','2026-10-21'),
    workGame('review','2026-10-22',['Divergência sem revisão']),
    workGame('future','2026-10-25'),
    {...workGame('other','2026-10-20'),league:'serie-a' as const},
  ];
  const initial=JSON.stringify(entries);
  const rows=auditWorkLeagueCoverage(entries,'2026-10-25');
  const es=rows.find(x=>x.competition===workLeague)!;
  expect(es).toMatchObject({
    source:'work',eligible:2,review:1,duplicates:1,
    completeFull:2,completeAll:2,cornerGaps:[]
  });
  expect(es.counts.corners).toEqual({full:2,first:2,second:2});
  const it=rows.find(x=>x.competition==='Serie A italiana 2026/27')!;
  expect(it.eligible).toBe(1);
  expect(JSON.stringify(entries)).toBe(initial);
 });
 it('ignora pares ausentes em vez de transformá-los em zero',()=>{
  const incomplete={...workGame('missing','2026-10-19'),
    full:{...pairs,corners:[null,6] as unknown as [number,number]}};
  const row=auditWorkLeagueCoverage([incomplete],'2026-10-25')[0];
  expect(row.eligible).toBe(1);
  expect(row.counts.corners.full).toBe(0);
  expect(row.counts.shots.full).toBe(1);
  expect(row.cornerGaps[0]?.id).toBe('missing');
 });
 it('não retorna ligas Work sem registros locais',()=>{
  expect(auditWorkLeagueCoverage([],'2026-10-25')).toEqual([]);
 });
});

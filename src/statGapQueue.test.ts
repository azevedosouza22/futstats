import {describe,it,expect} from 'vitest';
import type {Data,Match,Stats} from './model';
import type {WorkAnalysisMatch} from './workAnalysis';
import type {MetricPairs} from './europeWorkResearch';
import {prioritizeMainGaps,prioritizeWorkGaps} from './statGapQueue';

const stat=(corners:number|null,shots:number|null=12):Stats=>({
 goals:1,shots,target:shots===null?null:4,corners,yellow:0,red:0
});
const main=(id:string,date:string,first:number|null,second:number|null):Match=>({
 id,date,home:'home',away:'away',competition:'Brasileirão Série A',
 first:[stat(first),stat(first)],second:[stat(second),stat(second)]
});
const base:Data={
 teams:[{id:'home',name:'Clube da Casa',color:'#345678'},
        {id:'away',name:'Visitante',color:'#456789'}],
 matches:[
  main('finished','2026-10-21',2,3),
  main('needs-ft','2026-10-20',2,null),
  main('needs-first','2026-10-18',null,4),
  {...main('needs-period','2026-10-19',null,null),research:{
    provider:'work-csv',source:'Flashscore',sourceId:'source-v',
    sourceUrl:'https://www.flashscore.com.br/?mid=source-v',
    importedAt:'2026-10-20T15:00:00Z',dateDiscrepancy:false,
    full:[stat(7),stat(5)]
  }},
  {...main('only-shots','2026-10-17',3,5),
    second:[stat(5,null),stat(5,null)]},
  {...main('review-source','2026-10-16',null,null),research:{
    provider:'work-csv',source:'Flashscore',sourceId:'review-v',
    sourceUrl:'https://untrusted.example.net/steal',
    importedAt:'2026-10-17T15:00:00Z',
    titleDate:'2026-10-17',dateDiscrepancy:true,full:[stat(10),stat(10)]
  }},
  {...main('not-ended','2026-10-15',null,null),external:{
    provider:'thesportsdb',id:'123',importedAt:'2026-10-16T15:00:00Z',
    status:'Not Started',full:[stat(null),stat(null)]
  }},
  main('future','2026-10-25',null,null),
  main('needs-ft','2026-10-22',null,null)
 ]
};
const full:MetricPairs={goals:[1,1],shots:[14,9],target:[4,3],corners:[5,6]};
const work=(id:string,date:string,sourceId=id,discrepancies:string[]=[]):WorkAnalysisMatch=>({
 id:'work|'+id,date,sourceId,league:'la-liga',
 home:'FC Barcelona',away:'Real Madrid CF',
 sourceUrl:'https://www.flashscore.com.br/?mid='+sourceId,
 full,first:full,second:full,discrepancies
});

describe('Fila priorizada de dados incompletos, sem modificar registros',()=>{
 it('prioriza escanteios completos, depois tempos, depois revisão e outros',()=>{
  const before=JSON.stringify(base);
  const tasks=prioritizeMainGaps(base,'2026-10-25');
  expect(tasks.map(x=>x.priority)).toEqual([
    'corners-full','corners-full','corners-period',
    'source-review','source-review','other'
  ]);
  expect(tasks.map(x=>x.matchId)).toEqual([
    'needs-ft','needs-first','needs-period',
    'review-source','not-ended','only-shots'
  ]);
  expect(JSON.stringify(base)).toBe(before);
 });
 it('mostra campos faltantes sem confundir mandante, visitante e período',()=>{
  const task=prioritizeMainGaps(base,'2026-10-25').find(x=>x.matchId==='needs-ft')!;
  expect(task.label).toBe('Clube da Casa × Visitante');
  expect(task.missing).toContainEqual({metric:'corners',period:'full',side:'home'});
  expect(task.missing).toContainEqual({metric:'corners',period:'full',side:'away'});
  expect(task.missing).toContainEqual({metric:'corners',period:'second',side:'home'});
  expect(task.missing).not.toContainEqual({metric:'corners',period:'first',side:'home'});
  expect(task.sourceUrl).toBeNull();
 });
 it('não inventa falha no total completo se a fonte registrou o total, mas faltam tempos',()=>{
  const t=prioritizeMainGaps(base,'2026-10-25').find(x=>x.matchId==='needs-period')!;
  expect(t.priority).toBe('corners-period');
  expect(t.missing.some(f=>f.metric==='corners'&&f.period==='full')).toBe(false);
  expect(t.missing.some(f=>f.metric==='corners'&&f.period==='first')).toBe(true);
  expect(t.sourceUrl).toBe('https://www.flashscore.com.br/?mid=source-v');
 });
 it('registros não finalizados ou com data divergente só pedem revisão da fonte',()=>{
  const tasks=prioritizeMainGaps(base,'2026-10-25');
  for(const id of ['review-source','not-ended']){
    const t=tasks.find(x=>x.matchId===id)!;
    expect(t.reviewReason).toBeTruthy();
    expect(t.missing).toEqual([]);
  }
  expect(tasks.find(x=>x.matchId==='review-source')?.sourceUrl).toBeNull();
  expect(tasks.some(x=>x.matchId==='future')).toBe(false);
  expect(tasks.filter(x=>x.matchId==='needs-ft')).toHaveLength(1);
 });
 it('trata Work de forma separada, ignora duplicatas e não cria lacunas em registro completo',()=>{
  const rows=[work('good','2026-10-20'),
    work('dupe','2026-10-21','good'),
    work('review','2026-10-22','review',['Diferença documentada']),
    work('future','2026-10-25'),
    {...work('bad-corners','2026-10-23'),full:{
      ...full,corners:[null,8] as unknown as [number,number]
    }}
  ];
  const snap=JSON.stringify(rows);
  const queue=prioritizeWorkGaps(rows,'2026-10-25');
  expect(queue).toHaveLength(2);
  expect(queue[0]).toMatchObject({
    source:'work',matchId:'bad-corners',
    competition:'La Liga espanhola 2026/27',priority:'corners-full'
  });
  expect(queue[0].missing).toContainEqual({metric:'corners',period:'full',side:'home'});
  expect(queue[1]).toMatchObject({matchId:'review',priority:'source-review'});
  expect(JSON.stringify(rows)).toBe(snap);
 });
 it('preserva isolamento da temporada e não cria tickets de partidas completas',()=>{
  const complete:Data={teams:base.teams,matches:[
    {...main('old','2026-10-20',2,3),competition:'Brasileirão Série B'}
  ]};
  expect(prioritizeMainGaps(complete,'2026-10-25')).toEqual([]);
  expect(prioritizeWorkGaps([work('good','2026-10-20')],'2026-10-25')).toEqual([]);
 });
});

describe('Integração da origem com a fila de lacunas',()=>{
 it('mantém N/D e classifica link salvo apenas como referência não conferida',()=>{
  const tasks=prioritizeMainGaps(base,'2026-10-25');
  expect(tasks.find(t=>t.matchId==='needs-period')).toMatchObject({
    sourceStatus:'linked-unchecked',sourceId:'source-v',
    sourceUrl:'https://www.flashscore.com.br/?mid=source-v'
  });
  expect(tasks.find(t=>t.matchId==='needs-ft')).toMatchObject({
    sourceStatus:'missing-source',sourceId:null,sourceUrl:null
  });
 });
 it('bloqueia link divergente e preserva tarefa de revisão da fonte',()=>{
  const item=prioritizeMainGaps(base,'2026-10-25')
    .find(t=>t.matchId==='review-source')!;
  expect(item.sourceStatus).toBe('invalid-source');
  expect(item.reviewReason).toBe('Data divergente na fonte');
  expect(item.sourceUrl).toBeNull();
  expect(item.missing).toEqual([]);
 });
 it('separa Work com origem conferível de registros em divergência',()=>{
  const candidates:WorkAnalysisMatch[]=[
    work('valid','2026-10-18'),
    {...work('incomplete','2026-10-19'),full:{
      ...full,corners:[null,6] as unknown as [number,number]}},
    work('review','2026-10-20','review',['Divergência'])
  ];
  const tasks=prioritizeWorkGaps(candidates,'2026-10-25');
  expect(tasks.find(x=>x.matchId==='incomplete')).toMatchObject({
    sourceStatus:'linked-unchecked',sourceId:'incomplete',
    sourceUrl:'https://www.flashscore.com.br/?mid=incomplete'
  });
  expect(tasks.find(x=>x.matchId==='review')).toMatchObject({
    priority:'source-review',sourceStatus:'needs-review',
    sourceUrl:'https://www.flashscore.com.br/?mid=review'
  });
  expect(tasks.find(x=>x.matchId==='valid')).toBeUndefined();
 });
});

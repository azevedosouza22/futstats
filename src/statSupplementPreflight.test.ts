import {describe,it,expect} from 'vitest';
import type {Data,Match,Stats} from './model';
import type {WorkResearchRow} from './workCsv';
import type {WorkAnalysisMatch} from './workAnalysis';
import type {MetricPairs} from './europeWorkResearch';
import {prioritizeMainGaps,prioritizeWorkGaps} from './statGapQueue';
import {preflightStatSupplement} from './statSupplementPreflight';

const make=(goals:number,shots:number,target:number,corners:number|null):Stats=>({
 goals,shots,target,corners,yellow:0,red:0
});
const first:[Stats,Stats]=[make(1,6,1,2),make(1,5,2,1)];
const second:[Stats,Stats]=[make(0,6,2,3),make(1,5,1,2)];
const full:[Stats,Stats]=[make(1,12,3,5),make(2,10,3,3)];
const withGap:[Stats,Stats]=[{...full[0],corners:null},{...full[1]}];
const url=(id:string)=>'https://www.flashscore.com.br/?mid='+id;
const league='Brasileirão Série A';
const match:Match={
 id:'fixture-main',home:'h',away:'a',date:'2026-10-19',
 competition:league,first,second,
 research:{provider:'work-csv',source:'Flashscore',
  sourceId:'source-main',sourceUrl:url('source-main'),
  importedAt:'2026-10-20T18:00:00Z',dateDiscrepancy:false,full:withGap}
};
const data:Data={teams:[
 {id:'h',name:'RB Bragantino',color:'#334455'},
 {id:'a',name:'Cruzeiro',color:'#334455'}],matches:[match]};
const input:WorkResearchRow={
 sourceId:'source-main',sourceUrl:url('source-main'),
 date:'2026-10-19',competition:league,home:'Red Bull Bragantino',
 away:'Cruzeiro EC',dateDiscrepancy:false,first,second,full
};
const mainTask=()=>prioritizeMainGaps(data,'2026-10-25')[0];
const pairs:MetricPairs={
 goals:[1,2],shots:[12,10],target:[3,3],corners:[5,3]
};
const work:WorkAnalysisMatch={
 id:'work|source-123',sourceId:'source-123',sourceUrl:url('source-123'),
 league:'la-liga',date:'2026-10-18',home:'FC Barcelona',
 away:'Real Madrid CF',discrepancies:[],
 full:{...pairs,corners:[null,3] as unknown as [number,number]},
 first:{...pairs,corners:[2,1],goals:[1,1],shots:[6,5],target:[1,2]},
 second:{...pairs,corners:[3,2],goals:[0,1],shots:[6,5],target:[2,1]}
};
const workRow:WorkResearchRow={
 sourceId:work.sourceId,sourceUrl:work.sourceUrl,date:work.date,
 competition:'La Liga espanhola 2026/27',home:'Barcelona',away:'Real Madrid',
 dateDiscrepancy:false,
 full:[make(1,12,3,5),make(2,10,3,3)],
 first:[make(1,6,1,2),make(1,5,2,1)],
 second:[make(0,6,2,3),make(1,5,1,2)]
};
describe('pré-validação não destrutiva de estatísticas complementares',()=>{
 it('identifica campo de escanteios completável sem preencher e sem mudar histórico',()=>{
  const original=JSON.stringify(data);
  const task=mainTask();
  expect(task.sourceStatus).toBe('linked-unchecked');
  const result=preflightStatSupplement(data,null,task,input);
  expect(result).toMatchObject({
   state:'needs-source-confirmation',fillable:1,
   identical:23,skippedMissing:0,written:false,problems:[]
  });
  expect(JSON.stringify(data)).toBe(original);
 });
 it('recusa troca de número existente, mesmo que o CSV seja bem formado',()=>{
  const changed:WorkResearchRow={...input,first:[
   {...first[0],shots:7},first[1]]};
  const result=preflightStatSupplement(data,null,mainTask(),changed);
  expect(result.state).toBe('blocked');
  expect(result.problems.some(x=>x.includes('substituir'))).toBe(true);
 });
 it('recusa divergência de somas FT=1T+2T após combinar valores',()=>{
  const wrong:WorkResearchRow={...input,full:[
   {...full[0],corners:7},full[1]]};
  const result=preflightStatSupplement(data,null,mainTask(),wrong);
  expect(result.state).toBe('blocked');
  expect(result.problems.some(x=>x.includes('soma dos tempos'))).toBe(true);
 });
 it('recusa alvo maior que finalizações mesmo no valor complementar',()=>{
  const badData:Data={...data,matches:[{...match,research:{
   ...match.research!,full:[{...withGap[0],shots:null,target:null},withGap[1]]
  }}]};
  const task=prioritizeMainGaps(badData,'2026-10-25')[0];
  const bad:WorkResearchRow={...input,full:[
   {...full[0],shots:1,target:3},full[1]]};
  const result=preflightStatSupplement(badData,null,task,bad);
  expect(result.state).toBe('blocked');
  expect(result.problems.some(x=>x.includes('Chutes no alvo'))).toBe(true);
 });
 it('bloqueia outra partida, temporada, mando invertido e data divergente',()=>{
  const task=mainTask();
  for(const row of [
    {...input,sourceId:'other'},
    {...input,sourceUrl:url('other')},
    {...input,date:'2026-10-20'},
    {...input,competition:'Brasileirão Série B'},
    {...input,home:'Cruzeiro',away:'Red Bull Bragantino'},
    {...input,dateDiscrepancy:true,titleDate:'2026-10-20'}
  ]){
    expect(preflightStatSupplement(data,null,task,row).state).toBe('blocked');
  }
 });
 it('bloqueia arquivo de fonte para registro sem origem conferível ou em revisão',()=>{
  const task=mainTask();
  expect(preflightStatSupplement(data,null,{
   ...task,sourceStatus:'missing-source',sourceUrl:null
  },input).state).toBe('blocked');
  expect(preflightStatSupplement(data,null,{
   ...task,sourceStatus:'needs-review',reviewReason:'Data divergente'
  },input).state).toBe('blocked');
 });
 it('recusa partidas duplicadas no histórico ou ID de fonte reutilizado',()=>{
  const duplicate:Data={...data,matches:[match,{...match,id:'fixture-2'}]};
  const task=prioritizeMainGaps(duplicate,'2026-10-25')[0];
  expect(preflightStatSupplement(duplicate,null,task,input).state).toBe('blocked');
  const dupId:Data={...data,matches:[match,{...match}]};
  expect(preflightStatSupplement(dupId,null,mainTask(),input).state).toBe('blocked');
 });
 it('reconhece resultado sem novos campos e não cria arquivo alterado',()=>{
  const all:Data={...data,matches:[{...match,research:{
    ...match.research!,full
  }}]};
  const task={...mainTask(),matchId:'fixture-main'};
  const result=preflightStatSupplement(all,null,task,input);
  expect(result).toMatchObject({
   state:'no-new-fields',fillable:0,identical:24,written:false
  });
 });
 it('Work permanece separado, com validação por ID, times, data e liga',()=>{
  const task=prioritizeWorkGaps([work],'2026-10-25')[0];
  const original=JSON.stringify(work);
  const result=preflightStatSupplement(data,[work],task,workRow);
  expect(result).toMatchObject({
    state:'needs-source-confirmation',fillable:1,written:false
  });
  expect(JSON.stringify(work)).toBe(original);
  expect(preflightStatSupplement(data,null,task,workRow).state).toBe('blocked');
  expect(preflightStatSupplement(data,[work,{...work,id:'work|dup'}],
    task,workRow).state).toBe('blocked');
 });
 it('bloqueia nomes ambíguos no Work e rejeita outros times',()=>{
  const task=prioritizeWorkGaps([work],'2026-10-25')[0];
  const conflict:WorkAnalysisMatch={
   ...work,id:'work|third',sourceId:'third',sourceUrl:url('third'),
   home:'Barcelona',away:'Other Club'
  };
  expect(preflightStatSupplement(data,[work,conflict],task,workRow).state).toBe('blocked');
  expect(preflightStatSupplement(data,[work],task,{...workRow,home:'Sevilla'}).state).toBe('blocked');
 });
 it('N/D no arquivo não é zero, não preenche e não inventa número',()=>{
  const none:WorkResearchRow={...input,full:[
   {...full[0],corners:null},full[1]]};
  const result=preflightStatSupplement(data,null,mainTask(),none);
  expect(result).toMatchObject({
   state:'no-new-fields',fillable:0,written:false
  });
  expect(result.skippedMissing).toBe(1);
 });
});

import {describe,it,expect} from 'vitest';
import type {Data,Match,Stats} from './model';
import type {WorkAnalysisMatch} from './workAnalysis';
import type {MetricPairs} from './europeWorkResearch';
import {reconcileMainWorkSources,exportMainWorkReconciliationCsv} from './mainWorkSourceReconciliation';

const league='Premier League inglesa 2026/27';
const stats=(goals:number|null,shots:number|null,target:number|null,corners:number|null):Stats=>({
 goals,shots,target,corners,yellow:0,red:0
});
const pair=(g:[number,number],sh:[number,number],t:[number,number],c:[number,number]):MetricPairs=>({
 goals:g,shots:sh,target:t,corners:c
});
const first=pair([1,0],[6,5],[3,2],[2,1]);
const second=pair([0,1],[4,6],[1,2],[1,2]);
const full=pair([1,1],[10,11],[4,4],[3,3]);
const toStats=(p:MetricPairs,i:0|1)=>stats(p.goals[i],p.shots[i],p.target[i],p.corners[i]);
const original=():Match=>({
 id:'main-1',date:'2026-10-20',competition:league,home:'liverpool',away:'arsenal',
 first:[toStats(first,0),toStats(first,1)],second:[toStats(second,0),toStats(second,1)],
 research:{provider:'work-csv',source:'Flashscore',sourceId:'same-source-001',
  sourceUrl:'https://www.flashscore.com.br/jogo/?mid=same-source-001',
  importedAt:'2026-10-21T10:00:00Z',dateDiscrepancy:false,
  full:[toStats(full,0),toStats(full,1)]}
});
const originalWork=():WorkAnalysisMatch=>({
 id:'premier|same-source-001',league:'premier-league',date:'2026-10-20',
 home:'Liverpool',away:'Arsenal',sourceId:'same-source-001',
 sourceUrl:'https://www.flashscore.com.br/jogo/?mid=same-source-001',
 first,second,full,discrepancies:[]
});
const data=(...matches:Match[]):Data=>({teams:[
 {id:'liverpool',name:'Liverpool',color:'#aabbcc'},
 {id:'arsenal',name:'Arsenal',color:'#ddeeff'}
],matches});
const check=(d:Data,w:WorkAnalysisMatch[])=>
 reconcileMainWorkSources(d,w,'2026-10-26');

describe('Etapa 64 — conferir sobreposição histórica Work/Main por fonte',()=>{
 it('mesmo ID e 24 valores iguais: uma coincidência LOCAL, jamais fonte externa independente',()=>{
  const m=original(),w=originalWork(),snapshot=JSON.stringify([m,w]);
  const report=check(data(m),[w]);
  expect(report).toMatchObject({sharedIds:1,identical:1,conflicting:0,
   incomplete:0,mismatchedFixtures:0,externalVerified:0,
   overlaps:[{state:'same_values',conflicts:0,unavailable:0,verification:'PENDENTE'}]});
  expect(JSON.stringify([m,w])).toBe(snapshot);
  expect(exportMainWorkReconciliationCsv(report)).toContain('"PENDENTE"');
 });
 it('detecta divergência em um dos 24 valores, não altera nenhum original',()=>{
  const w=originalWork();w.second={...w.second,corners:[9,2]};
  const m=original(),before=JSON.stringify([m,w]);
  const report=check(data(m),[w]);
  expect(report).toMatchObject({conflicting:1,identical:0,
   overlaps:[{state:'different_values',conflicts:1}]});
  expect(JSON.stringify([m,w])).toBe(before);
 });
 it('N/D não é zero nem valor correto por aproximação',()=>{
  const m=original();m.first[0].corners=null;
  const report=check(data(m),[originalWork()]);
  expect(report).toMatchObject({incomplete:1,
   overlaps:[{state:'incomplete_values',conflicts:0,unavailable:1}]});
 });
 it('mesmo ID em outra data, equipe ou campeonato bloqueia comparação numérica',()=>{
  const w=originalWork(),m=original();
  m.date='2026-10-19';
  expect(check(data(m),[w]).overlaps[0]).toMatchObject({
   state:'different_fixture',conflicts:0,unavailable:0});
  m.date=w.date;m.competition='Premier League inglesa 2025/26';
  expect(check(data(m),[w]).overlaps[0].state).toBe('different_fixture');
  m.competition=league;m.away='liverpool';
  expect(check(data(m),[w]).overlaps[0].state).toBe('different_fixture');
 });
 it('um ID Work duplicado e URL phishing permanecem pendência, nunca link aberto',()=>{
  const w=originalWork(),other={...originalWork(),id:'outra-work'};
  expect(check(data(original()),[w,other]).overlaps[0].state)
   .toBe('duplicate_work_id');
  w.sourceUrl='https://www.flashscore.com.br.evil.invalid/?mid=same-source-001';
  expect(check(data(original()),[w]).overlaps[0]).toMatchObject({
   state:'unsafe_reference',sourceUrl:null});
  const csv=exportMainWorkReconciliationCsv(check(data(original()),[w]));
  expect(csv).not.toContain('evil.invalid');
 });
 it('ignora IDs não compartilhados, jogos futuros e origem sem metadados',()=>{
  const work=originalWork(),main=original();
  main.date='2026-10-27';
  expect(check(data(main),[work]).sharedIds).toBe(0);
  main.date='2026-10-20';main.research=undefined;
  expect(check(data(main),[work]).sharedIds).toBe(0);
  expect(check(data(original()),[]).sharedIds).toBe(0);
 });
 it('planilha com nome suspeito neutraliza fórmulas, sem divulgar dados novos',()=>{
  const m=original(),w=originalWork();
  m.research!.sourceId='spreadsheet001';w.sourceId='spreadsheet001';
  m.research!.sourceUrl='https://www.flashscore.com.br/?mid=spreadsheet001';
  w.sourceUrl=m.research!.sourceUrl;
  const d=data(m);d.teams[0].name='=IMPORTXML("abc";"a")';
  const report=check(d,[w]);
  const csv=exportMainWorkReconciliationCsv(report);
  expect(csv).toContain('IMPORTXML');
  expect(csv).toContain('""abc""');
  expect(csv).toContain('"PENDENTE"');
 });
});

import {describe,expect,it} from 'vitest';
import type {Data,Match,Stats} from './model';
import {radarPeriodCoverage} from './radarPeriodCoverage';
const league='Bundesliga 2026/27';
const fixture={home:'A',away:'B',date:'2026-10-25',competition:league};
const stat=(goals:number|null,shots:number|null,target:number|null,corners:number|null):Stats=>({
 goals,shots,target,corners,yellow:0,red:0
});
const z=()=>stat(0,0,0,0);
const mk=(id:string,day:string,home:string,away:string,
 first:[Stats,Stats]=[stat(1,8,4,3),stat(0,6,3,2)],
 second:[Stats,Stats]=[z(),z()]):Match=>({
 id,date:day,home,away,competition:league,first,second
});
const data=(...matches:Match[]):Data=>({teams:[],matches});
const get=(report:ReturnType<typeof radarPeriodCoverage>,metric:string,period:'full'|'first'|'second')=>
 report.rows.find(r=>r.metric===metric)!.cells[period];
describe('Etapa 56 — 4 indicadores x 3 períodos (somente históricos anteriores)',()=>{
 it('tem 4 linhas e 12 células, com zero histórico como N/D, sem zeros fabricados',()=>{
  const empty=radarPeriodCoverage(data(),fixture);
  expect(empty).toMatchObject({distinct:0,completeAll:0,selectedHome:0,selectedAway:0});
  expect(empty.rows).toHaveLength(4);
  expect(empty.rows.flatMap(r=>Object.values(r.cells))).toHaveLength(12);
  for(const row of empty.rows)for(const cell of Object.values(row.cells))
   expect(cell).toMatchObject({valid:0,missing:0,conflicts:0,mean:null});
 });
 it('conta jogo em comum apenas uma vez, exclui dia atual, outro campeonato e futuro',()=>{
  const shared=mk('shared','2026-10-10','A','B');
  const extra=mk('extra','2026-10-11','A','C');
  const visitor=mk('visitor','2026-10-12','D','B');
  const sameDay=mk('current','2026-10-25','A','B',[stat(40,70,40,20),z()],[z(),z()]);
  const next=mk('later','2026-10-26','D','A');
  const other={...mk('other','2026-10-03','A','B'),competition:'Bundesliga 2025/26'};
  const before=JSON.stringify([shared,extra,visitor,sameDay,next,other]);
  const report=radarPeriodCoverage(data(shared,extra,visitor,sameDay,next,other),fixture);
  expect(report).toMatchObject({selectedHome:2,selectedAway:2,distinct:3,
   duplicateIds:1,skippedAmbiguous:0,completeAll:3});
  expect(get(report,'goals','full')).toMatchObject({valid:3,mean:1});
  expect(get(report,'shots','first')).toMatchObject({valid:3,mean:14});
  expect(JSON.stringify([shared,extra,visitor,sameDay,next,other])).toBe(before);
 });
 it('preserva N/D de ambos os lados; total conhecido não inventa 1º/2º tempo',()=>{
  const m=mk('incomplete','2026-10-23','A','B',
   [stat(0,10,3,null),stat(0,12,2,null)],[stat(0,0,0,null),stat(0,0,0,null)]);
  m.research={provider:'work-csv',source:'Flashscore',sourceId:'unique-900',
   sourceUrl:'https://www.flashscore.com.br/jogo/?mid=unique-900',
   importedAt:'2026-10-24T12:00:00.000Z',dateDiscrepancy:false,
   full:[stat(0,10,3,2),stat(0,12,2,3)]};
  const report=radarPeriodCoverage(data(m),fixture);
  expect(report).toMatchObject({distinct:1,completeAll:0});
  expect(get(report,'goals','full')).toMatchObject({valid:1,mean:0}); // real zero
  expect(get(report,'corners','full')).toMatchObject({valid:1,mean:5});
  expect(get(report,'corners','first')).toMatchObject({
   valid:0,mean:null,missing:1,conflicts:0
  });
  expect(get(report,'corners','second')).toMatchObject({valid:0,mean:null,missing:1});
 });
 it('se um período contém apenas um lado, o total da partida é N/D para esse período',()=>{
  const m=mk('one-side','2026-10-20','A','C',
    [stat(1,8,3,2),stat(null,6,null,3)],[z(),z()]);
  const report=radarPeriodCoverage(data(m),fixture);
  expect(get(report,'goals','first')).toMatchObject({valid:0,missing:1,mean:null});
  expect(get(report,'target','first')).toMatchObject({valid:0,missing:1,mean:null});
  expect(get(report,'shots','first')).toMatchObject({valid:1,mean:14});
 });
 it('descarta apenas a métrica contraditória quando FT difere de 1T+2T',()=>{
  const m=mk('mismatch','2026-10-20','A','B');
  m.research={provider:'work-csv',source:'Flashscore',sourceId:'unique-901',
    sourceUrl:'https://www.flashscore.com.br/jogo/?mid=unique-901',
    importedAt:'2026-10-22T12:00:00Z',dateDiscrepancy:false,
    full:[stat(2,8,4,3),stat(0,6,3,2)]}; // 2 gols FT vs 1 gol HT+ST
  const report=radarPeriodCoverage(data(m),fixture);
  expect(report.completeAll).toBe(0);
  for(const p of ['full','first','second'] as const)
   expect(get(report,'goals',p)).toMatchObject({valid:0,mean:null,conflicts:1});
  expect(get(report,'shots','full')).toMatchObject({valid:1,mean:14,conflicts:0});
 });
 it('exclui pesquisa com diferença de datas e mantém temporada isolada',()=>{
  const ambiguous=mk('uncertain','2026-10-18','A','B');
  ambiguous.research={provider:'work-csv',source:'Flashscore',sourceId:'unique-902',
    sourceUrl:'https://www.flashscore.com.br/jogo/?mid=unique-902',
    importedAt:'2026-10-22T12:00:00Z',titleDate:'2026-10-19',
    dateDiscrepancy:true,full:[stat(1,8,4,3),stat(0,6,3,2)]};
  const good=mk('certain','2026-10-20','A','B');
  const report=radarPeriodCoverage(data(good,ambiguous),fixture);
  expect(report).toMatchObject({distinct:1,skippedAmbiguous:1,completeAll:1});
  expect(get(report,'corners','full').valid).toBe(1);
 });
 it('mesma fonte não duplica contadores se jogo aparece na lista de ambos os clubes',()=>{
  const shared=mk('same','2026-10-11','A','B');
  const report=radarPeriodCoverage(data(shared),fixture);
  expect(report).toMatchObject({selectedHome:1,selectedAway:1,distinct:1,duplicateIds:1});
  expect(report.rows.every(r=>Object.values(r.cells).every(c=>c.valid===1))).toBe(true);
 });
});

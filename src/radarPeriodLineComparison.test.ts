import {describe,it,expect} from 'vitest';
import type {Data,Match,Stats} from './model';
import {comparePeriodRadarLines,MIN_PERIOD_LINE_SAMPLE,PERIOD_REFERENCE_LINES}
 from './radarPeriodLineComparison';
const competition='Bundesliga 2026/27';
const fixture={home:'A',away:'B',date:'2026-10-25',competition};
const st=(goals:number|null,shots:number|null,target:number|null,corners:number|null):Stats=>
 ({goals,shots,target,corners,yellow:0,red:0});
const z=()=>st(0,0,0,0);
const match=(id:string,date='2026-10-20',home='A',away='C'):Match=>({
 id,date,home,away,competition,
 first:[st(1,8,3,2),st(0,6,2,3)],second:[z(),z()]
});
const result=(...matches:Match[]):Data=>({teams:[],matches});
const group=(report:ReturnType<typeof comparePeriodRadarLines>,metric:string,period:string)=>
 report.groups.find(g=>g.metric===metric&&g.period===period)!;
describe('Etapa 58 — contagens Over/Under por período e integridade',()=>{
 it('exibe 12 grupos N/D sem jogos, sem zero ou probabilidade fabricados',()=>{
  const r=comparePeriodRadarLines(result(),fixture);
  expect(r.groups).toHaveLength(12);
  expect(MIN_PERIOD_LINE_SAMPLE).toBe(5);
  for(const g of r.groups){
   expect(g).toMatchObject({observed:0,missing:0,conflicts:0,
    mean:null,isAdequateSample:false});
   for(const line of g.lines)expect(line).toMatchObject({
    over:0,under:0,overShare:null,underShare:null});
  }
 });
 it('seleciona 5+5 históricos da liga, nunca futuro, outro campeonato nem duplica jogo comum',()=>{
  const shared=match('shared','2026-10-01','A','B');
  const relevant=[shared,
    ...Array.from({length:6},(_,i)=>match('a'+i,'2026-10-'+String(10+i),'A','C')),
    ...Array.from({length:6},(_,i)=>match('b'+i,'2026-10-'+String(10+i),'D','B'))
  ];
  const data=result(...relevant,match('current','2026-10-25','A','B'),
    {...match('old','2026-10-20','A','B'),competition:'Bundesliga 2025/26'});
  const r=comparePeriodRadarLines(data,fixture);
  expect(group(r,'goals','full').distinct).toBe(10); // no duplicate shared
  expect(group(r,'goals','first').observed).toBe(10);
  expect(group(r,'goals','second').lines[0]).toMatchObject({
   over:0,under:10,overShare:0,underShare:1
  });
  expect(group(r,'shots','full').mean).toBe(14);
  expect(group(r,'shots','first').lines.every(l=>l.over+l.under===10)).toBe(true);
 });
 it('mantém percentuais N/D quando há menos de cinco jogos válidos',()=>{
  const r=comparePeriodRadarLines(result(...Array.from({length:4},(_,i)=>
   match('a'+i,'2026-10-'+String(10+i)))),fixture);
  const g=group(r,'corners','first');
  expect(g).toMatchObject({observed:4,isAdequateSample:false});
  expect(g.lines[0]).toMatchObject({over:4,under:0,
   overShare:null,underShare:null});
 });
 it('jogo completo conhecido nunca completa escanteios dos tempos N/D',()=>{
  const m=match('one');
  m.research={provider:'work-csv',source:'Flashscore',sourceId:'fl-1',
   sourceUrl:'https://www.flashscore.com.br/jogo/?mid=fl-1',
   importedAt:'2026-10-24T11:00:00Z',dateDiscrepancy:false,
   full:[st(1,8,3,2),st(0,6,2,3)]};
  m.first[0].corners=null;m.second[0].corners=null;
  const report=comparePeriodRadarLines(result(m),fixture);
  expect(group(report,'corners','full')).toMatchObject({
   observed:1,mean:5,missing:0});
  expect(group(report,'corners','first')).toMatchObject({
   observed:0,mean:null,missing:1});
  expect(group(report,'corners','second')).toMatchObject({
   observed:0,mean:null,missing:1});
  expect(group(report,'goals','first').mean).toBe(1);
 });
 it('soma divergente em uma equipe é excluída, mesmo com erros opostos que se anulam',()=>{
  const m=match('bad');m.research={
   provider:'work-csv',source:'Flashscore',sourceId:'fl-2',
   sourceUrl:'https://www.flashscore.com.br/jogo/?mid=fl-2',
   importedAt:'2026-10-24T11:00:00Z',dateDiscrepancy:false,
   full:[st(2,7,3,2),st(0,7,2,3)]
  }; // shots: first home=8/full 7, away first=6/full 7; total cancels
  const r=comparePeriodRadarLines(result(m),fixture);
  for(const p of ['first','second','full']){
   expect(group(r,'shots',p)).toMatchObject({observed:0,conflicts:1,mean:null});
  }
  expect(group(r,'corners','full')).toMatchObject({observed:1,mean:5});
 });
 it('zero é resultado válido, Over+Under é exatamente denominador para toda linha',()=>{
  const m=match('zero');m.first=[z(),z()];
  const r=comparePeriodRadarLines(result(m),fixture);
  const g=group(r,'goals','full');
  expect(g).toMatchObject({observed:1,mean:0});
  expect(g.lines[0]).toMatchObject({over:0,under:1,
   overShare:null,underShare:null});
  for(const item of r.groups)for(const line of item.lines){
   expect(line.over+line.under).toBe(item.observed);
  }
 });
 it('datas contraditórias e partidas futuras não contam; não toca nos objetos originais',()=>{
  const bad=match('ambiguous');
  bad.research={provider:'work-csv',source:'Flashscore',sourceId:'fl-3',
   sourceUrl:'https://www.flashscore.com.br/jogo/?mid=fl-3',
   importedAt:'2026-10-24T12:00:00Z',dateDiscrepancy:true,
   full:[st(1,8,3,2),st(0,6,2,3)]};
  const future=match('future','2026-10-26'),good=match('good','2026-10-19');
  const d=result(bad,future,good),snapshot=JSON.stringify(d);
  const r=comparePeriodRadarLines(d,fixture);
  expect(group(r,'shots','full')).toMatchObject({observed:1,mean:14});
  expect(JSON.stringify(d)).toBe(snapshot);
 });
 it('limiares são fracionários de .5, em ordem crescente e diferentes nos tempos',()=>{
  for(const p of ['full','first','second'] as const)
   for(const metric of ['goals','shots','target','corners'] as const){
    const lines=PERIOD_REFERENCE_LINES[p][metric];
    expect(lines.length).toBeGreaterThanOrEqual(3);
    expect(lines.every(x=>Number.isInteger(x-.5))).toBe(true);
    expect([...lines].sort((a,b)=>a-b)).toEqual(lines);
   }
  expect(PERIOD_REFERENCE_LINES.first.corners)
   .not.toEqual(PERIOD_REFERENCE_LINES.full.corners);
 });
});

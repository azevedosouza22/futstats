import {describe,expect,it} from 'vitest';
import type {Data,Match,Stats} from './model';
import {radarPeriodCoverage,exportRadarPeriodGapCsv} from './radarPeriodCoverage';
const league='Bundesliga 2026/27';
const f={home:'A',away:'B',date:'2026-10-25',competition:league};
const stat=(goals:number|null,shots:number|null,target:number|null,corners:number|null):Stats=>({
 goals,shots,target,corners,yellow:0,red:0
});
const z=()=>stat(0,0,0,0);
const match=(id:string):Match=>({
 id,date:'2026-10-21',competition:league,home:'A',away:'B',
 first:[stat(1,8,4,2),stat(0,6,3,1)],
 second:[z(),z()]
});
const source=(m:Match,id='fixture-123',url='https://www.flashscore.com.br/jogo/?mid=fixture-123')=>{
 m.research={provider:'work-csv',source:'Flashscore',
  sourceId:id,sourceUrl:url,importedAt:'2026-10-22T12:00:00Z',
  dateDiscrepancy:false,
  full:[stat(1,8,4,2),stat(0,6,3,1)]};
 return m;
};
const data=(...matches:Match[]):Data=>({teams:[],matches});
const metric=(r:ReturnType<typeof radarPeriodCoverage>,m:string,p:'full'|'first'|'second')=>
 r.rows.find(x=>x.metric===m)!.cells[p];
describe('Etapa 57 — revisão localizada dos 12 campos sem escrita',()=>{
 it('identifica o jogo e tempos N/D sem preencher FT automaticamente',()=>{
  const m=source(match('incomplete'));
  m.first[0].corners=null;
  m.second[0].corners=null;
  const src=data(m),before=JSON.stringify(src),r=radarPeriodCoverage(src,f);
  expect(r).toMatchObject({distinct:1,completeAll:0,gaps:[{
    matchId:'incomplete',date:'2026-10-21',sourceStatus:'linked-unchecked',
    sourceUrl:'https://www.flashscore.com.br/jogo/?mid=fixture-123',
    gaps:[{metric:'corners',period:'first',kind:'missing'},
      {metric:'corners',period:'second',kind:'missing'}]
  }]});
  expect(metric(r,'corners','full')).toMatchObject({valid:1,mean:3});
  expect(metric(r,'corners','first')).toMatchObject({valid:0,mean:null,missing:1});
  expect(JSON.stringify(src)).toBe(before);
  expect(exportRadarPeriodGapCsv(r).split('\r\n').filter(Boolean)).toHaveLength(3);
  expect(exportRadarPeriodGapCsv(r)).toContain('"PENDENTE"');
 });
 it('descobre inconsistência que se anula no total, comparando mandante e visitante',()=>{
  const m=source(match('cancel-out'),'fixture-234',
   'https://www.flashscore.com.br/jogo/?mid=fixture-234');
  m.first=[stat(2,8,4,2),stat(0,6,3,1)];
  m.second=[z(),stat(1,0,0,0)];
  m.research!.full=[stat(1,8,4,2),stat(2,6,3,1)];
  // FT combinado = 3 e 1T + 2T combinado = 2 + 1 = 3.
  const r=radarPeriodCoverage(data(m),f);
  expect(metric(r,'goals','full')).toMatchObject({valid:0,conflicts:1,mean:null});
  expect(metric(r,'shots','full')).toMatchObject({valid:1,conflicts:0,mean:14});
  expect(r).toMatchObject({completeAll:0,gaps:[{
    matchId:'cancel-out',gaps:[{metric:'goals',period:'full',kind:'conflict'}]
  }]});
  const csv=exportRadarPeriodGapCsv(r);
  expect(csv).toContain('"SOMA_DIVERGENTE"');
  expect(csv).not.toContain('"CONFIRMADO"');
 });
 it('nunca fornece link quando URL é insegura ou dados de fonte faltam',()=>{
  const m=source(match('wrong'),'fixture-456',
   'https://www.flashscore.com.br.evil.invalid/jogo/?mid=fixture-456');
  m.first[0].corners=null;
  const r=radarPeriodCoverage(data(m),f);
  expect(r.gaps[0]).toMatchObject({sourceStatus:'invalid-source',
    sourceUrl:null,sourceId:'fixture-456'});
  expect(exportRadarPeriodGapCsv(r)).not.toContain('evil.invalid');
  const manual=match('manual');
  manual.first[1].shots=null;
  const q=radarPeriodCoverage(data(manual),f);
  expect(q.gaps[0]).toMatchObject({sourceUrl:null,sourceStatus:'missing-source'});
 });
 it('nenhuma lacuna: somente cabeçalho CSV e sem falso progresso',()=>{
  const m=match('complete'),r=radarPeriodCoverage(data(m),f);
  expect(r.completeAll).toBe(1);
  expect(r.gaps).toEqual([]);
  expect(exportRadarPeriodGapCsv(r).split('\r\n').filter(Boolean)).toHaveLength(1);
 });
 it('dados de outra temporada, futuros e duplicados não viram problemas extras',()=>{
  const m=source(match('shared'));m.first[0].corners=null;
  const future={...source(match('after'),'fixture-999','https://www.flashscore.com.br/jogo/?mid=fixture-999'),
   date:'2026-10-26'};
  const other={...source(match('old'),'fixture-998','https://www.flashscore.com.br/jogo/?mid=fixture-998'),
   competition:'Bundesliga 2025/26'};
  const r=radarPeriodCoverage(data(m,future,other),f);
  expect(r).toMatchObject({distinct:1,duplicateIds:1});
  expect(r.gaps).toHaveLength(1);
  expect(r.gaps[0].matchId).toBe('shared');
 });
 it('exportação neutraliza fórmulas de planilha no nome da equipe',()=>{
  const m=source(match('spreadsheet'));
  m.home='=HYPERLINK("https://bad.invalid";"x")';
  m.first[1].corners=null;
  const r=radarPeriodCoverage(data(m),{...f,home:m.home});
  const csv=exportRadarPeriodGapCsv(r);
  expect(csv).toContain("\"'=HYPERLINK");
  expect(csv).toContain('""x""');
  expect(csv).toContain('"N/D"');
 });
});

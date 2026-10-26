import {describe,it,expect} from 'vitest';
import type {Data,Match,Stats} from './model';
import {compareVenuePeriodSamples} from './radarVenuePeriodProfile';
import {traceVenueSamples,exportVenueTrailCsv} from './radarVenueSampleTrace';
const competition='La Liga espanhola 2026/27';
const fixture={competition,date:'2026-10-25',home:'a',away:'b'};
const st=(goals:number|null=1,corners:number|null=2):Stats=>({
 goals,shots:8,target:3,corners,yellow:0,red:0
});
const mk=(id:string,date:string,home:string,away:string):Match=>({
 id,date,home,away,competition,first:[st(),st()],second:[st(),st()]
});
const sample=():Data=>({teams:[
 {id:'a',name:'Clube Casa',color:'#000000'},
 {id:'b',name:'Clube Fora',color:'#333333'}],
 matches:[
  ...Array.from({length:5},(_,i)=>mk('a'+i,'2026-10-'+(10+i),'a','out'+i)),
  ...Array.from({length:5},(_,i)=>mk('b'+i,'2026-10-'+(16+i),'out'+i,'b'))
 ]});
const report=(d:Data)=>traceVenueSamples(d,fixture,compareVenuePeriodSamples(d,fixture));
describe('Etapa 60 — origem rastreável das amostras por mando',()=>{
 it('lista os mesmos 5+5 jogos que geram as médias, sem reescrever dados',()=>{
  const d=sample(),before=JSON.stringify(d),r=report(d);
  expect(r).toMatchObject({consistent:true,independentCheck:'PENDENTE',
   home:{selected:5,included:5,notVenue:0,excluded:0},
   away:{selected:5,included:5,notVenue:0,excluded:0}});
  expect(r.home.rows).toHaveLength(5);expect(r.away.rows).toHaveLength(5);
  expect(r.home.rows[0]).toMatchObject({disposition:'included',missingCells:0,
   conflictingMetrics:0,sourceUrl:null});
  expect(JSON.stringify(d)).toBe(before);
  const csv=exportVenueTrailCsv(r);
  expect(csv.split('\r\n').filter(Boolean)).toHaveLength(11);
  expect(csv).toContain('"PENDENTE"');
  expect(csv).toContain('"Clube Casa × out0"');
  expect(csv).not.toContain('"CONFIRMADO"');
 });
 it('separa últimos 5 da liga do recorte de mando, sem procurar jogo antigo para repor',()=>{
  const d=sample();
  d.matches.splice(0,5,...Array.from({length:5},(_,i)=>
   mk('a'+i,'2026-10-'+(10+i),'out'+i,'a')));
  d.matches.unshift(mk('older','2026-09-10','a','old'));
  const r=report(d);
  expect(r).toMatchObject({consistent:true,
   home:{selected:5,included:0,notVenue:5,excluded:0},
   away:{selected:5,included:5}});
  expect(r.home.rows.every(x=>x.disposition==='different_venue')).toBe(true);
  expect(exportVenueTrailCsv(r)).not.toContain('"older"');
 });
 it('exclui data contraditória, conta N/D de um único tempo e conflito de métrica',()=>{
  const d=sample(),m=d.matches[0];
  m.research={provider:'work-csv',source:'Flashscore',sourceId:'trace-001',
   sourceUrl:'https://www.flashscore.com.br/jogo/?mid=trace-001',
   importedAt:'2026-10-24T09:00:00Z',dateDiscrepancy:false,
   full:[st(3,5),st(2,4)]};
  m.first[0].corners=null;
  let r=report(d);
  expect(r).toMatchObject({consistent:true,home:{included:5}});
  expect(r.home.rows.find(x=>x.matchId==='a0')).toMatchObject({
   disposition:'included',missingCells:1,conflictingMetrics:1,
   sourceId:'trace-001',sourceStatus:'linked-unchecked',
   sourceUrl:'https://www.flashscore.com.br/jogo/?mid=trace-001'});
  m.research.dateDiscrepancy=true;
  r=report(d);
  expect(r.home).toMatchObject({selected:5,included:4,excluded:1});
  expect(r.home.rows.find(x=>x.matchId==='a0')).toMatchObject({
   disposition:'excluded_source'});
 });
 it('não exporta URL de domínio falsificado nem trata link como verificado',()=>{
  const d=sample(),m=d.matches[0];
  m.research={provider:'work-csv',source:'Flashscore',sourceId:'trace-001',
   sourceUrl:'https://www.flashscore.com.br.evil.invalid/jogo/?mid=trace-001',
   importedAt:'2026-10-24T09:00:00Z',dateDiscrepancy:false,
   full:[st(2,4),st(2,4)]};
  const r=report(d),row=r.home.rows.find(x=>x.matchId==='a0')!;
  expect(row).toMatchObject({sourceUrl:null,sourceStatus:'invalid-source'});
  expect(exportVenueTrailCsv(r)).not.toContain('evil.invalid');
 });
 it('partida entre os clubes aparece nas duas perspectivas, sem alegar 2 jogos únicos',()=>{
  const d=sample();const shared=mk('shared','2026-10-23','a','b');
  const r=report({...d,matches:[...d.matches,shared]});
  expect(r).toMatchObject({consistent:true,
   home:{selected:5,included:5},away:{selected:5,included:5}});
  expect(r.home.rows.some(x=>x.matchId==='shared')).toBe(true);
  expect(r.away.rows.some(x=>x.matchId==='shared')).toBe(true);
 });
 it('se o perfil esperado divergir, bloqueia exportação e não inventa rastreabilidade',()=>{
  const d=sample(),profile=compareVenuePeriodSamples(d,fixture);
  const broken={...profile,home:{...profile.home,venueCount:9}};
  const r=traceVenueSamples(d,fixture,broken);
  expect(r.consistent).toBe(false);
  expect(()=>exportVenueTrailCsv(r)).toThrow('bloqueada');
 });
 it('neutraliza fórmulas e aspas no nome histórico exportado',()=>{
  const d=sample();d.teams[0].name='=HYPERLINK("evil")';
  const csv=exportVenueTrailCsv(report(d));
  expect(csv).toContain('=HYPERLINK');
  expect(csv).toContain('""evil""');
  // Formula-like prefixes inside the quoted confrontation are not at cell start;
  // the date and source disposition remain explicit and read-only.
  expect(csv).toContain('"PENDENTE"');
 });
});

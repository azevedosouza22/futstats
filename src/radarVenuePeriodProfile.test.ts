import {describe,it,expect} from 'vitest';
import type {Data,Match,Stats} from './model';
import {compareVenuePeriodSamples,MIN_VENUE_PERIOD_SAMPLE} from './radarVenuePeriodProfile';
const league='La Liga espanhola 2026/27';
const fixture={home:'A',away:'B',date:'2026-10-25',competition:league};
const st=(goals:number|null,shots:number|null,target:number|null,corners:number|null):Stats=>({
 goals,shots,target,corners,yellow:0,red:0
});
const zero=()=>st(0,0,0,0);
function match(id:string,date:string,home:string,away:string):Match{
 return {id,date,home,away,competition:league,
  first:[st(2,18,7,5),st(1,14,5,6)],second:[zero(),zero()]};
}
const data=(matches:Match[]):Data=>({teams:[],matches});
const histories=():Match[]=>[
 ...Array.from({length:5},(_,i)=>match('a'+i,'2026-10-'+(10+i),'A','C'+i)),
 ...Array.from({length:5},(_,i)=>match('b'+i,'2026-10-'+(16+i),'D'+i,'B'))
];
const cell=(report:ReturnType<typeof compareVenuePeriodSamples>,side:'home'|'away',
 metric:string,period:string)=>report[side].cells.find(c=>c.metric===metric&&c.period===period)!;
describe('Etapa 59 — amostra de mando e períodos sem vazamento ou previsão nova',()=>{
 it('últimos 5 por clube, 5 em casa e 5 fora, cada indicador com média feita/sofrida',()=>{
  const d=data(histories()),before=JSON.stringify(d);
  const report=compareVenuePeriodSamples(d,fixture);
  expect(report).toMatchObject({competition:league,minimumSample:3,
   home:{venueCount:5,recentCount:5,excluded:0},
   away:{venueCount:5,recentCount:5,excluded:0},
   disclaimer:'DESCRITIVO — NÃO É PROBABILIDADE'});
  expect(report.home.cells).toHaveLength(12);
  expect(report.away.cells).toHaveLength(12);
  expect(cell(report,'home','goals','full')).toMatchObject({
   valid:5,forMean:2,againstMean:1,missing:0,conflicts:0});
  expect(cell(report,'away','goals','full')).toMatchObject({
   valid:5,forMean:1,againstMean:2});
  expect(cell(report,'home','target','first')).toMatchObject({
   valid:5,forMean:7,againstMean:5});
  expect(JSON.stringify(d)).toBe(before);
 });
 it('recorta mando DEPOIS dos últimos 5, sem procurar jogos antigos fora da janela',()=>{
  const games=histories().map(m=>({...m}));
  const older=match('A-old','2026-09-01','A','OLD');
  // Os últimos cinco de A são todos na casa do adversário; A-old não entra.
  for(const m of games.filter(m=>m.home==='A')){m.home='X'+m.id;m.away='A';}
  const report=compareVenuePeriodSamples(data([older,...games]),fixture);
  expect(report.home).toMatchObject({recentCount:5,venueCount:0});
  expect(cell(report,'home','goals','full')).toMatchObject({
   valid:0,forMean:null,againstMean:null});
  expect(report.away.venueCount).toBe(5);
 });
 it('amostras inferiores a 3 ficam N/D inclusive com valores numéricos disponíveis',()=>{
  const two=data(histories().slice(0,2));
  const report=compareVenuePeriodSamples(two,fixture);
  expect(MIN_VENUE_PERIOD_SAMPLE).toBe(3);
  expect(cell(report,'home','goals','full')).toMatchObject({
   valid:2,missing:0,forMean:null,againstMean:null});
  expect(cell(report,'away','goals','full')).toMatchObject({valid:0,forMean:null});
 });
 it('um tempo N/D de CSV não é reconstruído a partir do full, sem afetar gols válidos',()=>{
  const games=histories();
  const m=games[0];
  m.research={provider:'work-csv',source:'Flashscore',sourceId:'period-59',
   sourceUrl:'https://www.flashscore.com.br/jogo/?mid=period-59',
   importedAt:'2026-10-24T09:00:00Z',dateDiscrepancy:false,
   full:[st(2,18,7,5),st(1,14,5,6)]};
  m.first[0].corners=null;
  const report=compareVenuePeriodSamples(data(games),fixture);
  expect(cell(report,'home','corners','full')).toMatchObject({valid:5,missing:0,forMean:5});
  expect(cell(report,'home','corners','first')).toMatchObject({valid:4,missing:1,forMean:5});
  expect(cell(report,'home','goals','first')).toMatchObject({valid:5,missing:0});
 });
 it('conflitos FT versus períodos da mesma equipe bloqueiam só a métrica conflitante',()=>{
  const games=histories();
  const m=games[0];
  m.research={provider:'work-csv',source:'Flashscore',sourceId:'mismatch59',
   sourceUrl:'https://www.flashscore.com.br/jogo/?mid=mismatch59',
   importedAt:'2026-10-24T09:00:00Z',dateDiscrepancy:false,
   full:[st(3,18,7,5),st(1,14,5,6)]};
  const report=compareVenuePeriodSamples(data(games),fixture);
  for(const p of ['full','first','second'])
   expect(cell(report,'home','goals',p)).toMatchObject({valid:4,conflicts:1,missing:0});
  expect(cell(report,'home','shots','full')).toMatchObject({valid:5,conflicts:0});
 });
 it('zero conhecido conta como zero, não como N/D; fontes com datas conflitantes são excluídas',()=>{
  const games=histories();
  games[0].first=[zero(),zero()];
  games[0].second=[zero(),zero()];
  const bad=games[1];
  bad.research={provider:'work-csv',source:'Flashscore',sourceId:'discrepancy59',
   sourceUrl:'https://www.flashscore.com.br/jogo/?mid=discrepancy59',
   importedAt:'2026-10-24T09:00:00Z',dateDiscrepancy:true,
   full:[st(2,18,7,5),st(1,14,5,6)]};
  const report=compareVenuePeriodSamples(data(games),fixture);
  expect(report.home).toMatchObject({recentCount:5,venueCount:4,excluded:1});
  expect(cell(report,'home','goals','second')).toMatchObject({valid:4,forMean:0});
 });
 it('jogo das duas equipes conta em cada perspectiva de mando sem duplicar dentro do clube',()=>{
  const m=match('same','2026-10-14','A','B');
  const report=compareVenuePeriodSamples(data([m,m]),fixture);
  expect(report.home).toMatchObject({venueCount:1,recentCount:2,excluded:1});
  expect(report.away).toMatchObject({venueCount:1,recentCount:2,excluded:1});
  expect(cell(report,'home','corners','first').valid).toBe(1);
  expect(cell(report,'away','corners','first').valid).toBe(1);
 });
});

import {describe,it,expect} from 'vitest';
import type {Data,Match,Stats} from './model';
import type {ScheduledFixture} from './calendar';
import type {OfficialCalendarItem} from './officialCalendar';
import {selectDailyGoodSignals} from './dailyGoodSignals';
import {resolveCalendarFixture} from './radarCalendarSelection';

const now=new Date('2026-10-25T15:00:00Z'); // noon in Brasilia
const s=(goals:number,shots:number,target:number,corners:number):Stats=>({
  goals,shots,target,corners,yellow:0,red:0
});
const zero=():Stats=>s(0,0,0,0);
const make=(id:string,date:string,home:string,away:string,high=true):Match=>({
  id,date,home,away,competition:'Liga fictícia 2026/27',
  first:[high?s(2,18,7,5):s(0,4,1,1),high?s(1,14,5,6):s(0,4,1,1)],
  second:[zero(),zero()]
});
const matches:Match[]=[
  ...Array.from({length:5},(_,i)=>make('home'+i,'2026-10-'+String(i+11).padStart(2,'0'),'h','op'+i)),
  ...Array.from({length:5},(_,i)=>make('away'+i,'2026-10-'+String(i+16).padStart(2,'0'),'opp'+i,'a'))
];
const data:Data={teams:[
  {id:'h',name:'Casa',color:'#334455'},
  {id:'a',name:'Fora',color:'#334455'},
  ...Array.from({length:5},(_,i)=>({id:'op'+i,name:'Op'+i,color:'#334455'})),
  ...Array.from({length:5},(_,i)=>({id:'opp'+i,name:'Opp'+i,color:'#334455'})),
],matches};
const fixture:ScheduledFixture={
 id:'official-game',date:'2026-10-25',time:'20:00',
 competition:'Liga fictícia 2026/27',home:'Casa',away:'Fora',
 sourceUrl:'https://www.cbf.com.br/futebol-brasileiro/jogos/liga/game'
};
const official=(f:ScheduledFixture=fixture):OfficialCalendarItem=>({
 fixture:f,verifiedAt:'2026-10-25',fresh:true
});
describe('As Boas do Dia — filtro estatístico conservador',()=>{
 it('seleciona apenas jogos de hoje, com horário oficial futuro e concordância V2/V3',()=>{
   const before=JSON.stringify(data);
   const result=selectDailyGoodSignals(data,[official()],now);
   expect(result).toMatchObject({
     date:'2026-10-25',checked:1,withAdequateHistory:1
   });
   expect(result.items).toHaveLength(1);
   const signals=result.items[0].signals;
   expect(signals.length).toBe(3);
   expect(signals.map(x=>x.id).sort()).toEqual([
     'goals-full-2.5','shots-full-24.5','target-full-7.5'
   ]);
   expect(signals.every(x=>x.direction==='Over'&&
     x.historicalSample===10&&x.leagueSample===10&&
     x.projection>x.line)).toBe(true);
   expect(JSON.stringify(data)).toBe(before);
   expect(resolveCalendarFixture(data,result.items[0].fixture)?.hasKickoffTime).toBe(true);
 });
 it('não transforma escanteios históricos em projeção V2/V3 inexistente',()=>{
   const result=selectDailyGoodSignals(data,[official()],now);
   expect(result.items[0].signals.some(s=>s.label==='Escanteios')).toBe(false);
 });
 it('ignora horários desconhecidos, expirados, fontes não oficiais e jogos não futuros',()=>{
   const cases:OfficialCalendarItem[]=[
     official({...fixture,time:null}),
     official({...fixture,time:'11:59'}),
     official({...fixture,date:'2026-10-26'}),
     official({...fixture,sourceUrl:'https://malicious.example.net/games'}),
     {...official(),fresh:false},
     {...official(),verifiedAt:'2026-10-22'},
     {...official(),verifiedAt:'2026-10-26'},
   ];
   for(const entry of cases){
     const r=selectDailyGoodSignals(data,[entry],now);
     expect(r.items).toEqual([]);
     expect(r.checked).toBe(0);
   }
 });
 it('não recomenda jogos se falta histórico suficiente ou a equipe não pertence à competição',()=>{
   const r=selectDailyGoodSignals({...data,matches:matches.slice(0,3)},[official()],now);
   expect(r.checked).toBe(1);
   expect(r.withAdequateHistory).toBe(0);
   expect(r.items).toEqual([]);
   expect(selectDailyGoodSignals(data,[official({
     ...fixture,competition:'Liga fictícia 2025/26'
   })],now).items).toEqual([]);
 });
 it('não utiliza partidas do dia, de outra temporada nem depois da data para escolher sinais',()=>{
   const next=[...matches,
    make('today','2026-10-25','h','a',false),
    make('future','2026-10-29','h','a',false),
    {...make('past-other','2026-10-10','h','a',false),
      competition:'Liga fictícia 2025/26'}
   ];
   const r=selectDailyGoodSignals({...data,matches:next},[official()],now);
   expect(r.items[0].signals.map(x=>x.id).sort()).toEqual(
     selectDailyGoodSignals(data,[official()],now).items[0].signals.map(x=>x.id).sort()
   );
 });
 it('não duplica o mesmo jogo e não produz percentual de acerto ou odds',()=>{
   const r=selectDailyGoodSignals(data,[official(),official({...fixture,id:'different-id'})],now);
   expect(r.checked).toBe(1);
   expect(r.items).toHaveLength(1);
   expect(Object.keys(r.items[0].signals[0])).not.toContain('winProbability');
   expect(Object.keys(r.items[0].signals[0])).not.toContain('odds');
 });
 it('expõe motivo por campeonato sem transformar jogos posteriores em indicação',()=>{
   const entries=[
     official(),
     official({...fixture,id:'outro-dia',date:'2026-10-26'}),
     {...official({...fixture,id:'vencido',home:'Outra casa',time:null}),fresh:false},
     official({...fixture,id:'sem-historico',home:'Time sem jogos'}),
   ];
   const original=JSON.stringify(entries);
   const r=selectDailyGoodSignals(data,entries,now);
   expect(r.checked).toBe(2);
   expect(r.items).toHaveLength(1);
   expect(r.readiness).toEqual([{
     competition:'Liga fictícia 2026/27',scheduledFuture:4,needsRecheck:1,
     otherDates:1,todayVerified:2,insufficientHistory:1,
     noConsistentSignal:0,qualified:1,featured:1
   }]);
   expect(JSON.stringify(entries)).toBe(original);
 });
 it('mostra N/D de elegibilidade com fonte vencida e não calcula desempenho',()=>{
   const r=selectDailyGoodSignals(data,[{...official(),fresh:false}],now);
   expect(r.items).toEqual([]);
   expect(r.readiness[0]).toMatchObject({
     scheduledFuture:1,needsRecheck:1,todayVerified:0,qualified:0,featured:0
   });
   expect(JSON.stringify(r)).not.toContain('winProbability');
   expect(JSON.stringify(r)).not.toContain('hitRate');
 });
 it('não recomenda quando o algoritmo não emite sinais',()=>{
   // Three games above and two below each line at BOTH venues. Neither
   // direction satisfies the strict V3 agreement checks.
   const mixed={...data,matches:matches.map((m,i)=>({
     ...m,
     first:i%5<3?m.first:[s(0,4,1,1),s(0,4,1,1)] as [Stats,Stats]
   }))};
   const r=selectDailyGoodSignals(mixed,[official()],now);
   expect(r.items).toEqual([]);
   expect(r.checked).toBe(1);
   expect(r.readiness[0]).toMatchObject({todayVerified:1,noConsistentSignal:1,qualified:0});
 });
});

import {describe,expect,it} from 'vitest';
import type {Data,Match,Stats} from './model';
import type {OfficialCalendarItem} from './officialCalendar';
import {nextGoodPreparationQueue} from './dailyGoodNextWeek';

const at=new Date('2026-10-25T15:00:00.000Z');
const s=(n:number):Stats=>({goals:n,shots:10,target:4,corners:5,yellow:0,red:0});
const matches:Match[]=[
 ...Array.from({length:5},(_,i)=>({
  id:'mandante-'+i,date:'2026-10-'+String(i+10).padStart(2,'0'),
  competition:'La Liga espanhola 2026/27',home:'barca',away:'opp'+i,
  first:[s(2),s(1)] as [Stats,Stats],second:[s(0),s(0)] as [Stats,Stats]
 })),
 ...Array.from({length:5},(_,i)=>({
  id:'visitante-'+i,date:'2026-10-'+String(i+16).padStart(2,'0'),
  competition:'La Liga espanhola 2026/27',home:'visitor'+i,away:'alaves',
  first:[s(1),s(2)] as [Stats,Stats],second:[s(0),s(0)] as [Stats,Stats]
 }))
];
const data:Data={
 teams:[{id:'barca',name:'Barcelona',color:'#334455'},
  {id:'alaves',name:'Deportivo Alavés',color:'#556677'},
  ...Array.from({length:5},(_,i)=>({id:'opp'+i,name:'Opp '+i,color:'#334455'})),
  ...Array.from({length:5},(_,i)=>({id:'visitor'+i,name:'Visitor '+i,color:'#334455'}))],
 matches
};
const official=(date='2026-10-31',time:string|null='17:00'):OfficialCalendarItem=>({
 fixture:{id:'match-'+date,date,time,home:'FC Barcelona',away:'Deportivo Alavés',
  competition:'La Liga espanhola 2026/27',
  sourceUrl:'https://www.laliga.com/clubes/fc-barcelona/proximos-partidos'},
 verifiedAt:'2026-10-25',fresh:true
});
describe('Etapa 48 — preparar os sete dias sem criar As Boas antecipadamente',()=>{
 it('mostra prévia por histórico da mesma liga e não gera sinal ou previsão',()=>{
  const a=official();const before=JSON.stringify({data,a});
  const q=nextGoodPreparationQueue(data,[a],at);
  expect(q).toMatchObject({dateFrom:'2026-10-25',dateThrough:'2026-11-01',
   preview:1,needsHistory:0,needsRecheck:0,conflicts:0,
   entries:[{state:'preview',homeCount:5,awayCount:5}]});
  expect(Object.keys(q.entries[0])).not.toContain('signals');
  expect(Object.keys(q.entries[0])).not.toContain('winProbability');
  expect(JSON.stringify({data,a})).toBe(before);
 });
 it('recusa fonte vencida e horário N/D, sem inventar horário',()=>{
  const stale={...official(),fresh:false,fixture:{...official().fixture,time:null}};
  const q=nextGoodPreparationQueue(data,[stale],at);
  expect(q).toMatchObject({preview:0,needsRecheck:1,
   entries:[{state:'needs_recheck',homeCount:null,awayCount:null}]});
  const suspicious={...official(),fixture:{...official().fixture,
   sourceUrl:'https://www.laliga.com.evil.invalid/today'}};
  expect(nextGoodPreparationQueue(data,[suspicious],at).preview).toBe(0);
  expect(nextGoodPreparationQueue(data,[{...official(),verifiedAt:'2026-10-22'}],at)
   .needsRecheck).toBe(1);
 });
 it('não chama uma partida sem os cinco jogos anteriores de pronta',()=>{
  const insufficient={...data,matches:matches.slice(0,6)};
  const q=nextGoodPreparationQueue(insufficient,[official()],at);
  expect(q).toMatchObject({preview:0,needsHistory:1});
  expect(q.entries[0]).toMatchObject({homeCount:5,awayCount:1,
   state:'needs_history'});
 });
 it('um calendário oficial com horários incompatíveis bloqueia a prévia',()=>{
  const a=official(),b={...official(),
   fixture:{...official().fixture,id:'outro-id',time:'21:30',
    home:'Barcelona',away:'Deportivo Alavés'}};
  const q=nextGoodPreparationQueue(data,[a,b],at);
  expect(q).toMatchObject({conflicts:1,preview:0,entries:[{
   state:'conflict',homeCount:null,awayCount:null
  }]});
 });
 it('deduplica aliases apenas na mesma competição, sem adivinhar outra equipe',()=>{
  const a=official(),b={...official(),
   fixture:{...official().fixture,id:'idem',home:'Barcelona'}};
  expect(nextGoodPreparationQueue(data,[a,b],at).entries).toHaveLength(1);
  const other={...a,fixture:{...a.fixture,id:'outra-liga',
   competition:'La Liga espanhola 2025/26'}};
  expect(nextGoodPreparationQueue(data,[a,other],at).entries).toHaveLength(2);
 });
 it('não insere jogos de hoje, passados, fora de sete dias ou data inválida',()=>{
  const q=nextGoodPreparationQueue(data,[
   official('2026-10-24'),official('2026-10-25'),
   official('2026-11-02'),official('2026-10-99')
  ],at);
  expect(q.entries).toHaveLength(0);
 });
 it('ordena prévias antes dos impedimentos, mas mantém jogos sem histórico na agenda',()=>{
  const old={...official('2026-10-26'),fresh:false,
   fixture:{...official('2026-10-26').fixture,time:null}};
  const qualified=official('2026-10-31');
  const extra={...qualified,fixture:{...qualified.fixture,id:'sem-historico',
   home:'Sem história',away:'Outro clube'}};
  const q=nextGoodPreparationQueue(data,[old,extra,qualified],at);
  expect(q).toMatchObject({preview:1,needsHistory:1,needsRecheck:1});
  expect(q.entries[0]).toMatchObject({state:'preview'});
 });
});

import {describe,expect,it} from 'vitest';
import type {Data,Match,Stats} from './model';
import type {ScheduledFixture} from './calendar';
import type {OfficialCalendarItem} from './officialCalendar';
import {scanDailyFixturePatterns,selectDailyPatterns} from './dailyPatternSignals';

const s=(goals:number,shots:number,target:number,corners:number):Stats=>({
 goals,shots,target,corners,yellow:null,red:null
});
const fixture:ScheduledFixture={
 id:'game-future',home:'Casa',away:'Fora',
 date:'2026-10-29',time:'21:00',
 competition:'Liga de teste 2026/27',
 sourceUrl:'https://www.cbf.com.br/jogo'
};
const official=(x:ScheduledFixture=fixture):OfficialCalendarItem=>({
 fixture:x,verifiedAt:'2026-10-29',fresh:true
});
const clock=new Date('2026-10-29T15:00:00.000Z');
const teams=[{id:'h',name:'Casa',color:'#fff'},{id:'a',name:'Fora',color:'#fff'}];
const matches:Match[]=[];
for(let i=0;i<10;i++){
 const date='2026-10-'+String(i+1).padStart(2,'0');
 const homeCorners=i===0?2:6,awayConceded=i<2?2:6;
 const oh='oh'+i,oa='oa'+i;
 teams.push({id:oh,name:'Adversário H'+i,color:'#fff'});
 teams.push({id:oa,name:'Adversário A'+i,color:'#fff'});
 matches.push({
  id:'home-'+i,home:'h',away:oh,date,competition:fixture.competition,
  first:[s(1,9,3,Math.floor(homeCorners/2)),s(0,5,2,i%2?2:0)],
  second:[s(0,8,3,Math.ceil(homeCorners/2)),s(1,6,2,0)]
 });
 matches.push({
  id:'away-'+i,home:oa,away:'a',date,competition:fixture.competition,
  first:[s(0,9,3,Math.floor(awayConceded/2)),s(0,5,2,i%2?2:0)],
  second:[s(1,8,3,Math.ceil(awayConceded/2)),s(0,6,2,0)]
 });
}
const data:Data={teams,matches};
describe('Radar Inteligente de Padrões — experimental/sem odds',()=>{
 it('detecta escanteios com 10 jogos, valida último 5 e comportamento adversário',()=>{
  const c=scanDailyFixturePatterns(data,fixture);
  const corner=c.find(x=>x.metric==='corners');
  expect(corner).toBeDefined();
  expect(corner?.scope).toBe('home');
  expect(corner?.direction).toBe('Under');
  expect(corner?.line).toBe(6.5);
  expect(corner?.teamCount).toBe(10);
  expect(corner?.teamHits).toBe(10);
  expect(corner?.recentHits).toBe(5);
  expect(corner?.opponentCount).toBe(10);
  expect(corner?.opponentHits).toBe(10);
  expect(c.some(x=>x.metric==='goals')).toBe(true);
  expect(Object.keys(c[0])).not.toContain('winProbability');
  expect(Object.keys(c[0])).not.toContain('odds');
 });
 it('não usa confronto futuro, data do próprio confronto ou duplicação de fonte',()=>{
  const added={...matches[0],id:'future',date:'2026-10-29'};
  const dup={...matches[0],id:'duplicate-id'};
  const withFuture=scanDailyFixturePatterns({...data,matches:[...matches,added]},fixture);
  expect(withFuture).toEqual(scanDailyFixturePatterns(data,fixture));
  const withDup=scanDailyFixturePatterns({...data,matches:[...matches,dup]},fixture);
  expect(withDup.find(x=>x.metric==='corners')?.teamCount).toBe(9);
 });
 it('fonte vencida, jogo sem horário e divergência bloqueiam todos os sinais',()=>{
  expect(selectDailyPatterns(data,[official()],clock).verified).toBe(1);
  expect(selectDailyPatterns(data,[official()],clock).items.length).toBe(1);
  expect(selectDailyPatterns(data,[{...official(),fresh:false}],clock).items).toEqual([]);
  expect(selectDailyPatterns(data,[official({...fixture,time:null})],clock).items).toEqual([]);
  expect(selectDailyPatterns(data,[official(),official({...fixture,time:'22:00'})],clock).items).toEqual([]);
  expect(selectDailyPatterns(data,[official({...fixture,time:'11:00'})],clock).items).toEqual([]);
  expect(selectDailyPatterns(data,[official({...fixture,sourceUrl:'http://unsafe.test'})],clock).items).toEqual([]);
 });
 it('não finge 85% em dez jogos e abstém-se com histórico insuficiente',()=>{
  const r=scanDailyFixturePatterns({...data,matches:matches.slice(0,10)},fixture);
  expect(r).toEqual([]);
  const c=scanDailyFixturePatterns(data,fixture);
  for(const item of c){
   expect(item.teamHits/item.teamCount).toBeGreaterThanOrEqual(.8);
   expect(item.recentHits/item.recentCount).toBeGreaterThanOrEqual(.8);
   expect(item.opponentHits/item.opponentCount).toBeGreaterThanOrEqual(.6);
   expect(item.line%1).toBe(.5);
  }
 });
});

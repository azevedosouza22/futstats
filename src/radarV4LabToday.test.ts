import {describe,expect,it} from 'vitest';
import type {Data,Match,Stats} from './model';
import type {ScheduledFixture} from './calendar';
import {analyzeV4Fixture,analyzeV4Day} from './radarV4LabToday';
import {freezeV4Report,readV4Frozen,RADAR_V4_LAB_STORAGE} from './radarV4LabFrozen';
import type {OfficialCalendarItem} from './officialCalendar';

const s=(goals:number,shots:number,target:number,corners:number):Stats=>
 ({goals,shots,target,corners,yellow:null,red:null});
const teams=[
 {id:'home',name:'Corinthians',color:'#333333'},
 {id:'away',name:'Mirassol',color:'#44aa55'},
 {id:'third',name:'Outro',color:'#999999'}
];
const competition='Brasileirão Série A 2026';
function match(id:string,date:string,home:string,away:string,huge=false):Match{
 const first:[Stats,Stats]=[s(1,8,3,3),s(0,7,2,2)];
 const second:[Stats,Stats]=[s(1,9,3,3),s(1,8,2,2)];
 const full:[Stats,Stats]=[s(2,17,6,6),s(1,15,4,4)];
 if(huge)full[0].shots=100; // May only appear on or after the fixture date.
 return {id,competition,date,home,away,first,second,research:{
  source:'Flashscore',provider:'work-csv',sourceId:id,sourceUrl:'https://www.flashscore.com.br/jogo/futebol/x/?mid='+id,
  importedAt:'2026-10-29T00:00:00Z',full,dateDiscrepancy:false
 }};
}
function data():Data{
 const matches:Match[]=[];
 for(let i=1;i<=5;i++){
  const day=String(i).padStart(2,'0');
  matches.push(match('H'+i,'2026-10-'+day,'home','third'));
  matches.push(match('A'+i,'2026-10-'+day,'third','away'));
 }
 return {teams,matches};
}
const fixture:ScheduledFixture={id:'official-test-20261030',competition:'Brasileirão Série A',
 date:'2026-10-30',time:'20:00',home:'Corinthians',away:'Mirassol',
 sourceUrl:'https://www.cbf.com.br/futebol-brasileiro/jogos/test'};
const reference:OfficialCalendarItem={fixture,verifiedAt:'2026-10-29',fresh:true};

describe('V4 day laboratory — chronological, isolated and conservative',()=>{
 it('reproduces fixed V4 line selection in the 3 periods without outcomes',()=>{
  const r=analyzeV4Fixture(data(),fixture);
  expect(r.status).toBe('ready');
  expect(r.competition).toBe(competition);
  expect(r.historyIds).toHaveLength(10);
  expect(r.picks).toHaveLength(12);
  expect(r.picks.find(x=>x.period==='full'&&x.metric==='shots'))
   .toMatchObject({line:26.5,overs:10,observed:10,reason:'qualified'});
  expect(r.picks.find(x=>x.period==='first'&&x.metric==='goals'))
   .toMatchObject({line:0.5,overs:10,reason:'qualified'});
 });
 it('excludes same-day and future rows, blocks insufficient history',()=>{
  const d=data();
  d.matches.push(match('BAD_TODAY','2026-10-30','home','away',true));
  d.matches.push(match('BAD_FUTURE','2026-11-01','home','away',true));
  const r=analyzeV4Fixture(d,fixture);
  expect(r.historyIds).not.toContain('BAD_TODAY');
  expect(r.historyIds).not.toContain('BAD_FUTURE');
  expect(r.picks.find(x=>x.metric==='shots'&&x.period==='full')?.mean).toBe(32);
  const short=analyzeV4Fixture({teams,dmatches:[] as never} as unknown as Data,fixture);
  expect(short.status).toBe('unresolved');
 });
 it('does not duplicate the same agenda fixture and does not guess identity',()=>{
  expect(analyzeV4Day(data(),[fixture,fixture],'2026-10-30')).toHaveLength(1);
  const miss=analyzeV4Fixture(data(),{...fixture,away:'Clube diferente'});
  expect(miss.status).toBe('unresolved');
 });
 it('stores frozen V4 records only with fresh pre-kickoff source and never overwrites',()=>{
  const report=analyzeV4Fixture(data(),fixture);
  const now=new Date('2026-10-30T14:00:00Z'); // 11:00 in Brasilia
  const frozen=freezeV4Report(null,report,reference,now);
  expect(frozen).toHaveLength(1);
  expect(frozen[0].picks).toHaveLength(12);
  expect(frozen[0].origin).toBe('v4-lab-experimental');
  expect(RADAR_V4_LAB_STORAGE).not.toMatch(/radar-v2|radar-v3|backup/);
  expect(readV4Frozen(JSON.stringify(frozen))).toHaveLength(1);
  expect(()=>freezeV4Report(JSON.stringify(frozen),report,reference,now)).toThrow(/já possui/);
  expect(()=>freezeV4Report(null,report,{...reference,fresh:false},now)).toThrow(/agenda recente/);
  expect(()=>freezeV4Report(null,report,reference,new Date('2026-10-30T23:30:00Z'))).toThrow(/antes do jogo/);
 });
});

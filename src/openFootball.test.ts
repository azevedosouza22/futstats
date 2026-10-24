import {describe,expect,it} from 'vitest';
import {parseFreePremier,freePremierCoverage} from './openFootball';
const name='English Premier League 2026/27';
const rows=[
 {round:'Matchday 1',date:'2026-08-21',time:'20:00',team1:'Arsenal',team2:'Coventry',score:{ft:[2,1],ht:[1,0]}},
 {round:'Matchday 2',date:'2026-09-20',time:'15:00',team1:'Chelsea',team2:'Everton',score:[0,0]},
 {round:'Matchday 3',date:'2026-10-25',time:'14:00',team1:'Everton',team2:'Arsenal'},
];
describe('OpenFootball read-only pilot',()=>{
 it('accepts only score.ft as a final score, not bare [0,0]',()=>{
  const c=parseFreePremier({name,matches:rows});
  expect(c.fixtures).toHaveLength(3);expect(c.clubs).toBe(4);
  expect(c.fixtures[0].fullTime).toEqual([2,1]);
  expect(c.fixtures[1].fullTime).toBeNull();
  expect(c.fixtures[2].fullTime).toBeNull();
  expect(c.ftCount).toBe(1);expect(c.lastScoreDate).toBe('2026-08-21');
  expect(freePremierCoverage(c,'2026-10-21')).toMatchObject({past:2,missingPast:1,future:1});
 });
 it('rejects other seasons, duplicates, impossible date or FT',()=>{
  expect(()=>parseFreePremier({name:'Bundesliga',matches:rows})).toThrow();
  expect(()=>parseFreePremier({name,matches:[rows[0],rows[0]]})).toThrow();
  expect(()=>parseFreePremier({name,matches:[{...rows[0],date:'2026-02-30'}]})).toThrow();
  expect(()=>parseFreePremier({name,matches:[{...rows[0],score:{ft:[-1,0]}}]})).toThrow();
 });
});

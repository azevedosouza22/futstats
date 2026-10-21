import {describe,it,expect} from 'vitest';
import {parseFplPilot,parseCsv,crossCheckFpl} from './fplFreePilot';
const teams='code,name\n3,Arsenal\n9,Coventry City\n';
const header='gameweek,kickoff_time,home_team,away_team,home_score,away_score,finished,match_id,home_total_shots,away_total_shots,home_shots_on_target,away_shots_on_target,home_corners,away_corners,stats_processed';
describe('FPL Core experimental: strict and readonly',()=>{
 it('handles quoted CSV and line endings',()=>{
  expect(parseCsv('a,b\r\n"x,y",2\r\n')).toEqual([{a:'x,y',b:'2'}]);
 });
 it('rejects 7-round input without 20 verified teams',()=>{
  expect(()=>parseFplPilot(teams,Array(7).fill(header+'\n'))).toThrow();
 });
 it('matches another score source only for explicit final results',()=>{
  const games=[{id:'abc',gw:1,date:'2026-08-21',sourceKickoff:'2026-08-21T19:00:00',
   home:'Arsenal',away:'Coventry City',goals:[3,0] as [number,number],
   shots:[20,4] as [number,number],onTarget:[6,1] as [number,number],corners:[8,2] as [number,number]}];
  expect(crossCheckFpl(games,{matches:[
   {date:'2026-08-21',team1:'Arsenal FC',team2:'Coventry City FC',score:{ft:[3,0]}},
   {date:'2026-08-22',team1:'Arsenal FC',team2:'Chelsea FC',score:[0,0]},
  ]})).toEqual({compared:1,agreed:1,disagreed:0,notLocated:0});
 });
});

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

 it('shows 70 reported games, distinguishing one pending provider record',()=>{
  const allTeams='code,name\n'+Array.from({length:20},(_,i)=>(i+1)+',Team '+(i+1)).join('\n')+'\n';
  const rounds=Array.from({length:7},(_,n)=>{
    const gw=n+1;
    const rows=Array.from({length:10},(_,j)=>{
      const pending=gw===1&&j===0;
      return [gw,'2026-08-21T19:00:00',j+1,(j+11),2,1,'True',
        '26-27-prem-gw-'+gw+'-fixture-'+j,14,11,5,4,7,6,pending?'False':'True'].join(',');
    });
    return header+'\n'+rows.join('\n')+'\n';
  });
  const games=parseFplPilot(allTeams,rounds);
  expect(games).toHaveLength(70);
  expect(games.filter(g=>g.sourceStatsProcessed)).toHaveLength(69);
  expect(games.filter(g=>!g.sourceStatsProcessed)).toHaveLength(1);
  expect(games.find(g=>!g.sourceStatsProcessed)?.goals).toEqual([2,1]);
 });

 it('accepts the eighth finished round without changing the first seven',()=>{
   const allTeams='code,name\n'+Array.from({length:20},(_,i)=>(i+1)+',Team '+(i+1)).join('\n')+'\n';
   const rounds=Array.from({length:8},(_,n)=>{
     const gw=n+1;
     return header+'\n'+Array.from({length:10},(_,j)=>[
       gw,'2026-10-22T19:00:00',j+1,j+11,1,0,'True',
       '26-27-prem-gw-'+gw+'-fixture-'+j,12,9,5,3,4,6,'True'
     ].join(',')).join('\n')+'\n';
   });
   const games=parseFplPilot(allTeams,rounds);
   expect(games).toHaveLength(80);
   expect(games.filter(g=>g.gw===8)).toHaveLength(10);
   expect(games.filter(g=>g.gw<=7)).toHaveLength(70);
 });
 it('matches another score source only for explicit final results',()=>{
  const games=[{id:'abc',gw:1,date:'2026-08-21',sourceKickoff:'2026-08-21T19:00:00',
   home:'Arsenal',away:'Coventry City',goals:[3,0] as [number,number],
   shots:[20,4] as [number,number],onTarget:[6,1] as [number,number],corners:[8,2] as [number,number],sourceStatsProcessed:true}];
  expect(crossCheckFpl(games,{matches:[
   {date:'2026-08-21',team1:'Arsenal FC',team2:'Coventry City FC',score:{ft:[3,0]}},
   {date:'2026-08-22',team1:'Arsenal FC',team2:'Chelsea FC',score:[0,0]},
  ]})).toEqual({compared:1,agreed:1,disagreed:0,notLocated:0});
 });
});

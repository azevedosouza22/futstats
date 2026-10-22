import {describe,expect,it} from 'vitest';
import {discoverNewFplRounds,isCompleteFplRound} from './fplRoundDiscovery';
const header='gameweek,match_id,finished,stats_processed,home_score,away_score,home_total_shots,away_total_shots,home_shots_on_target,away_shots_on_target,home_corners,away_corners';
const round=(number:number,finished=true,pendingOne=false)=>
 header+'\n'+Array.from({length:10},(_,i)=>[
 number,'game-'+number+'-'+i,finished?'True':'False',
 pendingOne&&i===0?'False':'True',2,1,18,11,7,4,5,6
 ].join(',')).join('\n');
describe('descoberta automática de rodadas concluídas, sem dados estimados',()=>{
 it('does not count the 8th round if matches are still upcoming',async()=>{
  const baseline=Array.from({length:7},(_,i)=>round(i+1));
  const actual=await discoverNewFplRounds(baseline,async n=>n===8?round(8,false):null);
  expect(actual.completedCsvs).toHaveLength(7);
  expect(actual.lastCompleteRound).toBe(7);
  expect(actual.nextRoundPending).toBe(8);
  expect(actual.reason).toBe('partial');
 });
 it('adds complete round 8 and stops on incomplete round 9',async()=>{
  const baseline=Array.from({length:7},(_,i)=>round(i+1));
  const calls:number[]=[];
  const actual=await discoverNewFplRounds(baseline,async n=>{
   calls.push(n);
   return n===8?round(8,true,true):round(9,false);
  });
  expect(actual.completedCsvs).toHaveLength(8);
  expect(calls).toEqual([8,9]);
  expect(actual.lastCompleteRound).toBe(8);
  expect(actual.nextRoundPending).toBe(9);
 });
 it('does not mutate the caller baseline and rejects a duplicate / blank round',async()=>{
  const baseline=Array.from({length:7},(_,i)=>round(i+1));
  expect(isCompleteFplRound(round(8).replace('game-8-1','game-8-0'),8)).toBe(false);
  expect(isCompleteFplRound(round(8,false),8)).toBe(false);
  expect(isCompleteFplRound('gameweek,match_id\n8,test',8)).toBe(false);
  const result=await discoverNewFplRounds(baseline,async()=>null);
  expect(result.reason).toBe('missing');
  expect(baseline).toHaveLength(7);
  expect(result.completedCsvs).toHaveLength(7);
 });
});

import {describe,expect,it} from 'vitest';
import {discoverNewFplRounds,isCompleteFplRound,inspectNextFplRound} from './fplRoundDiscovery';
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


describe('acompanhar dez partidas da rodada seguinte sem importar ou inventar resultados',()=>{
 const teams='code,name\n'+Array.from({length:20},(_,i)=>[i+1,'Equipe '+(i+1)].join(',')).join('\n');
 const header2='gameweek,kickoff_time,home_team,away_team,match_id,finished,stats_processed,home_score,away_score,home_total_shots,away_total_shots,home_shots_on_target,away_shots_on_target,home_corners,away_corners';
 function gw8(){
  return header2+'\n'+Array.from({length:10},(_,i)=>{
   const score=i===1?['1.0','0.0']:['',''];
   const stats=i===1?['8.0','6.0','3.0','2.0','4.0','5.0']:Array(6).fill('');
   return [8,'2026-10-24T14:00:00',i+1,i+11,
    '26-27-prem-team-'+i+'-vs-other-'+i,i===1?'True':'False',
    i===1?'True':'False',...score,...stats].join(',');
  }).join('\n');
 }
 it('mostra os dez jogos; não transforma nove placares futuros vazios em 0×0',()=>{
  const out=inspectNextFplRound(gw8(),8,teams);
  expect(out).toHaveLength(10);
  expect(out.filter(x=>x.status==='a-jogar')).toHaveLength(9);
  const played=out.find(x=>x.status==='concluido');
  expect(played).toMatchObject({home:'Equipe 2',away:'Equipe 12',fullTime:[1,0]});
  expect(out.filter(x=>x.status==='a-jogar').every(x=>x.fullTime===null)).toBe(true);
 });
 it('identifica placar final com estatística ausente como em revisão, não como jogo concluído para importação',()=>{
  const a=gw8().replace('True,True,1.0,0.0,8.0','True,False,1.0,0.0,8.0');
  const out=inspectNextFplRound(a,8,teams);
  expect(out.filter(x=>x.status==='em-revisao')).toHaveLength(1);
  expect(out.filter(x=>x.status==='em-revisao')[0].fullTime).toEqual([1,0]);
 });
 it('rejeita rodada incompleta, duplicatas e times não identificados',()=>{
  const raw=gw8();
  expect(()=>inspectNextFplRound(raw.split('\n').slice(0,10).join('\n'),8,teams)).toThrow();
  expect(()=>inspectNextFplRound(raw.replace('26-27-prem-team-1-vs-other-1','26-27-prem-team-0-vs-other-0'),8,teams)).toThrow();
  expect(()=>inspectNextFplRound(raw.replace('2026-10-24T14:00:00','invalid'),8,teams)).toThrow();
  expect(()=>inspectNextFplRound(raw.replace('1,11,26-27-prem','99,11,26-27-prem'),8,teams)).toThrow();
 });
});

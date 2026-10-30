/** Radar V4 Lab, pilot 01 — isolated and reproducible historical experiment.
 * This is NOT Radar V2/V3, a profitability model, or user-facing app behavior.
 * Historical lines are chosen only from matches with strictly earlier dates.
 */
import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

type Score={goals:number;shots:number;target:number;corners:number};
type Game={
 id:string;date:string;round:string;home:string;away:string;
 first:[Score,Score];second:[Score,Score];
 research:{sourceId:string;dateDiscrepancy:boolean;sourceUrl:string;full:[Score,Score]};
};
type PilotRow={game:Game;sampleIds:string[];latestHistoryDate:string;
 chosen:number|null;fixed:number|null;totalShots:number};
const pack=JSON.parse(readFileSync(
 new URL('../public/research/packs/saudi_pro_league_2025_26.json',import.meta.url),'utf8'
)) as {format:string;competition:string;data:{teams:unknown[];matches:Game[]}};
const LINES=[20.5,22.5,24.5,26.5] as const;
const RATE=0.7;
const FIXED_LINE=24.5;
const HISTORY_SIZE=5;
const MIN_DISTINCT=8;
const VALIDATION_ROUNDS=new Set(Array.from({length:15},(_,i)=>20+i));
const matches=[...pack.data.matches].sort((a,b)=>a.date.localeCompare(b.date)||a.research.sourceId.localeCompare(b.research.sourceId));
const shotTotal=(m:Game)=>m.research.full[0].shots+m.research.full[1].shots;

function simulate():{rows:PilotRow[];excluded:string[]} {
 const rows:PilotRow[]=[];
 const excluded:string[]=[];
 for(const fixture of matches){
  if(!VALIDATION_ROUNDS.has(Number(fixture.round)))continue;
  // Same-day matches are NEVER accessible; neither is any future fixture.
  const history=matches.filter(m=>m.date<fixture.date);
  const lastFive=(teamId:string)=>history.filter(m=>m.home===teamId||m.away===teamId).slice(-HISTORY_SIZE);
  const home=lastFive(fixture.home);
  const away=lastFive(fixture.away);
  if(home.length<5||away.length<5){excluded.push(fixture.research.sourceId);continue;}
  // A shared previous head-to-head fixture must never count twice.
  const past=new Map([...home,...away].map(m=>[m.research.sourceId,m]));
  if(past.size<MIN_DISTINCT){excluded.push(fixture.research.sourceId);continue;}
  const totals=[...past.values()].map(shotTotal);
  const allowed=LINES.filter(line=>totals.filter(n=>n>line).length/totals.length>=RATE);
  const chosen=allowed.at(-1)??null;
  const fixed=totals.filter(n=>n>FIXED_LINE).length/totals.length>=RATE?FIXED_LINE:null;
  rows.push({game:fixture,sampleIds:[...past.keys()],
   latestHistoryDate:[...past.values()].map(m=>m.date).sort().at(-1)!,
   chosen,fixed,totalShots:shotTotal(fixture)});
 }
 return {rows,excluded};
}

describe('Radar V4 Lab / piloto 01 — pré-jogo estritamente cronológico, somente pesquisa',()=>{
 it('preserva o catálogo e confere os três períodos e identificadores',()=>{
  expect(pack.format).toBe('futstats-research-season-v1');
  expect(pack.competition).toBe('Saudi Pro League 2025/26');
  expect(pack.data.teams).toHaveLength(18);
  expect(matches).toHaveLength(306);
  expect(new Set(matches.map(m=>m.research.sourceId)).size).toBe(306);
  expect(new Set(matches.map(m=>m.round)).size).toBe(34);
  for(const m of matches){
   expect(m.research.dateDiscrepancy).toBe(false);
   for(const side of [0,1] as const){
    for(const metric of ['goals','shots','target','corners'] as const)
     expect(m.first[side][metric]+m.second[side][metric]).toBe(m.research.full[side][metric]);
    for(const period of [m.first,m.second,m.research.full])
     expect(period[side].target).toBeLessThanOrEqual(period[side].shots);
   }
  }
 });
 it('não usa confrontos futuros, contemporâneos nem duplicados e produz a referência congelada',()=>{
  const {rows,excluded}=simulate();
  expect(rows).toHaveLength(135);  // 15 rounds × 9 games
  expect(excluded).toHaveLength(0);
  for(const r of rows){
   expect(r.sampleIds.length).toBeGreaterThanOrEqual(MIN_DISTINCT);
   expect(new Set(r.sampleIds).size).toBe(r.sampleIds.length);
   expect(r.latestHistoryDate<r.game.date).toBe(true);
   expect(r.sampleIds).not.toContain(r.game.research.sourceId);
  }
  const selected=rows.filter(r=>r.chosen!==null);
  const fixed=rows.filter(r=>r.fixed!==null);
  const adaptiveHits=selected.filter(r=>r.totalShots>r.chosen!).length;
  const fixedHits=fixed.filter(r=>r.totalShots>FIXED_LINE).length;
  const alwaysOver24=rows.filter(r=>r.totalShots>FIXED_LINE).length;
  const alwaysOver22=rows.filter(r=>r.totalShots>22.5).length;
  const byLine=Object.fromEntries(LINES.map(line=>[String(line),selected.filter(r=>r.chosen===line).length]));
  expect({selected:selected.length,adaptiveHits,fixedSignals:fixed.length,fixedHits,alwaysOver24,alwaysOver22,byLine})
   .toEqual({
    selected:110,adaptiveHits:78,fixedSignals:23,fixedHits:14,
    alwaysOver24:66,alwaysOver22:81,
    byLine:{'20.5':55,'22.5':32,'24.5':18,'26.5':5}
   });
  const example=rows.find(r=>r.game.research.sourceId==='Slm1KII5');
  expect(example).toMatchObject({chosen:20.5,totalShots:29});
 });
});
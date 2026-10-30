/** Radar V4 Lab pilot 02 — 2 last eligible fixtures per league, 4 markets.
 * No app changes, no storage writes, no future/current-date data in predictions.
 * Descriptive demo, NOT V2/V3, NOT a calibrated model, NOT betting advice.
 */
import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {parseResearchCatalog} from './researchCatalog';
import {mergeResearchPacks,parseResearchPackManifest} from './researchPacks';
import {applyBrazilResearchDateReview} from './brazilResearchReview';
import type {Match} from './model';

const source=(path:string)=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const baseline=parseResearchCatalog(source('../public/research/partidas-work-951-v1.json'),
 readFileSync(new URL('../public/research/partidas-work-extras-68-v1.txt',import.meta.url),'utf8'));
const entries=parseResearchPackManifest(source('../public/research/packs/manifest-v1.json'));
const packs=entries.map(entry=>source('../public/research/packs/'+entry.file));
const data=applyBrazilResearchDateReview(mergeResearchPacks(baseline,entries,packs),
 source('../public/research/brasileirao-2026-review-20261029.json')).data;
const leagues=[
 'Brasileirão Série A 2026','Bundesliga 2025/26',
 'Premier League inglesa 2025/26','La Liga espanhola 2025/26',
 'Serie A italiana 2025/26','Ligue 1 francesa 2025/26',
 'Liga Portugal 2025/26','Saudi Pro League 2025/26'
] as const;
type Key='shots'|'corners'|'target'|'goals';
const LINES:Record<Key,readonly number[]>={
 shots:[20.5,22.5,24.5,26.5],
 corners:[6.5,7.5,8.5,9.5],
 target:[5.5,6.5,7.5,8.5],
 goals:[1.5,2.5,3.5]
};
const KEYS=Object.keys(LINES) as Key[];
const value=(m:Match,k:Key)=>m.research!.full[0][k]!+m.research!.full[1][k]!;
type Signal={line:number|null;actual:number;hit:boolean|null};
type Row={league:string;id:string;date:string;home:string;away:string;
 history:Match[];game:Match;signals:Record<Key,Signal>};

function runPilot():Row[]{
 const rows:Row[]=[];
 for(const league of leagues){
  const games=data.matches.filter(m=>m.competition===league&&m.research)
   .sort((a,b)=>a.date.localeCompare(b.date)||a.research!.sourceId.localeCompare(b.research!.sourceId));
  const selected:Row[]=[];
  for(const game of [...games].reverse()){
   if(game.date>'2026-10-29')continue;
   const old=games.filter(m=>m.date<game.date); // Never use same day or future
   const last=(id:string)=>old.filter(m=>m.home===id||m.away===id).slice(-5);
   const h=last(game.home),a=last(game.away);
   const history=[...new Map([...h,...a].map(m=>[m.research!.sourceId,m])).values()];
   if(h.length<5||a.length<5||history.length<8)continue;
   const signals={} as Record<Key,Signal>;
   for(const key of KEYS){
    const historical=history.map(m=>value(m,key));
    const allowed=LINES[key].filter(line=>
     historical.filter(actual=>actual>line).length/history.length>=0.7);
    const line=allowed.at(-1)??null;
    const actual=value(game,key);
    signals[key]={line,actual,hit:line===null?null:actual>line};
   }
   selected.push({league,id:game.research!.sourceId,date:game.date,
    home:game.home,away:game.away,history,game,signals});
   if(selected.length===2)break;
  }
  expect(selected).toHaveLength(2);
  rows.push(...selected);
 }
 return rows;
}
const selectedIds=[
 'WpKydlll','UsHUp3Ok','vZDAV22t','rXgzQbWH',
 'zLXUefTr','xQXUa3UG','pldfXLVi','x8S221WH',
 'zqzJHR0D','Yw2qYnof','xbwdLg87','r1cGQTSk',
 'vcpi6FQp','UoaZIhAj','W8jQ8VCN','trxd39zo'
];
const expected={
 shots:{signals:12,correct:10,wrong:2,abstained:4},
 corners:{signals:15,correct:12,wrong:3,abstained:1},
 target:{signals:15,correct:11,wrong:4,abstained:1},
 goals:{signals:15,correct:14,wrong:1,abstained:1}
} as const;

describe('Radar V4 Lab / piloto 02 — 8 ligas × 2 jogos × 4 mercados',()=>{
 it('preserva 3.260 jogos de pesquisa e escolhe exatamente 2 jogos por liga sem resultados futuros',()=>{
  expect(data.matches).toHaveLength(3260);
  const rows=runPilot();
  expect(rows).toHaveLength(16);
  expect(rows.map(x=>x.id)).toEqual(selectedIds);
  for(const row of rows){
   expect(row.history.length).toBeGreaterThanOrEqual(8);
   expect(row.history.length).toBeLessThanOrEqual(10);
   expect(new Set(row.history.map(m=>m.research!.sourceId)).size).toBe(row.history.length);
   expect(row.history.every(m=>m.date<row.date)).toBe(true);
   expect(row.history.some(m=>m.research!.sourceId===row.id)).toBe(false);
  }
 });
 it('retém os resultados completos — 47 acertos, 10 erros, 7 abstenções',()=>{
  const rows=runPilot();
  for(const metric of KEYS){
   const signals=rows.map(x=>x.signals[metric]);
   expect({
    signals:signals.filter(x=>x.line!==null).length,
    correct:signals.filter(x=>x.hit===true).length,
    wrong:signals.filter(x=>x.hit===false).length,
    abstained:signals.filter(x=>x.line===null).length
   }).toEqual(expected[metric]);
  }
 });
});

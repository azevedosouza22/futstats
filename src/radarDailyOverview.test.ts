import {describe,it,expect} from 'vitest';
import type {Data,Stats,Match} from './model';
import type {ScheduledFixture} from './calendar';
import {buildRadarDailyOverview,DAILY_INDICATORS} from './radarDailyOverview';

const s=(goals:number,shots:number,target:number|null,corners:number|null):Stats=>
  ({goals,shots,target,corners,yellow:0,red:0});
const zero=():Stats=>s(0,0,0,0);
const match=(id:string,date:string,home:string,away:string,corners:number|null,
  competition='Bundesliga 2026/27'):Match=>({
    id,date,home,away,competition,
    first:[s(1,15,5,corners),s(1,11,3,corners)],second:[zero(),zero()],
  });
const fixture:ScheduledFixture={
  id:'fixture-25',date:'2026-10-25',time:'18:30',
  competition:'Bundesliga 2026/27',home:'Casa',away:'Fora',
  sourceUrl:'https://example.com/fixture',
};
const matches=[
  match('h1','2026-10-11','h','third1',3),
  match('h2','2026-10-12','h','third2',4),
  match('h3','2026-10-13','h','third3',5),
  match('a1','2026-10-14','fourth1','a',3),
  match('a2','2026-10-15','fourth2','a',4),
  match('a3','2026-10-16','fourth3','a',5),
];
const data:Data={
  teams:[
    {id:'h',name:'Casa',color:'#000'},
    {id:'a',name:'Fora',color:'#111'},
    ...['third1','third2','third3','fourth1','fourth2','fourth3']
      .map(name=>({id:name,name,color:'#333'})),
  ],
  matches,
};
describe('Resumo diário do Radar',()=>{
  it('mostra exatamente quatro indicadores, incluindo escanteios e amostras',()=>{
    const original=JSON.stringify(data);
    const result=buildRadarDailyOverview(data,fixture);
    expect(result?.indicators.map(m=>m.id)).toEqual(DAILY_INDICATORS.map(m=>m.id));
    expect(result?.homeCount).toBe(3);
    expect(result?.awayCount).toBe(3);
    const corners=result!.indicators.find(m=>m.name==='Escanteios')!;
    expect(corners.historicalSample).toBe(6);
    expect(corners.leagueSample).toBe(6);
    expect(corners.historicalMean).toBe(8);
    expect(corners.projectedTotal).toBeNull();
    expect(corners.v2).toBeNull();
    expect(corners.v3).toBeNull();
    const shots=result!.indicators.find(m=>m.name==='Finalizações')!;
    expect(shots.projectedTotal).not.toBeNull();
    expect(shots.v2).not.toBeNull();
    expect(JSON.stringify(data)).toBe(original);
  });
  it('desconsidera jogos da própria data, futuros e de outra temporada',()=>{
    const supplement=[
      match('future','2026-10-25','h','a',100),
      match('after','2026-10-26','h','a',100),
      match('old','2026-10-07','h','a',100,'Bundesliga 2025/26'),
    ];
    const result=buildRadarDailyOverview({...data,matches:[...data.matches,...supplement]},fixture)!;
    const corners=result.indicators.find(m=>m.name==='Escanteios')!;
    expect(corners.leagueSample).toBe(6);
    expect(corners.leagueMean).toBe(8);
    expect(corners.historicalSample).toBe(6);
  });
  it('mantém N/D se um indicador não tem dados numéricos completos',()=>{
    const noCorner={...data,matches:matches.map(m=>({
      ...m,first:m.first.map(x=>({...x,corners:null})) as [Stats,Stats],
    }))};
    const result=buildRadarDailyOverview(noCorner,fixture)!;
    const corners=result.indicators.find(m=>m.name==='Escanteios')!;
    expect(corners.historicalMean).toBeNull();
    expect(corners.historicalSample).toBe(0);
    expect(corners.leagueMean).toBeNull();
    expect(corners.leagueSample).toBe(0);
  });
  it('não inventa jogos de agenda nem resolve clube de campeonato errado',()=>{
    expect(buildRadarDailyOverview(data,{...fixture,competition:'Premier League 2026/27'})).toBeNull();
    expect(buildRadarDailyOverview(data,{...fixture,away:'Clube Desconhecido'})).toBeNull();
  });
});

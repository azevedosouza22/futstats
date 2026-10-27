import {describe,it,expect} from 'vitest';
import type {Data,Match,Stats} from './model';
import {
 analyzeFourLenses,previousSeasonCompetition,FOUR_LENS_LINES
} from './radarFourLenses';

const current='Bundesliga 2026/27',previous='Bundesliga 2025/26';
const fixture={home:'H',away:'S',date:'2026-11-08',competition:current};
const st=(shots:number):Stats=>({
  goals:0,shots,target:0,corners:0,yellow:0,red:0
});
function game(id:string,date:string,competition:string,home:string,away:string,total:number):Match{
 const a=Math.floor(total/2),b=total-a;
 return {id,date,competition,home,away,
   first:[st(Math.floor(a/2)),st(Math.floor(b/2))],
   second:[st(a-Math.floor(a/2)),st(b-Math.floor(b/2))]};
}
const data=(matches:Match[]):Data=>({teams:[],matches});
const lastFive=[26,36,21,25,25];
const homeFive=lastFive.map((n,i)=>game('h'+i,`2026-10-${String(10+i).padStart(2,'0')}`,current,'H','X'+i,n));
const awayFive=[26,25,23,27,24].map((n,i)=>game('a'+i,`2026-10-${String(20+i).padStart(2,'0')}`,current,'Y'+i,'S',n));
const lens=(r:ReturnType<typeof analyzeFourLenses>,id:string)=>r.lenses.find(x=>x.id===id)!;

describe('Etapa 78 — quatro recortes, frequências e temporadas sem vazamento',()=>{
  it('reconhece a temporada anterior, sem cruzar campeonatos diferentes',()=>{
    expect(previousSeasonCompetition(current)).toBe(previous);
    expect(previousSeasonCompetition('Brasileirão Série A 2026')).toBe('Brasileirão Série A 2025');
    expect(previousSeasonCompetition('Bundesliga')).toBeNull();
    expect(FOUR_LENS_LINES.shots).toContain(28.5);
  });
  it('reproduz 1/5 Over e 4/5 Under em casa, soma ambos os times e combina mandante/visitante',()=>{
    const d=data([...homeFive,...awayFive]),before=JSON.stringify(d);
    const r=analyzeFourLenses(d,fixture,'shots','full',28.5);
    expect(lens(r,'home-any').last5).toMatchObject({
      count:5,mean:26.6,over:1,under:4,overRate:0.2,underRate:0.8
    });
    expect(lens(r,'away-any').last5).toMatchObject({
      count:5,over:0,under:5,underRate:1
    });
    expect(lens(r,'home-direct').last10.count).toBe(0);
    expect(r.projection).toBeCloseTo((26.6+25)/2,3);
    expect(r.historicalDirection).toBe('Under');
    expect(JSON.stringify(d)).toBe(before);
  });
  it('mantém as duas temporadas separadas, mas não conta as duas vistas diretas como jogos diferentes',()=>{
    const direct=[
      game('p1','2025-09-20',previous,'H','S',20),
      game('p2','2025-11-12',previous,'H','S',30),
      game('reverse','2025-12-15',previous,'S','H',22)
    ];
    const r=analyzeFourLenses(data([...homeFive,...awayFive,...direct]),fixture,'shots','full',28.5);
    expect(lens(r,'home-any').previousSeason).toMatchObject({count:2,mean:25});
    expect(lens(r,'home-any').currentSeason.count).toBe(5);
    expect(lens(r,'home-direct').last10.count).toBe(2);
    expect(lens(r,'away-direct').matchIds).toEqual(lens(r,'home-direct').matchIds);
    expect(lens(r,'home-direct').matchIds).not.toContain('reverse');
    expect(r.overlappingSamples).toBe(true);
  });
  it('exclui jogo futuro, data conflitante, outra liga e cópias de um mesmo confronto',()=>{
    const bad=game('conflict','2026-10-05',current,'H','C',40);
    bad.research={provider:'work-csv',source:'Flashscore',
       sourceId:'conflict78',sourceUrl:'https://www.flashscore.com.br/jogo/?mid=conflict78',
       importedAt:'2026-10-06T08:00:00Z',
       full:[st(20),st(20)],dateDiscrepancy:true,titleDate:'2026-10-06'};
    const d=data([
      game('copy1','2026-10-01',current,'H','B',28),
      game('copy2','2026-10-01',current,'H','B',28),
      game('future','2026-11-09',current,'H','Y',45),
      game('other','2026-10-03','Premier League 2026/27','H','Z',39),
      bad
    ]);
    const r=analyzeFourLenses(d,fixture,'shots','full',28.5);
    expect(lens(r,'home-any').last10.count).toBe(0);
    expect(r.projection).toBeNull();
    expect(r.historicalDirection).toBe('Sem consenso');
  });
  it('amostra de confronto direto com três jogos contraditórios veta uma leitura geral',()=>{
    const h=Array.from({length:10},(_,i)=>game('hh'+i,`2026-10-${String(i+1).padStart(2,'0')}`,current,'H','X'+i,22));
    const s=Array.from({length:10},(_,i)=>game('ss'+i,`2026-10-${String(i+12).padStart(2,'0')}`,current,'Y'+i,'S',20));
    const direct=Array.from({length:3},(_,i)=>game('dd'+i,`2025-09-${String(i+1).padStart(2,'0')}`,previous,'H','S',40));
    const r=analyzeFourLenses(data([...h,...s,...direct]),fixture,'shots','full',28.5);
    expect(lens(r,'home-any').last10.underRate).toBe(1);
    expect(lens(r,'away-any').last10.underRate).toBe(1);
    expect(lens(r,'home-direct').last10.overRate).toBe(1);
    expect(r.historicalDirection).toBe('Sem consenso');
    expect(r.reason).toMatch(/contradizem/);
  });
  it('reconhece clubes com IDs diferentes na temporada anterior sem misturar outras ligas',()=>{
    const old=game('old','2025-10-01',previous,'H-OLD','S-OLD',24);
    const d:Data={teams:[
      {id:'H',name:'Hoffenheim',color:'#777'},
      {id:'S',name:'Schalke',color:'#777'},
      {id:'H-OLD',name:'Hoffenheim',color:'#777'},
      {id:'S-OLD',name:'Schalke',color:'#777'}
    ],matches:[old]};
    const r=analyzeFourLenses(d,fixture,'shots','full',28.5);
    expect(lens(r,'home-direct').last10).toMatchObject({count:1,mean:24});
    expect(lens(r,'away-direct').last10.count).toBe(1);
    expect(lens(r,'home-any').previousSeason.count).toBe(1);
  });
  it('também quarentena cópias duplicadas do MESMO ID local',()=>{
    const m=game('repeated','2026-10-01',current,'H','S',25);
    const r=analyzeFourLenses(data([m,m]),fixture,'shots','full',28.5);
    expect(lens(r,'home-direct').last10.count).toBe(0);
  });
  it('lida com períodos 1T/2T e campos ausentes sem inferir números',()=>{
    const m=game('m','2026-10-01',current,'H','Q',26);
    m.first[0].shots=null;
    const full=analyzeFourLenses(data([m]),fixture,'shots','full',28.5);
    const first=analyzeFourLenses(data([m]),fixture,'shots','first',28.5);
    expect(lens(full,'home-any').last10.count).toBe(0);
    expect(lens(first,'home-any').last10.count).toBe(0);
    const zero=analyzeFourLenses(data([m]),fixture,'corners','full',8.5);
    expect(lens(zero,'home-any').last10).toMatchObject({count:1,mean:0,under:1});
    expect(()=>analyzeFourLenses(data([]),fixture,'shots','full',-1)).toThrow();
  });
});

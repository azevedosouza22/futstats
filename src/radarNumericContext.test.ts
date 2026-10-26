import {describe,it,expect} from 'vitest';
import type {Data,Match,Stats} from './model';
import {leagueNumericContext} from './radarNumericContext';

const stat=(goals:number,shots:number,target:number|null,corners:number):Stats=>({
  goals,shots,target,corners,yellow:0,red:0,
});
const none=():Stats=>stat(0,0,0,0);
const game=(id:string,date:string,competition:string,
  home:Stats,away:Stats):Match=>({
  id,date,competition,home:'home',away:'away',
  first:[home,away],second:[none(),none()]
});
const league='Bundesliga 2026/27';
describe('leagueNumericContext',()=>{
  it('uses only past matches of the same competition, counts unique IDs and ignores future/same-day games',()=>{
    const one=game('1','2026-10-10',league,stat(1,10,3,3),stat(0,12,2,4));
    const two=game('2','2026-10-11',league,stat(2,15,null,5),stat(1,16,1,6));
    const data:Data={teams:[],matches:[
      one,two,
      game('1','2026-10-12',league,stat(9,80,40,40),stat(9,80,40,40)),
      game('3','2026-10-25',league,stat(9,80,40,40),stat(9,80,40,40)),
      game('4','2026-10-09','Bundesliga 2025/26',stat(9,80,40,40),stat(9,80,40,40)),
    ]};
    const result=leagueNumericContext(data,league,'2026-10-25');
    expect(result.find(x=>x.id==='shots-full-24.5')).toEqual({id:'shots-full-24.5',mean:26.5,observed:2});
    expect(result.find(x=>x.id==='corners-full-8.5')).toEqual({id:'corners-full-8.5',mean:9,observed:2});
    expect(result.find(x=>x.id==='target-full-7.5')).toEqual({id:'target-full-7.5',mean:5,observed:1});
    expect(result.find(x=>x.id==='goals-full-2.5')).toEqual({id:'goals-full-2.5',mean:2,observed:2});
  });
  it('shows N/D for a metric with no complete pairs',()=>{
    const m=game('1','2026-10-09',league,stat(1,10,null,3),stat(1,12,2,4));
    const result=leagueNumericContext({teams:[],matches:[m]},league,'2026-10-10');
    expect(result.find(x=>x.id==='target-full-7.5')).toEqual({id:'target-full-7.5',mean:null,observed:0});
  });
  it('refuses unfinished external matches and conflicting source dates',()=>{
    const old=game('a','2026-10-10',league,stat(1,10,2,3),stat(2,11,2,4));
    const external:Match={...old,id:'b',date:'2026-10-12',external:{provider:'thesportsdb',id:'ext',importedAt:'2026-10-11',status:'Not Started',full:[stat(1,20,4,5),stat(2,20,4,5)]}};
    const research:Match={...old,id:'c',date:'2026-10-13',research:{
      provider:'work-csv',source:'Flashscore',sourceId:'abc',sourceUrl:'https://www.flashscore.com/?mid=abc',
      importedAt:'2026-10-11',full:[stat(1,20,4,5),stat(2,20,4,5)],
      titleDate:'2026-10-25',dateDiscrepancy:true,
    }};
    const result=leagueNumericContext({teams:[],matches:[old,external,research]},league,'2026-10-25');
    expect(result.find(x=>x.id==='shots-full-24.5')?.observed).toBe(1);
  });
});

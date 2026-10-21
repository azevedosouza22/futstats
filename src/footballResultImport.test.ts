import {describe,it,expect} from 'vitest';
import {previewFootballResult} from './footballResultImport';
import {validData,stats,type Data} from './model';
import type {AutoFixture,StatTeam} from './apiFootball';
import type {SavedRadarRecord} from './radarRecords';

const game:AutoFixture={
  id:1492402,date:'2026-10-23T23:00:00+00:00',status:'FT',statusLabel:'Match Finished',minute:90,
  league:'Serie A',country:'Brazil',home:{id:11,name:'Cruzeiro'},away:{id:22,name:'Remo'},goals:[2,1],
};
const forecast:SavedRadarRecord={
  key:'cru-rem',savedAt:'2026-10-21T12:00:00.000Z',matchAt:'2026-10-23T20:00:00',
  competition:'Brasileirão Série A',home:'Cruzeiro',away:'Remo',
  homeCount:5,awayCount:5,markets:[],
  venue:[{marketId:'goals-full-2.5',label:'Gols',line:2.5,v2:'Over',v3:'Over',projectedTotal:3,failedChecks:[]}],
};
const rows:StatTeam[]=[
  {team:{id:11,name:'Cruzeiro'},statistics:[
    {type:'Goals',value:2},{type:'Total Shots',value:12},{type:'Shots on Goal',value:4},{type:'Corner Kicks',value:5}
  ],statistics_1h:[{type:'Goals',value:1},{type:'Total Shots',value:5},{type:'Shots on Goal',value:2}],
    statistics_2h:[{type:'Goals',value:1},{type:'Total Shots',value:7},{type:'Shots on Goal',value:2}]},
  {team:{id:22,name:'Remo'},statistics:[
    {type:'Goals',value:1},{type:'Total Shots',value:13},{type:'Shots on Goal',value:3},{type:'Corner Kicks',value:4}
  ],statistics_1h:[{type:'Goals',value:0},{type:'Total Shots',value:6},{type:'Shots on Goal',value:1}],
    statistics_2h:[{type:'Goals',value:1},{type:'Total Shots',value:7},{type:'Shots on Goal',value:2}]},
];
const empty:Data={teams:[],matches:[]};
const stage=(fixture=game,initial=empty,forecasts=[forecast],f=rows,h=rows,ok=true)=>
  previewFootballResult(initial,forecasts,fixture,f,h,ok);

describe('prévia segura dos resultados API-Football',()=>{
  it('confere fixture FT, liga à previsão salva e importa jogo completo e dois tempos explícitos',()=>{
    const r=stage();
    expect(r.match.date).toBe('2026-10-23');
    expect(r.match.competition).toBe('Brasileirão Série A');
    expect(r.match.external).toMatchObject({provider:'api-football',id:'1492402',status:'FT'});
    expect(stats(r.match,0,'full')).toMatchObject({goals:2,shots:12,target:4,corners:5});
    expect(stats(r.match,1,'full')).toMatchObject({goals:1,shots:13,target:3,corners:4});
    expect(stats(r.match,0,'first')).toMatchObject({goals:1,shots:5,target:2});
    expect(stats(r.match,0,'second')).toMatchObject({goals:1,shots:7,target:2});
    expect(r.availability).toEqual({full:8,first:6,second:6});
    expect(r.data.matches).toHaveLength(1);
    expect(validData(r.data)).toBe(true);
    expect(empty.matches).toHaveLength(0);
    expect(forecast.venue?.[0].v3).toBe('Over');
  });
  it('usa N/D nos dois tempos quando o provedor não os oferece',()=>{
    const r=stage(game,empty,[forecast],rows,[],false);
    expect(stats(r.match,0,'first').goals).toBeNull();
    expect(stats(r.match,1,'second').shots).toBeNull();
    expect(r.availability).toEqual({full:8,first:0,second:0});
  });
  it('não aceita placares de partidas em andamento ou prorrogação',()=>{
    for(const status of ['NS','1H','2H','AET','PEN']){
      expect(()=>stage({...game,status})).toThrow('FT');
    }
    expect(()=>stage({...game,goals:[null,1]})).toThrow('Placar');
  });
  it('não cria novo jogo para previsões sem correspondência ou em duplicidade',()=>{
    expect(()=>stage(game,empty,[])).toThrow('exatamente uma previsão');
    expect(()=>stage(game,empty,[forecast,forecast])).toThrow('exatamente uma previsão');
    expect(()=>stage({...game,away:{id:22,name:'Outro Clube'}})).toThrow('exatamente uma previsão');
    const data=stage().data;
    expect(()=>stage(game,data)).toThrow('já existe');
    expect(data.matches).toHaveLength(1);
  });
  it('rejeita placar conflitante e estatística contraditória, sem alterar a base',()=>{
    const bad=rows.map(t=>({...t,statistics:t.statistics?.map(p=>({...p}))??null}));
    bad[0].statistics![0].value=4;
    expect(()=>stage(game,empty,[forecast],bad)).toThrow('não conferem');
    const shots=rows.map(t=>({...t,statistics:t.statistics?.map(p=>({...p}))??null}));
    shots[0].statistics![1].value=2;
    expect(()=>stage(game,empty,[forecast],shots)).toThrow('integridade');
    expect(empty.matches).toHaveLength(0);
  });
});

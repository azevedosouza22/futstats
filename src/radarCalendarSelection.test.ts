import {describe,it,expect} from 'vitest';
import type {Data,Stats} from './model';
import type {ScheduledFixture} from './calendar';
import {resolveCalendarFixture} from './radarCalendarSelection';
import {calendarWindow} from './calendar';

const zero:Stats={goals:0,shots:0,target:0,corners:0,yellow:0,red:0};
const team=(id:string,name:string)=>({id,name,color:'#333'});
const data:Data={
  teams:[team('h','RB Bragantino'),team('a','Cruzeiro'),team('s','São Paulo')],
  matches:[{
    id:'m1',home:'h',away:'a',date:'2026-10-01',competition:'Brasileirão Série A',
    first:[zero,zero],second:[zero,zero],
  },{
    id:'m2',home:'h',away:'s',date:'2026-10-01',competition:'Brasileirão Série B',
    first:[zero,zero],second:[zero,zero],
  }],
};
const fixture:ScheduledFixture={
  id:'f1',date:'2026-10-25',time:'19:30',competition:'Brasileirão Série A',
  home:'RB BRAGANTINO',away:'Cruzeiro',sourceUrl:'https://cbf.com.br/agenda',
};
describe('resolver confronto na agenda do Radar',()=>{
  it('preenche competição, equipes, data e horário a partir da fonte',()=>{
    expect(resolveCalendarFixture(data,fixture)).toEqual({
      homeId:'h',awayId:'a',competition:'Brasileirão Série A',date:'2026-10-25',
      time:'19:30',hasKickoffTime:true,sourceUrl:fixture.sourceUrl,
    });
  });
  it('não inventa horário e permite prévia sem salvamento automático',()=>{
    const r=resolveCalendarFixture(data,{...fixture,time:null});
    expect(r?.time).toBe('');
    expect(r?.hasKickoffTime).toBe(false);
  });
  it('não seleciona clube de temporada/liga incorreta',()=>{
    expect(resolveCalendarFixture(data,{...fixture,competition:'Brasileirão Série B',away:'Cruzeiro'})).toBeNull();
  });
  it('bloqueia fonte de agenda sem HTTPS confiável',()=>{
    expect(resolveCalendarFixture(data,{...fixture,sourceUrl:'javascript:alert(1)'})).toBeNull();
  });
  it('rejeita horário inválido e confronto com mesma equipe',()=>{
    expect(resolveCalendarFixture(data,{...fixture,time:'27:00'})).toBeNull();
    expect(resolveCalendarFixture(data,{...fixture,away:'RB Bragantino'})).toBeNull();
  });
  it('não seleciona clube com nome ambíguo na mesma competição',()=>{
    const dup:Data={...data,teams:[...data.teams,team('h2','RB Bragantino')],
      matches:[...data.matches,{...data.matches[0],id:'m3',home:'h2'}]};
    expect(resolveCalendarFixture(dup,fixture)).toBeNull();
  });
});
describe('visão de jogos do dia',()=>{
  it('separa jogos de hoje da janela semanal e não exibe jogos passados',()=>{
    const now=new Date('2026-10-25T12:00:00Z'); // 09h Brasília
    const input=[{...fixture,date:'2026-10-24',id:'prev'},
      {...fixture,id:'today',time:'19:30'},
      {...fixture,date:'2026-10-26',id:'tomorrow'},
    ];
    expect(calendarWindow(input,'today',now).map(x=>x.id)).toEqual(['today']);
    expect(calendarWindow(input,'week',now).map(x=>x.id)).toEqual(['today','tomorrow']);
  });
});

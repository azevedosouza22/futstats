import {describe,it,expect} from 'vitest';
import {parseEuropeSchedule} from './europeWorkSchedule';

const url='https://raw.githubusercontent.com/openfootball/football.json/master/2026-27/es.1.json';
const sample={name:'Spain Primera División 2026/27',matches:[
 {round:'Matchday 10',date:'2026-10-25',
  team1:'FC Barcelona',team2:'Real Madrid CF'},
 {round:'Matchday 10',date:'2026-10-25',
  time:'not-published',team1:'Athletic Club',team2:'Getafe CF'},
 {round:'Matchday 10',date:'2026-10-25',
  team1:'FC Barcelona',team2:'Real Madrid CF'},
 {round:'Matchday 9',date:'2026-10-23',
  time:'14:00',team1:'Valencia CF',team2:'Sevilla FC'},
 {round:'Matchday 8',date:'2026-10-26',time:'15:00',
  team1:'Sevilla FC',team2:'Elche CF',score:{ft:[2,0]}}
]};
describe('Consulta CC0 dos calendários europeus sem criar previsões',()=>{
 it('mostra apenas futuras sem placar e sem inventar horário quando a fonte omite',()=>{
  const r=parseEuropeSchedule(sample,'la-liga',url,'2026-10-24');
  expect(r).toHaveLength(2);
  expect(r.every(x=>x.date==='2026-10-25')).toBe(true);
  expect(r[0].localTime).toBeNull();
  expect(r[1].localTime).toBeNull();
  expect(r[0].sourceUrl).toBe(url);
  expect(r[0].league).toBe('la-liga');
 });
 it('preserva hora local como texto sem converter arbitrariamente para Brasília',()=>{
  const r=parseEuropeSchedule({matches:[
   {date:'2026-10-25',team1:'AC Milan',team2:'SS Lazio',time:'20:45'}
  ]},'serie-a',url,'2026-10-24');
  expect(r).toHaveLength(1);
  expect(r[0].localTime).toBe('20:45');
  expect(r[0]).not.toHaveProperty('kickoffUtc');
  expect(r[0]).not.toHaveProperty('autoRegister');
 });
 it('rejeita arquivos inválidos e não injeta jogos fictícios',()=>{
  expect(()=>parseEuropeSchedule({},'ligue-1',url,'2026-10-24')).toThrow();
  expect(()=>parseEuropeSchedule({matches:[]},'ligue-1',url,'not a date')).toThrow();
  expect(parseEuropeSchedule({matches:[]},'ligue-1',url,'2026-10-24')).toEqual([]);
 });
});

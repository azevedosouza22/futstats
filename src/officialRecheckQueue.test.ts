import {describe,it,expect} from 'vitest';
import {readOfficialCalendar,type OfficialCalendarItem} from './officialCalendar';
import {officialRecheckQueue} from './officialRecheckQueue';

const now=new Date('2026-10-25T16:00:00Z'); // 13:00 Brasília
const original=(s:string,time:string|null,fresh=true):OfficialCalendarItem=>({
 fixture:{id:s,date:'2026-10-26',time,competition:'Campeonato teste',
  home:s,away:'Visitante',sourceUrl:'https://www.cbf.com.br/jogos/'+s},
 verifiedAt:'2026-10-25',fresh
});
describe('Etapa 41 — priorização de reconferência, somente leitura',()=>{
 it('prioriza horário vencido e jogos nas próximas 48h sem alterar a base',()=>{
  const items=[
   {...original('futuro','10:00'),fixture:{...original('futuro','10:00').fixture,date:'2026-11-02'}},
   original('breve','10:00'),
   original('vencido',null,false)
  ];
  const snapshot=JSON.stringify(items);
  const q=officialRecheckQueue(items,now);
  expect(q).toMatchObject({expired:1,soon:1,later:1});
  expect(q.entries.map(e=>e.item.fixture.id)).toEqual(['vencido','breve','futuro']);
  expect(q.entries.map(e=>e.reason)).toEqual(['expired','soon','later']);
  expect(JSON.stringify(items)).toBe(snapshot);
 });
 it('nunca recupera a hora perdida de referência antiga e não atualiza a verificação',()=>{
  const outdated=original('expired',null,false);
  const q=officialRecheckQueue([outdated],now);
  expect(q.entries[0].item.fixture.time).toBeNull();
  expect(q.entries[0].item.verifiedAt).toBe('2026-10-25');
  expect(outdated.fixture.time).toBeNull();
 });
 it('não confunde jogos em outra data, horário UTC e deduplicação',()=>{
  const x=original('iniciado','08:00');
  const y=original('hoje','15:00');y.fixture.date='2026-10-25';
  const z=original('amanha','13:00');
  const q=officialRecheckQueue([x,y,z,z],now);
  expect(q.entries).toHaveLength(3);
  expect(q.soon).toBe(3);
  expect(q.expired).toBe(0);
 });
 it('lida com registros futuros que perderam frescor sem os transformar em As Boas',()=>{
  const actual=readOfficialCalendar(new Date('2026-10-31T12:00:00Z'));
  const before=JSON.stringify(actual);
  const q=officialRecheckQueue(actual,new Date('2026-10-31T12:00:00Z'));
  expect(q.expired).toBe(actual.length);
  expect(q.soon).toBe(0);
  expect(q.entries.every(x=>x.item.fixture.time===null)).toBe(true);
  expect(JSON.stringify(actual)).toBe(before);
 });
 it('rejeita jogos já em data anterior e não cria links ou partidas',()=>{
  const old=original('antigo',null,false);old.fixture.date='2026-10-24';
  const q=officialRecheckQueue([old],now);
  expect(q.entries).toEqual([]);
  expect(q).toMatchObject({expired:0,soon:0,later:0});
 });
});

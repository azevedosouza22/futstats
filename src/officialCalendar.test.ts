import {describe,it,expect} from 'vitest';
import {officialCalendarItem,readOfficialCalendar,type OfficialCalendarRecord} from './officialCalendar';
import {brasileiraoRound32,normalizeTeam} from './calendar';

const now=new Date('2026-10-25T13:00:00.000Z'); // 10:00 em Brasília
const sample:OfficialCalendarRecord={
  id:'test-lfp',competition:'Ligue 1 francesa 2026/27',
  home:'Toulouse FC',away:'ES Troyes AC',
  localDate:'2026-10-25',localTime:'17:15',timezone:'Europe/Paris',
  utcKickoff:'2026-10-25T16:15:00Z',
  officialUrl:'https://www.lfp.fr/article/toulouse-fc-estac-troyes-decale-au-dimanche-25-octobre-a-17-h15',
  verifiedAt:'2026-10-23'
};
describe('Agenda com referências oficiais (sem consulta contínua)',()=>{
  it('expõe seis jogos futuros manualmente conferidos e exclui Napoli passado',()=>{
    const entries=readOfficialCalendar(now);
    expect(entries).toHaveLength(6);
    expect(entries.some(x=>x.fixture.home==='SSC Napoli')).toBe(false);
    expect(entries.every(x=>x.fixture.id.startsWith('official|'))).toBe(true);
    expect(entries.every(x=>x.fixture.sourceUrl.startsWith('https://'))).toBe(true);
    expect(entries.every(x=>x.fresh)).toBe(true);
    expect(entries.every(x=>x.fixture.time!==null)).toBe(true);
  });
  it('respeita o horário de verão europeu no dia 25/10/2026',()=>{
    const item=officialCalendarItem(sample,now);
    expect(item?.fixture).toMatchObject({
      home:'Toulouse FC',away:'ES Troyes AC',
      date:'2026-10-25',time:'13:15'
    });
    const clasico=readOfficialCalendar(now).find(x=>x.fixture.home==='FC Barcelona');
    expect(clasico?.fixture.time).toBe('17:00');
    expect(clasico?.fixture.date).toBe('2026-10-25');
  });
  it('converte horários CBF para Brasília sem virar o dia indevidamente',()=>{
    const entries=readOfficialCalendar(now);
    const bahia=entries.find(x=>x.fixture.home==='Bahia')!;
    expect(bahia.fixture).toMatchObject({date:'2026-10-28',time:'21:30'});
    const flamengo=entries.find(x=>x.fixture.home==='Flamengo')!;
    expect(flamengo.fixture).toMatchObject({date:'2026-10-26',time:'20:00'});
  });
  it('quando a conferência envelhece, apaga a hora reutilizável em vez de mantê-la',()=>{
    const later=new Date('2026-10-28T12:00:00Z');
    const items=readOfficialCalendar(later);
    expect(items).toHaveLength(2);
    expect(items.every(x=>!x.fresh&&x.fixture.time===null)).toBe(true);
  });
  it('nunca retorna jogos depois do início e não forja tempo retrospectivo',()=>{
    expect(officialCalendarItem(sample,new Date('2026-10-25T16:16:00Z'))).toBeNull();
    expect(readOfficialCalendar(new Date('2026-10-30T00:00:00Z'))).toEqual([]);
  });
  it('rejeita URLs arbitrárias, fuso/UTC divergentes e data futura de verificação',()=>{
    expect(officialCalendarItem({...sample,officialUrl:'https://evil.example.net/x'},now)).toBeNull();
    expect(officialCalendarItem({...sample,timezone:'Europe/Rome',localTime:'15:00'},now)).toBeNull();
    expect(officialCalendarItem({...sample,utcKickoff:'2026-10-25T17:15:00Z'},now)).toBeNull();
    expect(officialCalendarItem({...sample,verifiedAt:'2026-10-26'},now)).toBeNull();
  });
  it('identifica duplicata da rodada 32 sem tocar no calendário legado',()=>{
    const original=JSON.stringify(brasileiraoRound32);
    const official=readOfficialCalendar(now).find(x=>x.fixture.home==='Flamengo')!.fixture;
    const old=brasileiraoRound32.find(x=>x.home==='Flamengo')!;
    const identity=(f:typeof official)=>[f.date,f.competition,normalizeTeam(f.home),normalizeTeam(f.away)].join('|');
    expect(identity(old)).toEqual(identity(official));
    expect(JSON.stringify(brasileiraoRound32)).toBe(original);
  });
});

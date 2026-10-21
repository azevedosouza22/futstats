import {describe,it,expect} from 'vitest';
import {parseCalendarCsv,mergeCalendar,calendarWindow,isUpcoming,brasiliaDate,brasileiraoRound32} from './calendar';

const head='data,horario_brasilia,competicao,mandante,visitante,url_fonte';
const lines=[
 '2026-10-21,20:00,Brasileirão Série A,Corinthians,Vitória,https://www.cbf.com.br/calendario',
 '2026-10-23,18:30,Serie A italiana,Juventus,Lazio,https://www.legaseriea.it/',
];
const parse=(rows:string[])=>parseCalendarCsv([head,...rows].join('\n'));

describe('Agenda CSV de jogos futuros',()=>{
 it('oferece dez jogos confirmados da rodada 32 sem gravar na base',()=>{
   expect(brasileiraoRound32).toHaveLength(10);
   expect(brasileiraoRound32[0]).toMatchObject({
    date:'2026-10-23',time:'20:00',home:'Cruzeiro',away:'Remo',competition:'Brasileirão Série A',
   });
   expect(brasileiraoRound32.find(f=>f.home==='Palmeiras'&&f.away==='RB Bragantino')?.time).toBe('18:30');
   expect(new Set(brasileiraoRound32.map(f=>f.id)).size).toBe(10);
   const now=new Date('2026-10-20T18:00:00Z');
   expect(calendarWindow(brasileiraoRound32,'week',now)).toHaveLength(10);
   expect(mergeCalendar(brasileiraoRound32,brasileiraoRound32).added).toBe(0);
 });
 it('interpreta datas, fontes e deduplica importações repetidas',()=>{
   const loaded=parse(lines);
   expect(loaded).toHaveLength(2);
   expect(loaded[0].date).toBe('2026-10-21');
   expect(loaded[0].time).toBe('20:00');
   expect(mergeCalendar(loaded,loaded).added).toBe(0);
   expect(mergeCalendar(loaded,loaded).duplicates).toBe(2);
 });
 it('valida datas, horários, HTTPS e equipes',()=>{
   expect(()=>parse(['2026-02-30,20:00,Serie A,A,B,https://example.org'])).toThrow('data inválida');
   expect(()=>parse(['2026-11-02,25:00,Serie A,A,B,https://example.org'])).toThrow('horário inválido');
   expect(()=>parse(['2026-11-02,20:00,Serie A,A,B,http://example.org'])).toThrow('URL');
   expect(()=>parse(['2026-11-02,20:00,Serie A,A,A,https://example.org'])).toThrow('equipes iguais');
   expect(()=>parse([lines[0],lines[0]])).toThrow('duplicado');
 });
 it('filtra hoje e próximos sete ou trinta dias em horário de Brasília',()=>{
   const now=new Date('2026-10-19T22:00:00Z'); // 19h BRT
   expect(brasiliaDate(now)).toEqual({date:'2026-10-19',time:'19:00'});
   const f=parse(['2026-10-19,18:00,Brasileirão A,A,B,https://example.org',
    '2026-10-19,20:00,Brasileirão A,A,C,https://example.org',
    '2026-10-22,19:00,Brasileirão A,A,D,https://example.org',
    '2026-11-15,19:00,Brasileirão A,A,E,https://example.org']);
   expect(isUpcoming(f[0],now)).toBe(false);
   expect(calendarWindow(f,'today',now)).toHaveLength(1);
   expect(calendarWindow(f,'week',now)).toHaveLength(2);
   expect(calendarWindow(f,'month',now)).toHaveLength(3);
 });
});

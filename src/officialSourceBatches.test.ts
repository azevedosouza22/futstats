import {describe,it,expect} from 'vitest';
import {readOfficialCalendar,type OfficialCalendarItem} from './officialCalendar';
import {prepareOfficialSourceBatches,exportOfficialSourceBatchesCsv} from './officialSourceBatches';

const now=new Date('2026-10-25T15:00:00.000Z');
const bundes=(at:Date)=>readOfficialCalendar(at).filter(x=>
 x.fixture.competition==='Bundesliga 2026/27');
const fixture=(id:string,url:string):OfficialCalendarItem=>({
 fixture:{id,date:'2026-10-26',time:'19:30',competition:'Liga sintética',
  home:id,away:'Fora',sourceUrl:url},
 verifiedAt:'2026-10-25',fresh:true
});
describe('Etapa 50 — fontes agrupadas para reconferência humana',()=>{
 it('reduz nove partidas DFL da mesma página a UMA fonte revisável',()=>{
  const entries=bundes(now);
  const snapshot=JSON.stringify(entries);
  const plan=prepareOfficialSourceBatches(entries,now);
  expect(plan).toMatchObject({distinctSources:1,totalFixtures:9,excludedUnsafe:0,
   totalExpired:0,totalSoon:0,totalLater:9,groups:[{
    count:9,expired:0,soon:0,later:9,reviewStatus:'PENDENTE',
    checkedDates:['2026-10-25'],
    sourceUrl:'https://www.bundesliga.com/en/bundesliga/matchday/2026-2027/8'
   }]});
  expect(JSON.stringify(entries)).toBe(snapshot);
  const csv=exportOfficialSourceBatchesCsv(plan);
  expect(csv.split('\r\n').filter(Boolean)).toHaveLength(2); // header + source
  expect(csv).toContain('"PENDENTE"');
  expect(csv).toContain('"9"');
  expect(csv).toContain('FC Bayern München x Borussia Dortmund');
  expect(csv).not.toContain('"CONFIRMADO"');
 });
 it('ao vencer fonte, preserva nove N/D, jamais recupera horários passados',()=>{
  const date=new Date('2026-10-29T12:00:00.000Z');
  const entries=bundes(date);
  const plan=prepareOfficialSourceBatches(entries,date);
  expect(plan).toMatchObject({distinctSources:1,totalFixtures:9,totalExpired:9,
   totalSoon:0,totalLater:0});
  expect(plan.groups[0].fixtures.every(e=>e.item.fixture.time===null&&
    e.reason==='expired')).toBe(true);
  const csv=exportOfficialSourceBatchesCsv(plan);
  expect((csv.match(/\(N\/D Brasília, expired\)/g)??[])).toHaveLength(9);
  expect(csv).not.toContain('14:30 Brasília');
  expect(plan.groups[0].checkedDates).toEqual(['2026-10-25']);
 });
 it('mantém páginas e ligas diferentes separadas, mas deduplica IDs idênticos',()=>{
  const one=fixture('Um','https://www.cbf.com.br/agenda');
  const two=fixture('Dois','https://www.cbf.com.br/agenda');
  const three=fixture('Três','https://www.cbf.com.br/rodada');
  const four={...one,fixture:{...one.fixture,id:'Outro',competition:'Outra liga'}};
  const plan=prepareOfficialSourceBatches([one,two,two,three,four],now);
  expect(plan).toMatchObject({distinctSources:3,totalFixtures:4});
  expect(plan.groups.map(g=>g.count).sort()).toEqual([1,1,2]);
 });
 it('recusa domínio impostor e host sem HTTPS sem gerar links ou CSV suspeito',()=>{
  const source=fixture('OK','https://www.cbf.com.br/agenda');
  const inputs=[
   fixture('Fraude','https://www.cbf.com.br.evil.invalid/agenda'),
   fixture('Protocolo','http://www.cbf.com.br/agenda'),
   fixture('Usuário','https://www.cbf.com.br@evil.invalid/agenda'),
  ];
  const plan=prepareOfficialSourceBatches([source,...inputs],now);
  expect(plan).toMatchObject({distinctSources:1,totalFixtures:1,excludedUnsafe:3});
  const csv=exportOfficialSourceBatchesCsv(plan);
  expect(csv).not.toContain('evil.invalid');
  expect(csv).not.toContain('http://');
 });
 it('não confia em fresh=true se checkedAt é vencido e mantem PENDENTE',()=>{
  const injected={...fixture('Falso','https://www.cbf.com.br/agenda'),
   verifiedAt:'2026-10-19',fresh:true};
  const plan=prepareOfficialSourceBatches([injected],now);
  expect(plan).toMatchObject({totalExpired:1,totalSoon:0,
   groups:[{reviewStatus:'PENDENTE',checkedDates:['2026-10-19']}]});
  expect(exportOfficialSourceBatchesCsv(plan)).toContain('N/D Brasília, expired');
 });
 it('protege formula em planilha, aspas, ponto e vírgula, quebras de linha',()=>{
  const injected=fixture('=IMPORTXML("a";"b")\nLinha','https://www.cbf.com.br/agenda');
  const plan=prepareOfficialSourceBatches([injected],now);
  const csv=exportOfficialSourceBatchesCsv(plan);
  expect(csv).toContain('=IMPORTXML');
  expect(csv).toContain('""a""');
  // The output quotes cells and escapes double quote marks; text is inside
  // a cell that starts with the non-formula date.
  expect(csv).toContain('2026-10-26 =IMPORTXML');
  expect(csv.split('\r\n')).toHaveLength(3);
 });
 it('sem fonte cadastrada, produz CSV com só o cabeçalho e nada é promovido',()=>{
  const plan=prepareOfficialSourceBatches([],now);
  expect(plan).toMatchObject({distinctSources:0,totalFixtures:0,totalExpired:0});
  expect(exportOfficialSourceBatchesCsv(plan).split('\r\n').filter(Boolean)).toHaveLength(1);
 });
});

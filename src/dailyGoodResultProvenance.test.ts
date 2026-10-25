import {describe,expect,it} from 'vitest';
import {empty,type Match,type Data} from './model';
import {checkProspectiveResultProvenance} from './dailyGoodResultProvenance';

const make=(id:string,sourceId='source-007',importedAt='2026-10-26T03:00:00Z'):Match=>({
 id,date:'2026-10-25',competition:'Liga sintética',home:'home-'+id,away:'away-'+id,
 first:[empty(),empty()],second:[empty(),empty()],
 research:{provider:'work-csv',source:'Flashscore',sourceId,
  sourceUrl:'https://www.flashscore.com.br/jogo/?mid='+sourceId,
  importedAt,dateDiscrepancy:false,
  full:[empty(),empty()]}
});
const at=new Date('2026-10-26T12:00:00Z');
const data=(...matches:Match[]):Data=>({teams:[],matches});
describe('Etapa 51 — integridade da identidade e cronologia da fonte CSV',()=>{
 it('aceita apenas uma partida por ID da origem e importação no passado',()=>{
  const a=make('a'),d=data(a),before=JSON.stringify(d);
  expect(checkProspectiveResultProvenance(d,a,at))
   .toEqual({block:null,collidingMatchIds:[]});
  expect(JSON.stringify(d)).toBe(before);
 });
 it('bloqueia o mesmo ID Flashscore em jogos com equipes/campeonatos/datas diferentes',()=>{
  const a=make('a'),b={...make('b'),date:'2026-10-24',
   competition:'Outra liga'};
  const d=data(a,b);
  expect(checkProspectiveResultProvenance(d,a,at)).toEqual({
   block:'reused_source_id',collidingMatchIds:['a','b']
  });
  expect(checkProspectiveResultProvenance(d,b,at).block).toBe('reused_source_id');
 });
 it('não escolhe arbitrariamente uma das duplicatas e exclui IDs locais repetidos',()=>{
  const a=make('a'),duplicate={...make('a'),home:'outra-equipe'};
  expect(checkProspectiveResultProvenance(data(a,duplicate),a,at).block)
   .toBe('reused_source_id');
 });
 it('não confunde duas fontes CSV com IDs distintos',()=>{
  const a=make('a'),b=make('b','source-008');
  expect(checkProspectiveResultProvenance(data(a,b),a,at).block).toBeNull();
  expect(checkProspectiveResultProvenance(data(a,b),b,at).block).toBeNull();
 });
 it('recusa importedAt depois do horário da auditoria, sem inventar data',()=>{
  const future=make('a','source-009','2026-10-30T12:00:00Z');
  expect(checkProspectiveResultProvenance(data(future),future,at))
   .toEqual({block:'future_import',collidingMatchIds:[]});
  const sameInstant=make('b','source-010',at.toISOString());
  expect(checkProspectiveResultProvenance(data(sameInstant),sameInstant,at).block)
   .toBeNull();
 });
 it('dupla origem irregular tem precedência sobre data futura',()=>{
  const future=make('a','source-009','2026-10-30T12:00:00Z');
  const copy={...make('b','source-009'),competition:'Outra liga'};
  expect(checkProspectiveResultProvenance(data(future,copy),future,at).block)
   .toBe('reused_source_id');
 });
 it('não usa um objeto externo como se estivesse no conjunto de resultados',()=>{
  const a=make('a'),copy={...make('a')};
  expect(checkProspectiveResultProvenance(data(a),copy,at).block)
   .toBe('reused_source_id');
 });
 it('registro manual não é fonte CSV verificada nem gera colisão',()=>{
  const a=make('a'),manual={...make('b'),research:undefined};
  expect(checkProspectiveResultProvenance(data(a,manual),manual,at))
   .toEqual({block:null,collidingMatchIds:[]});
  expect(checkProspectiveResultProvenance(data(a,manual),a,at).block).toBeNull();
 });
});

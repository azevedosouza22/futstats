import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import WorkRadarProspectivePanel from './WorkRadarProspectivePanel';
import type {WorkAnalysisMatch} from './workAnalysis';
import type {MetricPairs} from './europeWorkResearch';

const first:MetricPairs={
 goals:[1,0],shots:[7,3],target:[2,1],corners:[4,1]
};
const second:MetricPairs={
 goals:[0,1],shots:[4,2],target:[1,1],corners:[2,1]
};
const full:MetricPairs={
 goals:[1,1],shots:[11,5],target:[3,2],corners:[6,2]
};
const games:WorkAnalysisMatch[]=[
 {id:'serie-a-1',league:'serie-a',date:'2026-09-01',
  home:'Equipe A',away:'Equipe B',
  sourceId:'Example123',
  sourceUrl:'https://www.flashscore.com.br/jogo/futebol/?mid=Example123',
  first,second,full,discrepancies:[]}
];
describe('Usabilidade do Radar Work no celular',()=>{
 it('mostra campeonato, mandante, visitante, data e horário no mesmo painel',()=>{
  const html=renderToStaticMarkup(<WorkRadarProspectivePanel matches={games}/>);
  for(const name of [
   'Campeonato para novo teste prospectivo','Mandante do teste prospectivo',
   'Visitante do teste prospectivo','Data do novo confronto prospectivo',
   'Horário de início em Brasília'
  ])expect(html).toContain(name);
  expect(html).toContain('Equipe A');
  expect(html).toContain('Equipe B');
  expect(html).toContain('Registrar teste antes da partida');
  expect(html).toContain('disabled');
 });
 it('sem partidas apresenta motivo legível sem esconder o formulário completo',()=>{
  const html=renderToStaticMarkup(<WorkRadarProspectivePanel matches={[]}/>);
  expect(html).toContain('Nenhum campeonato disponível');
  expect(html).toContain('Horário de início em Brasília');
  expect(html).toContain('Registrar teste antes da partida');
 });
});

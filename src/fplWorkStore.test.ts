import {describe,expect,it} from 'vitest';
import type {FplPilotGame} from './fplFreePilot';
import {addFplWork,emptyFplWork,readFplWork,previewFplWorkCsv} from './fplWorkStore';

const cols=['id_fonte','tipo_amostra','equipe_amostra','competicao','data',
 'data_titulo_fonte','hora_exibida_fonte','fuso_horario_fonte','divergencia_data',
 'mandante','visitante'];
for(const period of ['jogo','1t','2t'])
 for(const metric of ['gols','finalizacoes','chutes_no_alvo','escanteios'])
  for(const side of ['mandante','visitante','total'])
   cols.push(metric+'_'+side+'_'+period);
cols.push('fonte','url_fonte','url_fonte_1t','url_fonte_2t',
 'url_fonte_gols_por_tempo','sofascore_status','sofascore_url_partida','observacoes');

const game=(options:Partial<FplPilotGame>={}):FplPilotGame=>({
 id:'26-27-prem-arsenal-vs-coventry-city',gw:1,date:'2026-08-21',
 sourceKickoff:'2026-08-21T19:00:00',home:'Arsenal',away:'Coventry City',
 goals:[3,0],shots:[20,4],onTarget:[6,1],corners:[8,2],
 sourceStatsProcessed:true,...options
});
type Params={sourceId?:string;home?:string;away?:string;game?:FplPilotGame;
 shots?:[number,number];divergences?:unknown[];unprocessed?:boolean};
function csv(options:Params={}):string{
 const g=options.game??game();
 const sourceId=options.sourceId??'TestFplId';
 const home=options.home??'Arsenal',away=options.away??'Coventry';
 const shots=options.shots??g.shots;
 const fields:Record<string,string>={
  id_fonte:sourceId,tipo_amostra:'historico_temporada',
  equipe_amostra:'N/D',competicao:'Premier League inglesa 2026/27',
  data:g.date,data_titulo_fonte:g.date,
  hora_exibida_fonte:'19:00',fuso_horario_fonte:'N/D',divergencia_data:'nao',
  mandante:home,visitante:away,fonte:'Flashscore',
  url_fonte:'https://www.flashscore.com.br/jogo/futebol/teste/resumo/estatisticas/total/?mid='+sourceId,
  url_fonte_1t:'N/D',url_fonte_2t:'N/D',
  url_fonte_gols_por_tempo:'N/D',sofascore_status:'N/D',
  sofascore_url_partida:'N/D',
  observacoes:JSON.stringify({
   temporada:'2026/2027',rodada:g.gw,piloto_id:g.id,
   piloto_stats_processed:options.unprocessed?'False':'True',
   divergencias_piloto:options.divergences??[]
  })
 };
 const stats={
  gols:[g.goals,[1,0],[g.goals[0]-1,g.goals[1]]],
  finalizacoes:[shots,[6,1],[shots[0]-6,shots[1]-1]],
  chutes_no_alvo:[g.onTarget,[2,0],[g.onTarget[0]-2,g.onTarget[1]]],
  escanteios:[g.corners,[3,1],[g.corners[0]-3,g.corners[1]-1]]
 } as Record<string,[number,number][]>;
 for(const [key,periods] of Object.entries(stats)){
  ['jogo','1t','2t'].forEach((p,i)=>{
   const [a,b]=periods[i];
   fields[key+'_mandante_'+p]=String(a);
   fields[key+'_visitante_'+p]=String(b);
   fields[key+'_total_'+p]=String(a+b);
  });
 }
 const values=cols.map(c=>fields[c]??'N/D')
 .map(v=>/[,\"\r\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v);
 return '\uFEFF'+cols.join(',')+'\n'+values.join(',')+'\n';
}

describe('Armazenamento privado Work da Premier League',()=>{
 it('aceita 55 colunas, aliases, 24 valores e protege os dados antigos',()=>{
  expect(cols).toHaveLength(55);
  const old=emptyFplWork();
  const report=previewFplWorkCsv(csv(),[game()],old);
  expect(report.checked).toBe(1);
  expect(report.additions).toHaveLength(1);
  expect(report.discrepancies).toBe(0);
  const stored=addFplWork(old,report);
  expect(stored.entries).toHaveLength(1);
  expect(stored.entries[0].full.goals).toEqual([3,0]);
  expect(readFplWork(JSON.stringify(stored)).entries).toHaveLength(1);
  const repeat=previewFplWorkCsv(csv(),[game()],stored);
  expect(repeat.additions).toHaveLength(0);
  expect(repeat.duplicates).toBe(1);
 });
 it('preserva divergência explícita Leeds-Newcastle sem sobrescrever piloto',()=>{
  const g=game({
   id:'26-27-prem-leeds-united-vs-newcastle-united',
   home:'Leeds',away:'Newcastle',goals:[1,0],shots:[15,10],
   onTarget:[5,3],corners:[5,4]
  });
  const file=csv({
   game:g,home:'Leeds',away:'Newcastle',shots:[14,10],
   divergences:[{indicator:'finalizacoes_m',flashscore:14,piloto:15}]
  });
  const result=previewFplWorkCsv(file,[g],emptyFplWork());
  expect(result.discrepancies).toBe(1);
  expect(result.additions[0].full.shots).toEqual([14,10]);
  expect(result.additions[0].discrepancies[0]).toContain('piloto 15');
  expect(g.shots).toEqual([15,10]);
  expect(()=>previewFplWorkCsv(csv({game:g,home:'Leeds',away:'Newcastle',shots:[14,10]}),[g],emptyFplWork()))
   .toThrow('sem justificativa');
 });
 it('aceita jogo não processado no piloto com resultados completos do Work',()=>{
  const g=game({
   id:'26-27-prem-nottingham-forest-vs-leeds-united',
   home:"Nott'm Forest",away:'Leeds',
   sourceStatsProcessed:false
  });
  const c=csv({game:g,home:'Nottingham',away:'Leeds',unprocessed:true});
  const result=previewFplWorkCsv(c,[g],emptyFplWork());
  expect(result.unprocessed).toBe(1);
  expect(result.additions[0].pilotUnprocessed).toBe(true);
 });
 it('rejeita dados truncados, placar, metadados, fontes e store incoerentes',()=>{
  const file=csv();
  expect(()=>previewFplWorkCsv(file.replace('id_fonte','id_alterado'),[game()],emptyFplWork())).toThrow('55 colunas');
  expect(()=>previewFplWorkCsv(file.replace('TestFplId','OutroId'),[game()],emptyFplWork())).toThrow();
  expect(()=>previewFplWorkCsv(file.replace('Premier League inglesa 2026/27','Outra Liga'),[game()],emptyFplWork())).toThrow('Competição');
  expect(()=>previewFplWorkCsv(file.replace('Coventry','Outro time'),[game()],emptyFplWork())).toThrow('não reconhecido');
  expect(()=>readFplWork('{')).toThrow('não pôde ser lida');
 });
});

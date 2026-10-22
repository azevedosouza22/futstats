import {describe,expect,it} from 'vitest';
import {reviewWorkResearchForFpl} from './fplWorkReview';
import type {FplPilotGame} from './fplFreePilot';

const game:FplPilotGame={
 id:'26-27-prem-sample-match',gw:7,date:'2026-10-19',
 sourceKickoff:'2026-10-19T19:00:00',home:'Spurs',away:'Coventry City',
 goals:[2,1],shots:[8,7],onTarget:[3,2],corners:[4,3],sourceStatsProcessed:true
};
const all:Record<string,[[number,number],[number,number],[number,number]]>={
 gols:[[2,1],[1,0],[1,1]],
 finalizacoes:[[8,7],[3,4],[5,3]],
 chutes_no_alvo:[[3,2],[1,1],[2,1]],
 escanteios:[[4,3],[1,1],[3,2]]
};
const columns=['id_fonte','tipo_amostra','equipe_amostra','competicao','data',
 'data_titulo_fonte','hora_exibida_fonte','fuso_horario_fonte','divergencia_data',
 'mandante','visitante'];
for(const period of ['jogo','1t','2t'])
 for(const metric of Object.keys(all))
  for(const side of ['mandante','visitante','total'])
   columns.push(metric+'_'+side+'_'+period);
columns.push('fonte','url_fonte','url_fonte_1t','url_fonte_2t',
 'url_fonte_gols_por_tempo','sofascore_status','sofascore_url_partida','observacoes');
function sample(override:Record<string,string>={}){
 const id=override.id_fonte??'test12345';
 const d:Record<string,string>={
  id_fonte:id,tipo_amostra:'teste_pontual',equipe_amostra:'N/D',
  competicao:'Premier League 2026/27',data:'2026-10-19',
  data_titulo_fonte:'2026-10-19',hora_exibida_fonte:'16:00',
  fuso_horario_fonte:'N/D',divergencia_data:'nao',
  mandante:'Tottenham',visitante:'Coventry',fonte:'Flashscore',
  url_fonte:'https://www.flashscore.com.br/?mid='+id,
  url_fonte_1t:'N/D',url_fonte_2t:'N/D',url_fonte_gols_por_tempo:'N/D',
  sofascore_status:'nao_consultado',sofascore_url_partida:'N/D',observacoes:'N/D'
 };
 for(const [metric,parts] of Object.entries(all))
  for(const [i,period] of ['jogo','1t','2t'].entries()){
   d[metric+'_mandante_'+period]=String(parts[i][0]);
   d[metric+'_visitante_'+period]=String(parts[i][1]);
   d[metric+'_total_'+period]=String(parts[i][0]+parts[i][1]);
  }
 Object.assign(d,override);
 return columns.map(x=>d[x]).join(',');
}
const csv=(rows:string[]= [sample()])=>columns.join(',')+'\n'+rows.join('\n');

describe('conferência temporária de Work CSV para Premier League',()=>{
 it('aceita 55 colunas e reconhece Tottenham/Spurs e Coventry/Coventry City',()=>{
  expect(columns).toHaveLength(55);
  const out=reviewWorkResearchForFpl(csv(),[game]);
  expect(out.checked).toBe(1);
  expect(out.rejected).toHaveLength(0);
  expect(out.approved).toHaveLength(1);
  expect(out.approved[0]).toMatchObject({
   gameId:game.id,sourceId:'test12345',home:'Spurs',away:'Coventry City',
   first:{corners:[1,1],goals:[1,0]},
   second:{corners:[3,2],goals:[1,1]}
  });
 });
 it('bloqueia valores parciais N/D sem transformá-los em zero',()=>{
  const incomplete=sample({escanteios_mandante_1t:'N/D',escanteios_total_1t:'N/D'});
  const out=reviewWorkResearchForFpl(csv([incomplete]),[game]);
  expect(out.approved).toHaveLength(0);
  expect(out.rejected[0].reason).toContain('N/D');
 });
 it('bloqueia divergências da fonte gratuita sem alterar o placar',()=>{
  const incorrect={...game,corners:[5,3] as [number,number]};
  const out=reviewWorkResearchForFpl(csv(),[incorrect]);
  expect(out.approved).toHaveLength(0);
  expect(out.rejected[0].reason).toContain('incompatíveis');
 });
 it('bloqueia data de título divergente sem presumir qual está correta',()=>{
  const out=reviewWorkResearchForFpl(csv([sample({data_titulo_fonte:'2026-10-20'})]),[game]);
  expect(out.approved).toHaveLength(0);
  expect(out.rejected[0].reason).toContain('data do título');
 });
 it('rejeita outra temporada, identidade incerta e jogo não processado',()=>{
  expect(reviewWorkResearchForFpl(csv([sample({competicao:'Bundesliga 2026/27'})]),[game]).approved).toHaveLength(0);
  expect(reviewWorkResearchForFpl(csv([sample({mandante:'Outra Equipe'})]),[game]).approved).toHaveLength(0);
  expect(reviewWorkResearchForFpl(csv(),[{...game,sourceStatsProcessed:false}]).approved).toHaveLength(0);
 });
 it('bloqueia duas pesquisas concorrentes para a mesma partida',()=>{
  const out=reviewWorkResearchForFpl(csv([
   sample(),sample({id_fonte:'different2',url_fonte:'https://www.flashscore.com.br/?mid=different2'})
  ]),[game]);
  expect(out.approved).toHaveLength(0);
  expect(out.rejected).toHaveLength(1);
 });
 it('não grava ou altera dados de partida',()=>{
  const before=JSON.stringify(game);
  reviewWorkResearchForFpl(csv(),[game]);
  expect(JSON.stringify(game)).toBe(before);
 });
});

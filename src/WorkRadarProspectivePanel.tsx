import {useEffect,useMemo,useState} from 'react';
import type {WorkAnalysisMatch,WorkLeague} from './workAnalysis';
import {
 WORK_RADAR_PROSPECTIVE_STORAGE,readFrozenWorkForecasts,freezeWorkForecast,
 appendFrozenWorkForecast,settleFrozenWorkForecast,scoreFrozenWorkForecasts,
 type FrozenWorkForecast
} from './workRadarProspective';
import {brasiliaDate} from './calendar';

const format=(n:number,d:number)=>d?(100*n/d).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%':'N/D';
const labels={future:'Aguardando a partida',waiting:'Aguardando estatísticas novas do Work',
 ambiguous:'Identificação da partida em revisão',complete:'Conferido com resultado final'};
type Props={
 matches:WorkAnalysisMatch[];
 league:WorkLeague|undefined;
 home:string;away:string;date:string;
};
export default function WorkRadarProspectivePanel({matches,league,home,away,date}:Props){
 const [kickoff,setKickoff]=useState('');
 const [snapshots,setSnapshots]=useState<FrozenWorkForecast[]>([]);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [expanded,setExpanded]=useState(false);
 const [loaded,setLoaded]=useState(false);
 useEffect(()=>{
  try{setSnapshots(readFrozenWorkForecasts(localStorage.getItem(WORK_RADAR_PROSPECTIVE_STORAGE)));}
  catch(e){setError(e instanceof Error?e.message:'Registros anteriores inacessíveis.');}
  setLoaded(true);
 },[]);
 const today=brasiliaDate();
 const nowValue=today.date+'T'+today.time;
 const selectedAt=date&&kickoff?date+'T'+kickoff:'';
 const eligible=Boolean(
  loaded&&league&&home&&away&&home!==away&&selectedAt&&selectedAt>nowValue&&!error
 );
 const score=useMemo(()=>scoreFrozenWorkForecasts(snapshots,matches,today),[snapshots,matches,today.date]);
 const latest=snapshots.slice(0,12);
 function register(){
  if(!eligible||!league)return;
  setError('');setNotice('');
  try{
   const forecast=freezeWorkForecast(matches,league,home,away,selectedAt,new Date());
   if(!window.confirm(
    'Confirma que este é um confronto REAL e que o horário está em Brasília?\n\n'+
    home+' × '+away+' — '+date+' às '+kickoff+
    '\n\nOs sinais V2/V3 serão salvos de forma imutável ANTES do jogo, separadamente do Radar original.'
   ))return;
   // Re-read disk immediately before append; never replace on a stale state.
   const updated=appendFrozenWorkForecast(localStorage.getItem(WORK_RADAR_PROSPECTIVE_STORAGE),forecast);
   localStorage.setItem(WORK_RADAR_PROSPECTIVE_STORAGE,JSON.stringify(updated));
   setSnapshots(updated);
   setNotice('Teste prospectivo registrado antes do jogo. Sinais V2/V3 e referência congelados; os registros antigos continuam intactos.');
   setKickoff('');
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível salvar. Os registros anteriores foram preservados.');}
 }
 function exportSnapshots(){
  if(!snapshots.length)return;
  const url=URL.createObjectURL(new Blob([JSON.stringify({
   format:WORK_RADAR_PROSPECTIVE_STORAGE,exportedAt:new Date().toISOString(),
   records:snapshots
  },null,2)],{type:'application/json'}));
  const a=document.createElement('a');
  a.href=url;a.download='futstats-radar-work-prospectivo.json';a.click();
  URL.revokeObjectURL(url);
 }
 return <section className="work-radar-prospective" aria-label="Acompanhamento prospectivo Radar Work">
  <h3>Testes prospectivos · novos confrontos</h3>
  <p className="muted">Nesta etapa registramos os sinais <strong>antes do início real</strong> de cada confronto. Eles ficam congelados e são comparados apenas depois de o resultado completo chegar à pesquisa Work. O Radar principal não é alterado.</p>
  <div className="analysis-controls">
   <label>Início do jogo · horário de Brasília
    <input type="time" aria-label="Horário de início em Brasília" value={kickoff}
      onChange={e=>setKickoff(e.target.value)} />
   </label>
  </div>
  <button type="button" className="primary" onClick={register} disabled={!eligible}>
   Registrar teste antes da partida
  </button>
  <p className="muted">Selecione acima a liga, as duas equipes e a data; confirme aqui o horário REAL do jogo. Esta tela não consulta automaticamente a agenda nem registra um confronto passado. O horário é verificado pelo relógio deste dispositivo.</p>
  {selectedAt&&selectedAt<=nowValue&&<p className="alert">O horário informado já passou. Não é permitido criar um registro retroativo.</p>}
  {error&&<p className="alert" role="alert">{error}</p>}
  {notice&&<p className="notice" role="status">{notice}</p>}
  <div className="fpl-pilot-numbers" aria-label="Acompanhamento dos testes Work">
   <div><strong>{snapshots.length}</strong><span>Testes congelados</span></div>
   <div><strong>{score.evaluated}</strong><span>Jogos conferidos</span></div>
   <div><strong>{score.pending}</strong><span>Aguardando jogos ou novos dados</span></div>
  </div>
  {snapshots.length>0&&<>
   <table className="analysis-table">
    <caption>Resultados prospectivos desde o primeiro registro</caption>
    <thead><tr><th>Modelo</th><th>Acertos</th><th>Percentual</th></tr></thead>
    <tbody>
     <tr><th>V2</th><td>{score.v2.hits}/{score.v2.signals}</td><td>{format(score.v2.hits,score.v2.signals)}</td></tr>
     <tr><th>V3 · sinais selecionados</th><td>{score.v3.hits}/{score.v3.signals}</td><td>{format(score.v3.hits,score.v3.signals)}</td></tr>
     <tr><th>Regra simples · mesmos sinais V3</th><td>{score.baseline.hits}/{score.baseline.signals}</td><td>{format(score.baseline.hits,score.baseline.signals)}</td></tr>
    </tbody>
   </table>
   <details className="fpl-pilot-disclosure" open={expanded} onToggle={e=>setExpanded(e.currentTarget.open)}>
    <summary>Ver registros prospectivos ({snapshots.length})</summary>
    <div className="fpl-pilot-games">
     {latest.map(s=>{
      const result=settleFrozenWorkForecast(s,matches,today);
      return <article className="fpl-pilot-game" key={s.id}>
       <div className="fpl-pilot-game-top"><strong>{s.home} × {s.away}</strong><small>{s.matchAt.replace('T',' · ')} (Brasília)</small></div>
       <p className="muted">{labels[result.status]} · registro congelado em {new Date(s.savedAt).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})}</p>
       <details className="fpl-half-stat-details">
        <summary>Ver decisões V2, V3 e referência congeladas</summary>
        <table className="analysis-table">
         <thead><tr><th>Indicador</th><th>V2</th><th>V3</th><th>Referência</th></tr></thead>
         <tbody>{s.markets.map((m,i)=><tr key={m.marketId}>
          <th>{m.label}<small>Linha {m.line}</small></th>
          <td>{m.v2}{result.status==='complete'&&<small>{result.markets[i].v2}</small>}</td>
          <td>{m.v3}{result.status==='complete'&&<small>{result.markets[i].v3}</small>}</td>
          <td>{m.baseline??'N/D'}{result.status==='complete'&&<small>{result.markets[i].baseline}</small>}</td>
         </tr>)}</tbody>
        </table>
        <p className="muted">{s.sourceCount} partidas Work na liga disponíveis quando a previsão foi criada. A decisão antiga nunca é recalculada.</p>
       </details>
      </article>;
     })}
    </div>
    {snapshots.length>12&&<p className="muted">Exibidos os últimos 12 registros. Todos continuam no arquivo privado para exportação.</p>}
   </details>
   <button type="button" onClick={exportSnapshots} className="text-button">Exportar registros Work prospectivos (cópia JSON)</button>
  </>}
  <p className="muted">A comparação acontece quando o novo CSV de resultados encerrados for importado. Não há busca automática em segundo plano. Esses registros possuem armazenamento próprio e ainda não entram na opção geral “Exportar tudo”; use a cópia JSON acima se for trocar de navegador ou dispositivo. Sem odds ou garantia de resultados.</p>
 </section>;
}

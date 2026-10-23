import {useEffect,useMemo,useState} from 'react';
import {WORK_ANALYSIS_LEAGUES,workTeamNames,type WorkAnalysisMatch,type WorkLeague} from './workAnalysis';
import {
 WORK_RADAR_PROSPECTIVE_STORAGE,readFrozenWorkForecasts,freezeWorkForecast,
 appendFrozenWorkForecast,settleFrozenWorkForecast,scoreFrozenWorkForecasts,
 type FrozenWorkForecast
} from './workRadarProspective';
import {brasiliaDate} from './calendar';

const format=(n:number,d:number)=>d?(100*n/d).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%':'N/D';
const labels={future:'Aguardando a partida',waiting:'Aguardando estatísticas novas do Work',
 ambiguous:'Identificação da partida em revisão',complete:'Conferido com resultado final'};
type Props={matches:WorkAnalysisMatch[]};
export default function WorkRadarProspectivePanel({matches}:Props){
 const [chosenLeague,setChosenLeague]=useState<WorkLeague>('serie-a');
 const [chosenHome,setChosenHome]=useState('');
 const [chosenAway,setChosenAway]=useState('');
 const [date,setDate]=useState('');
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
 const available=WORK_ANALYSIS_LEAGUES.filter(item=>matches.some(m=>m.league===item.id));
 const league=available.some(item=>item.id===chosenLeague)?chosenLeague:available[0]?.id;
 const teams=league?workTeamNames(matches,league):[];
 const home=teams.includes(chosenHome)?chosenHome:'';
 const away=teams.includes(chosenAway)?chosenAway:'';
 const selectedAt=date&&kickoff?date+'T'+kickoff:'';
 const invalidTime=Boolean(selectedAt&&selectedAt<=nowValue);
 const alreadySaved=Boolean(
  league&&home&&away&&date&&snapshots.some(s=>s.league===league&&
   s.home===home&&s.away===away&&s.matchAt.slice(0,10)===date)
 );
 const eligible=Boolean(
  loaded&&league&&home&&away&&home!==away&&date&&kickoff&&
  !invalidTime&&!alreadySaved&&!error
 );
 const help=!loaded?'Carregando os registros locais…':
  !available.length?'Nenhum jogo Work encontrado neste navegador.':
  !home?'Selecione o time mandante.':
  !away?'Selecione o time visitante.':
  home===away?'Escolha equipes diferentes.':
  !date?'Informe a data do confronto.':
  !kickoff?'Informe o horário real da partida.':
  invalidTime?'O horário já passou. Escolha um confronto futuro.':
  alreadySaved?'Esse confronto já possui um teste registrado.':
  'Pronto para registrar. Confira se a partida realmente acontecerá na data e horário escolhidos.';
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
  <p className="muted"><strong>Como usar:</strong> escolha abaixo o campeonato, o mandante, o visitante e a data de um jogo real que ainda não começou. Depois informe o horário de Brasília. Tudo fica neste formulário; não precisa procurar campos em outra área do Radar.</p>
  <div className="analysis-controls" aria-label="Formulário completo do teste prospectivo">
   <label>1. Campeonato
    <select aria-label="Campeonato para novo teste prospectivo" value={league??''}
     onChange={e=>{setChosenLeague(e.target.value as WorkLeague);setChosenHome('');setChosenAway('');setNotice('');setError('');}}>
     {!available.length&&<option value="">Nenhum campeonato disponível</option>}
     {available.map(x=><option value={x.id} key={x.id}>{x.label}</option>)}
    </select>
   </label>
   <label>2. Mandante (em casa)
    <select aria-label="Mandante do teste prospectivo" value={home}
     onChange={e=>{setChosenHome(e.target.value);setNotice('');setError('');}}>
     <option value="">Selecione o mandante</option>
     {teams.map(t=><option value={t} key={t}>{t}</option>)}
    </select>
   </label>
   <label>3. Visitante (fora)
    <select aria-label="Visitante do teste prospectivo" value={away}
     onChange={e=>{setChosenAway(e.target.value);setNotice('');setError('');}}>
     <option value="">Selecione o visitante</option>
     {teams.map(t=><option value={t} key={t}>{t}</option>)}
    </select>
   </label>
   <label>4. Data do jogo
    <input type="date" aria-label="Data do novo confronto prospectivo"
     min={today.date} value={date} onChange={e=>{setDate(e.target.value);setNotice('');setError('');}} />
   </label>
   <label>5. Horário do jogo (Brasília)
    <input type="time" aria-label="Horário de início em Brasília"
     value={kickoff} onChange={e=>{setKickoff(e.target.value);setNotice('');setError('');}}/>
   </label>
  </div>
  <p className="muted" role="status">{help}</p>
  {home&&away&&home!==away&&date&&kickoff&&<p className="notice">
   Confronto selecionado: <strong>{home} × {away}</strong> · {date.split('-').reverse().join('/')} às {kickoff} (Brasília).
  </p>}
  <button type="button" className="primary" onClick={register} disabled={!eligible}>
   Registrar teste antes da partida
  </button>
  <p className="muted">O aplicativo não verifica automaticamente a agenda desses campeonatos: confirme a partida e seu horário em uma fonte confiável antes do registro. Após confirmar, os sinais ficam congelados, sem alterar o Radar original.</p>
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

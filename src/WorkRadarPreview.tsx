import {useEffect,useMemo,useState} from 'react';
import {localDate} from './pregame';
import {
 readBrowserWorkAnalysis,WORK_ANALYSIS_LEAGUES,workTeamNames,
 type WorkAnalysisRead,type WorkLeague
} from './workAnalysis';
import {
 workRadarData,projectWorkRadar,backtestWorkRadar
} from './workRadar';
import {validateWorkRadar} from './workRadarValidation';
import WorkRadarProspectivePanel from './WorkRadarProspectivePanel';

const format=(v:number|null)=>v===null?'N/D':
 v.toLocaleString('pt-BR',{maximumFractionDigits:2});
const pct=(a:number,b:number)=>b>0?
 (100*a/b).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%':'N/D';
const signal=(s:string)=>s==='Over'?'Over':s==='Under'?'Under':'Sem sinal';

/**
 * No save button and no write API. This is NOT the user's historical Radar.
 * Its sole purpose is to experiment with Work-derived V2/V3 calculations.
 */
export default function WorkRadarPreview(){
 const [read,setRead]=useState<WorkAnalysisRead|null>(null);
 const [error,setError]=useState('');
 const [chosenLeague,setChosenLeague]=useState<WorkLeague>('serie-a');
 const [names,setNames]=useState<[string,string]>(['','']);
 const [date,setDate]=useState(localDate());
 const [showBacktest,setShowBacktest]=useState(false);
 useEffect(()=>{
  try{setRead(readBrowserWorkAnalysis());}
  catch(e){setError(e instanceof Error?e.message:'Pesquisa Work não disponível.');}
 },[]);
 const matches=read?.matches??[];
 const available=WORK_ANALYSIS_LEAGUES.filter(l=>matches.some(m=>m.league===l.id));
 const league=available.some(l=>l.id===chosenLeague)?chosenLeague:available[0]?.id;
 const teams=league?workTeamNames(matches,league):[];
 const home=teams.includes(names[0])?names[0]:teams[0]??'';
 const away=teams.includes(names[1])?names[1]:teams.find(n=>n!==home)??'';
 const cutoff=date&&date<localDate()?date:localDate();
 const data=useMemo(()=>league?workRadarData(matches,league):null,[matches,league]);
 const projections=data&&home&&away&&home!==away&&date?
  projectWorkRadar(data,home,away,cutoff):[];
 const backtest=useMemo(()=>showBacktest&&data?backtestWorkRadar(data):null,[showBacktest,data]);
 const combined=useMemo(()=>read?validateWorkRadar(matches):null,[read,matches]);
 const count=(read?.europeCount??0)+(read?.premierCount??0);

 return <section className="panel work-radar-panel" aria-label="Radar V2 V3 experimental com Work">
  <div className="panel-head"><div>
   <h2>Radar Work · Teste experimental V2 × V3</h2>
   <p>Os mesmos critérios por mando do Radar, agora testados sobre as pesquisas europeias completas</p>
  </div><span className="tag">SOMENTE LEITURA</span></div>
  <div className="analysis-content">
   <p className="muted">Esta área é independente do Radar original. Não registra previsões, não altera os resultados anteriores e não importa os jogos Work para o Histórico. As projeções são exploratórias e não representam chances de acerto ou indicação de aposta.</p>
   <div className="fpl-pilot-numbers" aria-label="Amostra Radar Work">
    <div><strong>{count}</strong><span>Jogos Work salvos</span></div>
    <div><strong>{data?.matches.length??0}</strong><span>Jogos da liga escolhida</span></div>
    <div><strong>{projections.filter(x=>x.v3.decision!=='Sem sinal').length}</strong><span>Sinais V3 após filtros</span></div>
   </div>
   {error&&<p className="alert" role="alert">{error}. Dados anteriores preservados.</p>}
   {!error&&read&&count===0&&<p className="muted">Abra o FutStats no navegador em que foram salvas as pesquisas Work.</p>}
   {read&&read.unresolved>0&&<p className="alert" role="alert">{read.unresolved} registros sem identificação local ficaram fora do teste. Os arquivos não foram modificados.</p>}
   {combined&&combined.total.fixtures>0&&<section className="work-radar-validation" aria-label="Validação retrospectiva Work V2 V3 nas quatro ligas">
    <h3>Validação cronológica · quatro ligas</h3>
    <p className="muted">Treinamos a direção da referência no início de cada campeonato e avaliamos os modelos nas partidas posteriores, sempre usando apenas dados anteriores a cada confronto.</p>
    <table className="analysis-table">
     <caption>Acertos em jogos posteriores ao período inicial</caption>
     <thead><tr><th>Modelo</th><th>Acertos</th><th>Taxa</th></tr></thead>
     <tbody>
      <tr><th>V2 · todos os sinais</th>
       <td>{combined.total.v2.correct}/{combined.total.v2.signals}</td>
       <td>{pct(combined.total.v2.correct,combined.total.v2.signals)}</td></tr>
      <tr><th>V3 · sinais selecionados</th>
       <td>{combined.total.v3.correct}/{combined.total.v3.signals}</td>
       <td>{pct(combined.total.v3.correct,combined.total.v3.signals)}</td></tr>
      <tr><th>Regra simples · mesmos sinais V3</th>
       <td>{combined.total.baseline.correct}/{combined.total.baseline.signals}</td>
       <td>{pct(combined.total.baseline.correct,combined.total.baseline.signals)}</td></tr>
     </tbody>
    </table>
    <p className="muted">{combined.total.v3.signals===0?'Ainda não houve sinais V3 para avaliar.':
     combined.total.v3.signals!==combined.total.baseline.signals?
      'Referência indisponível para todos os sinais V3; não é possível concluir vantagem.':
     combined.total.v3.correct>combined.total.baseline.correct?
      'V3 acima da referência nesta amostra retrospectiva; isso não comprova vantagem futura.':
      'V3 ainda não superou a regra simples nos mesmos confrontos. Manter o Radar principal inalterado.'}
    </p>
    <details className="fpl-pilot-disclosure">
     <summary>Ver avaliação de cada campeonato</summary>
     <table className="analysis-table">
      <caption>Totais agrupados dos três mercados de cada liga</caption>
      <thead><tr><th>Campeonato</th><th>V2 · todos</th><th>V3 · aceitos</th><th>Regra simples · aceitos</th></tr></thead>
      <tbody>{combined.leagues.map(l=><tr key={l.id}>
       <th>{l.name}<small>Validação a partir de {l.validationStart??'N/D'}</small></th>
       <td>{l.v2.correct}/{l.v2.signals}</td>
       <td>{l.v3.correct}/{l.v3.signals}</td>
       <td>{l.baseline.correct}/{l.baseline.signals}</td>
      </tr>)}</tbody>
     </table>
    </details>
    <p className="muted">Os 87 sinais do V2 e os 45 selecionados pelo V3 não são amostras iguais; a comparação justa do V3 é com a referência aplicada aos mesmos 45. Os três mercados podem reutilizar a mesma partida, portanto os sinais não são independentes. As estatísticas representam uma avaliação histórica com amostra limitada, não probabilidades ou rentabilidade. Nenhum palpite ou previsão anterior é alterado.</p>
   </section>}
   {league&&<div className="analysis-controls">
    <label>Campeonato
     <select aria-label="Liga no Radar Work" value={league}
      onChange={e=>{setChosenLeague(e.target.value as WorkLeague);setNames(['','']);setShowBacktest(false);}}>
      {available.map(l=><option value={l.id} key={l.id}>{l.label}</option>)}
     </select>
    </label>
    <label>Mandante
     <select aria-label="Mandante no Radar Work" value={home}
      onChange={e=>setNames([e.target.value,away])}>
      {teams.map(t=><option key={t}>{t}</option>)}
     </select>
    </label>
    <label>Visitante
     <select aria-label="Visitante no Radar Work" value={away}
      onChange={e=>setNames([home,e.target.value])}>
      {teams.map(t=><option key={t}>{t}</option>)}
     </select>
    </label>
    <label>Data do confronto
     <input type="date" aria-label="Data do confronto no Radar Work"
      value={date} onChange={e=>setDate(e.target.value)}/>
    </label>
   </div>}
   {home===away&&home!==''&&<p className="alert" role="alert">Escolha equipes diferentes.</p>}
   {date&&date>localDate()&&<p className="muted">Data futura: estatísticas consideradas somente até hoje, excluindo também os jogos do próprio dia.</p>}
   {projections.length>0&&<>
    <p className="muted">V2: projeção de gols/finalizações/chutes no gol com margem fixa de 15% em relação à linha, exigindo pelo menos três jogos válidos de cada equipe no mando relevante. V3: mantém um sinal V2 somente quando os testes de médias e frequência por mando concordam. Ambos usam apenas jogos anteriores à data escolhida.</p>
    <div className="radar-v2-grid">
     {projections.map(m=><article className="radar-v2-card" key={m.marketId}>
      <h4>{m.label}<small>Linha ilustrativa {format(m.line)}</small></h4>
      <div className="radar-v2-comparison">
       <div><span>V2</span><strong>{signal(m.v2.decision)}</strong><small>Total projetado {format(m.v2.projectedTotal)}</small></div>
       <div><span>V3</span><strong>{signal(m.v3.decision)}</strong><small>{m.v3.reason==='confirmed'?'Filtros concordantes':m.v3.reason==='insufficient_venue_history'?'Histórico insuficiente':m.v3.reason==='venue_disagreement'?'Filtros discordantes':'V2 sem sinal'}</small></div>
      </div>
      <p className="muted">Amostra válida no mando: {m.homeCount} jogos do mandante em casa e {m.awayCount} do visitante fora (até dez anteriores considerados por equipe).</p>
     </article>)}
    </div>
   </>}
   <WorkRadarProspectivePanel matches={matches} league={league} home={home} away={away} date={date}/>
   <details className="fpl-pilot-disclosure" open={showBacktest}
    onToggle={e=>setShowBacktest(e.currentTarget.open)}>
    <summary>Conferir teste cronológico V2 × V3 desta liga</summary>
    {backtest&&<>
     <p className="muted">Amostra: {backtest.fixtures} jogos; desenvolvimento até {backtest.trainingEnd??'N/D'} e validação desde {backtest.validationStart??'N/D'}. Jogos do mesmo dia não entram em lados diferentes. As regras V2/V3 são fixas; nenhum ajuste foi feito em função do teste.</p>
     <table className="analysis-table"><caption>Resultados somente no último período, fora da construção inicial</caption>
      <thead><tr><th>Indicador</th><th>V2 · todos sinais</th><th>V3 · aceitos</th><th>Comparação</th></tr></thead>
      <tbody>{backtest.markets.map(m=><tr key={m.id}>
       <th>{m.label}<small>Linha {format(m.line)}</small></th>
       <td>{pct(m.v2All.correct,m.v2All.signals)}<small>{m.v2All.correct}/{m.v2All.signals}</small></td>
       <td>{pct(m.v3.correct,m.v3.signals)}<small>{m.v3.correct}/{m.v3.signals}</small></td>
       <td>{m.v3.signals>=20&&m.constant.signals===m.v3.signals?
         'Referência fixa '+pct(m.constant.correct,m.constant.signals)+' ('+m.constant.correct+'/'+m.constant.signals+')':
         'Amostra insuficiente para conclusão (mín. 20 sinais)'}</td>
      </tr>)}</tbody>
     </table>
     <p className="muted">O V3 pode ter menos sinais que o V2; percentuais com denominadores diferentes não demonstram superioridade. A referência constante é aplicada somente aos jogos aceitos pelo V3. Sem odds, custos nem evidência de rentabilidade.</p>
    </>}
   </details>
   <p className="muted">Ao escolher um confronto já encerrado, esta é uma simulação feita com o histórico anterior à data, não uma previsão gravada antes do evento. As previsões antigas do Radar permanecem intactas.</p>
  </div>
 </section>;
}

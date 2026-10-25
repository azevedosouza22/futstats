import {useEffect,useState} from 'react';
import {localDate} from './pregame';
import {
 WORK_ANALYSIS_LEAGUES,WORK_ANALYSIS_METRICS,
 readBrowserWorkAnalysis,workTeamAverage,workTeamNames,
 type WorkAnalysisRead,type WorkLeague,type WorkPeriod
} from './workAnalysis';

const format=(value:number|null):string=>value===null?'N/D':
 value.toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:2});
const dateLabel=(value:string)=>new Date(value+'T12:00:00').toLocaleDateString('pt-BR');
const periodNames:Record<WorkPeriod,string>={
 full:'Partida completa',first:'1º tempo',second:'2º tempo'
};
export default function WorkPreGame(){
 const [read,setRead]=useState<WorkAnalysisRead|null>(null);
 const [error,setError]=useState('');
 const [leagueChoice,setLeagueChoice]=useState<WorkLeague>('serie-a');
 const [teamChoices,setTeamChoices]=useState<[string,string]>(['','']);
 const [period,setPeriod]=useState<WorkPeriod>('full');
 const [venue,setVenue]=useState<'match'|'all'>('match');
 const [fixtureDate,setFixtureDate]=useState(localDate());

 useEffect(()=>{
  const refresh=()=>{
   try{setRead(readBrowserWorkAnalysis());setError('');}
   catch(e){setRead(null);setError(e instanceof Error?e.message:'Não foi possível consultar as pesquisas Work.');}
  };
  refresh();
  window.addEventListener('storage',refresh);
  window.addEventListener('futstats:work-research-updated',refresh);
  return ()=>{
   window.removeEventListener('storage',refresh);
   window.removeEventListener('futstats:work-research-updated',refresh);
  };
 },[]);

 const matches=read?.matches??[];
 const available=WORK_ANALYSIS_LEAGUES.filter(x=>matches.some(m=>m.league===x.id));
 const league=available.some(x=>x.id===leagueChoice)?leagueChoice:available[0]?.id;
 const teams=league?workTeamNames(matches,league):[];
 const home=teams.includes(teamChoices[0])?teamChoices[0]:teams[0]??'';
 const away=teams.includes(teamChoices[1])?teamChoices[1]:(teams.find(t=>t!==home)??'');
 const today=localDate();
 const cutoff=fixtureDate&&fixtureDate<today?fixtureDate:today;
 const total=read?read.europeCount+read.premierCount:0;
 const eligible=Boolean(league&&home&&away&&home!==away&&fixtureDate);
 const samples=eligible&&league?[
  {
   side:'Mandante',name:home,
   five:workTeamAverage(matches,league,home,period,venue==='match'?'home':'all',5,cutoff),
   ten:workTeamAverage(matches,league,home,period,venue==='match'?'home':'all',10,cutoff)
  },
  {
   side:'Visitante',name:away,
   five:workTeamAverage(matches,league,away,period,venue==='match'?'away':'all',5,cutoff),
   ten:workTeamAverage(matches,league,away,period,venue==='match'?'away':'all',10,cutoff)
  }
 ]:[];

 return <section className="panel work-pregame-panel" aria-label="Análise pré-jogo Work experimental">
  <div className="panel-head">
   <div>
    <h2>Pré-jogo · Médias das pesquisas Work</h2>
    <p>Quatro campeonatos 2026/27 · confronto por mando e pelos três períodos</p>
   </div>
   <span className="tag">EXPERIMENTAL · LEITURA</span>
  </div>
  <div className="analysis-content">
   <p className="muted">As médias abaixo consultam apenas os arquivos Work completos já salvos neste dispositivo. Não misturam campeonatos nem alteram o Histórico de 659 partidas ou previsões do Radar. São médias descritivas, não palpites ou probabilidades de resultado.</p>
   <div className="fpl-pilot-numbers" aria-label="Cobertura das pesquisas Work">
    <div><strong>{total}</strong><span>Pesquisas Work salvas</span></div>
    <div><strong>{read?.europeCount??0}</strong><span>Serie A, La Liga e Ligue 1</span></div>
    <div><strong>{read?.premierCount??0}</strong><span>Premier League</span></div>
    <div><strong>{matches.length}</strong><span>Partidas aptas para análise</span></div>
   </div>
   {error&&<p role="alert" className="alert">{error} Nenhum registro existente foi modificado.</p>}
   {read&&read.unresolved>0&&<p role="alert" className="alert">{read.unresolved} partida(s) Work sem identificação local no calendário CC0. Elas não entram nas médias; as estatísticas continuam salvas e intactas.</p>}
   {!error&&read&&matches.length===0&&<p className="notice">Ainda não foram encontradas partidas Work neste navegador. Confira se está usando o mesmo endereço do FutStats no qual os arquivos foram importados.</p>}
   {league&&<div className="analysis-controls">
    <label>Campeonato
     <select aria-label="Campeonato de pesquisa Work" value={league}
      onChange={e=>{setLeagueChoice(e.target.value as WorkLeague);setTeamChoices(['','']);}}>
      {available.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}
     </select>
    </label>
    <label>Equipe mandante
     <select aria-label="Mandante do pré-jogo Work" value={home}
      onChange={e=>setTeamChoices([e.target.value,away])}>
      {teams.map(t=><option key={t} value={t}>{t}</option>)}
     </select>
    </label>
    <label>Equipe visitante
     <select aria-label="Visitante do pré-jogo Work" value={away}
      onChange={e=>setTeamChoices([home,e.target.value])}>
      {teams.map(t=><option key={t} value={t}>{t}</option>)}
     </select>
    </label>
    <label>Data do confronto
     <input aria-label="Data do confronto pré-jogo Work" type="date" value={fixtureDate}
      onChange={e=>setFixtureDate(e.target.value)}/>
    </label>
    <label>Local de jogo
     <select aria-label="Recorte das médias Work" value={venue}
      onChange={e=>setVenue(e.target.value as 'match'|'all')}>
      <option value="match">Mandante em casa × visitante fora</option>
      <option value="all">Todos os jogos (casa e fora)</option>
     </select>
    </label>
   </div>}
   {league&&<div className="segment analysis-period" aria-label="Período da pesquisa Work">
    {(['first','second','full'] as const).map(k=><button key={k} type="button"
     className={period===k?'selected':''} onClick={()=>setPeriod(k)}>{periodNames[k]}</button>)}
   </div>}
   {home&&away&&home===away&&<p role="alert" className="alert">Escolha equipes diferentes.</p>}
   {!fixtureDate&&<p role="alert" className="alert">Informe a data do confronto.</p>}
   {eligible&&<div className="pregame-grid">
    {samples.map(sample=><article className="pregame-card" key={sample.side}>
     <h3>{sample.name} · {sample.side}</h3>
     <p className="muted">{periodNames[period]} · {venue==='match'?(sample.side==='Mandante'?'apenas em casa':'apenas fora'):'casa e fora'}. Amostra: {sample.five.count}/5 e {sample.ten.count}/10 partidas anteriores a {dateLabel(cutoff)}.</p>
     {sample.five.count<3&&<p className="muted">Amostra pequena. Compare com cautela: há menos de três jogos neste recorte.</p>}
     <p className="muted"><strong>Escanteios a favor / contra:</strong> {format(sample.five.values.corners.for)} / {format(sample.five.values.corners.against)} (últimos 5) · {format(sample.ten.values.corners.for)} / {format(sample.ten.values.corners.against)} (últimos 10)</p>
     <table className="analysis-table">
      <caption>Médias a favor e contra por jogo</caption>
      <thead><tr><th>Estatística</th><th>Últimos 5</th><th>Últimos 10</th></tr></thead>
      <tbody>{WORK_ANALYSIS_METRICS.map(m=><tr key={m.key}>
       <th>{m.label}</th>
       {([sample.five,sample.ten] as const).map((window,i)=><td key={i}>
        <b>{format(window.values[m.key].for)}</b>
        <small>Contra: {format(window.values[m.key].against)}</small>
       </td>)}
      </tr>)}</tbody>
     </table>
     <details><summary>Jogos utilizados ({sample.ten.count})</summary>
      {sample.ten.selected.length?
       <ul className="source-list">{sample.ten.selected.map(m=><li key={m.id}>
        {dateLabel(m.date)} · {m.home} × {m.away}
        <small>Pesquisa Work · <a href={m.sourceUrl} target="_blank" rel="noopener noreferrer">Consultar fonte</a></small>
       </li>)}</ul>:
       <p className="muted">Não há jogos anteriores à data escolhida para esse recorte.</p>}
     </details>
    </article>)}
   </div>}
   <p className="muted">Número principal = média a favor; “Contra” = média sofrida/cedida. Cada recorte usa até cinco ou dez partidas realmente disponíveis, sem completar amostras artificialmente. Jogos da data do confronto e datas futuras são excluídos. Alterações nos dados Work são refletidas automaticamente quando você volta a esta página; as previsões antigas do Radar nunca são recalculadas.</p>
  </div>
 </section>;
}

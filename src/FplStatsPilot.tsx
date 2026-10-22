import {useEffect,useState} from 'react';
import {crossCheckFpl,parseFplPilot,FPL_PREVIEW_HOME,FPL_PREVIEW_RAW,FPL_PREVIEW_ROUNDS,type FplPilotGame} from './fplFreePilot';
import {OPENFOOTBALL_URL} from './openFootball';

type Audit={games:FplPilotGame[];compared:number;agreed:number;disagreed:number;notLocated:number};
const gameDate=(date:string)=>new Date(date+'T12:00:00').toLocaleDateString('pt-BR');
const pair=(p:[number,number])=>p[0]+' × '+p[1];
export default function FplStatsPilot(){
 const [audit,setAudit]=useState<Audit|null>(null);
 const [round,setRound]=useState(7);
 const [tries,setTries]=useState(0);
 const [busy,setBusy]=useState(true);
 const [error,setError]=useState('');
 const [updatedAt,setUpdatedAt]=useState('');
 useEffect(()=>{
  const controller=new AbortController();
  async function load(){
   setBusy(true);setError('');
   try{
    const urls=[FPL_PREVIEW_RAW+'teams.csv',
     ...Array.from({length:FPL_PREVIEW_ROUNDS},(_,i)=>
      FPL_PREVIEW_RAW+'By%20Tournament/Premier%20League/GW'+(i+1)+'/matches.csv'),
     OPENFOOTBALL_URL];
    const replies=await Promise.all(urls.map(url=>fetch(url,{signal:controller.signal,cache:'no-store'})));
    if(replies.some(r=>!r.ok))throw Error('Um dos arquivos gratuitos não pôde ser consultado.');
    const texts=await Promise.all(replies.map(r=>r.text()));
    if(texts.some(c=>c.length>250000))throw Error('Arquivo acima do limite de segurança.');
    const games=parseFplPilot(texts[0],texts.slice(1,-1));
    const verification=crossCheckFpl(games,JSON.parse(texts[texts.length-1]) as unknown);
    if(controller.signal.aborted)return;
    setAudit({games,...verification});setUpdatedAt(new Date().toISOString());
   }catch(e){
    if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Falha na consulta de estatísticas gratuitas.');
   }finally{if(!controller.signal.aborted)setBusy(false);}
  }
  void load();return ()=>controller.abort();
 },[tries]);
 const selected=audit?.games.filter(g=>g.gw===round)??[];
 const comparisonOk=!!audit&&audit.compared>0&&audit.disagreed===0&&audit.notLocated===0;
 return <section className="panel fpl-stats-pilot" aria-label="Estatísticas gratuitas em avaliação">
  <div className="panel-head"><div>
   <h2>Premier League 2026/27 · Estatísticas em avaliação</h2>
   <p>Dados de gols, finalizações, chutes no gol e escanteios — somente jogo completo.</p>
  </div><span className="tag">{audit?audit.games.length+' PARTIDAS':busy?'CONSULTANDO…':'PILOTO · LEITURA'}</span></div>
  <div className="fpl-pilot-content">
   {busy&&!audit&&<p className="notice" role="status">Conferindo os arquivos gratuitos das sete primeiras rodadas…</p>}
   {audit&&<div className="fpl-pilot-numbers" aria-label="Resumo da Premier League 2026/27">
     <div><strong>{audit.games.length}</strong><span>Partidas com estatísticas</span></div>
     <div><strong>{audit.compared}</strong><span>Placares comparados</span></div>
     <div><strong>{audit.agreed}</strong><span>Placares concordantes</span></div>
     <div><strong>{audit.disagreed}</strong><span>Divergências</span></div>
    </div>}
   <p className="fpl-pilot-simple-notice"><strong>Somente consulta:</strong> jogos ainda não são adicionados à base de 659 partidas nem ao Radar.</p>
   <details className="fpl-pilot-disclosure">
    <summary>Por que os dados ainda estão em avaliação?</summary>
    <p>O autor permite reutilização no README, mas as permissões sobre todas as fontes originais ainda não foram confirmadas para uso comercial. As estatísticas de primeiro e segundo tempo também estão indisponíveis. Os registros permanecerão separados da base principal.</p>
   </details>
   <button className="text-button" type="button" disabled={busy} onClick={()=>setTries(v=>v+1)}>
    {busy?'Conferindo arquivos…':'Conferir dados novamente'}
   </button>
   {error&&<p className="alert" role="alert">{error}{audit?' Mantendo a última auditoria bem-sucedida nesta tela.':''}</p>}
   {audit&&<>
    <p className={comparisonOk?'notice':'alert'} role="status">
     {comparisonOk?'Conferência independente: '+audit.agreed+'/'+audit.compared+' placares coincidem com o OpenFootball.':
      'Atenção: '+audit.disagreed+' divergências e '+audit.notLocated+' resultados sem correspondência. Não utilizar automaticamente.'}
    </p>
    <p className="muted">Os indicadores abaixo são totais do jogo completo. Não representam estatísticas separadas por tempo. Dados sem fonte ou período comprovado continuam N/D.</p>
    <label className="fpl-pilot-round">Escolher rodada
     <select aria-label="Escolher rodada das estatísticas experimentais" value={round} onChange={e=>setRound(Number(e.target.value))}>
      {Array.from({length:FPL_PREVIEW_ROUNDS},(_,i)=>i+1).map(v=><option value={v} key={v}>Rodada {v}</option>)}
     </select>
    </label>
    <div className="fpl-pilot-games">
     {selected.map(g=><article key={g.id} className="fpl-pilot-game">
      <div className="fpl-pilot-game-top"><strong>{g.home} × {g.away}</strong><small>{gameDate(g.date)}</small></div>
      <div className="fpl-pilot-metrics">
       <div><small>Gols</small><strong>{pair(g.goals)}</strong></div>
       <div><small>Finalizações</small><strong>{pair(g.shots)}</strong></div>
       <div><small>Chutes no gol</small><strong>{pair(g.onTarget)}</strong></div>
       <div><small>Escanteios</small><strong>{pair(g.corners)}</strong></div>
      </div>
     </article>)}
    </div>
    <p className="muted">Cada dupla de valores está na ordem mandante × visitante. Data conforme a origem; fuso de horário não presumido. 1º e 2º tempo: N/D até serem obtidos dados verificáveis. A concordância de placares não valida automaticamente todas as estatísticas.</p>
    {updatedAt&&<p className="muted">Última consulta: {new Date(updatedAt).toLocaleString('pt-BR')}.</p>}
   </>}
   <p className="muted">Fonte dos indicadores: <a href={FPL_PREVIEW_HOME} target="_blank" rel="noreferrer">FPL Core Insights ↗</a>. Conferência dos placares: <a href="https://github.com/openfootball/football.json" target="_blank" rel="noreferrer">OpenFootball CC0 ↗</a>. Sem cobrança, sem apostas, sem uso para previsão enquanto o piloto estiver isolado.</p>
  </div>
 </section>;
}
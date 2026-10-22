import {useEffect,useState} from 'react';
import {crossCheckFpl,parseFplPilot,FPL_PREVIEW_HOME,FPL_PREVIEW_RAW,FPL_PREVIEW_ROUNDS,type FplPilotGame} from './fplFreePilot';
import {OPENFOOTBALL_URL} from './openFootball';
import {discoverNewFplRounds,inspectNextFplRound,type DiscoveryResult,type NextRoundFixture} from './fplRoundDiscovery';
import {auditFplShotEvents,type ShotAudit} from './fplPeriodAudit';
import {unavailableFplIndicators} from './fplFallback';

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
 const [discovery,setDiscovery]=useState<Pick<DiscoveryResult,'lastCompleteRound'|'nextRoundPending'|'reason'>|null>(null);
 const [nextGames,setNextGames]=useState<NextRoundFixture[]>([]);
 const [nextGamesError,setNextGamesError]=useState('');
 const [shotAudit,setShotAudit]=useState<ShotAudit|null>(null);
 const [shotBusy,setShotBusy]=useState(false);
 const [shotError,setShotError]=useState('');
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
    const sourceRounds=new Map<number,string>();
    const discovered=await discoverNewFplRounds(texts.slice(1,-1),async gw=>{
      const url=FPL_PREVIEW_RAW+'By%20Tournament/Premier%20League/GW'+gw+'/matches.csv';
      const response=await fetch(url,{signal:controller.signal,cache:'no-store'});
      if(!response.ok)return null;
      const csv=await response.text();
      if(csv.length>250000)throw Error('Arquivo de nova rodada excedeu o limite previsto.');
      sourceRounds.set(gw,csv);
      return csv;
    });
    const games=parseFplPilot(texts[0],discovered.completedCsvs);
    const verification=crossCheckFpl(games,JSON.parse(texts[texts.length-1]) as unknown);
    if(controller.signal.aborted)return;
    setAudit({games,...verification});setUpdatedAt(new Date().toISOString());
    setDiscovery({lastCompleteRound:discovered.lastCompleteRound,
      nextRoundPending:discovered.nextRoundPending,reason:discovered.reason});
    let parsedNext:NextRoundFixture[]=[];
    let upcomingError='';
    if(discovered.nextRoundPending!==null&&sourceRounds.has(discovered.nextRoundPending)){
      try{
        parsedNext=inspectNextFplRound(
          sourceRounds.get(discovered.nextRoundPending)!,discovered.nextRoundPending,texts[0]);
      }catch{
        upcomingError='A fonte ainda não permite identificar com segurança os dez jogos da próxima rodada.';
      }
    }
    setNextGames(parsedNext);setNextGamesError(upcomingError);
    setRound(prev=>prev===FPL_PREVIEW_ROUNDS?discovered.lastCompleteRound:prev);
   }catch(e){
    if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Falha na consulta de estatísticas gratuitas.');
   }finally{if(!controller.signal.aborted)setBusy(false);}
  }
  void load();return ()=>controller.abort();
 },[tries]);
 useEffect(()=>{
  if(!audit)return;
  const controller=new AbortController();
  const load=async()=>{
   setShotBusy(true);setShotError('');setShotAudit(null);
   try{
    const lastRound=Math.max(FPL_PREVIEW_ROUNDS,...audit.games.map(g=>g.gw));
    const urls=Array.from({length:lastRound},(_,i)=>
      FPL_PREVIEW_RAW+'By%20Tournament/Premier%20League/GW'+(i+1)+'/shots.csv');
    const replies=await Promise.all(urls.map(url=>fetch(url,{signal:controller.signal,cache:'no-store'})));
    if(replies.some(r=>!r.ok))throw Error('A fonte não disponibilizou todos os registros de finalizações.');
    const texts=await Promise.all(replies.map(r=>r.text()));
    if(texts.some(x=>x.length>250000))throw Error('O arquivo de finalizações excedeu o limite de segurança.');
    const report=auditFplShotEvents(audit.games,texts);
    if(!controller.signal.aborted)setShotAudit(report);
   }catch(e){
    if(!controller.signal.aborted)setShotError(e instanceof Error?e.message:'Auditoria de finalizações indisponível.');
   }finally{if(!controller.signal.aborted)setShotBusy(false);}
  };
  void load();
  return ()=>controller.abort();
 },[audit]);
  const selected=audit?.games.filter(g=>g.gw===round)??[];
 const processed=audit?.games.filter(g=>g.sourceStatsProcessed).length??0;
 const pending=(audit?.games.length??0)-processed;
 const comparisonOk=!!audit&&audit.compared>0&&audit.disagreed===0&&audit.notLocated===0;
 return <section className="panel fpl-stats-pilot" aria-label="Estatísticas gratuitas em avaliação">
  <div className="panel-head"><div>
   <h2>Premier League 2026/27 · Estatísticas em avaliação</h2>
   <p>Totais do jogo e, quando os registros conferem, finalizações por tempo.</p>
  </div><span className="tag">{audit?audit.games.length+' PARTIDAS':busy?'CONSULTANDO…':'PILOTO · LEITURA'}</span></div>
  <div className="fpl-pilot-content">
   {busy&&!audit&&<p className="notice" role="status">Conferindo os arquivos gratuitos e procurando novas rodadas concluídas…</p>}
   {audit&&<div className="fpl-pilot-numbers" aria-label="Resumo da Premier League 2026/27">
     <div><strong>{audit.games.length}</strong><span>Jogos encontrados</span></div>
     <div><strong>{processed}</strong><span>Marcados como processados</span></div>
     <div><strong>{pending}</strong><span>Pendente de validação</span></div>
     <div><strong>{audit.compared}</strong><span>Placares comparados</span></div>
    </div>}
   <p className="fpl-pilot-simple-notice"><strong>Somente consulta:</strong> jogos não são adicionados à base do FutStats nem às previsões do Radar.</p>
   {discovery&&<p className="notice" role="status">
     <strong>Atualização automática:</strong> a fonte contém {discovery.lastCompleteRound} rodadas completas verificadas nesta consulta.
     {discovery.nextRoundPending!==null&&<> A rodada {discovery.nextRoundPending} ainda não está concluída ou não está disponível na fonte. Ela só entrará quando os dez jogos terminarem e apresentarem estatísticas utilizáveis.</>}
     {' '}A atualização ocorre ao abrir esta tela ou selecionar “Conferir dados novamente”.
    </p>}
   {discovery?.nextRoundPending!==null&&discovery&&<section className="fpl-next-round" aria-label="Acompanhamento da próxima rodada">
     <div className="fpl-next-round-top">
      <div>
       <h3>Próxima rodada · {discovery.nextRoundPending}</h3>
       <p className="muted">Jogos da temporada atual, atualizados ao abrir esta tela ou consultar novamente.</p>
      </div>
      <span className="tag">ACOMPANHAMENTO</span>
     </div>
     {nextGamesError&&<p className="alert">{nextGamesError}</p>}
     {nextGames.length===0&&!nextGamesError&&<p className="muted">A relação detalhada da próxima rodada ainda não está disponível na fonte gratuita.</p>}
     {nextGames.length>0&&<>
      <div className="fpl-next-round-summary">
       <span><strong>{nextGames.filter(x=>x.status==='concluido').length}</strong> com estatísticas</span>
       <span><strong>{nextGames.filter(x=>x.status==='em-revisao').length}</strong> em revisão</span>
       <span><strong>{nextGames.filter(x=>x.status==='a-jogar').length}</strong> a jogar</span>
      </div>
      <div className="fpl-next-round-fixtures">
       {nextGames.map(g=><div key={g.id} className="fpl-next-round-fixture">
        <div className="fpl-next-round-name"><b>{g.home} × {g.away}</b><small>{gameDate(g.date.slice(0,10))}</small></div>
        <span className={'fpl-next-round-status '+g.status}>
         {g.status==='concluido'?'Concluído':g.status==='em-revisao'?'Em revisão':'A jogar'}
        </span>
        <span className="fpl-next-round-score">{g.fullTime?pair(g.fullTime):'N/D'}</span>
       </div>)}
      </div>
      <p className="muted">Resultados N/D não significam empate. Jogos encerrados só entram no catálogo estatístico quando a rodada completa cumprir os critérios de integridade. Nenhum registro é salvo no Histórico ou no Radar.</p>
     </>}
    </section>}
   <details className="fpl-pilot-disclosure">
    <summary>Por que os dados ainda estão em avaliação?</summary>
    <p>O autor permite reutilização no README, mas as permissões sobre todas as fontes originais ainda não foram confirmadas para uso comercial. As estatísticas por tempo são parciais: finalizações e chutes no gol somente em partidas cujos eventos são conciliados. Escanteios por tempo não estão disponíveis. Os registros permanecerão separados da base principal.</p>
   </details>
   <button className="text-button" type="button" disabled={busy} onClick={()=>setTries(v=>v+1)}>
    {busy?'Conferindo arquivos…':'Conferir dados novamente'}
   </button>
   {error&&<p className="alert" role="alert">{error}{audit?' Mantendo a última auditoria bem-sucedida nesta tela.':''}</p>}
   {audit&&<>
    {pending>0&&<p className="fpl-pilot-warning" role="status">
       <strong>{pending} partida em revisão na fonte.</strong> Seus números não serão apresentados como estatísticas confirmadas e não serão usados no Radar.
      </p>}
    <section className="fpl-period-quality" aria-label="Auditoria dos eventos de finalização por tempo">
     <h3>Conferência dos eventos de finalização</h3>
     <p className="muted">Comparamos cada finalização registrada com o total do jogo completo. Só consideramos uma partida consistente quando os totais de finalizações e chutes no gol de ambas as equipes coincidem, e todos os eventos têm minuto válido.</p>
     {shotBusy&&<p role="status">Conferindo os registros de cada jogo…</p>}
     {shotError&&<p className="alert" role="alert">Não foi possível concluir esta conferência: {shotError}. O catálogo de 70 jogos permanece disponível.</p>}
     {shotAudit&&<div className="fpl-period-quality-numbers">
      <div><strong>{shotAudit.reconciled}</strong><span>Registros de chutes consistentes</span></div>
      <div><strong>{shotAudit.divergent}</strong><span>Com diferenças</span></div>
      <div><strong>{shotAudit.pending}</strong><span>Pendente na fonte</span></div>
     </div>}
     <p className="muted">Apenas partidas consistentes recebem finalizações e chutes no gol por 1º/2º tempo neste piloto. Escanteios e gols por período continuam N/D. Não autoriza criar previsões nem importar registros ao Radar; direitos da fonte ainda precisam de validação.</p>
    </section>
    <p className={comparisonOk?'notice':'alert'} role="status">
     {comparisonOk?'Conferência independente: '+audit.agreed+'/'+audit.compared+' placares coincidem com o OpenFootball.':
      'Atenção: '+audit.disagreed+' divergências e '+audit.notLocated+' resultados sem correspondência. Não utilizar automaticamente.'}
    </p>
    <p className="muted">Os totais do jogo são exibidos abaixo. Para conferir os dois tempos nas partidas validadas, abra “Ver finalizações por tempo”. O histórico não é modificado.</p>
    <label className="fpl-pilot-round">Escolher rodada
     <select aria-label="Escolher rodada das estatísticas experimentais" value={round} onChange={e=>setRound(Number(e.target.value))}>
      {Array.from({length:discovery?.lastCompleteRound??FPL_PREVIEW_ROUNDS},(_,i)=>i+1).map(v=><option value={v} key={v}>Rodada {v}</option>)}
     </select>
    </label>
    <div className="fpl-pilot-games">
     {selected.map(g=><article key={g.id} className="fpl-pilot-game">
      <div className="fpl-pilot-game-top"><strong>{g.home} × {g.away}</strong><small>{gameDate(g.date)}</small></div>
      {!g.sourceStatsProcessed&&<p className="fpl-pilot-pending">Dados deste jogo aguardam processamento na fonte. Estatísticas: N/D até confirmação.</p>}
      <div className="fpl-pilot-metrics">
       <div><small>Gols</small><strong>{g.sourceStatsProcessed?pair(g.goals):'N/D'}</strong></div>
       <div><small>Finalizações</small><strong>{g.sourceStatsProcessed?pair(g.shots):'N/D'}</strong></div>
       <div><small>Chutes no gol</small><strong>{g.sourceStatsProcessed?pair(g.onTarget):'N/D'}</strong></div>
       <div><small>Escanteios</small><strong>{g.sourceStatsProcessed?pair(g.corners):'N/D'}</strong></div>
      </div>
      {shotAudit?.periodsById[g.id]&&<details className="fpl-half-stat-details">
       <summary>Ver finalizações por tempo (conferidas)</summary>
       <div className="fpl-half-stat-sections">
        {(['first','second'] as const).map((half,i)=>{
         const p=shotAudit.periodsById[g.id][half];
         return <div className="fpl-half-stat-row" key={half}>
          <strong>{i===0?'1º tempo':'2º tempo'}</strong>
          <span>Finalizações: <b>{pair(p.shots)}</b></span>
          <span>Chutes no gol: <b>{pair(p.onTarget)}</b></span>
         </div>;
        })}
       </div>
       <p className="muted">Mandante × visitante. Gols por tempo: N/D · Escanteios por tempo: N/D. Eventos reconciliados com os totais, apenas para avaliação da fonte.</p>
      </details>}
      {shotAudit?.divergentIds.includes(g.id)&&<p className="fpl-half-unavailable">1º/2º tempo: N/D (eventos divergentes da estatística do jogo).</p>}
     </article>)}
    </div>
    <details className="fpl-pilot-disclosure" aria-label="Fonte alternativa para estatísticas indisponíveis">
     <summary>Flashscore · conferir dados ausentes nesta rodada</summary>
     <p className="muted">Lista automática de campos ainda não comprovados no piloto. O Flashscore é apenas uma referência para consulta pontual: não existe extração automática nem preenchimento do Radar. Dados sem confirmação continuam N/D.</p>
     <ul>
      {selected.map(g=>{
       const verified=shotAudit?Boolean(shotAudit.periodsById[g.id]):shotError?false:null;
       const gaps=unavailableFplIndicators(g,verified);
       return <li key={g.id}>
        <strong>{g.home} × {g.away}:</strong> {gaps.missing.join('; ')}
        {gaps.auditPending?'; finalizações por tempo: aguardando auditoria':''}.
       </li>;
      })}
     </ul>
     <p className="muted">O importador antigo de pesquisa CSV continua separado, mais abaixo em Base de dados, com revisão e confirmação antes de salvar. Ele não modifica automaticamente esta amostra experimental. Reutilização comercial ou coleta automatizada do Flashscore depende de autorização.</p>
     <a href="https://www.flashscore.com.br/" target="_blank" rel="noreferrer">Abrir Flashscore para consulta ↗</a>
    </details>
    <p className="muted">Cada dupla de valores está na ordem mandante × visitante. Data conforme a origem; fuso de horário não presumido. Gols e escanteios por 1º/2º tempo continuam N/D. Finalizações por período só aparecem quando todos os eventos da partida conferem com os totais. A concordância de placares não valida automaticamente todas as estatísticas. Jogos marcados como não processados pela fonte aparecem com N/D.</p>
    {updatedAt&&<p className="muted">Última consulta: {new Date(updatedAt).toLocaleString('pt-BR')}.</p>}
   </>}
   <p className="muted">Fonte dos indicadores: <a href={FPL_PREVIEW_HOME} target="_blank" rel="noreferrer">FPL Core Insights ↗</a>. Conferência dos placares: <a href="https://github.com/openfootball/football.json" target="_blank" rel="noreferrer">OpenFootball CC0 ↗</a>. Sem cobrança, sem apostas, sem uso para previsão enquanto o piloto estiver isolado.</p>
  </div>
 </section>;
}
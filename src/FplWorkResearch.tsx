import {useEffect,useMemo,useState} from 'react';
import type {FplPilotGame} from './fplFreePilot';
import {FPL_WORK_STORAGE,addFplWork,emptyFplWork,
 previewFplWorkCsv,readFplWork,type FplWorkStore,type Period} from './fplWorkStore';

const pair=(p:[number,number])=>p[0]+' × '+p[1];
const summary=(p:Period)=>'Gols '+pair(p.goals)+' · Finalizações '+pair(p.shots)+
 ' · Chutes no gol '+pair(p.target)+' · Escanteios '+pair(p.corners);
const date=(value:string)=>new Date(value+'T12:00:00').toLocaleDateString('pt-BR');

/** Private Premier League Work view: no writes to FutStats main history/Radar. */
export default function FplWorkResearch({
 games,onStoredCount
}:{games:FplPilotGame[];onStoredCount:(value:number)=>void}){
 const [stored,setStored]=useState<FplWorkStore>(emptyFplWork);
 const [round,setRound]=useState(7);
 const [notice,setNotice]=useState('');
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 useEffect(()=>{
  try{
   const saved=readFplWork(localStorage.getItem(FPL_WORK_STORAGE));
   setStored(saved);onStoredCount(saved.entries.length);
  }catch(e){setError(e instanceof Error?e.message:'Falha na pesquisa Work anterior.');}
 },[onStoredCount]);
 const selected=useMemo(()=>stored.entries.filter(e=>e.gw===round),[stored,round]);
 const rounds=useMemo(()=>[...new Set(stored.entries.map(e=>e.gw))].sort((a,b)=>a-b),[stored]);
 async function importCsv(file?:File){
  setNotice('');setError('');
  if(!file)return;
  if(!file.name.toLowerCase().endsWith('.csv')||file.size>2_000_000){
   setError('Selecione o CSV de 55 colunas de até 2 MB.');return;
  }
  if(games.length===0){
   setError('Aguarde a identificação das partidas do piloto antes da importação.');return;
  }
  setBusy(true);
  try{
   const csv=await file.text();
   const old=readFplWork(localStorage.getItem(FPL_WORK_STORAGE));
   const audit=previewFplWorkCsv(csv,games,old);
   if(!audit.additions.length){
    setStored(old);onStoredCount(old.entries.length);
    setNotice('Arquivo já conferido: '+audit.duplicates+' jogos identificados, nenhuma duplicata adicionada.');
   }else{
    const next=addFplWork(old,audit);
    localStorage.setItem(FPL_WORK_STORAGE,JSON.stringify(next));
    setStored(next);onStoredCount(next.entries.length);
    setRound(Math.max(...audit.additions.map(e=>e.gw)));
    setNotice(audit.additions.length+' partidas completas adicionadas à pesquisa privada. '+
     audit.discrepancies+' diferença(s) entre fontes registrada(s); '+
     audit.unprocessed+' jogo(s) não processado(s) no piloto, mas pesquisado(s) pelo Work.');
   }
  }catch(e){setError(e instanceof Error?e.message:'Arquivo não aprovado: nada foi gravado.');}
  finally{setBusy(false);}
 }
 return <section className="fpl-work-main" aria-label="Premier League completa pelo Work">
   <div className="panel-head">
    <div><h3>Premier League 2026/27 · Pesquisa Work completa</h3>
     <p>Gols, finalizações, chutes no gol e escanteios · jogo completo, 1º e 2º tempo.</p></div>
    <span className="tag">PESQUISA PRIVADA</span>
   </div>
   <div className="fpl-pilot-numbers">
    <div><strong>{stored.entries.length}</strong><span>Partidas completas via Work</span></div>
    <div><strong>{new Set(stored.entries.map(e=>e.gw)).size}</strong><span>Rodadas com partidas</span></div>
    <div><strong>{stored.entries.filter(e=>e.discrepancies.length>0).length}</strong><span>Diferenças entre fontes documentadas</span></div>
    <div><strong>{stored.entries.filter(e=>e.pilotUnprocessed).length}</strong><span>Não processadas no piloto</span></div>
   </div>
   <details className="fpl-pilot-disclosure" open={stored.entries.length===0?true:undefined}>
    <summary>{stored.entries.length?'Adicionar novas partidas do CSV do Work':'Adicionar CSV completo do Work sem mexer no Histórico'}</summary>
    <p className="muted">O FutStats confirma 55 colunas, IDs, clubes, rodada, placares, totais e diferenças com o piloto anterior. O arquivo permanece exclusivamente neste navegador. Nenhum dado histórico, Radar ou pesquisa das três ligas é modificado.</p>
    <input type="file" accept=".csv,text/csv" disabled={busy||games.length===0}
      aria-label="Selecionar CSV Premier League completo do Work"
      onChange={e=>{const file=e.currentTarget.files?.[0];e.currentTarget.value='';void importCsv(file);}}/>
    {games.length===0&&<p className="muted">Consultando os registros da Premier League para identificar as partidas…</p>}
   </details>
   {notice&&<p className="notice" role="status">{notice}</p>}
   {error&&<p className="alert" role="alert">{error}</p>}
   {stored.entries.length>0&&<>
    <p className="notice" role="status">Os jogos conferidos pelo Work são exibidos como referência desta pesquisa. O piloto anterior continua acessível logo abaixo para comparação, sem ser apagado.</p>
    <label className="fpl-pilot-round">Escolher rodada do Work
     <select value={rounds.includes(round)?round:rounds.at(-1)??1} onChange={e=>setRound(Number(e.target.value))}>
      {rounds.map(n=><option key={n} value={n}>Rodada {n}</option>)}
     </select>
    </label>
    <div className="fpl-pilot-games">
     {selected.map(e=><article key={e.sourceId} className="fpl-pilot-game">
      <div className="fpl-pilot-game-top"><strong>{e.home} × {e.away}</strong><small>{date(e.date)}</small></div>
      <div className="fpl-pilot-metrics">
       <div><small>Gols</small><strong>{pair(e.full.goals)}</strong></div>
       <div><small>Finalizações</small><strong>{pair(e.full.shots)}</strong></div>
       <div><small>Chutes no gol</small><strong>{pair(e.full.target)}</strong></div>
       <div><small>Escanteios</small><strong>{pair(e.full.corners)}</strong></div>
      </div>
      <details className="fpl-half-stat-details">
       <summary>Ver jogo completo, primeiro e segundo tempo</summary>
       <p><strong>Jogo completo:</strong> {summary(e.full)}</p>
       <p><strong>1º tempo:</strong> {summary(e.first)}</p>
       <p><strong>2º tempo:</strong> {summary(e.second)}</p>
       <p className="muted">Valores na ordem mandante × visitante, proveniência Flashscore ID {e.sourceId}.</p>
       <a href={e.sourceUrl} target="_blank" rel="noopener noreferrer">Ver página da pesquisa ↗</a>
      </details>
      {e.discrepancies.length>0&&<p className="alert" role="status">Diferença entre fontes preservada: {e.discrepancies.join('; ')}. O piloto antigo não foi sobrescrito.</p>}
      {e.pilotUnprocessed&&<p className="muted">O piloto não havia processado esta partida; dados completos vieram da pesquisa Work e foram conferidos separadamente.</p>}
     </article>)}
    </div>
   </>}
   <p className="muted">Pesquisa experimental privada. Dados do Flashscore não recebem licença CC0 por estarem no mesmo aplicativo que o calendário aberto. Nenhum registro é importado no histórico ou utilizado automaticamente pelo Radar.</p>
 </section>;

import {useEffect,useState} from 'react';
import type {FplPilotGame} from './fplFreePilot';
import {
 FPL_WORK_STORAGE,readFplWork,emptyFplWork,previewFplWorkCsv,addFplWork,
 type FplWorkStore,type Period
} from './fplWorkStore';

const pair=(p:[number,number])=>p[0]+' × '+p[1];
const periodText=(p:Period)=>
 'Gols '+pair(p.goals)+' · Finalizações '+pair(p.shots)+
 ' · No alvo '+pair(p.target)+' · Escanteios '+pair(p.corners);
const formatDate=(value:string)=>new Date(value+'T12:00:00').toLocaleDateString('pt-BR');

export default function FplWorkResearch({
 games,onStoredCount
}:{games:FplPilotGame[];onStoredCount:(n:number)=>void}){
 const [data,setData]=useState<FplWorkStore>(emptyFplWork);
 const [round,setRound]=useState(7);
 const [message,setMessage]=useState('');
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);

 useEffect(()=>{
  try{
   const saved=readFplWork(localStorage.getItem(FPL_WORK_STORAGE));
   setData(saved);onStoredCount(saved.entries.length);
  }catch(e){
   setError(e instanceof Error?e.message:'Pesquisa da Premier League indisponível.');
  }
 },[onStoredCount]);

 async function receive(file?:File){
  setError('');setMessage('');
  if(!file)return;
  if(file.size>2_000_000||!file.name.toLowerCase().endsWith('.csv')){
   setError('Selecione um CSV de até 2 MB.');return;
  }
  if(games.length<70){setError('Aguarde a identificação dos jogos anteriores.');return;}
  setBusy(true);
  try{
   const text=await file.text();
   const old=readFplWork(localStorage.getItem(FPL_WORK_STORAGE));
   const check=previewFplWorkCsv(text,games,old);
   if(check.additions.length===0){
    setMessage('Arquivo conferido novamente: '+check.duplicates+' jogos já estavam registrados.');
    setData(old);
   }else{
    const next=addFplWork(old,check);
    localStorage.setItem(FPL_WORK_STORAGE,JSON.stringify(next));
    setData(next);
    setMessage(check.additions.length+' partidas salvas na pesquisa Work. '+
      check.discrepancies+' divergência(s) preservada(s) e '+
      check.unprocessed+' jogo(s) não processado(s) no piloto antigo.');
    setRound(Math.max(...check.additions.map(e=>e.gw)));
   }
   onStoredCount(readFplWork(localStorage.getItem(FPL_WORK_STORAGE)).entries.length);
  }catch(e){
   setError(e instanceof Error?e.message:'CSV não aprovado. Nenhum dado foi gravado.');
  }finally{setBusy(false);}
 }

 const rounds=Array.from(new Set(data.entries.map(e=>e.gw))).sort((a,b)=>a-b);
 const active=rounds.includes(round)?round:(rounds[rounds.length-1]??1);
 const selected=data.entries.filter(e=>e.gw===active);
 return <div className="fpl-work-main">
  <div className="panel-head">
   <div>
    <h3>Premier League 2026/27 · Pesquisa Work</h3>
    <p>Gols, finalizações, chutes no gol e escanteios · 1º, 2º e jogo completo.</p>
   </div>
   <span className="tag">PESQUISA PRIVADA</span>
  </div>
  <div className="fpl-pilot-numbers">
   <div><strong>{data.entries.length}</strong><span>Jogos completos via Work</span></div>
   <div><strong>{rounds.length}</strong><span>Rodadas com dados</span></div>
   <div><strong>{data.entries.filter(e=>e.discrepancies.length>0).length}</strong><span>Diferenças preservadas</span></div>
  </div>
  <details className="fpl-pilot-disclosure" open={data.entries.length===0}>
   <summary>Adicionar CSV completo da Premier League</summary>
   <p className="muted">Arquivo conferido no próprio celular, sem envio a servidor. Não modifica os jogos históricos, o Radar ou as três ligas já pesquisadas.</p>
   <input aria-label="Selecionar CSV completo Premier League" type="file" accept=".csv,text/csv"
    disabled={busy||games.length<70}
    onChange={e=>{const file=e.currentTarget.files?.[0];e.currentTarget.value='';void receive(file);}}/>
   {games.length<70&&<p className="muted">Conferindo o calendário e os clubes do piloto anterior…</p>}
  </details>
  {error&&<p className="alert" role="alert">{error}</p>}
  {message&&<p className="notice" role="status">{message}</p>}
  {data.entries.length>0&&<div>
   <p className="notice">Os valores completos do Work estão em primeiro plano. O piloto antigo continua disponível para comparação, sem substituição dos seus arquivos.</p>
   <label className="fpl-pilot-round">Rodada da pesquisa Work
    <select value={active} onChange={e=>setRound(Number(e.currentTarget.value))}>
     {rounds.map(n=><option key={n} value={n}>Rodada {n}</option>)}
    </select>
   </label>
   <div className="fpl-pilot-games">
    {selected.map(entry=><article className="fpl-pilot-game" key={entry.gameId}>
     <div className="fpl-pilot-game-top"><strong>{entry.home} × {entry.away}</strong><small>{formatDate(entry.date)}</small></div>
     <div className="fpl-pilot-metrics">
      <div><small>Gols</small><strong>{pair(entry.full.goals)}</strong></div>
      <div><small>Finalizações</small><strong>{pair(entry.full.shots)}</strong></div>
      <div><small>Chutes no gol</small><strong>{pair(entry.full.target)}</strong></div>
      <div><small>Escanteios</small><strong>{pair(entry.full.corners)}</strong></div>
     </div>
     <details className="fpl-half-stat-details">
      <summary>Ver primeiro e segundo tempo</summary>
      <p><strong>1º tempo:</strong> {periodText(entry.first)}</p>
      <p><strong>2º tempo:</strong> {periodText(entry.second)}</p>
      <p className="muted">Mandante × visitante · Flashscore ID {entry.sourceId}</p>
      <a href={entry.sourceUrl} target="_blank" rel="noopener noreferrer">Ver fonte ↗</a>
     </details>
     {entry.discrepancies.length>0&&<p className="alert">Diferença entre Work e piloto: {entry.discrepancies.join('; ')}. Nenhum valor antigo foi sobrescrito.</p>}
     {entry.pilotUnprocessed&&<p className="muted">Piloto antigo não processado. Resultado independente da pesquisa Work.</p>}
    </article>)}
   </div>
  </div>}
  <p className="muted">Dados de pesquisa local, separados do Histórico e Radar. Direitos de reutilização comercial ainda precisam ser confirmados.</p>
 </div>;
}

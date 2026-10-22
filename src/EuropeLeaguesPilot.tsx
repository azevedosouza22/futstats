import {useEffect,useState} from 'react';
import {brasiliaDate} from './calendar';
import {
 EUROPE_LEAGUES,EUROPE_CC0_LICENSE,EUROPE_RESEARCH_STORAGE,
 parseEuropeanLeague,eligibleEuropeanResults,readStoredEuropeanResearch,stageEuropeanResults,
 type EuropeLeagueId,type EuropeanLeagueCatalog,type StoredEuropeanResearch
} from './europeLeagueResearch';
import {
 EUROPE_WORK_STORAGE,emptyEuropeWork,readEuropeWork,
 reviewEuropeWorkCsv,stageEuropeWork,type WorkEuropeStore,type MetricPairs
} from './europeWorkResearch';

const fmtDate=(s:string)=>new Date(s+'T12:00:00').toLocaleDateString('pt-BR');
const pair=(v:[number,number]|null)=>v?v[0]+' × '+v[1]:'N/D';
const start:StoredEuropeanResearch={format:EUROPE_RESEARCH_STORAGE,matches:[]};
const displayWorkPeriod=(period:MetricPairs)=>
 'Gols '+pair(period.goals)+' · Finalizações '+pair(period.shots)+
 ' · No alvo '+pair(period.target)+' · Escanteios '+pair(period.corners);

export default function EuropeLeaguesPilot(){
 const [catalogs,setCatalogs]=useState<EuropeanLeagueCatalog[]>([]);
 const [failed,setFailed]=useState<string[]>([]);
 const [active,setActive]=useState<EuropeLeagueId>('serie-a');
 const [round,setRound]=useState(0);
 const [refresh,setRefresh]=useState(0);
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState('');
 const [error,setError]=useState('');
 const [stored,setStored]=useState<StoredEuropeanResearch>(start);
 const [enriched,setEnriched]=useState<WorkEuropeStore>(emptyEuropeWork);
 const [workNotice,setWorkNotice]=useState('');
 const [workError,setWorkError]=useState('');
 const [workBusy,setWorkBusy]=useState(false);

 useEffect(()=>{
  try{setStored(readStoredEuropeanResearch(localStorage.getItem(EUROPE_RESEARCH_STORAGE)));}
  catch(e){setError(e instanceof Error?e.message:'Falha na leitura da base experimental.');}
  try{setEnriched(readEuropeWork(localStorage.getItem(EUROPE_WORK_STORAGE)));}
  catch(e){setWorkError(e instanceof Error?e.message:'Falha na leitura das estatísticas Work.');}
 },[]);
 useEffect(()=>{
  const controller=new AbortController();
  const check=async()=>{
   setBusy(true);setFailed([]);setError('');
   const results=await Promise.all(EUROPE_LEAGUES.map(async league=>{
    try{
     const response=await fetch(league.url,{signal:controller.signal,cache:'no-store'});
     if(!response.ok)throw Error('HTTP '+response.status);
     const raw=await response.text();
     if(raw.length>250000)throw Error('Arquivo acima do limite de segurança');
     return {catalog:parseEuropeanLeague(JSON.parse(raw) as unknown,league.id),failed:''};
    }catch(e){
     return {catalog:null,failed:league.name+': '+(e instanceof Error?e.message:'falha de consulta')};
    }
   }));
   if(controller.signal.aborted)return;
   setCatalogs(results.flatMap(x=>x.catalog?[x.catalog]:[]));
   setFailed(results.filter(x=>x.failed).map(x=>x.failed));
   setBusy(false);
  };
  void check();return ()=>controller.abort();
 },[refresh]);

 // The user already chose to save a batch in this separate research store.
 // Finish that partial batch after all sources become usable, without asking
 // for repeated manual clicks. Never touch historical FutStats/Radar storage.
 useEffect(()=>{
  if(catalogs.length!==EUROPE_LEAGUES.length)return;
  try{
   const existing=readStoredEuropeanResearch(localStorage.getItem(EUROPE_RESEARCH_STORAGE));
   if(existing.matches.length===0)return;
   const eligible=eligibleEuropeanResults(catalogs,brasiliaDate().date);
   const result=stageEuropeanResults(existing,eligible);
   if(result.added===0){setStored(existing);return;}
   localStorage.setItem(EUROPE_RESEARCH_STORAGE,JSON.stringify(result.next));
   setStored(result.next);
   setNotice('Pesquisa anterior concluída automaticamente: mais '+result.added+
    ' jogos incluídos na base experimental. Histórico e Radar não alterados.');
  }catch(e){
   setError(e instanceof Error?e.message:'Falha ao completar a pesquisa experimental.');
  }
 },[catalogs]);
 const today=brasiliaDate().date;
 const eligible=eligibleEuropeanResults(catalogs,today);
 const data=catalogs.find(x=>x.league===active);
 const def=EUROPE_LEAGUES.find(x=>x.id===active)!;
 const activeRound=round || data?.matches.filter(x=>x.full!==null).reduce((n,x)=>Math.max(n,x.round),1)||1;
 const fixtures=data?.matches.filter(x=>x.round===activeRound)??[];
 const daysOld=data?.lastResultDate?
  Math.floor((Date.parse(today+'T12:00:00Z')-Date.parse(data.lastResultDate+'T12:00:00Z'))/86400000):null;
 async function addWorkCsv(file?:File){
  setWorkError('');setWorkNotice('');
  if(!file)return;
  if(!file.name.toLowerCase().endsWith('.csv')||file.size>2_000_000){
   setWorkError('Selecione o CSV do Work de até 2 MB.');return;
  }
  setWorkBusy(true);
  try{
   const text=await file.text();
   const base=readStoredEuropeanResearch(localStorage.getItem(EUROPE_RESEARCH_STORAGE));
   const old=readEuropeWork(localStorage.getItem(EUROPE_WORK_STORAGE));
   const report=reviewEuropeWorkCsv(text,base,old);
   if(report.newEntries.length===0){
    setEnriched(old);
    setWorkNotice('Arquivo já registrado: '+report.duplicates+' partida(s), nenhuma duplicata adicionada.');
   }else{
    const next=stageEuropeWork(old,report);
    // Only the separately-namespaced Work enrichment is changed.
    // Existing historical 659, Radar and the 155-score catalogue remain untouched.
    localStorage.setItem(EUROPE_WORK_STORAGE,JSON.stringify(next));
    setEnriched(next);
    setWorkNotice(report.newEntries.length+' partida(s) complementada(s) com estatísticas completas do Work. Os '+base.matches.length+' jogos da pesquisa e o Radar permanecem intactos.');
   }
  }catch(e){setWorkError(e instanceof Error?e.message:'CSV não aprovado. Nenhum dado foi gravado.');}
  finally{setWorkBusy(false);}
 }
 const addToResearch=()=>{
  setNotice('');setError('');
  try{
   const existing=readStoredEuropeanResearch(localStorage.getItem(EUROPE_RESEARCH_STORAGE));
   const result=stageEuropeanResults(existing,eligible);
   if(result.added===0){
    setStored(existing);setNotice('Nenhum jogo novo: as partidas disponíveis já constam da base experimental.');
    return;
   }
   // Separate storage namespace: NEVER mutate futstats:v1 or futstats-radar-previews-v1.
   localStorage.setItem(EUROPE_RESEARCH_STORAGE,JSON.stringify(result.next));
   setStored(result.next);
   setNotice(result.added+' jogo(s) adicionado(s) à base experimental. Histórico e Radar não alterados.');
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível salvar a pesquisa experimental.');}
 };
 return <section className="panel openfootball-pilot" aria-label="Novas ligas europeias em pesquisa">
  <div className="panel-head">
   <div>
    <h2>Novas ligas · Base experimental 2026/27</h2>
    <p>Serie A italiana, La Liga e Ligue 1 · resultados CC0 e gols por tempo, sem assinatura.</p>
   </div><span className="tag">PESQUISA</span>
  </div>
  <div className="openfootball-content">
   <p className="openfootball-guard"><strong>Base separada do Histórico e do Radar:</strong> partidas podem ser guardadas neste navegador para pesquisa. Finalizações, chutes no alvo e escanteios por tempo continuam N/D até a verificação pelo Work. Nenhum registro antigo é sobrescrito.</p>
   <div className="europe-league-kpis">
    <div><strong>{eligible.length}</strong><span>Jogos com placar e intervalo conferíveis</span></div>
    <div><strong>{stored.matches.length}</strong><span>Salvos na pesquisa local</span></div>
    <div><strong>{enriched.entries.length}</strong><span>Jogos completos via Work</span></div>
    <div><strong>{catalogs.length}/3</strong><span>Campeonatos acessíveis</span></div>
   </div>
   <div className="backup-buttons">
    <button className="text-button" type="button" disabled={busy} onClick={()=>setRefresh(x=>x+1)}>{busy?'Consultando…':'Atualizar as três ligas'}</button>
    <button className="primary" type="button" disabled={busy||eligible.length===0||!!error} onClick={addToResearch}>Adicionar jogos validados à pesquisa</button>
   </div>
   {notice&&<p role="status" className="notice">{notice}</p>}
   {error&&<p role="alert" className="alert">{error}</p>}
   {failed.length>0&&<p className="alert" role="status">{failed.join('; ')}. As demais ligas continuam disponíveis.</p>}
   <details className="fpl-pilot-disclosure" aria-label="Completar estatísticas da base experimental com CSV do Work">
    <summary>Completar estatísticas usando CSV do Work</summary>
    <p className="muted">Selecione o arquivo de 55 colunas recebido do Work. O FutStats confere nomes das equipes, competição, data, placares e todas as somas; depois complementa somente os jogos que já estão nesta base experimental. Não é preciso repetir a seleção para partidas já importadas. O CSV não sai do seu navegador.</p>
    <input type="file" accept=".csv,text/csv" disabled={workBusy||stored.matches.length===0}
      aria-label="Selecionar CSV do Work para complementar base europeia"
      onChange={e=>{const file=e.currentTarget.files?.[0];e.currentTarget.value='';void addWorkCsv(file);}}/>
    {workBusy&&<p role="status" className="muted">Conferindo as partidas…</p>}
    {workNotice&&<p role="status" className="notice">{workNotice}</p>}
    {workError&&<p role="alert" className="alert">{workError}</p>}
    <p className="muted">Somente arquivos da pesquisa europeia; não modifica a base histórica de 659 jogos, as previsões ou os placares da pesquisa CC0. Arquivos conflitantes são rejeitados, sem substituir estatísticas existentes.</p>
   </details>
   <p className="muted">Jogos sem resultado completo não são salvos. Segundo tempo = placar final menos placar do intervalo, apenas quando ambos são válidos. A base experimental não integra automaticamente as médias históricas nem as previsões do Radar.</p>
   <label>Campeonato
    <select aria-label="Escolher liga europeia" value={active} onChange={e=>{setActive(e.target.value as EuropeLeagueId);setRound(0);}}>
     {EUROPE_LEAGUES.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}
    </select>
   </label>
   {data&&<>
    <p className="muted">{data.completed} placares finais publicados; {data.withHalves} com intervalo. Último resultado nesta fonte: {data.lastResultDate?fmtDate(data.lastResultDate):'N/D'}.</p>
    {daysOld!==null&&daysOld>14&&<p className="alert" role="status">Fonte desatualizada para esta liga ({daysOld} dias sem resultados novos). Não tratar como cobertura completa da temporada; o Work poderá complementar jogos posteriores.</p>}
    <label>Rodada
     <select value={activeRound} aria-label="Escolher rodada europeia" onChange={e=>setRound(Number(e.target.value))}>
      {Array.from({length:def.rounds},(_,i)=>i+1).map(i=><option value={i} key={i}>Rodada {i}</option>)}
     </select>
    </label>
    <div className="fpl-pilot-games">
     {fixtures.map(g=><article key={g.id} className="fpl-pilot-game">
      <div className="fpl-pilot-game-top"><strong>{g.home} × {g.away}</strong><small>{fmtDate(g.date)}</small></div>
      <div className="fpl-pilot-metrics">
       <div><small>Gols completos</small><strong>{pair(g.full)}</strong></div>
       <div><small>1º tempo</small><strong>{pair(g.half)}</strong></div>
       <div><small>2º tempo</small><strong>{pair(g.second)}</strong></div>
       <div><small>Chutes/escanteios por tempo</small><strong>{enriched.entries.some(x=>x.europeId===g.id)?'Conferidos':'N/D'}</strong></div>
      </div>
      {enriched.entries.filter(x=>x.europeId===g.id).map(x=><details className="fpl-half-stat-details" key={x.sourceId}>
       <summary>Ver gols, finalizações, chutes no gol e escanteios · Work</summary>
       <div className="fpl-half-stat-sections">
        <p><strong>Jogo completo:</strong> {displayWorkPeriod(x.full)}</p>
        <p><strong>1º tempo:</strong> {displayWorkPeriod(x.first)}</p>
        <p><strong>2º tempo:</strong> {displayWorkPeriod(x.second)}</p>
       </div>
       <p className="muted">Conferido com o placar da fonte pública e somas dos períodos. ID Flashscore: {x.sourceId}.</p>
       <a href={x.sourceUrl} target="_blank" rel="noopener noreferrer">Conferir pesquisa Flashscore ↗</a>
      </details>)}
     </article>)}
    </div>
   </>}
   <p className="muted">Fonte: <a href={def.page} target="_blank" rel="noopener noreferrer">OpenFootball · {def.name} ↗</a> · <a href={EUROPE_CC0_LICENSE} target="_blank" rel="noopener noreferrer">licença CC0 ↗</a>. Pesquisa histórica, não prometer atualidade ou cobertura integral. Novos números estatísticos dependerão de fontes com autorização compatível.</p>
  </div>
 </section>;
}

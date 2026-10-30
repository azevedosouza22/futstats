import {useState} from 'react';
import {brasiliaDate,type ScheduledFixture,normalizeTeam} from './calendar';
import {CALENDAR_STORAGE,parseStoredCalendar} from './calendarStorage';
import {consultFreeAgenda} from './freeCalendarDiscovery';
import {readOfficialCalendar,type OfficialCalendarItem} from './officialCalendar';
import type {Data} from './model';
import {analyzeV4Day,V4_METRICS,V4_PERIODS,type V4FixtureReport,type V4Period,type V4Metric} from './radarV4LabToday';
import {RADAR_V4_LAB_STORAGE,freezeV4Report,readV4Frozen} from './radarV4LabFrozen';
import './radarV4LabToday.css';

const pName:Record<V4Period,string>={full:'Partida completa',first:'1º tempo',second:'2º tempo'};
const mName:Record<V4Metric,string>={shots:'Finalizações',corners:'Escanteios',target:'Chutes no gol',goals:'Gols'};
const number=(n:number)=>n.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1});
function exportJSON(content:unknown,name:string){
 const blob=new Blob([JSON.stringify(content,null,2)],{type:'application/json'});
 const href=URL.createObjectURL(blob);
 try{const a=document.createElement('a');a.href=href;a.download=name;a.click();}
 finally{window.setTimeout(()=>URL.revokeObjectURL(href),500);}
}
export default function RadarV4LabToday({research}:{research:Data|null}){
 const [report,setReport]=useState<V4FixtureReport[]|null>(null);
 const [references,setReferences]=useState<OfficialCalendarItem[]>([]);
 const [sources,setSources]=useState<Record<string,string>>({});
 const [reportDate,setReportDate]=useState('');
 const [period,setPeriod]=useState<V4Period>('full');
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const [error,setError]=useState('');
 const [savedIds,setSavedIds]=useState<string[]>([]);
 const now=new Date(),today=brasiliaDate(now).date;
 const ready=report?.filter(r=>r.status==='ready')??[];
 const count=ready.reduce((s,r)=>s+r.picks.filter(p=>p.line!==null).length,0);
 const noSignal=ready.reduce((s,r)=>s+r.picks.filter(p=>p.line===null).length,0);
 async function run(){
  setError('');setMessage('');setBusy(true);
  try{
   if(!research)throw Error('Pesquisa histórica ainda não disponível. Aguarde o carregamento.');
   const clock=new Date(),date=brasiliaDate(clock).date;
   // Priority: official references > pre-existing user CSV > provisional catalogue.
   const official=readOfficialCalendar(clock).filter(r=>r.fixture.date===date);
   const candidates:ScheduledFixture[]=[...official.map(r=>r.fixture)];
   const origins:Record<string,string>=Object.fromEntries(official.map(r=>[
    r.fixture.id,r.fresh?'Referência oficial recente':'Referência oficial antiga, reconferir'
   ]));
   let calendarWarning='';
   try{
    const saved=parseStoredCalendar(localStorage.getItem(CALENDAR_STORAGE)??'[]');
    for(const entry of saved.filter(f=>f.date===date)){
     candidates.push(entry);origins[entry.id]='Agenda CSV cadastrada, conferir na origem';
    }
   }catch{calendarWarning=' A agenda CSV local não pôde ser lida; nenhum dado foi alterado.';}
   let freeWarning='';
   try{
    const free=await consultFreeAgenda(clock);
    for(const item of free.candidates.filter(x=>x.fixture.date===date)){
     candidates.push(item.fixture);
     origins[item.fixture.id]='Catálogo comunitário (data e horário provisórios)';
    }
    if(free.errors.length)freeWarning=' Algumas fontes gratuitas não responderam.';
   }catch{freeWarning=' Fontes gratuitas indisponíveis nesta consulta.';}
   const seen=new Set<string>();
   const deduped=candidates.filter(item=>{
    const parts=item.competition.split(' '),last=parts.at(-1)??'';
    const league=last.startsWith('20')?parts.slice(0,-1).join(' '):item.competition;
    const key=[item.date,league,normalizeTeam(item.home),normalizeTeam(item.away)].join('|');
    if(seen.has(key))return false;seen.add(key);return true;
   });
   const results=analyzeV4Day(research,deduped,date);
   setReport(results);setReferences(official);setSources(origins);setReportDate(date);
   if(!results.length)setMessage('Nenhum confronto restante encontrado para hoje nas fontes disponíveis.'+calendarWarning+freeWarning);
   else setMessage('Análise histórica calculada. Confirme cada confronto na origem: nem toda agenda é oficial ou recente.'+calendarWarning+freeWarning);
  }catch(e){setError(e instanceof Error?e.message:'Falha no cálculo V4.');}
  finally{setBusy(false);}
 }
 function save(r:V4FixtureReport){
  setError('');setMessage('');
  try{
   const ref=references.find(x=>x.fixture.id===r.fixture.id);
   if(!ref)throw Error('Origem do confronto não encontrada.');
   // Reload current schedule and reject stale/no-longer-upcoming fixtures.
   const latest=readOfficialCalendar(new Date()).find(x=>x.fixture.id===r.fixture.id&&
    x.verifiedAt===ref.verifiedAt&&x.fixture.sourceUrl===ref.fixture.sourceUrl);
   if(!latest)throw Error('Agenda ou horário não estão mais confirmados. Refaça a consulta.');
   const entries=freezeV4Report(localStorage.getItem(RADAR_V4_LAB_STORAGE),r,latest,new Date());
   localStorage.setItem(RADAR_V4_LAB_STORAGE,JSON.stringify(entries));
   setSavedIds(v=>[...v,r.fixture.id]);setMessage('Registro V4 salvo separadamente, sem alterar Radar V2/V3 ou backups.');
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível salvar.');}
 }
 function exportReport(){
  if(!report||!reportDate)return;
  exportJSON({format:'futstats-v4-lab-daily-v1',date:reportDate,
   exportedAt:new Date().toISOString(),type:'EXPERIMENTAL_NAO_VALIDADO',
   warnings:['Agenda manual e datada, não tempo real','Frequência não é probabilidade futura',
    'Relatório exportado não comprova anterioridade da previsão','Sem odds, sem lucro demonstrado'],
   fixtures:report.map(r=>({...r,verifiedAt:references.find(x=>x.fixture.id===r.fixture.id)?.verifiedAt??null}))},
   'futstats-v4-laboratorio-'+reportDate+'.json');
 }
 function exportSaved(){
  try{exportJSON({format:'futstats-v4-lab-frozen-export-v1',
    records:readV4Frozen(localStorage.getItem(RADAR_V4_LAB_STORAGE))},
    'futstats-v4-previsoes-salvas-'+today+'.json');}
  catch(e){setError(e instanceof Error?e.message:'Falha ao exportar os registros V4.');}
 }
 return <section className="v4-lab-today" aria-label="Radar V4 Laboratório">
  <div className="v4-lab-head">
   <div><span className="v4-lab-eyebrow">PESQUISA · V4 EXPERIMENTAL</span>
    <h3>Radar V4 · Laboratório</h3>
    <p>Veja as linhas Over dos jogos de hoje, nos três períodos, com amostra e abstenções. Nenhum sinal substitui as indicações V2/V3.</p>
   </div><span className="v4-lab-date">{today.split('-').reverse().join('/')}</span>
  </div>
  <div className="v4-lab-actions">
   <button type="button" className="primary" onClick={run} disabled={busy||!research}>
    {busy?'Analisando…':'Analisar jogos de hoje'}</button>
   {report&&<button type="button" onClick={exportReport}>Exportar relatório V4 (JSON)</button>}
   <button type="button" onClick={exportSaved}>Exportar previsões V4 salvas</button>
  </div>
  <p className="v4-lab-muted">Usa agenda oficial cadastrada, CSV local e fontes comunitárias gratuitas consultadas sob demanda. Não é feed ao vivo: datas e horários exigem conferência. Uma agenda provisória não autoriza salvar a previsão.</p>
  {!research&&<p role="status">Carregando base histórica experimental de pesquisa…</p>}
  {error&&<p className="v4-lab-alert" role="alert">{error}</p>}
  {message&&<p className="v4-lab-message" role="status">{message}</p>}
  {report&&<div className="v4-lab-results">
   <div className="v4-lab-summary" aria-label="Resumo dos resultados">
    <div><small>Confrontos na agenda</small><strong>{report.length}</strong></div>
    <div><small>Com histórico suficiente</small><strong>{ready.length}</strong></div>
    <div><small>Sinais V4</small><strong>{count}</strong></div>
    <div><small>Sem sinal</small><strong>{noSignal}</strong></div>
   </div>
   <div className="v4-lab-periods" role="group" aria-label="Período da análise">
    {V4_PERIODS.map(p=><button key={p} type="button" aria-pressed={period===p}
      className={period===p?'selected':''} onClick={()=>setPeriod(p)}>{pName[p]}</button>)}
   </div>
   {report.map(r=>{
    const origin=references.find(x=>x.fixture.id===r.fixture.id);
    const future=Boolean(origin?.fresh&&origin.fixture.time);
    return <article className="v4-lab-fixture" key={r.fixture.id}>
     <div className="v4-lab-fixture-head"><div>
      <small>{r.competition??r.fixture.competition} · {r.fixture.time??'Horário a confirmar'} {r.fixture.time?'(Brasília)':''}</small>
      <small className="v4-lab-origin">{sources[r.fixture.id]??'Origem da agenda a revisar'}</small>
      <h4>{r.fixture.home} × {r.fixture.away}</h4>
     </div><span className={origin?.fresh?'v4-lab-fresh':'v4-lab-stale'}>
      {origin?.fresh?'Agenda recente':'Reconfirmar agenda'}</span></div>
     {r.status!=='ready'?<p className="v4-lab-muted" role="status">Sem análise: {r.reason}</p>:<>
      <p className="v4-lab-muted">Referências: {r.homeHistoryCount} jogos de cada equipe · {r.historyIds.length} IDs distintos · somente anteriores ao confronto.</p>
      <div className="v4-lab-table-wrap"><table className="analysis-table">
       <thead><tr><th>Mercado</th><th>Linha V4</th><th>Ocorrências</th><th>Média</th></tr></thead>
       <tbody>{V4_METRICS.map(metric=>{
        const pick=r.picks.find(p=>p.period===period&&p.metric===metric);
        return <tr key={metric}><th>{mName[metric]}</th>
          <td>{pick?.line!==null&&pick?.line!==undefined?'Over '+number(pick.line):'Sem sinal'}</td>
          <td>{pick?.line!==null&&pick?.overs!==null&&pick?.overs!==undefined
             ?pick.overs+'/'+pick.observed:'—'}</td>
          <td>{pick?.mean===null||pick?.mean===undefined?'N/D':number(pick.mean)}</td>
         </tr>;
       })}</tbody></table></div>
      <div className="v4-lab-fixture-foot">
       <a href={r.fixture.sourceUrl} target="_blank" rel="noopener noreferrer">Consultar fonte da agenda</a>
       <button type="button" disabled={!future||savedIds.includes(r.fixture.id)}
        onClick={()=>save(r)}>{savedIds.includes(r.fixture.id)?'Previsão V4 salva':
          future?'Salvar previsão V4':'Salvar indisponível · agenda antiga'}</button>
      </div>
     </>}
    </article>;
   })}
  </div>}
  <p className="v4-lab-disclaimer">Critério do experimento: maior linha Over previamente definida com frequência histórica ≥70% e mínimo de 8 jogos distintos. A frequência de 7/10 não equivale a 70% de chance futura; não há odds verificadas nem recomendação de aposta comprovada. Registros salvos ficam em uma área V4 isolada no navegador.</p>
 </section>;
}

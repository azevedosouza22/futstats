import {useEffect,useState} from 'react';
import {brasiliaDate,type ScheduledFixture} from './calendar';
import {CALENDAR_STORAGE,parseStoredCalendar} from './calendarStorage';
import {readOfficialCalendar,readKnownV4DaySources,type OfficialCalendarItem} from './officialCalendar';
import type {Data} from './model';
import {analyzeV4Day,V4_METRICS,V4_PERIODS,type V4FixtureReport,type V4Period,type V4Metric} from './radarV4LabToday';
import {combineV4DayListings,consultV4CommunityDay} from './radarV4DayFixtures';
import {loadV4Archive,V4_ARCHIVED_DAYS,V4_ARCHIVE_SOURCES,type V4DayArchive} from './radarV4DailyArchive';
import {RADAR_V4_LAB_STORAGE,freezeV4Report,readV4Frozen} from './radarV4LabFrozen';
import RadarV4OddsPanel from './RadarV4OddsPanel';
import './radarV4LabToday.css';

const pName:Record<V4Period,string>={full:'Partida completa',first:'1º tempo',second:'2º tempo'};
const mName:Record<V4Metric,string>={shots:'Finalizações',corners:'Escanteios',target:'Chutes no gol',goals:'Gols'};
const number=(n:number)=>n.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1});
const archiveDays:readonly string[]=V4_ARCHIVED_DAYS;
const archived=(date:string)=>archiveDays.includes(date);
const shortDate=(date:string)=>date.slice(0,10).split('-').reverse().join('/');
const adendumKey='2026-10-31-adendo-coritiba-vitoria';
function exportJSON(content:unknown,name:string){
 const blob=new Blob([JSON.stringify(content,null,2)],{type:'application/json'});
 const href=URL.createObjectURL(blob);
 try{const a=document.createElement('a');a.href=href;a.download=name;a.click();}
 finally{window.setTimeout(()=>URL.revokeObjectURL(href),500);}
}
export default function RadarV4LabToday({research}:{research:Data|null}){
 const today=brasiliaDate().date;
 const [selectedDate,setSelectedDate]=useState(today);
 const [report,setReport]=useState<V4FixtureReport[]|null>(null);
 const [archive,setArchive]=useState<V4DayArchive|null>(null);
 const [references,setReferences]=useState<OfficialCalendarItem[]>([]);
 const [sources,setSources]=useState<Record<string,string>>({});
 const [reportDate,setReportDate]=useState('');
 const [period,setPeriod]=useState<V4Period>('full');
 const [selectedOddsKey,setSelectedOddsKey]=useState<string|null>(null);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const [error,setError]=useState('');
 const [savedIds,setSavedIds]=useState<string[]>([]);
 const ready=report?.filter(r=>r.status==='ready')??[];
 const count=ready.reduce((s,r)=>s+r.picks.filter(p=>p.line!==null).length,0);
 const noSignal=ready.reduce((s,r)=>s+r.picks.filter(p=>p.line===null).length,0);

 function applyArchive(original:V4DayArchive){
  setArchive(original);setReport(original.reports);setReportDate(original.date);
  setSources(Object.fromEntries(original.reports.map(r=>[
   r.fixture.id,'Previsão original de '+shortDate(original.date)+' — congelada antes dos jogos'
  ])));
  setReferences([]);
  setMessage(original.reports.length*12+' decisões pré-jogo recuperadas sem recálculo.'+
    (original.archiveKey===adendumKey?' Adendo separado das 29 partidas originais.':''));
 }
 useEffect(()=>{
  if(!archived(selectedDate))return;
  const controller=new AbortController();
  setBusy(true);
  void loadV4Archive(selectedDate,controller.signal).then(original=>{
   if(!controller.signal.aborted&&original)applyArchive(original);
  }).catch(err=>{
   if(!controller.signal.aborted)setError(err instanceof Error?err.message:
    'Arquivo pré-jogo indisponível. Nenhuma previsão foi recriada.');
  }).finally(()=>{if(!controller.signal.aborted)setBusy(false);});
  return ()=>controller.abort();
 },[selectedDate]);
 function selectDate(next:string){
  setSelectedOddsKey(null);
  setSelectedDate(next);setReport(null);setArchive(null);
  setSources({});setReferences([]);setReportDate('');
  setMessage('');setError('');
 }
 async function run(){
  setSelectedOddsKey(null);
  setError('');setMessage('');setBusy(true);
  try{
   const day=selectedDate;
   if(archived(day)){
    const original=await loadV4Archive(day);
    if(!original)throw Error('Registro prospectivo da data selecionada não encontrado.');
    applyArchive(original);
    return;
   }
   if(day!==brasiliaDate().date)
    throw Error('Para datas anteriores, utilize somente registros pré-jogo já congelados.');
   if(!research)throw Error('Pesquisa histórica ainda não disponível. Aguarde o carregamento.');
   const clock=new Date();
   // Crucial: list ALL matches on the calendar day, not only those still upcoming.
   // The permission to freeze stays restricted to an official recent future kickoff.
   const officialAll=readKnownV4DaySources(day,clock);
   const officialFuture=readOfficialCalendar(clock).filter(x=>x.fixture.date===day);
   let csv:ScheduledFixture[]=[],calendarWarning='';
   try{
    csv=parseStoredCalendar(localStorage.getItem(CALENDAR_STORAGE)??'[]');
   }catch{calendarWarning=' A agenda CSV local estava inválida; foi ignorada sem alterações.';}
   const controller=new AbortController();
   const timeout=window.setTimeout(()=>controller.abort(),12000);
   let community:Awaited<ReturnType<typeof consultV4CommunityDay>>={fixtures:[],errors:[]};
   let freeWarning='';
   try{
    community=await consultV4CommunityDay(day,controller.signal);
    if(controller.signal.aborted)freeWarning=' Consulta gratuita incompleta (limite de 12 s).';
    else if(community.errors.length)freeWarning=' Algumas fontes gratuitas não responderam.';
   }catch{freeWarning=' Consulta gratuita indisponível.';}
   finally{window.clearTimeout(timeout);}
   const listed=combineV4DayListings(day,officialAll,csv,community.fixtures);
   const results=analyzeV4Day(research,listed.map(x=>x.fixture),day);
   setReport(results);setReportDate(day);setArchive(null);
   setSources(Object.fromEntries(listed.map(x=>[x.fixture.id,x.label])));
   setReferences(officialFuture);
   if(!results.length)setMessage('Nenhum confronto encontrado para esta data nas fontes disponíveis.'+
    calendarWarning+freeWarning);
   else setMessage(results.length+' confrontos do dia encontrados, inclusive já iniciados.'+
    ' Fontes provisórias não são partidas confirmadas.'+calendarWarning+freeWarning);
  }catch(e){setError(e instanceof Error?e.message:'Falha no cálculo V4.');}
  finally{setBusy(false);}
 }
 function save(r:V4FixtureReport){
  setError('');setMessage('');
  try{
   if(archive)throw Error('O arquivo pré-jogo está congelado e não pode ser registrado novamente.');
   const ref=references.find(x=>x.fixture.id===r.fixture.id);
   if(!ref)throw Error('Este confronto não tem horário futuro oficialmente reconfirmado.');
   const latest=readOfficialCalendar(new Date()).find(x=>x.fixture.id===r.fixture.id&&
    x.verifiedAt===ref.verifiedAt&&x.fixture.sourceUrl===ref.fixture.sourceUrl);
   if(!latest)throw Error('Agenda ou horário não estão mais confirmados. Refaça a consulta.');
   const entries=freezeV4Report(localStorage.getItem(RADAR_V4_LAB_STORAGE),r,latest,new Date());
   localStorage.setItem(RADAR_V4_LAB_STORAGE,JSON.stringify(entries));
   setSavedIds(v=>[...v,r.fixture.id]);setMessage('Registro V4 salvo antes do jogo, separado de V2/V3.');
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível salvar.');}
 }
 function exportReport(){
  if(!report||!reportDate)return;
  exportJSON({format:'futstats-v4-lab-daily-v2',date:reportDate,
   exportedAt:new Date().toISOString(),archiveCreatedAt:archive?.createdAt??null,
   type:archive?'REGISTRO_PREJOGO_ORIGINAL':'EXPERIMENTO_CALCULADO_SOB_COMANDO',
   notes:['Nenhum resultado de jogo é utilizado como referência para sua própria análise.',
    'Revisão posterior à partida não constitui nova previsão pré-jogo.',
    'Sem odds reais; sem comprovação de lucratividade'],
   fixtures:report},
   'futstats-v4-laboratorio-'+reportDate+'.json');
 }
 function exportSaved(){
  try{exportJSON({format:'futstats-v4-lab-frozen-export-v1',
    records:readV4Frozen(localStorage.getItem(RADAR_V4_LAB_STORAGE))},
    'futstats-v4-previsoes-salvas-'+today+'.json');}
  catch(e){setError(e instanceof Error?e.message:'Falha ao exportar previsões V4.');}
 }
 const eligibleToSave=(r:V4FixtureReport)=>{
  if(archive)return false;
  const origin=references.find(x=>x.fixture.id===r.fixture.id);
  if(!origin?.fresh||!origin.fixture.time)return false;
  const now=brasiliaDate();
  return origin.fixture.date>now.date||
   origin.fixture.date===now.date&&origin.fixture.time>now.time;
 };
 return <section className="v4-lab-today" aria-label="Radar V4 Laboratório">
  <div className="v4-lab-head">
   <div><span className="v4-lab-eyebrow">PESQUISA · V4 EXPERIMENTAL</span>
    <h3>Radar V4 · Laboratório</h3>
    <p>Analise todos os confrontos encontrados no dia, incluindo os já iniciados.
    Consulte também o histórico das decisões tomadas antes dos jogos.</p>
   </div><span className="v4-lab-date">{today.split('-').reverse().join('/')}</span>
  </div>
  <div className="v4-lab-actions">
   <label className="v4-lab-date-select">Data do laboratório
    <select aria-label="Data do laboratório V4" value={selectedDate}
      onChange={e=>selectDate(e.target.value)}>
     <option value={today}>Hoje · {today.split('-').reverse().join('/')}</option>
     {archiveDays.filter(day=>day!==today).map(day=><option key={day} value={day}>
      {day===adendumKey?'Adendo 31/10 · Coritiba × Vitória':
       (day==='2026-10-31'&&today<day?'Amanhã · ':'Arquivo · ')+shortDate(day)+' · pré-jogo'}</option>)}
    </select>
   </label>
   <button type="button" className="primary" onClick={()=>void run()}
    disabled={busy||(!research&&!archived(selectedDate))}>
    {busy?'Consultando…':selectedDate===adendumKey?'Ver adendo pré-jogo · Coritiba × Vitória':
      archived(selectedDate)?'Ver análises pré-jogo de '+shortDate(selectedDate):'Analisar jogos de hoje'}
   </button>
   {report&&<button type="button" onClick={exportReport}>Exportar relatório V4 (JSON)</button>}
   <button type="button" onClick={exportSaved}>Exportar previsões V4 salvas</button>
  </div>
  <p className="v4-lab-muted">Calendário completo do dia: fontes oficiais cadastradas, agenda CSV local e
   catálogos gratuitos consultados sob comando. Nenhuma dessas fontes é uma agenda ao vivo
   universal; ligas ausentes continuam identificadas como lacuna de cobertura.</p>
  {!research&&!archived(selectedDate)&&<p role="status">Carregando base histórica experimental…</p>}
  {error&&<p className="v4-lab-alert" role="alert">{error}</p>}
  {message&&<p className="v4-lab-message" role="status">{message}</p>}
  {archive&&<div className="v4-lab-archive-banner" role="status">
    <strong>{archive.archiveKey===adendumKey?'Adendo pré-jogo — Coritiba × Vitória':'Registro pré-jogo original'} · {shortDate(archive.date)} · {new Date(archive.createdAt).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',timeZone:'America/Sao_Paulo'})} (Brasília)</strong>
    <span>{archive.reports.length} partidas · {archive.signals} sinais · {archive.abstentions} abstenções.
     As {archive.reports.length*12} decisões registradas antes dos jogos foram recuperadas sem recálculo com resultados.
     Os horários indicados são referências da agenda e devem ser reconfirmados.</span>
    <a href={V4_ARCHIVE_SOURCES[archive.archiveKey]} target="_blank" rel="noopener noreferrer">
     Conferir arquivo original no GitHub</a>
   </div>}
  {report&&<div className="v4-lab-results">
   <div className="v4-lab-summary" aria-label="Resumo dos resultados">
    <div><small>Jogos encontrados</small><strong>{report.length}</strong></div>
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
    const future=eligibleToSave(r);
    const activePick=r.picks.find(p=>p.period===period&&
     selectedOddsKey===r.fixture.id+'|'+p.period+'|'+p.metric);
    return <article className="v4-lab-fixture" key={r.fixture.id}>
     <div className="v4-lab-fixture-head"><div>
      <small>{r.competition??r.fixture.competition} · {r.fixture.time??'Horário N/D ou não reconfirmado'}
       {r.fixture.time?' (Brasília)':''}</small>
      <small className="v4-lab-origin">{sources[r.fixture.id]??'Origem da agenda a revisar'}</small>
      <h4>{r.fixture.home} × {r.fixture.away}</h4>
     </div><span className={archive?'v4-lab-fresh':origin?.fresh?'v4-lab-fresh':'v4-lab-stale'}>
      {archive?'Pré-jogo arquivado':future?'Antes do jogo · fonte recente':
       'Somente consulta / conferir fonte'}</span></div>
     {r.status!=='ready'?<p className="v4-lab-muted" role="status">Sem análise: {r.reason}</p>:<>
      <p className="v4-lab-muted">Histórico: {r.homeHistoryCount} jogos por mandante ·
       {r.awayHistoryCount} por visitante · {r.historyIds.length} IDs distintos.</p>
      <div className="v4-lab-table-wrap"><table className="analysis-table">
       <thead><tr><th>Mercado</th><th>Linha V4</th><th>Ocorrências</th><th>Média</th><th>Odd</th></tr></thead>
       <tbody>{V4_METRICS.map(metric=>{
        const pick=r.picks.find(p=>p.period===period&&p.metric===metric);
        return <tr key={metric}><th>{mName[metric]}</th>
          <td>{pick?.line!==null&&pick?.line!==undefined?'Over '+number(pick.line):'Sem sinal'}</td>
          <td>{pick?.line!==null&&pick?.overs!==null&&pick?.overs!==undefined
             ?pick.overs+'/'+pick.observed:'—'}</td>
          <td>{pick?.mean===null||pick?.mean===undefined?'N/D':number(pick.mean)}</td>
          <td><button type="button" className="v4-odds-trigger"
            disabled={pick?.line===null||pick?.line===undefined}
            aria-label={'Simular odd de '+mName[metric]+' · '+pName[period]+' · '+r.fixture.home+' × '+r.fixture.away}
            onClick={()=>{const key=r.fixture.id+'|'+period+'|'+metric;
             setSelectedOddsKey(previous=>previous===key?null:key);}}>Simular odd</button></td>
         </tr>;
       })}</tbody></table></div>
      {activePick?.line!==null&&activePick?.line!==undefined&&
       <RadarV4OddsPanel key={selectedOddsKey} label={mName[activePick.metric]+' · '+
        pName[activePick.period]+' · Over '+number(activePick.line)}
        pick={activePick} archive={!!archive}/>}
      <div className="v4-lab-fixture-foot">
       <a href={r.fixture.sourceUrl} target="_blank" rel="noopener noreferrer">
        {archive?'Conferir fonte da agenda ou previsão':'Conferir fonte da agenda'}</a>
       {!archive&&<button type="button" disabled={!future||savedIds.includes(r.fixture.id)}
        onClick={()=>save(r)}>{savedIds.includes(r.fixture.id)?'Previsão V4 salva':
          future?'Salvar previsão V4':'Somente consulta — sem registro retroativo'}</button>}
      </div>
     </>}
    </article>;
   })}
  </div>}
  <p className="v4-lab-disclaimer">O laboratório usa os cinco jogos anteriores de cada equipe,
   quatro mercados e três períodos; exige 8 IDs históricos distintos e frequência Over
   ≥70%. Frequência histórica não é probabilidade futura. O simulador de odds exige
   estimativa de probabilidade separada e não fornece indicação automática de aposta.
   Jogos consultados após
   o início não são transformados em previsões anteriores. Os arquivos prospectivos
   permanecem intocados. Sem odds verificadas, sem rentabilidade demonstrada.</p>
 </section>;
}

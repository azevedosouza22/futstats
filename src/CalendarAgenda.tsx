import {useEffect,useRef,useState} from 'react';
import type {Data} from './model';
import {buildRadarDailyOverview} from './radarDailyOverview';
import {readBrowserWorkAnalysis,type WorkAnalysisRead} from './workAnalysis';
import {workFixtureCoverage} from './workFixtureCoverage';
import RadarDailyCard from './RadarDailyCard';
import LeagueCoveragePanel from './LeagueCoveragePanel';
import {readOfficialCalendar} from './officialCalendar';
import {consultFreeAgenda,type FreeAgendaResult} from './freeCalendarDiscovery';
import {brasiliaDate,calendarWindow,isUpcoming,mergeCalendar,parseCalendarCsv,brasileiraoRound32,type CalendarWindow,type ScheduledFixture} from './calendar';
import {calendarIdentity} from './radarTeamAliases';

const KEY='futstats-calendar-csv-v1';
function readSaved(): ScheduledFixture[] {
  try {
    const raw:unknown=JSON.parse(localStorage.getItem(KEY)??'[]');
    if(!Array.isArray(raw))return [];
    return raw.filter((x):x is ScheduledFixture=>!!x&&typeof x==='object'&&
      typeof x.id==='string'&&typeof x.date==='string'&&
      (x.time===null||typeof x.time==='string')&&typeof x.home==='string'&&
      typeof x.away==='string'&&typeof x.competition==='string'&&typeof x.sourceUrl==='string').slice(0,1000);
  }catch{return [];}
}

export default function CalendarAgenda({data,onSelect,canAnalyzeFixture,onOpenWork}:{
  data:Data;
  onSelect:(fixture:ScheduledFixture)=>void;
  canAnalyzeFixture:(fixture:ScheduledFixture)=>boolean;
  onOpenWork:()=>void;
}) {
  const [calendar,setCalendar]=useState(readSaved);
  // Read private Work research once, without copying it into the main base.
  // Fail closed on invalid data and leave all original localStorage untouched.
  const [workRead]=useState<{value:WorkAnalysisRead|null;error:boolean}>(()=>{
    try{return {value:readBrowserWorkAnalysis(),error:false};}
    catch{return {value:null,error:true};}
  });
  const lookupWork=(f:ScheduledFixture)=>workRead.value
    ?workFixtureCoverage(workRead.value.matches,f):null;
  const [window,setWindow]=useState<CalendarWindow>('today');
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [free,setFree]=useState<FreeAgendaResult|null>(null);
  const [freeError,setFreeError]=useState('');
  const [freeLoading,setFreeLoading]=useState(false);
  const queryController=useRef<AbortController|null>(null);
  // One read-only lookup when this screen opens; no polling or background tasks.
  useEffect(()=>{
    void fetchCandidateFixtures();
    return ()=>queryController.current?.abort();
  },[]);
  async function fetchCandidateFixtures(){
    queryController.current?.abort();
    const controller=new AbortController();
    queryController.current=controller;
    setFreeLoading(true);setFreeError('');
    try{
      const result=await consultFreeAgenda(new Date(),controller.signal);
      if(controller.signal.aborted)return;
      setFree(result);
      if(result.candidates.length===0&&result.errors.length>0)
        setFreeError('As fontes gratuitas estão indisponíveis nesta consulta.');
    }catch(e){
      if(controller.signal.aborted)return;
      setFreeError(e instanceof Error?e.message:'Não foi possível consultar os calendários.');
    }finally{
      if(!controller.signal.aborted)setFreeLoading(false);
    }
  }
  const identity=(f:ScheduledFixture)=>calendarIdentity(data,f);
  // Source-linked, manually confirmed snapshots have priority over an old
  // calendar row for the same fixture, without modifying saved/imported data.
  const officialVisible=readOfficialCalendar().filter(item=>
    calendarWindow([item.fixture],window).length>0);
  const officialListed=officialVisible.slice(0,20).map(item=>({
    ...item,overview:buildRadarDailyOverview(data,item.fixture),work:lookupWork(item.fixture),
  }));
  const officialIds=new Set(officialVisible.map(item=>identity(item.fixture)));
  // Preserve user-imported agenda entries; show the older bundled round as fallback.
  const visible=calendarWindow(mergeCalendar(calendar,brasileiraoRound32).entries,window)
    .filter(f=>!officialIds.has(identity(f)));
  const listed=visible.slice(0,30).map(f=>({fixture:f,overview:buildRadarDailyOverview(data,f),work:lookupWork(f)}));
  const confirmedIdentities=new Set([...officialIds,...visible.map(identity)]);
  const freeVisible=free?calendarWindow(free.candidates.map(c=>c.fixture),window)
    .filter(f=>!confirmedIdentities.has(identity(f))):[];
  const freeListed=freeVisible.slice(0,20).map(f=>({
    fixture:f,overview:buildRadarDailyOverview(data,f),work:lookupWork(f),
  }));
  async function load(file?:File) {
    setError('');setNotice('');
    if(!file)return;
    try {
      if(file.size>2_000_000||!file.name.toLowerCase().endsWith('.csv'))throw Error('Selecione um CSV de até 2 MB.');
      const entries=parseCalendarCsv(await file.text());
      const merged=mergeCalendar(calendar,entries);
      localStorage.setItem(KEY,JSON.stringify(merged.entries));
      setCalendar(merged.entries);
      setNotice('Agenda: '+merged.added+' novos jogos; '+merged.duplicates+' duplicatas ignoradas. Datas e horários em Brasília.');
    }catch(e){setError(e instanceof Error?e.message:'Erro ao importar agenda.');}
  }
  const now=brasiliaDate();
  return <section className="calendar-agenda" aria-label="Agenda experimental">
    <h3>Visão diária · jogos disponíveis para análise</h3>
    <p className="muted">Agenda em três níveis: fontes oficiais datadas, calendário local e candidatos comunitários. Os cartões indicam os dados disponíveis no Histórico principal e, quando existirem, na pesquisa Work separada. Nenhuma fonte é uma agenda ao vivo confirmada.</p>
    {workRead.error&&<p className="muted">Dados locais do Work não puderam ser lidos. Nada foi alterado; confira essa base na área Radar Work.</p>}
    {error&&<p role="alert" className="alert">{error}</p>}
    {notice&&<p role="status" className="notice">{notice}</p>}
    <div className="segment calendar-windows" role="group" aria-label="Período da agenda">
      {([['today','Hoje'],['week','7 dias'],['month','30 dias']] as const).map(([key,label])=>
        <button key={key} type="button" aria-pressed={window===key} className={window===key?'selected':''} onClick={()=>setWindow(key)}>{label}</button>
      )}
    </div>
    <section className="official-calendar" aria-label="Jogos com referências oficiais">
      <h4>Confrontos com referência oficial</h4>
      <p className="muted">Datas e horários foram conferidos manualmente em páginas das competições. A programação pode mudar. Quando a conferência tiver mais de dois dias, o horário não será usado automaticamente.</p>
      {officialVisible.length===0
        ?<p className="muted">Nenhuma referência oficial futura cadastrada para este período. Isso não significa que não existam jogos.</p>
        :<div className="calendar-list">
          {officialListed.map(({fixture:f,verifiedAt,fresh,overview,work})=>
            <article key={f.id} className="calendar-fixture radar-daily-fixture official-fixture">
              <div className="radar-daily-fixture-head">
                <div className="radar-daily-fixture-title">
                  <small>FONTE OFICIAL · CONSULTADA EM {verifiedAt.split('-').reverse().join('/')}</small>
                  <b>{f.home} × {f.away}</b>
                  <small>{f.date} · {fresh&&f.time?f.time+' (Brasília)':'horário N/D · reconfirmar'} · {f.competition}</small>
                  <small><a href={f.sourceUrl} target="_blank" rel="noopener noreferrer">Conferir programação oficial</a></small>
                </div>
                <button type="button" className="text-button" disabled={!canAnalyzeFixture(f)}
                  onClick={()=>onSelect(f)}>
                  {!canAnalyzeFixture(f)?'Histórico não disponível nesta liga'
                    :fresh?'Abrir análise do jogo':'Ver prévia · reconfirmar horário'}
                </button>
              </div>
              <RadarDailyCard overview={overview} workCoverage={work} onOpenWork={onOpenWork}/>
            </article>
          )}
        </div>}
    </section>
    <p className="muted">Agenda local: {visible.length} {visible.length===1?'jogo':'jogos'} sem referência oficial específica nesta janela · Brasília: {now.date} {now.time}</p>
    {visible.length>listed.length&&<p className="muted">Exibindo os primeiros {listed.length} jogos por data e horário para manter a consulta rápida no celular.</p>}
    {visible.length===0?<p className="muted">Nenhum outro confronto na agenda local nesta janela. Use as referências oficiais acima ou consulte mais datas.</p>:<div className="calendar-list">
      {listed.map(({fixture:f,overview,work})=><article key={f.id} className="calendar-fixture radar-daily-fixture">
        <div className="radar-daily-fixture-head">
          <div className="radar-daily-fixture-title"><b>{f.home} × {f.away}</b>
            <small>{f.date} · {f.time??'Horário N/D'} (Brasília) · {f.competition}</small>
            <small><a href={f.sourceUrl} target="_blank" rel="noopener noreferrer">Conferir fonte do calendário</a></small>
          </div>
          <button type="button" className="text-button" disabled={!canAnalyzeFixture(f)||!isUpcoming(f)}
            onClick={()=>onSelect(f)}>
            {!canAnalyzeFixture(f)?'Sem histórico nesta liga':f.time?'Abrir Radar completo':'Ver prévia · confirmar horário'}
          </button>
        </div>
        <RadarDailyCard overview={overview} workCoverage={work} onOpenWork={onOpenWork}/>
      </article>)}
    </div>}
    <p className="muted">A visão diária utiliza apenas os jogos anteriores à data do confronto e as competições correspondentes. Para analisar as linhas e salvar uma previsão, abra o Radar completo. Sem horário confirmado, a prévia pode ser consultada, mas nenhuma previsão é salva.</p>
    <section className="free-calendar-discovery" aria-label="Consulta gratuita de calendários europeus">
      <h4>Consultar jogos das ligas europeias</h4>
      <p className="muted">Consulta pontual a calendários comunitários gratuitos de Premier League, Serie A italiana, La Liga e Ligue 1. Datas podem estar desatualizadas; horários de Brasília não são confirmados. Esses confrontos aparecem apenas como <strong>candidatos para pesquisa</strong>.</p>
      <button type="button" className="text-button" disabled={freeLoading} onClick={()=>{void fetchCandidateFixtures();}}>
        {freeLoading?'Consultando calendários…':free?'Atualizar consulta gratuita':'Consultar calendários gratuitos'}
      </button>
      {freeError&&<p className="alert" role="alert">{freeError}</p>}
      {free&&<>
        <p className="muted">Consulta feita em {new Date(free.consultedAt).toLocaleString('pt-BR')} · {freeVisible.length} candidatos nesta janela de datas. Nenhum calendário foi importado no histórico.</p>
        {free.errors.length>0&&<details className="free-calendar-errors"><summary>{free.errors.length} fonte(s) não disponível(is) nesta consulta</summary>
          <ul>{free.errors.map(e=><li key={e}>{e}</li>)}</ul>
        </details>}
        {freeVisible.length>freeListed.length&&<p className="muted">Exibindo os primeiros {freeListed.length} candidatos.</p>}
        {freeVisible.length===0?<p className="muted">Nenhum candidato de jogo para esta janela, nas fontes consultadas. Isso não confirma ausência de jogos.</p>:<div className="calendar-list">
          {freeListed.map(({fixture:f,overview,work})=><article key={f.id} className="calendar-fixture radar-daily-fixture free-calendar-fixture">
            <div className="radar-daily-fixture-head">
              <div className="radar-daily-fixture-title">
                <small>CATÁLOGO COMUNITÁRIO · DATA PROVISÓRIA</small>
                <b>{f.home} × {f.away}</b>
                <small>Data na fonte: {f.date} · Horário Brasília: N/D · {f.competition}</small>
                <small><a href={f.sourceUrl} target="_blank" rel="noopener noreferrer">Ver catálogo original</a> · confirme em fonte oficial</small>
              </div>
              <button type="button" className="text-button" disabled={!canAnalyzeFixture(f)}
                onClick={()=>onSelect(f)}>
                {canAnalyzeFixture(f)?'Analisar prévia · confirmar data/hora':'Histórico indisponível nesta liga'}
              </button>
            </div>
            <RadarDailyCard overview={overview} workCoverage={work} onOpenWork={onOpenWork}/>
          </article>)}
        </div>}
        <p className="muted">Consulta somente leitura. Estes candidatos não possuem horário confirmado e não podem ser salvos automaticamente como previsões. Não são jogos oficiais verificados.</p>
      </>}
    </section>
    <LeagueCoveragePanel data={data} workMatches={workRead.value?.matches??null}
      workError={workRead.error}/>
    <details className="calendar-import-extra">
      <summary>Adicionar outros campeonatos e datas (CSV)</summary>
      <p className="muted">O FutStats não pesquisa automaticamente uma agenda atualizada. Use um CSV de calendário com fonte conferível.</p>
      <label>Importar calendário CSV
        <input aria-label="Importar calendário CSV" type="file" accept=".csv,text/csv" onChange={e=>{void load(e.currentTarget.files?.[0]);e.currentTarget.value='';}}/>
      </label>
      <p className="muted">Colunas: data, horario_brasilia, competicao, mandante, visitante, url_fonte.</p>
    </details>
  </section>;
}

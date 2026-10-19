import {useState} from 'react';
import {brasiliaDate,calendarWindow,isUpcoming,mergeCalendar,parseCalendarCsv,normalizeTeam,type CalendarWindow,type ScheduledFixture} from './calendar';

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

export default function CalendarAgenda({onSelect,availableTeams}:{
  onSelect:(fixture:ScheduledFixture)=>void;
  availableTeams:string[];
}) {
  const [calendar,setCalendar]=useState(readSaved);
  const [window,setWindow]=useState<CalendarWindow>('today');
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const visible=calendarWindow(calendar,window);
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
  function matchesTeams(f:ScheduledFixture) {
    return availableTeams.some(name=>normalizeTeam(name)===normalizeTeam(f.home))&&
      availableTeams.some(name=>normalizeTeam(name)===normalizeTeam(f.away));
  }
  const now=brasiliaDate();
  return <section className="calendar-agenda" aria-label="Agenda experimental">
    <h3>Agenda de confrontos · CSV experimental</h3>
    <p className="muted">Importe um calendário pontual verificado. Isso não busca partidas automaticamente nem atualiza resultados. Utilize datas e horários de Brasília; marque horário desconhecido como N/D.</p>
    <label>Importar calendário CSV
      <input aria-label="Importar calendário CSV" type="file" accept=".csv,text/csv" onChange={e=>{void load(e.currentTarget.files?.[0]);e.currentTarget.value='';}}/>
    </label>
    <p className="muted">Colunas: data, horario_brasilia, competicao, mandante, visitante, url_fonte. Uma linha por confronto, com o link HTTPS da fonte.</p>
    {error&&<p role="alert" className="alert">{error}</p>}
    {notice&&<p role="status" className="notice">{notice}</p>}
    <div className="segment calendar-windows" role="group" aria-label="Período da agenda">
      {([['today','Hoje'],['week','7 dias'],['month','30 dias']] as const).map(([key,label])=>
        <button key={key} type="button" aria-pressed={window===key} className={window===key?'selected':''} onClick={()=>setWindow(key)}>{label}</button>
      )}
    </div>
    <p className="muted">{visible.length} jogos futuros nesta janela · referência: Brasília {now.date} {now.time}</p>
    {visible.length===0?<p className="empty compact">Nenhum jogo disponível neste período. Importe uma agenda CSV verificada.</p>:<div className="calendar-list">
      {visible.slice(0,100).map(f=><article key={f.id} className="calendar-fixture">
        <div><b>{f.home} × {f.away}</b>
          <small>{f.date} · {f.time??'Horário N/D'} (Brasília) · {f.competition}</small>
          <small><a href={f.sourceUrl} target="_blank" rel="noopener noreferrer">Conferir fonte</a></small>
        </div>
        <button type="button" className="text-button" disabled={!f.time||!matchesTeams(f)||!isUpcoming(f)} onClick={()=>onSelect(f)}>
          {matchesTeams(f)&&f.time?'Analisar jogo':'Histórico ou horário indisponível'}
        </button>
      </article>)}
    </div>}
    <p className="muted">Somente partidas com horário e equipes cadastradas podem ser transferidas para o Radar. Confira datas, horários, nomes e fontes antes de analisar.</p>
  </section>;
}

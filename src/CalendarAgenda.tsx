import {useState} from 'react';
import {brasiliaDate,calendarWindow,isUpcoming,mergeCalendar,parseCalendarCsv,brasileiraoRound32,type CalendarWindow,type ScheduledFixture} from './calendar';

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

export default function CalendarAgenda({onSelect,canAnalyzeFixture}:{
  onSelect:(fixture:ScheduledFixture)=>void;
  canAnalyzeFixture:(fixture:ScheduledFixture)=>boolean;
}) {
  const [calendar,setCalendar]=useState(readSaved);
  const [window,setWindow]=useState<CalendarWindow>('today');
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  // Preserve user-imported agenda entries; show the verified round as a fallback.
  // Never write bundled fixtures to localStorage without user action.
  const visible=calendarWindow(mergeCalendar(calendar,brasileiraoRound32).entries,window);
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
    <h3>Jogos do dia · selecione para analisar</h3>
    <p className="muted">Agenda local, não atualizada ao vivo. Inclui uma referência antiga da rodada 32 (23–26/10/2026) e jogos importados por você. Confira datas, horários e fonte antes de salvar qualquer previsão.</p>
    {error&&<p role="alert" className="alert">{error}</p>}
    {notice&&<p role="status" className="notice">{notice}</p>}
    <div className="segment calendar-windows" role="group" aria-label="Período da agenda">
      {([['today','Hoje'],['week','7 dias'],['month','30 dias']] as const).map(([key,label])=>
        <button key={key} type="button" aria-pressed={window===key} className={window===key?'selected':''} onClick={()=>setWindow(key)}>{label}</button>
      )}
    </div>
    <p className="muted">{visible.length} {visible.length===1?'jogo':'jogos'} na agenda desta janela · Brasília: {now.date} {now.time}</p>
    {visible.length===0?<p className="empty compact">Nenhum confronto cadastrado para este período. Isso não significa que não existam jogos hoje. Consulte “7 dias” ou “30 dias”, ou adicione uma agenda.</p>:<div className="calendar-list">
      {visible.slice(0,100).map(f=><article key={f.id} className="calendar-fixture">
        <div><b>{f.home} × {f.away}</b>
          <small>{f.date} · {f.time??'Horário N/D'} (Brasília) · {f.competition}</small>
          <small><a href={f.sourceUrl} target="_blank" rel="noopener noreferrer">Conferir fonte</a></small>
        </div>
        <button type="button" className="text-button" disabled={!canAnalyzeFixture(f)||!isUpcoming(f)} onClick={()=>onSelect(f)}>
          {!canAnalyzeFixture(f)?'Sem histórico nesta liga':f.time?'Analisar jogo':'Ver prévia · confirmar horário'}
        </button>
      </article>)}
    </div>}
    <p className="muted">Escolher um confronto preenche as equipes e a data; o horário será preenchido somente se estiver disponível na agenda. Sem horário confirmado, a prévia pode ser consultada, mas a previsão não pode ser salva.</p>
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

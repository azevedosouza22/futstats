import {useEffect,useState} from 'react';
import {WORK_ANALYSIS_LEAGUES} from './workAnalysis';
import {loadEuropeSchedule,type EuropeScheduleFixture} from './europeWorkSchedule';

const dateLabel=(s:string)=>new Date(s+'T12:00:00').toLocaleDateString('pt-BR');
const leagueName=(id:string)=>WORK_ANALYSIS_LEAGUES.find(x=>x.id===id)?.label??id;

/** Consult the other three competitions without enabling unsafe autoforecasts. */
export default function EuropeWorkSchedule(){
 const [open,setOpen]=useState(false);
 const [loading,setLoading]=useState(false);
 const [fixtures,setFixtures]=useState<EuropeScheduleFixture[]>([]);
 const [errors,setErrors]=useState<string[]>([]);
 useEffect(()=>{
  if(!open)return;
  const controller=new AbortController();
  setLoading(true);
  void loadEuropeSchedule(new Date(),controller.signal).then(data=>{
   if(controller.signal.aborted)return;
   setFixtures(data.fixtures);setErrors(data.errors);
  }).catch(e=>{
   if(!controller.signal.aborted)setErrors([e instanceof Error?e.message:'Consulta indisponível']);
  }).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return ()=>controller.abort();
 },[open]);
 return <details className="fpl-pilot-disclosure" open={open}
  onToggle={e=>setOpen(e.currentTarget.open)}>
  <summary>Ver calendário gratuito de Itália, Espanha e França (somente consulta)</summary>
  <p className="muted">O FutStats consulta as três agendas gratuitamente quando você abre esta lista. É uma fonte comunitária que pode estar desatualizada. <strong>Ainda não registramos previsões automaticamente nessas ligas</strong>, pois primeiro precisamos confirmar os horários e o fuso de cada confronto.</p>
  {loading&&<p role="status" className="muted">Consultando calendários gratuitos…</p>}
  {errors.length>0&&<p role="alert" className="alert">{errors.join('; ')}</p>}
  {!loading&&fixtures.length===0&&<p className="muted">Nenhuma partida futura utilizável encontrada. Nenhum jogo foi criado.</p>}
  {!loading&&fixtures.length>0&&<div className="fpl-pilot-games">
   {(['serie-a','la-liga','ligue-1'] as const).map(id=>{
    const games=fixtures.filter(x=>x.league===id);
    return <section key={id}>
     <h4>{leagueName(id)}</h4>
     {!games.length&&<p className="muted">Nenhum confronto futuro identificado.</p>}
     <ul className="source-list">
      {games.slice(0,10).map(f=><li key={f.key}>
       <strong>{f.home} × {f.away}</strong> · {dateLabel(f.date)}
       <small>{f.localTime?f.localTime+' (hora local informada pela fonte, não Brasília)':
        'Horário ainda não divulgado na fonte'}
        {' · '}<a href={f.sourceUrl} target="_blank" rel="noopener noreferrer">Calendário OpenFootball</a></small>
      </li>)}
     </ul>
    </section>;
   })}
  </div>}
  <p className="muted">Importante: a lista não é uma autorização para registrar apostas ou previsões. Nenhuma partida é importada, e os registros do Radar principal continuam intactos.</p>
 </details>;
}

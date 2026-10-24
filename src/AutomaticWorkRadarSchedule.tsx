import {useEffect,useState} from 'react';
import type {WorkAnalysisMatch} from './workAnalysis';
import EuropeWorkSchedule from './EuropeWorkSchedule';
import {
 AUTO_WORK_RADAR_SETTING,AUTO_WORK_RADAR_HOURS,
 loadUpcomingPremierFixtures,automaticCaptureCandidates,captureUpcomingWorkPredictions,
 type AutoWorkFixture
} from './workRadarAutoFixtures';
import {
 WORK_RADAR_PROSPECTIVE_STORAGE,type FrozenWorkForecast
} from './workRadarProspective';

const dateLabel=(v:string)=>new Date(v+'T12:00:00').toLocaleDateString('pt-BR');
const fixtureKey=(f:AutoWorkFixture)=>f.id;

export default function AutomaticWorkRadarSchedule({
 matches,onStored
}:{matches:WorkAnalysisMatch[];onStored:(list:FrozenWorkForecast[])=>void}){
 const [fixtures,setFixtures]=useState<AutoWorkFixture[]>([]);
 const [loading,setLoading]=useState(true);
 const [enabled,setEnabled]=useState(()=>
  typeof localStorage!=='undefined'&&localStorage.getItem(AUTO_WORK_RADAR_SETTING)==='enabled');
 const [status,setStatus]=useState('');
 const [error,setError]=useState('');
 function capture(next:AutoWorkFixture[]){
  try{
   const raw=localStorage.getItem(WORK_RADAR_PROSPECTIVE_STORAGE);
   const result=captureUpcomingWorkPredictions(matches,next,raw,new Date());
   if(result.added>0){
    localStorage.setItem(WORK_RADAR_PROSPECTIVE_STORAGE,JSON.stringify(result.saved));
    onStored(result.saved);
   }
   const message=result.added>0?
    result.added+' teste(s) prospectivo(s) registrado(s) automaticamente ANTES dos jogos.':
    'Agenda consultada; nenhum teste novo elegível para registrar.';
   const warning=result.skipped?
    ' '+result.skipped+' jogos não foram registrados por insuficiência ou incompatibilidade de dados.':'';
   setStatus(message+warning);
   if(result.errors.length)setError(result.errors[0]);
  }catch(e){
   setError(e instanceof Error?e.message:'Não foi possível registrar. Os dados existentes continuam preservados.');
  }
 }
 useEffect(()=>{
  const ctrl=new AbortController();
  async function read(){
   setLoading(true);setError('');
   try{
    const upcoming=await loadUpcomingPremierFixtures(new Date(),ctrl.signal);
    if(ctrl.signal.aborted)return;
    setFixtures(upcoming);
    if(localStorage.getItem(AUTO_WORK_RADAR_SETTING)==='enabled'){
     capture(upcoming);
    }
   }catch(e){
    if(!ctrl.signal.aborted)setError(e instanceof Error?e.message:'Não foi possível consultar a agenda gratuita.');
   }finally{if(!ctrl.signal.aborted)setLoading(false);}
  }
  void read();
  return ()=>ctrl.abort();
  // Only reload when the private Work research collection changes, not while
  // displaying a capture. The callback itself only writes distinct new IDs.
 },[matches]);
 function toggle(){
  if(enabled){
   try{localStorage.removeItem(AUTO_WORK_RADAR_SETTING);setEnabled(false);
    setStatus('Registro automático desativado. Previsões antigas permanecem salvas.');
   }catch{setError('Não foi possível alterar a preferência do navegador.');}
   return;
  }
  if(!window.confirm('Ativar o registro automático do Radar Work para jogos da Premier League com horário publicado?\n\nSempre que você abrir o aplicativo com internet, ele consultará a agenda gratuita e salvará, ANTES do início, os sinais V2 e V3 dos próximos 3 dias. A função não roda enquanto o aplicativo estiver fechado. O histórico e o Radar antigo não serão alterados.'))return;
  try{
   localStorage.setItem(AUTO_WORK_RADAR_SETTING,'enabled');
   setEnabled(true);setError('');
   setStatus('Automação ativada. O FutStats consultará a agenda quando este painel for aberto.');
   if(!loading&&fixtures.length)capture(fixtures);
  }catch{setError('Não foi possível ativar a automação neste navegador.');}
 }
 const shortList=fixtures.slice(0,12);
 const soon=automaticCaptureCandidates(fixtures).length;
 return <section className="work-radar-auto-schedule" aria-label="Radar Work agenda automática">
  <h3>Agenda automática · Premier League</h3>
  <p className="muted">O FutStats consulta os próximos confrontos da fonte gratuita já integrada, identifica as equipes, converte o horário para Brasília e calcula os sinais V2/V3 com os jogos Work salvos. Você não precisa preencher campeonato, nomes, data nem relógio.</p>
  <button type="button" className="primary" onClick={toggle}>
   {enabled?'Desativar registro automático':'Ativar registro automático ao abrir o app'}
  </button>
  <p className="muted">{enabled?
   'Ativado: registra os próximos jogos dos próximos 3 dias quando você abrir este painel com internet, desde que a fonte publique horários e as equipes tenham histórico Work.':
   'Desativado: a agenda aparece apenas para consulta; nenhum sinal é gravado sem sua autorização.'}</p>
  {loading&&<p className="muted" role="status">Consultando a agenda pública da Premier League…</p>}
  {error&&<p className="alert" role="alert">{error} Nenhuma previsão existente será sobrescrita.</p>}
  {status&&<p className="notice" role="status">{status}</p>}
  {!loading&&fixtures.length>0&&<>
   <div className="fpl-pilot-numbers">
    <div><strong>{fixtures.length}</strong><span>Confrontos futuros identificados</span></div>
    <div><strong>{soon}</strong><span>Com início previsto nas próximas {AUTO_WORK_RADAR_HOURS}h</span></div>
   </div>
   <details className="fpl-pilot-disclosure">
    <summary>Ver os próximos confrontos e horários ({shortList.length})</summary>
    <ul className="source-list">
     {shortList.map(f=><li key={fixtureKey(f)}>
      <strong>{f.home} × {f.away}</strong> · {dateLabel(f.date)} às {f.time} (Brasília)
      <small>Rodada {f.gw} · <a href={f.sourceUrl} target="_blank" rel="noopener noreferrer">Calendário gratuito FPL Core Insights</a></small>
     </li>)}
    </ul>
   </details>
  </>}
  {!loading&&!fixtures.length&&!error&&
   <p className="muted">A fonte ainda não publicou partidas futuras utilizáveis. Nenhum horário será inventado.</p>}
  <EuropeWorkSchedule/>
  <p className="muted">Primeira fase: automatização da Premier League apenas. Esta fonte é comunitária, não oficial, e horários podem ser alterados. Partidas reagendadas ficam para revisão; registros já congelados não são substituídos. Quando o app estiver fechado, ele não executa tarefas em segundo plano. Para automatização contínua, será necessária uma rotina no servidor e armazenamento seguro dos dados autorizados.</p>
 </section>;
}

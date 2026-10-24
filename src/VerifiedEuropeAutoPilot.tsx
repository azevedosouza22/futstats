import {useEffect,useState} from 'react';
import type {WorkAnalysisMatch} from './workAnalysis';
import {
 EUROPE_VERIFIED_WORK_OPT_IN,VERIFIED_EUROPE_FIXTURES,
 fixtureWithOfficialTime,captureVerifiedEuropeFixtures
} from './verifiedEuropeWorkFixtures';
import {
 WORK_RADAR_PROSPECTIVE_STORAGE,type FrozenWorkForecast
} from './workRadarProspective';

type Props={matches:WorkAnalysisMatch[];onStored:(s:FrozenWorkForecast[])=>void};
const leagues={'serie-a':'Serie A italiana','la-liga':'La Liga espanhola','ligue-1':'Ligue 1 francesa'};
export default function VerifiedEuropeAutoPilot({matches,onStored}:Props){
 const [enabled,setEnabled]=useState(()=>typeof localStorage!=='undefined'&&
   localStorage.getItem(EUROPE_VERIFIED_WORK_OPT_IN)==='enabled');
 const [notice,setNotice]=useState('');
 const [error,setError]=useState('');
 const remaining=VERIFIED_EUROPE_FIXTURES.map(f=>fixtureWithOfficialTime(f)).filter(x=>x!==null);
 function execute(){
  try{
   const saved=localStorage.getItem(WORK_RADAR_PROSPECTIVE_STORAGE);
   const result=captureVerifiedEuropeFixtures(matches,saved,new Date());
   if(result.added){
    localStorage.setItem(WORK_RADAR_PROSPECTIVE_STORAGE,JSON.stringify(result.saved));
    onStored(result.saved);
   }
   setNotice(result.added
    ?result.added+' teste(s) registrado(s) automaticamente a partir de agendas verificadas.'
    :result.duplicate?'Todos os jogos elegíveis já estão registrados; nenhuma previsão foi modificada.':
     result.eligible===0?'Nenhum confronto do piloto ainda está por começar.':
     result.notMatched?'Não encontrei as mesmas equipes nas pesquisas Work; nenhum dado foi inventado.':
     'Nenhuma previsão nova elegível para registrar.');
   if(result.failed.length)setError(result.failed.join('; '));
  }catch(e){
   setError(e instanceof Error?e.message:'Falha ao consultar os registros anteriores.');
  }
 }
 useEffect(()=>{
  if(enabled)execute();
  // Same fixtures and same Work database already validated; a refresh will
  // repeat the check but appendFrozenWorkForecast deduplicates by identity.
 },[matches]);
 function toggle(){
  if(enabled){
   try{localStorage.removeItem(EUROPE_VERIFIED_WORK_OPT_IN);setEnabled(false);
    setNotice('Piloto desativado. Previsões já registradas continuam congeladas.');
   }catch{setError('Não foi possível alterar a preferência.');}
   return;
  }
  const proceed=window.confirm(
   'Ativar o piloto experimental para APENAS três jogos europeus cujos horários foram conferidos em fontes oficiais em 23/10/2026?\n\n' +
   'O aplicativo registrará os sinais somente antes do início, ao abrir o Radar Work. Não é atualização contínua das três ligas. Os históricos, a Premier League e os registros anteriores não serão modificados.'
  );
  if(!proceed)return;
  try{
   localStorage.setItem(EUROPE_VERIFIED_WORK_OPT_IN,'enabled');
   setEnabled(true);setError('');
   execute();
  }catch{setError('Não foi possível ativar esta função neste dispositivo.');}
 }
 return <section className="work-radar-verified-europe" aria-label="Teste automático de confrontos europeus oficialmente verificados">
  <h3>Automação europeia · jogos com horário confirmado</h3>
  <p className="muted">Identifiquei uma mudança de data que o calendário comunitário ainda não havia refletido. Por segurança, este primeiro piloto registra automaticamente <strong>somente três jogos com fontes oficiais verificadas em 23/10/2026</strong>. Outros jogos não entram até a agenda ser confirmada.</p>
  <button className="primary" type="button" onClick={toggle}>
   {enabled?'Desativar piloto europeu':'Ativar piloto europeu verificado'}
  </button>
  <p className="muted">{enabled?'Ativado: ao abrir esta área, registra jogos deste piloto somente se ainda não começaram.':
   'Desativado: mostra datas para consulta, sem registrar previsões europeias.'}</p>
  {notice&&<p role="status" className="notice">{notice}</p>}
  {error&&<p role="alert" className="alert">{error}</p>}
  <details className="fpl-pilot-disclosure">
   <summary>Conferir os três jogos e as fontes oficiais</summary>
   <ul className="source-list">
    {VERIFIED_EUROPE_FIXTURES.map(f=>{
     const valid=fixtureWithOfficialTime(f);
     return <li key={f.key}>
      <strong>{leagues[f.league]} · {f.home} × {f.away}</strong>
      <small>{f.localDate.split('-').reverse().join('/')} às {f.localTime} ({f.timezone}) —
       {valid?valid.matchAt.slice(0,10).split('-').reverse().join('/')+' às '+valid.matchAt.slice(11)+' Brasília':
        'Já começou ou precisa de nova confirmação de horário'}</small>
      <small><a href={f.officialUrl} target="_blank" rel="noopener noreferrer">Fonte oficial do confronto</a></small>
     </li>;
    })}
   </ul>
  </details>
  <p className="muted">Os horários podem mudar. Esta é uma lista pontual, não um calendário oficial em tempo real; para executar todo dia, precisaremos integrar um provedor com data UTC atualizada e verificação de alterações. O piloto não roda com o celular fechado.</p>
 </section>;
}

import {useEffect,useState} from 'react';
import {brasiliaDate} from './calendar';
import {freePremierCoverage,parseFreePremier,OPENFOOTBALL_LICENSE,OPENFOOTBALL_PAGE,OPENFOOTBALL_URL,type FreeCatalogue} from './openFootball';

const labelDate=(value:string)=>new Date(value+'T12:00:00').toLocaleDateString('pt-BR');
export default function OpenFootballPilot(){
 const [catalog,setCatalog]=useState<FreeCatalogue|null>(null);
 const [round,setRound]=useState(0);
 const [reload,setReload]=useState(0);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [checked,setChecked]=useState<string|null>(null);
 useEffect(()=>{
  const controller=new AbortController();
  const run=async()=>{
   setBusy(true);setError('');
   try{
    const response=await fetch(OPENFOOTBALL_URL,{signal:controller.signal,cache:'no-store'});
    if(!response.ok)throw Error('A fonte gratuita não respondeu.');
    const raw=await response.text();
    if(raw.length>200_000)throw Error('Catálogo excedeu o tamanho previsto.');
    const parsed=parseFreePremier(JSON.parse(raw) as unknown);
    if(controller.signal.aborted)return;
    setCatalog(parsed);setChecked(new Date().toISOString());
   }catch(e){
    if(controller.signal.aborted)return;
    setError(e instanceof Error?e.message:'Não foi possível consultar o calendário gratuito.');
   }finally{if(!controller.signal.aborted)setBusy(false);}
  };
  void run();
  return ()=>controller.abort();
 },[reload]);
 const today=brasiliaDate().date;
 const cover=catalog?freePremierCoverage(catalog,today):null;
 const activeRound=round||catalog?.fixtures.find(f=>f.date>=today)?.round||1;
 const rows=catalog?.fixtures.filter(f=>f.round===activeRound)??[];
 return <section className="panel openfootball-pilot" aria-label="Catálogo gratuito Premier League">
  <div className="panel-head">
   <div><h2>Premier League 2026/27 · Catálogo gratuito</h2>
    <p>Primeiro piloto de ampliação da base, sem chave de API nem assinatura.</p></div>
   <span className="tag">SOMENTE CONSULTA</span>
  </div>
  <div className="openfootball-content">
   <p className="openfootball-guard">Este catálogo é <strong>separado da base estatística do FutStats</strong>. Ele não adiciona partidas ao Histórico nem cria sinais V2/V3. Finalizações, chutes no gol e escanteios por tempo continuam indisponíveis nesta fonte.</p>
   <div className="openfootball-actions">
    <button className="text-button" type="button" disabled={busy} onClick={()=>setReload(v=>v+1)}>{busy?'Consultando fonte gratuita…':'Atualizar catálogo gratuito'}</button>
    <a href={OPENFOOTBALL_PAGE} target="_blank" rel="noreferrer">Ver dados de origem ↗</a>
   </div>
   {error&&<p className="alert" role="alert">{error} {catalog?'Exibindo a última consulta recebida nesta sessão.':''}</p>}
   {!catalog&&!busy&&!error&&<p className="muted">Nenhum dado disponível.</p>}
   {catalog&&cover&&<>
    <div className="openfootball-kpis">
     <div><strong>{catalog.fixtures.length}</strong><span>Partidas no catálogo</span></div>
     <div><strong>{catalog.clubs}</strong><span>Clubes</span></div>
     <div><strong>{catalog.rounds}</strong><span>Rodadas</span></div>
     <div><strong>{catalog.ftCount}</strong><span>Placares FT publicados</span></div>
    </div>
    <p className="openfootball-caution">
      {catalog.lastScoreDate
        ?<>Último placar final disponível na fonte: <b>{labelDate(catalog.lastScoreDate)}</b>.</>
        :'Nenhum placar final disponível na fonte.'}
      {' '}{cover.missingPast} partidas com data anterior a hoje ainda não possuem um placar FT estruturado no arquivo. <strong>Não tratar como resultados confirmados.</strong>
    </p>
    <label className="openfootball-round">Escolher rodada
      <select aria-label="Selecionar rodada da Premier League" value={activeRound} onChange={e=>setRound(Number(e.target.value))}>
       {Array.from({length:catalog.rounds},(_,i)=>i+1).map(n=><option key={n} value={n}>Rodada {n}</option>)}
      </select>
    </label>
    <p className="muted">Jogo e data conforme a fonte. Os horários abaixo são originais, <strong>sem fuso horário identificado</strong>; não devem ser considerados horários de Brasília até conferência oficial.</p>
    <div className="openfootball-fixtures">
     {rows.map(f=><div className="openfootball-fixture" key={f.id}>
      <div><strong>{f.home} × {f.away}</strong><small>{labelDate(f.date)} · Horário da fonte: {f.sourceTime??'N/D'}</small></div>
      <span className="openfootball-score">{f.fullTime&&f.date<today?
       f.fullTime.join(' × '):'FT: N/D'}</span>
     </div>)}
    </div>
    <p className="muted">“FT” significa placar final declarado na fonte; ainda requer conferência independente para uso no FutStats. Um placar como “0 × 0” sem identificação FT permanece N/D. A relação de jogos pode sofrer alterações.</p>
    {checked&&<p className="openfootball-timestamp">Consulta realizada em {new Date(checked).toLocaleString('pt-BR')} · Fonte CC0, sem custos. <a href={OPENFOOTBALL_LICENSE} target="_blank" rel="noreferrer">Ver licença ↗</a></p>}
   </>}
  </div>
 </section>;
}

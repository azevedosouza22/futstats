import {useEffect,useRef,useState} from 'react';
import {footballRequest,FootballRequestError,type AutoFixture,type StatTeam} from './apiFootball';
import {clientBuild,shortBuild} from './build';
import {buildMatchPanel} from './matchPanel';
import {RADAR_STORAGE} from './fullBackup';
import {parseRadarRecords} from './radarRecords';
import {previewFootballResult} from './footballResultImport';
import type {Data} from './model';
const fmt=(v:number|null)=>v===null?'N/D':v.toLocaleString('pt-BR');
type Field='statistics'|'statistics_1h'|'statistics_2h';
const periods: {field:Field;label:string}[]=[{field:'statistics',label:'Acumulado da partida'},{field:'statistics_1h',label:'Primeiro tempo'},{field:'statistics_2h',label:'Segundo tempo'}];
export default function AutomaticMatches({data,save}:{data:Data;save:(next:Data)=>boolean}){
 const [token,setToken]=useState(''),[config,setConfig]=useState<{dates:string[];fixtures:string[]}|null>(null),[date,setDate]=useState('');
 const [fixtures,setFixtures]=useState<AutoFixture[]>([]),[selected,setSelected]=useState<AutoFixture|null>(null),[full,setFull]=useState<StatTeam[]>([]),[halves,setHalves]=useState<StatTeam[]>([]);
 const [error,setError]=useState<Error|null>(null),[serverBuild,setServerBuild]=useState('unknown'),[busy,setBusy]=useState(false),[queried,setQueried]=useState(false),[stamp,setStamp]=useState(''),[halfStamp,setHalfStamp]=useState(''),[field,setField]=useState<Field>('statistics'),[halfNotice,setHalfNotice]=useState('');
 const [candidate,setCandidate]=useState<ReturnType<typeof previewFootballResult>|null>(null);
 const [importNotice,setImportNotice]=useState('');
 const controller=useRef<AbortController|null>(null),run=useRef(0),heading=useRef<HTMLHeadingElement|null>(null),buttons=useRef(new Map<number,HTMLButtonElement>()),last=useRef<number|null>(null);
 useEffect(()=>()=>{run.current++;controller.current?.abort();},[]);
 useEffect(()=>{if(selected){heading.current?.focus({preventScroll:true});heading.current?.scrollIntoView({block:'start'});}else if(last.current!==null){buttons.current.get(last.current)?.focus();}},[selected]);
 async function execute(action:(signal:AbortSignal)=>Promise<void>){const n=++run.current;controller.current?.abort();const c=new AbortController();controller.current=c;setBusy(true);setError(null);try{await action(c.signal);}catch(e){if(!c.signal.aborted&&n===run.current){setError(e instanceof Error?e:new Error('Falha de consulta.'));if(e instanceof FootballRequestError)setServerBuild(e.serverBuild);}}finally{if(n===run.current)setBusy(false);}}
 function reset(){setSelected(null);setFull([]);setHalves([]);setStamp('');setHalfStamp('');setField('statistics');setHalfNotice('');setCandidate(null);setImportNotice('');}
 function back(){run.current++;controller.current?.abort();setBusy(false);setError(null);reset();}
 async function configure(signal:AbortSignal){const c=await footballRequest('config',token,{},signal);if(signal.aborted)return;if(!Array.isArray(c.dates)||!Array.isArray(c.fixtures))throw Error('Configuração inválida.');setServerBuild(c.serverBuild);setConfig(c);setDate(c.dates[0]??'');}
 async function list(signal:AbortSignal){reset();setFixtures([]);setQueried(false);const data=await footballRequest('fixtures',token,{date},signal);if(signal.aborted)return;if(!Array.isArray(data.items))throw Error('Resposta inválida.');setServerBuild(data.serverBuild);setFixtures(data.items);setQueried(true);}
 async function details(fixture:AutoFixture,signal:AbortSignal){reset();last.current=fixture.id;setSelected(fixture);const data=await footballRequest('statistics',token,{fixture:String(fixture.id)},signal);if(signal.aborted)return;if(data.fixtureId!==fixture.id||!Array.isArray(data.items))throw Error('Resposta inválida para a partida.');setServerBuild(data.serverBuild);setFull(data.items);setStamp(data.fetchedAt);}
 async function half(signal:AbortSignal){if(!selected)return;const data=await footballRequest('statistics',token,{fixture:String(selected.id),half:'true'},signal);if(signal.aborted)return;if(data.fixtureId!==selected.id||data.halfRequested!==true||!Array.isArray(data.items))throw Error('Resposta inválida para os tempos.');setServerBuild(data.serverBuild);setHalves(data.items);setHalfStamp(data.fetchedAt);setHalfNotice(data.availability==='unavailable'?'O provedor informou que os dados por tempo não estão disponíveis para esta consulta. Os tempos permanecem N/D.':'');setField('statistics_1h');}
 async function prepareImport(signal:AbortSignal){
   setCandidate(null);setImportNotice('');
   if(!selected||!stamp)throw Error('Consulte primeiro os detalhes e o acumulado da partida.');
   let halvesData=halves,verified=!!halfStamp;
   if(!verified){
     // Only an explicit user request consumes the additional upstream call.
     const response=await footballRequest('statistics',token,{fixture:String(selected.id),half:'true'},signal);
     if(signal.aborted)return;
     if(response.fixtureId!==selected.id||response.halfRequested!==true||!Array.isArray(response.items))
       throw Error('Dados por tempo de outra partida: importação interrompida.');
     setServerBuild(response.serverBuild);
     verified=response.availability!=='unavailable';
     halvesData=verified?response.items:[];
     setHalves(halvesData);
     setHalfStamp(verified?response.fetchedAt:'');
     setHalfNotice(verified?'':'Dados por tempo indisponíveis: os períodos serão importados como N/D.');
   }
   const radar:unknown=JSON.parse(localStorage.getItem(RADAR_STORAGE)??'[]');
   const savedRecords=parseRadarRecords(radar);
   const result=previewFootballResult(data,savedRecords,selected,full,halvesData,verified);
   if(!signal.aborted)setCandidate(result);
 }
 function confirmImport(){
   if(!candidate)return;
   if(!window.confirm(
     'Adicionar '+candidate.forecast.home+' × '+candidate.forecast.away+
     ' ('+candidate.match.date+') à base do FutStats?\\n\n'+
     'Fonte: API-Football, partida '+candidate.sourceId+'.\\n'+
     'Competição da previsão: '+candidate.match.competition+'.\\n'+
     'Competição da fonte: '+candidate.sourceLeague+'.\\n\n'+
     'Não substituímos jogos nem previsões. Confira nomes, data, competição e placar.'))return;
   if(save(candidate.data)){
     setCandidate(null);
     setImportNotice('Partida incluída com segurança. As previsões V2/V3 permanecem congeladas. Confira a avaliação no Radar experimental.');
   }
 }
 function statistics(){
  if(!selected)return null;
  const p=buildMatchPanel(field==='statistics'?full:halves,selected,field);
  return <>{!p.statisticsAvailable&&<p className="auto-empty">Não há estatísticas identificadas para este período nesta consulta. N/D não significa zero.</p>}
   <section className="auto-summary" aria-label="Resumo do período selecionado"><h4>Resumo da partida</h4><p className="auto-team-legend"><span>Mandante: {selected.home.name??'N/D'}</span><span>Visitante: {selected.away.name??'N/D'}</span></p><div className="auto-summary-grid">{p.summary.map(card=><article className="auto-summary-card" key={card.key}><h4>{card.label}</h4><div className="auto-summary-values"><div><small>Mandante</small><strong aria-label={`${selected.home.name??'Mandante'}: ${fmt(card.values[0])}`}>{fmt(card.values[0])}</strong></div><div className="auto-total"><small>Total</small><strong>{fmt(card.total??null)}</strong></div><div><small>Visitante</small><strong aria-label={`${selected.away.name??'Visitante'}: ${fmt(card.values[1])}`}>{fmt(card.values[1])}</strong></div></div></article>)}</div><p className="muted">Totais somam apenas valores disponíveis das duas equipes neste período. Gols dos tempos não são inferidos pelo placar geral.</p></section>
   <details className="auto-more" key={selected.id}><summary>Mais estatísticas <span>({p.more.length} indicadores)</span></summary><p className="muted">Barras relativas ao maior valor entre as equipes, para cada estatística. Não representam probabilidades.</p><div className="auto-stats">{p.more.map(({key,label,values,unit})=>{const comparable=values.every(v=>v!==null),max=Math.max(...values.map(v=>v??0));return <article className="auto-stat" key={key}><h4>{label}</h4>{values.map((value,side)=><div className={`auto-stat-side side-${side}`} key={side}><div><span>{side===0?selected.home.name??'Mandante':selected.away.name??'Visitante'}</span><strong>{fmt(value)}{value!==null?unit:''}</strong></div>{comparable&&<div className="auto-track" aria-hidden="true"><span style={{width:`${max?(value??0)/max*100:0}%`}}/></div>}</div>)}{!comparable&&<small>Comparação indisponível: dado ausente.</small>}</article>;})}</div></details>
  </>;
 }
 return <section className="panel auto-panel"><div className="panel-head"><div><span className="auto-brand">FUTSTATS INTELLIGENCE</span><h2>Partidas automáticas</h2><p>Fonte: API-Football · Consulta experimental</p></div><span className="tag">POC PRIVADA</span></div><div className="analysis-content"><p className="auto-build"><span>Versão do cliente: <code title={clientBuild}>{shortBuild(clientBuild)}</code></span><span>Versão do servidor: <code title={serverBuild}>{shortBuild(serverBuild)}</code></span></p>{clientBuild!=='local'&&clientBuild!=='unknown'&&serverBuild!=='local'&&serverBuild!=='unknown'&&clientBuild!==serverBuild&&<p className="alert" role="status">Cliente e servidor estão em versões diferentes. Feche as abas e reabra a prévia atual, sem apagar os dados do aplicativo.</p>}
 {!selected&&<><p className="muted">Consultas pontuais com cache. Sem atualização contínua nem importação para sua base local. Horários exibidos no fuso do seu dispositivo.</p>{!config?<form onSubmit={e=>{e.preventDefault();void execute(configure);}}><label>Código de acesso privado<input type="password" autoComplete="off" value={token} onChange={e=>setToken(e.target.value)} required/><small>Use o código separado da PoC. Nunca informe sua chave API-Sports aqui.</small></label><button className="primary" disabled={busy}>Acessar consultas</button></form>:<div className="auto-controls"><label>Data da consulta<select aria-label="Data automática" disabled={busy} value={date} onChange={e=>{last.current=null;setDate(e.target.value);setFixtures([]);setQueried(false);reset();}}>{config.dates.map(d=><option key={d}>{d}</option>)}</select></label><button className="primary" disabled={busy||!date} onClick={()=>void execute(list)}>Consultar partidas</button><button className="text-button" disabled={busy} onClick={()=>{last.current=null;setConfig(null);setToken('');setFixtures([]);setQueried(false);reset();}}>Encerrar acesso</button></div>}</>}
 {selected&&<div className="auto-match"><button className="auto-back" onClick={back}>← Voltar às partidas</button><h3 ref={heading} tabIndex={-1}>{selected.home.name??'Mandante'} × {selected.away.name??'Visitante'}</h3><div className="auto-score" aria-label="Placar geral informado pela fonte">{fmt(selected.goals[0])} <span>×</span> {fmt(selected.goals[1])}</div><p>{selected.league??'Competição N/D'} · {selected.statusLabel??selected.status??'Status N/D'} · minuto {fmt(selected.minute)}</p><p className="auto-source">Placar geral · Fonte: API-Football · ID {selected.id}</p></div>}
 {busy&&<p className="auto-loading" role="status"><span aria-hidden="true"/>Consultando API-Football…</p>}{error&&<div className="auto-error" role="alert"><p>⚠ {error.message}</p>{error instanceof FootballRequestError&&<dl className="auto-diagnostics" aria-label="Diagnóstico seguro"><dt>Código</dt><dd>{error.code}</dd><dt>HTTP do servidor</dt><dd>{error.serverStatus}</dd><dt>HTTP da API-Football</dt><dd>{error.upstreamStatus??'Não informado'}</dd><dt>Servidor</dt><dd>{shortBuild(error.serverBuild)}</dd>{error.errorShape&&<><dt>Formato de errors</dt><dd>{error.errorShape}</dd></>}{error.errorCategory&&<><dt>Categoria</dt><dd>{error.errorCategory}</dd></>}{error.unknownPropertyCount!==null&&<><dt>Propriedades reconhecidas</dt><dd>{error.knownProperties.join(', ')||'Nenhuma'}</dd><dt>Propriedades não reconhecidas</dt><dd>{error.unknownPropertyCount}</dd></>}{error.inspectionLimited&&<><dt>Inspeção limitada</dt><dd>Sim</dd></>}</dl>}</div>}
 {importNotice&&<p className="notice" role="status">{importNotice}</p>}
 {!selected&&queried&&!fixtures.length&&!busy&&<p className="auto-empty" role="status">Nenhuma partida retornada pela fonte nesta consulta.</p>}
 {!selected&&<div className="automatic-list">{fixtures.map(f=><button key={f.id} ref={node=>{if(node)buttons.current.set(f.id,node);else buttons.current.delete(f.id);}} className="automatic-fixture" disabled={busy||!config?.fixtures.includes(String(f.id))} onClick={()=>void execute(s=>details(f,s))}><b>{f.home.name??'N/D'} {fmt(f.goals[0])} × {fmt(f.goals[1])} {f.away.name??'N/D'}</b><span>{f.league??'Competição N/D'} · {f.date&&!Number.isNaN(Date.parse(f.date))?new Date(f.date).toLocaleString('pt-BR'):'Horário N/D'}</span><span>{f.statusLabel??f.status??'Status N/D'} · minuto {fmt(f.minute)}</span>{config?.fixtures.includes(String(f.id))?<small>Ver detalhes →</small>:<small>Estatísticas não autorizadas nesta PoC.</small>}</button>)}</div>}
 {selected&&stamp&&<section className="auto-import-review" aria-label="Conferir resultado antes de importar">
   <h4>Atualizar resultados do Radar · Experimental</h4>
   <p className="muted">Confira esta partida encerrada com as previsões pré-jogo já salvas. Os resultados só serão incluídos na base após sua confirmação. Uma consulta adicional verifica dados por tempo, quando disponíveis.</p>
   <button type="button" className="text-button" disabled={busy||selected.status!=='FT'} onClick={()=>void execute(prepareImport)}>Verificar resultado para importar</button>
   {selected.status!=='FT'&&<p className="muted">Somente jogos com status FT podem ser considerados. Jogos em andamento, AET e pênaltis não entram automaticamente.</p>}
   {candidate&&<div className="auto-import-preview">
     <b>Revisão · {candidate.forecast.home} × {candidate.forecast.away}</b>
     <p>{candidate.match.date} · {candidate.match.competition} · placar {fmt(candidate.match.external?.full[0].goals??null)} × {fmt(candidate.match.external?.full[1].goals??null)}</p>
     <p>Fonte API-Football · ID {candidate.sourceId} · competição na fonte: {candidate.sourceLeague} · país: {candidate.sourceCountry}</p>
     <p>Valores disponíveis — jogo completo: {candidate.availability.full}; primeiro tempo: {candidate.availability.first}; segundo tempo: {candidate.availability.second}. Ausentes ficam N/D.</p>
     <button type="button" className="primary" disabled={busy} onClick={confirmImport}>Confirmar e adicionar à base</button>
     <button type="button" className="text-button" onClick={()=>setCandidate(null)}>Cancelar prévia</button>
   </div>}
 </section>}
 {selected&&<div className="auto-details" aria-busy={busy}><div className="auto-periods" role="group" aria-label="Período das estatísticas">{periods.map(p=><button key={p.field} aria-pressed={field===p.field} disabled={p.field!=='statistics'&&!halfStamp} onClick={()=>setField(p.field)}>{p.label}</button>)}</div><h3>{periods.find(p=>p.field===field)?.label}</h3>{field!=='statistics'&&halfNotice&&<p className="auto-empty" role="status">{halfNotice}</p>}<p className="muted">{(field==='statistics'?stamp:halfStamp)?`Consultado em ${new Date(field==='statistics'?stamp:halfStamp).toLocaleString('pt-BR')}. Cache de até uma hora.`:'Estatísticas ainda não recebidas.'} Durante jogos em andamento, o acumulado não é um resultado final.</p>{!busy||stamp?statistics():null}{!halfStamp&&<button className="text-button" disabled={busy} onClick={()=>void execute(half)}>Consultar dados por tempo</button>}<p className="muted">Só exibimos tempos explicitamente identificados pela fonte. Não dividimos nem subtraímos totais. A seleção de período não faz novas consultas.</p></div>}
 <p className="muted">N/D = não disponível ou não identificado. Prova de conceito sem pagamentos; licença comercial ainda não confirmada. Não há dados demonstrativos nesta tela.</p></div></section>;
}

import {useEffect,useState} from 'react';
import {radarRetrospective} from './radar';
import UpcomingRadar from './UpcomingRadar';
import RadarV4LabToday from './RadarV4LabToday';
import RadarBacktest from './RadarBacktest';
import RadarVenueV2 from './RadarVenueV2';
import RadarVenueV3 from './RadarVenueV3';
import WorkRadarPreview from './WorkRadarPreview';
import type {Data} from './model';
import {inspectSafetyStorage} from './safetyArchive';
import {loadResearchCatalog,type ResearchCatalog} from './researchCatalog';
import {PRIVATE_PACK_EVENT} from './privateSeasonPacks';
import {analyzeRadarDevice,type RadarDeviceReport} from './radarDevicePreflight';

const number = (n: number | null) =>
  n === null ? 'N/D' : n.toLocaleString('pt-BR', {maximumFractionDigits: 2});
const percent = (n: number | null) =>
  n === null ? 'N/D' : (n * 100).toLocaleString('pt-BR', {maximumFractionDigits: 1}) + '%';

export default function Radar({data,focus='agenda'}: {data: Data;focus?:'agenda'|'picks'|'v4'}) {
  // The two primary shortcuts share the existing Radar/Agenda engine.
  // Focus its appropriate section; all existing saved predictions stay untouched.
  useEffect(()=>{
    setMode(focus==='v4'?'v4':'new'); // V4 is a strictly isolated research view.
    const id=window.setTimeout(()=>{
      document.querySelector(focus==='v4'?'.v4-lab-today':focus==='picks'?'.daily-good-picks':'.calendar-agenda')
        ?.scrollIntoView({block:'start',behavior:'smooth'});
    },120);
    return ()=>window.clearTimeout(id);
  },[focus]);
  const [selectedLeague, setSelectedLeague] = useState('');
  const [selectedFixtureId, setSelectedFixtureId] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [mode,setMode] = useState<'new'|'saved'|'history'|'work'|'v4'>('new');
  const [savedFocus,setSavedFocus]=useState<string|null>(null);
  const [deviceCheck,setDeviceCheck]=useState<RadarDeviceReport|null>(null);
  // When this preview has no personal matches, use the read-only research
  // catalog for future-game analysis. Never write it into the user's history.
  const [historicalResearch,setHistoricalResearch]=useState<ResearchCatalog|null>(null);
  useEffect(()=>{
    const controller=new AbortController();
    const reload=()=>{void loadResearchCatalog(controller.signal).then(result=>{
      if(!controller.signal.aborted)setHistoricalResearch(result);
    }).catch(()=>{if(!controller.signal.aborted)setHistoricalResearch(null);});};
    reload();
    window.addEventListener(PRIVATE_PACK_EVENT,reload);
    return ()=>{controller.abort();window.removeEventListener(PRIVATE_PACK_EVENT,reload);};
  },[]);
  const usePublicResearch=data.matches.length===0&&historicalResearch!==null;
  const analysisData=usePublicResearch&&historicalResearch?historicalResearch.data:data;
  function checkThisDevice(){
    // No writing to storage; no network, tracking or access to OS hardware.
    let storageReadable=false,invalidStorageGroups=0;
    try{
      const inspection=inspectSafetyStorage(localStorage);
      storageReadable=true;invalidStorageGroups=inspection.invalid;
    }catch{storageReadable=false;invalidStorageGroups=1;}
    const rect=(selector:string)=>{
      const el=document.querySelector<HTMLElement>(selector);
      if(!el)return null;
      const box=el.getBoundingClientRect();
      return {width:box.width,height:box.height};
    };
    setDeviceCheck(analyzeRadarDevice({
      viewportWidth:document.documentElement.clientWidth,
      documentWidth:document.documentElement.scrollWidth,
      createButton:rect('.radar-quick-action--create'),
      savedButton:rect('.radar-quick-action--saved'),
      storageReadable,invalidStorageGroups,
      randomUUIDAvailable:typeof crypto!=='undefined'&&typeof crypto.randomUUID==='function',
      sha256Available:typeof crypto!=='undefined'&&!!crypto.subtle
    }));
  }


  const researchMatches = data.matches.filter(m => !!m.research);
  const competitions = [...new Set(researchMatches.map(m => m.competition).filter(Boolean))].sort((a,b) => a.localeCompare(b, 'pt-BR'));
  const competition = selectedLeague || competitions[0] || '';
  const fixtures = researchMatches.filter(m => m.competition === competition)
    .sort((a,b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
  const fixture = fixtures.find(m => m.id === selectedFixtureId) ?? fixtures[0];
  const homeName = data.teams.find(t => t.id === fixture?.home)?.name ?? 'Mandante';
  const awayName = data.teams.find(t => t.id === fixture?.away)?.name ?? 'Visitante';
  const snapshot = fixture ? radarRetrospective(data,fixture) : null;
  const labelFixture = (m: typeof fixture) => !m ? '' :
    m.date + ' · ' + (data.teams.find(t => t.id === m.home)?.name ?? '?') +
    ' × ' + (data.teams.find(t => t.id === m.away)?.name ?? '?');

  return <section className="panel radar-panel">
    <div className="panel-head"><div>
      <h2>Radar · Previsões e análises</h2>
      <p>Escolha uma tarefa abaixo. A nova previsão é feita antes do início do jogo.</p>
    </div></div>
    <nav className="radar-quick-nav" aria-label="Escolha o que fazer no Radar">
      <h3>Seu caminho no Radar</h3>
      <p>Encontre um confronto, confira os indicadores e registre sua previsão. Depois, recupere-a em um toque.</p>
      <div className="radar-quick-actions">
        <button type="button" className="radar-quick-action radar-quick-action--create" aria-pressed={mode==='new'}
          onClick={()=>{setSavedFocus(null);setMode('new');}}>
          <span aria-hidden="true">1</span><strong>Criar previsão para um jogo futuro</strong>
          <small>Nosso teste diário: escolha equipes, data e competição e salve V2/V3 antes do jogo.</small>
        </button>
        <button type="button" className="radar-quick-action radar-quick-action--saved" aria-pressed={mode==='saved'}
          onClick={()=>{setSavedFocus(null);setMode('saved');}}>
          <span aria-hidden="true">2</span><strong>Ver previsões já registradas</strong>
          <small>Consulte os testes já salvos, incluindo qualquer novo registro, e acompanhe os resultados.</small>
        </button>
        <button type="button" className="radar-quick-action radar-quick-action--v4"
          aria-pressed={mode==='v4'} onClick={()=>setMode('v4')}>
          <span aria-hidden="true">V4</span><strong>Analisar jogos de hoje</strong>
          <small>Laboratório experimental: linhas Over, jogo inteiro e 1º/2º tempo; sem alterar V2/V3.</small>
        </button>
      </div>
      <details className="radar-extra-modes">
        <summary>Outras análises · Histórico e Work</summary>
        <div className="radar-secondary-actions">
        <button type="button" className="radar-quick-action radar-quick-action--history" aria-pressed={mode==='history'}
          onClick={()=>setMode('history')}>
          <span aria-hidden="true">3</span><strong>Analisar jogos que já terminaram</strong>
          <small>Simulação histórica. Não registra um novo teste antes da partida.</small>
        </button>
        <button type="button" className="radar-quick-action radar-quick-action--work" aria-pressed={mode==='work'}
          onClick={()=>setMode('work')}>
          <span aria-hidden="true">4</span><strong>Radar Work · Teste com novas ligas</strong>
          <small>Analisa pesquisas Work disponíveis, separadas da base principal, sem salvar previsões.</small>
        </button>
        </div>
        <div className="radar-device-check">
          <button type="button" className="text-button"
            onClick={checkThisDevice}>Testar interface e armazenamento neste dispositivo</button>
          <p className="muted">Conferência local, somente leitura. Não salva
            previsões, não altera dados e não comprova teste Android físico.</p>
          {deviceCheck&&<section aria-label="Diagnóstico local do Radar"
            role="status" className="radar-device-check-result">
            <strong>{deviceCheck.status==='APTO_PARA_TESTE'
             ?'Diagnóstico local: APTO PARA TESTE'
             :'Diagnóstico local: REVISAR'} — {deviceCheck.passed}/{deviceCheck.total}
              {' '}verificações</strong>
            <ul>{deviceCheck.checks.map(c=><li key={c.id}>
              {c.ok?'OK':'REVISAR'} · {c.label}. {c.reason}
            </li>)}</ul>
            <p>DIAGNÓSTICO LOCAL — NÃO É TESTE FÍSICO ANDROID.
              Este resultado mostra apenas as condições medidas nesta tela.
              Não prova funcionamento offline, persistência no Android,
              precisão das previsões ou fontes externas.</p>
          </section>}
        </div>
      </details>
    </nav>
    <div className="radar-inner">
      {mode==='v4'&&<RadarV4LabToday research={historicalResearch?.data??null}/>}
      {(mode==='new'||mode==='saved')&&<UpcomingRadar data={data} analysisData={analysisData} researchMode={usePublicResearch} view={mode}
        focusedSavedKey={savedFocus}
        onViewSaved={key=>{setSavedFocus(key??null);setMode('saved');}}
        onOpenWork={()=>setMode('work')}/>}
      {mode==='work'&&<WorkRadarPreview/>}
      {mode==='history'&&<>
      <h3 id="radar-retrospective" tabIndex={-1}>3 · Analisar partidas já encerradas (simulação)</h3>
      <p className="muted">Esta área NÃO registra novos testes diários. Use o botão «Criar previsão para um jogo futuro» no topo. Modo experimental: estas partidas já aconteceram. As frequências são históricas, não probabilidades estimadas para apostas. Sem odds, sem recomendações automáticas e sem calendário futuro automático nesta versão.</p>
      {!researchMatches.length ? <div className="empty">
        Importe pesquisas CSV para habilitar a validação retrospectiva. O Radar não cria partidas fictícias na sua base.
      </div> : <>
        <div className="analysis-controls">
          <label>Competição
            <select aria-label="Liga do radar" value={competition}
              onChange={e => {setSelectedLeague(e.target.value);setSelectedFixtureId('');setShowResults(false);}}>
              {competitions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label>Confronto já concluído
            <select aria-label="Partida do radar" value={fixture?.id ?? ''}
              onChange={e => {setSelectedFixtureId(e.target.value);setShowResults(false);}}>
              {fixtures.map(m => <option value={m.id} key={m.id}>{labelFixture(m)}</option>)}
            </select>
          </label>
        </div>
        {fixture && snapshot && <>
          <RadarBacktest data={data} competition={competition}/>
          <RadarVenueV2 data={data} competition={competition}/>
          <RadarVenueV3 data={data} competition={competition}/>
        <div className="radar-context">
            <h3>{homeName} × {awayName}</h3>
            <p>{fixture.date} · {fixture.competition}</p>
            <p>Histórico considerado: {snapshot.homeHistory.length}/5 jogos de {homeName} e {snapshot.awayHistory.length}/5 de {awayName}; {snapshot.distinctHistoryCount} partidas únicas após eliminar duplicatas.</p>
            <p>Recorte de mando dentro das cinco partidas: {homeName} em casa ({snapshot.homeAtHome.count}); {awayName} fora ({snapshot.awayAtAway.count}).</p>
          </div>
          <div className="radar-venue-grid">
            {[{name:homeName, venue:'Em casa', summary:snapshot.homeAtHome},
               {name:awayName, venue:'Fora', summary:snapshot.awayAtAway}].map(item =>
              <article key={item.name} className="radar-venue">
                <h4>{item.name} · {item.venue}</h4>
                <p>{item.summary.count} jogos no recorte</p>
                <div><span>Finalizações a favor</span><strong>{number(item.summary.shotsFor.mean)}</strong></div>
                <div><span>Finalizações sofridas</span><strong>{number(item.summary.shotsAgainst.mean)}</strong></div>
                <div><span>Escanteios a favor</span><strong>{number(item.summary.cornersFor.mean)}</strong></div>
                <div><span>Escanteios sofridos</span><strong>{number(item.summary.cornersAgainst.mean)}</strong></div>
                <div><span>Gols a favor</span><strong>{number(item.summary.goalsFor.mean)}</strong></div>
              </article>
            )}
          </div>
          <div className="radar-market-table">
            <table className="analysis-table">
              <caption>Mercados ilustrativos · últimos cinco jogos de cada equipe, somente da competição selecionada</caption>
              <thead><tr><th>Indicador</th><th>Over histórico</th><th>Under histórico</th><th>Média do total</th><th>Amostra</th>{showResults&&<th>Resultado ocorrido</th>}</tr></thead>
              <tbody>{snapshot.markets.map(m => <tr key={m.id}>
                <th>{m.label}<small>Linha ilustrativa: {number(m.line)}</small></th>
                <td><b>{percent(m.historyRate)}</b><small>{m.overs}/{m.observed} jogos</small></td>
                <td><b>{percent(m.historyRate === null ? null : 1 - m.historyRate)}</b></td>
                <td>{number(m.historicalMean)}</td>
                <td>{m.observed} partidas únicas</td>
                {showResults&&<td>{m.actual === null ? 'N/D' : number(m.actual) + ' · ' + (m.didOver ? 'Over' : 'Under')}</td>}
              </tr>)}</tbody>
            </table>
          </div>
          <div className="radar-market-cards" aria-label="Mercados por cartão">
            <p className="muted">Mercados ilustrativos · últimos cinco jogos de cada equipe</p>
            {snapshot.markets.map(m => <article className="radar-market-card" key={m.id}>
              <h4>{m.label}</h4>
              <p>Linha ilustrativa: {number(m.line)} · {m.observed} partidas únicas</p>
              <dl>
                <div><dt>Over histórico</dt><dd>{percent(m.historyRate)} <small>({m.overs}/{m.observed})</small></dd></div>
                <div><dt>Under histórico</dt><dd>{percent(m.historyRate===null?null:1-m.historyRate)}</dd></div>
                <div><dt>Média do total</dt><dd>{number(m.historicalMean)}</dd></div>
                {showResults&&<div className="radar-actual"><dt>Resultado ocorrido</dt><dd>{m.actual===null?'N/D':number(m.actual)+' · '+(m.didOver?'Over':'Under')}</dd></div>}
              </dl>
            </article>)}
          </div>
          <p className="muted">As amostras são pequenas e podem compartilhar partidas entre os dois históricos. A taxa Over/Under é apenas a frequência observada nesses registros, não a chance calculada de acertar uma aposta. As linhas são exemplos, não odds nem mercados confirmados de casas de apostas.</p>
          <button type="button" className="primary" onClick={()=>setShowResults(v=>!v)}>
            {showResults?'Ocultar resultados ocorridos':'Revelar resultados para comparar'}
          </button>
          <p className="muted">Fonte: <a href={fixture.research?.sourceUrl} target="_blank" rel="noopener noreferrer">pesquisa CSV · verificar jogo no Flashscore</a>. Dados locais, sem acesso automático ao site.</p>
        </>}
      </>}
      </>}
    </div>
  </section>;
}

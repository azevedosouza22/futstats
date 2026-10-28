import {useEffect,useState} from 'react';
import type {Data,Period} from './model';
import {brasiliaDate} from './calendar';
import {competitionParts} from './leagueCatalog';
import {FOUR_LENS_LINES,FOUR_LENS_METRICS,type FourLensMetric} from './radarFourLenses';
import {
 availableSmartLeagues,smartLeagueOptions,calculateSmartLeagueComparison,BOTH_SEASONS
} from './leagueSmartComparison';
import {demoFourContextData} from './radarFourLensesDemo';
import {loadResearchCatalog,type ResearchCatalog} from './researchCatalog';
import SmartComparisonCards from './SmartComparisonCards';
import TeamOnlyCards from './TeamOnlyCards';

const fmt=(n:number|null)=>n===null?'N/D':n.toLocaleString('pt-BR',{maximumFractionDigits:1});
const freq=(n:number,total:number)=>total
 ?`${n}/${total} (${(100*n/total).toLocaleString('pt-BR',{maximumFractionDigits:0})}%)`
 :'N/D';
const metricLabel=(id:FourLensMetric)=>FOUR_LENS_METRICS.find(m=>m.id===id)?.label??id;

/** Searchable comparison page, reusing the experimental four-context engine.
 * Never touches original matches, saved Radar records or browser storage.
 */
export default function LeagueSmartComparison({data}:{data:Data}){
 const [mode,setMode]=useState<'research'|'device'|'demo'>('research');
 const [catalog,setCatalog]=useState<ResearchCatalog|null>(null);
 const [catalogError,setCatalogError]=useState('');
 const [loading,setLoading]=useState(true);
 useEffect(()=>{
   const controller=new AbortController();
   void loadResearchCatalog(controller.signal).then(result=>{
     if(controller.signal.aborted)return;
     setCatalog(result);setCatalogError('');setLoading(false);
   }).catch(e=>{
     if(controller.signal.aborted)return;
     setCatalogError(e instanceof Error?e.message:'Base de pesquisa indisponível.');
     setLoading(false);
   });
   return ()=>controller.abort();
 },[]);
 const [league,setLeague]=useState('');
 const [season,setSeason]=useState<string>(BOTH_SEASONS);
 const [homeId,setHomeId]=useState('');
 const [awayId,setAwayId]=useState('');
 const [metric,setMetric]=useState<FourLensMetric>('shots');
 const [period,setPeriod]=useState<Period>('full');
 const [lineDraft,setLineDraft]=useState('24,5');
 const line=Number(lineDraft.trim().replace(',','.'));
 const validLine=Number.isFinite(line)&&line>=0.5&&line<=999.5&&
   Number.isInteger(line-0.5);

 const useDemo=mode==='demo';
 const active:Data=useDemo?demoFourContextData:
   mode==='device'?data:catalog?.data??{teams:[],matches:[]};
 const leagues=availableSmartLeagues(active);
 const chosenLeague=leagues.includes(league)?league:(leagues[0]??'');
 const options=smartLeagueOptions(active,chosenLeague);
 const chosenSeason=season===BOTH_SEASONS||[...options.seasons,...options.archivedSeasons].includes(season)
   ?season:BOTH_SEASONS;
 const preferred=useDemo?'hoffenheim':'';
 const preferredAway=useDemo?'schalke':'';
 const home=options.teams.find(t=>t.id===homeId)
   ??options.teams.find(t=>t.name.toLocaleLowerCase('pt-BR').includes(preferred)&&!!preferred)
   ??options.teams[0];
 const away=options.teams.find(t=>t.id===awayId&&t.key!==home?.key)
   ??options.teams.find(t=>t.key!==home?.key&&
     !!preferredAway&&t.name.toLocaleLowerCase('pt-BR').includes(preferredAway))
   ??options.teams.find(t=>t.key!==home?.key);
 const chosenDate=brasiliaDate().date;
 const calculated=home&&away&&validLine?calculateSmartLeagueComparison(active,{
   league:chosenLeague,season:chosenSeason,home:home.id,away:away.id,
   date:chosenDate,metric,period,line
 }):null;
 const report=calculated?.report;
const seasonTitle=options.seasons.map((s,i)=>s+(i===0?' (atual)':' (anterior)'));
 return <section className="radar-line-explorer" aria-label="Comparação inteligente por liga e temporada">
  <h2>Comparação Inteligente · por liga</h2>
  <p>Escolha campeonato, temporada e equipes. Compare as médias individuais
   por tempo e as finalizações, gols ou escanteios somados do confronto.</p>
  <details className="smart-advanced smart-source-settings">
    <summary>Fonte dos dados · {mode==='research'?'Pesquisa de '+(catalog?.total??'1.019')+' jogos':mode==='device'?'Dados deste navegador':'Exemplo fictício'}</summary>
  <div className="analysis-controls">
    <label>Base de dados para comparar
      <select aria-label="Fonte de dados da comparação inteligente" value={mode}
        onChange={e=>{
          setMode(e.target.value as 'research'|'device'|'demo');
          setLeague('');setSeason(BOTH_SEASONS);
          setHomeId('');setAwayId('');
        }}>
        <option value="research">Pesquisa histórica real · {catalog?.total??'1.019'} partidas</option>
        <option value="device">Base do dispositivo · somente leitura</option>
        <option value="demo">Demonstração fictícia</option>
      </select>
    </label>
  </div>
  {mode==='research'&&loading&&<p className="muted" role="status">
    Carregando pesquisa histórica, sem importação para o dispositivo…
  </p>}
  {mode==='research'&&!loading&&catalogError&&<p className="alert" role="alert">
    Não foi possível abrir a pesquisa: {catalogError}. Nada foi alterado.
    Selecione a base do dispositivo ou a demonstração para continuar.
  </p>}
  {mode==='research'&&catalog&&<p className="muted" role="status">
    <strong>{catalog.total} partidas reais de pesquisa carregadas</strong> ·
    {' '}{catalog.leagues.length} edições de liga em {new Set(catalog.leagues.map(
      l=>competitionParts(l.competition).league
    )).size} campeonatos · {catalog.dateConflicts} registros com datas divergentes,
    identificados e excluídos dos cálculos. Somente leitura, separado do backup.
  </p>}
  {mode==='device'&&<p className="muted" role="status">
    {data.matches.length} partidas presentes neste navegador. Não são copiadas,
    substituídas ou mescladas com a base de pesquisa.
  </p>}
  {useDemo&&<p className="alert" role="status">
    <strong>MODO DEMONSTRAÇÃO — DADOS FICTÍCIOS.</strong>
    {' '}A tabela utiliza partidas criadas apenas na memória para apresentar o
    funcionamento. Nenhuma partida é adicionada ao histórico.
    {' '}Os números são simulados; nenhuma partida é salva.
  </p>}
  </details>
  <div className="analysis-controls smart-main-filters">
    <label>Campeonato
      <select aria-label="Campeonato da comparação inteligente" value={chosenLeague}
        onChange={e=>{setLeague(e.target.value);setSeason(BOTH_SEASONS);
          setHomeId('');setAwayId('');}}>
        {leagues.map(l=><option key={l} value={l}>{l}</option>)}
      </select>
    </label>
    <label>Temporada
      <select aria-label="Temporada da comparação inteligente" value={chosenSeason}
        onChange={e=>setSeason(e.target.value)}>
        <option value={BOTH_SEASONS}>Atual + anterior</option>
        {options.seasons.map((s,i)=><option key={s} value={s}>
          {s} · {i===0?'Atual':'Anterior'}
        </option>)}
        {options.archivedSeasons.map(s=><option key={s} value={s}>
          {s} · Arquivo histórico
        </option>)}
      </select>
    </label>
   <label>Time em casa (mandante)
      <select aria-label="Time mandante da comparação inteligente" value={home?.id??''}
        onChange={e=>setHomeId(e.target.value)}>
        {options.teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
    </label>
    <label>Adversário (visitante)
      <select aria-label="Time visitante da comparação inteligente" value={away?.id??''}
        onChange={e=>setAwayId(e.target.value)}>
        {options.teams.filter(t=>t.key!==home?.key).map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
    </label>
    <label>Indicador
      <select aria-label="Indicador da comparação inteligente" value={metric}
        onChange={e=>{const next=e.target.value as FourLensMetric;
          setMetric(next);setLineDraft(String(FOUR_LENS_LINES[next][2]).replace('.',','));}}>
        {FOUR_LENS_METRICS.map(m=><option key={m.id} value={m.id}>{m.label}</option>)}
      </select>
    </label>
  </div>
  <details className="smart-advanced smart-total-settings">
    <summary>Opções do total da partida · {period==='full'?'jogo completo':period==='first'?'1º tempo':'2º tempo'} · linha {fmt(line)}</summary>
  <div className="analysis-controls">
    <label>Período
      <select aria-label="Período da comparação inteligente" value={period}
        onChange={e=>setPeriod(e.target.value as Period)}>
        <option value="full">Jogo completo</option>
        <option value="first">Primeiro tempo</option>
        <option value="second">Segundo tempo</option>
      </select>
    </label>
    <label>Linha Over/Under · total dos dois times
      <input type="text" inputMode="decimal" aria-label="Linha da comparação inteligente"
        placeholder="Ex.: 21,5" value={lineDraft} onChange={e=>setLineDraft(e.target.value)}/>
      <small>Digite qualquer linha terminada em ,5. Ex.: 18,5 · 21,5 · 29,5.</small>
    </label>
  </div>
  </details>
  {!validLine&&<p className="alert" role="alert">
    Informe uma linha positiva terminada em ,5 para analisar o Over e o Under.
  </p>}
  <p className="smart-selection-note" role="status">
    {chosenSeason===BOTH_SEASONS?'Temporadas disponíveis: '+seasonTitle.join(' e '):'Temporada: '+chosenSeason}
    {' '}· Jogos anteriores a {chosenDate}.
  </p>
  {report&&home&&away?<section aria-label="Tabela comparativa de quatro contextos">
    <div className="smart-summary-bar smart-results-context">
      <span>{home.name} × {away.name}</span>
      <strong>{metricLabel(metric)}</strong>
      <small>{chosenSeason===BOTH_SEASONS?'Temporada atual + anterior':chosenSeason}</small>
    </div>
    {calculated?.teamOnly&&<TeamOnlyCards report={calculated.teamOnly} home={home.name} away={away.name}/>}
    <details className="smart-total-collapsible">
      <summary>Ver total da partida · Over/Under {fmt(line)}</summary>
      <p>Aqui somamos as ações dos dois times, em vez de analisar cada um separadamente.</p>
      <div className="smart-match-totals-intro">
        <span className="smart-kicker">TOTAL DO CONFRONTO</span>
        <h3>Somatório dos dois times</h3>
        <p>{period==='full'?'Jogo inteiro':period==='first'?'1º tempo':'2º tempo'} · Linha {fmt(line)}</p>
      </div>
      {report.projection!==null&&<button className="smart-suggest-line" type="button"
        onClick={()=>setLineDraft(String(Math.max(0.5,Math.floor(report.projection!)+0.5)).replace('.',','))}>
        Usar linha próxima da média histórica: {fmt(Math.max(0.5,Math.floor(report.projection)+0.5))}
      </button>}
      <SmartComparisonCards report={report} home={home.name} away={away.name}/>
      <details className="smart-legacy-table">
      <summary>Ver tabela numérica completa</summary>
    <div className="radar-line-table-scroll">
      <table className="analysis-table">
        <caption>Comparação por mando e confrontos diretos — totais das duas equipes, não só do time escolhido</caption>
        <thead><tr>
          <th>Contexto</th><th>Média últimos 10</th><th>Over últimos 5</th>
          <th>Under últimos 5</th><th>Over últimos 10</th><th>Under últimos 10</th>
        </tr></thead>
        <tbody>
          {report.lenses.map(lens=><tr key={lens.id}>
            <th>{lens.id==='home-any'?home.name+' · em casa / qualquer rival'
              :lens.id==='away-any'?away.name+' · fora / qualquer rival'
              :lens.id==='home-direct'?home.name+' · em casa × '+away.name
              :away.name+' · fora × '+home.name+' (mesmos confrontos)'}</th>
            <td>{fmt(lens.last10.mean)} <small>({lens.last10.count} jogos)</small></td>
            <td>{freq(lens.last5.over,lens.last5.count)}</td>
            <td>{freq(lens.last5.under,lens.last5.count)}</td>
            <td>{freq(lens.last10.over,lens.last10.count)}</td>
            <td>{freq(lens.last10.under,lens.last10.count)}</td>
          </tr>)}
        </tbody>
      </table>
    </div></details>
    </details>
  </section>:<p className="muted">
    {validLine?(calculated?.status??'Escolha duas equipes diferentes para montar a comparação.'):'Altere a linha para um valor terminado em ,5.'}
  </p>}
  <details className="smart-method-notes">
    <summary>Como interpretar essas médias?</summary>
    <p>As médias individuais mostram apenas o que a equipe produziu.
      A seção de totais soma as duas equipes. Confrontos diretos também fazem parte
      dos históricos gerais e não contam como evidências independentes.
      Frequências passadas não são probabilidades futuras ou garantias de apostas.</p>
    <p>Somente leitura: nenhuma previsão, backup ou partida é alterada.</p>
  </details>
 </section>;
}

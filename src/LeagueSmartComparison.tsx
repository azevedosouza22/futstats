import {useState} from 'react';
import type {Data,Period} from './model';
import {brasiliaDate} from './calendar';
import {FOUR_LENS_LINES,FOUR_LENS_METRICS,type FourLensMetric} from './radarFourLenses';
import {
 availableSmartLeagues,smartLeagueOptions,calculateSmartLeagueComparison,BOTH_SEASONS
} from './leagueSmartComparison';
import {demoFourContextData} from './radarFourLensesDemo';

const fmt=(n:number|null)=>n===null?'N/D':n.toLocaleString('pt-BR',{maximumFractionDigits:1});
const freq=(n:number,total:number)=>total
 ?`${n}/${total} (${(100*n/total).toLocaleString('pt-BR',{maximumFractionDigits:0})}%)`
 :'N/D';
const metricLabel=(id:FourLensMetric)=>FOUR_LENS_METRICS.find(m=>m.id===id)?.label??id;

/** Searchable comparison page, reusing the experimental four-context engine.
 * Never touches original matches, saved Radar records or browser storage.
 */
export default function LeagueSmartComparison({data}:{data:Data}){
 const [demo,setDemo]=useState(false);
 const [league,setLeague]=useState('');
 const [season,setSeason]=useState<string>(BOTH_SEASONS);
 const [homeId,setHomeId]=useState('');
 const [awayId,setAwayId]=useState('');
 const [search,setSearch]=useState('');
 const [metric,setMetric]=useState<FourLensMetric>('shots');
 const [period,setPeriod]=useState<Period>('full');
 const [line,setLine]=useState(24.5);
 const localLeagues=availableSmartLeagues(data);
 const useDemo=demo||localLeagues.length===0;
 const active=useDemo?demoFourContextData:data;
 const leagues=availableSmartLeagues(active);
 const chosenLeague=leagues.includes(league)?league:(leagues[0]??'');
 const options=smartLeagueOptions(active,chosenLeague);
 const chosenSeason=season===BOTH_SEASONS||options.seasons.includes(season)
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
 const calculated=home&&away?calculateSmartLeagueComparison(active,{
   league:chosenLeague,season:chosenSeason,home:home.id,away:away.id,
   date:chosenDate,metric,period,line
 }):null;
 const report=calculated?.report;
 const filtered=options.teams.filter(t=>
   t.name.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR'))||
   t.id===home?.id||t.id===away?.id);
 const seasonTitle=options.seasons.map((s,i)=>s+(i===0?' (atual)':' (anterior)'));
 return <section className="radar-line-explorer" aria-label="Comparação inteligente por liga e temporada">
  <h2>Comparação Inteligente · por liga</h2>
  <p>Pesquise qualquer confronto da base: mandante em casa, visitante fora e
   confrontos diretos. Médias dos <b>totais das duas equipes</b> e frequência das linhas
   nos últimos 5 e 10 jogos.</p>
  {localLeagues.length>0?<div>
    <button type="button" className="text-button" onClick={()=>{
      setDemo(v=>!v);setLeague('');setSeason(BOTH_SEASONS);
      setHomeId('');setAwayId('');setSearch('');
    }}>{demo?'Voltar aos dados reais deste dispositivo':'Ver exemplo fictício sem alterar minha base'}</button>
  </div>:null}
  {useDemo&&<p className="alert" role="status">
    <strong>MODO DEMONSTRAÇÃO — DADOS FICTÍCIOS.</strong>
    {' '}A tabela utiliza partidas criadas apenas na memória para apresentar o
    funcionamento. Nenhuma partida é adicionada ao histórico.
    {localLeagues.length===0?' Nesta prévia ainda não existem temporadas cadastradas.':''}
  </p>}
  <div className="analysis-controls">
    <label>Campeonato
      <select aria-label="Campeonato da comparação inteligente" value={chosenLeague}
        onChange={e=>{setLeague(e.target.value);setSeason(BOTH_SEASONS);
          setHomeId('');setAwayId('');setSearch('');}}>
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
      </select>
    </label>
    <label>Buscar equipe pelo nome
      <input type="search" aria-label="Buscar time na comparação inteligente"
        placeholder="Digite o nome do time" value={search} onChange={e=>setSearch(e.target.value)}/>
    </label>
    <label>Time em casa (mandante)
      <select aria-label="Time mandante da comparação inteligente" value={home?.id??''}
        onChange={e=>setHomeId(e.target.value)}>
        {filtered.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
    </label>
    <label>Adversário (visitante)
      <select aria-label="Time visitante da comparação inteligente" value={away?.id??''}
        onChange={e=>setAwayId(e.target.value)}>
        {filtered.filter(t=>t.key!==home?.key).map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
    </label>
    <label>Indicador
      <select aria-label="Indicador da comparação inteligente" value={metric}
        onChange={e=>{const next=e.target.value as FourLensMetric;
          setMetric(next);setLine(FOUR_LENS_LINES[next][2]);}}>
        {FOUR_LENS_METRICS.map(m=><option key={m.id} value={m.id}>{m.label}</option>)}
      </select>
    </label>
    <label>Período
      <select aria-label="Período da comparação inteligente" value={period}
        onChange={e=>setPeriod(e.target.value as Period)}>
        <option value="full">Jogo completo</option>
        <option value="first">Primeiro tempo</option>
        <option value="second">Segundo tempo</option>
      </select>
    </label>
    <label>Linha Over/Under
      <select aria-label="Linha da comparação inteligente" value={line}
        onChange={e=>setLine(Number(e.target.value))}>
        {FOUR_LENS_LINES[metric].map(n=><option key={n} value={n}>{fmt(n)}</option>)}
      </select>
    </label>
  </div>
  <p className="muted" role="status">
    Temporadas disponíveis: {seasonTitle.join(' e ')||'N/D'}.
    {' '}Partidas na seleção: {calculated?.matchCount??0}.
    {' '}Corte histórico: somente jogos anteriores a {chosenDate}.
    {' '}Dados provenientes exclusivamente {useDemo?'da demonstração fictícia':'da base local deste navegador'}.
  </p>
  {report&&home&&away?<section aria-label="Tabela comparativa de quatro contextos">
    <h3>{home.name} × {away.name}</h3>
    <p><b>{metricLabel(metric)}</b> · linha {fmt(line)} ·
      {' '}{period==='full'?'partida inteira':period==='first'?'1º tempo':'2º tempo'}
      {' '}· {chosenSeason===BOTH_SEASONS?'duas temporadas':chosenSeason}</p>
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
    </div>
    <p className="muted" role="status">
      Leitura conjunta dos mandos: <b>{report.historicalDirection}</b>.
      {' '}{report.reason} Média descritiva de ambos os mandos: {fmt(report.projection)}.
    </p>
  </section>:<p className="muted">
    {calculated?.status??'Escolha duas equipes diferentes para montar a comparação.'}
  </p>}
  <p className="muted">
    Os dois recortes diretos repetem os mesmos jogos e também podem aparecer nos recortes gerais.
    Não devem ser somados como quatro votos diferentes.
    Frequências históricas não são probabilidades futuras nem recomendações de aposta.
    Sem importação automática, sem alteração de Radar V2/V3 ou As Boas do Dia.
  </p>
 </section>;
}

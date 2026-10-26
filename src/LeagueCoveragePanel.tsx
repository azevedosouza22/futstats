import {useState} from 'react';
import type {Data} from './model';
import type {WorkAnalysisMatch} from './workAnalysis';
import {brasiliaDate} from './calendar';
import StatGapQueue from './StatGapQueue';
import MainWorkSourceReview from './MainWorkSourceReview';
import {
  auditMainLeagueCoverage,auditWorkLeagueCoverage,COVERAGE_METRICS,
  type CoverageRow,type CoverageMetric
} from './leagueCoverageAudit';

const metricLabels:Record<CoverageMetric,string>={
  goals:'Gols',shots:'Finalizações',target:'Chutes no gol',corners:'Escanteios'
};
function CoverageLeague({row}:{row:CoverageRow}){
  const missingCorners=row.eligible-row.counts.corners.full;
  return <article className="league-coverage-league">
    <header>
      <strong>{row.competition}</strong>
      <small>{row.eligible} jogos considerados · {row.completeAll} completos nos 4 indicadores e 3 períodos</small>
    </header>
    <div className="league-coverage-metrics">
      {COVERAGE_METRICS.map(metric=><div key={metric}
        className={'league-coverage-metric '+(metric==='corners'?'league-coverage-corners':'')}>
        <b>{metricLabels[metric]}</b>
        <span>Jogo completo: {row.counts[metric].full}/{row.eligible}</span>
        <span>1º tempo: {row.counts[metric].first}/{row.eligible}</span>
        <span>2º tempo: {row.counts[metric].second}/{row.eligible}</span>
      </div>)}
    </div>
    {row.source==='main'&&missingCorners>0&&<p className="league-coverage-warning">
      Faltam escanteios completos em {missingCorners} {missingCorners===1?'partida':'partidas'} já cadastradas.
    </p>}
    {(row.review>0||row.duplicates>0)&&<p className="muted">
      {row.review} {row.review===1?'registro':'registros'} para revisão ·
      {' '}{row.duplicates} duplicata(s) ignorada(s) por ID.
    </p>}
    {row.cornerGaps.length>0&&<details>
      <summary>Ver exemplos de jogos sem escanteios ({row.cornerGaps.length} exibidos)</summary>
      <ul>{row.cornerGaps.map(g=><li key={g.id}>
        {g.date} · {g.label} · ID {g.id}
      </li>)}</ul>
    </details>}
  </article>;
}
export default function LeagueCoveragePanel({data,workMatches,workError=false}:{
  data:Data;
  workMatches:readonly WorkAnalysisMatch[]|null;
  workError?:boolean;
}){
  const [expanded,setExpanded]=useState(false);
  const today=brasiliaDate().date;
  // Pure computations are delayed until the user opens diagnostics on mobile.
  const main=expanded?auditMainLeagueCoverage(data,today):[];
  const work=expanded&&workMatches?auditWorkLeagueCoverage(workMatches,today):[];
  const mainCount=main.reduce((n,row)=>n+row.eligible,0);
  const workCount=work.reduce((n,row)=>n+row.eligible,0);
  return <details className="league-coverage-panel" open={expanded}
    onToggle={e=>setExpanded(e.currentTarget.open)}>
    <summary>Diagnóstico de cobertura · campeonatos e escanteios</summary>
    {expanded&&<>
      <p className="muted">Somente jogos já cadastrados e anteriores a {today} (Brasília).
        {' '}A contagem não representa todos os jogos realizados na competição.
        N/D não é zero. Nenhuma informação será importada ou modificada.
      </p>
      <h4>Histórico principal · {mainCount} registros utilizáveis</h4>
      {main.length===0?<p className="muted">Nenhuma partida anterior disponível.</p>
        :<div className="league-coverage-list">
          {main.map(row=><CoverageLeague key={row.competition} row={row}/>)}
        </div>}
      <h4>Pesquisa Work · base local separada</h4>
      {workError?<p className="muted">Dados Work inválidos ou indisponíveis neste navegador. Nada foi alterado.</p>
        :workMatches===null?<p className="muted">Não foi possível consultar a base local Work.</p>
        :work.length===0?<p className="muted">Nenhum jogo Work anterior cadastrado neste navegador.</p>
        :<>
          <p className="muted">{workCount} jogos Work utilizáveis, sem mistura com o Histórico principal.</p>
          <div className="league-coverage-list">
            {work.map(row=><CoverageLeague key={row.competition} row={row}/>)}
          </div>
        </>}
      {workMatches!==null&&!workError&&<MainWorkSourceReview
        data={data} work={workMatches} today={today}/>}
      <StatGapQueue data={data} workMatches={workMatches} today={today}/>
      <p className="muted">As pendências mostram o que falta nos registros disponíveis.
        Para ampliar a cobertura real ainda precisamos encontrar e validar novos jogos em fontes confiáveis.
      </p>
    </>}
  </details>;
}

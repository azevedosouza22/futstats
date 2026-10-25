import type {RadarDailyOverview,DailyIndicator} from './radarDailyOverview';
import type {WorkFixtureCoverage} from './workFixtureCoverage';

const fmt=(value:number|null)=>value===null?'N/D':value.toLocaleString('pt-BR',{maximumFractionDigits:1});

function Indicator({metric}:{metric:DailyIndicator}){
  return <div className="radar-daily-metric">
    <div className="radar-daily-metric-title"><strong>{metric.name}</strong><span>Linha +{fmt(metric.line)}</span></div>
    <div className="radar-daily-values">
      <span>Média equipes <b>{fmt(metric.historicalMean)}</b><small>{metric.historicalSample} jogos</small></span>
      <span>Média liga <b>{fmt(metric.leagueMean)}</b><small>{metric.leagueSample} jogos</small></span>
    </div>
    {metric.v2!==null&&<div className="radar-daily-models">
      <span>Projeção V2: <strong>{fmt(metric.projectedTotal)}</strong></span>
      <span>V2: <b>{metric.v2}</b> · V3: <b>{metric.v3}</b></span>
    </div>}
    {metric.v2===null&&<p className="radar-daily-no-signal">Sem projeção V2/V3 para este indicador</p>}
  </div>;
}

/**
 * Daily overview is read-only. Forecast saving remains in the Radar form,
 * which requires a future date/time and explicit confirmation.
 */
export default function RadarDailyCard({overview,workCoverage,onOpenWork}:{
  overview:RadarDailyOverview|null;
  workCoverage?:WorkFixtureCoverage|null;
  onOpenWork?:()=>void;
}){
  const localWork=workCoverage&&workCoverage.uniqueGames>0?workCoverage:null;
  if(!overview&&!localWork)
    return <p className="radar-daily-empty">Estatísticas indisponíveis no Histórico principal para este confronto. Nenhuma previsão foi criada.</p>;
  const metricsAvailable=overview?.indicators.filter(m=>m.historicalSample>0).length??0;
  const workComplete=localWork?Object.values(localWork.metricGames).filter(n=>n>0).length:0;
  return <section className="radar-daily-summary" aria-label="Cobertura estatística do confronto">
    {overview?<>
      <p className="radar-daily-sample">
        <b>Histórico principal:</b> {metricsAvailable}/4 indicadores com amostra anterior ao jogo;
        {' '}{overview.homeCount}/5 partidas do mandante e {overview.awayCount}/5 do visitante.
      </p>
      <div className="radar-daily-metrics">
        {overview.indicators.map(m=><Indicator key={m.id} metric={m}/>)}
      </div>
    </>:<p className="radar-daily-sample">
      <b>Histórico principal:</b> N/D. Não há duas equipes identificadas
      nesta competição/temporada. Nenhuma previsão principal foi calculada.
    </p>}
    {localWork&&<div className="radar-work-coverage">
      <div><b>Pesquisa Work local · base separada</b>
        <span>{workComplete}/4 indicadores com dados; {localWork.uniqueGames} partidas anteriores únicas.</span>
      </div>
      <p>Mandante: {localWork.homeCount}/5 · Visitante: {localWork.awayCount}/5.
        {' '}Gols: {localWork.metricGames.goals} · Finalizações: {localWork.metricGames.shots}
        {' '}· Chutes no gol: {localWork.metricGames.target} · Escanteios: {localWork.metricGames.corners}.
      </p>
      {!localWork.bothTeamsHaveHistory&&<p>
        Ainda faltam jogos anteriores para uma das equipes. Não apresentar como previsão válida.
      </p>}
      {onOpenWork&&<button type="button" className="text-button" onClick={onOpenWork}>
        Consultar Radar Work
      </button>}
      <small>Esses dados não foram somados ao Histórico principal e não criam sinais ou previsões automaticamente.</small>
    </div>}
    <p className="radar-daily-caution">
      Médias históricas não são probabilidades garantidas. Os sinais V2/V3 continuam experimentais.
      Confira fonte, data e horário antes de registrar.
    </p>
  </section>;
}

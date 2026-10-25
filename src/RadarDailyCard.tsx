import type {RadarDailyOverview,DailyIndicator} from './radarDailyOverview';

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
export default function RadarDailyCard({overview}:{
  overview:RadarDailyOverview|null
}){
  if(!overview)return <p className="radar-daily-empty">Estatísticas indisponíveis para esta competição ou identificação das equipes. Nenhuma previsão foi criada.</p>;
  return <section className="radar-daily-summary" aria-label="Resumo estatístico do confronto">
    <p className="radar-daily-sample">Base anterior ao jogo: {overview.homeCount}/5 partidas do mandante e {overview.awayCount}/5 do visitante</p>
    <div className="radar-daily-metrics">
      {overview.indicators.map(m=><Indicator key={m.id} metric={m}/>)}
    </div>
    <p className="radar-daily-caution">
      Médias e frequências são históricas, não probabilidades garantidas. Os sinais V2/V3 continuam experimentais. Confira a fonte e o horário antes de registrar.
    </p>
  </section>;
}

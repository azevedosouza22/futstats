import {useState} from 'react';
import {PERIOD_LINE_LABELS,MIN_PERIOD_LINE_SAMPLE,type PeriodLineComparison}
 from './radarPeriodLineComparison';
import {COVERAGE_METRICS,COVERAGE_PERIODS,type CoverageMetric,type CoveragePeriod}
 from './leagueCoverageAudit';
const fmt=(n:number|null):string=>n===null?'N/D':n.toLocaleString('pt-BR',{maximumFractionDigits:2});
const pct=(n:number|null):string=>n===null?'N/D':(n*100).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%';
export default function RadarPeriodLineComparePanel({report}:{report:PeriodLineComparison}){
 const [metric,setMetric]=useState<CoverageMetric>('corners');
 const [period,setPeriod]=useState<CoveragePeriod>('full');
 const selected=report.groups.find(g=>g.metric===metric&&g.period===period);
 if(!selected)return null;
 return <details className="radar-period-line-comparison"
  aria-label="Comparar Over e Under por tempo">
  <summary>Comparar Over e Under · jogo e tempos (histórico)</summary>
  <p className="muted">Frequência dos <strong>totais das duas equipes</strong>
    por partida. Últimos cinco jogos anteriores de cada time na mesma
    competição e temporada; partidas repetidas contam uma só vez.
    As linhas são <strong>ilustrativas</strong>, não odds nem recomendações.</p>
  <div className="radar-period-line-filters">
    <label>Indicador
      <select aria-label="Indicador Over e Under" value={metric}
       onChange={e=>setMetric(e.currentTarget.value as CoverageMetric)}>
       {COVERAGE_METRICS.map(m=><option key={m} value={m}>
        {report.groups.find(g=>g.metric===m)?.label??m}</option>)}
      </select>
    </label>
    <label>Período
      <select aria-label="Período Over e Under" value={period}
       onChange={e=>setPeriod(e.currentTarget.value as CoveragePeriod)}>
       {COVERAGE_PERIODS.map(p=><option key={p} value={p}>
        {PERIOD_LINE_LABELS[p]}</option>)}
      </select>
    </label>
  </div>
  <p className="muted" role="status">
    {selected.label} · {PERIOD_LINE_LABELS[selected.period]} ·
    {' '}{selected.observed}/{selected.distinct} jogos com dados válidos ·
    {' '}{selected.missing} N/D · {selected.conflicts} inconsistentes ·
    média <strong>{fmt(selected.mean)}</strong>
  </p>
  {!selected.isAdequateSample&&<p role="note" className="muted">
    Amostra insuficiente para exibir percentuais: mínimo de
    {' '}{MIN_PERIOD_LINE_SAMPLE} partidas válidas neste indicador e período.
    Frequências percentuais: <strong>N/D</strong>.
  </p>}
  <div className="radar-period-line-scroll">
   <table className="analysis-table">
    <caption>Contagens históricas Over e Under · {PERIOD_LINE_LABELS[period]}</caption>
    <thead><tr><th>Linha ilustrativa</th><th>Over</th><th>Under</th>
      <th>% Over</th><th>% Under</th></tr></thead>
    <tbody>{selected.lines.map(line=><tr key={line.line}>
      <th scope="row">{fmt(line.line)}</th>
      <td>{selected.observed?line.over+'/'+selected.observed:'N/D'}</td>
      <td>{selected.observed?line.under+'/'+selected.observed:'N/D'}</td>
      <td>{pct(line.overShare)}</td><td>{pct(line.underShare)}</td>
    </tr>)}</tbody>
   </table>
  </div>
  <p className="muted">O que falta no CSV permanece N/D, nunca zero.
    Se a soma dos períodos difere do jogo completo para qualquer equipe,
    excluímos apenas aquele indicador da partida. Percentuais de jogos
    históricos <strong>não são probabilidades de acerto</strong>.
    A tabela não modifica nem acrescenta sinais V2/V3 ou previsões salvas.</p>
 </details>;
}

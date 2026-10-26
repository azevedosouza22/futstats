import type {RadarPeriodCoverage,RadarPeriodCell} from './radarPeriodCoverage';
import {COVERAGE_METRICS,COVERAGE_PERIODS} from './radarPeriodCoverage';

const format=(cell:RadarPeriodCell)=>
 cell.mean===null?'N/D':cell.mean.toLocaleString('pt-BR',{maximumFractionDigits:2});
const periodLabels={full:'Jogo completo',first:'1º tempo',second:'2º tempo'};
export default function RadarPeriodCoveragePanel({report}:{report:RadarPeriodCoverage}){
 return <details className="radar-period-coverage"
  aria-label="Conferência de indicadores por período">
  <summary>Conferir 4 indicadores por período ·
    {' '}{report.completeAll}/{report.distinct} jogos completos</summary>
  <p className="muted">Médias de totais das duas equipes por jogo (não são
    previsões). Amostra: até cinco jogos anteriores de cada equipe na
    <strong> mesma competição e temporada</strong>. Repetições por ID
    não contam duas vezes. Não misturamos a partida selecionada nem
    jogos posteriores.</p>
  <div className="radar-period-table-scroll">
   <table className="analysis-table">
    <caption>Jogo completo, 1º e 2º tempos · valores disponíveis no Histórico</caption>
    <thead><tr><th>Indicador</th>{COVERAGE_PERIODS.map(period=>
      <th key={period}>{periodLabels[period]}</th>)}</tr></thead>
    <tbody>{COVERAGE_METRICS.map(metric=>{
      const row=report.rows.find(r=>r.metric===metric)!;
      return <tr key={metric}><th scope="row">{row.label}</th>
       {COVERAGE_PERIODS.map(period=>{
        const cell=row.cells[period];
        return <td key={period}>
         <strong>{format(cell)}</strong>
         <small>{cell.valid}/{report.distinct} jogos válidos</small>
         {(cell.missing>0||cell.conflicts>0)&&
           <small>{cell.missing} N/D · {cell.conflicts} inconsistente(s)</small>}
        </td>;
       })}
      </tr>;
    })}</tbody>
   </table>
  </div>
  <p className="muted" role="note">N/D significa dado indisponível, nunca zero.
    Zero só aparece quando está registrado. Um valor do jogo completo
    não preenche automaticamente o 1º ou 2º tempo. Quando a soma dos dois
    tempos diverge do total disponível, o indicador é excluído dessa
    partida até revisão, sem corrigir o CSV original.</p>
  <p className="muted">{report.selectedHome} histórico(s) do mandante e
    {' '}{report.selectedAway} do visitante; {report.distinct} partidas
    distintas consideradas; {report.duplicateIds} ID(s) repetido(s)
    ignorado(s); {report.skippedAmbiguous} data(s)/fonte(s) para revisão.
    Nenhum valor aqui é sinal V2/V3 novo ou taxa de acerto.</p>
 </details>;
}

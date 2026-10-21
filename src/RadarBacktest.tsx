import {useMemo} from 'react';
import type {Data} from './model';
import {evaluateRadarBacktest, BACKTEST_MIN_MARKET_GAMES, BACKTEST_MIN_TEAM_GAMES, BACKTEST_OVER_RATE, BACKTEST_UNDER_RATE, type BacktestGroup} from './radarBacktest';

const pct = (group: BacktestGroup) => group.signals ? (100*group.correct/group.signals).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%' : 'N/D';
const frequency = (over: number, total: number) => total
  ? (100*over/total).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%' : 'N/D';
const difference = (a: BacktestGroup,b: BacktestGroup) => a.signals && a.signals === b.signals
  ? ((100*a.correct/a.signals)-(100*b.correct/b.signals)).toLocaleString('pt-BR',{maximumFractionDigits:1})+' p.p.'
  : 'N/D';
export default function RadarBacktest({data,competition}:{data:Data;competition:string}) {
  const report = useMemo(()=>evaluateRadarBacktest(data,competition),[data,competition]);
  return <section className="radar-backtest" aria-label="Validação histórica automática">
    <h3>Validação automática da temporada</h3>
    <p className="muted">Reproduz cada partida concluída usando exclusivamente jogos anteriores. Regra fixa, definida antes da avaliação: pelo menos {BACKTEST_MIN_TEAM_GAMES} jogos anteriores de cada equipe e {BACKTEST_MIN_MARKET_GAMES} valores válidos do mercado; frequência Over ≥ {Math.round(BACKTEST_OVER_RATE*100)}% sinaliza Over e ≤ {Math.round(BACKTEST_UNDER_RATE*100)}% sinaliza Under. Entre esses valores, nenhum sinal. É uma avaliação retrospectiva, não uma estimativa de probabilidade ou lucro.</p>
    <p className="muted">{report.fixtures} partidas da competição · {report.excludedAmbiguousDates} com datas divergentes excluídas do teste cronológico. Jogos sem histórico suficiente e sem estatísticas finais válidas também não entram na taxa de acerto.</p>
    <div className="radar-benchmark-summary" aria-label="Comparação resumida dos mercados">
      <h4>Comparação automática dos seis mercados</h4>
      <p className="muted">A mesma amostra de jogos com sinal é utilizada para comparar Radar, sempre Over e sempre Under. No último terço, a referência é escolhida somente pela frequência observada nos dois primeiros terços, sem consultar os resultados finais.</p>
      <div className="radar-benchmark-list">
        {report.markets.map(m=>{
          const radar:BacktestGroup={signals:m.signals,correct:m.correct,incorrect:m.incorrect};
          const stronger=m.alwaysOverSameMatches.correct >= m.alwaysUnderSameMatches.correct ? m.alwaysOverSameMatches : m.alwaysUnderSameMatches;
          const holdout=m.holdout;
          const holdoutUsable=holdout.radar.signals>=20 && holdout.constant.signals===holdout.radar.signals && holdout.baseline!==null;
          const historicalEdge=m.signals>=30 && radar.correct>stronger.correct;
          const heldoutEdge=holdoutUsable && holdout.radar.correct>holdout.constant.correct;
          return <article className="radar-benchmark-row" key={m.id}>
            <h5>{m.label}</h5>
            <div className="radar-benchmark-metrics">
              <div><span>Radar</span><strong>{pct(radar)}</strong></div>
              <div><span>Sempre Over</span><strong>{pct(m.alwaysOverSameMatches)}</strong></div>
              <div><span>Sempre Under</span><strong>{pct(m.alwaysUnderSameMatches)}</strong></div>
              <div><span>Sinais</span><strong>{m.signals}</strong></div>
            </div>
            <p className="muted">Comparação histórica: {m.signals<30?'Amostra insuficiente (mín. 30 sinais)':historicalEdge?'Superou as duas regras constantes nesta amostra':'Não superou a melhor regra constante nesta amostra'}.</p>
            <div className="radar-benchmark-holdout">
              <b>Teste temporal · último terço</b>
              <p>Referência definida antes: {holdout.baseline ? 'Sempre '+holdout.baseline : 'N/D'}.</p>
              <p>Radar: {pct(holdout.radar)} ({holdout.radar.correct}/{holdout.radar.signals}) · Referência: {pct(holdout.constant)} ({holdout.constant.correct}/{holdout.constant.signals}).</p>
              <p>{!holdoutUsable?'Amostra insuficiente ou referência indisponível (mín. 20 sinais)':heldoutEdge?'Radar acima da referência neste teste temporal':'Radar não superou a referência neste teste temporal'}.</p>
            </div>
          </article>;
        })}
      </div>
    </div>
    <div className="radar-backtest-grid">
      {report.markets.map(m=>{
        const group:BacktestGroup={signals:m.signals,correct:m.correct,incorrect:m.incorrect};
        return <article className="radar-backtest-card" key={m.id}>
          <h4>{m.label} <small>Linha {m.line.toLocaleString('pt-BR')}</small></h4>
          <div className="radar-backtest-stat"><strong>{pct(group)}</strong><span>Acerto dos sinais emitidos</span></div>
          <dl>
            <div><dt>Sinais</dt><dd>{m.signals}</dd></div>
            <div><dt>Acertos / erros</dt><dd>{m.correct} / {m.incorrect}</dd></div>
            <div><dt>Sem sinal</dt><dd>{m.neutral}</dd></div>
            <div><dt>Sem dados suficientes</dt><dd>{m.insufficient}</dd></div>
          </dl>
          <details>
            <summary>Ver amostras, mando e comparação</summary>
            <p>Amostra de 6–7 jogos: {pct(m.sample['6–7'])} ({m.sample['6–7'].signals} sinais)</p>
            <p>Amostra de 8–10 jogos: {pct(m.sample['8–10'])} ({m.sample['8–10'].signals} sinais)</p>
            <p>Mando suficiente (2+ em casa e 2+ fora): {pct(m.venue['Mando suficiente'])} ({m.venue['Mando suficiente'].signals} sinais)</p>
            <p>Mando limitado: {pct(m.venue['Mando limitado'])} ({m.venue['Mando limitado'].signals} sinais)</p>
            <h5>Over × Under · mesmo recorte de partidas</h5>
            <p>Frequência real de Over na base: {frequency(m.realFrequency.over,m.realFrequency.observed)} ({m.realFrequency.over}/{m.realFrequency.observed} resultados conhecidos).</p>
            <p>Sinais Over: {pct(m.overSignals)} ({m.overSignals.correct} acertos em {m.overSignals.signals}).</p>
            <p>Sinais Under: {pct(m.underSignals)} ({m.underSignals.correct} acertos em {m.underSignals.signals}).</p>
            <p>Regra "sempre Over" nos mesmos jogos que receberam sinal: {pct(m.alwaysOverSameMatches)} ({m.alwaysOverSameMatches.correct}/{m.alwaysOverSameMatches.signals}).</p>
            <p>Diferença Radar − sempre Over: {difference(group,m.alwaysOverSameMatches)}. Um valor positivo é vantagem histórica nesta amostra, não garantia futura.</p>
            <h5>Três períodos cronológicos dos dados disponíveis</h5>
            {m.periods.map(p => <div className="radar-period-row" key={p.label}>
              <b>{p.label}</b><small>{p.start??'N/D'} a {p.end??'N/D'}</small>
              <span>Radar: {pct(p.radar)} ({p.radar.correct}/{p.radar.signals})</span>
              <span>Sempre Over, mesmos jogos: {pct(p.alwaysOver)} ({p.alwaysOver.correct}/{p.alwaysOver.signals})</span>
              <span>Sinais Over / Under: {p.overSignals.signals} / {p.underSignals.signals}</span>
            </div>)}
          </details>
        </article>;
      })}
    </div>
    <p className="muted">Esta comparação é exploratória e não demonstra rentabilidade. A referência do teste temporal usa apenas os primeiros dois terços para escolher Over ou Under; as estatísticas do Radar em cada jogo usam somente partidas anteriores. Não selecionamos limites de decisão com base no resultado do último terço.</p>
    <p className="muted">Os terços dividem apenas as datas disponíveis, não representam necessariamente a temporada completa. A frequência real usa resultados conhecidos, enquanto a comparação com "sempre Over" usa somente jogos nos quais o Radar emitiu sinal. Regras e limiares não foram ajustados a partir destes resultados.</p>
    <p className="muted">Taxas calculadas somente quando há sinal. Não representam uma avaliação de retorno financeiro: não existem odds, custos ou comparação com preços de mercado. As janelas históricas podem se sobrepor e os sinais não são independentes.</p>
  </section>;
}

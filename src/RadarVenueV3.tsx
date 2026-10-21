import {useMemo} from 'react';
import type {Data} from './model';
import {evaluateVenueV3} from './radarVenueV3Backtest';

const rate=(correct:number,signals:number)=>signals?(100*correct/signals).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%':'N/D';

export default function RadarVenueV3({data,competition}:{data:Data;competition:string}){
 const report=useMemo(()=>evaluateVenueV3(data,competition),[data,competition]);
 return <section className="radar-backtest radar-v3-panel" aria-label="Radar V3 experimental">
  <h3>Radar V3 · Filtro de concordância</h3>
  <p className="muted">Nova análise exploratória: um sinal do V2 só é mantido se as médias de totais e as frequências observadas de ambos os times, cada um em seu mando correspondente, apontarem na mesma direção. São exigidos três jogos válidos por mando, frequência ≥ 60% para Over ou ≤ 40% para Under, e média afastada em pelo menos 5% da linha, além do filtro fixo V2.</p>
  <p className="muted">Período de desenvolvimento até {report.trainingEnd??'N/D'}. Validação posterior a partir de {report.validationStart??'N/D'}; datas iguais ficam juntas. {report.excludedAmbiguousDates} jogos com divergência de datas excluídos.</p>
  <div className="radar-v2-grid">
   {report.markets.map(m=>{
    const comparable=m.v3.signals>=20&&m.v3.signals===m.v2.signals&&m.v3.signals===m.constant.signals;
    const edge=comparable&&m.v3.correct>m.constant.correct;
    return <article className="radar-v2-card" key={m.id}>
     <h4>{m.label}<small>Linha {m.line.toLocaleString('pt-BR')}</small></h4>
     <div className="radar-v2-comparison">
      <div><span>Radar V3 · Teste posterior</span><strong>{rate(m.v3.correct,m.v3.signals)}</strong><small>{m.v3.correct}/{m.v3.signals} acertos/sinais</small></div>
      <div><span>Regra constante · mesmos jogos</span><strong>{rate(m.constant.correct,m.constant.signals)}</strong><small>{m.baseline?'Sempre '+m.baseline:'N/D'}</small></div>
     </div>
     <p className="muted">V2, todos os sinais no teste posterior: {rate(m.v2All.correct,m.v2All.signals)} ({m.v2All.correct}/{m.v2All.signals}).</p>
     <p className="muted">V3 manteve {m.v3.signals} sinais do V2 ({rate(m.v3.signals,m.v2All.signals)} de cobertura dos sinais V2). V2 nos jogos mantidos: {rate(m.v2.correct,m.v2.signals)} ({m.v2.correct}/{m.v2.signals}).</p>
     <p className="muted">V2 nos jogos descartados pelo V3: {rate(m.v2Rejected.correct,m.v2Rejected.signals)} ({m.v2Rejected.correct}/{m.v2Rejected.signals}). Se os rejeitados acertam tanto quanto os mantidos, o filtro não demonstrou melhora.</p>
     <p className="muted">O V3 manteve {m.v3.over} sinais Over e {m.v3.under} Under.</p>
     <p className="muted">Cobertura: {m.v3.signals}/{m.eligibleValidation} jogos com resultado conhecido. Sem histórico: {m.insufficient}; V2 neutro: {m.v2Neutral}; tendências divergentes: {m.disagreement}.</p>
     <details className="radar-v3-diagnostics">
      <summary>Por que o V3 descartou sinais?</summary>
      <p className="muted">Cada condição é contada separadamente. Um jogo pode falhar em mais de uma condição: não some as linhas como se fossem partidas distintas. Acertos e erros abaixo são do V2 nos jogos descartados.</p>
      <div className="radar-v3-diagnostic-list">
       {([
        ['homeMean','Média do mandante em casa'],
        ['awayMean','Média do visitante fora'],
        ['homeFrequency','Frequência do mandante em casa'],
        ['awayFrequency','Frequência do visitante fora'],
       ] as const).map(([key,label])=><div className="radar-v3-diagnostic-row" key={key}>
        <b>{label}</b>
        <span>{m.failedChecks[key].rejections} rejeições</span>
        <span>V2 acertaria {m.failedChecks[key].v2Correct} e erraria {m.failedChecks[key].v2Incorrect}</span>
       </div>)}
      </div>
      <h5>Quando apenas uma condição falhou</h5>
      <p className="muted">Aqui as rejeições são exclusivas: cada jogo aparece em uma única linha. Assim vemos qual exigência, sozinha, impediu um acerto ou erro do V2.</p>
      <div className="radar-v3-diagnostic-list">
       {([
        ['homeMean','Média do mandante em casa'],
        ['awayMean','Média do visitante fora'],
        ['homeFrequency','Frequência do mandante em casa'],
        ['awayFrequency','Frequência do visitante fora'],
       ] as const).map(([key,label])=><div className="radar-v3-diagnostic-row" key={key}>
        <b>{label}</b>
        <span>{m.isolatedChecks[key].rejections} rejeições isoladas</span>
        <span>V2 acertaria {m.isolatedChecks[key].v2Correct} e erraria {m.isolatedChecks[key].v2Incorrect}</span>
       </div>)}
      </div>
      <p className="muted">Várias condições falharam no mesmo jogo: {m.multipleChecks.rejections} rejeições (V2 acertaria {m.multipleChecks.v2Correct} e erraria {m.multipleChecks.v2Incorrect}). Sem condição detalhada: {m.unspecifiedChecks.rejections}.</p>
      <p className="muted">Rejeições isoladas + múltiplas + sem condição detalhada = {m.v2Rejected.signals} sinais V2 descartados. Isto é diagnóstico, não autorização para alterar filtros usando os resultados do teste.</p>
     </details>
     <p className="radar-v2-verdict">{!comparable?'Amostra insuficiente para concluir (mínimo de 20 sinais).':edge?'Acima da referência nesta amostra posterior, ainda sem validação prospectiva.':'Não superou a referência nesta amostra posterior.'}</p>
     <p className="muted">{m.v2Rejected.signals>0 && m.v3.signals>0
       ? m.v3.correct/m.v3.signals>m.v2Rejected.correct/m.v2Rejected.signals
         ? 'A seleção do V3 teve taxa maior que os sinais que descartou. Resultado exploratório.'
         : 'O filtro V3 não elevou a taxa em relação aos sinais descartados.'
       : 'Ainda não é possível avaliar o ganho da seleção por falta de sinais nos dois grupos.'}</p>
    </article>;
   })}
  </div>
  <p className="muted">Diagnóstico de filtros somente: não recalcula as regras nem seleciona novos limites pelo desempenho conhecido. A avaliação permanece exploratória.</p>
  <p className="muted">Não é uma previsão de lucro ou recomendação de aposta. Mesmo um filtro seletivo pode parecer forte por acaso em amostras pequenas. Os limites são fixos, sem ajustes usando os resultados do período posterior.</p>
 </section>;
}

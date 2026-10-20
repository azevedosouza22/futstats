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
     <p className="muted">V2 nos mesmos jogos selecionados pelo V3: {rate(m.v2.correct,m.v2.signals)} ({m.v2.correct}/{m.v2.signals}). São {m.v3.over} sinais Over e {m.v3.under} Under.</p>
     <p className="muted">Cobertura: {m.v3.signals}/{m.eligibleValidation} jogos com resultado conhecido. Sem histórico: {m.insufficient}; V2 neutro: {m.v2Neutral}; tendências divergentes: {m.disagreement}.</p>
     <p className="radar-v2-verdict">{!comparable?'Amostra insuficiente para concluir (mínimo de 20 sinais).':edge?'Acima da referência nesta amostra posterior, ainda sem validação prospectiva.':'Não superou a referência nesta amostra posterior.'}</p>
    </article>;
   })}
  </div>
  <p className="muted">Não é uma previsão de lucro ou recomendação de aposta. Mesmo um filtro seletivo pode parecer forte por acaso em amostras pequenas. Os limites são fixos, sem ajustes usando os resultados do período posterior.</p>
 </section>;
}

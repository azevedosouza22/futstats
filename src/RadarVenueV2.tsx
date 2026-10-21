import {useMemo} from 'react';
import type {Data} from './model';
import {evaluateVenueV2} from './radarVenueV2Backtest';
import {VENUE_V2_LAST_GAMES,VENUE_V2_MIN_VALID_VENUE_GAMES,VENUE_V2_MARGIN_RATIO} from './radarVenueV2';

const format=(a:number,n:number)=>n? (100*a/n).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%':'N/D';
const average=(a:number|null)=>a===null?'N/D':a.toLocaleString('pt-BR',{maximumFractionDigits:2});
export default function RadarVenueV2({data,competition}:{data:Data;competition:string}) {
 const report=useMemo(()=>evaluateVenueV2(data,competition),[data,competition]);
 return <section className="radar-backtest radar-v2-panel" aria-label="Radar V2 experimental por mando">
  <h3>Radar V2 · Teste por mando de campo</h3>
  <p className="muted">Experimento separado do Radar atual. Para cada confronto, usa os últimos {VENUE_V2_LAST_GAMES} jogos anteriores por equipe na mesma competição e compara produção e concessão do mandante em casa e do visitante fora. Exige {VENUE_V2_MIN_VALID_VENUE_GAMES} jogos válidos em cada recorte e margem fixa de {(VENUE_V2_MARGIN_RATIO*100).toLocaleString('pt-BR')}% da linha. Se não houver dados ou o total projetado estiver perto da linha, fica sem sinal.</p>
  <p className="muted">Avaliação cronológica: desenvolvimento até {report.developmentEnd??'N/D'}; teste posterior a partir de {report.validationStart??'N/D'}. Jogos do mesmo dia não são divididos. {report.excludedAmbiguousDates} partidas com divergência de datas excluídas.</p>
  <div className="radar-v2-grid">
   {report.markets.map(m=>{
    const comparable=m.validation.signals>=20&&m.validation.signals===m.constant.signals;
    const advantage=comparable&&m.validation.correct>m.constant.correct;
    return <article className="radar-v2-card" key={m.id}>
     <h4>{m.label} <small>Linha {average(m.line)}</small></h4>
     <div className="radar-v2-comparison">
      <div><span>Radar V2 · Teste posterior</span><strong>{format(m.validation.correct,m.validation.signals)}</strong><small>{m.validation.correct} acertos em {m.validation.signals} sinais</small></div>
      <div><span>Regra simples · Mesmo jogo</span><strong>{format(m.constant.correct,m.constant.signals)}</strong><small>{m.baseline?'Sempre '+m.baseline:'Sem referência'}</small></div>
     </div>
     <p className="muted">Sinais de desenvolvimento: {m.development.signals}. No teste posterior: {m.validation.over} Over, {m.validation.under} Under. {m.missing} sem estatística ou histórico suficiente; {m.neutral} sem sinal por proximidade da linha.</p>
     <p className="radar-v2-verdict">{!comparable?'Ainda sem amostra de validação suficiente (mín. 20 sinais comparáveis).':advantage?'Acima da referência no teste posterior; resultado ainda exploratório.':'Não superou a referência no teste posterior.'}</p>
    </article>;
   })}
  </div>
  <p className="muted">Amostras podem compartilhar jogos; as regras não incluem odds nem custos. Isto não é recomendação de apostas. As demais funcionalidades e as partidas armazenadas não são modificadas.</p>
 </section>;
}

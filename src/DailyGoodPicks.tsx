import type {DailyGoodResult} from './dailyGoodSignals';
import type {ScheduledFixture} from './calendar';

const fmt=(n:number)=>n.toLocaleString('pt-BR',{maximumFractionDigits:1});
/** Informational shortlist; no auto-save, bet slip, odds or external action. */
export default function DailyGoodPicks({result,onSelect}:{
  result:DailyGoodResult;onSelect:(fixture:ScheduledFixture)=>void;
}){
  return <section className="daily-good-picks" aria-label="As Boas do Dia — leitura experimental">
    <div className="daily-good-head">
      <h4>As Boas do Dia <small>· seleção experimental</small></h4>
      <p className="muted">Jogos futuros com agenda oficial recente e sinais V2/V3 convergentes.
        Os critérios usam dados anteriores da mesma liga, não resultados já conhecidos.
        <b> Não são probabilidades, apostas recomendadas nem previsões de IA treinada.</b>
      </p>
    </div>
    <p className="muted">Hoje: {result.date} · {result.checked} {result.checked===1?'jogo verificado e futuro':'jogos verificados e futuros'} analisados ·
      {' '}{result.withAdequateHistory} com histórico mínimo nas duas equipes.</p>
    {result.items.length===0
      ?<p className="daily-good-empty">Nenhuma indicação passou pelos critérios hoje.
        Isso pode significar ausência de jogos verificados, dados insuficientes ou
        divergência entre os modelos. O app não cria indicações para preencher a lista.</p>
      :<div className="daily-good-list">
        {result.items.map(item=><article className="daily-good-item" key={item.fixture.id}>
          <div className="daily-good-item-head">
            <strong>{item.fixture.home} × {item.fixture.away}</strong>
            <small>{item.fixture.time} (Brasília) · {item.fixture.competition}</small>
            <small>Fonte oficial conferida em {item.verifiedAt.split('-').reverse().join('/')}</small>
          </div>
          <ul className="daily-good-signals">
            {item.signals.map(m=><li key={m.id}>
              <b>{m.label}: {m.direction} {fmt(m.line)}</b>
              <small>V2 e V3 concordam · projeção V2 {fmt(m.projection)} · média histórica {fmt(m.historicalMean)}</small>
              <small>{m.historicalSample} jogos para o indicador · {m.leagueSample} observações na liga</small>
            </li>)}
          </ul>
          <button type="button" onClick={()=>onSelect(item.fixture)} className="text-button">
            Abrir Radar e conferir análise
          </button>
        </article>)}
      </div>}
    <p className="muted">As indicações podem errar. O resultado depende da qualidade dos
      jogos históricos e de a programação permanecer correta. Confirme a fonte antes
      de registrar qualquer previsão; esta lista não salva nem publica automaticamente.</p>
  </section>;
}

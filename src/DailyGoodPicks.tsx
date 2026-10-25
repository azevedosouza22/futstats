import type {DailyGoodResult,DailyGoodFixture} from './dailyGoodSignals';
import type {ScheduledFixture} from './calendar';
import type {SavedRadarRecord} from './radarRecords';
import {savedGoodPickMatch} from './dailyGoodSavedMatch';

const fmt=(n:number)=>n.toLocaleString('pt-BR',{maximumFractionDigits:1});
/** Informational shortlist; no auto-save, bet slip, odds or external action. */
export default function DailyGoodPicks({result,onSelect,records,onViewSaved}:{
  result:DailyGoodResult;onSelect:(fixture:ScheduledFixture,selected:DailyGoodFixture)=>void;
  records:readonly SavedRadarRecord[];onViewSaved:(key:string|null)=>void;
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
        {result.items.map(item=>{
          const match=savedGoodPickMatch(item,records);
          return <article className="daily-good-item" key={item.fixture.id}>
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
          {match.state!=='not_saved'&&<p className="muted" role="status">
            {match.state==='from_good_picks'
              ?'Indicação já salva em As Boas · previsão original congelada'
              :match.state==='from_radar'
                ?'Confronto já registrado diretamente no Radar · não atribuído a As Boas'
                :match.state==='duplicates'
                  ?'Mais de um registro com a mesma identidade · revisar duplicações'
                  :'Registro existente · confira horário e origem antes de qualquer nova previsão'}
          </p>}
          <button type="button"
            onClick={()=>match.state==='not_saved'
              ?onSelect(item.fixture,item):onViewSaved(match.recordKey)}
            className="text-button">
            {match.state==='not_saved'?'Abrir Radar e conferir análise'
             :match.state==='duplicates'?'Revisar registros existentes'
             :'Ver previsão já registrada'}
          </button>
        </article>})}
      </div>}
    <details className="daily-good-readiness" aria-label="Diagnóstico de elegibilidade por campeonato">
      <summary>Por que alguns jogos ainda não recebem indicações?</summary>
      <p className="muted">Este controle explica a elegibilidade de confrontos futuros,
        não mede resultados nem acertos. Uma referência oficial vencida exige nova
        conferência real; abrir o link não atualiza o horário.</p>
      {result.readiness.length===0?<p className="muted">Nenhuma referência oficial
        futura cadastrada no período consultado. Isso não significa ausência de jogos.</p>:
        <div className="radar-market-table"><table className="analysis-table">
          <caption>Transparência da lista por campeonato · sem criar previsões</caption>
          <thead><tr>
            <th>Campeonato</th><th>Futuros</th><th>Fonte vencida / conferir</th>
            <th>Outra data</th><th>Falta histórico</th>
            <th>Sem sinal V2/V3</th><th>Qualificados / exibidos</th>
          </tr></thead>
          <tbody>{result.readiness.map(l=><tr key={l.competition}>
            <th>{l.competition}</th>
            <td>{l.scheduledFuture}</td>
            <td>{l.needsRecheck}</td>
            <td>{l.otherDates}</td>
            <td>{l.insufficientHistory}</td>
            <td>{l.noConsistentSignal}</td>
            <td>{l.qualified} / {l.featured}</td>
          </tr>)}</tbody>
        </table></div>}
      <p className="muted">As Boas exige partida futura de hoje, fonte oficial recente,
        histórico anterior suficiente e critérios V2/V3 convergentes. No máximo
        três jogos são exibidos. Os demais continuam apenas na agenda; nenhuma
        indicação é salva sem confirmação no Radar.</p>
    </details>
    <p className="muted">As indicações podem errar. O resultado depende da qualidade dos
      jogos históricos e de a programação permanecer correta. Confirme a fonte antes
      de registrar qualquer previsão; esta lista não salva nem publica automaticamente.</p>
  </section>;
}

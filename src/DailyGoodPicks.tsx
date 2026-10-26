import type {DailyGoodResult,DailyGoodFixture} from './dailyGoodSignals';
import type {ScheduledFixture} from './calendar';
import type {SavedRadarRecord} from './radarRecords';
import {savedGoodPickMatch} from './dailyGoodSavedMatch';
import type {NextGoodQueue} from './dailyGoodNextWeek';
import {safeOfficialFixtureUrl} from './officialSourceTrust';

const fmt=(n:number)=>n.toLocaleString('pt-BR',{maximumFractionDigits:1});
/** Informational shortlist; no auto-save, bet slip, odds or external action. */
export default function DailyGoodPicks({result,onSelect,records,onViewSaved,nextWeek,onPreview}:{
  result:DailyGoodResult;onSelect:(fixture:ScheduledFixture,selected:DailyGoodFixture)=>void;
  records:readonly SavedRadarRecord[];onViewSaved:(key:string|null)=>void;
  nextWeek:NextGoodQueue;onPreview:(fixture:ScheduledFixture)=>void;
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
    <details className="daily-good-next-week" aria-label="Preparar análises dos próximos sete dias">
      <summary>Preparar próximos 7 dias · {nextWeek.preview} com prévia possível;
        {' '}{nextWeek.needsHistory+nextWeek.needsRecheck+nextWeek.conflicts} para revisar
      </summary>
      <p className="muted">Planejamento de {nextWeek.dateFrom} a {nextWeek.dateThrough},
        somente com referências da agenda oficial cadastradas. <strong>Não são
        indicações de As Boas, probabilidades nem previsões registradas.</strong>
        A lista “As Boas” só avalia jogos futuros do próprio dia com horários recentes,
        V2/V3 convergentes e histórico suficiente.</p>
      {nextWeek.entries.length===0
       ?<p className="muted">Nenhum confronto futuro cadastrado nesta janela.
          Isso não confirma que não existem partidas.</p>
       :<>
        <p className="muted" role="status">{nextWeek.preview} com histórico básico e
          horário recente · {nextWeek.needsHistory} precisando de histórico ·
          {' '}{nextWeek.needsRecheck} exigindo reconferir fonte ·
          {' '}{nextWeek.conflicts} com horários oficiais divergentes.</p>
        <ul className="daily-good-next-week-list">
          {nextWeek.entries.slice(0,6).map(item=><li key={item.fixture.id}>
            <b>{item.fixture.home} × {item.fixture.away}</b>
            <small>{' · '}{item.fixture.date} · {item.fixture.time??'horário N/D'}
              {' '}(Brasília) · {item.fixture.competition}</small>
            <p className="muted">
              {item.state==='preview'
               ?'Prévia possível — não é indicação'
               :item.state==='needs_history'?'Histórico insuficiente'
               :item.state==='needs_recheck'?'Fonte ou horário a reconfirmar'
               :'Horário divergente — revisar'}
              {' · '}{item.reason}
              {item.homeCount!==null&&item.awayCount!==null
               ?' · '+item.homeCount+' jogos do mandante / '+
                 item.awayCount+' do visitante':' · dados N/D'}
            </p>
            {safeOfficialFixtureUrl(item.fixture.sourceUrl)&&
             <p><a href={item.fixture.sourceUrl} target="_blank"
              rel="noopener noreferrer">Consultar referência oficial</a></p>}
            {item.state==='preview'&&<button type="button" className="text-button"
              onClick={()=>onPreview(item.fixture)}>
              Abrir prévia no Radar (sem indicação)
            </button>}
          </li>)}
        </ul>
        {nextWeek.entries.length>6&&<p className="muted">
          Outros {nextWeek.entries.length-6} jogos aparecem na agenda oficial completa
          ao escolher 7 dias.</p>}
       </>}
      <p className="muted">A verificação de fonte caduca em dois dias.
        Abrir um link não renova a verificação. Prévia no Radar utiliza somente
        jogos anteriores da mesma competição e não atribui a previsão a “As Boas”.
        Não há consulta automática nem atualização de resultados.</p>
    </details>
    <details className="daily-good-readiness" aria-label="Diagnóstico de elegibilidade por campeonato">
      <summary>Por que alguns jogos ainda não recebem indicações?
        {result.conflicts.length>0&&<strong> · {result.conflicts.length}
          {' '}horário(s) oficial(is) divergente(s)</strong>}
      </summary>
      {result.conflicts.length>0&&<div className="daily-good-kickoff-conflicts"
        aria-label="Confrontos bloqueados por divergência de horário">
        <p className="muted" role="status">
          <strong>{result.conflicts.length} confronto(s) bloqueado(s)</strong>:
          fontes oficiais recentes informam horários diferentes. Horário
          confiável: <strong>N/D</strong>. Nenhuma indicação é gerada até
          existir uma reconferência real e consistente.
        </p>
        <ul>{result.conflicts.slice(0,5).map(item=><li key={[
            item.fixture.competition,item.fixture.date,
            item.fixture.home,item.fixture.away].join('|')}>
          <b>{item.fixture.home} × {item.fixture.away}</b>
          {' · '}{item.fixture.competition} · {item.fixture.date}
          <small>Horários conflitantes informados (Brasília), nenhum confirmado:</small>
          <ul>{item.references.map((source,i)=><li key={i}>
            {source.time} · referência datada {source.verifiedAt}
            {' · '}<a href={source.sourceUrl} rel="noopener noreferrer"
              target="_blank">Conferir fonte oficial</a>
          </li>)}</ul>
        </li>)}</ul>
        {result.conflicts.length>5&&<p className="muted">Outros
          {' '}{result.conflicts.length-5} confrontos conflitantes não
          exibidos neste resumo.</p>}
      </div>}
      <p className="muted">Este controle explica a elegibilidade de confrontos futuros,
        não mede resultados nem acertos. Uma referência oficial vencida exige nova
        conferência real; abrir o link não atualiza o horário.</p>
      {result.readiness.length===0?<p className="muted">Nenhuma referência oficial
        futura cadastrada no período consultado. Isso não significa ausência de jogos.</p>:
        <div className="radar-market-table"><table className="analysis-table">
          <caption>Transparência da lista por campeonato · sem criar previsões</caption>
          <thead><tr>
            <th>Campeonato</th><th>Futuros</th><th>Fonte vencida / conferir</th>
            <th>Horários divergentes</th><th>Outra data</th><th>Falta histórico</th>
            <th>Sem sinal V2/V3</th><th>Qualificados / exibidos</th>
          </tr></thead>
          <tbody>{result.readiness.map(l=><tr key={l.competition}>
            <th>{l.competition}</th>
            <td>{l.scheduledFuture}</td>
            <td>{l.needsRecheck}</td>
            <td>{l.conflictingKickoff}</td>
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

import {useState} from 'react';
import {radarRetrospective} from './radar';
import type {Data} from './model';

const number = (n: number | null) =>
  n === null ? 'N/D' : n.toLocaleString('pt-BR', {maximumFractionDigits: 2});
const percent = (n: number | null) =>
  n === null ? 'N/D' : (n * 100).toLocaleString('pt-BR', {maximumFractionDigits: 1}) + '%';

export default function Radar({data}: {data: Data}) {
  const [selectedLeague, setSelectedLeague] = useState('');
  const [selectedFixtureId, setSelectedFixtureId] = useState('');
  const [showResults, setShowResults] = useState(false);

  const researchMatches = data.matches.filter(m => !!m.research);
  const competitions = [...new Set(researchMatches.map(m => m.competition).filter(Boolean))].sort((a,b) => a.localeCompare(b, 'pt-BR'));
  const competition = selectedLeague || competitions[0] || '';
  const fixtures = researchMatches.filter(m => m.competition === competition)
    .sort((a,b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
  const fixture = fixtures.find(m => m.id === selectedFixtureId) ?? fixtures[0];
  const homeName = data.teams.find(t => t.id === fixture?.home)?.name ?? 'Mandante';
  const awayName = data.teams.find(t => t.id === fixture?.away)?.name ?? 'Visitante';
  const snapshot = fixture ? radarRetrospective(data,fixture) : null;
  const labelFixture = (m: typeof fixture) => !m ? '' :
    m.date + ' · ' + (data.teams.find(t => t.id === m.home)?.name ?? '?') +
    ' × ' + (data.teams.find(t => t.id === m.away)?.name ?? '?');

  return <section className="panel radar-panel">
    <div className="panel-head"><div>
      <h2>Radar · Validação retrospectiva</h2>
      <p>Veja o que os números anteriores a uma partida indicavam, sem utilizar o resultado dela nos cálculos.</p>
    </div></div>
    <div className="radar-inner">
      <p className="muted">Modo experimental: estas partidas já aconteceram. As frequências são históricas, não probabilidades estimadas para apostas. Sem odds, sem recomendações automáticas e sem calendário futuro nesta versão.</p>
      {!researchMatches.length ? <div className="empty">
        Importe pesquisas CSV para habilitar a validação retrospectiva. O Radar não cria partidas fictícias na sua base.
      </div> : <>
        <div className="analysis-controls">
          <label>Competição
            <select aria-label="Liga do radar" value={competition}
              onChange={e => {setSelectedLeague(e.target.value);setSelectedFixtureId('');setShowResults(false);}}>
              {competitions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label>Confronto já concluído
            <select aria-label="Partida do radar" value={fixture?.id ?? ''}
              onChange={e => {setSelectedFixtureId(e.target.value);setShowResults(false);}}>
              {fixtures.map(m => <option value={m.id} key={m.id}>{labelFixture(m)}</option>)}
            </select>
          </label>
        </div>
        {fixture && snapshot && <>
          <div className="radar-context">
            <h3>{homeName} × {awayName}</h3>
            <p>{fixture.date} · {fixture.competition}</p>
            <p>Histórico considerado: {snapshot.homeHistory.length}/5 jogos de {homeName} e {snapshot.awayHistory.length}/5 de {awayName}; {snapshot.distinctHistoryCount} partidas únicas após eliminar duplicatas.</p>
            <p>Recorte de mando dentro das cinco partidas: {homeName} em casa ({snapshot.homeAtHome.count}); {awayName} fora ({snapshot.awayAtAway.count}).</p>
          </div>
          <div className="radar-venue-grid">
            {[{name:homeName, venue:'Em casa', summary:snapshot.homeAtHome},
               {name:awayName, venue:'Fora', summary:snapshot.awayAtAway}].map(item =>
              <article key={item.name} className="radar-venue">
                <h4>{item.name} · {item.venue}</h4>
                <p>{item.summary.count} jogos no recorte</p>
                <div><span>Finalizações a favor</span><strong>{number(item.summary.shotsFor.mean)}</strong></div>
                <div><span>Finalizações sofridas</span><strong>{number(item.summary.shotsAgainst.mean)}</strong></div>
                <div><span>Escanteios a favor</span><strong>{number(item.summary.cornersFor.mean)}</strong></div>
                <div><span>Gols a favor</span><strong>{number(item.summary.goalsFor.mean)}</strong></div>
              </article>
            )}
          </div>
          <div className="radar-market-table">
            <table className="analysis-table">
              <caption>Mercados ilustrativos · últimos cinco jogos de cada equipe, somente da competição selecionada</caption>
              <thead><tr><th>Indicador</th><th>Over histórico</th><th>Under histórico</th><th>Média do total</th><th>Amostra</th>{showResults&&<th>Resultado ocorrido</th>}</tr></thead>
              <tbody>{snapshot.markets.map(m => <tr key={m.id}>
                <th>{m.label}<small>Linha ilustrativa: {number(m.line)}</small></th>
                <td><b>{percent(m.historyRate)}</b><small>{m.overs}/{m.observed} jogos</small></td>
                <td><b>{percent(m.historyRate === null ? null : 1 - m.historyRate)}</b></td>
                <td>{number(m.historicalMean)}</td>
                <td>{m.observed} partidas únicas</td>
                {showResults&&<td>{m.actual === null ? 'N/D' : number(m.actual) + ' · ' + (m.didOver ? 'Over' : 'Under')}</td>}
              </tr>)}</tbody>
            </table>
          </div>
          <p className="muted">As amostras são pequenas e podem compartilhar partidas entre os dois históricos. A taxa Over/Under é apenas a frequência observada nesses registros, não a chance calculada de acertar uma aposta. As linhas são exemplos, não odds nem mercados confirmados de casas de apostas.</p>
          <button type="button" className="primary" onClick={()=>setShowResults(v=>!v)}>
            {showResults?'Ocultar resultados ocorridos':'Revelar resultados para comparar'}
          </button>
          <p className="muted">Fonte: <a href={fixture.research?.sourceUrl} target="_blank" rel="noopener noreferrer">pesquisa CSV · verificar jogo no Flashscore</a>. Dados locais, sem acesso automático ao site.</p>
        </>}
      </>}
    </div>
  </section>;
}

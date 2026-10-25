import {useState} from 'react';
import {labels, metrics, type Data} from './model';
import {localDate, pregameAverage, type Period} from './pregame';
const format = (value: number | null) => value === null ? 'N/D' : value.toLocaleString('pt-BR', {maximumFractionDigits: 2});

export default function PreGame({data}: {data: Data}) {
  const [ids, setIds] = useState<[string, string]>(['', '']);
  const [period, setPeriod] = useState<Period>('full');
  const [date, setDate] = useState(localDate());
  const [competition, setCompetition] = useState('');
  const [venueMode, setVenueMode] = useState<'all' | 'match'>('all');
  const competitions = [...new Set(data.matches.map(m => m.competition.trim()).filter(Boolean))].sort((a,b) => a.localeCompare(b, 'pt-BR'));
  const selected = [ids[0] || data.teams[0]?.id || '', ids[1] || data.teams[1]?.id || ''];
  // Future confrontation dates must not include future manual records.
  const cutoff = date && date < localDate() ? date : localDate();
  return <section className="panel"><div className="panel-head"><div><h2>Pré-jogo · últimos 5 e 10 jogos</h2><p>Médias da sua base local, sem previsão de resultados</p></div></div><div className="analysis-content">
    <p className="muted">Usamos apenas partidas anteriores à data do confronto e a hoje. O filtro de competição não mistura campeonatos diferentes; escolha Todas para considerar também copas e outras ligas. Registros manuais são tratados como jogos concluídos e podem incluir dados fictícios se você carregou a demonstração. Para partidas CSV com datas divergentes, ambas devem ser anteriores ao confronto para evitar incluir o próprio jogo nas médias pré-jogo. Importações precisam ter status final. Não há busca automática de históricos.</p>
    <div className="analysis-controls">{[0, 1].map(i => <label key={i}>Equipe {i + 1}<select aria-label={`Equipe ${i + 1} pré-jogo`} value={selected[i]} onChange={e => setIds(i === 0 ? [e.target.value, selected[1]] : [selected[0], e.target.value])}><option value="">Selecione</option>{data.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>)}<label>Data do confronto<input type="date" value={date} onChange={e => setDate(e.target.value)}/></label><label>Competição<select aria-label="Filtrar competição pré-jogo" value={competition} onChange={e => setCompetition(e.target.value)}><option value="">Todas as competições</option>{competitions.map(c => <option key={c} value={c}>{c}</option>)}</select></label><label>Local de jogo<select aria-label="Recorte mandante visitante" value={venueMode} onChange={e => setVenueMode(e.target.value as 'all' | 'match')}><option value="all">Geral (casa e fora)</option><option value="match">Equipe 1 em casa × equipe 2 fora</option></select></label></div>
    <div className="segment analysis-period"><button className={period === 'first' ? 'selected' : ''} onClick={() => setPeriod('first')}>1º tempo</button><button className={period === 'full' ? 'selected' : ''} onClick={() => setPeriod('full')}>Jogo completo</button></div>
    {!data.teams.length && <p className="empty">Cadastre equipes e partidas para montar sua análise.</p>}
    {selected[0] && selected[0] === selected[1] && <p role="alert" className="alert">Selecione equipes diferentes para a análise lado a lado.</p>}
    {date && selected[0] !== selected[1] && <div className="pregame-grid">{selected.filter(Boolean).map(id => {
      const five = pregameAverage(data.matches, id, 5, period, cutoff, {competition, venue: venueMode === 'all' ? 'all' : (id === selected[0] ? 'home' : 'away')}), ten = pregameAverage(data.matches, id, 10, period, cutoff, {competition, venue: venueMode === 'all' ? 'all' : (id === selected[0] ? 'home' : 'away')});
      return <article className="pregame-card" key={id}><h3>{data.teams.find(t => t.id === id)?.name}</h3><p className="muted">{period === 'first' ? 'Primeiro tempo' : 'Jogo completo'} · {venueMode === 'match' ? (id === selected[0] ? 'mandante' : 'visitante') : 'casa e fora'} · {competition || 'todas as competições'} · {five.count}/5 e {ten.count}/10 partidas na base</p>
        <p className="muted"><strong>Escanteios por jogo:</strong> {format(five.values.corners)} (últimos 5 · {five.samples.corners} válidos) · {format(ten.values.corners)} (últimos 10 · {ten.samples.corners} válidos)</p><table className="analysis-table"><caption>Médias por métrica · amostras disponíveis</caption><thead><tr><th>Estatística</th><th>Últimos 5</th><th>Últimos 10</th></tr></thead><tbody>{metrics.map(k => <tr key={k}><th>{labels[k]}</th><td><b>{format(five.values[k])}</b><small>{five.samples[k]}/{five.count} jogos</small></td><td><b>{format(ten.values[k])}</b><small>{ten.samples[k]}/{ten.count} jogos</small></td></tr>)}</tbody></table>
        <details><summary>Partidas utilizadas ({ten.count})</summary>{ten.selected.length ? <ul className="source-list">{ten.selected.map(m => <li key={m.id}>{m.date} · {data.teams.find(t => t.id === m.home)?.name} × {data.teams.find(t => t.id === m.away)?.name}<small>Fonte: {m.external ? `TheSportsDB · ID ${m.external.id}` : m.image ? 'Importação por imagem revisada' : m.research ? 'Flashscore · pesquisa CSV' : m.competition === 'Dados de demonstração' ? 'Demonstração fictícia cadastrada' : 'Cadastro manual local'}</small></li>)}</ul> : <p className="muted">Nenhum jogo elegível. Todas as médias são N/D.</p>}</details></article>;
    })}</div>}
    {!date && <p className="alert">Informe a data do confronto.</p>}
    <p className="muted">N/D = Não disponível. Cada janela contém os últimos jogos elegíveis, sem substituir uma partida sem estatísticas por outra mais antiga. Ausências são excluídas de cada média; a amostra pode ser menor que 5 ou 10. A base pode estar incompleta. No recorte mandante/visitante, a equipe 1 é sempre mandante e a equipe 2 é sempre visitante.</p>
  </div></section>;
}

import {useEffect, useRef, useState, type FormEvent} from 'react';
import {metrics, labels, type Data} from './model';
import {providers, type LiveSnapshot} from './providers';
const show = (n: number | null) => n === null ? 'N/D' : String(n);
const time = (value: string | null) => value === null ? 'N/D' : new Date(value).toLocaleString('pt-BR');

export default function Live({data}: {data: Data}) {
  const [providerId, setProviderId] = useState(providers[0].id), [eventId, setEventId] = useState('');
  const [snapshot, setSnapshot] = useState<LiveSnapshot | null>(null), [busy, setBusy] = useState(false);
  const [error, setError] = useState(''), [cooldown, setCooldown] = useState(false);
  const controller = useRef<AbortController | null>(null), timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {controller.current?.abort(); if (timer.current) clearTimeout(timer.current);}, []);
  const provider = providers.find(p => p.id === providerId)!;
  async function update(e: FormEvent) {
    e.preventDefault(); if (busy || cooldown) return;
    if (!/^\d{1,20}$/.test(eventId.trim())) {setError('Informe o ID numérico da partida na fonte.'); return;}
    const id = eventId.trim(); controller.current?.abort(); const c = new AbortController(); controller.current = c;
    setBusy(true); setCooldown(true); timer.current = setTimeout(() => setCooldown(false), 10000); setError('');
    if (snapshot?.eventId !== id || snapshot.provider !== providerId) setSnapshot(null);
    try {const result = await provider.snapshot(id, c.signal); if (!c.signal.aborted) setSnapshot(result);}
    catch (e) {if (!c.signal.aborted) setError(e instanceof Error ? e.message : 'Falha na atualização.');}
    finally {if (!c.signal.aborted) setBusy(false);}
  }
  function selectEvent(id: string) {controller.current?.abort(); setSnapshot(null); setError(''); setEventId(id);}
  return <section className="panel"><div className="panel-head"><div><h2>Ao vivo · atualização manual</h2><p>Consulta pontual da fonte, sem atualização automática</p></div></div><div className="analysis-content">
    <p className="muted">A TheSportsDB V1 gratuita não oferece um feed ao vivo garantido nem minuto verificável. O minuto aparece como N/D. A consulta pode retornar uma partida encerrada, agendada ou sem estatísticas.</p>
    <form onSubmit={update} className="live-controls"><label>Provedor autorizado<select disabled={busy} value={providerId} onChange={e => {setProviderId(e.target.value); setSnapshot(null); setError('');}}>{providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>ID do evento<input disabled={busy} inputMode="numeric" pattern="[0-9]{1,20}" required maxLength={20} value={eventId} onChange={e => selectEvent(e.target.value)} placeholder="Informe o ID da fonte"/></label><button className="primary" type="submit" disabled={busy || cooldown || !eventId}>{busy ? 'Consultando…' : cooldown ? 'Aguarde 10 segundos' : 'Atualizar agora'}</button></form>
    <label className="saved-event">Usar ID de uma partida importada<select disabled={busy} aria-label="Selecionar partida importada ao vivo" value={data.matches.some(m => m.external?.id === eventId) ? eventId : ''} onChange={e => selectEvent(e.target.value)}><option value="">Selecione ou informe um ID acima</option>{data.matches.filter(m => m.external).map(m => <option value={m.external!.id} key={m.id}>{data.teams.find(t => t.id === m.home)?.name} × {data.teams.find(t => t.id === m.away)?.name} · {m.date} · {m.external!.id}</option>)}</select></label>
    {error && <p className="alert" role="alert">{error}{snapshot && ' Os dados abaixo são da última consulta bem-sucedida e podem estar desatualizados.'}</p>}
    {snapshot ? <article className="live-snapshot"><div className="live-score"><span>{snapshot.home}</span><strong>{show(snapshot.score[0])} : {show(snapshot.score[1])}</strong><span>{snapshot.away}</span></div><div className="live-status"><span>Status da fonte: <b>{snapshot.status}</b></span><span>Minuto: <b>{show(snapshot.minute)}</b></span></div>
      <table className="analysis-table"><caption>Agregados informados pela fonte · sem divisão por tempo</caption><thead><tr><th>Estatística</th><th>{snapshot.home}</th><th>{snapshot.away}</th></tr></thead><tbody>{metrics.map(k => <tr key={k}><th>{labels[k]}</th><td>{show(snapshot.aggregate[0][k]??null)}</td><td>{show(snapshot.aggregate[1][k]??null)}</td></tr>)}</tbody></table>
      {snapshot.warnings.map((warning, i) => <p className="alert" key={i} role="status">{warning}</p>)}<div className="source-meta"><p>Fonte: <b>{snapshot.source}</b> · ID {snapshot.eventId}</p><p>Consulta do placar ao provedor: {time(snapshot.fetchedAt)}</p><p>Consulta das estatísticas: {time(snapshot.statisticsFetchedAt)}</p><p>Horário de atualização informado pelo provedor: {time(snapshot.providerUpdatedAt)}</p></div>
    </article> : !busy && <div className="empty"><h3>Nenhuma partida consultada</h3><p>Selecione uma importação ou informe o ID real do evento. Não há placar de demonstração nesta área.</p></div>}
    <p className="muted">N/D = Não disponível. Os agregados não são dados de primeiro tempo nem necessariamente de 90 minutos; podem incluir prorrogação. Não estimamos minuto pelo relógio. Consultas não alteram seus jogos, backups ou médias. Cache de até 30 segundos pode reutilizar a resposta: o horário exibido é o da consulta à fonte, não uma garantia de frescor. Não há scraping do Flashscore.</p>
  </div></section>;
}

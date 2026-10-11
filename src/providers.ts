import {unavailable, type Stats} from './model';
import {score} from './sportsdb';

export type LiveSnapshot = {
  provider: string; source: string; eventId: string; home: string; away: string;
  status: string; minute: number | null; score: [number | null, number | null];
  aggregate: [Stats, Stats]; fetchedAt: string | null; statisticsFetchedAt: string | null;
  providerUpdatedAt: string | null; warnings: string[];
};
export interface DataProvider {
  id: string; name: string;
  capabilities: {liveFeed: boolean; minute: boolean; statistics: 'partial' | 'full' | 'none'; periods: boolean};
  snapshot: (eventId: string, signal: AbortSignal) => Promise<LiveSnapshot>;
}
const text = (value: unknown, fallback: string) => typeof value === 'string' && value.trim() ? value : fallback;
const timestamp = (value: unknown) => typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? value : null;
const mapping = {'Total Shots': 'shots', 'Shots on Goal': 'target', 'Corner Kicks': 'corners', 'Yellow Cards': 'yellow', 'Red Cards': 'red'} as const;

export function normalizeSnapshot(eventId: string, raw: unknown, rows: unknown[], fetchedAt: unknown, statisticsFetchedAt: unknown): LiveSnapshot {
  if (!raw || typeof raw !== 'object') throw Error('Partida não encontrada na fonte.');
  const e = raw as Record<string, unknown>;
  if (e.idEvent !== eventId || e.strSport !== 'Soccer') throw Error('A fonte não retornou a partida de futebol solicitada.');
  const aggregate: [Stats, Stats] = [unavailable(), unavailable()];
  const warnings: string[] = [];
  const status = text(e.strStatus, 'N/D');
  const scheduled = ['Not Started', 'NS', 'Postponed', 'Cancelled', 'PST', 'CANC'].includes(status);
  const goals: [number | null, number | null] = scheduled ? [null, null] : [score(e.intHomeScore), score(e.intAwayScore)];
  aggregate[0].goals = goals[0]; aggregate[1].goals = goals[1];
  const seen = new Set<string>();
  for (const value of rows) {
    if (!value || typeof value !== 'object') continue;
    const row = value as Record<string, unknown>;
    // Do not accept another event, unknown metrics, or rows labelled as a half.
    if (row.idEvent !== eventId || typeof row.strStat !== 'string' || !(row.strStat in mapping) || row.strPeriod != null || row.period != null) continue;
    const metric = mapping[row.strStat as keyof typeof mapping];
    if (seen.has(metric)) {aggregate[0][metric] = null; aggregate[1][metric] = null; warnings.push(`Dados duplicados para ${row.strStat}; exibidos como N/D.`); continue;}
    seen.add(metric); aggregate[0][metric] = score(row.intHome); aggregate[1][metric] = score(row.intAway);
  }
  if (!rows.length) warnings.push('A fonte não forneceu estatísticas para esta partida.');
  else if (!aggregate.some(s => Object.keys(mapping).some(label => s[mapping[label as keyof typeof mapping]] !== null))) warnings.push('Nenhuma métrica estatística suportada foi disponibilizada pela fonte.');
  return {provider: 'thesportsdb-v1', source: 'TheSportsDB V1', eventId, home: text(e.strHomeTeam, 'Equipe N/D'), away: text(e.strAwayTeam, 'Equipe N/D'), status,
    minute: null, score: goals, aggregate, fetchedAt: timestamp(fetchedAt), statisticsFetchedAt: timestamp(statisticsFetchedAt), providerUpdatedAt: null, warnings};
}

async function request(kind: 'snapshot' | 'statistics', eventId: string, signal: AbortSignal) {
  let response: Response;
  try {response = await fetch(`/api/thesportsdb?kind=${kind}&q=${encodeURIComponent(eventId)}`, {signal});}
  catch (e) {if (signal.aborted) throw e; throw Error('Não foi possível acessar o servidor. Verifique sua conexão.');}
  let body;
  try {body = await response.json();} catch {throw Error('Integração de servidor indisponível nesta hospedagem.');}
  if (!response.ok) throw Error(typeof body.error === 'string' ? body.error : 'Falha ao consultar o provedor.');
  if (!Array.isArray(body.items)) throw Error('Resposta inválida do provedor.');
  return body as {items: unknown[]; fetchedAt?: string};
}

export function createSportsDBProvider(fetchRequest = request): DataProvider {
  return {id: 'thesportsdb-v1', name: 'TheSportsDB V1 · consulta pontual', capabilities: {liveFeed: false, minute: false, statistics: 'partial', periods: false},
    async snapshot(eventId, signal) {
      if (!/^\d{1,20}$/.test(eventId)) throw Error('Informe um ID de evento numérico válido.');
      const event = await fetchRequest('snapshot', eventId, signal);
      // Validate the identity before spending another upstream request.
      normalizeSnapshot(eventId, event.items[0], [], event.fetchedAt, null);
      let statistics: {items: unknown[]; fetchedAt?: string} = {items: []}; let warning = '';
      try {statistics = await fetchRequest('statistics', eventId, signal);}
      catch (e) {if (signal.aborted) throw e; warning = `Estatísticas indisponíveis: ${e instanceof Error ? e.message : 'falha na fonte'}`;}
      const result = normalizeSnapshot(eventId, event.items[0], statistics.items, event.fetchedAt, statistics.fetchedAt);
      if (warning) result.warnings.push(warning);
      return result;
    }};
}
// Only explicit, reviewed adapters are registered. No arbitrary URL or scraping.
export const providers: DataProvider[] = [createSportsDBProvider()];

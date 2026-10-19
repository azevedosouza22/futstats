import {unavailable, validData, validDate, type Data, type Match, type Stats} from './model';

type Pair = [Stats, Stats];
export type WorkResearchRow = {
  sourceId: string;
  sourceUrl: string;
  date: string;
  titleDate?: string;
  dateDiscrepancy: boolean;
  home: string;
  away: string;
  competition: string;
  full: Pair;
  first: Pair;
  second: Pair;
};

const metricColumns = [
  ['goals', 'gols'],
  ['shots', 'finalizacoes'],
  ['target', 'chutes_no_alvo'],
  ['corners', 'escanteios'],
] as const;

function recordsFromCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (c === ',' && !quoted) {
      row.push(cell); cell = '';
    } else if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some(v => v.trim() !== '')) rows.push(row);
      row = [];
    } else cell += c;
  }
  if (quoted) throw Error('CSV incompleto: há aspas não fechadas.');
  row.push(cell);
  if (row.some(v => v.trim() !== '')) rows.push(row);
  return rows;
}

function numberOrMissing(value: string | undefined, column: string, line: number): number | null {
  const cleaned = (value ?? '').trim();
  if (!cleaned || cleaned.toUpperCase() === 'N/D') return null;
  if (!/^(0|[1-9]\d*)$/.test(cleaned) || !Number.isSafeInteger(Number(cleaned)))
    throw Error(`Linha ${line}: número inválido em ${column}.`);
  return Number(cleaned);
}

function safeSourceUrl(value: string, id: string, line: number): string {
  let parsed: URL;
  try { parsed = new URL(value); }
  catch { throw Error(`Linha ${line}: link de origem inválido.`); }
  if (parsed.protocol !== 'https:' || !['www.flashscore.com.br', 'flashscore.com.br', 'www.flashscore.com', 'flashscore.com'].includes(parsed.hostname) ||
      parsed.username || parsed.password || parsed.searchParams.get('mid') !== id)
    throw Error(`Linha ${line}: link e ID do Flashscore não correspondem.`);
  return parsed.href;
}

function pair(record: Record<string, string>, period: 'jogo' | '1t' | '2t', line: number): Pair {
  const result: Pair = [unavailable(), unavailable()];
  for (const [metric, prefix] of metricColumns) {
    const homeField = `${prefix}_mandante_${period}`;
    const awayField = `${prefix}_visitante_${period}`;
    const totalField = `${prefix}_total_${period}`;
    const home = numberOrMissing(record[homeField], homeField, line);
    const away = numberOrMissing(record[awayField], awayField, line);
    const total = numberOrMissing(record[totalField], totalField, line);
    result[0][metric] = home;
    result[1][metric] = away;
    if (total !== null && (home === null || away === null || home + away !== total))
      throw Error(`Linha ${line}: o total de ${prefix} (${period}) não confere.`);
  }
  for (const s of result) if (s.shots !== null && s.target !== null && s.target > s.shots)
    throw Error(`Linha ${line}: chutes no alvo excedem as finalizações.`);
  return result;
}

export function parseWorkResearchCsv(text: string): WorkResearchRow[] {
  if (text.length > 2_000_000) throw Error('O CSV deve ter até 2 MB.');
  const lines = recordsFromCsv(text.replace(/^\uFEFF/, ''));
  if (lines.length < 2) throw Error('O CSV não contém partidas.');
  const headers = lines[0].map(h => h.trim());
  const required = ['id_fonte', 'fonte', 'url_fonte', 'data', 'data_titulo_fonte', 'mandante', 'visitante', 'competicao',
    ...metricColumns.flatMap(([, prefix]) => [`${prefix}_mandante_jogo`, `${prefix}_visitante_jogo`])];
  if (headers.length !== new Set(headers).size || required.some(key => !headers.includes(key)))
    throw Error('Formato CSV incompatível. Utilize o modelo de pesquisa do Work com os campos obrigatórios.');
  if (lines.length > 501) throw Error('Importe até 500 partidas por arquivo.');
  const seen = new Set<string>();
  return lines.slice(1).map((values, index) => {
    const line = index + 2;
    if (values.length !== headers.length) throw Error(`Linha ${line}: quantidade de colunas incompatível.`);
    const row = Object.fromEntries(headers.map((h, i) => [h, values[i]])) as Record<string, string>;
    const sourceId = row.id_fonte.trim();
    const home = row.mandante.trim(), away = row.visitante.trim();
    const date = row.data.trim();
    const titleDate = row.data_titulo_fonte.trim();
    if (row.fonte.trim().toLowerCase() !== 'flashscore' || !/^[a-zA-Z0-9_-]{3,80}$/.test(sourceId))
      throw Error(`Linha ${line}: fonte ou identificador não reconhecido.`);
    if (!validDate(date) || (titleDate && titleDate.toUpperCase() !== 'N/D' && !validDate(titleDate)))
      throw Error(`Linha ${line}: data inválida.`);
    if (!home || !away || home.toLocaleLowerCase('pt-BR') === away.toLocaleLowerCase('pt-BR') ||
      home.length > 100 || away.length > 100 || row.competicao.length > 150)
      throw Error(`Linha ${line}: nomes ou competição inválidos.`);
    if (seen.has(sourceId)) throw Error(`Linha ${line}: partida duplicada no CSV.`);
    seen.add(sourceId);
    const full = pair(row, 'jogo', line), first = pair(row, '1t', line), second = pair(row, '2t', line);
    for (const [metric] of metricColumns) for (const side of [0, 1] as const) {
      const a = first[side][metric], b = second[side][metric], total = full[side][metric];
      if (total !== null && ((a !== null && a > total) || (b !== null && b > total) ||
        (a !== null && b !== null && a + b !== total)))
        throw Error(`Linha ${line}: dados por tempo divergentes para ${metric}.`);
    }
    return {
      sourceId, sourceUrl: safeSourceUrl(row.url_fonte.trim(), sourceId, line),
      date, titleDate: validDate(titleDate) ? titleDate : undefined,
      dateDiscrepancy: validDate(titleDate) && titleDate !== date,
      home, away, competition: row.competicao.trim(),
      full, first, second,
    };
  });
}

const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ').toLowerCase();
export function workCsvPreview(data: Data, rows: WorkResearchRow[]) {
  const existing = new Set(data.matches.flatMap(m => m.research ? [m.research.sourceId] : []));
  return rows.map(row => ({
    ...row,
    duplicate: existing.has(row.sourceId) || data.matches.some(m =>
      [row.date, row.titleDate].filter(Boolean).includes(m.date) &&
      norm(data.teams.find(t => t.id === m.home)?.name ?? '') === norm(row.home) &&
      norm(data.teams.find(t => t.id === m.away)?.name ?? '') === norm(row.away)),
  }));
}

export function mergeWorkCsv(data: Data, rows: WorkResearchRow[]): {data: Data; added: number; skipped: number} {
  const next: Data = {...data, teams: [...data.teams], matches: [...data.matches]};
  let added = 0, skipped = 0;
  for (const row of workCsvPreview(data, rows)) {
    if (row.duplicate) {skipped++; continue;}
    const getTeamId = (name: string) => {
      const existing = next.teams.find(t => norm(t.name) === norm(name));
      if (existing) return existing.id;
      const id = crypto.randomUUID();
      next.teams.push({id, name, color: '#247855'});
      return id;
    };
    const home = getTeamId(row.home), away = getTeamId(row.away);
    const m: Match = {
      id: crypto.randomUUID(), home, away, date: row.date, competition: row.competition,
      first: row.first, second: row.second,
      research: {
        provider: 'work-csv', source: 'Flashscore', sourceId: row.sourceId,
        sourceUrl: row.sourceUrl, importedAt: new Date().toISOString(),
        full: row.full, titleDate: row.titleDate, dateDiscrepancy: row.dateDiscrepancy,
      },
    };
    next.matches.push(m);
    added++;
  }
  if (!validData(next)) throw Error('Os registros não passaram pela validação. Nenhuma partida foi importada.');
  return {data: next, added, skipped};
}

import {average, type Match} from './model';
export type Period = 'first' | 'full';
export type Venue = 'all' | 'home' | 'away';
export type PreGameFilters = {competition?: string; venue?: Venue};

// Dates have day precision. Exclude the entire confrontation day rather than
// guessing which match on the same day came first.
// Optional competition and venue filters avoid mixing separate championships
// and distinguish team 1 at home from team 2 away.
export function recentMatches(
  matches: Match[], team: string, limit: 5 | 10, beforeDate: string, filters: PreGameFilters = {},
): Match[] {
  return matches.filter(m => (m.home === team || m.away === team) && m.date < beforeDate &&
    // When the source shows two conflicting dates, neither may fall on/after the analysis day.
    (!m.research?.titleDate || m.research.titleDate < beforeDate) &&
    (!m.external || ['FT', 'Match Finished'].includes(m.external.status)) &&
    (!filters.competition || m.competition.trim() === filters.competition) &&
    (filters.venue !== 'home' || m.home === team) &&
    (filters.venue !== 'away' || m.away === team))
    .sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id)).slice(0, limit);
}

export function pregameAverage(
  matches: Match[], team: string, limit: 5 | 10, period: Period, beforeDate: string,
  filters: PreGameFilters = {},
) {
  const selected = recentMatches(matches, team, limit, beforeDate, filters);
  return {...average(selected, team, period), selected};
}

export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

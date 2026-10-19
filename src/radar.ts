import {stats, type Data, type Match, type Metric, type Period} from './model';
import {recentMatches} from './pregame';

type Market = {
  id: string;
  label: string;
  metric: Metric;
  period: Period;
  line: number;
};

export const radarMarkets: readonly Market[] = [
  {id: 'goals-full-2.5', label: 'Gols · partida completa', metric: 'goals', period: 'full', line: 2.5},
  {id: 'goals-first-0.5', label: 'Gols · 1º tempo', metric: 'goals', period: 'first', line: 0.5},
  {id: 'goals-second-0.5', label: 'Gols · 2º tempo', metric: 'goals', period: 'second', line: 0.5},
  {id: 'shots-full-24.5', label: 'Finalizações · partida completa', metric: 'shots', period: 'full', line: 24.5},
  {id: 'target-full-7.5', label: 'Chutes no gol · partida completa', metric: 'target', period: 'full', line: 7.5},
  {id: 'corners-full-8.5', label: 'Escanteios · partida completa', metric: 'corners', period: 'full', line: 8.5},
];

function matchTotal(match: Match, metric: Metric, period: Period): number | null {
  const a = stats(match, 0, period)[metric];
  const b = stats(match, 1, period)[metric];
  return a === null || b === null ? null : a + b;
}

function teamAverage(matches: Match[], team: string, metric: Metric, conceded = false): {mean: number | null; valid: number} {
  const numbers = matches.map(m => {
    const side = m.home === team ? 0 : 1;
    return stats(m, conceded ? 1 - side : side, 'full')[metric];
  }).filter((n): n is number => n !== null);
  return {
    valid: numbers.length,
    mean: numbers.length ? numbers.reduce((a, b) => a + b, 0) / numbers.length : null,
  };
}

export type RadarMarketResult = Market & {
  observed: number;
  overs: number;
  historyRate: number | null;
  historicalMean: number | null;
  actual: number | null;
  didOver: boolean | null;
};

export function radarRetrospective(data: Data, fixture: Match) {
  // Do not use the selected fixture, same-day matches, or any matches from later dates.
  // Restrict both teams to their own last five matches in this competition.
  const homeHistory = recentMatches(data.matches, fixture.home, 5, fixture.date, {competition: fixture.competition});
  const awayHistory = recentMatches(data.matches, fixture.away, 5, fixture.date, {competition: fixture.competition});
  const unique = [...new Map([...homeHistory, ...awayHistory].map(m => [m.id, m])).values()];
  const homeAtHome = homeHistory.filter(m => m.home === fixture.home);
  const awayAtAway = awayHistory.filter(m => m.away === fixture.away);

  const markets: RadarMarketResult[] = radarMarkets.map(market => {
    const values = unique
      .map(m => matchTotal(m, market.metric, market.period))
      .filter((v): v is number => v !== null);
    const actual = matchTotal(fixture, market.metric, market.period);
    return {
      ...market,
      observed: values.length,
      overs: values.filter(v => v > market.line).length,
      historyRate: values.length ? values.filter(v => v > market.line).length / values.length : null,
      historicalMean: values.length ? values.reduce((a, b) => a + b, 0) / values.length : null,
      actual,
      didOver: actual === null ? null : actual > market.line,
    };
  });

  return {
    homeHistory, awayHistory, distinctHistoryCount: unique.length,
    homeAtHome: {
      count: homeAtHome.length,
      shotsFor: teamAverage(homeAtHome, fixture.home, 'shots'),
      shotsAgainst: teamAverage(homeAtHome, fixture.home, 'shots', true),
      cornersFor: teamAverage(homeAtHome, fixture.home, 'corners'),
      goalsFor: teamAverage(homeAtHome, fixture.home, 'goals'),
    },
    awayAtAway: {
      count: awayAtAway.length,
      shotsFor: teamAverage(awayAtAway, fixture.away, 'shots'),
      shotsAgainst: teamAverage(awayAtAway, fixture.away, 'shots', true),
      cornersFor: teamAverage(awayAtAway, fixture.away, 'corners'),
      goalsFor: teamAverage(awayAtAway, fixture.away, 'goals'),
    },
    markets,
  };
}

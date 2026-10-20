import type {Data} from './model';
import {matchTotal, radarMarkets, radarRetrospective} from './radar';

// Fixed, descriptive, time-ordered rule. Do not optimize thresholds on outcomes.
export const BACKTEST_MIN_TEAM_GAMES = 3;
export const BACKTEST_MIN_MARKET_GAMES = 6;
export const BACKTEST_OVER_RATE = 0.7;
export const BACKTEST_UNDER_RATE = 0.3;

export type BacktestDecision = 'Over' | 'Under' | 'Sem sinal';
export type BacktestGroup = {signals: number; correct: number; incorrect: number};
export type BacktestPrevalence = {observed: number; over: number};
export type BacktestPeriod = {
  label: string;
  start: string | null;
  end: string | null;
  radar: BacktestGroup;
  alwaysOver: BacktestGroup;
  overSignals: BacktestGroup;
  underSignals: BacktestGroup;
};
export type BacktestMarket = {
  id: string; label: string; line: number;
  eligible: number; signals: number; correct: number; incorrect: number; neutral: number;
  insufficient: number;
  sample: Record<'6–7' | '8–10', BacktestGroup>;
  venue: Record<'Mando suficiente' | 'Mando limitado', BacktestGroup>;
  overSignals: BacktestGroup;
  underSignals: BacktestGroup;
  alwaysOverSameMatches: BacktestGroup;
  realFrequency: BacktestPrevalence;
  periods: BacktestPeriod[];
};
export type BacktestReport = {
  fixtures: number; excludedAmbiguousDates: number; markets: BacktestMarket[];
};

const emptyGroup = (): BacktestGroup => ({signals: 0, correct: 0, incorrect: 0});
const periodLabels = ['Primeiro terço', 'Segundo terço', 'Terceiro terço'] as const;

function score(group: BacktestGroup, correct: boolean): void {
  group.signals++;
  if (correct) group.correct++; else group.incorrect++;
}

export function backtestDecision(rate: number | null, observed: number): BacktestDecision {
  if (rate === null || observed < BACKTEST_MIN_MARKET_GAMES) return 'Sem sinal';
  if (rate >= BACKTEST_OVER_RATE) return 'Over';
  if (rate <= BACKTEST_UNDER_RATE) return 'Under';
  return 'Sem sinal';
}

export function evaluateRadarBacktest(data: Data, competition: string): BacktestReport {
  const fixtures = data.matches.filter(m => !!m.research && m.competition === competition)
    .sort((a,b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));

  // Split by distinct historical dates, not arbitrary row indices: matches on the
  // same day always stay together. These are thirds of available dates, not a
  // claim that the full championship has been imported.
  const dates = [...new Set(fixtures.map(m => m.date))];
  const dateThird = new Map(dates.map((date, i) =>
    [date, Math.min(2, Math.floor(3 * i / dates.length))] as const));
  const periods = periodLabels.map((label, i) => {
    const included = dates.filter(date => dateThird.get(date) === i);
    return {label, start: included[0] ?? null, end: included[included.length-1] ?? null,
      radar: emptyGroup(), alwaysOver: emptyGroup(),
      overSignals: emptyGroup(), underSignals: emptyGroup()};
  });

  const markets: BacktestMarket[] = radarMarkets.map(m => ({
    id: m.id, label: m.label, line: m.line,
    eligible: 0, signals: 0, correct: 0, incorrect: 0, neutral: 0,
    insufficient: 0,
    sample: {'6–7': emptyGroup(), '8–10': emptyGroup()},
    venue: {'Mando suficiente': emptyGroup(), 'Mando limitado': emptyGroup()},
    overSignals: emptyGroup(), underSignals: emptyGroup(),
    alwaysOverSameMatches: emptyGroup(),
    realFrequency: {observed: 0, over: 0},
    periods: periods.map(p => ({...p,
      radar: emptyGroup(), alwaysOver: emptyGroup(),
      overSignals: emptyGroup(), underSignals: emptyGroup()})),
  }));
  let excludedAmbiguousDates = 0;

  for (const fixture of fixtures) {
    // Raw prevalence is descriptive of *all* matches with a known final result,
    // including conflicting-date matches that cannot safely be replayed in time.
    for (let i = 0; i < markets.length; i++) {
      const def = radarMarkets[i];
      const actual = matchTotal(fixture, def.metric, def.period);
      if (actual !== null) {
        markets[i].realFrequency.observed++;
        if (actual > def.line) markets[i].realFrequency.over++;
      }
    }
    if (fixture.research?.dateDiscrepancy) {
      excludedAmbiguousDates++;
      continue;
    }
    const snapshot = radarRetrospective(data, fixture);
    const haveBothTeams = snapshot.homeHistory.length >= BACKTEST_MIN_TEAM_GAMES &&
      snapshot.awayHistory.length >= BACKTEST_MIN_TEAM_GAMES;
    const third = dateThird.get(fixture.date) ?? 0;

    for (let i = 0; i < markets.length; i++) {
      const result = snapshot.markets[i];
      const aggregate = markets[i];
      if (!haveBothTeams || result.observed < BACKTEST_MIN_MARKET_GAMES ||
          result.actual === null || result.didOver === null) {
        aggregate.insufficient++;
        continue;
      }
      aggregate.eligible++;
      const call = backtestDecision(result.historyRate, result.observed);
      if (call === 'Sem sinal') {aggregate.neutral++; continue;}
      const correct = (call === 'Over') === result.didOver;
      const baselineCorrect = result.didOver; // "always Over" on the EXACT same fixtures.
      aggregate.signals++;
      if (correct) aggregate.correct++; else aggregate.incorrect++;

      const sample = aggregate.sample[result.observed >= 8 ? '8–10' : '6–7'];
      const venue = aggregate.venue[
        snapshot.homeAtHome.count >= 2 && snapshot.awayAtAway.count >= 2
          ? 'Mando suficiente' : 'Mando limitado'];
      score(sample, correct);
      score(venue, correct);
      score(call === 'Over' ? aggregate.overSignals : aggregate.underSignals, correct);
      score(aggregate.alwaysOverSameMatches, baselineCorrect);
      const period = aggregate.periods[third];
      score(period.radar, correct);
      score(period.alwaysOver, baselineCorrect);
      score(call === 'Over' ? period.overSignals : period.underSignals, correct);
    }
  }
  return {fixtures: fixtures.length, excludedAmbiguousDates, markets};
}

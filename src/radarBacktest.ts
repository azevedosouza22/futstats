import type {Data} from './model';
import {radarMarkets, radarRetrospective} from './radar';

// This is a descriptive, out-of-sample-in-time replay, not a fitted probability model.
// The same fixed rule is applied before observing each historical outcome.
export const BACKTEST_MIN_TEAM_GAMES = 3;
export const BACKTEST_MIN_MARKET_GAMES = 6;
export const BACKTEST_OVER_RATE = 0.7;
export const BACKTEST_UNDER_RATE = 0.3;

export type BacktestDecision = 'Over' | 'Under' | 'Sem sinal';
export type BacktestGroup = {signals: number; correct: number; incorrect: number};
export type BacktestMarket = {
  id: string; label: string; line: number;
  eligible: number; signals: number; correct: number; incorrect: number; neutral: number;
  insufficient: number;
  sample: Record<'6–7' | '8–10', BacktestGroup>;
  venue: Record<'Mando suficiente' | 'Mando limitado', BacktestGroup>;
};
export type BacktestReport = {
  fixtures: number; excludedAmbiguousDates: number; markets: BacktestMarket[];
};

const emptyGroup = (): BacktestGroup => ({signals: 0, correct: 0, incorrect: 0});

export function backtestDecision(rate: number | null, observed: number): BacktestDecision {
  if (rate === null || observed < BACKTEST_MIN_MARKET_GAMES) return 'Sem sinal';
  if (rate >= BACKTEST_OVER_RATE) return 'Over';
  if (rate <= BACKTEST_UNDER_RATE) return 'Under';
  return 'Sem sinal';
}

export function evaluateRadarBacktest(data: Data, competition: string): BacktestReport {
  const fixtures = data.matches.filter(m => !!m.research && m.competition === competition);
  const markets = radarMarkets.map(m => ({
    id: m.id, label: m.label, line: m.line,
    eligible: 0, signals: 0, correct: 0, incorrect: 0, neutral: 0,
    insufficient: 0,
    sample: {'6–7': emptyGroup(), '8–10': emptyGroup()},
    venue: {'Mando suficiente': emptyGroup(), 'Mando limitado': emptyGroup()},
  })) as BacktestMarket[];
  let excludedAmbiguousDates = 0;

  for (const fixture of fixtures) {
    // A fixture with conflicting source dates is unsuitable for chronological validation.
    if (fixture.research?.dateDiscrepancy) {excludedAmbiguousDates++; continue;}
    const snapshot = radarRetrospective(data, fixture);
    const haveBothTeams = snapshot.homeHistory.length >= BACKTEST_MIN_TEAM_GAMES &&
      snapshot.awayHistory.length >= BACKTEST_MIN_TEAM_GAMES;
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
      const isCorrect = (call === 'Over') === result.didOver;
      aggregate.signals++;
      if (isCorrect) aggregate.correct++; else aggregate.incorrect++;
      const sample = aggregate.sample[result.observed >= 8 ? '8–10' : '6–7'];
      const venue = aggregate.venue[
        snapshot.homeAtHome.count >= 2 && snapshot.awayAtAway.count >= 2
          ? 'Mando suficiente' : 'Mando limitado'
      ];
      for (const group of [sample, venue]) {
        group.signals++;
        if (isCorrect) group.correct++; else group.incorrect++;
      }
    }
  }
  return {fixtures: fixtures.length, excludedAmbiguousDates, markets};
}

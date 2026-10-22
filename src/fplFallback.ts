/**
 * Read-only list of unavailable indicators in the Premier League pilot.
 * Flashscore may be consulted independently but is never scraped, copied,
 * imported automatically, or used to overwrite the FutStats/Radar history.
 */
import type {FplPilotGame} from './fplFreePilot';

export function unavailableFplIndicators(
  game: FplPilotGame,
  verifiedShotPeriods: boolean | null,
): {missing: string[]; auditPending: boolean} {
  if (!game.sourceStatsProcessed) {
    return {
      missing: [
        'Gols, finalizações, chutes no gol e escanteios: jogo completo',
        'Gols, finalizações, chutes no gol e escanteios: 1º/2º tempo',
      ],
      auditPending: false,
    };
  }
  const missing = ['Gols por tempo', 'Escanteios por tempo'];
  if (verifiedShotPeriods === false)
    missing.push('Finalizações e chutes no gol por tempo');
  return {missing, auditPending: verifiedShotPeriods === null};
}

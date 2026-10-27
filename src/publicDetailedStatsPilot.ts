import type {PublicStatsPage} from './publicDetailedStatsCrosscheck';
/**
 * Punctual public match-stat review carried out on 2026-10-26.
 * Page readings: Scout Picks and No Ataque (not official competition sites);
 * the original official scoreboard is retained in publicResultPilot.ts.
 * Neither page was queried by the FutStats application. We do not know whether
 * the two sites use an overlapping upstream data provider.
 *
 * Full: 1×2 goals, 18×10 shots, 6×5 on target and 6×6 corners.
 * Half: 0×1 goals only. Other 1T/2T indicators remain N/D.
 */
export const PUBLIC_DETAILED_STATS_PILOT:readonly PublicStatsPage[]=[
 {
  sourceName:'Scout Picks — estatísticas finais publicadas',
  sourceUrl:'https://scoutpicks.app/matches/laliga/fc-barcelona-vs-real-madrid-19732648',
  checkedDate:'2026-10-26',date:'2026-10-25',
  competition:'La Liga espanhola 2026/27',home:'Barcelona',away:'Real Madrid',
  full:{goals:[1,2],shots:[18,10],target:[6,5],corners:[6,6]},
  halfGoals:[0,1]
 },
 {
  sourceName:'No Ataque — estatísticas e eventos publicados',
  sourceUrl:'https://noataque.com.br/jogo/campeonato-espanhol/2026/10/25/BAR-REA/',
  checkedDate:'2026-10-26',date:'2026-10-25',
  competition:'La Liga espanhola 2026/27',home:'Barcelona',away:'Real Madrid',
  full:{goals:[1,2],shots:[18,10],target:[6,5],corners:[6,6]},
  halfGoals:[0,1]
 }
] as const;

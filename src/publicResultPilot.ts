import type {PublicScoreObservation} from './publicResultCrosscheck';

/** Manual external check performed on 26 Oct 2026.
 * Sources: LALIGA (organizer) and FC Barcelona (club).
 * No forecast, Work CSV, user data or shot/corner observation is attached.
 * Reading the URLs in a browser is not performed by this constant.
 */
export const PUBLIC_RESULT_PILOT:readonly PublicScoreObservation[]=[
 {
  sourceName:'La Liga — organizadora',
  sourceUrl:'https://www.laliga.com/en-GB/partidazos/el-clasico',
  checkedDate:'2026-10-26',date:'2026-10-25',
  competition:'La Liga espanhola 2026/27',
  home:'Barcelona',away:'Real Madrid',
  full:[1,2],half:[0,1]
 },
 {
  sourceName:'FC Barcelona — site oficial do clube',
  sourceUrl:'https://www.fcbarcelona.com/en/matches/138374/fc-barcelona-real-madrid-la-liga-2026-2027',
  checkedDate:'2026-10-26',date:'2026-10-25',
  competition:'La Liga espanhola 2026/27',
  home:'Barcelona',away:'Real Madrid',
  full:[1,2],half:[0,1]
 }
] as const;

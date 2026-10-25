/**
 * Small, manually verified, read-only fixture register.
 *
 * Each entry cites an official event URL, a verified-on date, an explicit
 * timezone and a UTC kickoff. NEVER call this a live schedule/feed.
 * The Work records here are only used as fixture metadata: no Work statistics
 * or predictions are imported into the main FutStats database.
 */
import {brasiliaDate,normalizeTeam,type ScheduledFixture} from './calendar';
import {VERIFIED_EUROPE_FIXTURES,fixtureWithOfficialTime} from './verifiedEuropeWorkFixtures';
import {safeOfficialFixtureUrl,officialSnapshotFreshAt} from './officialSourceTrust';

export type OfficialCalendarRecord={
  id:string;competition:string;home:string;away:string;
  localDate:string;localTime:string;timezone:string;utcKickoff:string;
  officialUrl:string;verifiedAt:string;
};
export type OfficialCalendarItem={
  fixture:ScheduledFixture;
  verifiedAt:string;
  /** Stale references never transfer kickoff time to prediction controls. */
  fresh:boolean;
};

const CBF_FIXTURES:readonly OfficialCalendarRecord[]=[
  {id:'cbf-coritiba-gremio-20261026',competition:'Brasileirão Série A',
   home:'Coritiba',away:'Grêmio',localDate:'2026-10-26',localTime:'19:30',
   timezone:'America/Sao_Paulo',utcKickoff:'2026-10-26T22:30:00Z',
   officialUrl:'https://www.cbf.com.br/futebol-brasileiro/jogos/campeonato-brasileiro/serie-a/2026/coritiba-saf-x-gremio/832208?view=escala-de-arbitros',
   verifiedAt:'2026-10-25'},
  {id:'cbf-flamengo-atletico-20261026',competition:'Brasileirão Série A',
   home:'Flamengo',away:'Atlético-MG',localDate:'2026-10-26',localTime:'20:00',
   timezone:'America/Sao_Paulo',utcKickoff:'2026-10-26T23:00:00Z',
   officialUrl:'https://www.cbf.com.br/futebol-brasileiro/jogos/campeonato-brasileiro/serie-a/2026/x/832201',
   verifiedAt:'2026-10-25'},
  {id:'cbf-santos-palmeiras-20261028',competition:'Brasileirão Série A',
   home:'Santos',away:'Palmeiras',localDate:'2026-10-28',localTime:'19:30',
   timezone:'America/Sao_Paulo',utcKickoff:'2026-10-28T22:30:00Z',
   officialUrl:'https://www.cbf.com.br/futebol-brasileiro/jogos/campeonato-brasileiro/serie-a/2026/santos-fc-x-palmeiras/832213?view=escala-de-arbitros',
   verifiedAt:'2026-10-25'},
  {id:'cbf-bahia-sao-paulo-20261028',competition:'Brasileirão Série A',
   home:'Bahia',away:'São Paulo',localDate:'2026-10-28',localTime:'21:30',
   timezone:'America/Sao_Paulo',utcKickoff:'2026-10-29T00:30:00Z',
   officialUrl:'https://www.cbf.com.br/futebol-brasileiro/jogos/campeonato-brasileiro/serie-a/2026/bahia-x-sao-paulo/832219?view=escala-de-arbitros',
   verifiedAt:'2026-10-25'},
  // CBF's own accreditation fixture listing, checked 25/10/2026.
  // This link lists several scheduled matches, not an individual match page.
  {id:'cbf-fluminense-internacional-20261028',competition:'Brasileirão Série A',
   home:'Fluminense',away:'Internacional',localDate:'2026-10-28',localTime:'19:30',
   timezone:'America/Sao_Paulo',utcKickoff:'2026-10-28T22:30:00Z',
   officialUrl:'https://credencial.cbf.com.br/competicoes/listar/42/1',
   verifiedAt:'2026-10-25'},
  {id:'cbf-bragantino-chapecoense-20261028',competition:'Brasileirão Série A',
   home:'RB Bragantino',away:'Chapecoense',localDate:'2026-10-28',localTime:'19:30',
   timezone:'America/Sao_Paulo',utcKickoff:'2026-10-28T22:30:00Z',
   officialUrl:'https://credencial.cbf.com.br/competicoes/listar/42/1',
   verifiedAt:'2026-10-25'},
  {id:'cbf-remo-botafogo-20261028',competition:'Brasileirão Série A',
   home:'Remo',away:'Botafogo',localDate:'2026-10-28',localTime:'21:30',
   timezone:'America/Sao_Paulo',utcKickoff:'2026-10-29T00:30:00Z',
   officialUrl:'https://credencial.cbf.com.br/competicoes/listar/42/1',
   verifiedAt:'2026-10-25'},
  {id:'cbf-atletico-cruzeiro-20261029',competition:'Brasileirão Série A',
   home:'Atlético-MG',away:'Cruzeiro',localDate:'2026-10-29',localTime:'19:30',
   timezone:'America/Sao_Paulo',utcKickoff:'2026-10-29T22:30:00Z',
   officialUrl:'https://www.cbf.com.br/futebol-brasileiro/jogos/campeonato-brasileiro/serie-a/2026/atletico-mineiro-x-cruzeiro/832216',
   verifiedAt:'2026-10-25'},
  {id:'cbf-gremio-athletico-20261029',competition:'Brasileirão Série A',
   home:'Grêmio',away:'Athletico-PR',localDate:'2026-10-29',localTime:'21:30',
   timezone:'America/Sao_Paulo',utcKickoff:'2026-10-30T00:30:00Z',
   officialUrl:'https://www.cbf.com.br/futebol-brasileiro/jogos/campeonato-brasileiro/serie-a/2026/gremio-x-athletico-paranaense/832217?view=escala-de-arbitros',
   verifiedAt:'2026-10-25'},
  {id:'cbf-corinthians-mirassol-20261030',competition:'Brasileirão Série A',
   home:'Corinthians',away:'Mirassol',localDate:'2026-10-30',localTime:'20:00',
   timezone:'America/Sao_Paulo',utcKickoff:'2026-10-30T23:00:00Z',
   officialUrl:'https://www.cbf.com.br/futebol-brasileiro/jogos/campeonato-brasileiro/serie-a/2026/corinthians-x-mirassol/832214',
   verifiedAt:'2026-10-25'},
];

const PREMIER_LEAGUE_FIXTURES:readonly OfficialCalendarRecord[]=[
  // Times from the Premier League's revised UK fixture schedule. The UK is
  // on GMT after the 25 October clock change; local times are not Brasilia.
  {id:'pl-chelsea-manchester-united-20261031',competition:'Premier League inglesa 2026/27',
   home:'Chelsea',away:'Manchester United',localDate:'2026-10-31',localTime:'12:30',
   timezone:'Europe/London',utcKickoff:'2026-10-31T12:30:00Z',
   officialUrl:'https://www.premierleague.com/en/news/4688862/fixture-amendments-for-premier-league-matches-in-october-and-november',
   verifiedAt:'2026-10-25'},
  {id:'pl-tottenham-crystal-palace-20261031',competition:'Premier League inglesa 2026/27',
   home:'Tottenham Hotspur',away:'Crystal Palace',localDate:'2026-10-31',localTime:'17:30',
   timezone:'Europe/London',utcKickoff:'2026-10-31T17:30:00Z',
   officialUrl:'https://www.premierleague.com/en/news/4688862/fixture-amendments-for-premier-league-matches-in-october-and-november',
   verifiedAt:'2026-10-25'},
  {id:'pl-aston-villa-fulham-20261031',competition:'Premier League inglesa 2026/27',
   home:'Aston Villa',away:'Fulham',localDate:'2026-10-31',localTime:'20:00',
   timezone:'Europe/London',utcKickoff:'2026-10-31T20:00:00Z',
   officialUrl:'https://www.premierleague.com/en/news/4688862/fixture-amendments-for-premier-league-matches-in-october-and-november',
   verifiedAt:'2026-10-25'},
  {id:'pl-liverpool-arsenal-20261101',competition:'Premier League inglesa 2026/27',
   home:'Liverpool',away:'Arsenal',localDate:'2026-11-01',localTime:'16:30',
   timezone:'Europe/London',utcKickoff:'2026-11-01T16:30:00Z',
   officialUrl:'https://www.premierleague.com/en/news/4688862/fixture-amendments-for-premier-league-matches-in-october-and-november',
   verifiedAt:'2026-10-25'},
  {id:'pl-newcastle-everton-20261102',competition:'Premier League inglesa 2026/27',
   home:'Newcastle United',away:'Everton',localDate:'2026-11-02',localTime:'20:00',
   timezone:'Europe/London',utcKickoff:'2026-11-02T20:00:00Z',
   officialUrl:'https://www.premierleague.com/en/news/4688862/fixture-amendments-for-premier-league-matches-in-october-and-november',
   verifiedAt:'2026-10-25'}
];

// Individual, manually checked league-issued schedule references, NOT a live feed.
const SERIE_A_ITALIANA_FIXTURES:readonly OfficialCalendarRecord[]=[
  {id:'it-roma-cagliari-20261027',competition:'Serie A italiana 2026/27',
    home:'AS Roma',away:'Cagliari',localDate:'2026-10-27',localTime:'20:45',
    timezone:'Europe/Rome',utcKickoff:'2026-10-27T19:45:00Z',
    officialUrl:'https://www.legaseriea.it/serie-a/news/quando-si-gioca-anticipi-e-posticipi-fino-alla-12a-giornata',verifiedAt:'2026-10-25'},
  {id:'it-sassuolo-lazio-20261027',competition:'Serie A italiana 2026/27',
    home:'Sassuolo',away:'Lazio',localDate:'2026-10-27',localTime:'18:30',
    timezone:'Europe/Rome',utcKickoff:'2026-10-27T17:30:00Z',
    officialUrl:'https://www.legaseriea.it/serie-a/news/quando-si-gioca-anticipi-e-posticipi-fino-alla-12a-giornata',verifiedAt:'2026-10-25'},
  {id:'it-milan-bologna-20261028',competition:'Serie A italiana 2026/27',
    home:'AC Milan',away:'Bologna',localDate:'2026-10-28',localTime:'18:30',
    timezone:'Europe/Rome',utcKickoff:'2026-10-28T17:30:00Z',
    officialUrl:'https://www.legaseriea.it/serie-a/news/quando-si-gioca-anticipi-e-posticipi-fino-alla-12a-giornata',verifiedAt:'2026-10-25'},
  {id:'it-genoa-juventus-20261028',competition:'Serie A italiana 2026/27',
    home:'Genoa',away:'Juventus',localDate:'2026-10-28',localTime:'20:45',
    timezone:'Europe/Rome',utcKickoff:'2026-10-28T19:45:00Z',
    officialUrl:'https://www.legaseriea.it/serie-a/news/quando-si-gioca-anticipi-e-posticipi-fino-alla-12a-giornata',verifiedAt:'2026-10-25'},
  {id:'it-fiorentina-atalanta-20261029',competition:'Serie A italiana 2026/27',
    home:'Fiorentina',away:'Atalanta',localDate:'2026-10-29',localTime:'20:45',
    timezone:'Europe/Rome',utcKickoff:'2026-10-29T19:45:00Z',
    officialUrl:'https://www.legaseriea.it/serie-a/news/quando-si-gioca-anticipi-e-posticipi-fino-alla-12a-giornata',verifiedAt:'2026-10-25'},
  {id:'it-milan-inter-20261031',competition:'Serie A italiana 2026/27',
    home:'AC Milan',away:'Inter',localDate:'2026-10-31',localTime:'20:45',
    timezone:'Europe/Rome',utcKickoff:'2026-10-31T19:45:00Z',
    officialUrl:'https://www.legaseriea.it/serie-a/news/quando-si-gioca-anticipi-e-posticipi-fino-alla-12a-giornata',verifiedAt:'2026-10-25'},
  {id:'it-juventus-napoli-20261101',competition:'Serie A italiana 2026/27',
    home:'Juventus',away:'Napoli',localDate:'2026-11-01',localTime:'20:45',
    timezone:'Europe/Rome',utcKickoff:'2026-11-01T19:45:00Z',
    officialUrl:'https://www.legaseriea.it/serie-a/news/quando-si-gioca-anticipi-e-posticipi-fino-alla-12a-giornata',verifiedAt:'2026-10-25'},
];
const LA_LIGA_FIXTURES:readonly OfficialCalendarRecord[]=[
  {id:'es-villarreal-espanyol-20261030',competition:'La Liga espanhola 2026/27',
    home:'Villarreal CF',away:'RCD Espanyol',localDate:'2026-10-30',localTime:'21:00',
    timezone:'Europe/Madrid',utcKickoff:'2026-10-30T20:00:00Z',
    officialUrl:'https://www.laliga.com/es-MX/noticias/horarios-de-la-undecima-jornada-de-laliga-ea-sports-2026-27',verifiedAt:'2026-10-25'},
  {id:'es-rayo-celta-20261031',competition:'La Liga espanhola 2026/27',
    home:'Rayo Vallecano',away:'RC Celta',localDate:'2026-10-31',localTime:'16:15',
    timezone:'Europe/Madrid',utcKickoff:'2026-10-31T15:15:00Z',
    officialUrl:'https://www.laliga.com/clubes/rayo-vallecano/proximos-partidos',verifiedAt:'2026-10-25'},
  {id:'es-betis-malaga-20261031',competition:'La Liga espanhola 2026/27',
    home:'Real Betis',away:'Málaga CF',localDate:'2026-10-31',localTime:'18:30',
    timezone:'Europe/Madrid',utcKickoff:'2026-10-31T17:30:00Z',
    officialUrl:'https://www.laliga.com/clubes/real-betis/proximos-partidos',verifiedAt:'2026-10-25'},
  {id:'es-barcelona-alaves-20261031',competition:'La Liga espanhola 2026/27',
    home:'FC Barcelona',away:'Deportivo Alavés',localDate:'2026-10-31',localTime:'21:00',
    timezone:'Europe/Madrid',utcKickoff:'2026-10-31T20:00:00Z',
    officialUrl:'https://www.laliga.com/clubes/fc-barcelona/proximos-partidos',verifiedAt:'2026-10-25'},
  {id:'es-racing-real-madrid-20261101',competition:'La Liga espanhola 2026/27',
    home:'R. Racing Club',away:'Real Madrid',localDate:'2026-11-01',localTime:'16:15',
    timezone:'Europe/Madrid',utcKickoff:'2026-11-01T15:15:00Z',
    officialUrl:'https://www.laliga.com/clubes/real-madrid/proximos-partidos',verifiedAt:'2026-10-25'},
];

const WORK_LEAGUES:Record<string,string>={
  'serie-a':'Serie A italiana 2026/27',
  'la-liga':'La Liga espanhola 2026/27',
  'ligue-1':'Ligue 1 francesa 2026/27',
};

const dateValid=(value:string)=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&
  !Number.isNaN(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
const timestamp=(value:string)=>/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value)&&
  !Number.isNaN(Date.parse(value));
const stamp=(when:Date,zone:string)=>{
  const fields=new Intl.DateTimeFormat('en-GB',{
    timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',
    hour:'2-digit',minute:'2-digit',hourCycle:'h23'
  }).formatToParts(when);
  const part=(key:string)=>fields.find(v=>v.type===key)?.value??'';
  return part('year')+'-'+part('month')+'-'+part('day')+'T'+part('hour')+':'+part('minute');
};

/** Pure projection of a reviewed reference. Null means malformed/past. */
export function officialCalendarItem(record:OfficialCalendarRecord,now=new Date()):OfficialCalendarItem|null{
  if(!dateValid(record.localDate)||!dateValid(record.verifiedAt)||
    !timestamp(record.utcKickoff)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(record.localTime)||
    !safeOfficialFixtureUrl(record.officialUrl)||!record.competition.trim()||
    !record.home.trim()||!record.away.trim()||
    normalizeTeam(record.home)===normalizeTeam(record.away))return null;
  const kickoff=new Date(record.utcKickoff);
  if(kickoff.getTime()<=now.getTime())return null;
  try{
    if(stamp(kickoff,record.timezone)!==record.localDate+'T'+record.localTime)return null;
  }catch{return null;}
  const br=brasiliaDate(kickoff);
  const checkedOn=brasiliaDate(now).date;
  if(record.verifiedAt>checkedOn)return null;
  const fresh=officialSnapshotFreshAt(record.verifiedAt,checkedOn);
  return {
    fixture:{
      id:['official',record.id,br.date,
        normalizeTeam(record.home),normalizeTeam(record.away)].join('|'),
      date:br.date,time:fresh?br.time:null,competition:record.competition,
      home:record.home,away:record.away,sourceUrl:record.officialUrl,
    },
    verifiedAt:record.verifiedAt,fresh
  };
}

/** Only a few manually checked fixtures; NO network fetch or auto-refresh. */
export function readOfficialCalendar(now=new Date()):OfficialCalendarItem[]{
  const entries:OfficialCalendarRecord[]=[...CBF_FIXTURES,...PREMIER_LEAGUE_FIXTURES,
    ...SERIE_A_ITALIANA_FIXTURES,...LA_LIGA_FIXTURES];
  for(const item of VERIFIED_EUROPE_FIXTURES){
    if(!fixtureWithOfficialTime(item,now))continue;
    const competition=WORK_LEAGUES[item.league];
    if(!competition)continue;
    entries.push({
      id:item.key,competition,home:item.home,away:item.away,
      localDate:item.localDate,localTime:item.localTime,
      timezone:item.timezone,utcKickoff:item.utcKickoff,
      officialUrl:item.officialUrl,verifiedAt:item.verifiedAt
    });
  }
  const unique=new Map<string,OfficialCalendarItem>();
  for(const record of entries){
    const item=officialCalendarItem(record,now);
    if(!item)continue;
    const f=item.fixture;
    const identity=[f.date,f.competition,normalizeTeam(f.home),normalizeTeam(f.away)].join('|');
    if(!unique.has(identity))unique.set(identity,item);
  }
  return [...unique.values()].sort((a,b)=>
    a.fixture.date.localeCompare(b.fixture.date)||
    (a.fixture.time??'99:99').localeCompare(b.fixture.time??'99:99')||
    a.fixture.home.localeCompare(b.fixture.home));
}

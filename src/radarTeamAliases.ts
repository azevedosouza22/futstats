import type {Data,Team} from './model';
import {normalizeTeam} from './calendar';
import {teamsInCompetition} from './radarTeamFilters';

/**
 * Conservative, competition-scoped aliases. Never fuzzily guess identity,
 * strip arbitrary club prefixes, merge competitions or change stored names.
 * Aliases here identify real naming variants, NOT a full football glossary.
 */
const EXPLICIT_ALIASES:Readonly<Record<string,Readonly<Record<string,string>>>>={
  'Brasileirão Série A':{
    'red bull bragantino':'rb bragantino',
    'bragantino':'rb bragantino',
    'cruzeiro esporte clube':'cruzeiro',
    'cruzeiro ec':'cruzeiro',
    'clube atletico mineiro':'atletico mg',
    'atletico mineiro':'atletico mg',
    'athletico paranaense':'athletico pr',
    'club athletico paranaense':'athletico pr',
    'sao paulo fc':'sao paulo',
    'sao paulo futebol clube':'sao paulo',
    'coritiba saf':'coritiba',
    'gremio fbpa':'gremio',
    'gremio foot ball porto alegrense':'gremio',
    'clube de regatas do flamengo':'flamengo',
    'sociedade esportiva palmeiras':'palmeiras',
    'santos fc':'santos',
    'esporte clube bahia':'bahia',
  },
  'Serie A italiana 2026/27':{
    'ssc napoli':'napoli',
    'societa sportiva calcio napoli':'napoli',
    'as roma':'roma',
    'associazione sportiva roma':'roma',
    'ac milan':'milan',
    'juventus fc':'juventus',
    'ss lazio':'lazio',
  },
  'La Liga espanhola 2026/27':{
    'fc barcelona':'barcelona',
    'futbol club barcelona':'barcelona',
    'real madrid cf':'real madrid',
    'real madrid club de futbol':'real madrid',
    'atletico de madrid':'atletico madrid',
    'club atletico de madrid':'atletico madrid',
  },
  'Ligue 1 francesa 2026/27':{
    'toulouse fc':'toulouse',
    'toulouse football club':'toulouse',
    'es troyes ac':'troyes',
    'estac troyes':'troyes',
    'es troyes aube champagne':'troyes',
    'paris saint germain fc':'paris saint germain',
  },
  // Only confirmed variants of DFL's club names in Bundesliga 2026/27.
  // Preserve stored CSV names; do not infer fuzzy matches or merge seasons.
  'Bundesliga 2026/27':{
    'fc bayern munchen':'bayern munich',
    'fc bayern munich':'bayern munich',
    'bayern munchen':'bayern munich',
    'bayer 04 leverkusen':'bayer leverkusen',
    'sport club freiburg':'sc freiburg',
    'sv werder bremen':'werder bremen',
    '1 fsv mainz 05':'mainz 05',
    'fsv mainz 05':'mainz 05',
    'fc schalke 04':'schalke 04',
    '1 fc union berlin':'union berlin',
    'fc union berlin':'union berlin',
    '1 fc koln':'fc koln',
    'fc koln':'fc koln',
    '1 fc cologne':'fc koln',
    'fc cologne':'fc koln',
    'eintracht frankfurt':'eintracht frankfurt',
    'borussia monchengladbach':'borussia monchengladbach',
    'sv elversberg':'sv elversberg',
    'sc paderborn 07':'sc paderborn 07',
    'vfb stuttgart':'vfb stuttgart',
    'tsg hoffenheim':'tsg hoffenheim',
    'rb leipzig':'rb leipzig',
  },
  'Premier League inglesa 2026/27':{
    'manchester united fc':'manchester united',
    'liverpool fc':'liverpool',
    'arsenal fc':'arsenal',
    'chelsea fc':'chelsea',
    'tottenham hotspur fc':'tottenham hotspur',
    'newcastle united fc':'newcastle united',
    'manchester city fc':'manchester city',
  }
};

/** Ignore accents and separators, not meaningful name words or club identity. */
export function basicTeamName(name:string):string{
  return normalizeTeam(name).replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
}
export function canonicalTeamInCompetition(name:string,competition:string):string{
  const normalized=basicTeamName(name);
  return EXPLICIT_ALIASES[competition.trim()]?.[normalized]??normalized;
}

/** Fail closed on zero or multiple eligible club IDs. */
export function resolveTeamInCompetition(data:Data,competition:string,name:string):Team|null{
  if(!name.trim()||!competition.trim())return null;
  const key=canonicalTeamInCompetition(name,competition);
  const matches=teamsInCompetition(data,competition).filter(t=>
    canonicalTeamInCompetition(t.name,competition)===key);
  return matches.length===1?matches[0]:null;
}

/**
 * Show the same known fixture only once even when an official programme calls
 * the clubs differently from a stored CSV. If unresolved, fall back to strict
 * normalized strings rather than treating a guess as a verified identity.
 */
export function calendarIdentity(data:Data,fixture:{
  date:string;competition:string;home:string;away:string
}):string{
  const competition=fixture.competition.trim();
  const home=resolveTeamInCompetition(data,competition,fixture.home);
  const away=resolveTeamInCompetition(data,competition,fixture.away);
  return [fixture.date,competition,
    home?'id:'+home.id:'name:'+basicTeamName(fixture.home),
    away?'id:'+away.id:'name:'+basicTeamName(fixture.away)
  ].join('|');
}

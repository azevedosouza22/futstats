import {brasiliaDate,normalizeTeam} from './calendar';
import {periodStats,type AutoFixture,type StatTeam} from './apiFootball';
import {unavailable,validData,type Data,type Match,type Stats} from './model';
import type {SavedRadarRecord} from './radarRecords';

/**
 * Prepare an FT result for a frozen pre-game forecast. No network or storage writes.
 * Never invent half-time data; do not modify a saved prediction or existing match.
 */
export function previewFootballResult(
  data:Data,records:SavedRadarRecord[],fixture:AutoFixture,
  full:StatTeam[],halves:StatTeam[],halfVerified:boolean,
) {
  if(fixture.status!=='FT')
    throw Error('Somente partidas encerradas no tempo regulamentar (FT) podem ser importadas.');
  if(!fixture.date||!Number.isFinite(Date.parse(fixture.date)))
    throw Error('A API não informou uma data válida para esta partida.');
  const day=brasiliaDate(new Date(fixture.date)).date;
  const names=[fixture.home.name,fixture.away.name];
  if(names.some(n=>!n?.trim())||names[0]===names[1])
    throw Error('Nomes das equipes ausentes ou inválidos na fonte.');
  if(fixture.goals.some(n=>!Number.isSafeInteger(n)||n===null||n<0))
    throw Error('Placar final indisponível ou inválido na fonte.');
  const matching=records.filter(r=>r.matchAt.slice(0,10)===day&&
    normalizeTeam(r.home)===normalizeTeam(names[0]!)&&
    normalizeTeam(r.away)===normalizeTeam(names[1]!));
  if(matching.length!==1)
    throw Error('É necessária exatamente uma previsão pré-jogo correspondente à data e às equipes. Nenhum dado foi alterado.');
  const prior=matching[0];
  if(prior.competition.trim()===''||!prior.venue?.length)
    throw Error('A previsão pré-jogo não possui dados V2/V3 válidos.');
  if(data.matches.some(m=>{
    const h=data.teams.find(t=>t.id===m.home)?.name??'';
    const a=data.teams.find(t=>t.id===m.away)?.name??'';
    return m.external?.provider==='api-football'&&m.external.id===String(fixture.id)||
      m.date===day&&normalizeTeam(h)===normalizeTeam(names[0]!)&&normalizeTeam(a)===normalizeTeam(names[1]!);
  }))throw Error('A partida já existe na base (ou há uma partida coincidente). Nenhuma duplicata será criada.');

  const sourceFull=periodStats(full,fixture,'statistics').values;
  if(fixture.home.id===fixture.away.id||full.filter(v=>v.team.id===fixture.home.id).length!==1||
    full.filter(v=>v.team.id===fixture.away.id).length!==1)
    throw Error('Estatísticas por equipe ausentes ou ambíguas. Importação cancelada.');

  const score=fixture.goals as [number,number];
  for(const side of [0,1] as const){
    if(sourceFull[side].goals!==null&&sourceFull[side].goals!==score[side])
      throw Error('Placar e estatísticas de gols não conferem na API.');
    sourceFull[side].goals=score[side];
  }
  const first=halfVerified?periodStats(halves,fixture,'statistics_1h').values:[unavailable(),unavailable()];
  const second=halfVerified?periodStats(halves,fixture,'statistics_2h').values:[unavailable(),unavailable()];
  const teams=data.teams.map(t=>({...t}));
  const findTeam=(name:string)=>{
    const existing=teams.find(t=>normalizeTeam(t.name)===normalizeTeam(name));
    if(existing)return existing.id;
    const id=crypto.randomUUID();teams.push({id,name,color:'#247855'});return id;
  };
  const home=findTeam(names[0]!),away=findTeam(names[1]!);
  const now=new Date().toISOString();
  const match:Match={
    id:crypto.randomUUID(),home,away,date:day,competition:prior.competition,
    first:first as [Stats,Stats],second:second as [Stats,Stats],
    external:{provider:'api-football',id:String(fixture.id),status:'FT',importedAt:now,
      full:sourceFull as [Stats,Stats]},
  };
  const next:Data={...data,teams,matches:[...data.matches,match]};
  if(!validData(next))
    throw Error('As estatísticas da fonte não passaram pela conferência de integridade. Nada será importado.');
  const available=([match.external!.full,match.first,match.second] as [Stats,Stats][])
    .map(p=>p.flatMap(s=>['goals','shots','target','corners'].filter(k=>s[k as keyof Stats]!==null)).length);
  return {
    data:next,match,forecast:prior,sourceLeague:fixture.league??'N/D',
    sourceCountry:fixture.country??'N/D',sourceId:fixture.id,
    availability:{full:available[0],first:available[1],second:available[2]},
  };
}

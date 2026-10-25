import {describe,it,expect} from 'vitest';
import {consultFreeAgenda} from './freeCalendarDiscovery';
import {EUROPE_LEAGUES} from './europeLeagueResearch';
import {OPENFOOTBALL_URL} from './openFootball';

const today=new Date('2026-10-25T12:00:00.000Z');
const mockResponse=(payload:unknown):Response=>({
  ok:true,status:200,headers:{get:()=>null},
  text:async()=>JSON.stringify(payload),
} as unknown as Response);
const euroPayload={matches:[
  {date:'2026-10-24',team1:'Old Home',team2:'Old Away'},
  {date:'2026-10-25',time:'21:00',team1:'Club A',team2:'Club B'},
  {date:'2026-10-25',time:'21:00',team1:'Club A',team2:'Club B'},
  {date:'2026-10-26',team1:'Completed',team2:'Finished',score:{ft:[1,0]}},
  {date:'2026-11-25',team1:'Far Away',team2:'Future'},
]};
const premierPayload={name:'English Premier League 2026/27',matches:[
  {round:'Matchday 10',date:'2026-10-25',time:'16:00',
   team1:'Home FC',team2:'Away FC'},
  {round:'Matchday 10',date:'2026-10-24',
   team1:'Old FC',team2:'Old Away'},
  {round:'Matchday 10',date:'2026-10-26',
   team1:'Finished',team2:'Team',score:{ft:[2,1]}}
]};
describe('consulta pontual de calendários gratuitos',()=>{
  it('consulta quatro ligas, evita duplicatas e nunca transforma horas da fonte em horário Brasília',async()=>{
    const requested:string[]=[];
    const get=(async (input:RequestInfo|URL)=>{
      const url=String(input);
      requested.push(url);
      return mockResponse(url===OPENFOOTBALL_URL?premierPayload:euroPayload);
    }) as typeof fetch;
    const result=await consultFreeAgenda(today,undefined,get);
    expect(result.errors).toEqual([]);
    expect(requested).toHaveLength(4);
    for(const league of EUROPE_LEAGUES)expect(requested).toContain(league.url);
    expect(requested).toContain(OPENFOOTBALL_URL);
    expect(result.candidates).toHaveLength(4);
    expect(new Set(result.candidates.map(x=>x.fixture.id)).size).toBe(4);
    expect(result.candidates.every(x=>x.fixture.time===null)).toBe(true);
    expect(result.candidates.every(x=>x.provisionalDate)).toBe(true);
    expect(result.candidates.every(x=>x.fixture.date==='2026-10-25')).toBe(true);
    expect(result.candidates.find(x=>x.fixture.competition==='Premier League inglesa 2026/27')?.fixture.home).toBe('Home FC');
  });
  it('retorna dados parciais e erros quando uma fonte falha, sem trocar os jogos válidos',async()=>{
    const bad=EUROPE_LEAGUES[0].url;
    const get=(async (input:RequestInfo|URL)=>{
      if(String(input)===bad)throw Error('rede indisponível');
      return mockResponse(String(input)===OPENFOOTBALL_URL?premierPayload:euroPayload);
    }) as typeof fetch;
    const result=await consultFreeAgenda(today,undefined,get);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('rede indisponível');
    expect(result.candidates).toHaveLength(3);
  });
  it('não aceita arquivos excessivos e reporta indisponibilidade',async()=>{
    const get=(async()=>({
      ok:true,status:200,headers:{get:()=>null},
      text:async()=>'{'.repeat(1_200_001),
    } as unknown as Response)) as typeof fetch;
    const result=await consultFreeAgenda(today,undefined,get);
    expect(result.candidates).toHaveLength(0);
    expect(result.errors).toHaveLength(4);
  });
});

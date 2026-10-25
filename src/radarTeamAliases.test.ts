import {describe,it,expect} from 'vitest';
import type {Data,Stats,Team,Match} from './model';
import type {ScheduledFixture} from './calendar';
import {basicTeamName,canonicalTeamInCompetition,resolveTeamInCompetition,calendarIdentity} from './radarTeamAliases';
import {resolveCalendarFixture} from './radarCalendarSelection';

const zero:Stats={goals:0,shots:0,target:0,corners:0,yellow:0,red:0};
const names:Record<string,string>={
  rb:'RB Bragantino',cr:'Cruzeiro',
  mg:'Atlético-MG',pr:'Athletico-PR',int:'Internacional',
  bar:'Barcelona',real:'Real Madrid',atlm:'Atlético Madrid',
  nap:'Napoli',rom:'Roma',toul:'Toulouse',troy:'Troyes',
};
const teams:Team[]=Object.entries(names).map(([id,name])=>({id,name,color:'#444'}));
function match(id:string,competition:string,home:string,away:string):Match{
  return {id,competition,home,away,date:'2026-10-01',
    first:[zero,zero],second:[zero,zero]};
}
const data:Data={teams,matches:[
  match('br1','Brasileirão Série A','rb','cr'),
  match('br2','Brasileirão Série A','mg','pr'),
  match('br3','Brasileirão Série A','int','cr'),
  match('es1','La Liga espanhola 2026/27','bar','real'),
  match('es2','La Liga espanhola 2026/27','atlm','real'),
  match('it1','Serie A italiana 2026/27','nap','rom'),
  match('fr1','Ligue 1 francesa 2026/27','toul','troy'),
]};
const f=(competition:string,home:string,away:string):ScheduledFixture=>({
  id:'fixture',competition,home,away,date:'2026-10-28',
  time:null,sourceUrl:'https://example.com/fixtures'
});
describe('identificação conservadora de clubes entre fontes',()=>{
  it('resolve aliases explícitos do Brasileirão sem confundir Athletico-PR com Atlético-MG',()=>{
    const competition='Brasileirão Série A';
    const rb=f(competition,'Red Bull Bragantino','Cruzeiro Esporte Clube');
    expect(resolveCalendarFixture(data,rb)).toMatchObject({
      homeId:'rb',awayId:'cr',time:'',hasKickoffTime:false
    });
    const minas=f(competition,'Clube Atlético Mineiro','Athletico Paranaense');
    expect(resolveCalendarFixture(data,minas)).toMatchObject({homeId:'mg',awayId:'pr'});
    expect(resolveTeamInCompetition(data,competition,'Atlético') ).toBeNull();
    expect(resolveTeamInCompetition(data,competition,'Inter')).toBeNull();
    expect(resolveTeamInCompetition(data,competition,'Athletico-PR')?.id).toBe('pr');
  });
  it('resolve aliases italianos, franceses e espanhóis apenas na competição correspondente',()=>{
    expect(resolveCalendarFixture(data,
      f('Serie A italiana 2026/27','SSC Napoli','AS Roma'))).toMatchObject({homeId:'nap',awayId:'rom'});
    expect(resolveCalendarFixture(data,
      f('Ligue 1 francesa 2026/27','Toulouse FC','ES Troyes AC'))).toMatchObject({homeId:'toul',awayId:'troy'});
    expect(resolveCalendarFixture(data,
      f('La Liga espanhola 2026/27','FC Barcelona','Real Madrid CF'))).toMatchObject({homeId:'bar',awayId:'real'});
    expect(resolveCalendarFixture(data,
      f('Brasileirão Série A','FC Barcelona','Real Madrid CF'))).toBeNull();
    expect(resolveCalendarFixture(data,
      f('La Liga espanhola 2025/26','FC Barcelona','Real Madrid CF'))).toBeNull();
  });
  it('mantém todos os dados e clubes originais sem reescrever IDs',()=>{
    const before=JSON.stringify(data);
    expect(basicTeamName('  Atlético–MG ')).toBe('atletico mg');
    expect(canonicalTeamInCompetition('Real Madrid CF','La Liga espanhola 2026/27')).toBe('real madrid');
    resolveCalendarFixture(data,f('Brasileirão Série A','Red Bull Bragantino','Cruzeiro'));
    expect(JSON.stringify(data)).toBe(before);
  });
  it('recusa homônimos e duplicatas de IDs diferentes na mesma competição, mesmo com nome exato',()=>{
    const duplicate:Data={
      teams:[...teams,{id:'rb2',name:'Bragantino',color:'#777'}],
      matches:[...data.matches,match('br4','Brasileirão Série A','rb2','cr')],
    };
    expect(resolveTeamInCompetition(duplicate,'Brasileirão Série A','RB Bragantino')).toBeNull();
    expect(resolveCalendarFixture(duplicate,
      f('Brasileirão Série A','Red Bull Bragantino','Cruzeiro'))).toBeNull();
  });
  it('une exibições da mesma partida por IDs de clubes já conhecidos',()=>{
    const league='La Liga espanhola 2026/27';
    const official=f(league,'FC Barcelona','Real Madrid CF');
    const local=f(league,'Barcelona','Real Madrid');
    expect(calendarIdentity(data,official)).toBe(calendarIdentity(data,local));
    expect(calendarIdentity(data,local)).not.toBe(
      calendarIdentity(data,{...local,date:'2026-10-29'}));
    expect(calendarIdentity(data,local)).not.toBe(
      calendarIdentity(data,{...local,competition:'La Liga espanhola 2025/26'}));
  });
  it('não elimina jogos diferentes sem identificação inequívoca',()=>{
    const known=f('Brasileirão Série A','RB Bragantino','Cruzeiro');
    const unknown=f('Brasileirão Série A','Clube Desconhecido','Cruzeiro');
    expect(calendarIdentity(data,known)).not.toBe(calendarIdentity(data,unknown));
    expect(resolveCalendarFixture(data,unknown)).toBeNull();
    expect(resolveCalendarFixture(data,{...known,sourceUrl:'javascript:alert(1)'})).toBeNull();
  });
});

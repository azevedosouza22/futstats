import {describe,expect,it} from 'vitest';
import {auditCornerPeriods,type CornerFixture,type CornerProvenance} from './cornerPeriodValidation';

const match:CornerFixture={matchId:'prem:fixture001',homeTeamId:'3',awayTeamId:'9',
 full:{home:3,away:2},firstHalf:{home:1,away:1},finished:true};
const source:CornerProvenance={
 provider:'Teste de contrato (sem dados reais)',
 sourceUrl:'https://example.org/match/fixture001',
 eventsComplete:true,reuseRights:'unreviewed'
};
const events=[
 {id:'a',matchId:'prem:fixture001',teamId:'3',half:1,minute:16,addedMinute:null},
 {id:'b',matchId:'prem:fixture001',teamId:'9',half:1,minute:45,addedMinute:3},
 {id:'c',matchId:'prem:fixture001',teamId:'3',half:2,minute:47,addedMinute:null},
 {id:'d',matchId:'prem:fixture001',teamId:'3',half:2,minute:90,addedMinute:4},
 {id:'e',matchId:'prem:fixture001',teamId:'9',half:2,minute:70,addedMinute:null}
];
describe('Auditoria de escanteios por tempo, sem inventar estatísticas',()=>{
 it('confere 1º/2º tempo e total, com acréscimos e fonte ainda não homologada',()=>{
   const x=auditCornerPeriods(match,events,source);
   expect(x.status).toBe('verified');
   expect(x.first).toEqual({home:1,away:1});
   expect(x.second).toEqual({home:2,away:1});
   expect(x.eligibleForImport).toBe(false);
 });
 it('bloqueia total discrepante, sem publicar números por período',()=>{
   const x=auditCornerPeriods({...match,full:{home:5,away:2}},events,source);
   expect(x.status).toBe('mismatch');expect(x.first).toBeNull();
   expect(x.second).toBeNull();expect(x.eligibleForImport).toBe(false);
 });
 it('bloqueia confronto ainda em andamento ou paginação incompleta',()=>{
   expect(auditCornerPeriods({...match,finished:false},events,source).status).toBe('incomplete');
   expect(auditCornerPeriods(match,events,{...source,eventsComplete:false}).status).toBe('incomplete');
 });
 it('rejeita eventos repetidos, sem período, com time errado ou sem minuto',()=>{
   for(const wrong of [
     [...events,events[0]],
     [{...events[0],half:undefined},...events.slice(1)],
     [{...events[0],teamId:'another team'},...events.slice(1)],
     [{...events[0],minute:undefined},...events.slice(1)],
     [{...events[0],matchId:'different'},...events.slice(1)],
   ])expect(auditCornerPeriods(match,wrong,source).status).toBe('invalid');
 });
 it('não transforma ausência em zero e exige primeiro tempo independente se disponível',()=>{
   expect(auditCornerPeriods({...match,firstHalf:{home:2,away:1}},events,source).status).toBe('mismatch');
   expect(auditCornerPeriods({...match,full:{home:0,away:0},firstHalf:{home:0,away:0}},[],source))
    .toMatchObject({status:'verified',first:{home:0,away:0},second:{home:0,away:0},eligibleForImport:false});
   expect(auditCornerPeriods({...match,full:{home:3,away:2}},[],source).status).toBe('mismatch');
 });
 it('somente torna elegível após conferência dos direitos de uso, sem importar automaticamente',()=>{
   const x=auditCornerPeriods(match,events,{...source,reuseRights:'reviewed'});
   expect(x.status).toBe('verified');
   expect(x.eligibleForImport).toBe(true);
   expect(auditCornerPeriods(match,events,{...source,reuseRights:'restricted'}).eligibleForImport).toBe(false);
 });
});

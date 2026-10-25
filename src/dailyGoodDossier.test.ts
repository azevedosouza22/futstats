import {describe,it,expect} from 'vitest';
import type {SavedRadarRecord} from './radarRecords';
import type {PickAuditReport,PickAuditRow} from './dailyGoodAudit';
import {DOCUMENTARY_COMPARISON_FORMAT} from './dailyGoodEvidenceCompare';
import {
 DOSSIER_FORMAT,DOSSIER_WARNING,createDocumentaryDossier,inspectDocumentaryDossier
} from './dailyGoodDossier';

const now=new Date('2026-10-26T17:00:00.000Z');
const record=():SavedRadarRecord=>({
 key:'before-kickoff-1',savedAt:'2026-10-25T16:00:00.000Z',
 matchAt:'2026-10-25T20:00:00',competition:'Liga X',
 home:'Casa',away:'Fora',homeCount:5,awayCount:5,
 markets:[],goodPicks:{
  verifiedAt:'2026-10-25',sourceUrl:'https://www.cbf.com.br/futebol-brasileiro/jogos/123',
  signals:[{id:'goals-full-2.5',label:'Gols',line:2.5,direction:'Under',
   projection:1.3,historicalMean:2.0,historicalSample:10,
   leagueSample:20,relativeDistance:0.48}]
 }
});
const local=():PickAuditRow=>({
 key:'before-kickoff-1',home:'Casa',away:'Fora',competition:'Liga X',
 matchAt:'2026-10-25T20:00:00',status:'scored',
 reason:'CSV local documentado, sem conferência externa',
 sourceUrl:'https://www.flashscore.com.br/jogo/?mid=csv-001',
 markets:[{id:'goals-full-2.5',label:'Gols',line:2.5,actual:2,
  direction:'Under',v2:'Acertou',v3:'Acertou',constantOver:'Errou',
  historicalBaseline:'Acertou',historicalMean:2.0,
  historicalSample:10,leagueSample:20}]
});
const report=(row=local()):PickAuditReport=>({
 snapshots:1,attributed:1,scoredFixtures:1,rows:[row],leagues:[]
});
const submitted=()=>({
 format:DOCUMENTARY_COMPARISON_FORMAT,recordKey:'before-kickoff-1',
 matchAt:'2026-10-25T20:00:00',competition:'Liga X',
 home:'Casa',away:'Fora',checkedAt:'2026-10-26T10:00:00.000Z',
 sourceUrl:'https://www.sofascore.com/pt/futebol/jogo/casa-fora/123',
 indicators:[{id:'goals-full-2.5',actual:2}]
});
describe('Etapa 46 — dossiê documental offline sem comprovação externa',()=>{
 it('exporta 1 snapshot, CSV local e fonte INFORMADA; reabre mantendo PENDENTE',async()=>{
  const records=[record()],audit=report(),provided=submitted();
  const before=JSON.stringify({records,audit,provided});
  const json=await createDocumentaryDossier(provided,records,audit,now);
  const d=JSON.parse(json);
  expect(d).toMatchObject({format:DOSSIER_FORMAT,
   originalRecord:{key:'before-kickoff-1'},
   localAuditRow:{status:'scored'},secondarySource:{recordKey:'before-kickoff-1'},
   comparison:{agreement:1,disagreement:0},
   independentVerification:'PENDENTE',warning:DOSSIER_WARNING
  });
  expect(d.sha256).toMatch(/^[a-f0-9]{64}$/);
  const reviewed=await inspectDocumentaryDossier(d,records,audit,now);
  expect(reviewed).toMatchObject({integrity:'CONSISTENTE',warning:DOSSIER_WARNING,
   comparison:{agreement:1,markets:[{status:'COINCIDE'}]}});
  expect(JSON.stringify({records,audit,provided})).toBe(before);
 });
 it('detecta alteração no arquivo com SHA-256, mesmo se mudou só valor local',async()=>{
  const file=JSON.parse(await createDocumentaryDossier(submitted(),[record()],report(),now));
  file.localAuditRow.markets[0].actual=8;
  await expect(inspectDocumentaryDossier(file,[record()],report(),now))
   .rejects.toThrow('SHA-256');
 });
 it('recusa alegar confirmação externa, incluir chaves extras ou mudar assinatura',async()=>{
  const file=JSON.parse(await createDocumentaryDossier(submitted(),[record()],report(),now));
  for(const change of [
   (d:Record<string,unknown>)=>{d.independentVerification='CONFIRMADO';},
   (d:Record<string,unknown>)=>{d.verified=true;},
   (d:Record<string,unknown>)=>{d.sha256='f'.repeat(64);}
  ]){
   const other=structuredClone(file);
   change(other);
   await expect(inspectDocumentaryDossier(other,[record()],report(),now))
    .rejects.toThrow();
  }
 });
 it('detecta que o dado ORIGINAL foi editado depois da exportação',async()=>{
  const file=JSON.parse(await createDocumentaryDossier(submitted(),[record()],report(),now));
  const changedRecord={...record(),homeCount:6};
  await expect(inspectDocumentaryDossier(file,[changedRecord],report(),now))
   .rejects.toThrow('não corresponde');
  const changedAudit=report({...local(),markets:[{...local().markets[0],actual:3}]});
  await expect(inspectDocumentaryDossier(file,[record()],changedAudit,now))
   .rejects.toThrow('não corresponde');
 });
 it('recusa importar documento sem previsão correspondente e data futura',async()=>{
  const file=JSON.parse(await createDocumentaryDossier(submitted(),[record()],report(),now));
  await expect(inspectDocumentaryDossier(file,[],{...report(),rows:[]},now))
   .rejects.toThrow();
  await expect(inspectDocumentaryDossier(file,[record()],report(),
   new Date('2026-10-25T17:00:00.000Z'))).rejects.toThrow();
 });
 it('não mascara divergência; uma segunda fonte informada diferente continua DIVERGE',async()=>{
  const evidence={...submitted(),indicators:[{id:'goals-full-2.5',actual:4}]};
  const file=JSON.parse(await createDocumentaryDossier(evidence,[record()],report(),now));
  const result=await inspectDocumentaryDossier(file,[record()],report(),now);
  expect(result.comparison).toMatchObject({agreement:0,disagreement:1,
   markets:[{local:2,reported:4,status:'DIVERGE'}]});
  expect(result.warning).toBe(DOSSIER_WARNING);
 });
});

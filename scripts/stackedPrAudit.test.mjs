import test from 'node:test';
import assert from 'node:assert/strict';
import {validateStackedPrChain} from './stackedPrAudit.mjs';
const repository='azevedosouza22/futstats',anchor='feat/v4-good-picks-saved-return';
const sha=n=>n.toString(16).padStart(40,'0');
function fixtures(){
 const pulls=Array.from({length:3},(_,i)=>({
  number:48+i,state:'open',draft:true,merged:false,merged_at:null,
  head:{ref:'feat/v4-stage-'+(48+i),sha:sha(i+20),repo:{full_name:repository}},
  base:{ref:i?'feat/v4-stage-'+(47+i):anchor,repo:{full_name:repository}}
 }));
 const comparisons=pulls.slice(1).map((p,i)=>({
  base:pulls[i].head.sha,head:p.head.sha,status:'ahead',
  ahead_by:2,behind_by:0
 }));
 return {pulls,comparisons,opts:{firstNumber:48,lastNumber:50,
  headSha:sha(22),repoFullName:repository}};
}
const verify=f=>validateStackedPrChain(f.pulls,f.comparisons,f.opts);
test('permite cadeia íntegra apenas para preparação, mantendo produção BLOQUEADA',()=>{
 const plan=verify(fixtures());
 assert.equal(plan.chainValid,true);
 assert.equal(plan.reviewed,3);assert.equal(plan.ancestryChecked,2);
 assert.equal(plan.productionRelease,'BLOQUEADA');
 assert.equal(plan.integrationAuthorized,false);
 assert.equal(plan.pending.length,4);
});
test('bloqueia PR fechado, mesclado ou retirado de rascunho',()=>{
 for(const mutation of [{state:'closed'},{draft:false},{merged:true},
  {merged_at:'2026-10-26T10:00:00Z'}]){
  const f=fixtures();Object.assign(f.pulls[1],mutation);
  assert.throws(()=>verify(f),/não está aberto e em rascunho/);
 }
});
test('não aceita número faltante, fora da ordem nem quantidade divergente',()=>{
 const f=fixtures();f.pulls.splice(1,1);
 assert.throws(()=>verify(f),/PR faltante/);
 const g=fixtures();g.pulls[1].number=52;
 assert.throws(()=>verify(g),/fora de ordem/);
});
test('recusa dependência base.ref errada, mesmo com commits aparentemente válidos',()=>{
 const f=fixtures();f.pulls[2].base.ref='main';
 assert.throws(()=>verify(f),/não deriva da branch anterior/);
 const g=fixtures();g.pulls[0].base.ref='main';
 assert.throws(()=>verify(g),/não deriva da branch anterior/);
});
test('bloqueia histórico divergente/behind mesmo que base.ref pareça correto',()=>{
 for(const cmp of [
  {status:'diverged',ahead_by:7,behind_by:1},
  {status:'behind',ahead_by:0,behind_by:2},
  {status:'identical',ahead_by:0,behind_by:0},
  {status:'ahead',ahead_by:2,behind_by:1}
 ]){
  const f=fixtures();Object.assign(f.comparisons[1],cmp);
  assert.throws(()=>verify(f),/não descende do SHA/);
 }
});
test('comparações antigas ou trocadas não comprovam ancestralidade',()=>{
 const f=fixtures();f.comparisons[0].head=sha(99);
 assert.throws(()=>verify(f),/comparação de commits não corresponde/);
 const g=fixtures();g.comparisons.pop();
 assert.throws(()=>verify(g),/falta verificar ancestralidade/);
});
test('bloqueia HEAD alterado, SHA inválido ou branch duplicada',()=>{
 const f=fixtures();f.opts.headSha=sha(100);
 assert.throws(()=>verify(f),/HEAD do PR atual mudou/);
 const g=fixtures();g.pulls[2].head.sha='invalid';
 assert.throws(()=>verify(g),/SHA de origem inválido/);
 const h=fixtures();h.pulls[2].head.ref=h.pulls[1].head.ref;
 assert.throws(()=>verify(h),/branch ou commit duplicado/);
});
test('impede origem de fork ou branch não experimental',()=>{
 const f=fixtures();f.pulls[2].head.repo.full_name='someone/fork';
 assert.throws(()=>verify(f),/outro repositório/);
 const g=fixtures();g.pulls[1].head.ref='production';
 assert.throws(()=>verify(g),/branch inválida/);
});

import {describe,it,expect} from 'vitest';
import {checkPublicResultPair,type PublicScoreObservation} from './publicResultCrosscheck';
import {PUBLIC_RESULT_PILOT} from './publicResultPilot';

const now=new Date('2026-10-26T23:30:00.000Z');
const get=(a:readonly PublicScoreObservation[]=PUBLIC_RESULT_PILOT)=>
 checkPublicResultPair(a,now);
const cloned=()=>PUBLIC_RESULT_PILOT.map(x=>({...x,full:[...x.full] as [number,number],
 half:x.half===null?null:[...x.half] as [number,number]}));
describe('Etapa 70 — primeiro resultado realmente revisado em duas páginas públicas',()=>{
 it('reconcilia La Liga e FC Barcelona, calcula só gols 2T e NÃO cria previsão',()=>{
  const before=JSON.stringify(PUBLIC_RESULT_PILOT);
  expect(get()).toEqual({
   status:'COINCIDE_DOCUMENTADO',
   date:'2026-10-25',competition:'La Liga espanhola 2026/27',
   home:'Barcelona',away:'Real Madrid',
   full:[1,2],half:[0,1],second:[1,1],
   secondPeriodMethod:'SUBTRACAO_ARITMETICA',
   missingMetrics:['finalizações','chutes no alvo','escanteios'],
   sources:PUBLIC_RESULT_PILOT.map(s=>({name:s.sourceName,url:s.sourceUrl,checkedDate:s.checkedDate})),
   registeredForecasts:0,eligibleForProspectiveCohort:false,
   externalAccuracy:'N/D',
   warning:'CASO PÚBLICO DOCUMENTADO — NÃO É PREVISÃO SALVA'
  });
  expect(JSON.stringify(PUBLIC_RESULT_PILOT)).toBe(before);
 });
 it('rejeita URL impostora, http, redirecionamento userinfo e duas origens iguais',()=>{
  const originals=cloned();
  for(const url of [
   'http://www.fcbarcelona.com/en/matches/123',
   'https://www.fcbarcelona.com.evil.invalid/matches/123',
   'https://www.fcbarcelona.com@evil.invalid/matches/123',
   'https://www.laliga.com/'
  ])expect(()=>get([originals[0],{...originals[1],sourceUrl:url}])).toThrow();
  expect(()=>get([originals[0],{...originals[0]}])).toThrow('mesmo domínio');
 });
 it('divergência do placar final/intervalo não vira confirmação nem resultado derivado',()=>{
  const original=cloned();
  const wrong:{full:[number,number];half:[number,number]}={full:[1,3],half:[0,1]};
  expect(get([original[0],{...original[1],...wrong}])).toMatchObject({
   status:'DIVERGENTE',full:null,half:null,second:null,
   eligibleForProspectiveCohort:false,externalAccuracy:'N/D'
  });
  expect(get([original[0],{...original[1],half:[1,1]}])).toMatchObject({
   status:'DIVERGENTE',second:null
  });
 });
 it('um intervalo não disponível é N/D, não supõe número nem 2T',()=>{
  const original=cloned();
  expect(get([original[0],{...original[1],half:null}])).toMatchObject({
   status:'COINCIDE_DOCUMENTADO',full:[1,2],half:null,second:null,
   secondPeriodMethod:'N/D'
  });
 });
 it('placar 0 real é possível mas valores negativos/futuros/datas inválidas não',()=>{
  const original=cloned();
  const blank=[0,0] as const;
  expect(get(original.map(x=>({...x,full:blank,half:blank})))).toMatchObject({
   full:[0,0],half:[0,0],second:[0,0]
  });
  for(const item of [
   {...original[1],full:[-1,2] as const},
   {...original[1],full:[1.5,2] as const},
   {...original[1],half:[2,1] as const},
   {...original[1],checkedDate:'2026-10-27'},
   {...original[1],date:'2026-02-31'}
  ])expect(()=>get([original[0],item])).toThrow();
  expect(()=>get([original[0]])).toThrow('duas');
 });
 it('origens da mesma data mas clubes diferentes são rejeitadas, nunca misturadas',()=>{
  const original=cloned();
  expect(()=>get([original[0],{...original[1],away:'Atlético de Madrid'}]))
   .toThrow('mesma partida');
 });
});

import {describe,expect,it} from 'vitest';
import {analyzeRadarDevice,type RadarDeviceProbe} from './radarDevicePreflight';

const ok:RadarDeviceProbe={
 viewportWidth:390,documentWidth:390,
 createButton:{width:165,height:120},savedButton:{width:165,height:120},
 storageReadable:true,invalidStorageGroups:0,
 randomUUIDAvailable:true,sha256Available:true
};
describe('Etapa 55 — teste read-only de interface em celular',()=>{
 it('aprova somente todas as seis verificações reais informadas',()=>{
  const report=analyzeRadarDevice(ok,new Date('2026-10-25T18:00:00Z'));
  expect(report).toMatchObject({status:'APTO_PARA_TESTE',passed:6,total:6,
   failed:0,disclaimer:'DIAGNÓSTICO LOCAL — NÃO É TESTE FÍSICO ANDROID'});
  expect(report.checkedAt).toBe('2026-10-25T18:00:00.000Z');
 });
 it('aponta tela global mais larga, sem esconder aviso de rolagem horizontal',()=>{
  const report=analyzeRadarDevice({...ok,documentWidth:430});
  expect(report).toMatchObject({status:'REVISAR',passed:5,failed:1});
  expect(report.checks[0]).toMatchObject({id:'viewport',ok:false});
 });
 it('aceita arredondamento subpixel de até 1px e recusa viewport inválido',()=>{
  expect(analyzeRadarDevice({...ok,documentWidth:391}).checks[0].ok).toBe(true);
  for(const width of [0,-1,NaN,Infinity]){
   expect(analyzeRadarDevice({...ok,viewportWidth:width}).checks[0].ok).toBe(false);
  }
 });
 it('exige área mínima real de 44px para os dois atalhos',()=>{
  for(const rect of [null,{width:43.9,height:50},{width:50,height:43.9}]){
   const report=analyzeRadarDevice({...ok,savedButton:rect});
   expect(report.checks[2]).toMatchObject({id:'touch_saved',ok:false});
  }
  expect(analyzeRadarDevice({...ok,createButton:{width:44,height:44}}).checks[1].ok)
   .toBe(true);
 });
 it('indica storage inválido, sem escrever/formatar dados',()=>{
  const report=analyzeRadarDevice({...ok,storageReadable:true,invalidStorageGroups:1});
  expect(report.checks[3]).toMatchObject({id:'storage',ok:false});
  expect(analyzeRadarDevice({...ok,storageReadable:false}).status).toBe('REVISAR');
 });
 it('recusa falta de UUID ou SHA256 e não afirma que Android físico foi testado',()=>{
  const report=analyzeRadarDevice({...ok,
   randomUUIDAvailable:false,sha256Available:false});
  expect(report).toMatchObject({status:'REVISAR',passed:4,failed:2});
  expect(report.checks[4].ok).toBe(false);
  expect(report.checks[5].ok).toBe(false);
  expect(report.disclaimer).toContain('NÃO É TESTE FÍSICO');
 });
});

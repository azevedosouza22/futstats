import {describe,it,expect} from 'vitest';
import {extract,identifyPeriod} from './parser';
import {enhancePixels} from './preprocess';
import {correctField,draftFromText} from './review';
// Text regression fixtures based on reported errors, not real screenshot OCR results.
describe('Precisão conservadora do OCR',()=>{
 it('preserva vírgula e ponto visíveis, inclusive separadores fragmentados',()=>{
  for(const decimal of ['1,71','1.71','1 , 71','1 . 71']){
   const e=extract(`JOGO\n${decimal} Gols esperados (xG) 0 , 09`);
   expect(e.values.map(v=>v.xg)).toEqual([1.71,.09]);
  }
 });
 it('171 em xG permanece N/D, sem inventar separador; outra coluna é preservada',()=>{
  const e=extract('JOGO\n171 xG 0.85');expect(e.values.map(v=>v.xg)).toEqual([null,.85]);expect(e.suspect).toContain('xg');expect(e.warnings.join(' ')).toContain('171');
  const d=correctField(draftFromText('a','JOGO\n171 xG 0.85'),'xg',0,1.71);expect(d.values[0].xg).toBe(1.71);expect(d.origins.xg[0]).toBe('corrected');
 });
 it('reconhece métricas comuns e valores separados do rótulo',()=>{
  const e=extract('2º TEMPO\n6 Total de finalizações 8\n3 Chutes a gol 2\n3 Escanteios 5\n61 % Posse de bola 39 %\n2 Chances claras 1');
  expect(e.values.map(s=>[s.shots,s.target,s.corners,s.possession,s.chances])).toEqual([[6,3,3,61,2],[8,2,5,39,1]]);
  expect(extract('JOGO\n13\nTotal de finalizações\n24').values.map(s=>s.shots)).toEqual([13,24]);
  expect(extract('JOGO\n13 Total de\nfinalizações 24').values.map(s=>s.shots)).toEqual([13,24]);
 });
 it('coluna ilegível explícita preserva N/D sem deslocar visitante',()=>{
  expect(extract('JOGO\nO Escanteios 5').values.map(s=>s.corners)).toEqual([null,5]);
  expect(extract('JOGO\n5 Escanteios ?').values.map(s=>s.corners)).toEqual([5,null]);
  expect(extract('JOGO\n5 Escanteios').values.map(s=>s.corners)).toEqual([null,null]);
 });
 it('identifica períodos abreviados mas não decide qual aba está ativa',()=>{
  expect(identifyPeriod('1°T')).toBe('first');expect(identifyPeriod('2 T')).toBe('second');
  expect(identifyPeriod('JOGO\n1º TEMPO\n2º TEMPO\nEncerrado')).toBeNull();
  expect(identifyPeriod('Finalizações no alvo 2')).toBeNull();
 });
 it('gols por período exigem placar explícito do período, não cabeçalho final',()=>{
  expect(extract('1º TEMPO\nPlacar do 1º tempo: 1 - 0').values.map(s=>s.goals)).toEqual([1,0]);
  expect(extract('2º TEMPO\nResultado do 2º tempo: 2 × 1').values.map(s=>s.goals)).toEqual([2,1]);
  expect(extract('1º TEMPO\nPlacar final: 3 - 1').values.map(s=>s.goals)).toEqual([null,null]);
  expect(extract('JOGO\nResultado final: 3 - 1').values.map(s=>s.goals)).toEqual([3,1]);
  expect(extract('JOGO\n3 - 1\nAo vivo').values.map(s=>s.goals)).toEqual([null,null]);
 });
 it('sinaliza posse inconsistente e alvo acima das finalizações, sem corrigir',()=>{
  const e=extract('JOGO\n5 Finalizações 8\n7 No alvo 3\n61% Posse 61%');
  expect(e.suspect).toEqual(expect.arrayContaining(['possession','shots','target']));expect(e.values[0].target).toBe(7);
 });
 it('rejeita negativos, frações de inteiros e rótulos desconhecidos',()=>{
  for(const row of ['-5 Escanteios 3','2.5 Escanteios 3','5 Finalizações bloqueadas 3'])expect(extract(row).values[0].corners).toBeNull();
  expect(extract('5 Finalizações bloqueadas 3').values[0].shots).toBeNull();
 });
 it('inverte fundo escuro e preserva tons intermediários e alfa',()=>{
  const pixels=new Uint8ClampedArray([20,20,20,255,20,20,20,255,100,100,100,255,230,230,230,255]);enhancePixels(pixels);
  expect(pixels[0]).toBe(255);expect(pixels[12]).toBe(0);expect(pixels[8]).toBeGreaterThan(0);expect(pixels[8]).toBeLessThan(255);expect(pixels[11]).toBe(255);
 });
 it('mantém fundo claro, pontuação escura e buffer de memória único',()=>{
  const pixels=new Uint8ClampedArray([255,255,255,255,255,255,255,255,0,0,0,255]);const original=pixels.buffer;enhancePixels(pixels);expect(pixels.buffer).toBe(original);expect(pixels[0]).toBe(255);expect(pixels[8]).toBe(0);enhancePixels(new Uint8ClampedArray());
 });
});

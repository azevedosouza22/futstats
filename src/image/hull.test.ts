import {describe,it,expect} from 'vitest';
import {extract} from './parser';
import {calculateDifferences,calculateTotals,draftFromText,mergeDrafts,saveImageMatch,inconsistencies,changePeriod,correctField} from './review';
import {validData} from '../model';
import {groupRows,redUnderlines,visualPeriod,type Word} from './spatial';
// User reference only; no original screenshots are available. Never loaded by the application.
const texts=[
 '1º TEMPO\n0 Gols 0\n5 Finalizações 10\n3 No alvo 3\n5 Escanteios 5\n43% Posse 57%\n0,55 xG 0,85\n1 Chances claras 4',
 '2º TEMPO\n2 Gols 2\n4 Finalizações 5\n2 No alvo 4\n2 Escanteios 1\n28% Posse 72%\n0,78 xG 0,86\n1 Chances claras 4',
 'JOGO\nHull 2 × 2 Everton\nEncerrado\n9 Finalizações 15\n5 No alvo 7\n7 Escanteios 6\n35% Posse 65%\n1,33 xG 1,71\n2 Chances claras 8'
];
const review=(indices:number[])=>mergeDrafts(indices.map(i=>draftFromText(String(i),texts[i]))).review;
const word=(text:string,x0:number,x1:number,confidence=95):Word=>({text,confidence,bbox:{x0,x1,y0:100,y1:120}});
const tabs=groupRows([word('JOGO',20,80),word('1º',140,160),word('TEMPO',170,240),word('2º',300,320),word('TEMPO',330,400)]);
describe('Hull × Everton — regressão de referência',()=>{
 it('interpreta todas as sete métricas nos três períodos, sem valores fixos de produção',()=>{
  const expected=[[[0,5,3,5,43,.55,1],[0,10,3,5,57,.85,4]],[[2,4,2,2,28,.78,1],[2,5,4,1,72,.86,4]],[[2,9,5,7,35,1.33,2],[2,15,7,6,65,1.71,8]]];
  texts.forEach((text,i)=>expect(extract(text).values.map(s=>[s.goals,s.shots,s.target,s.corners,s.possession,s.xg,s.chances])).toEqual(expected[i]));expect(inconsistencies(review([0,1,2]))).toEqual([]);
 });
 it('cada combinação de dois períodos determina o terceiro aditivo sob ação explícita',()=>{
  const first=calculateDifferences(review([1,2]),'first'),second=calculateDifferences(review([0,2])),full=calculateTotals(review([0,1]));
  expect(first.first.values.map(s=>[s.goals,s.shots,s.corners,s.chances])).toEqual([[0,5,5,1],[0,10,5,4]]);
  expect(second.second.values.map(s=>[s.goals,s.shots,s.corners,s.chances])).toEqual([[2,4,2,1],[2,5,1,4]]);
  expect(full.full.values.map(s=>[s.goals,s.shots,s.corners,s.chances])).toEqual([[2,9,7,2],[2,15,6,8]]);
  expect(first.first.origins.shots).toEqual(['calculated','calculated']);expect(first.full.origins.shots).toEqual(['recognized','recognized']);
  for(const [r,p] of [[first,'first'],[second,'second'],[full,'full']] as const){expect(r[p].values[0].possession).toBeNull();expect(r[p].values[0].xg).toBeNull();}
 });
 it('cálculo não substitui valores, não gera negativo e exige ambos os operandos',()=>{
  const r=review([1,2]);r.second.values[0].shots=20;expect(calculateDifferences(r,'first').first.values[0].shots).toBeNull();expect(inconsistencies(r).join(' ')).toContain('menor que 2º');
  r.full.values[1].corners=null;expect(calculateDifferences(r,'first').first.values[1].corners).toBeNull();const all=review([0,1,2]);expect(calculateDifferences(all,'first').first.origins.shots[0]).toBe('recognized');
 });
 it('backup conserva primeiro tempo calculado e rejeita proveniência incompatível',()=>{
  const r=calculateDifferences(review([1,2]),'first');
  const data=saveImageMatch({teams:[],matches:[]},{home:'Hull',away:'Everton',date:'2026-10-11',competition:''},r,true,{home:'corrected',away:'corrected',date:'corrected',competition:null});
  expect(validData(JSON.parse(JSON.stringify(data)))).toBe(true);expect(data.matches[0].image!.fields.first!.goals).toEqual(['calculated','calculated']);
  const wrong=structuredClone(data);wrong.matches[0].first[0].shots=99;expect(validData(wrong)).toBe(false);
 });
 it('placar final sozinho nunca define gols de nenhum tempo',()=>{
  for(const p of ['1º TEMPO','2º TEMPO'])expect(extract(`${p}\nHull 2 × 2 Everton\nEncerrado`).values.map(s=>s.goals)).toEqual([null,null]);
  expect(extract('1º TEMPO: (0 - 0)').values.map(s=>s.goals)).toEqual([0,0]);
  expect(extract('2º TEMPO: 2 - 2').values.map(s=>s.goals)).toEqual([2,2]);
 });
 it('reclassificar imagem não leva gols do cabeçalho final para um tempo',()=>{
  const draft=draftFromText('a','JOGO\nHull 2 × 2 Everton\nEncerrado');
  expect(changePeriod(draft,'first').values.map(s=>s.goals)).toEqual([null,null]);
  expect(changePeriod(correctField(draft,'goals',0,1),'second').values.map(s=>s.goals)).toEqual([1,null]);
  expect(changePeriod(draftFromText('b','JOGO\n2 Gols 2'),'second').values.map(s=>s.goals)).toEqual([2,2]);
 });
});
describe('Evidência visual conservadora do período',()=>{
 it('sublinhado único sob a aba identifica o período',()=>{
  expect(visualPeriod(tabs,[{x0:140,x1:240,y0:125,y1:129}])).toBe('first');
  expect(visualPeriod(tabs,[{x0:300,x1:400,y0:125,y1:129}])).toBe('second');
  expect(visualPeriod(tabs,[{x0:20,x1:80,y0:125,y1:129}])).toBe('full');
 });
 it('sem marca, duas marcas, linha muito longe ou OCR incerto exigem confirmação',()=>{
  expect(visualPeriod(tabs,[])).toBeNull();expect(visualPeriod(tabs,[{x0:140,x1:240,y0:125,y1:129},{x0:300,x1:400,y0:125,y1:129}])).toBeNull();
  expect(visualPeriod(tabs,[{x0:140,x1:240,y0:180,y1:184}])).toBeNull();expect(visualPeriod(groupRows([word('1º',140,160,20),word('TEMPO',170,240),word('JOGO',20,80)]),[{x0:140,x1:240,y0:125,y1:129}])).toBeNull();
 });
 it('texto agrupado mantém esquerda/direita sem ordenar por valor',()=>{
  expect(groupRows([word('10',300,320),word('Finalizações',80,200),word('5',10,20)])[0].text).toBe('5 Finalizações 10');
 });
 it('marca vermelha estreita é detectada, bloco vermelho não é sublinhado',()=>{
  const pixels=new Uint8ClampedArray(100*50*4);for(let y=10;y<14;y++)for(let x=20;x<70;x++){pixels[(y*100+x)*4]=230;pixels[(y*100+x)*4+3]=255;}
  expect(redUnderlines(pixels,100,50)).toEqual([{x0:20,x1:70,y0:10,y1:14}]);
  for(let y=14;y<40;y++)for(let x=20;x<70;x++)pixels[(y*100+x)*4]=230;expect(redUnderlines(pixels,100,50)).toEqual([]);
 });
 it('evidência visual de jogo completo permite placar final, sem afetar a leitura textual ambígua',()=>{
  const text='JOGO\n1º TEMPO\n2º TEMPO\nHull 2 × 2 Everton\nEncerrado';expect(extract(text).period).toBeNull();expect(extract(text,'full').values.map(s=>s.goals)).toEqual([2,2]);
 });
});

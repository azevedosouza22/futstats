import {describe,it,expect} from 'vitest';
import {identifyPeriod,extract} from './parser';
import {blankPeriod,correctField,draftFromText,mergeDrafts,inconsistencies,calculateDifferences,calculateTotals,possibleDuplicates,saveImageMatch,type Review} from './review';
import {average,metrics,stats,validData,type Data} from '../model';
import {pregameAverage} from '../pregame';
import {checkImage} from './ocr';
// Text references supplied by the user. These are NOT OCR outputs validated from real screenshots.
const a=[
 'Mandante: Hull City\nVisitante: Everton\nData: 11/10/2026\n1º TEMPO\n5 Total de finalizações 10\n3 Finalizações no alvo 3\n5 Escanteios 5',
 '2º TEMPO\n4 Total de finalizações 5\n2 Finalizações no alvo 4\n2 Escanteios 1',
 'JOGO\nHull City 2 × 2 Everton\nEncerrado\n9 Total de finalizações 15\n5 Finalizações no alvo 7\n7 Escanteios 6'
];
const b=['1º TEMPO\n7 Total de finalizações 16\n4 No alvo 4\n2 Escanteios 3','2º TEMPO\n6 Total de finalizações 8\n3 No alvo 2\n3 Escanteios 5','JOGO\nCrystal Palace 3 × 1 Nottingham Forest\nFT\n13 Total de finalizações 24\n7 No alvo 6\n5 Escanteios 8\n2 Cartões amarelos 2'];
const build=(texts:string[])=>mergeDrafts(texts.map((s,i)=>draftFromText(String(i),s))).review;
const empty:Data={teams:[],matches:[]};
const origins={home:'recognized',away:'recognized',date:'recognized',competition:null} as const;
describe('OCR: interpretação e revisão',()=>{
 it('reconhece períodos por texto e deixa abas ambíguas sem classificação',()=>{
  expect(identifyPeriod('1º TEMPO')).toBe('first');expect(identifyPeriod('2° TEMPO')).toBe('second');expect(identifyPeriod('JOGO')).toBe('full');
  expect(identifyPeriod('JOGO\n1º TEMPO\n2º TEMPO')).toBeNull();expect(identifyPeriod('estatísticas')).toBeNull();
 });
 it('caso A: equipes, data, valores por coluna e soma dos períodos',()=>{
  const r=build(a);expect(inconsistencies(r)).toEqual([]);expect(r.first.values.map(s=>s.shots)).toEqual([5,10]);expect(r.second.values.map(s=>s.target)).toEqual([2,4]);expect(r.full.values.map(s=>s.corners)).toEqual([7,6]);
  const e=extract(a[0]);expect(extract('INGLATERRA: Premier League').competition).toBe('Premier League');expect(e.home).toBe('Hull City');expect(e.date).toBe('2026-10-11');expect(r.full.values.map(s=>s.goals)).toEqual([2,2]);expect(r.first.values[0].goals).toBeNull();
 });
 it('caso B: dados dos dois tempos e totais, sem inventar data ou cartões dos tempos',()=>{
  const r=build(b);expect(inconsistencies(r)).toEqual([]);expect(r.full.values.map(s=>s.shots)).toEqual([13,24]);expect(r.full.values.map(s=>s.target)).toEqual([7,6]);expect(r.full.values.map(s=>s.corners)).toEqual([5,8]);expect(r.full.values.map(s=>s.yellow)).toEqual([2,2]);expect(r.first.values[0].yellow).toBeNull();expect(extract(b[2]).date).toBe('');
 });
 it('variações de rótulo, decimais e linhas quebradas; zero explícito é preservado',()=>{
  const e=extract('JOGO\n0 Red cards 1\n1,25 Gols esperados (xG) 0.78\n63.5% Posse de bola 36,5%\n3 Big chances 2\n5\nTotal shots\n8');
  expect(e.values[0].red).toBe(0);expect(e.values[0].xg).toBe(1.25);expect(e.values[1].possession).toBe(36.5);expect(e.values[0].chances).toBe(3);expect(e.values[0].shots).toBe(5);
 });
 it('campos ausentes, coluna única e números inválidos não se tornam zero',()=>{
  const e=extract('1º TEMPO\n5 Total shots\nO Cartões amarelos O\n150% Posse de bola 50%');
  expect(e.values[0].shots).toBeNull();expect(e.values[1].yellow).toBeNull();expect(e.values[0].possession).toBeNull();
 });
 it('não atribui placar do cabeçalho aos gols do primeiro ou segundo tempo',()=>{
  for(const p of ['1º TEMPO','2º TEMPO']){const e=extract(`${p}\nHull City 2 - 2 Everton\nEncerrado`);expect(e.values[0].goals).toBeNull();expect(e.headerScore).toEqual([2,2]);}
 });
 it('exige seleção de período e não confunde ordem das imagens',()=>{
  const ds=[draftFromText('first',a[2]),draftFromText('second',a[0])];const result=mergeDrafts(ds);expect(result.review.full.values[0].shots).toBe(9);expect(result.review.first.values[0].shots).toBe(5);
  expect(mergeDrafts([draftFromText('unknown','9 Total shots 15')]).errors.length).toBeGreaterThan(0);
 });
 it('marca divergência sem corrigir e permite correção manual rastreável',()=>{
  const drafts=a.map((s,i)=>draftFromText(String(i),s));drafts[1]=correctField(drafts[1],'shots',0,7);
  expect(inconsistencies(mergeDrafts(drafts).review).length).toBeGreaterThan(0);expect(drafts[1].origins.shots[0]).toBe('corrected');
  drafts[1]=correctField(drafts[1],'shots',0,4);expect(inconsistencies(mergeDrafts(drafts).review)).toEqual([]);
 });
 it('não soma posse ou xG; diferenças não são negativas, nem sobrescrevem extrações',()=>{
  const r=build([a[0],a[2]]);r.first.values[0].possession=40;r.full.values[0].possession=60;r.first.values[0].xg=1;r.full.values[0].xg=2;
  const result=calculateDifferences(r);expect(result.second.values[0].shots).toBe(4);expect(result.second.origins.shots[0]).toBe('calculated');expect(result.second.values[0].possession).toBeNull();expect(result.second.values[0].xg).toBeNull();
  r.full.values[0].shots=1;expect(calculateDifferences(r).second.values[0].shots).toBeNull();expect(inconsistencies(r).length).toBeGreaterThan(0);
  const both=build(a);expect(calculateDifferences(both).second.origins.shots[0]).toBe('recognized');
 });
 it('totais ausentes são calculados apenas sob chamada explícita',()=>{
  const r=build(a.slice(0,2));expect(r.full.values[0].shots).toBeNull();const result=calculateTotals(r);expect(result.full.values[0].shots).toBe(9);expect(result.full.origins.shots[0]).toBe('calculated');expect(result.full.values[0].goals).toBeNull();
 });
 it('imagens complementares do mesmo período são mescladas; valores divergentes exigem revisão',()=>{
  const ds=[draftFromText('1','JOGO\n9 Total shots 15'),draftFromText('2','JOGO\n5 Shots on target 7')];expect(mergeDrafts(ds).errors).toEqual([]);ds.push(draftFromText('3','JOGO\n10 Total shots 15'));expect(mergeDrafts(ds).errors.length).toBeGreaterThan(0);
 });
 it('não aceita formatos desconhecidos, arquivos vazios ou excessivos',()=>{
  expect(()=>checkImage(new File(['x'],'file.gif',{type:'image/gif'}))).toThrow();expect(()=>checkImage(new File([],'x.png',{type:'image/png'}))).toThrow();expect(()=>checkImage(new File([new Uint8Array(16*1024*1024)],'x.png',{type:'image/png'}))).toThrow();
 });
});
describe('OCR: base existente e backups',()=>{
 const info={home:'Hull City',away:'Everton',date:'2026-10-11',competition:''};
 it('revisão não confirmada não salva; inconsistências não salvam',()=>{
  expect(()=>saveImageMatch(empty,info,build(a),false,origins)).toThrow('Confirme');const r=build(a);r.second.values[0].shots=8;expect(()=>saveImageMatch(empty,info,r,true,origins)).toThrow();expect(empty.matches).toHaveLength(0);
 });
 it('round-trip JSON conserva valores, proveniência e médias; não conserva arquivos ou texto bruto',()=>{
  const d=saveImageMatch(empty,info,build(a),true,origins);const restored=JSON.parse(JSON.stringify(d));expect(validData(restored)).toBe(true);
  expect(stats(restored.matches[0],0,'full').shots).toBe(9);expect(stats(restored.matches[0],0,'first').goals).toBeNull();expect(average(restored.matches,d.teams[0].id,'full').values.corners).toBe(7);
  expect(pregameAverage(restored.matches,d.teams[0].id,5,'full','2026-10-12').values.shots).toBe(9);expect(pregameAverage(restored.matches,d.teams[0].id,5,'full','2026-10-11').count).toBe(0);
  expect(Object.keys(restored.matches[0].image)).not.toContain('images');expect(Object.keys(restored.matches[0].image)).not.toContain('text');
 });
 it('valores calculados persistem identificados; metadados não aditivos falsos são rejeitados',()=>{
  const r=calculateDifferences(build([a[0],a[2]]));const d=saveImageMatch(empty,info,r,true,origins);expect(validData(JSON.parse(JSON.stringify(d)))).toBe(true);expect(d.matches[0].image!.fields.second!.shots![0]).toBe('calculated');
  const invalid=structuredClone(d);invalid.matches[0].second[0].possession=10;invalid.matches[0].image!.fields.second!.possession=['calculated',null];expect(validData(invalid)).toBe(false);
 });
 it('duplicatas, inclusive ordem invertida, são identificadas sem sobrescrever',()=>{
  const d=saveImageMatch(empty,info,build(a),true,origins);expect(possibleDuplicates(d,info)).toHaveLength(1);expect(possibleDuplicates(d,{...info,home:'Everton',away:'Hull City'})).toHaveLength(1);
  expect(()=>saveImageMatch(d,info,build(a),true,origins)).toThrow('duplicata');expect(d.matches).toHaveLength(1);
 });
 it('aceita backups 1.0/2.0 sem campos novos e rejeita imagem sem proveniência',()=>{
  const old:Data={teams:[{id:'a',name:'A',color:'#123456'},{id:'b',name:'B',color:'#123456'}],matches:[{id:'1',home:'a',away:'b',date:'2026-01-01',competition:'Liga',first:[{goals:0,shots:2,target:1,corners:0,yellow:0,red:0},{goals:0,shots:0,target:0,corners:0,yellow:0,red:0}],second:[{goals:0,shots:0,target:0,corners:0,yellow:0,red:0},{goals:0,shots:0,target:0,corners:0,yellow:0,red:0}]}]};
  expect(validData(old)).toBe(true);expect(stats(old.matches[0],0,'full').possession).toBeNull();const d=saveImageMatch(empty,info,build(a),true,origins);d.matches[0].image!.fields.full!.shots![0]=null;expect(validData(d)).toBe(false);
 });
});

import {describe,it,expect} from 'vitest';
import {readHeaderText,spatialHeader} from './header';
import {readSummary,combineEvents} from './summary';
import {draftFromText,mergeDrafts,completeSecondGoals,correctField,saveImageMatch,possibleDuplicates} from './review';
import {groupRows,visualImageMode,cardMarkers,visualCardText,type Word} from './spatial';
import {validData} from '../model';
// User scores are references; additional labels/events are synthetic, not actual screenshots.
const levante=`ESPANHA: Competição de teste - Rodada 9
12.10.2026
Levante 3 × 3 Sevilla
Encerrado
SUMÁRIO
Intervalo: 0 - 1
15' Visitante Gol Jogador A
35' Mandante Cartão amarelo Jogador B
49' Mandante Gol Jogador C
60' Mandante Gol Jogador D
70' Mandante Gol Jogador E
65' Visitante Gol Jogador F
80' Visitante Gol Jogador G
50' Mandante Cartão amarelo Jogador H
51' Visitante Cartão amarelo Jogador I
52' Visitante Cartão amarelo Jogador J
53' Visitante Cartão amarelo Jogador K
54' Visitante Cartão amarelo Jogador L
55' Visitante Cartão amarelo Jogador M
56' Visitante Cartão amarelo Jogador N
70' Visitante Cartão vermelho Jogador O`;
const word=(text:string,x0:number,x1:number,y0=100,y1=120):Word=>({text,confidence:95,bbox:{x0,x1,y0,y1}});
describe('Cabeçalho e SUMÁRIO — importação assistida',()=>{
 it('preenche nomes, data completa, país, competição, rodada e final sem catálogo de equipes',()=>{
  const h=readHeaderText('ITÁLIA: Competição de teste - Rodada 7\n12.10.2026 18:00\nTorino 2 × 1 Udinese\nEncerrado');expect(h).toMatchObject({home:'Torino',away:'Udinese',date:'2026-10-12',country:'ITÁLIA',competition:'Competição de teste',round:'7',finalScore:[2,1]});
  expect(readHeaderText('Mandante: Hull  City\nVisitante: Everton').home).toBe('Hull City');
  expect(readHeaderText('FUTEBOL: ITÁLIA: Liga de teste - Rodada 7\nÁrbitro: John').country).toBe('ITÁLIA');
  expect(readHeaderText('Lotação: 30000\nÁrbitro: John').country).toBe('');expect(readHeaderText('ARGENTINA: Liga de teste').country).toBe('ARGENTINA');
 });
 it('equipes posicionadas à esquerda e direita do placar geram metadados sem trocar a ordem',()=>{
  const rows=groupRows([word('2 - 1',470,530),word('Torino',60,160,130,150),word('Udinese',820,950,130,150),word('SUMÁRIO',70,200,200,220)]);
  expect(spatialHeader(rows,1000)).toBe('Mandante: Torino\nVisitante: Udinese');
  expect(spatialHeader([...rows, ...groupRows([word('Outro',60,160,155,175),word('Nome',820,950,155,175)])],1000)).toBe('Mandante: Torino\nVisitante: Udinese');
 });
 it('sem ano não inventa data; placar ao vivo ou contraditório não vira final confiável',()=>{
  expect(readHeaderText('12/10\nTorino 2 - 1 Udinese\nAo vivo').date).toBe('');expect(readHeaderText('Torino 2 - 1 Udinese\nAo vivo').finalScore).toBeNull();
  expect(readHeaderText('Torino 2 - 1 Udinese\nPlacar final: 3 - 1\nEncerrado').finalScore).toBeNull();
  expect(readHeaderText('Levante 3 - 3 Sevilla\nEncerrado\nSUMÁRIO\nIntervalo\n0 - 1').finalScore).toEqual([3,3]);
  expect(readSummary('SUMÁRIO\nIntervalo\n0 - 1','Levante','Sevilla').interval).toEqual([0,1]);
 });
 it('Hull: final e intervalo conhecidos preenchem três placares; cartões ausentes continuam N/D',()=>{
  const r=mergeDrafts([draftFromText('a','Hull 2 × 2 Everton\n11/10/2026\nEncerrado\nSUMÁRIO\nIntervalo: 0 - 0')]).review;
  expect(r.first.values.map(v=>v.goals)).toEqual([0,0]);expect(r.second.values.map(v=>v.goals)).toEqual([2,2]);expect(r.full.values.map(v=>v.goals)).toEqual([2,2]);expect(r.second.origins.goals).toEqual(['calculated','calculated']);expect(r.full.values[0].yellow).toBeNull();
 });
 it('Torino: somente final 2×1 não inventa intervalo nem gols do segundo tempo',()=>{
  const r=mergeDrafts([draftFromText('a','Torino 2 × 1 Udinese\n12/10/2026\nEncerrado\nJOGO')]).review;
  expect(r.full.values.map(v=>v.goals)).toEqual([2,1]);expect(r.first.values[0].goals).toBeNull();expect(r.second.values[1].goals).toBeNull();
 });
 it('Levante: 0×1 no intervalo e 3×3 final produzem segundo 3×2 sem contar lista parcial',()=>{
  const draft=draftFromText('a',levante),r=mergeDrafts([draft]).review;expect(draft.kind).toBe('summary');
  expect(r.first.values.map(v=>v.goals)).toEqual([0,1]);expect(r.second.values.map(v=>v.goals)).toEqual([3,2]);expect(r.second.origins.goals).toEqual(['calculated','calculated']);expect(r.first.values[0].yellow).toBeNull();
 });
 it('Levante: cobertura confirmada produz cartões e zero somente com lista completa',()=>{
  const r=mergeDrafts([draftFromText('a',levante)],{first:true,second:true}).review;
  expect(r.first.values.map(v=>v.yellow)).toEqual([1,0]);expect(r.second.values.map(v=>v.yellow)).toEqual([1,6]);expect(r.full.values.map(v=>v.yellow)).toEqual([2,6]);
  expect(r.first.values.map(v=>v.red)).toEqual([0,0]);expect(r.second.values.map(v=>v.red)).toEqual([0,1]);expect(r.full.values.map(v=>v.red)).toEqual([0,1]);expect(r.full.origins.yellow).toEqual(['calculated','calculated']);
  expect(r.full.values[0].possession).toBeNull();expect(r.full.values[0].xg).toBeNull();
 });
 it('recortes repetidos não duplicam eventos; colisões suspeitas não geram totais',()=>{
  const summary=readSummary(levante,'Levante','Sevilla');expect(combineEvents([summary,summary]).events).toHaveLength(summary.events.length);
  const duplicate=draftFromText('b',"SUMÁRIO\n35' Mandante Cartão amarelo Outro jogador");const r=mergeDrafts([draftFromText('a',levante),duplicate],{first:true,second:true});expect(r.warnings.join(' ')).toContain('duplicados');expect(r.review.first.values[0].yellow).toBeNull();
 });
 it('acréscimos de 45 são primeiro tempo; anulados, ambiguidades e prorrogação não geram contagens',()=>{
  const s=readSummary("SUMÁRIO\n45+2' Mandante Gol A\n90+4' Visitante Cartão vermelho B\n49' Mandante Gol anulado C",'A team','B team');expect(s.events.map(e=>e.period)).toEqual(['first','second']);
  const r=mergeDrafts([draftFromText('a',"SUMÁRIO\n10' Jogador Cartão amarelo\nIntervalo: 0 - 0")],{first:true,second:true});expect(r.review.first.values[0].yellow).toBeNull();
  const extra=mergeDrafts([draftFromText('e','Levante 3 - 3 Sevilla\nEncerrado\nApós prorrogação\nSUMÁRIO\nIntervalo: 0 - 1')]);expect(extra.review.second.values[0].goals).toBeNull();
 });
 it('placar conflitante exige correção; correção manual mantém proveniência',()=>{
  const d=correctField(draftFromText('a','JOGO\n2 Gols 1'),'goals',0,3),r=mergeDrafts([d]);expect(r.review.full.origins.goals[0]).toBe('corrected');
  const conflicting=mergeDrafts([draftFromText('a','Hull 2 - 2 Everton\nEncerrado\nJOGO'),draftFromText('b','Hull 3 - 2 Everton\nEncerrado\nJOGO')]);expect(conflicting.conflicts).not.toHaveLength(0);
 });
 it('corrigir intervalo recalcula somente gols derivados; valores corrigidos não são substituídos',()=>{
  const r=mergeDrafts([draftFromText('a',levante)]).review;r.first.values[0].goals=1;expect(completeSecondGoals(r).second.values[0].goals).toBe(2);
  r.second.origins.goals[0]='corrected';r.second.values[0].goals=9;expect(completeSecondGoals(r).second.values[0].goals).toBe(9);
 });
 it('placares visíveis de eventos determinam quem marcou somente com incremento inequívoco',()=>{
  const s=readSummary("SUMÁRIO\nIntervalo: 0 - 1\n49' Jogador C (1 - 1)\n60' Jogador D (2 - 1)\n65' Jogador F (2 - 2)",'Levante','Sevilla');
  expect(s.events.map(e=>[e.metric,e.side,e.period])).toEqual([['goals',0,'second'],['goals',0,'second'],['goals',1,'second']]);
  expect(readSummary("SUMÁRIO\n65' Jogador F (2 - 2)",'Levante','Sevilla').events).toHaveLength(0);
 });
 it('intervalo lido como O e evento sem identidade ficam N/D, nunca zero automático',()=>{
  const r=mergeDrafts([draftFromText('a','Levante 3 - 3 Sevilla\nEncerrado\nSUMÁRIO\nIntervalo: O - 1')]);expect(r.review.first.values[0].goals).toBeNull();expect(r.review.second.values[0].goals).toBeNull();
  const s=readSummary("SUMÁRIO\n20' Gol Jogador Everton",'Hull','Everton');expect(s.events).toHaveLength(0);
 });
 it('backup preserva metadados e contagens sem imagens, nomes de jogadores ou texto OCR; duplicata não sobrescreve',()=>{
  const d=draftFromText('a',levante),r=mergeDrafts([d],{first:true,second:true}).review;
  const info={home:'Levante',away:'Sevilla',date:'2026-10-12',competition:'Competição de teste',country:'ESPANHA',round:'9'};
  const data=saveImageMatch({teams:[],matches:[]},info,r,true,{home:'recognized',away:'recognized',date:'recognized',competition:'recognized',country:'recognized',round:'recognized'});
  expect(validData(JSON.parse(JSON.stringify(data)))).toBe(true);expect(data.matches[0].country).toBe('ESPANHA');expect(JSON.stringify(data)).not.toContain('Jogador');expect(possibleDuplicates(data,info)).toHaveLength(1);expect(()=>saveImageMatch(data,info,r,true,{home:'recognized',away:'recognized',date:'recognized',competition:'recognized'})).toThrow('duplicata');
 });
 it('aba SUMÁRIO com sublinhado e outra aba legível é identificada; sem indicação é incerta',()=>{
  const rows=groupRows([word('SUMÁRIO',70,200),word('ESTATÍSTICAS',400,600)]);expect(visualImageMode(rows,[{x0:70,x1:200,y0:125,y1:129}])).toBe('summary');expect(visualImageMode(rows,[])).toBeNull();
 });
 it('ícone de cartão é associado a minuto e lado somente quando a forma e alinhamento são claros',()=>{
  const pixels=new Uint8ClampedArray(300*100*4);for(let y=30;y<54;y++)for(let x=70;x<82;x++){const i=(y*300+x)*4;pixels[i]=240;pixels[i+1]=210;pixels[i+2]=10;pixels[i+3]=255;}
  const markers=cardMarkers(pixels,300,100);expect(markers).toHaveLength(1);expect(markers[0].metric).toBe('yellow');
  const rows=groupRows([word("35'",10,40,32,52),word('Jogador',90,180,32,52)]);expect(visualCardText(rows,markers,300)).toContain("35' Mandante Cartão amarelo");expect(visualCardText([],markers,300)).toBe('');
 });
});

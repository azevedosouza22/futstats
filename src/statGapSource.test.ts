import {describe,it,expect} from 'vitest';
import {assessGapSource} from './statGapSource';

const source=(id:string)=>'https://www.flashscore.com.br/?mid='+id;
describe('Classificação conservadora de fontes das estatísticas',()=>{
 it('exige domínio permitido, HTTPS e ID da mesma partida antes de apresentar link',()=>{
  const result=assessGapSource(source('match_22'),'match_22',false);
  expect(result).toEqual({
    status:'linked-unchecked',sourceUrl:source('match_22'),
    sourceId:'match_22',mayOpenSource:true
  });
 });
 it('mesmo link válido com data divergente é revisão, nunca fonte confirmada',()=>{
  const result=assessGapSource(source('match_22'),'match_22',true);
  expect(result.status).toBe('needs-review');
  expect(result.mayOpenSource).toBe(true);
  expect(result.sourceUrl).toBe(source('match_22'));
 });
 it('mantém N/D e não gera link para jogo sem fonte cadastrada',()=>{
  expect(assessGapSource(undefined,undefined,false)).toMatchObject({
    status:'missing-source',sourceUrl:null,mayOpenSource:false
  });
  expect(assessGapSource(null,'match_22',true)).toMatchObject({
    status:'needs-review',sourceUrl:null,mayOpenSource:false
  });
 });
 it.each([
  'javascript:alert(1)',
  'http://www.flashscore.com.br/?mid=match_22',
  'https://flashscore.com.br.evil.example/?mid=match_22',
  'https://www.flashscore.com.br@evil.example/?mid=match_22',
  'https://www.flashscore.com.br/?mid=other',
  'https://www.flashscore.com.br/?mid=match_22&mid=match_22',
  'https://www.flashscore.com.br/?mid=match_22#redirect'
 ])('bloqueia URLs sem procedência segura (%s)',url=>{
  expect(assessGapSource(url,'match_22',false)).toMatchObject({
    status:'invalid-source',sourceUrl:null,mayOpenSource:false
  });
 });
 it('não aceita link sem ID confiável ou com ID de outra partida',()=>{
  expect(assessGapSource(source('match_22'),'invalid id',false).status).toBe('invalid-source');
  expect(assessGapSource(source('match_22'),'match_23',false).status).toBe('invalid-source');
  expect(assessGapSource(source('match_22'),null,false).status).toBe('invalid-source');
 });
});

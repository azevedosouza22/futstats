import {describe,it,expect} from 'vitest';
import {safeOfficialFixtureUrl,officialSnapshotFreshAt} from './officialSourceTrust';
describe('Etapa 40: confiança conservadora em fontes oficiais',()=>{
 it('reconhece domínios exatos das 6 fontes oficiais entre agenda e backup',()=>{
  for(const host of ['www.cbf.com.br','www.laliga.com','www.lfp.fr','www.asroma.com',
    'www.premierleague.com','www.legaseriea.it','credencial.cbf.com.br'])
   expect(safeOfficialFixtureUrl('https://'+host+'/fixture')).toBe(true);
 });
 it('rejeita http, subdomínios não aprovados, phishing por userinfo e links malformados',()=>{
  for(const url of ['http://www.laliga.com/event','https://www.laliga.com.evil.invalid/a',
    'https://www.legaseriea.it@evil.invalid/event','https://www.cbf.com.br@attacker.invalid/',
    'https://legaseriea.it/event','https://credencial.cbf.com.br.evil.invalid/x',
    'file:///tmp/results','not a url'])
    expect(safeOfficialFixtureUrl(url)).toBe(false);
 });
 it('permite verificação no mesmo dia ou até 2 dias antes do salvamento, nunca retroativamente',()=>{
  expect(officialSnapshotFreshAt('2026-10-25','2026-10-25')).toBe(true);
  expect(officialSnapshotFreshAt('2026-10-23','2026-10-25')).toBe(true);
  expect(officialSnapshotFreshAt('2026-10-22','2026-10-25')).toBe(false);
  expect(officialSnapshotFreshAt('2026-10-26','2026-10-25')).toBe(false);
  expect(officialSnapshotFreshAt('2026-02-30','2026-03-02')).toBe(false);
  expect(officialSnapshotFreshAt('2026-10-25','not-a-day')).toBe(false);
 });
});
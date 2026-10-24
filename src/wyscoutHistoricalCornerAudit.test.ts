import {describe,expect,it} from 'vitest';
import historicalSample from './__fixtures__/wyscoutCorners2017_fiveMatches.json';
import {auditWyscoutHistoricalCorners,normalizeWyscoutCornerEvents,type WyscoutHistoricalSpec} from './wyscoutHistoricalCornerAudit';

const sample=historicalSample.fixtures as WyscoutHistoricalSpec[];
describe('five verified real Wyscout 2017/18 match samples, no production insertion',()=>{
 it('keeps the 2017/18 season separate and validates four matches against independent totals',()=>{
  expect(sample).toHaveLength(5);
  const audits=sample.map(auditWyscoutHistoricalCorners);
  expect(audits.every(a=>a.competition==='English Premier League 2017/18')).toBe(true);
  expect(audits.map(a=>a.audit.status)).toEqual([
   'verified','verified','mismatch','verified','verified'
  ]);
  expect(audits.every(a=>!a.audit.eligibleForImport)).toBe(true);
 });
 it('preserves actual 1st and 2nd half corner events per side',()=>{
  const results=sample.map(auditWyscoutHistoricalCorners);
  expect(results[0].audit).toMatchObject({
   first:{home:2,away:6},second:{home:1,away:1},full:{home:3,away:7}});
  expect(results[1].audit).toMatchObject({
   first:{home:0,away:5},second:{home:7,away:3},full:{home:7,away:8}});
  expect(results[2].audit).toMatchObject({
   status:'mismatch',first:null,second:null,full:{home:5,away:0}});
  expect(results[3].audit).toMatchObject({
   first:{home:3,away:3},second:{home:3,away:0},full:{home:6,away:3}});
  expect(results[4].audit).toMatchObject({
   first:{home:3,away:2},second:{home:4,away:0},full:{home:7,away:2}});
 });
 it('uses the explicit period field and prevents duplicate/wrong team events',()=>{
  const first=sample[0],raw=first.corners[0];
  expect(normalizeWyscoutCornerEvents(first.id,[raw])[0]?.half).toBe(1);
  expect(()=>auditWyscoutHistoricalCorners({...first,corners:[...first.corners,first.corners[0]]}))
    .not.toThrow();
  expect(auditWyscoutHistoricalCorners({...first,corners:[...first.corners,first.corners[0]]}).audit.status)
    .toBe('invalid');
  expect(()=>normalizeWyscoutCornerEvents(first.id,[{...raw,matchPeriod:'E1'}])).toThrow();
  expect(()=>normalizeWyscoutCornerEvents(first.id,[{...raw,matchId:999}])).toThrow();
 });
 it('the extracted sample contains actual matches and has stable published provenance',()=>{
  expect(sample.reduce((s,m)=>s+m.corners.length,0)).toBe(47);
  expect(sample.every(m=>m.sourceUrl.includes('wyscout-soccer-match-event-dataset'))).toBe(true);
  expect(sample.every(m=>m.sourceEventTotal>1000)).toBe(true);
  expect(historicalSample.license).toContain('CC BY 4.0');
 });
});

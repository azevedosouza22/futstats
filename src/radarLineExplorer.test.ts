import {describe,it,expect} from 'vitest';
import type {Data,Match,Stats} from './model';
import {compareRadarLines} from './radarLineExplorer';
import {parseRadarRecords} from './radarRecords';

const st=(goals:number,shots:number,target:number|null,corners:number|null):Stats=>({
  goals,shots,target,corners,yellow:0,red:0
});
const z=():Stats=>st(0,0,0,0);
const game=(id:string,date:string,home:string,away:string,shot:number,corner:number|null):Match=>({
  id,date,home,away,competition:'Bundesliga 2026/27',
  first:[st(1,shot,2,corner),st(1,shot,2,corner)],second:[z(),z()]
});
const fixture={home:'A',away:'B',date:'2026-10-25',competition:'Bundesliga 2026/27'};
describe('compareRadarLines',()=>{
  it('counts distinct preceding matches only and keeps lines consistent',()=>{
    const first=game('1','2026-10-10','A','B',12,4);
    const data:Data={teams:[],matches:[
      first,
      game('1','2026-10-11','A','B',100,50),
      game('2','2026-10-12','A','C',10,3),
      game('3','2026-10-13','D','B',14,5),
      game('4','2026-10-25','A','B',100,50),
      {...game('5','2026-10-09','A','B',100,50),competition:'Bundesliga 2025/26'},
    ]};
    const groups=compareRadarLines(data,fixture);
    expect(groups.map(g=>g.metric)).toEqual(['goals','shots','target','corners']);
    const corner=groups.find(g=>g.metric==='corners')!;
    expect(corner.observed).toBe(3);
    expect(corner.historicalMean).toBe(8);
    expect(corner.lines.find(l=>l.line===8.5)?.overs).toBe(1);
    expect(corner.lines.find(l=>l.line===6.5)?.overs).toBe(2);
    expect(groups.find(g=>g.metric==='shots')?.historicalMean).toBe(24);
    for(const g of groups)for(let i=1;i<g.lines.length;i++)
      expect(g.lines[i].overs).toBeLessThanOrEqual(g.lines[i-1].overs);
  });
  it('uses N/D when totals are incomplete',()=>{
    const only=game('1','2026-10-20','A','B',7,null);
    const corners=compareRadarLines({teams:[],matches:[only]},fixture).find(g=>g.metric==='corners')!;
    expect(corners.observed).toBe(0);
    expect(corners.historicalMean).toBeNull();
    expect(corners.lines.every(l=>l.overs===0)).toBe(true);
  });
});

describe('snapshot compatibility',()=>{
  const entry={
    key:'first',savedAt:'2026-10-24T12:00:00.000Z',matchAt:'2026-10-25T20:00:00',
    competition:'Bundesliga 2026/27',home:'A',away:'B',
    homeCount:1,awayCount:1,markets:[],
  };
  it('accepts legacy records unchanged',()=>{
    expect(parseRadarRecords([entry])[0]).toEqual(entry);
  });
  it('preserves the optional frozen explorer and rejects invalid numerators',()=>{
    const groups=compareRadarLines({teams:[],matches:[game('1','2026-10-21','A','B',7,4)]},fixture);
    const loaded=parseRadarRecords([{...entry,lineExploration:groups}])[0];
    expect(loaded.lineExploration).toEqual(groups);
    const bad=structuredClone(groups);bad[3].lines[0].overs=999;
    expect(()=>parseRadarRecords([{...entry,lineExploration:bad}])).toThrow();
  });
});

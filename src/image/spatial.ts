import {identifyPeriod} from './parser';
import type {Period} from '../model';
export type Box={x0:number;y0:number;x1:number;y1:number};
export type Word={text:string;confidence:number;bbox:Box};
export type Row={text:string;bbox:Box;words:Word[]};
export function groupRows(words:Word[]):Row[]{
 const heights=words.map(w=>w.bbox.y1-w.bbox.y0).sort((a,b)=>a-b);
 const threshold=Math.max(5,(heights[Math.floor(heights.length/2)]??12)*.65);
 const rows:{y:number;words:Word[]}[]=[];
 for(const word of [...words].sort((a,b)=>(a.bbox.y0+a.bbox.y1)-(b.bbox.y0+b.bbox.y1))){
  const y=(word.bbox.y0+word.bbox.y1)/2,row=rows.find(r=>Math.abs(r.y-y)<threshold);
  if(row){row.y=(row.y*row.words.length+y)/(row.words.length+1);row.words.push(word);}else rows.push({y,words:[word]});
 }
 return rows.sort((a,b)=>a.y-b.y).map(r=>{const words=r.words.sort((a,b)=>a.bbox.x0-b.bbox.x0);return {words,text:words.map(w=>w.text).join(' '),bbox:{x0:Math.min(...words.map(w=>w.bbox.x0)),x1:Math.max(...words.map(w=>w.bbox.x1)),y0:Math.min(...words.map(w=>w.bbox.y0)),y1:Math.max(...words.map(w=>w.bbox.y1))}};});
}
// Original RGB, before grayscale: only narrow red horizontal marks, not text color.
export function redUnderlines(pixels:Uint8ClampedArray,width:number,height:number):Box[]{
 const regions:Box[]=[];
 for(let y=0;y<height;y++){
  let start=-1;
  for(let x=0;x<=width;x++){
   const i=(y*width+x)*4,red=x<width&&pixels[i]>140&&pixels[i]>pixels[i+1]*1.5&&pixels[i]>pixels[i+2]*1.35&&pixels[i]-pixels[i+1]>60;
   if(red&&start<0)start=x;
   if(!red&&start>=0){if(x-start>=20){const old=regions.find(r=>r.y1===y&&Math.abs(r.x0-start)<=2&&Math.abs(r.x1-x)<=2);if(old)old.y1=y+1;else if(regions.length<1000)regions.push({x0:start,x1:x,y0:y,y1:y+1});}start=-1;}
  }
 }
 return regions.filter(r=>r.y1-r.y0<=12&&r.x1-r.x0>=4*(r.y1-r.y0));
}
export function visualPeriod(rows:Row[],underlines:Box[]):Period|null{
 const candidates=new Set<Period>();
 for(const row of rows){
  const tabs:{period:Period;box:Box}[]=[];
  for(let i=0;i<row.words.length;i++){
   const word=row.words[i];if(word.confidence<70)continue;
   let period=identifyPeriod(word.text),box=word.bbox;
   if(!period&&row.words[i+1]?.confidence>=70){const next=row.words[i+1];period=identifyPeriod(`${word.text} ${next.text}`);if(period){box={...box,x1:next.bbox.x1,y1:Math.max(box.y1,next.bbox.y1)};i++;}}
   if(period)tabs.push({period,box});
  }
  if(new Set(tabs.map(t=>t.period)).size<2)continue;
  const active=tabs.filter(({box})=>underlines.some(u=>{
   const w=box.x1-box.x0,h=box.y1-box.y0,uw=u.x1-u.x0;
   return u.y0>=box.y1-h*.25&&u.y0-box.y1<=h&&uw>=w*.6&&uw<=w*1.8&&Math.abs((u.x0+u.x1-box.x0-box.x1)/2)<=Math.max(8,w*.15);
  }));
  if(active.length>1)return null;
  if(active.length===1)candidates.add(active[0].period);
 }
 return candidates.size===1?[...candidates][0]:null;
}

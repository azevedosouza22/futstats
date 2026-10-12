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
export type ImageMode=Period|'summary';
export type CardMarker={box:Box;metric:'yellow'|'red'};
export function cardMarkers(pixels:Uint8ClampedArray,width:number,height:number):CardMarker[]{
 const regions:CardMarker[]=[];
 for(let y=0;y<height;y++){
  let start=-1,color:'yellow'|'red'|null=null;
  for(let x=0;x<=width;x++){
   const i=(y*width+x)*4,r=pixels[i],g=pixels[i+1],b=pixels[i+2];
   const next=x<width?(r>170&&g>130&&b<100?'yellow':r>160&&g<100&&b<110?'red':null):null;
   if(next!==color){if(color&&x-start>=6){const old=regions.find(m=>m.metric===color&&m.box.y1===y&&Math.abs(m.box.x0-start)<=1&&Math.abs(m.box.x1-x)<=1);if(old)old.box.y1=y+1;else if(regions.length<1000)regions.push({metric:color,box:{x0:start,x1:x,y0:y,y1:y+1}});}start=x;color=next;}
  }
 }
 return regions.filter(({box})=>{const w=box.x1-box.x0,h=box.y1-box.y0;return h>=12&&h<=64&&w/h>=.35&&w/h<=.85;});
}
export function visualCardText(rows:Row[],markers:CardMarker[],width:number):string{
 const events:string[]=[];
 for(const {box,metric} of markers){
  const near=rows.filter(row=>Math.abs((row.bbox.y0+row.bbox.y1-box.y0-box.y1)/2)<=Math.max(8,(box.y1-box.y0)*.7)&&row.words.some(w=>/^\d{1,3}(?:\+\d{1,2})?['’]?$/.test(w.text)&&w.confidence>=70));
  if(near.length!==1||/cart[aã]o|yellow|red card|tarjeta/i.test(near[0].text))continue;
  const row=near[0],minutes=row.words.filter(w=>/^\d{1,3}(?:\+\d{1,2})?['’]?$/.test(w.text)&&w.confidence>=70);
  if(minutes.length!==1)continue;
  const x=(box.x0+box.x1)/2,side=x<width*.48?'Mandante':x>width*.52?'Visitante':null;
  if(!side)continue;
  events.push(`${minutes[0].text.replace(/['’]/g,'')}' ${side} Cartão ${metric==='yellow'?'amarelo':'vermelho'} ${row.text}`);
 }
 return events.join('\n');
}
export function visualImageMode(rows:Row[],underlines:Box[]):ImageMode|null{
 const candidates=new Set<ImageMode>();
 for(const row of rows){
  const tabs:{period:ImageMode|'other';box:Box}[]=[];
  for(let i=0;i<row.words.length;i++){
   const word=row.words[i];if(word.confidence<70)continue;
   let period:ImageMode|'other'|null=/^(?:sum[aá]rio|summary)$/i.test(word.text)?'summary':/^(?:estat[ií]sticas|statistics|escala[cç][oõ]es)$/i.test(word.text)?'other':identifyPeriod(word.text),box=word.bbox;
   if(!period&&row.words[i+1]?.confidence>=70){const next=row.words[i+1];period=identifyPeriod(`${word.text} ${next.text}`);if(period){box={...box,x1:next.bbox.x1,y1:Math.max(box.y1,next.bbox.y1)};i++;}}
   if(period)tabs.push({period,box});
  }
  if(new Set(tabs.map(t=>t.period)).size<2)continue;
  const active=tabs.filter(({box})=>underlines.some(u=>{
   const w=box.x1-box.x0,h=box.y1-box.y0,uw=u.x1-u.x0;
   return u.y0>=box.y1-h*.25&&u.y0-box.y1<=h&&uw>=w*.6&&uw<=w*1.8&&Math.abs((u.x0+u.x1-box.x0-box.x1)/2)<=Math.max(8,w*.15);
  }));
  if(active.length>1)return null;
  if(active.length===1&&active[0].period!=='other')candidates.add(active[0].period);
 }
 return candidates.size===1?[...candidates][0]:null;
}
export function visualPeriod(rows:Row[],underlines:Box[]):Period|null{
 const mode=visualImageMode(rows,underlines);return mode==='summary'?null:mode;
}

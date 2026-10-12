/// <reference lib="webworker" />
import {createWorker, PSM, type Worker as OCRWorker} from 'tesseract.js';
import {groupRows,visualImageMode,visualCardText,type Box,type CardMarker} from './spatial';
import {spatialHeader} from './header';
import {extract,metricFromLine} from './parser';
import {readSummary} from './summary';
let engine: OCRWorker | null = null;
self.onmessage=async(event:MessageEvent<{blob:Blob;id:string;underlines:Box[];cards:CardMarker[]}>)=>{
 try {
  if(!engine)engine=await createWorker('por',1,{workerPath:new URL('/ocr/v6/worker.min.js',self.location.origin).href,corePath:new URL('/ocr/v6/core',self.location.origin).href,langPath:new URL('/ocr/v6/lang',self.location.origin).href,workerBlobURL:false,cacheMethod:'write',gzip:true,logger:m=>self.postMessage({type:'progress',progress:m.progress,status:m.status})});
  await engine.setParameters({tessedit_pageseg_mode:PSM.SINGLE_BLOCK});
  const {data}=await engine.recognize(event.data.blob,{}, {text:true,blocks:true});
  const words=data.blocks?.flatMap(b=>b.paragraphs.flatMap(p=>p.lines.flatMap(l=>l.words)))??[];
  const rows=groupRows(words),warnings:string[]=[];
  const mode=visualImageMode(rows,event.data.underlines);
  // At most four sequential line crops. No numeric whitelist, guessed digits or global second pass.
  let retries=0;
  const bitmap=await createImageBitmap(event.data.blob);const width=bitmap.width,height=bitmap.height;bitmap.close();
  for(const row of rows){
   const before=extract(row.text),k=metricFromLine(row.text);
   const intervalRow=/^(?:intervalo|ht|1\s*[º°o]?\s*tempo)\s*[:\s]/i.test(row.text)&&/[-–:]/.test(row.text);
   const missingInterval=intervalRow&&!readSummary(row.text,'','',true).interval;
   if((!k&&!missingInterval)||(k&&before.values.every(v=>v[k]!==null))||retries>=4)continue;
   retries++;
   self.postMessage({type:'progress',progress:0,status:'retrying row'});
   const margin=Math.ceil((row.bbox.y1-row.bbox.y0)*.6),top=Math.max(0,row.bbox.y0-margin);
   await engine.setParameters({tessedit_pageseg_mode:PSM.SINGLE_LINE});
   const {data:retry}=await engine.recognize(event.data.blob,{rectangle:{left:0,top,width,height:Math.min(height,row.bbox.y1+margin)-top}},{text:true});
   const after=extract(retry.text);
   if(missingInterval&&!k){if(retry.confidence>=60&&readSummary(retry.text,'','',true).interval)row.text=retry.text.trim();continue;}
   if(!k)continue;
   if(retry.confidence<60||!after.values.every(v=>v[k]!==null))continue;
   if(before.values.some((v,side)=>v[k]!==null&&v[k]!==after.values[side][k])){warnings.push('Releituras discordam em uma linha: confira os valores na imagem.');continue;}
   row.text=retry.text.trim();
  }
  const header=spatialHeader(rows,width);
  const cards=mode==='summary'?visualCardText(rows,event.data.cards,width):'';
  if(cards)warnings.push('Cartões sugeridos por ícones coloridos alinhados a minutos. Confira a equipe e a cobertura da lista do SUMÁRIO.');
  self.postMessage({type:'result',id:event.data.id,text:(rows.length?rows.filter(r=>!cards.split('\n').some(line=>line.endsWith(r.text))).map(r=>r.text).join('\n'):data.text)+(header?`\n${header}`:'')+(cards?`\n${cards}`:''),confidence:data.confidence,period:mode==='summary'?null:mode,summary:mode==='summary',warnings});
 }catch{self.postMessage({type:'error',id:event.data.id,error:'Não foi possível reconhecer a imagem. Verifique os arquivos do OCR, a conexão inicial e tente novamente.'});await engine?.terminate();engine=null;}
};

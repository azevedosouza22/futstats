/// <reference lib="webworker" />
import {createWorker, PSM, type Worker as OCRWorker, type Page} from 'tesseract.js';
let engine: OCRWorker | null = null;
function rowsFromPage(page: Page): string {
  const words=page.blocks?.flatMap(b=>b.paragraphs.flatMap(p=>p.lines.flatMap(l=>l.words)))??[];
  if(!words.length)return page.text;
  const heights=words.map(w=>w.bbox.y1-w.bbox.y0).sort((a,b)=>a-b);
  const threshold=Math.max(5,(heights[Math.floor(heights.length/2)]??12)*0.65);
  const rows:{y:number;words:typeof words}[]=[];
  for(const word of [...words].sort((a,b)=>(a.bbox.y0+a.bbox.y1)-(b.bbox.y0+b.bbox.y1))){
    const y=(word.bbox.y0+word.bbox.y1)/2;const row=rows.find(r=>Math.abs(r.y-y)<threshold);
    if(row)row.words.push(word);else rows.push({y,words:[word]});
  }
  return rows.map(r=>r.words.sort((a,b)=>a.bbox.x0-b.bbox.x0).map(w=>w.text).join(' ')).join('\n');
}
self.onmessage=async(event:MessageEvent<{blob:Blob;id:string}>)=>{
  try {
    if(!engine){engine=await createWorker('por',1,{workerPath:new URL('/ocr/v6/worker.min.js',self.location.origin).href,corePath:new URL('/ocr/v6/core',self.location.origin).href,langPath:new URL('/ocr/v6/lang',self.location.origin).href,workerBlobURL:false,cacheMethod:'write',gzip:true,logger:m=>self.postMessage({type:'progress',progress:m.progress,status:m.status})});await engine.setParameters({tessedit_pageseg_mode:PSM.SINGLE_BLOCK});}
    const {data}=await engine.recognize(event.data.blob,{}, {text:true,blocks:true});
    self.postMessage({type:'result',id:event.data.id,text:rowsFromPage(data),confidence:data.confidence});
  }catch{self.postMessage({type:'error',id:event.data.id,error:'Não foi possível reconhecer a imagem. Verifique os arquivos do OCR, a conexão inicial e tente novamente.'});await engine?.terminate();engine=null;}
};

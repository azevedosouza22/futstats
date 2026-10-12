import {enhancePixels} from './preprocess';
export const allowedTypes=['image/jpeg','image/png','image/webp'];
export function checkImage(file:File):void {
  if((file.type&&!allowedTypes.includes(file.type))||!(/\.(jpe?g|png|webp)$/i.test(file.name)))throw Error('Use um arquivo JPG, JPEG, PNG ou WebP.');
  if(!file.size||file.size>15*1024*1024)throw Error('Cada imagem deve ter conteúdo e no máximo 15 MB.');
}
export async function prepareImage(file:File):Promise<Blob> {
  checkImage(file);
  const bytes=new Uint8Array(await file.slice(0,16).arrayBuffer());
  const png=[137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n),jpg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255,webp=String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
  if(!png&&!jpg&&!webp)throw Error('O conteúdo não é uma imagem JPG, PNG ou WebP válida.');
  const bitmap=await createImageBitmap(file).catch(()=>{throw Error('Imagem inválida ou corrompida. Selecione outro arquivo.');});
  const canvas=document.createElement('canvas');
  try {
    if(!bitmap.width||!bitmap.height||bitmap.width*bitmap.height>40000000)throw Error('Imagem muito grande. Recorte a área de estatísticas antes de selecionar.');
    const desired=Math.min(2,Math.max(1,1000/bitmap.width));
    const scale=Math.min(desired,1600/bitmap.width,3200/bitmap.height,Math.sqrt(4000000/(bitmap.width*bitmap.height)));
    canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
    const context=canvas.getContext('2d');if(!context)throw Error('Seu navegador não conseguiu preparar a imagem.');
    context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(bitmap,0,0,canvas.width,canvas.height);
    const pixels=context.getImageData(0,0,canvas.width,canvas.height);
    enhancePixels(pixels.data);context.putImageData(pixels,0,0);
    return await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Falha ao preparar a imagem.')),'image/png'));
  }finally{bitmap.close();canvas.width=1;canvas.height=1;}
}
export type OcrResult={text:string;confidence:number};
export class LocalOcr {
  private worker:Worker|null=new Worker(new URL('./ocr.worker.ts',import.meta.url),{type:'module'});
  private reject:((e:Error)=>void)|null=null;
  async read(blob:Blob,id:string,onProgress:(value:number,status:string)=>void):Promise<OcrResult> {
    if(!this.worker)throw Error('Leitura cancelada.');
    return new Promise((resolve,reject)=>{
      this.reject=reject;
      this.worker!.onerror=()=>{this.reject=null;reject(Error('O mecanismo OCR falhou. Recarregue o aplicativo ou tente uma imagem menor.'));};
      this.worker!.onmessage=e=>{
        if(e.data.type==='progress')onProgress(e.data.progress,e.data.status);
        if(e.data.type==='result'&&e.data.id===id){this.reject=null;resolve({text:e.data.text,confidence:e.data.confidence});}
        if(e.data.type==='error'&&e.data.id===id){this.reject=null;reject(Error(e.data.error));}
      };
      this.worker!.postMessage({blob,id});
    });
  }
  cancel():void {this.worker?.terminate();this.worker=null;this.reject?.(new Error('Leitura cancelada.'));this.reject=null;}
}

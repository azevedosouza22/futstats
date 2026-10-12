// Mutates the bounded canvas buffer; no additional full-size image allocation.
// Keep antialiasing and decimal punctuation (no binary threshold or erosion).
export function enhancePixels(pixels: Uint8ClampedArray): void {
  const histogram=new Uint32Array(256);
  for(let i=0;i<pixels.length;i+=4){const gray=Math.round(.299*pixels[i]+.587*pixels[i+1]+.114*pixels[i+2]);histogram[gray]++;}
  const count=pixels.length/4;
  if(!count)return;
  let sum=0,low=0,high=255,median=255;
  for(let v=0;v<256;v++){sum+=histogram[v];if(sum>=count*.02){low=v;break;}}
  sum=0;for(let v=255;v>=0;v--){sum+=histogram[v];if(sum>=count*.02){high=v;break;}}
  sum=0;for(let v=0;v<256;v++){sum+=histogram[v];if(sum>=count*.5){median=v;break;}}
  const invert=median<110,range=high-low;
  for(let i=0;i<pixels.length;i+=4){
    let gray=.299*pixels[i]+.587*pixels[i+1]+.114*pixels[i+2];
    if(range>=40)gray=Math.max(0,Math.min(255,(gray-low)*255/range));
    if(invert)gray=255-gray;
    pixels[i]=pixels[i+1]=pixels[i+2]=gray;
  }
}

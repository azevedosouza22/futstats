import {mkdir, copyFile} from 'node:fs/promises';
const target='public/ocr/v6';
await mkdir(`${target}/core`,{recursive:true});await mkdir(`${target}/lang`,{recursive:true});
await copyFile('node_modules/tesseract.js/dist/worker.min.js',`${target}/worker.min.js`);
for(const prefix of ['tesseract-core-lstm','tesseract-core-simd-lstm'])for(const suffix of ['wasm.js','wasm'])await copyFile(`node_modules/tesseract.js-core/${prefix}.${suffix}`,`${target}/core/${prefix}.${suffix}`);
await copyFile('node_modules/@tesseract.js-data/por/4.0.0_best_int/por.traineddata.gz',`${target}/lang/por.traineddata.gz`);

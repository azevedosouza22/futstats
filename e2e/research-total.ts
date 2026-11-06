import {readFileSync} from 'node:fs';
import {join} from 'node:path';

/** The public catalog total comes from the reviewed manifest, not a stale
 * hard-coded E2E expectation. The base 951+68 is separately integrity-tested.
 */
const manifest=JSON.parse(readFileSync(join(process.cwd(),
 'public/research/packs/manifest-v1.json'),'utf8')) as {
 format:string;version:number;packs:{count:number}[]
};
if(manifest.format!=='futstats-research-packs-v1'||manifest.version!==1||
 !Array.isArray(manifest.packs)||manifest.packs.some(p=>!Number.isSafeInteger(p.count)||p.count<1))
 throw Error('Índice público de pesquisa inválido para os testes E2E.');
export const RESEARCH_TOTAL=1019+manifest.packs.reduce((n,p)=>n+p.count,0);
export const RESEARCH_TOTAL_LABEL=RESEARCH_TOTAL.toLocaleString('pt-BR');

/** Read-only, evidence-backed date resolution; no original files or storage writes. */
import {validData,type Match,type ResearchDateReview} from './model';
import type {ResearchCatalog} from './researchCatalog';
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const metrics=['goals','shots','target','corners'] as const;
export function applyBrazilResearchDateReview(base:ResearchCatalog,raw:unknown):ResearchCatalog{
 if(!object(raw)||raw.format!=='futstats-research-date-review-v1'||raw.version!==1||
  raw.competition!=='Brasileirão Série A 2026'||typeof raw.checkedAt!=='string'||
  !Array.isArray(raw.entries)||raw.entries.length!==50)throw Error('Revisão de datas inválida.');
 const names=new Map(base.data.teams.map(t=>[t.id,t.name]));
 const source=new Map(base.data.matches.map(m=>[m.research?.sourceId,m]));
 const replacements=new Map<string,Match>();
 for(const entry of raw.entries){
  if(!object(entry)||typeof entry.sourceId!=='string'||replacements.has(entry.sourceId))
   throw Error('ID de revisão inválido ou duplicado.');
  const m=source.get(entry.sourceId),r=m?.research;
  if(!m||!r||m.competition!==raw.competition||m.date!==entry.date||r.titleDate!==entry.titleDate||
    m.date===r.titleDate||names.get(m.home)!==entry.home||names.get(m.away)!==entry.away||
    typeof entry.officialSource!=='string'||!object(entry.expected))throw Error('Revisão não corresponde ao registro original: '+entry.sourceId);
  for(const period of ['first','second','full'] as const){
   const expected=entry.expected[period],actual=period==='full'?r.full:m[period];
   if(!Array.isArray(expected)||expected.length!==2||actual.some((s,i)=>{
    const side:unknown=expected[i];
    return !object(side)||metrics.some(k=>s[k]!==side[k]);
   }))
    throw Error('Estatísticas diferentes das relidas: '+entry.sourceId);
  }
  const dateReview:ResearchDateReview={status:'confirmed',sourceId:r.sourceId,
   date:m.date,titleDate:r.titleDate!,timezone:'America/Sao_Paulo',
   officialSource:entry.officialSource,checkedAt:raw.checkedAt};
  replacements.set(r.sourceId,{...m,research:{...r,dateDiscrepancy:false,dateReview}});
 }
 const data={...base.data,matches:base.data.matches.map(m=>replacements.get(m.research?.sourceId??'')??m)};
 if(!validData(data))throw Error('Revisão de datas sem proveniência válida.');
 return {...base,data,dateConflicts:data.matches.filter(m=>m.research?.dateDiscrepancy).length};
}

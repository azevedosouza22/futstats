import {useEffect,useRef,useState,type ChangeEvent} from 'react';
import {metrics,labels,validDate,type Data,type FieldOrigin,type Metric,type Period,type ResolvedStats} from '../model';
import {clean} from './parser';
import {LocalOcr,checkImage,prepareImage} from './ocr';
import {completeSecondGoals,changePeriod,calculateDifferences,calculateTotals,correctField,draftFromText,inconsistencies,mergeDrafts,possibleDuplicates,saveImageMatch,type ImageDraft,type MatchInfo,type Review} from './review';
const periodNames:Record<Period,string>={first:'1º tempo',second:'2º tempo',full:'Jogo completo'};
const originNames:Record<FieldOrigin,string>={recognized:'OCR',corrected:'Corrigido pelo usuário',calculated:'Cálculo'};
type Selection={id:string;file:File;url:string};
const emptyInfo:MatchInfo={home:'',away:'',date:'',competition:'',country:'',round:''};
const infoLabels:Record<keyof MatchInfo,string>={home:'Mandante',away:'Visitante',date:'Data da partida',competition:'Competição (opcional)',country:'País (opcional)',round:'Rodada (opcional)'};
const value=(s:string)=>s.trim()===''?null:Number(s.replace(',','.'));

export default function ImageImport({data,save}:{data:Data;save:(d:Data)=>boolean}) {
  const [images,setImages]=useState<Selection[]>([]),[drafts,setDrafts]=useState<ImageDraft[]>([]);
  const [info,setInfo]=useState<MatchInfo>(emptyInfo),[initialInfo,setInitialInfo]=useState<MatchInfo>(emptyInfo);
  const [override,setOverride]=useState<Review|null>(null),[confirmed,setConfirmed]=useState(false),[showAll,setShowAll]=useState(false);
  const [coverage,setCoverage]=useState({first:false,second:false});
  const [busy,setBusy]=useState(false),[progress,setProgress]=useState(0),[status,setStatus]=useState('');
  const [error,setError]=useState(''),[notice,setNotice]=useState(''),[reviewing,setReviewing]=useState(false);
  const selections=useRef<Selection[]>([]),ocr=useRef<LocalOcr|null>(null),run=useRef(0),mounted=useRef(true);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;run.current++;ocr.current?.cancel();selections.current.forEach(i=>URL.revokeObjectURL(i.url));};},[]);
  function resetReview(){setDrafts([]);setOverride(null);setConfirmed(false);setReviewing(false);setInfo(emptyInfo);setInitialInfo(emptyInfo);setCoverage({first:false,second:false});setShowAll(false);setNotice('');}
  function filesChanged(e:ChangeEvent<HTMLInputElement>,replace?:number){
    const incoming=[...(e.target.files??[])];e.target.value='';if(!incoming.length)return;
    try {
      if(replace===undefined&&images.length+incoming.length>5)throw Error('Selecione no máximo cinco imagens por partida.');
      incoming.forEach(checkImage);
      const next=[...images];
      if(replace!==undefined){const file=incoming[0];URL.revokeObjectURL(next[replace].url);next[replace]={id:crypto.randomUUID(),file,url:URL.createObjectURL(file)};}
      else for(const file of incoming)next.push({id:crypto.randomUUID(),file,url:URL.createObjectURL(file)});
      selections.current=next;setImages(next);resetReview();setError('');
    }catch(e){setError(e instanceof Error?e.message:'Não foi possível selecionar a imagem.');}
  }
  function remove(index:number){URL.revokeObjectURL(images[index].url);const next=images.filter((_,i)=>i!==index);selections.current=next;setImages(next);resetReview();setError('');}
  function cancel(){run.current++;ocr.current?.cancel();ocr.current=null;setBusy(false);setStatus('Leitura cancelada. Você pode tentar novamente.');}
  async function recognize(){
    if(!images.length||busy)return;
    if(drafts.length&&!window.confirm('Repetir a leitura substituirá as correções desta revisão. Continuar?'))return;
    const token=++run.current;setBusy(true);setError('');resetReview();setProgress(0);
    let engine:LocalOcr|null=null;const results:ImageDraft[]=[];const warnings:string[]=[];
    try {
      engine=new LocalOcr();ocr.current=engine;
      for(let index=0;index<images.length;index++){
        if(token!==run.current)return;
        const selection=images[index];setStatus(`Preparando imagem ${index+1}/${images.length}…`);
        let timeout:ReturnType<typeof setTimeout>|undefined;
        try {
          const blob=await prepareImage(selection.file);if(token!==run.current)return;
          timeout=setTimeout(()=>engine?.cancel(),120000);
          const result=await engine.read(blob,selection.id,(p,s)=>{
            if(token!==run.current||!mounted.current)return;
            if(s==='recognizing text'){setProgress(Math.round((index+Math.min(1,Math.max(0,p)))/images.length*100));setStatus(`Lendo imagem ${index+1}/${images.length}…`);}
            else if(s==='retrying row')setStatus(`Imagem ${index+1}/${images.length}: relendo linha com valores ausentes…`);
            else setStatus(`Imagem ${index+1}/${images.length}: carregando mecanismo/idioma local…`);
          });
          const draft=draftFromText(selection.id,result.text,result.confidence,result.period,result.summary);
          if(result.period){
            draft.period=result.period;
            draft.original.warnings=draft.original.warnings.filter(w=>!w.startsWith('Período não determinado'));
            draft.original.warnings.push('Período sugerido por sublinhado vermelho alinhado à aba reconhecida. Confira antes de salvar.');
          }
          draft.original.warnings.push(...result.warnings);results.push(draft);
        }catch(e){
          if(token!==run.current)return;
          results.push(draftFromText(selection.id,'',0));warnings.push(`Imagem ${index+1}: ${e instanceof Error?e.message:'falha de reconhecimento'}`);
          engine.cancel();engine=new LocalOcr();ocr.current=engine;
        }finally{if(timeout)clearTimeout(timeout);}
        setProgress(Math.round((index+1)/images.length*100));
      }
      if(token!==run.current||!mounted.current)return;
      const metadata=Object.fromEntries(Object.keys(emptyInfo).map(k=>[k,results.map(d=>d.original[k as keyof MatchInfo]).find(Boolean)??''])) as MatchInfo;
      setInfo(metadata);setInitialInfo(metadata);
      setDrafts(results);setReviewing(true);setStatus('Leitura concluída. Confira as dúvidas destacadas e salve a partida.');
      if(warnings.length)setError(warnings.join(' '));
    }catch(e){if(token===run.current)setError(e instanceof Error?e.message:'Falha no mecanismo OCR.');}
    finally{engine?.cancel();if(token===run.current&&mounted.current){ocr.current=null;setBusy(false);}}
  }
  const merged=mergeDrafts(drafts,coverage);
  const review=completeSecondGoals(override??merged.review,merged.autoGoalsEnabled);
  const conflicts=merged.conflicts.filter(c=>review[c.period].origins[c.metric][c.side]!=='corrected');
  const problems=[...merged.periodErrors,...conflicts.map(c=>c.message),...inconsistencies(review)];
  const duplicates=possibleDuplicates(data,info);
  const identityWarnings=drafts.flatMap((d,index)=>(['home','away','date'] as const).filter(k=>d.original[k]&&clean(d.original[k])!==clean(info[k])).map(k=>`Imagem ${index+1}: ${({home:'mandante',away:'visitante',date:'data'})[k]} reconhecido diferente do campo da partida. Confira se é a mesma partida ou corrija a leitura.`));
  function infoProblem(k:keyof MatchInfo){const text=info[k]??'';return (!text&&['home','away','date'].includes(k))||(k==='date'&&!validDate(text))||text.length>(k==='home'||k==='away'?80:100);}
  function changed(){setConfirmed(false);setNotice('');}
  function editDraft(id:string,k:Metric,side:number,v:number|null){setDrafts(old=>old.map(d=>d.id===id?correctField(d,k,side,v):d));setOverride(null);changed();}
  function editResult(p:Period,k:Metric,side:number,v:number|null){const next=structuredClone(review);next[p].values[side][k]=v;next[p].origins[k][side]=v===null?null:'corrected';setOverride(next);changed();}
  function calculate(kind:'difference'|'first'|'total'){
    if(!window.confirm('Confirme que os tempos e totais usam a mesma definição da fonte e não incluem prorrogação. Apenas campos aditivos N/D serão calculados, sem sobrescrever valores. Continuar?'))return;
    const next=kind==='total'?calculateTotals(review):calculateDifferences(review,kind==='first'?'first':'second');setOverride(next);changed();setNotice('Campos preenchidos por cálculo estão identificados. Revise e confirme novamente antes de salvar.');
  }
  function finish(){
    setError('');try {
      if(problems.length)throw Error('Resolva os períodos e inconsistências antes de salvar.');
      const origins=Object.fromEntries(Object.keys(info).map(k=>[k,!info[k as keyof MatchInfo]?null:info[k as keyof MatchInfo]===initialInfo[k as keyof MatchInfo]?'recognized':'corrected'])) as Record<keyof MatchInfo,FieldOrigin|null>;
      const next=saveImageMatch(data,info,review,confirmed,origins);
      if(save(next)){selections.current.forEach(s=>URL.revokeObjectURL(s.url));selections.current=[];setImages([]);resetReview();setError('');setNotice('Partida salva na sua base local. Histórico, médias, comparação e pré-jogo foram atualizados. Imagens descartadas.');}
    }catch(e){setError(e instanceof Error?e.message:'Não foi possível salvar.');}
  }
  function statsTable(pair:[ResolvedStats,ResolvedStats],edit:(k:Metric,side:number,n:number|null)=>void,origins?:ImageDraft['origins']){
    const needsCheck=(k:Metric,side:number)=>drafts.some(d=>d.confidence<65)||conflicts.some(c=>c.metric===k&&c.side===side)||problems.some(p=>clean(p).includes(clean(labels[k])));
    const suspicious=(k:Metric,side:number)=> (k==='xg'&&(pair[side].xg??0)>=10)||((k==='shots'||k==='target')&&pair[side].target!==null&&pair[side].shots!==null&&pair[side].target!>pair[side].shots!)||(k==='possession'&&pair.every(s=>s.possession!==null)&&Math.abs(pair[0].possession!+pair[1].possession!-100)>1);
    return <table className="analysis-table ocr-table"><thead><tr><th>Estatística</th><th>Mandante</th><th>Visitante</th></tr></thead><tbody>{metrics.map(k=><tr key={k} hidden={!showAll&&pair.every((s,side)=>s[k]!==null&&!suspicious(k,side)&&!needsCheck(k,side))}><th>{labels[k]}</th>{[0,1].map(side=><td key={side}><input aria-label={`${labels[k]} ${side?'visitante':'mandante'}`} className={pair[side][k]===null||suspicious(k,side)||needsCheck(k,side)?'needs-review':''} inputMode={k==='xg'||k==='possession'?'decimal':'numeric'} type="number" min="0" max={k==='possession'?100:undefined} step={k==='xg'||k==='possession'?'0.01':'1'} value={pair[side][k]??''} placeholder="N/D" onChange={e=>edit(k,side,value(e.target.value))}/><small>{suspicious(k,side)?'Valor suspeito — confira a imagem':needsCheck(k,side)?'Valor em dúvida — confira a imagem':pair[side][k]===null?'Não reconhecido / N/D':origins?.[k][side]?originNames[origins[k][side]!]:'Conferir'}</small></td>)}</tr>)}</tbody></table>;
  }
  return <section className="panel image-import" aria-labelledby="image-title"><div className="panel-head"><div><h2 id="image-title">Importar por imagem</h2><p>Selecionar imagens → Reconhecer → Conferir → Salvar</p></div><span className="tag">OCR LOCAL · GRATUITO</span></div><div className="analysis-content">
    <p className="muted">Envie manualmente até cinco prints JPG, PNG ou WebP da mesma partida. Não acessamos Flashscore ou outros aplicativos. Suas imagens ficam no navegador e não são salvas no backup.</p>
    <label className="image-picker">Selecionar imagens<input disabled={busy||images.length===5} type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" multiple onChange={e=>filesChanged(e)}/></label>
    <div className="image-previews">{images.map((image,i)=><article className="image-preview" key={image.id}><img loading="lazy" decoding="async" src={image.url} alt={`Prévia da imagem ${i+1} fornecida pelo usuário`} onError={()=>setError(`Imagem ${i+1} não pôde ser exibida. Remova ou substitua o arquivo.`)}/><p>Imagem {i+1} · {(image.file.size/1024/1024).toFixed(1)} MB</p><label>Substituir<input disabled={busy} type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" onChange={e=>filesChanged(e,i)}/></label><button disabled={busy} className="danger" onClick={()=>remove(i)}>Remover imagem {i+1}</button></article>)}</div>
    <div className="ocr-actions"><button type="button" className="primary" disabled={!images.length||busy} onClick={()=>void recognize()}>{drafts.length?'Repetir leitura':'Reconhecer imagens'}</button>{busy&&<button type="button" className="danger" onClick={cancel}>Cancelar leitura</button>}</div>
    {status&&<p role="status" className="muted">{status}</p>}{busy&&<progress aria-label="Progresso do OCR" max="100" value={progress}>{progress}%</progress>}
    {error&&<p className="alert" role="alert">{error}</p>}{notice&&<p className="notice" role="status">{notice}</p>}
    {reviewing&&!busy&&<div className="ocr-review"><h3>Conferir a partida</h3><p className="muted">Confira a ordem das equipes: valores à esquerda pertencem ao mandante. O OCR pode errar nomes, números e abas ativas. Campos vazios são N/D.</p>
      <div className="ocr-info">{(Object.keys(emptyInfo) as (keyof MatchInfo)[]).map(k=><label key={k}>{infoLabels[k]}<input className={infoProblem(k)?'needs-review':''} type={k==='date'?'date':'text'} maxLength={k==='home'||k==='away'?80:100} value={info[k]??''} onChange={e=>{setInfo({...info,[k]:e.target.value});changed();}}/></label>)}</div>
      {identityWarnings.length>0&&<div className="alert" role="status"><ul>{identityWarnings.map(w=><li key={w}>{w}</li>)}</ul></div>}<div className="final-score-review"><p>Placar final — OCR quando identificado; editável</p><div>{[0,1].map(side=><input key={side} aria-label={`Placar final ${side?'visitante':'mandante'}`} type="number" min="0" step="1" placeholder="N/D" value={review.full.values[side].goals??''} onChange={e=>editResult('full','goals',side,value(e.target.value))}/>)}</div></div>
      <label><input type="checkbox" checked={showAll} onChange={e=>setShowAll(e.target.checked)}/> Mostrar todos os campos para conferência ou correção</label>

      {drafts.map((draft,i)=><article className="ocr-draft" key={draft.id}><h4>Imagem {i+1} · confiança OCR: {Math.round(draft.confidence)}%</h4><label>{draft.kind==='summary'?'Conteúdo: SUMÁRIO':draft.period?'Período identificado — editável':'Período não identificado — selecione'}<select className={draft.kind==='stats'&&!draft.period?'needs-review':''} aria-label={`Período imagem ${i+1}`} value={draft.kind==='summary'?'summary':draft.period??''} onChange={e=>{setDrafts(old=>old.map(d=>d.id===draft.id?{...changePeriod(d,e.target.value==='summary'?null:e.target.value as Period||null),kind:e.target.value==='summary'?'summary':'stats'}:d));setOverride(null);changed();}}><option value="">Selecione o período</option><option value="summary">SUMÁRIO (eventos e intervalo)</option><option value="first">1º tempo (somente este tempo)</option><option value="second">2º tempo (somente este tempo, não acumulado)</option><option value="full">Jogo completo</option></select></label>
        {draft.confidence<65&&<p className="alert">Leitura com baixa confiança. Confira números, vírgulas e rótulos na imagem.</p>}{[...draft.original.warnings,...(draft.kind==='summary'?draft.summary.warnings:[])].map((w,j)=><p className={draft.original.suspect.length?'alert':'muted'} key={j}>{w}</p>)}{draft.kind==='summary'&&<p className="muted">{draft.summary.interval?`Intervalo: ${draft.summary.interval.join(' × ')}`:'Intervalo N/D'} · {draft.summary.events.length} eventos legíveis. Confira os recortes antes de usar totais.</p>}<details><summary>Ver e corrigir os valores lidos desta imagem</summary>{statsTable(draft.values,(k,side,n)=>editDraft(draft.id,k,side,n),draft.origins)}</details>
      </article>)}
      {problems.length>0&&<div className="alert" role="alert"><div><b>Revisão necessária</b><ul>{[...new Set(problems)].map(p=><li key={p}>{p}</li>)}</ul><small>Não alteramos valores automaticamente. Se as definições ou os períodos da fonte diferem, corrija a classificação ou remova os campos incomparáveis.</small></div></div>}
      {duplicates.length>0&&<p role="alert" className="alert">Possível duplicata dessas equipes nesta data. Confira o histórico antes de continuar. Nenhuma partida será sobrescrita.</p>}
      {drafts.some(d=>d.kind==='summary')&&<section className="ocr-draft"><h3>Eventos do SUMÁRIO</h3><p className="muted">Um recorte pode omitir eventos. Use totais de gols/cartões somente se todas as imagens juntas mostram a lista completa do tempo, com as equipes corretas. Não incluímos eventos anulados nem prorrogação.</p><details><summary>Eventos reconhecidos ({merged.events.length})</summary><ul>{merged.events.map(event=><li key={event.key}>{event.description}</li>)}</ul></details>{(['first','second'] as const).map(p=><label className="review-confirm" key={p}><input type="checkbox" checked={coverage[p]} onChange={e=>{setCoverage({...coverage,[p]:e.target.checked});setOverride(null);changed();}}/> As imagens mostram todos os eventos do {periodNames[p]}, das duas equipes — usar contagens de gols e cartões</label>)}{merged.warnings.map((w,i)=><p className="muted" key={i}>{w}</p>)}</section>}
      <h3>Resultado que será salvo</h3><p className="muted">Campos confiáveis já foram preenchidos. Edite somente dúvidas ou ative a exibição de todos os campos. Alterar períodos ou corrigir a leitura de uma imagem reinicia os cálculos desta consolidação.</p>
      <div className="ocr-result">{(['first','second','full'] as const).map(p=><details key={p} open><summary>{periodNames[p]}</summary>{statsTable(review[p].values,(k,side,n)=>editResult(p,k,side,n),review[p].origins)}</details>)}</div>
      <div className="ocr-actions"><button className="text-button" onClick={()=>calculate('first')}>Calcular 1º tempo por diferença</button><button className="text-button" onClick={()=>calculate('difference')}>Calcular 2º tempo por diferença</button><button className="text-button" onClick={()=>calculate('total')}>Calcular totais dos dois tempos</button></div><p className="muted">Cálculos são opcionais e somente para métricas aditivas ausentes. Não calculamos posse de bola, percentuais ou xG por soma/diferença, nem diferenças negativas.</p>
      <label className="review-confirm"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/> Revisei equipes, data e dúvidas destacadas. Confirmo que as imagens são da mesma partida, as definições comparáveis da fonte e que este registro representa uma partida concluída.</label>
      <button className="primary" disabled={!confirmed||!!problems.length||!!duplicates.length||!info.home.trim()||!info.away.trim()||!validDate(info.date)} onClick={finish}>Salvar partida</button>
    </div>}
    <p className="muted">Na primeira leitura, o aplicativo baixa seu mecanismo e idioma português (alguns MB), sem enviar imagens. Em produção, leituras posteriores podem funcionar offline após o cache estar completo; limpar os dados do navegador remove esse cache. Prints longos, texto pequeno, tema escuro e abas ambíguas exigem revisão manual. Limite: 15 MB por arquivo.</p>
  </div></section>;
}

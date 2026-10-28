import {useRef,useState} from 'react';
import {Archive,CheckCircle2,CloudUpload,FileSpreadsheet,ShieldCheck} from 'lucide-react';
import {parseWorkResearchCsv} from './workCsv';
import {loadPublicResearchCatalog} from './researchCatalog';
import {PRIVATE_PACK_EVENT,savePrivateSeasonCsv} from './privateSeasonPacks';

/** The CSV never leaves the user's browser. Import is a separate PRIVATE research
 * cache for comparison, not the original FutStats history/backup or main branch.
 */
export default function PrivateSeasonCsvImport(){
 const input=useRef<HTMLInputElement>(null);
 const [csv,setCsv]=useState('');
 const [fileName,setFileName]=useState('');
 const [count,setCount]=useState(0);
 const [league,setLeague]=useState('');
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 async function choose(file?:File){
  setCsv('');setCount(0);setLeague('');setFileName('');setError('');setNotice('');
  if(!file)return;
  try{
   if(file.size>2_000_000||!file.name.toLowerCase().endsWith('.csv'))
    throw Error('Selecione um CSV FutStats de até 2 MB.');
   const value=await file.text();
   const rows=parseWorkResearchCsv(value);
   const competitions=new Set(rows.map(r=>r.competition));
   if(competitions.size!==1)throw Error('Use um campeonato e uma temporada por arquivo.');
   if(rows.some(r=>[r.full,r.first,r.second].some(p=>p.some(s=>
     [s.goals,s.shots,s.target,s.corners].some(v=>v===null)))))
    throw Error('Existem partidas sem estatísticas completas; não serão incluídas.');
   setCsv(value);setFileName(file.name);setCount(rows.length);setLeague(rows[0].competition);
  }catch(e){setError(e instanceof Error?e.message:'Falha ao analisar o arquivo.');}
  if(input.current)input.current.value='';
 }
 async function confirm(){
  if(!csv||loading)return;
  if(!window.confirm('Incluir '+count+' partidas de '+league+
   ' somente na pesquisa privada deste navegador? O histórico de 659 jogos e as previsões não serão alterados.'))return;
  setLoading(true);setError('');setNotice('');
  try{
   const base=await loadPublicResearchCatalog();
   const result=await savePrivateSeasonCsv(csv,base);
   setNotice(result.added+' partidas acrescentadas; '+result.skipped+
    ' repetidas preservadas. Pesquisa agora com '+result.total+
    ' jogos neste navegador. Não houve alteração do histórico pessoal.');
   setCsv('');setCount(0);setFileName('');setLeague('');
   window.dispatchEvent(new Event(PRIVATE_PACK_EVENT));
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível incorporar esta temporada.');}
  finally{setLoading(false);}
 }
 return <div className="private-season-import" aria-label="Importar temporada histórica privada">
  <p className="muted"><ShieldCheck size={16}/> Os arquivos ficam somente neste navegador
    (armazenamento separado). Não são publicados no GitHub nem importados no
    histórico pessoal ou Radar.</p>
  <div className="private-season-steps">
   <label className="private-season-picker">
    <FileSpreadsheet size={20}/>
    Escolher CSV FutStats de 55 colunas
    <input ref={input} type="file" accept=".csv,text/csv"
     aria-label="Escolher CSV para a pesquisa histórica privada"
     onChange={e=>void choose(e.currentTarget.files?.[0])}/>
   </label>
   {count>0&&<div className="private-season-preview">
    <CheckCircle2 size={18}/>
    <span><strong>{count} partidas · {league}</strong>
     <small>{fileName} · aguardando sua confirmação</small></span>
   </div>}
   {csv&&<button type="button" className="primary" disabled={loading}
     onClick={()=>void confirm()}>
     <CloudUpload size={17}/>{loading?'Verificando arquivo...':'Incluir na pesquisa separada'}
    </button>}
   {error&&<p className="alert" role="alert">{error}</p>}
   {notice&&<p className="notice" role="status">{notice}</p>}
  </div>
  <p className="private-season-note"><Archive size={15}/>
   O CSV original no Google Drive é seu arquivo de segurança. Limpar os dados
   do navegador apaga a cópia privada; mantenha o CSV original preservado.</p>
 </div>;
}

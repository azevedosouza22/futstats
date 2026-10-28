import {useRef,useState} from 'react';
import {Archive,CheckCircle2,Database,FileSpreadsheet,ShieldCheck} from 'lucide-react';
import {parseWorkResearchCsv} from './workCsv';
import {loadPublicResearchCatalog} from './researchCatalog';
import {
 PRIVATE_PACK_EVENT,requireFutStats55Columns,savePrivateSeasonsCsv
} from './privateSeasonPacks';

type SeasonSummary={competition:string;count:number};
export default function PrivateSeasonCsvImport(){
 const input=useRef<HTMLInputElement>(null);
 const [csv,setCsv]=useState('');
 const [filename,setFilename]=useState('');
 const [seasons,setSeasons]=useState<SeasonSummary[]>([]);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const count=seasons.reduce((sum,s)=>sum+s.count,0);
 async function choose(file?:File){
  setCsv('');setFilename('');setSeasons([]);setError('');setNotice('');
  if(!file)return;
  try{
   if(file.size>2_000_000||!file.name.toLowerCase().endsWith('.csv'))
    throw Error('Selecione um arquivo CSV FutStats de até 2 MB.');
   const value=await file.text();
   requireFutStats55Columns(value);
   const rows=parseWorkResearchCsv(value,1200);
   if(rows.some(row=>[row.full,row.first,row.second].some(p=>p.some(s=>
      [s.goals,s.shots,s.target,s.corners].some(n=>
       typeof n!=='number'||!Number.isSafeInteger(n)))))){
    throw Error('Há partidas sem estatísticas completas. Nada foi incluído.');
   }
   const groups=new Map<string,number>();
   for(const row of rows)groups.set(row.competition,(groups.get(row.competition)??0)+1);
   if(groups.size>20)throw Error('Limite de 20 temporadas por pacote.');
   setCsv(value);setFilename(file.name);
   setSeasons([...groups].map(([competition,count])=>({competition,count})));
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível ler o CSV.');}
  if(input.current)input.current.value='';
 }
 async function confirm(){
  if(!csv||loading)return;
  const message='Incluir '+count+' partidas de '+seasons.length+
   ' temporada(s) na pesquisa deste navegador? A base pessoal e as previsões permanecerão intactas.';
  if(!window.confirm(message))return;
  setLoading(true);setError('');setNotice('');
  try{
   const baseline=await loadPublicResearchCatalog();
   const result=await savePrivateSeasonsCsv(csv,baseline);
   setNotice('Inclusão concluída: '+result.added+' novas, '+result.skipped+
    ' já existentes. Pesquisa total: '+result.total+
    ' partidas. '+result.seasons.map(s=>s.competition+': '+s.count+' jogos').join(' · ')+
    '. Histórico pessoal, previsões e backups intactos.');
   setCsv('');setFilename('');setSeasons([]);
   window.dispatchEvent(new Event(PRIVATE_PACK_EVENT));
  }catch(e){setError(e instanceof Error?e.message:'A inclusão não foi concluída.');}
  finally{setLoading(false);}
 }
 return <div className="private-season-import" aria-label="Importar campeonatos históricos privados">
  <p className="muted"><ShieldCheck size={16}/>
   Os jogos entram apenas na pesquisa deste navegador e nas comparações.
   Os CSVs não são enviados ao servidor, ao GitHub ou à produção.</p>
  <div className="private-season-steps">
   <label className="private-season-picker">
    <FileSpreadsheet size={20}/>
    Escolher CSV FutStats de uma ou várias temporadas (até 1.200 partidas)
    <input ref={input} type="file" accept=".csv,text/csv"
     aria-label="Escolher pacote CSV FutStats de temporadas históricas"
     onChange={e=>void choose(e.currentTarget.files?.[0])}/>
   </label>
   {count>0&&<div className="private-season-preview">
    <CheckCircle2 size={18}/>
    <span><strong>{count} partidas · {seasons.length} temporada(s)</strong>
     {seasons.map(s=><small key={s.competition}>
       {s.competition} — {s.count} jogos
     </small>)}
     <small>{filename} · conferência antes de gravar</small>
    </span>
   </div>}
   {!!csv&&<button type="button" className="primary" disabled={loading}
     onClick={()=>void confirm()}>
     <Database size={17}/>
     {loading?'Validando e gravando...':'Incluir '+count+' jogos na pesquisa do FutStats'}
    </button>}
   {error&&<p className="alert" role="alert">{error}</p>}
   {notice&&<p className="notice" role="status">{notice}</p>}
  </div>
  <p className="private-season-note"><Archive size={15}/>
   Faça a importação no mesmo navegador onde deseja consultar os dados.
   Limpar os dados do navegador apaga a cópia; guarde os CSVs no Drive.
   O histórico pessoal e as previsões continuam separados.</p>
 </div>;
}

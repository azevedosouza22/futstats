import {useState,useRef,useEffect,type FormEvent} from 'react';
import {LayoutDashboard,Users,ArrowLeftRight,History,Plus,ArrowUpRight,Goal,Target,Flag,Shield,Download,Upload,X,Trash2,Pencil,Check,Activity,ChevronRight,CalendarDays,Crosshair,Database,Radio,Wrench,ScanLine,CloudDownload} from 'lucide-react';
import Integration from './Integration';
import WorkCsvImport from './WorkCsvImport';
import OpenFootballPilot from './OpenFootballPilot';
import FplStatsPilot from './FplStatsPilot';
import PwaUpdateStatus from './PwaUpdateStatus';
import PreGame from './PreGame';
import Radar from './Radar';
import Live from './Live';
import AutomaticMatches from './AutomaticMatches';
import {metrics,labels,empty,stats,average,matchAverage,validateMatch,validData,STORAGE,type Data,type Team,type Match,type Stats} from './model';
import {createFullBackup,parseFullBackup,restoreFullBackup,RADAR_STORAGE} from './fullBackup';
import {leagueOptions,seasonOptions,filterMatchesByLeague,paginateMatches,competitionParts,ALL_LEAGUES} from './leagueCatalog';
const fmt=(n:number|null)=>n===null?'N/D':n.toLocaleString('pt-BR',{maximumFractionDigits:2});
const dateLabel=(d:string)=>new Date(d+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'});
const blank:Data={teams:[],matches:[]};
function load(){try{const raw=localStorage.getItem(STORAGE);if(!raw)return {data:blank,error:''};const d=JSON.parse(raw);if(!validData(d))throw Error();return {data:d,error:''};}catch{return {data:blank,error:'Não foi possível ler os dados locais. Importe um backup para recuperá-los.'};}}
const initial=load();
const tabs=[
 {name:'Visão geral',icon:LayoutDashboard,area:'overview'},
 {name:'Equipes',icon:Users,area:'teams'},
 {name:'Comparação',icon:ArrowLeftRight,area:'compare'},
 {name:'Histórico',icon:History,area:'history'},
 {name:'Base de dados',icon:Database,area:'database'},
 {name:'Pré-jogo',icon:CalendarDays,area:'pregame'},
 {name:'Radar V2 × V3',icon:Crosshair,area:'radar'},
 {name:'Ferramentas e testes',icon:Wrench,area:'tools'},
];
export default function App(){
 const [data,setData]=useState<Data>(initial.data),[page,setPage]=useState(0),[period,setPeriod]=useState<'first'|'full'>('full'),[modal,setModal]=useState<'team'|'match'|null>(null),[error,setError]=useState(initial.error),[notice,setNotice]=useState(''),[edit,setEdit]=useState<string|null>(null),[teamName,setTeamName]=useState(''),[color,setColor]=useState('#23875b'),[match,setMatch]=useState<Match|null>(null),[compare,setCompare]=useState<[string,string]>(['','']),[search,setSearch]=useState(''),[detail,setDetail]=useState<Match|null>(null);
 const file=useRef<HTMLInputElement>(null);
 const [detailPeriod,setDetailPeriod]=useState<'first'|'second'|'full'>('full');
 const [leagueFilter,setLeagueFilter]=useState(()=>{
   const first=initial.data.matches[0];return first?competitionParts(first.competition).league:ALL_LEAGUES;
 });
 const [seasonFilter,setSeasonFilter]=useState(ALL_LEAGUES);
 const [historyPage,setHistoryPage]=useState(1);
 const [toolPanel,setToolPanel]=useState<'image'|'sportsdb'|'live'|'api'>('image');
 const imageFieldOrigin=(k:keyof Stats,side:number)=>{const origin=detail?.image?.fields[detailPeriod]?.[k]?.[side];return origin?({recognized:'Reconhecido e revisado',corrected:'Corrigido pelo usuário',calculated:'Calculado'})[origin]:'';};
 useEffect(()=>{if(!modal&&!detail)return;const previous=document.activeElement as HTMLElement|null;const dialog=document.querySelector<HTMLElement>('[role="dialog"]');const focusable=()=>Array.from(dialog?.querySelectorAll<HTMLElement>('button,input,select,[href],[tabindex="0"]')??[]).filter(el=>!el.hasAttribute('disabled'));focusable()[0]?.focus();const handler=(e:KeyboardEvent)=>{if(e.key==='Escape'){setModal(null);setDetail(null);}if(e.key==='Tab'){const els=focusable();const first=els[0],last=els[els.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}};document.addEventListener('keydown',handler);const overflow=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.removeEventListener('keydown',handler);document.body.style.overflow=overflow;previous?.focus();};},[modal,detail]);

 function commit(next:Data){try{localStorage.setItem(STORAGE,JSON.stringify(next));setData(next);setError('');return true;}catch{setError('Não foi possível salvar. Verifique o espaço e as permissões do navegador. Exporte um backup antes de sair.');return false;}}
 const team=(id:string)=>data.teams.find(t=>t.id===id);
 const sorted=[...data.matches].sort((a,b)=>b.date.localeCompare(a.date));
 const leagues=leagueOptions(data.matches);
 const selectedLeague=leagues.includes(leagueFilter)?leagueFilter:ALL_LEAGUES;
 const seasons=seasonOptions(data.matches,selectedLeague);
 const selectedSeason=seasons.includes(seasonFilter)?seasonFilter:ALL_LEAGUES;
 const scopedMatches=filterMatchesByLeague(data.matches,selectedLeague,selectedSeason);
 const scopedTeamIds=new Set(scopedMatches.flatMap(m=>[m.home,m.away]));
 const scopedTeams=selectedLeague===ALL_LEAGUES&&selectedSeason===ALL_LEAGUES
   ?data.teams:data.teams.filter(t=>scopedTeamIds.has(t.id));
 const historyMatches=scopedMatches.filter(m=>
   (`${data.teams.find(t=>t.id===m.home)?.name??''} ${data.teams.find(t=>t.id===m.away)?.name??''} ${m.competition}`)
     .toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR'))
 ).sort((a,b)=>b.date.localeCompare(a.date));
 const historyListing=paginateMatches(historyMatches,historyPage);
 const leagueFilters=<section className="league-filters" aria-label="Filtros por campeonato e temporada">
   <label>Campeonato
     <select aria-label="Filtrar campeonato" value={selectedLeague} onChange={e=>{setLeagueFilter(e.target.value);setSeasonFilter(ALL_LEAGUES);setHistoryPage(1);setCompare(['','']);}}>
       <option value={ALL_LEAGUES}>Todos os campeonatos</option>
       {leagues.map(league=><option value={league} key={league}>{league}</option>)}
     </select>
   </label>
   <label>Temporada
     <select aria-label="Filtrar temporada" value={selectedSeason} onChange={e=>{setSeasonFilter(e.target.value);setHistoryPage(1);setCompare(['','']);}}>
       <option value={ALL_LEAGUES}>Todas as temporadas</option>
       {seasons.map(season=><option value={season} key={season}>{season}</option>)}
     </select>
   </label>
   <span className="league-scope-count">{scopedMatches.length} {scopedMatches.length===1?'partida':'partidas'} nesta seleção</span>
 </section>;
 const total=(k:keyof Stats)=>matchAverage(data.matches,k,period).total;
 const mean=(k:keyof Stats)=>matchAverage(data.matches,k,period);
 const ranking=data.teams.map(t=>({...t,...average(data.matches,t.id,period)})).sort((a,b)=>(b.values.goals??-1)-(a.values.goals??-1));
 function openTeam(t?:Team){setEdit(t?.id??null);setTeamName(t?.name??'');setColor(t?.color??'#23875b');setError('');setModal('team');}
 function openMatch(m?:Match){if(m?.external||m?.image||m?.research){setError('Partidas importadas são somente leitura para preservar origem e períodos. Use o cadastro manual para seus registros.');return;}setEdit(m?.id??null);setMatch(m?structuredClone(m):{id:crypto.randomUUID(),home:data.teams[0]?.id??'',away:data.teams[1]?.id??'',date:new Date().getFullYear()+'-'+String(new Date().getMonth()+1).padStart(2,'0')+'-'+String(new Date().getDate()).padStart(2,'0'),competition:'',first:[empty(),empty()],second:[empty(),empty()]});setError('');setModal('match');}
 function saveTeam(e:FormEvent){e.preventDefault();const name=teamName.trim();if(!name){setError('Informe o nome da equipe.');return;}if(data.teams.some(t=>t.id!==edit&&t.name.toLocaleLowerCase('pt-BR')===name.toLocaleLowerCase('pt-BR'))){setError('Já existe uma equipe com esse nome.');return;}const t={...data.teams.find(t=>t.id===edit),id:edit??crypto.randomUUID(),name,color};if(commit({...data,teams:edit?data.teams.map(v=>v.id===edit?t:v):[...data.teams,t]})){setModal(null);setNotice('Equipe salva com sucesso.');}}
 function saveMatch(e:FormEvent){e.preventDefault();if(!match)return;const err=validateMatch(match);if(err){setError(err);return;}if(commit({...data,matches:edit?data.matches.map(v=>v.id===edit?match:v):[...data.matches,match]})){setModal(null);setNotice('Partida salva. Estatísticas atualizadas.');}}
 function removeTeam(t:Team){if(data.matches.some(m=>m.home===t.id||m.away===t.id)){setError('Esta equipe tem partidas cadastradas. Exclua as partidas antes de remover a equipe.');return;}if(confirm(`Excluir a equipe ${t.name}?`))commit({...data,teams:data.teams.filter(v=>v.id!==t.id)});}
 function exportData(){
  try{
    const originalRadar=localStorage.getItem(RADAR_STORAGE);
    const savedRadar:unknown=originalRadar===null?[]:JSON.parse(originalRadar);
    const backup=createFullBackup(data,savedRadar);
    const url=URL.createObjectURL(new Blob([JSON.stringify(backup,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;
    a.download='futstats-completo-'+new Date().toISOString().slice(0,10)+'.json';
    a.click();URL.revokeObjectURL(url);
    setNotice('Backup completo exportado: '+data.matches.length+' partidas e '+backup.radarRecords.length+' previsões.');
    setError('');
  }catch(e){setError(e instanceof Error?e.message:'Falha ao criar backup completo.');}
 }
 async function importData(f?:File){
  if(!f)return;
  try{
    if(f.size>5*1024*1024)throw Error('O arquivo deve ter até 5 MB.');
    const backup=parseFullBackup(JSON.parse(await f.text()) as unknown);
    const question=backup.kind==='full'
      ?'Restaurar '+backup.data.matches.length+' partidas e '+backup.radarRecords.length+' previsões?\n\nIsso SUBSTITUI os jogos e as previsões deste navegador. Continue somente se deseja restaurar esta cópia.'
      :'Backup antigo: '+backup.data.matches.length+' partidas.\n\nSubstituir somente os jogos atuais? As previsões do Radar serão preservadas.';
    if(!window.confirm(question))return;
    restoreFullBackup(localStorage,backup);
    window.location.reload();
  }catch(e){setError(e instanceof Error?e.message:'Falha ao restaurar backup. Nenhum dado foi alterado.');}
  finally{if(file.current)file.current.value='';}
 }
 function demo(){if(data.teams.length||data.matches.length)return;const teams=[{id:'demo-a',name:'Palmeiras',color:'#23794e'},{id:'demo-b',name:'Flamengo',color:'#b74242'},{id:'demo-c',name:'Corinthians',color:'#3e4652'},{id:'demo-d',name:'São Paulo',color:'#bc4b50'}];const matches:Match[]=Array.from({length:8},(_,i)=>({id:`demo-${i}`,home:teams[i%4].id,away:teams[(i+1)%4].id,date:`2026-09-${String(10+i*2).padStart(2,'0')}`,competition:'Dados de demonstração',first:[{goals:i%2,shots:5+i%3,target:2,corners:3,yellow:1,red:0},{goals:1,shots:4,target:2,corners:2,yellow:1,red:0}],second:[{goals:1,shots:7,target:3,corners:4,yellow:2,red:0},{goals:i%3,shots:6,target:3,corners:3,yellow:1,red:0}]}));commit({teams,matches});setNotice('Dados fictícios carregados. Você pode excluir as partidas pelo histórico.');}
 function Badge({id}:{id:string}){const t=team(id);return <span className="badge" style={{background:t?.color??'#586b60'}}>{t?.name.slice(0,3).toUpperCase()??'?'}</span>;}
 function MatchRow({m}:{m:Match}){const a=stats(m,0,period),b=stats(m,1,period);return <button className="match-row" onClick={()=>{setDetailPeriod(period);setDetail(m);}}><span className="match-date">{dateLabel(m.date)}<small>{(m.competition||'Amistoso')+(m.external?' · TheSportsDB':m.image?' · Imagem revisada':m.research?' · Pesquisa CSV':'')}</small></span><span className="match-teams"><Badge id={m.home}/><span>{team(m.home)?.name}</span><b className="score">{fmt(a.goals)} <em>:</em> {fmt(b.goals)}</b><span>{team(m.away)?.name}</span><Badge id={m.away}/></span><ChevronRight size={18}/></button>;}
 const selected:[string,string]=[scopedTeams.find(t=>t.id===compare[0])?.id??scopedTeams[0]?.id??'',scopedTeams.find(t=>t.id===compare[1])?.id??scopedTeams[1]?.id??''];
 return <div className={page===7&&toolPanel==='api'?"app intelligence premium":"app premium"}><aside><a className="brand" href="#" onClick={()=>setPage(0)}><span className="brand-icon"><Activity size={24}/></span>Fut<span>Stats</span></a><div className="workspace-label">SEU CENTRO DE ESTATÍSTICAS</div><nav aria-label="Navegação principal">{tabs.slice(0,7).map((t,i)=><button type="button" data-area={t.area} className={page===i?'active':''} key={t.name} onClick={()=>{setPage(i);setSearch('');setHistoryPage(1);}}><t.icon size={20}/>{t.name}{page===i&&<span className="nav-dot"/>}</button>)}
 <div className="nav-tools-label">RECURSOS OPCIONAIS</div>
 <button type="button" data-area="tools" className={page===7?'active':''} onClick={()=>setPage(7)}><Wrench size={20}/>Ferramentas e testes{page===7&&<span className="nav-dot"/>}</button>
 </nav><div className="sidebar-bottom"><div className="local-card"><span className="online-dot"/>Dados no seu dispositivo<p>Suas estatísticas, sempre com você.</p></div><button onClick={exportData}><Download size={17}/>Exportar tudo</button><button onClick={()=>file.current?.click()}><Upload size={17}/>Restaurar backup</button><small>FutStats · Visual V4 (teste)</small></div></aside>
 <div className="main"><header><span>Futebol / <b>{tabs[page].name}</b></span><span className="local-pill"><span className="online-dot"/>Armazenamento local</span><div className="mobile-backups"><button aria-label="Exportar backup completo com jogos e previsões" title="Exportar backup completo" onClick={exportData}><Download size={18}/></button><button aria-label="Restaurar backup completo ou antigo" title="Restaurar backup" onClick={()=>file.current?.click()}><Upload size={18}/></button></div></header><main>
 <div className="heading"><div><div className="eyebrow">FUTSTATS · CENTRO DE ANÁLISES</div><h1>{[
 'Seu futebol em números.','Equipes por campeonato.','Compare dentro da competição.',
 'Seu histórico, organizado.','Amplie sua base.','Prepare sua análise.','Radar V2 × V3.',
 'Ferramentas e testes opcionais.'
 ][page]}</h1><p>{[
 'Acompanhe o desempenho e descubra o que os dados dizem.',
 'Filtre equipes por liga e temporada para não misturar médias.',
 'Use a mesma competição e temporada para comparar equipes.',
 'Encontre jogos por campeonato, temporada ou busca.',
 'Importe pesquisas CSV revisadas com segurança.',
 'Compare janelas recentes, com amostras e fontes claras.',
 'Registre análises antes de cada partida e avalie resultados reais.',
 'OCR, TheSportsDB, consultas pontuais e outros testes experimentais.'
 ][page]}</p></div>
 {(page===0||page===1||page===3||page===6)&&<button className="primary" onClick={()=>page===6?document.querySelector('.calendar-agenda')?.scrollIntoView({behavior:'smooth',block:'start'}):page===1?openTeam():openMatch()}>{page===6?<CalendarDays size={18}/>:<Plus size={18}/>} {page===6?'Ver agenda':page===1?'Nova equipe':'Nova partida'}</button>}</div>
 {error&&<div className="alert" role="alert">{error}<button aria-label="Fechar aviso" onClick={()=>setError('')}><X size={16}/></button></div>}{notice&&<div className="notice" role="status"><Check size={17}/>{notice}<button aria-label="Fechar mensagem" onClick={()=>setNotice('')}><X size={16}/></button></div>}
 <div className="toolbar"><span><span className="online-dot"/> {page===1?`${scopedTeams.length} equipes nesta seleção`:[2,3].includes(page)?`${scopedMatches.length} partidas nesta seleção`:`${data.matches.length} partidas na sua base`}</span>{[0,1,2,3].includes(page)&&<div className="segment"><button className={period==='first'?'selected':''} onClick={()=>setPeriod('first')}>1º tempo</button><button className={period==='full'?'selected':''} onClick={()=>setPeriod('full')}>Partida completa</button></div>}</div>
 {[1,2,3].includes(page)&&leagueFilters}
 {page===0&&<><section className="home-shortcuts" aria-label="Acesso rápido às análises">
  <div className="home-shortcuts-copy"><span className="quick-eyebrow">CENTRAL DE ANÁLISE</span><h2>Seu próximo jogo começa aqui.</h2><p>Acompanhe a agenda e veja os sinais dos Radares V2 e V3 em poucos toques.</p></div>
  <div className="quick-actions">
    <button type="button" onClick={()=>setPage(6)}><Target size={22}/><span><strong>Agenda e Radar</strong><small>Jogos futuros e previsões</small></span><ChevronRight size={18}/></button>
    <button type="button" onClick={()=>setPage(5)}><Activity size={22}/><span><strong>Análise pré-jogo</strong><small>Histórico por equipe</small></span><ChevronRight size={18}/></button>
  </div>
 </section><section className="panel backup-unified" aria-label="Backup completo do FutStats">
  <div><h2>Backup completo</h2><p>Um único arquivo para suas partidas e previsões do Radar. Aceita também backups antigos de jogos.</p></div>
  <div className="backup-buttons"><button type="button" className="primary" onClick={exportData}><Download size={17}/> Exportar tudo</button><button type="button" className="text-button" onClick={()=>file.current?.click()}><Upload size={17}/> Restaurar backup</button></div>
  </section><div className="kpis">{[{label:'Partidas cadastradas',value:data.matches.length,icon:Shield,note:`${data.teams.length} equipes na base`},{label:'Gols por partida',value:fmt(mean('goals').value),icon:Goal,note:`${fmt(total('goals'))} gols · ${mean('goals').count} jogos com dados`},{label:'Finalizações por partida',value:fmt(mean('shots').value),icon:Target,note:`${mean('shots').count} jogos com finalizações disponíveis`},{label:'Escanteios por partida',value:fmt(mean('corners').value),icon:Flag,note:`${mean('corners').count} jogos com dados`}].map(k=><div className="kpi" key={k.label}><div><span>{k.label}</span><k.icon size={20}/></div><strong>{k.value}</strong><small>{k.note}</small></div>)}</div>
 <div className="dashboard-grid"><section className="panel"><div className="panel-head"><div><h2>Média de gols por equipe</h2><p>O ataque em perspectiva</p></div><span className="tag">{period==='full'?'90 MIN':'1º TEMPO'}</span></div>{ranking.some(t=>t.samples.goals)?<div className="ranking">{ranking.filter(t=>t.samples.goals).slice(0,5).map(t=><div className="rank-row" key={t.id}><div><span className="badge" style={{background:t.color}}>{t.name.slice(0,3).toUpperCase()}</span><span>{t.name}<small>{t.samples.goals} partidas com gols</small></span></div><div className="bar-track"><div style={{width:`${(t.values.goals??0)/Math.max(...ranking.map(r=>r.values.goals??0),1)*100}%`,background:t.color}}/></div><b>{fmt(t.values.goals)}</b></div>)}</div>:<div className="empty"><Goal/><h3>Seu próximo gol começa aqui</h3><p>Cadastre uma partida para visualizar as médias.</p><button className="text-button" onClick={()=>openMatch()}>Registrar primeira partida <ArrowUpRight size={16}/></button></div>}<div className="panel-foot">N/D: não disponível. Cada média exclui dados ausentes; amostras variam por métrica.</div></section>
 <section className="insight"><div className="eyebrow">MAIS CONTEXTO, MELHORES ANÁLISES</div><h2>O placar é só<br/>o começo.</h2><p>Compare gols, finalizações, escanteios e cartões de duas equipes, período por período.</p><div className="pitch"><div className="pitch-line"/><div className="pitch-circle"/><span className="player one"/><span className="player two"/><span className="player three"/><span className="player four"/></div><button onClick={()=>setPage(2)}>Comparar equipes <ArrowUpRight size={18}/></button></section></div>
 <section className="panel recent"><div className="panel-head"><div><h2>Últimas partidas</h2><p>Os jogos mais recentes da sua base</p></div><button className="text-button" onClick={()=>setPage(3)}>Ver histórico <ArrowUpRight size={16}/></button></div>{sorted.length?sorted.slice(0,4).map(m=><MatchRow key={m.id} m={m}/>):<div className="empty compact"><History/><p>Nenhuma partida cadastrada ainda.</p><button className="text-button" onClick={demo}>Explorar com dados de demonstração <ArrowUpRight size={16}/></button></div>}</section></>}
 {page===1&&<>{!scopedTeams.length?<div className="panel empty"><Users/><h3>Monte sua base de equipes</h3><p>Selecione outro campeonato ou cadastre equipes para continuar.</p><button className="primary" onClick={()=>openTeam()}>Cadastrar equipe</button></div>:<div className="team-grid">{scopedTeams.map(t=>{const avg=average(scopedMatches,t.id,period);return <section className="panel team-card" key={t.id}><div className="team-card-top"><Badge id={t.id}/><div><button aria-label={`Editar ${t.name}`} onClick={()=>openTeam(t)}><Pencil size={16}/></button><button aria-label={`Excluir ${t.name}`} onClick={()=>removeTeam(t)}><Trash2 size={16}/></button></div></div><h2>{t.name}</h2><p>{avg.count} partidas cadastradas</p><div className="team-numbers"><span><b>{fmt(avg.values.goals)}</b>Gols / jogo ({avg.samples.goals} jogos)</span><span><b>{fmt(avg.values.shots)}</b>Finalizações / jogo ({avg.samples.shots} jogos)</span></div></section>;})}</div>}</>}
 {page===2&&<section className="panel compare-panel"><div className="panel-head"><div><h2>Comparação de médias</h2><p>{period==='full'?'Partida completa':'Primeiro tempo'} · por equipe, por jogo</p></div><ArrowLeftRight size={22}/></div>{scopedTeams.length<2?<div className="empty"><Users/><h3>Precisamos de duas equipes</h3><p>Cadastre suas equipes para começar a comparação.</p><button className="primary" onClick={()=>openTeam()}>Cadastrar equipe</button></div>:<><div className="compare-select">{[0,1].map(i=><label key={i}>Equipe {i+1}<select value={selected[i]} onChange={e=>setCompare(i===0?[e.target.value,selected[1]]:[selected[0],e.target.value])}>{scopedTeams.map(t=><option value={t.id} key={t.id}>{t.name}</option>)}</select><small>{average(scopedMatches,selected[i],period).count} partidas na amostra</small></label>)}</div>{selected[0]===selected[1]?<p className="alert">Selecione equipes diferentes.</p>:<div className="comparison">{metrics.map(k=>{const aa=average(scopedMatches,selected[0],period),bb=average(scopedMatches,selected[1],period),a=aa.values[k],b=bb.values[k];return <div className="compare-row" key={k}><b>{fmt(a)}</b><div><span>{labels[k]} · amostras: {aa.samples[k]} / {bb.samples[k]}</span><div className="compare-bars"><div style={{width:`${a!==null&&b!==null&&a+b?a/(a+b)*100:0}%`,background:team(selected[0])?.color}}/><div style={{width:`${a!==null&&b!==null&&a+b?b/(a+b)*100:0}%`,background:team(selected[1])?.color}}/></div></div><b>{fmt(b)}</b></div>;})}{selected.some(id=>!average(scopedMatches,id,period).count)&&<p className="muted">Sem partidas para uma das equipes. As médias sem dados aparecem como N/D.</p>}</div>}</>}</section>}
 
 {page===3&&<section className="panel">
   <div className="panel-head history-head"><div><h2>Histórico de partidas</h2><p>Filtre por competição e temporada. Toque em um jogo para consultar os dados.</p></div>
     <input className="search" aria-label="Buscar partida" placeholder="Buscar equipe ou competição" value={search} onChange={e=>{setSearch(e.target.value);setHistoryPage(1);}}/>
   </div>
   <div className="history-count">Exibindo {historyListing.items.length} de {historyListing.total} partidas encontradas</div>
   {historyListing.items.map(m=><MatchRow key={m.id} m={m}/>)}
   {historyMatches.length===0&&<div className="empty"><History/><h3>Nenhuma partida encontrada</h3><p>Altere os filtros ou a busca para encontrar outros registros.</p></div>}
   {historyListing.pages>1&&<div className="history-pagination" aria-label="Páginas do histórico">
     <button type="button" disabled={historyListing.page===1} onClick={()=>setHistoryPage(Math.max(1,historyListing.page-1))}>← Anterior</button>
     <span>Página {historyListing.page} de {historyListing.pages}</span>
     <button type="button" disabled={historyListing.page===historyListing.pages} onClick={()=>setHistoryPage(Math.min(historyListing.pages,historyListing.page+1))}>Próxima →</button>
   </div>}
 </section>}
 {page===4&&<><PwaUpdateStatus/><FplStatsPilot/><OpenFootballPilot/><WorkCsvImport data={data} save={commit}/></>}
 {page===5&&<PreGame data={data}/>}
 {page===6&&<Radar data={data}/>}
 {page===7&&<section className="tools-hub" aria-label="Ferramentas opcionais e experimentais">
   <div className="tools-hub-menu" role="group" aria-label="Selecionar ferramenta">
    {[
      {key:'image',label:'Importar por imagem',icon:ScanLine},
      {key:'sportsdb',label:'TheSportsDB V1',icon:CloudDownload},
      {key:'live',label:'Ao vivo (experimental)',icon:Radio},
      {key:'api',label:'Partidas automáticas (teste)',icon:Activity},
    ].map(t=><button type="button" key={t.key} aria-pressed={toolPanel===t.key} onClick={()=>setToolPanel(t.key as typeof toolPanel)}><t.icon size={18}/>{t.label}</button>)}
   </div>
   <p className="tools-hub-hint">Ferramentas opcionais: não são necessárias para consultar o histórico ou o Radar. Fontes externas podem ter cobertura e acesso limitados.</p>
   {toolPanel==='image'&&<Integration data={data} save={commit} mode="image"/>}
   {toolPanel==='sportsdb'&&<Integration data={data} save={commit} mode="sportsdb"/>}
   {toolPanel==='live'&&<Live data={data}/>}
   {toolPanel==='api'&&<AutomaticMatches/>}
 </section>}
 <footer><span><Shield size={14}/> Seus dados ficam neste navegador. Exporte backups regularmente.</span><span>Análises estatísticas, sem garantia de resultados.</span></footer></main></div>
 <input hidden ref={file} type="file" accept="application/json,.json" onChange={e=>void importData(e.target.files?.[0])}/>
 {modal&&<div className="overlay" onClick={()=>setModal(null)}><section className={`dialog ${modal==='match'?'wide':''}`} role="dialog" aria-modal="true" aria-labelledby="dialog-title" onClick={e=>e.stopPropagation()}><div className="dialog-head"><h2 id="dialog-title">{edit?'Editar':'Nova'} {modal==='team'?'equipe':'partida'}</h2><button aria-label="Fechar" onClick={()=>setModal(null)}><X/></button></div>{error&&<div className="alert" role="alert">{error}</div>}{modal==='team'?<form onSubmit={saveTeam}><label>Nome da equipe<input autoFocus required maxLength={80} value={teamName} onChange={e=>setTeamName(e.target.value)} placeholder="Ex.: Palmeiras"/></label><label>Cor da equipe<input type="color" value={color} onChange={e=>setColor(e.target.value)}/></label><button className="primary" type="submit">Salvar equipe</button></form>:data.teams.length<2?<div className="empty"><p>Cadastre pelo menos duas equipes antes de registrar uma partida.</p><button className="primary" onClick={()=>openTeam()}>Cadastrar equipe</button></div>:match&&<form onSubmit={saveMatch}><div className="form-grid">{(['home','away'] as const).map((key,i)=><label key={key}>{i?'Visitante':'Mandante'}<select value={match[key]} onChange={e=>setMatch({...match,[key]:e.target.value})}>{data.teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>)}<label>Data<input required type="date" value={match.date} onChange={e=>setMatch({...match,date:e.target.value})}/></label><label>Competição<input maxLength={100} value={match.competition} onChange={e=>setMatch({...match,competition:e.target.value})} placeholder="Ex.: Campeonato Brasileiro"/></label></div><p className="muted">Informe os números de cada tempo. O total será somado automaticamente. Inclua os gols nas finalizações no alvo.</p>{(['first','second'] as const).map((p,i)=><div className="stats-form" key={p}><h3>{i+1}º tempo</h3><div className="stats-head"><span>Estatística</span><b>{team(match.home)?.name}</b><b>{team(match.away)?.name}</b></div>{metrics.map(k=><div className="stats-input-row" key={k}><span>{labels[k]}</span>{[0,1].map(side=><input key={side} required={! ['xg','possession','chances'].includes(k)} type="number" min="0" step={k==='xg'||k==='possession'?'0.01':'1'} max={k==='possession'?100:undefined} aria-label={`${labels[k]} ${team(side?match.away:match.home)?.name} ${i+1}º tempo`} value={match[p][side][k]==null||Number.isNaN(match[p][side][k])?'':match[p][side][k]!} onChange={e=>{const parts=[...match[p]] as [Stats,Stats];parts[side]={...parts[side],[k]:e.target.value===''?(['xg','possession','chances'].includes(k)?null:NaN):Number(e.target.value)};setMatch({...match,[p]:parts});}}/>)}</div>)}</div>)}<button className="primary" type="submit">Salvar partida</button></form>}</section></div>}
 {detail&&<div className="overlay" onClick={()=>setDetail(null)}><section className="dialog wide" role="dialog" aria-modal="true" aria-labelledby="detail-title" onClick={e=>e.stopPropagation()}><div className="dialog-head"><h2 id="detail-title">Detalhes da partida</h2><button aria-label="Fechar detalhes" onClick={()=>setDetail(null)}><X/></button></div><p className="muted">{dateLabel(detail.date)} · {detail.competition||'Amistoso'}{detail.country&&` · ${detail.country}`}{detail.round&&` · Rodada ${detail.round}`}</p><h3 className="detail-title">{team(detail.home)?.name} {fmt(stats(detail,0,detailPeriod).goals)} : {fmt(stats(detail,1,detailPeriod).goals)} {team(detail.away)?.name}</h3><div className="segment"><button className={detailPeriod==='first'?'selected':''} onClick={()=>setDetailPeriod('first')}>1º tempo</button><button className={detailPeriod==='second'?'selected':''} onClick={()=>setDetailPeriod('second')}>2º tempo</button><button className={detailPeriod==='full'?'selected':''} onClick={()=>setDetailPeriod('full')}>Partida completa</button></div>{metrics.map(k=><div className="stats-input-row detail-row" key={k}><span>{labels[k]}</span><b>{fmt(stats(detail,0,detailPeriod)[k])}{detail.image&&<small className="field-origin">{imageFieldOrigin(k,0)}</small>}</b><b>{fmt(stats(detail,1,detailPeriod)[k])}{detail.image&&<small className="field-origin">{imageFieldOrigin(k,1)}</small>}</b></div>)}<p className="muted">N/D = Não disponível.{detail.external&&` Fonte: TheSportsDB · ID ${detail.external.id} · Status: ${detail.external.status}. Dados de primeiro tempo não fornecidos. Registro importado somente leitura.`}</p>{detail.research&&<p className="muted">Fonte: <a href={detail.research.sourceUrl} target="_blank" rel="noopener noreferrer">Flashscore · pesquisa CSV</a> · {new Date(detail.research.importedAt).toLocaleString('pt-BR')}.{detail.research.dateDiscrepancy&&` Atenção: título ${detail.research.titleDate}, corpo ${detail.date}. Confira antes de analisar.`} Registro importado somente leitura.</p>}{detail.image&&<p className="muted">Fonte: importação por imagem, revisada pelo usuário · {new Date(detail.image.importedAt).toLocaleString('pt-BR')}. Períodos: {detail.image.periods.map(p=>({first:'1º tempo',second:'2º tempo',full:'jogo completo'})[p]).join(', ')}. Valores calculados/corrigidos identificados nos metadados do backup.</p>}<div className="dialog-actions"><button disabled={!!detail.external||!!detail.image||!!detail.research} className="primary" onClick={()=>{openMatch(detail);setDetail(null);}}><Pencil size={16}/>Editar partida</button><button className="danger" onClick={()=>{if(confirm('Excluir esta partida e suas estatísticas?')&&commit({...data,matches:data.matches.filter(m=>m.id!==detail.id)}))setDetail(null);}}><Trash2 size={16}/>Excluir</button></div></section></div>}
 </div>;
}

import {useCallback,useEffect,useState} from 'react';

/** PWA update diagnostics; never reads or changes the saved history or Radar. */
declare const __FUTSTATS_BUILD_SHA__: string;
const sha=typeof __FUTSTATS_BUILD_SHA__==='string'?__FUTSTATS_BUILD_SHA__:'unknown';
const buildLabel=sha==='unknown'?'não identificada':sha.slice(0,8);

export default function PwaUpdateStatus(){
 const [message,setMessage]=useState('');
 const [checking,setChecking]=useState(false);
 const [ready,setReady]=useState(false);

 const check=useCallback(async(silent=false)=>{
  if(!('serviceWorker' in navigator)){
   if(!silent)setMessage('Este navegador não disponibiliza atualização PWA. Nenhum dado foi alterado.');
   return;
  }
  if(!silent){setChecking(true);setMessage('Procurando a versão publicada…');}
  try{
   const registration=await navigator.serviceWorker.getRegistration();
   if(!registration){
    if(!silent)setMessage('O atual endereço não tem atualização PWA registrada. Confira se é o aplicativo V4 correto.');
    return;
   }
   await registration.update();
   if(registration.waiting){setReady(true);setMessage('Nova versão disponível para ativação.');}
   else if(!silent)setMessage('Consulta concluída. Uma atualização identificada pode ser aplicada ao reabrir o aplicativo.');
  }catch{
   if(!silent)setMessage('Não foi possível conferir agora. Verifique a conexão e tente novamente sem limpar os dados.');
  }finally{if(!silent)setChecking(false);}
 },[]);

 useEffect(()=>{
  if(!('serviceWorker' in navigator))return;
  const changed=()=>{setReady(true);setMessage('Uma nova versão foi ativada. Você pode recarregar a tela.');};
  const visible=()=>{if(document.visibilityState==='visible')void check(true);};
  navigator.serviceWorker.addEventListener('controllerchange',changed);
  document.addEventListener('visibilitychange',visible);
  void check(true);
  return ()=>{
   navigator.serviceWorker.removeEventListener('controllerchange',changed);
   document.removeEventListener('visibilitychange',visible);
  };
 },[check]);

 async function apply(){
  if(!window.confirm('Recarregar a versão do FutStats? Termine edições não salvas antes de continuar. As partidas e previsões já salvas neste endereço não serão apagadas.'))return;
  try{
   const registration=await navigator.serviceWorker.getRegistration();
   registration?.waiting?.postMessage({type:'SKIP_WAITING'});
  }catch{ /* normal reload still works without touching local data */ }
  window.location.reload();
 }
 return <section className="panel" aria-label="Atualização do FutStats V4">
  <div className="panel-head"><div>
   <h2>Versão e atualização do aplicativo</h2>
   <p className="muted">Versão desta tela: <strong>{buildLabel}</strong>. Atualizar não exclui o histórico nem o Radar armazenados neste endereço.</p>
  </div></div>
  <div className="backup-buttons">
   <button type="button" className="text-button" disabled={checking} onClick={()=>void check()}>
    {checking?'Conferindo atualização…':'Conferir atualização do aplicativo'}
   </button>
   {ready&&<button type="button" className="primary" onClick={()=>void apply()}>Reabrir com nova versão</button>}
  </div>
  {message&&<p className="muted" role="status">{message}</p>}
 </section>;
}

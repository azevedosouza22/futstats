/**
 * On-demand, read-only diagnostic for the Radar UI. The measured properties
 * are local browser observations, NOT physical Android QA, offline/PWA
 * certification, model accuracy, or a proof that storage writes will persist.
 */
export type RadarDeviceProbe={
 viewportWidth:number;documentWidth:number;
 createButton:{width:number;height:number}|null;
 savedButton:{width:number;height:number}|null;
 storageReadable:boolean;invalidStorageGroups:number;
 randomUUIDAvailable:boolean;sha256Available:boolean;
};
export type RadarDeviceCheck={id:string;label:string;ok:boolean;reason:string};
export type RadarDeviceReport={
 checkedAt:string;status:'APTO_PARA_TESTE'|'REVISAR';
 checks:RadarDeviceCheck[];total:number;passed:number;failed:number;
 disclaimer:'DIAGNÓSTICO LOCAL — NÃO É TESTE FÍSICO ANDROID';
};
const minimumTouchPx=44;
export function analyzeRadarDevice(probe:RadarDeviceProbe,at=new Date()):RadarDeviceReport{
 const realWidth=Number.isFinite(probe.viewportWidth)&&probe.viewportWidth>0;
 const noOverflow=realWidth&&Number.isFinite(probe.documentWidth)&&
  probe.documentWidth<=probe.viewportWidth+1;
 const touch=(rect:{width:number;height:number}|null)=>!!rect&&
  Number.isFinite(rect.width)&&Number.isFinite(rect.height)&&
  rect.width>=minimumTouchPx&&rect.height>=minimumTouchPx;
 const checks:RadarDeviceCheck[]=[
  {id:'viewport',label:'Tela sem rolagem horizontal geral',ok:noOverflow,
   reason:noOverflow?'Enquadramento medido nesta tela.':
    'Há conteúdo fora da largura da tela ou a dimensão está indisponível.'},
  {id:'touch_create',label:'Toque no botão Criar previsão (44 px)',ok:touch(probe.createButton),
   reason:touch(probe.createButton)?'Área mínima de toque observada.':
    'Botão menor que 44 px ou não encontrado.'},
  {id:'touch_saved',label:'Toque no botão Ver previsões (44 px)',ok:touch(probe.savedButton),
   reason:touch(probe.savedButton)?'Área mínima de toque observada.':
    'Botão menor que 44 px ou não encontrado.'},
  {id:'storage',label:'Leitura e integridade dos grupos V4',ok:probe.storageReadable&&probe.invalidStorageGroups===0,
   reason:probe.storageReadable&&probe.invalidStorageGroups===0?
    'Dados presentes são legíveis; grupos ausentes não são dados inventados.':
    'Há grupo inválido ou o navegador não permitiu ler os dados.'},
  {id:'uuid',label:'Gerador seguro de IDs das previsões',ok:probe.randomUUIDAvailable,
   reason:probe.randomUUIDAvailable?'Disponível para futuros registros.':
    'O navegador não oferece crypto.randomUUID neste contexto.'},
  {id:'sha256',label:'SHA-256 disponível para o dossiê local',ok:probe.sha256Available,
   reason:probe.sha256Available?'Disponível para verificar integridade LOCAL.':
    'crypto.subtle indisponível; exportação de dossiê pode falhar.'}
 ];
 const passed=checks.filter(c=>c.ok).length;
 return {checkedAt:at.toISOString(),status:passed===checks.length?'APTO_PARA_TESTE':'REVISAR',
  checks,total:checks.length,passed,failed:checks.length-passed,
  disclaimer:'DIAGNÓSTICO LOCAL — NÃO É TESTE FÍSICO ANDROID'};
}

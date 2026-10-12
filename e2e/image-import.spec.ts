import {test,expect,type Page} from '@playwright/test';
// Generated high-contrast images for OCR plumbing tests, NOT real Flashscore screenshots.
async function synthetic(page:Page,period:string,rows:[string,number|string,number|string][],dark=false) {
 const data=await page.evaluate(({period,rows,dark})=>{
  const canvas=document.createElement('canvas');canvas.width=1100;canvas.height=900;const c=canvas.getContext('2d')!;c.fillStyle=dark?'#171b20':'#fff';c.fillRect(0,0,1100,900);c.fillStyle=dark?'#eee':'#111';c.font='32px Arial';
  const header=['Mandante: Hull City','Visitante: Everton','Data: 11/10/2026',period];header.forEach((text,i)=>c.fillText(text,60,70+i*70));
  rows.forEach(([label,home,away],i)=>{const y=400+i*100;c.fillText(String(home),60,y);c.fillText(label,280,y);c.fillText(String(away),980,y);});
  return canvas.toDataURL('image/png').split(',')[1];
 },{period,rows,dark});
 return Buffer.from(data,'base64');
}
async function start(page:Page){await page.goto('/');await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise<void>(r=>navigator.serviceWorker.addEventListener('controllerchange',()=>r(),{once:true}));});await page.getByRole('button',{name:'Importar',exact:true}).click();}

test('OCR local real em imagens sintéticas, revisão, persistência, backup, cálculos e offline',async({page,context})=>{
 const errors:string[]=[];const external:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith('http://localhost:5190')&&!r.url().startsWith('blob:')&&!r.url().startsWith('data:'))external.push(r.url());});
 await start(page);
 const first=await synthetic(page,'1º TEMPO',[['Total de finalizações',5,10],['Finalizações no alvo',3,3],['Escanteios',5,5]]);
 const second=await synthetic(page,'2º TEMPO',[['Total de finalizações',4,5],['Finalizações no alvo',2,4],['Escanteios',2,1]]);
 const full=await synthetic(page,'JOGO',[['Total de finalizações',9,15],['Finalizações no alvo',5,7],['Escanteios',7,6]]);
 await page.getByLabel('Selecionar imagens',{exact:true}).setInputFiles([{name:'synthetic-first.png',mimeType:'image/png',buffer:first},{name:'synthetic-second.png',mimeType:'image/png',buffer:second},{name:'synthetic-full.png',mimeType:'image/png',buffer:full}]);
 await expect(page.locator('.image-preview')).toHaveCount(3);
 // Replacement and removal are reversible and release the previous preview.
 await page.locator('.image-preview').nth(2).getByLabel('Substituir').setInputFiles({name:'synthetic-full-replaced.png',mimeType:'image/png',buffer:full});
 await page.getByRole('button',{name:'Reconhecer imagens',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Conferir a partida'})).toBeVisible({timeout:120000});
 await expect(page.getByLabel('Período imagem 1')).toHaveValue('first');await expect(page.getByLabel('Período imagem 2')).toHaveValue('second');await expect(page.getByLabel('Período imagem 3')).toHaveValue('full');
 const result=page.locator('.ocr-result');const total=result.locator('details').nth(2);
 await expect(total.getByLabel('Finalizações mandante',{exact:true})).toHaveValue('9');await expect(total.getByLabel('Finalizações visitante',{exact:true})).toHaveValue('15');
 await expect(total.getByLabel('Cartões amarelos mandante',{exact:true})).toHaveValue('');await expect(page.getByRole('button',{name:'Salvar partida',exact:true})).toBeDisabled();
 await total.getByLabel('Finalizações mandante',{exact:true}).fill('10');await expect(page.getByRole('alert').filter({hasText:'Revisão necessária'})).toBeVisible();await total.getByLabel('Finalizações mandante',{exact:true}).fill('9');
 await total.getByLabel('Gols mandante',{exact:true}).fill('2');await total.getByLabel('Gols visitante',{exact:true}).fill('2');
 await page.getByLabel(/Revisei equipes/).check();await page.getByRole('button',{name:'Salvar partida',exact:true}).click();await expect(page.getByText(/Partida salva na sua base local/)).toBeVisible();
 await page.getByRole('button',{name:'Histórico',exact:true}).click();await expect(page.locator('.match-row')).toHaveCount(1);await expect(page.locator('.match-row')).toContainText('Imagem revisada');
 await page.reload();await page.getByRole('button',{name:'Histórico',exact:true}).click();await page.locator('.match-row').click();await expect(page.getByRole('dialog')).toContainText('importação por imagem');await page.getByRole('button',{name:'Fechar detalhes'}).click();
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Exportar backup',exact:true}).click();const backup=await download;expect(backup.suggestedFilename()).toBe('futstats-backup.json');
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('futstats:v1')!));expect(stored.matches).toHaveLength(1);expect(stored.matches[0].image.fields.full.goals[0]).toBe('corrected');expect(stored.matches[0].first.goals).toBeUndefined();expect(stored.matches[0].first[0].goals).toBeNull();expect(JSON.stringify(stored)).not.toContain('data:image');
 for(const name of ['Visão geral','Equipes','Comparação','Histórico','Importar','Pré-jogo','Ao vivo']){await page.getByRole('button',{name,exact:true}).click();expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);}
 // Offline OCR uses this device's warmed service worker cache and IndexedDB language data.
 await context.setOffline(true);await page.reload();await page.getByRole('button',{name:'Importar',exact:true}).click();await page.getByLabel('Selecionar imagens',{exact:true}).setInputFiles({name:'offline-synthetic.png',mimeType:'image/png',buffer:full});await page.getByRole('button',{name:'Reconhecer imagens',exact:true}).click();await expect(page.getByRole('heading',{name:'Conferir a partida'})).toBeVisible({timeout:120000});await expect(page.locator('.ocr-result').locator('details').nth(2).getByLabel('Finalizações mandante',{exact:true})).toHaveValue('9');
 await page.getByLabel(/Revisei equipes/).check();await expect(page.getByRole('button',{name:'Salvar partida',exact:true})).toBeDisabled();await expect(page.getByText(/Possível duplicata dessas equipes nesta data/)).toBeVisible();
 expect(external).toEqual([]);expect(errors).toEqual([]);
});

test('formatos inválidos, cancelamento e limpeza do fluxo',async({page})=>{
 await start(page);await page.getByLabel('Selecionar imagens',{exact:true}).setInputFiles({name:'x.gif',mimeType:'image/gif',buffer:Buffer.from('bad')});await expect(page.getByRole('alert')).toContainText('JPG');
 const file=await synthetic(page,'JOGO',[['Total de finalizações',9,15]]);await page.getByLabel('Selecionar imagens',{exact:true}).setInputFiles({name:'cancel.png',mimeType:'image/png',buffer:file});await page.getByRole('button',{name:'Reconhecer imagens',exact:true}).click();await page.getByRole('button',{name:'Cancelar leitura',exact:true}).click();await expect(page.getByText(/Leitura cancelada. Você pode tentar novamente/)).toBeVisible();await page.getByRole('button',{name:'Remover imagem 1',exact:true}).click();await expect(page.locator('.image-preview')).toHaveCount(0);await expect(page.getByRole('button',{name:'Reconhecer imagens',exact:true})).toBeDisabled();
});

test('imagem sintética escura: OCR decimal e revisão de valor suspeito',async({page})=>{
 await start(page);
 const image=await synthetic(page,'JOGO',[['Gols esperados (xG)','1,71','0.85'],['Posse de bola','61%','39%'],['Total de finalizações',13,24]],true);
 await page.getByLabel('Selecionar imagens',{exact:true}).setInputFiles({name:'dark-synthetic.png',mimeType:'image/png',buffer:image});
 await page.getByRole('button',{name:'Reconhecer imagens',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Conferir a partida'})).toBeVisible({timeout:120000});
 const total=page.locator('.ocr-result details').nth(2);
 await expect(total.getByLabel('Gols esperados (xG) mandante',{exact:true})).toHaveValue('1.71');
 await expect(total.getByLabel('Gols esperados (xG) visitante',{exact:true})).toHaveValue('0.85');
 await expect(total.getByLabel('Finalizações mandante',{exact:true})).toHaveValue('13');
 await total.getByLabel('Gols esperados (xG) mandante',{exact:true}).fill('171');
 await expect(total.getByText('Valor suspeito — confira a imagem',{exact:true})).toBeVisible();
 await total.getByLabel('Gols esperados (xG) mandante',{exact:true}).fill('1.71');
 await expect(total.getByText('Valor suspeito — confira a imagem',{exact:true})).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
});

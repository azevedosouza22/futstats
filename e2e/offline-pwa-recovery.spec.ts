import {test,expect} from '@playwright/test';

/**
 * Stage 69 — run against Vite's PRODUCTION preview, with real Chromium
 * service workers enabled. Uses only synthetic data in Playwright context.
 * This is browser offline QA, NOT a physical Android test or deployment.
 */
test.use({serviceWorkers:'allow'});
const FIXTURE_DAY='2026-10-25T15:00:00.000Z'; // 12h Brasília, before kickoff
const DATA_KEY='futstats:v1';
const RADAR_KEY='futstats-radar-previews-v1';
const league='La Liga espanhola 2026/27';
const stats=(goals:number,shots:number,target:number,corners:number)=>({
 goals,shots,target,corners,yellow:0,red:0
});
function syntheticHistory(){
 return {teams:[
  {id:'barcelona',name:'Barcelona',color:'#234567'},
  {id:'real-madrid',name:'Real Madrid',color:'#456789'},
  ...Array.from({length:5},(_,i)=>({id:'opponent-'+i,name:'Oponente '+i,color:'#345678'})),
  ...Array.from({length:5},(_,i)=>({id:'visitor-'+i,name:'Visitante '+i,color:'#345678'}))
 ],matches:[
  ...Array.from({length:5},(_,i)=>({
   id:'home-historical-'+i,date:'2026-10-'+String(i+10).padStart(2,'0'),
   home:'barcelona',away:'opponent-'+i,competition:league,
   first:[stats(2,18,7,5),stats(1,14,5,6)],
   second:[stats(0,0,0,0),stats(0,0,0,0)]
  })),
  ...Array.from({length:5},(_,i)=>({
   id:'away-historical-'+i,date:'2026-10-'+String(i+16).padStart(2,'0'),
   home:'visitor-'+i,away:'real-madrid',competition:league,
   first:[stats(2,18,7,5),stats(1,14,5,6)],
   second:[stats(0,0,0,0),stats(0,0,0,0)]
  }))
 ]};
}
async function waitForOfflineReady(page:import('@playwright/test').Page){
 await page.waitForFunction(async ()=>{
  if(!('serviceWorker' in navigator))return false;
  const registration=await navigator.serviceWorker.ready;
  return !!registration.active;
 },null,{timeout:25000});
 // First navigation usually installs and activates. A reload makes the
 // controlled page and all its JS/CSS resolve from the SW precache offline.
 if(!(await page.evaluate(()=>!!navigator.serviceWorker.controller)))
  await page.reload();
 await page.waitForFunction(()=>!!navigator.serviceWorker.controller,null,{timeout:25000});
 const evidence=await page.evaluate(async ()=>({
   controller:!!navigator.serviceWorker.controller,
   scope:(await navigator.serviceWorker.ready).scope,
   caches:(await caches.keys()).filter(n=>n.includes('precache'))
 }));
 expect(evidence.controller).toBe(true);
 expect(evidence.caches.length).toBeGreaterThan(0);
}
async function localSnapshot(page:import('@playwright/test').Page){
 return page.evaluate(()=>Object.fromEntries(
  Array.from({length:localStorage.length},(_,i)=>localStorage.key(i)!)
   .map(k=>[k,localStorage.getItem(k)])));
}
test('Etapa 69: PWA controlado reabre agenda e previsão congelada sem internet',async({page,context})=>{
 test.setTimeout(90000);
 await page.clock.install({time:new Date(FIXTURE_DAY)});
 // Any real provider access is forbidden by this test; no live results.
 await page.route('**/raw.githubusercontent.com/**',r=>r.abort());
 await page.goto('/');
 await waitForOfflineReady(page);
 const data=syntheticHistory();
 await page.evaluate(({key,data})=>localStorage.setItem(key,JSON.stringify(data)),
  {key:DATA_KEY,data});
 await page.reload();
 await page.getByRole('button',{name:/Agenda e Radar/}).click();
 const boas=page.getByRole('region',{name:/As Boas do Dia/});
 await expect(boas.getByText('FC Barcelona × Real Madrid')).toBeVisible();
 await boas.getByRole('button',{name:'Abrir Radar e conferir análise'}).click();
 await page.getByRole('button',{name:'Salvar previsão V2/V3 deste jogo'}).click();
 await expect(page.getByText('Análise prospectiva registrada neste navegador.')).toBeVisible();
 const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)??'[]'),RADAR_KEY);
 expect(saved).toHaveLength(1);
 const before=await localSnapshot(page);
 // Turning network OFF is the point of this separate SW-enabled test.
 await context.setOffline(true);
 try{
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.getByRole('button',{name:/Agenda e Radar/})).toBeVisible();
  await page.getByRole('button',{name:/Agenda e Radar/}).click();
  await page.getByRole('button',{name:/Ver previsões já registradas/}).click();
  await expect(page.locator('#radar-saved-forecasts')).toContainText('Barcelona × Real Madrid');
  expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)??'[]'),RADAR_KEY))
   .toEqual(saved);
  expect(await localSnapshot(page)).toEqual(before);
  // Offline PWA must NOT turn a stale public-source link into a fresh check.
  await expect(page.getByText('Conferência independente · lista de trabalho')).toBeVisible();
 }finally{
  await context.setOffline(false);
 }
 await page.reload();
 expect(await localSnapshot(page)).toEqual(before);
});

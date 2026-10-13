import {test,expect} from '@playwright/test';
// SIMULATED route responses. Not actual API data for fixture 1492402.
test('Partidas automáticas: consultas manuais, N/D, half e base local preservada',async({page})=>{
 const calls:string[]=[];
 await page.route('**/api/api-football?*',async route=>{
  const url=new URL(route.request().url());calls.push(url.search);
  let body;
  if(url.searchParams.get('kind')==='config')body={dates:['2026-10-13'],fixtures:['1492402']};
  else if(url.searchParams.get('kind')==='fixtures')body={items:[{id:1492402,date:'2026-10-13T18:00:00-03:00',status:'2H',statusLabel:'Segundo tempo (fixture sintético)',minute:60,league:'Competição simulada',country:'Brasil',home:{id:1,name:'Equipe A de teste'},away:{id:2,name:'Equipe B de teste'},goals:[1,0]}]};
  else body={fixtureId:1492402,halfRequested:url.searchParams.get('half')==='true',fetchedAt:'2026-10-13T21:00:00Z',items:[{team:{id:1,name:'A'},statistics:[{type:'Total Shots',value:9},{type:'Red Cards',value:null}],statistics_1h:null,statistics_2h:null},{team:{id:2,name:'B'},statistics:[{type:'Total Shots',value:7}],statistics_1h:null,statistics_2h:null}]};
  await route.fulfill({json:body});
 });
 await page.goto('/');const before=await page.evaluate(()=>localStorage.getItem('futstats:v1'));await page.getByRole('button',{name:'Partidas automáticas',exact:true}).click();expect(calls).toHaveLength(0);
 await page.getByLabel('Código de acesso privado').fill('private-test-token-123');await page.getByRole('button',{name:'Acessar consultas'}).click();await page.getByRole('button',{name:'Consultar partidas'}).click();await page.locator('.automatic-fixture').click();
 await expect(page.getByText('Acumulado da partida',{exact:true})).toBeVisible();await expect(page.locator('tr').filter({hasText:'Finalizações'}).first()).toContainText('9');
 await expect(page.locator('tr').filter({hasText:'Cartões vermelhos'}).first()).toContainText('N/D');await page.getByRole('button',{name:'Consultar dados por tempo'}).click();await expect(page.getByRole('heading',{name:'Primeiro tempo',exact:true})).toBeVisible();await expect(page.getByText(/Não há estatísticas identificadas/)).toHaveCount(2);
 expect(calls).toHaveLength(4);expect(calls[3]).toContain('half=true');expect(await page.evaluate(()=>localStorage.getItem('futstats:v1'))).toBe(before);expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
});
test('limite diário gera aviso sem retentativa automática',async({page})=>{
 let count=0;await page.route('**/api/api-football?*',async route=>{
  if(new URL(route.request().url()).searchParams.get('kind')==='config')await route.fulfill({json:{dates:['2026-10-13'],fixtures:['1492402']}});
  else{count++;await route.fulfill({status:429,json:{error:'Limite diário da API atingido.'}});}
 });
 await page.goto('/');await page.getByRole('button',{name:'Partidas automáticas',exact:true}).click();await page.getByLabel('Código de acesso privado').fill('private-test-token-123');await page.getByRole('button',{name:'Acessar consultas'}).click();await page.getByRole('button',{name:'Consultar partidas'}).click();await expect(page.getByRole('alert')).toContainText('Limite diário');expect(count).toBe(1);
});

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
 await expect(page.getByRole('heading',{name:'Acumulado da partida',exact:true})).toBeVisible();await expect(page.locator('.auto-summary-card').filter({hasText:'Finalizações'}).first()).toContainText('9');
 await expect(page.locator('.auto-more')).not.toHaveAttribute('open','');await page.screenshot({path:`work/panel-v1-${test.info().project.name}.png`,fullPage:true});await page.getByText('Mais estatísticas', {exact:false}).click();await expect(page.locator('.auto-stat').filter({hasText:'Cartões vermelhos'}).first()).toContainText('N/D');await page.getByRole('button',{name:'Consultar dados por tempo'}).click();await expect(page.getByRole('heading',{name:'Primeiro tempo',exact:true})).toBeVisible();await expect(page.locator('.auto-summary-card').filter({hasText:'Gols'}).first().locator('strong')).toHaveText(['N/D','N/D','N/D']);await expect(page.getByText(/Não há estatísticas identificadas/)).toHaveCount(1);await page.getByRole('button',{name:'Segundo tempo',exact:true}).click();await expect(page.getByRole('heading',{name:'Segundo tempo',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Acumulado da partida',exact:true}).click();await expect(page.locator('.auto-summary-card').filter({hasText:'Finalizações'}).first()).toContainText('9');await page.screenshot({path:`work/intelligence-${test.info().project.name}.png`,fullPage:true});await page.getByRole('button',{name:'Voltar às partidas'}).click();await expect(page.locator('.automatic-fixture')).toBeFocused();expect(calls).toHaveLength(4);expect(calls[3]).toContain('half=true');expect(await page.evaluate(()=>localStorage.getItem('futstats:v1'))).toBe(before);expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
});
test('limite diário gera aviso sem retentativa automática',async({page})=>{
 let count=0;await page.route('**/api/api-football?*',async route=>{
  if(new URL(route.request().url()).searchParams.get('kind')==='config')await route.fulfill({json:{dates:['2026-10-13'],fixtures:['1492402']}});
  else{count++;await route.fulfill({status:429,json:{error:'Limite diário da API atingido.'}});}
 });
 await page.goto('/');await page.getByRole('button',{name:'Partidas automáticas',exact:true}).click();await page.getByLabel('Código de acesso privado').fill('private-test-token-123');await page.getByRole('button',{name:'Acessar consultas'}).click();await page.getByRole('button',{name:'Consultar partidas'}).click();await expect(page.getByRole('alert')).toContainText('Limite diário');expect(count).toBe(1);
});
test('lista longa abre detalhes imediatamente, tempos conhecidos, zeros e navegação sem consultas extras',async({page})=>{
 const calls:string[]=[];
 await page.route('**/api/api-football?*',async route=>{
  const url=new URL(route.request().url());calls.push(url.search);const kind=url.searchParams.get('kind');
  const f={id:1492402,date:null,status:'FT',statusLabel:'Encerrado (simulado)',minute:90,league:'Liga simulada',country:null,home:{id:1,name:'Mandante de teste'},away:{id:2,name:'Visitante de teste'},goals:[2,1]};
  if(kind==='config')await route.fulfill({json:{dates:['2026-10-13'],fixtures:['1492402']}});
  else if(kind==='fixtures')await route.fulfill({json:{items:[...Array.from({length:30},(_,i)=>({...f,id:2000000+i})),f]}});
  else{
   await new Promise(resolve=>setTimeout(resolve,250));
   await route.fulfill({json:{fixtureId:1492402,halfRequested:url.searchParams.get('half')==='true',fetchedAt:'2026-10-13T21:00:00Z',items:[1,2].map(id=>({team:{id,name:'Teste'},statistics:[{type:'Total Shots',value:id===1?8:4}],statistics_1h:[{type:'Goals',value:0},{type:'Total Shots',value:0},{type:'Blocked Shots',value:0}],statistics_2h:[{type:'Goals',value:id===1?2:1},{type:'Total Shots',value:id===1?8:4},{type:'Blocked Shots',value:2},{type:'Passes %',value:'75%'}]}))}});
  }
 });
 await page.goto('/');await page.getByRole('button',{name:'Partidas automáticas',exact:true}).click();await page.getByLabel('Código de acesso privado').fill('private-test-token-123');await page.getByRole('button',{name:'Acessar consultas'}).click();await page.getByRole('button',{name:'Consultar partidas'}).click();await page.locator('.automatic-fixture').last().click();
 const title=page.getByRole('heading',{name:'Mandante de teste × Visitante de teste',exact:true});await expect(title).toBeFocused();await expect(page.getByRole('status')).toContainText('Consultando');await expect(page.locator('.automatic-fixture')).toHaveCount(0);expect((await title.boundingBox())!.y).toBeLessThan(page.viewportSize()!.height-100);
 await expect(page.locator('.auto-summary-card').filter({hasText:'Finalizações'}).first()).toContainText('8');await page.getByRole('button',{name:'Consultar dados por tempo'}).click();await expect(page.getByRole('heading',{name:'Primeiro tempo',exact:true})).toBeVisible();await expect(page.locator('.auto-summary-card').filter({hasText:'Finalizações'}).first().locator('strong')).toHaveText(['0','0','0']);await expect(page.locator('.auto-summary-card').filter({hasText:'Gols'}).first().locator('strong')).toHaveText(['0','0','0']);
 await page.getByRole('button',{name:'Segundo tempo',exact:true}).click();await expect(page.locator('.auto-summary-card').filter({hasText:'Finalizações'}).first()).toContainText('8');await expect(page.locator('.auto-summary-card').filter({hasText:'Gols'}).first().locator('strong')).toHaveText(['2','3','1']);await page.getByText('Mais estatísticas',{exact:false}).click();await expect(page.locator('.auto-stat').filter({hasText:'Finalizações bloqueadas'})).toContainText('2');await expect(page.locator('.auto-stat').filter({hasText:'Precisão dos passes'})).toContainText('75%');await page.getByRole('button',{name:'Acumulado da partida',exact:true}).click();expect(calls).toHaveLength(4);expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);await page.getByRole('button',{name:'Voltar às partidas'}).click();await expect(page.locator('.automatic-fixture').last()).toBeFocused();expect(calls).toHaveLength(4);
});
test('falha 403 por tempo tem diagnóstico seguro; indisponibilidade explícita permite revisar N/D sem perder acumulado',async({page})=>{
 let unavailable=false;const calls:string[]=[];
 await page.route('**/api/api-football?*',async route=>{
  const u=new URL(route.request().url());calls.push(u.search);
  if(u.searchParams.get('kind')==='config')await route.fulfill({json:{dates:['2026-10-13'],fixtures:['1492402']}});
  else if(u.searchParams.get('kind')==='fixtures')await route.fulfill({json:{items:[{id:1492402,date:null,status:'FT',statusLabel:'Encerrado (simulado)',minute:90,league:'Liga simulada',country:null,home:{id:1,name:'Equipe de teste A'},away:{id:2,name:'Equipe de teste B'},goals:[2,1]}]}});
  else if(u.searchParams.get('half')==='true')await route.fulfill(unavailable?{json:{fixtureId:1492402,halfRequested:true,items:[],fetchedAt:'2026-10-14T02:00:00Z',availability:'unavailable'}}:{status:502,json:{code:'PROVIDER_FORBIDDEN',upstreamStatus:403,error:'Esta consulta foi proibida pelo provedor.'}});
  else await route.fulfill({json:{fixtureId:1492402,halfRequested:false,fetchedAt:'2026-10-14T02:00:00Z',items:[1,2].map(id=>({team:{id,name:'Teste'},statistics:[{type:'Total Shots',value:8}],statistics_1h:null,statistics_2h:null}))}});
 });
 await page.goto('/');const before=await page.evaluate(()=>localStorage.getItem('futstats:v1'));await page.getByRole('button',{name:'Partidas automáticas',exact:true}).click();await page.getByLabel('Código de acesso privado').fill('private-test-token-123');await page.getByRole('button',{name:'Acessar consultas'}).click();await page.getByRole('button',{name:'Consultar partidas'}).click();await page.locator('.automatic-fixture').click();await page.getByRole('button',{name:'Consultar dados por tempo'}).click();await expect(page.getByRole('alert')).toContainText('PROVIDER_FORBIDDEN');await expect(page.locator('.auto-diagnostics dd')).toHaveText(['PROVIDER_FORBIDDEN','502','403','Não informado']);await expect(page.getByRole('button',{name:'Primeiro tempo',exact:true})).toBeDisabled();expect(calls).toHaveLength(4);
 unavailable=true;await page.getByRole('button',{name:'Consultar dados por tempo'}).click();await expect(page.getByRole('status')).toContainText('tempos permanecem N/D');await expect(page.getByRole('button',{name:'Segundo tempo',exact:true})).toBeEnabled();await expect(page.locator('.auto-summary-card').filter({hasText:'Gols'}).locator('strong')).toHaveText(['N/D','N/D','N/D']);await page.getByRole('button',{name:'Segundo tempo',exact:true}).click();await page.getByRole('button',{name:'Acumulado da partida',exact:true}).click();await expect(page.locator('.auto-summary-card').filter({hasText:'Finalizações'}).locator('strong')).toHaveText(['8','16','8']);expect(calls).toHaveLength(5);expect(await page.evaluate(()=>localStorage.getItem('futstats:v1'))).toBe(before);
});
test('erro de acesso HTTP 200 mostra código, dois status e versão sem credenciais',async({page})=>{
 const sha='b'.repeat(40);let calls=0;
 await page.route('**/api/api-football?*',async route=>{
  const u=new URL(route.request().url());calls++;const headers={'X-FutStats-Commit':sha};
  if(u.searchParams.get('kind')==='config')await route.fulfill({headers,json:{dates:['2026-10-13'],fixtures:['1492402']}});
  else if(u.searchParams.get('kind')==='fixtures')await route.fulfill({headers,json:{items:[{id:1492402,date:null,status:'FT',statusLabel:'Encerrado (simulado)',minute:90,league:'Simulada',country:null,home:{id:1,name:'Teste A'},away:{id:2,name:'Teste B'},goals:[2,1]}]}});
  else if(u.searchParams.get('half')==='true')await route.fulfill({headers,status:502,json:{code:'PROVIDER_AUTH_RESPONSE',upstreamStatus:200,error:'O provedor retornou um erro de acesso nesta consulta. [Diagnóstico: PROVIDER_AUTH_RESPONSE; HTTP servidor 502; HTTP API 200]'}});
  else await route.fulfill({headers,json:{fixtureId:1492402,halfRequested:false,fetchedAt:'2026-10-14T02:00:00Z',items:[]}});
 });
 await page.goto('/');await page.getByRole('button',{name:'Partidas automáticas',exact:true}).click();await page.getByLabel('Código de acesso privado').fill('private-test-token-123');await page.getByRole('button',{name:'Acessar consultas'}).click();await expect(page.locator('.auto-build')).toContainText('bbbbbbb');await page.getByRole('button',{name:'Consultar partidas'}).click();await page.locator('.automatic-fixture').click();await page.getByRole('button',{name:'Consultar dados por tempo'}).click();await expect(page.locator('.auto-diagnostics dd')).toHaveText(['PROVIDER_AUTH_RESPONSE','502','200','bbbbbbb']);await expect(page.getByRole('alert')).not.toContainText('private-test-token-123');await expect(page.getByRole('alert')).not.toContainText('[Diagnóstico:');expect(calls).toBe(4);expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
});

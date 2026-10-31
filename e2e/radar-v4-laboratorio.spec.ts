import {test,expect} from '@playwright/test';

test('Radar V4: botão da visão geral abre laboratório sem alterar os registros',async({page})=>{
 // Free external community catalogues may be temporarily offline.
 // Lab must still respond using its dated built-in official references.
 await page.route(/^https:\/\//,route=>route.abort());
 await page.goto('/');
 await page.getByRole('button',{name:'Analisar jogos de hoje'}).first().click();
 await expect(page.locator('.v4-lab-head h3')).toHaveText('Radar V4 · Laboratório');
 const analyze=page.locator('.v4-lab-actions button.primary');
 await expect(analyze).toBeEnabled({timeout:90000});
 await analyze.click();
 await expect(page.getByLabel('Resumo dos resultados')).toBeVisible({timeout:45000});
 await page.getByRole('button',{name:'1º tempo'}).last().click();
 await expect(page.locator('.v4-lab-periods button.selected')).toContainText('1º tempo');
 await expect(page.getByText(/Sem sinal|Regra V4|agenda|histórico/i).first()).toBeVisible();
 const untouched=await page.evaluate(()=>({
  v4:localStorage.getItem('futstats:radar-v4-lab-frozen:v1'),
  regular:localStorage.getItem('futstats-radar-previews-v1')
 }));
 expect(untouched.v4).toBeNull();
 expect(untouched.regular).toBeNull();
});


test('V4 recupera as dez análises da manhã mesmo às 19h17, sem refazer previsões',async({page})=>{
 await page.clock.install({time:new Date('2026-10-30T22:17:00Z')});
 await page.route(/^https:\/\//,route=>route.abort());
 await page.goto('/');
 await page.getByRole('button',{name:'Analisar jogos de hoje'}).first().click();
 await expect(page.getByText('Registro pré-jogo original · 30/10/2026, 05h55 (Brasília)')).toBeVisible({timeout:90000});
 const summary=page.getByLabel('Resumo dos resultados');
 await expect(summary).toContainText('Jogos encontrados10');
 await expect(summary).toContainText('Sinais V4105');
 await expect(summary).toContainText('Sem sinal15');
 await expect(page.locator('.v4-lab-fixture')).toHaveCount(10);
 await expect(page.getByRole('heading',{name:'Corinthians × Mirassol'})).toBeVisible();
 await expect(page.getByRole('heading',{name:'Al Shabab × Al Ahli'})).toBeVisible();
 await expect(page.getByText('Over 26,5').first()).toBeVisible();
 // Odds are always entered manually, never pulled from retrospective match results.
 await page.getByRole('button',{name:/Simular odd de Finalizações · Partida completa/}).first().click();
 const simulator=page.getByRole('region',{name:'Simulador de odds V4'});
 await expect(simulator).toBeVisible();
 await simulator.getByRole('textbox',{name:'Odd da casa'}).fill('1,50');
 await expect(simulator).toContainText('66,67%');
 await expect(simulator).toContainText('não pode dizer se a odd compensa');
 await simulator.getByRole('textbox',{name:'Probabilidade estimada (%)'}).fill('70');
 await expect(simulator).toContainText('Valor teórico positivo');
 await expect(simulator).toContainText('+5,00%');
 await expect(simulator).toContainText('0,10');
 await simulator.getByRole('textbox',{name:'Odd da casa'}).fill('1,30');
 await expect(simulator).toContainText('Valor teórico negativo');
 expect(await page.evaluate(()=>localStorage.getItem('futstats-radar-previews-v1'))).toBeNull();
});

test('Radar V4: 31/10 appears as tomorrow on 30/10 and retains 29 pregame forecasts',async({page})=>{
 await page.clock.install({time:new Date('2026-10-31T02:08:00Z')}); // 30/10 23:08 Brasília
 await page.route(/^https:\/\//,route=>route.abort());
 await page.goto('/');
 await page.getByRole('button',{name:'Analisar jogos de hoje'}).first().click();
 await page.getByLabel('Data do laboratório V4').selectOption('2026-10-31');
 await expect(page.getByText(/Registro pré-jogo original · 31\/10\/2026/)).toBeVisible({timeout:90000});
 const summary=page.getByLabel('Resumo dos resultados');
 await expect(summary).toContainText('Jogos encontrados29');
 await expect(summary).toContainText('Sinais V4316');
 await expect(summary).toContainText('Sem sinal32');
 await expect(page.locator('.v4-lab-fixture')).toHaveCount(29);
 await expect(page.getByRole('heading',{name:'Chelsea × Manchester Utd'})).toBeVisible();
 await expect(page.getByRole('heading',{name:'Bayern × Dortmund'})).toBeVisible();
 await expect(page.getByRole('heading',{name:'Porto × Estoril'})).toBeVisible();
 expect(await page.evaluate(()=>localStorage.getItem('futstats:radar-v4-lab-frozen:v1'))).toBeNull();
});

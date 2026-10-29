import {test,expect} from '@playwright/test';

/** First visit in a clean browser must already contain the authorized 1,751
 * records. No CSV picker, private IndexedDB import or changes to user history.
 */
test.use({serviceWorkers:'block'});
test('Etapa 99: 2.775 partidas aparecem sem importação na prévia experimental',async({page})=>{
 await page.route('**/raw.githubusercontent.com/**',r=>r.abort());
 await page.goto('/');
 await expect(page.getByText('2.775',{exact:true})).toBeVisible({timeout:45000});
 await expect(page.getByText('Jogos na pesquisa')).toBeVisible();
 const mobileCompare=page.locator('.mobile-bottom-nav').getByRole('button',{name:'Comparar'});
 if(await mobileCompare.isVisible())await mobileCompare.click();
 else await page.locator('button[data-area="compare"]').click();
 await expect(page.getByText(/2775 partidas reais de pesquisa carregadas/)).toBeVisible({timeout:45000});
 const competition=page.getByLabel('Campeonato da comparação inteligente');
 await competition.selectOption('Premier League inglesa');
 const season=page.getByLabel('Temporada da comparação inteligente');
 await expect(season.locator('option[value="2025/26"]')).toHaveCount(1);
 await season.selectOption('2025/26');
 await expect(page.getByText(/Temporada: 2025\/26/)).toBeVisible();
 await competition.selectOption('La Liga espanhola');
 await expect(season.locator('option[value="2025/26"]')).toHaveCount(1);
 await season.selectOption('2025/26');
 await expect(page.getByText(/Temporada: 2025\/26/)).toBeVisible();
 await competition.selectOption('Serie A italiana');
 await expect(season.locator('option[value="2025/26"]')).toHaveCount(1);
 await season.selectOption('2025/26');
 await expect(page.getByText(/Temporada: 2025\/26/)).toBeVisible();
 await competition.selectOption('Ligue 1 francesa');
 await expect(season.locator('option[value="2025/26"]')).toHaveCount(1);
 await season.selectOption('2025/26');
 await expect(page.getByText(/Temporada: 2025\/26/)).toBeVisible();
 await competition.selectOption('Liga Portugal');
 await expect(season.locator('option[value="2025/26"]')).toHaveCount(1);
 await season.selectOption('2025/26');
 await expect(page.getByText(/Temporada: 2025\/26/)).toBeVisible();
 const local=await page.evaluate(()=>localStorage.getItem('futstats:v1'));
 expect(local).toBeNull(); // Research must not silently modify user storage.
});

test('Confrontos diretos reais: Benfica × Sporting em ambos os mandos, sem duplicar',async({page})=>{
 await page.goto('/');
 await expect(page.getByText('2.775',{exact:true})).toBeVisible({timeout:45000});
 const mobileCompare=page.locator('.mobile-bottom-nav').getByRole('button',{name:'Comparar'});
 if(await mobileCompare.isVisible())await mobileCompare.click();
 else await page.locator('button[data-area="compare"]').click();
 await page.getByLabel('Campeonato da comparação inteligente').selectOption('Liga Portugal');
 await page.getByLabel('Temporada da comparação inteligente').selectOption('2025/26');
 await page.getByLabel('Time mandante da comparação inteligente').selectOption({label:'Benfica'});
 await page.getByLabel('Time visitante da comparação inteligente').selectOption({label:'Sporting'});
 const direct=page.getByRole('region',{name:'Confrontos diretos — equipes individuais'});
 const venue=direct.getByLabel('Filtro de mando dos confrontos diretos');
 await expect(direct.getByText(/2 confrontos válidos/)).toBeVisible();
 await venue.selectOption('current');
 await expect(direct.getByText(/1 confronto válido/)).toBeVisible();
 await venue.selectOption('all');
 await expect(direct.getByText(/2 confrontos válidos/)).toBeVisible();
 expect(await page.evaluate(()=>localStorage.getItem('futstats:v1'))).toBeNull();
});

test('Brasileirão auditado: últimos cinco Santos em casa incluem Palmeiras e Bahia',async({page})=>{
 await page.clock.setFixedTime(new Date('2026-10-29T16:00:00Z'));
 await page.goto('/');
 await expect(page.getByText('2.775',{exact:true})).toBeVisible({timeout:45000});
 const mobile=page.locator('.mobile-bottom-nav').getByRole('button',{name:'Comparar'});
 if(await mobile.isVisible())await mobile.click();
 else await page.locator('button[data-area="compare"]').click();
 await page.getByLabel('Campeonato da comparação inteligente').selectOption('Brasileirão Série A');
 await page.getByLabel('Temporada da comparação inteligente').selectOption('2026');
 await page.getByLabel('Time mandante da comparação inteligente').selectOption({label:'Santos'});
 await page.getByLabel('Time visitante da comparação inteligente').selectOption({label:'Palmeiras'});
 await page.getByLabel('Indicador da comparação inteligente').selectOption('shots');
 const panel=page.getByRole('region',{name:'Médias somente das equipes'});
 const card=panel.locator('.team-summary-card').first();
 await expect(card.getByRole('heading',{name:'Santos · em casa'})).toBeVisible();
 await expect(card.locator('.team-summary-main strong')).toHaveText('21,6');
 await expect(card.locator('.team-summary-main small')).toHaveText('5 jogos válidos');
 await expect(card.locator('.team-period-compact-row').first()).toContainText('Média 8,8');
 await expect(card.locator('.team-period-compact-row').last()).toContainText('Média 12,8');
 // Read independently: 16 +23 +16 +32 +21 =108 shots, 108/5=21.6.
 // The 09/09 Sudamericana match must not enter this Brasileirão sample.
 await page.getByLabel('Time mandante da comparação inteligente').selectOption({label:'Bahia'});
 await expect(panel.locator('.team-summary-card').first().locator('.team-summary-main strong')).toHaveText('13,4');
 // Bahia x São Paulo: literal title 29/10, officially confirmed Brazilian date 28/10.
 // It must be eligible on 29/10 after review, without admitting future fixtures.
 expect(await page.evaluate(()=>localStorage.getItem('futstats:v1'))).toBeNull();
});


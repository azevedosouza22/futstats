import {test,expect} from '@playwright/test';

test.use({viewport:{width:390,height:844},serviceWorkers:'block'});

test('Comparação: equipe azul, diretos vermelhos e mando amarelo, sem toques extras',async({page})=>{
 await page.goto('/');
 await expect(page.getByText('2.856',{exact:true})).toBeVisible({timeout:45000});
 const mobileCompare=page.locator('.mobile-bottom-nav').getByRole('button',{name:'Comparar'});
 if(await mobileCompare.isVisible())await mobileCompare.click();
 else await page.locator('button[data-area="compare"]').click();
 await expect(page.getByRole('heading',{name:/Comparação Inteligente/}).first()).toBeVisible();
 await expect(page.locator('.toolbar .segment')).toHaveCount(0);
 await expect(page.getByText('0 partidas nesta seleção')).toHaveCount(0);

 await page.getByLabel('Campeonato da comparação inteligente').selectOption('Brasileirão Série A');
 await page.getByLabel('Time mandante da comparação inteligente').selectOption({label:'Athletico-PR'});
 await page.getByLabel('Time visitante da comparação inteligente').selectOption({label:'Internacional'});
 await page.getByLabel('Indicador da comparação inteligente').selectOption('shots');

 const individual=page.getByRole('region',{name:'Estatísticas individuais das equipes'});
 const teamPanel=page.getByRole('region',{name:'Médias somente das equipes'});
 await expect(teamPanel).toBeVisible();
 await expect(teamPanel.locator('.team-summary-card')).toHaveCount(2);
 await expect(individual.getByText('Athletico-PR · em casa')).toBeVisible();
 await expect(teamPanel.locator('.team-summary-times')).toHaveCount(0);
 await expect(teamPanel.locator('.team-summary-edit-line')).toHaveCount(0);
 await expect(teamPanel.locator('.team-period-compact-row')).toHaveCount(4);
 const first=teamPanel.locator('.team-summary-card').first();
 await expect(first.locator('.team-period-compact-row').first()).toContainText('1º tempo');
 await expect(first.locator('.team-period-compact-row').last()).toContainText('2º tempo');
 await expect(first.locator('.team-simple-frequency')).toHaveCount(3);
 await expect(first.locator('input[aria-label^="Linha individual para"]')).toHaveCount(1);

 const direct=page.getByRole('region',{name:'Confrontos diretos — equipes individuais'});
 await expect(direct).toBeVisible();
 await expect(direct.locator('.team-summary-card')).toHaveCount(2);
 await expect(direct.locator('.team-period-compact-row')).toHaveCount(4);

 const totals=page.getByRole('region',{name:'Comparação por mando — totais dos dois times'});
 await expect(totals).toHaveCount(1);
 await expect(totals.locator('.smart-lens-grid').first().locator('.team-summary-card')).toHaveCount(2);
 await expect(totals.locator('.smart-lens-grid').first().locator('.team-period-compact-row')).toHaveCount(4);
 await expect(totals.locator('.smart-verdict')).toBeVisible();
 await expect(page.locator('.smart-legacy-table')).toHaveCount(1);
 const settings=totals.locator('.smart-mando-detail-options');
 await expect(settings).toHaveCount(1);
 await expect(page.getByLabel('Período da comparação inteligente')).toBeHidden();
 await settings.locator('summary').click();
 await expect(page.getByLabel('Período da comparação inteligente')).toBeVisible();
 await page.getByLabel('Período da comparação inteligente').selectOption('second');
 await page.getByLabel('Linha da comparação inteligente').fill('9,5');
 await expect(settings.locator('summary')).toContainText('2º tempo');
 await expect(settings.locator('summary')).toContainText('9,5');
 await expect(totals.locator('.smart-lens-grid').first().locator('.team-period-compact-row')).toHaveCount(4);
 await page.getByLabel('Linha da comparação inteligente').fill('9');
 await expect(settings.getByRole('alert')).toBeVisible();
 await expect(totals.locator('.smart-lens-grid').first().locator('.team-summary-card')).toHaveCount(2);
 await expect(totals.locator('.smart-verdict')).toHaveCount(0);
 await page.getByLabel('Linha da comparação inteligente').fill('8,5');
 await expect(settings.getByRole('alert')).toHaveCount(0);
 await expect(totals.locator('.smart-verdict')).toBeVisible();
 expect(await page.evaluate(()=>localStorage.getItem('futstats:v1'))).toBeNull();
});


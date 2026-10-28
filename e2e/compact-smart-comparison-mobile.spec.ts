import {test,expect} from '@playwright/test';

test.use({viewport:{width:390,height:844},serviceWorkers:'block'});

test('Comparação mobile: individuais por tempo preservados e filtros do total sem duplicação',async({page})=>{
 await page.goto('/');
 await expect(page.getByText('1.779',{exact:true})).toBeVisible({timeout:45000});
 const mobileCompare=page.locator('.mobile-bottom-nav').getByRole('button',{name:'Comparar'});
 if(await mobileCompare.isVisible())await mobileCompare.click();
 else await page.locator('button[data-area="compare"]').click();
 await expect(page.getByRole('heading',{name:/Comparação Inteligente/})).toBeVisible();

 await page.getByLabel('Campeonato da comparação inteligente').selectOption('Serie A italiana');
 await page.getByLabel('Time mandante da comparação inteligente').selectOption({label:'Parma'});
 await page.getByLabel('Time visitante da comparação inteligente').selectOption({label:'Udinese'});
 await page.getByLabel('Indicador da comparação inteligente').selectOption('corners');

 const individual=page.getByRole('region',{name:'Estatísticas individuais das equipes'});
 await expect(individual).toBeVisible();
 await expect(individual.getByText('Parma · em casa')).toBeVisible();

 // Only one total-filter control panel exists, physically beside the
 // combined-market results rather than above the individual team cards.
 const totals=page.locator('.smart-total-collapsible');
 await expect(totals).toHaveCount(1);
 await expect(page.locator('.smart-total-settings')).toHaveCount(0);
 await expect(page.getByLabel('Linha da comparação inteligente')).toBeHidden();

 const parma=individual.locator('.team-summary-card').first();
 await parma.locator('.team-summary-times > summary').click();
 await expect(parma.locator('.team-period-compact-row')).toHaveCount(2);
 await expect(parma.getByText('1º tempo')).toBeVisible();
 await expect(parma.getByText('2º tempo')).toBeVisible();
 await expect(parma.locator('.team-period-compact-frequencies')).toHaveCount(2);

 await totals.locator('summary').first().click();
 await expect(page.getByLabel('Período da comparação inteligente')).toBeVisible();
 await page.getByLabel('Período da comparação inteligente').selectOption('first');
 await page.getByLabel('Linha da comparação inteligente').fill('9,5');
 await expect(totals.locator('summary').first()).toContainText('1º tempo');
 await expect(totals.locator('summary').first()).toContainText('9,5');
 await expect(individual).toBeVisible();
 await expect(parma.locator('.team-period-compact-row')).toHaveCount(2);

 // An invalid total line must NOT erase the separate individual analytics
 // or trap the user outside the collapsed total editor.
 await page.getByLabel('Linha da comparação inteligente').fill('9');
 await expect(totals.getByRole('alert')).toBeVisible();
 await expect(individual).toBeVisible();
 await page.getByLabel('Linha da comparação inteligente').fill('8,5');
 await expect(totals.getByRole('alert')).toHaveCount(0);
 await expect(page.locator('local-storage-never-written')).toHaveCount(0);
 expect(await page.evaluate(()=>localStorage.getItem('futstats:v1'))).toBeNull();
});

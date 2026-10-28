import {test,expect} from '@playwright/test';

/** First visit in a clean browser must already contain the authorized 760
 * records. No CSV picker, private IndexedDB import or changes to user history.
 */
test.use({serviceWorkers:'block'});
test('Etapa 90: 1.779 partidas aparecem sem importação na prévia experimental',async({page})=>{
 await page.route('**/raw.githubusercontent.com/**',r=>r.abort());
 await page.goto('/');
 await expect(page.getByText('1.779',{exact:true})).toBeVisible({timeout:45000});
 await expect(page.getByText('Jogos na pesquisa')).toBeVisible();
 await page.locator('.mobile-bottom-nav').getByRole('button',{name:'Comparar'}).click();
 await expect(page.getByText(/1779 partidas reais de pesquisa carregadas/)).toBeVisible({timeout:45000});
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
 const local=await page.evaluate(()=>localStorage.getItem('futstats:v1'));
 expect(local).toBeNull(); // Research must not silently modify user storage.
});

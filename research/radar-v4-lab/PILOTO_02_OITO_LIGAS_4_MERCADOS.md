# Radar V4 Lab — Piloto 02: 8 ligas, 2 jogos por liga, 4 mercados

**Base:** FutStats experimental com 3.260 partidas, referência do PR DRAFT #101, sem tocar em dados pessoais ou produção.

## Método (antes de conferir resultados)
- O usuário solicitou dois jogos por campeonato. A seleção foi **determinística**, pegando os **2 últimos jogos elegíveis em ordem cronológica (empate pelo sourceId)** de oito competições, sem escolher por resultado.
- Temporadas: Brasileirão 2026 e Bundesliga, Premier League, La Liga, Serie A italiana, Ligue 1, Liga Portugal e Saudi Pro League **2025/26**. Para Brasileirão foram consideradas as 324 partidas da pesquisa com revisão de datas; para demais ligas, as temporadas completas (Ligue 1: 305 completas).
- Em cada partida, usar os últimos **cinco jogos da própria competição e temporada** de cada equipe, **estritamente anteriores à data**; eliminar repetições e exigir pelo menos **oito jogos históricos distintos**.
- Para cada métrica, selecionar a **maior linha Over** com ocorrência histórica ≥70%, caso contrário não emitir sinal:
  - Finalizações: 20,5 / 22,5 / 24,5 / 26,5;
  - Escanteios: 6,5 / 7,5 / 8,5 / 9,5;
  - Chutes no gol (CG): 5,5 / 6,5 / 7,5 / 8,5;
  - Gols: 1,5 / 2,5 / 3,5.
- **Somente o período completo do jogo** foi testado neste piloto. Os dados de 1T/2T são preservados e poderão ser testados depois. A validação usa resultado final só após escolher a linha. Nenhuma odd foi utilizada.

## Resultados

| Métrica | Acertos | Erros | Abstenções | Acerto por sinal |
|---|---:|---:|---:|---:|
| Finalizações | 10 | 2 | 4 | 10/12 (83,3%) |
| Escanteios | 12 | 3 | 1 | 12/15 (80,0%) |
| Chutes no gol | 11 | 4 | 1 | 11/15 (73,3%) |
| Gols | 14 | 1 | 1 | 14/15 (93,3%) |
| **Total** | **47** | **10** | **7** | **47/57 (82,5%)** |

**Legenda:** n ✓ (real) = Over n acertou, n ✗ (real) = Over n errou; — (real) = sem sinal, com resultado real entre parênteses.

| Liga | Jogo | Finalizações | Escanteios | CG | Gols |
|---|---|---|---|---|---|
| Brasileirão 2026 | Remo × Botafogo | 24,5 ✓ (26) | 9,5 ✓ (11) | 7,5 ✗ (6) | 1,5 ✓ (3) |
| Brasileirão 2026 | Fluminense × Internacional | 24,5 ✓ (29) | 6,5 ✓ (13) | 6,5 ✓ (11) | 1,5 ✓ (3) |
| Bundesliga 2025/26 | Bayern × Köln | 26,5 ✓ (28) | 7,5 ✓ (10) | 8,5 ✓ (9) | 3,5 ✓ (6) |
| Bundesliga 2025/26 | Frankfurt × Stuttgart | 26,5 ✓ (29) | 9,5 ✓ (12) | 8,5 ✓ (14) | 2,5 ✓ (4) |
| Premier League 2025/26 | Manchester City × Aston Villa | 22,5 ✓ (28) | 9,5 ✓ (13) | 6,5 ✓ (8) | 2,5 ✓ (3) |
| Premier League 2025/26 | Brighton × Manchester Utd | 22,5 ✓ (24) | 9,5 ✗ (3) | 8,5 ✓ (9) | 2,5 ✓ (3) |
| La Liga 2025/26 | Villarreal × Atlético de Madrid | 22,5 ✓ (23) | 9,5 ✓ (14) | 7,5 ✓ (12) | 1,5 ✓ (6) |
| La Liga 2025/26 | Alavés × Rayo Vallecano | — (34) | 9,5 ✓ (15) | 5,5 ✓ (18) | 1,5 ✓ (3) |
| Serie A italiana 2025/26 | Milan × Cagliari | — (41) | — (10) | 5,5 ✓ (13) | 1,5 ✓ (3) |
| Serie A italiana 2025/26 | Torino × Juventus | 22,5 ✓ (29) | 6,5 ✓ (12) | 6,5 ✓ (9) | 1,5 ✓ (4) |
| Ligue 1 2025/26 | Marseille × Rennes | 22,5 ✓ (54) | 9,5 ✓ (15) | 7,5 ✓ (17) | 2,5 ✓ (4) |
| Ligue 1 2025/26 | Lorient × Le Havre | 22,5 ✗ (19) | 7,5 ✗ (6) | 8,5 ✗ (6) | 1,5 ✓ (2) |
| Liga Portugal 2025/26 | Porto × Santa Clara | — (25) | 8,5 ✓ (13) | 6,5 ✗ (6) | 1,5 ✗ (1) |
| Liga Portugal 2025/26 | Braga × Estrela da Amadora | — (20) | 6,5 ✓ (8) | — (8) | — (4) |
| Saudi Pro League 2025/26 | Al-Ittihad × Al-Qadsiah | 22,5 ✓ (31) | 9,5 ✓ (15) | 7,5 ✓ (9) | 2,5 ✓ (6) |
| Saudi Pro League 2025/26 | Neom SC × Al Ettifaq | 24,5 ✗ (23) | 7,5 ✗ (4) | 8,5 ✗ (8) | 1,5 ✓ (2) |

## Limitações críticas
1. **Apenas 2 jogos por liga** demonstram o fluxo, não estabelecem eficácia nem calibragem preditiva; o total observado de 82,5% está sujeito à variabilidade amostral e a dependências entre mercados/jogos.
2. A regra não é o V2/V3 atual, nem um modelo de odds ou rentabilidade. Gols Over 1,5 costuma ser muito mais fácil do que Over 3,5, a odds iguais não são garantidas. Não comparar percentuais entre mercados ou linhas diferentes como se tivessem o mesmo custo/valor.
3. Os dados derivam da base coletada do Flashscore; uma checagem externa pontual confirmou **54 finalizações em Marseille × Rennes** e **41 em Milan × Cagliari**, porém não substitui auditoria externa de todas as 16 partidas.
4. **Próximos passos para evidência real:** repetir sem ajuste em mais jogos por liga; comparar regras na mesma linha e exatamente os mesmos confrontos; registrar previsões prospectivamente antes dos jogos; medir incerteza e, se houver dados legais, odds históricas.
5. Não alterar `As Boas do Dia`, Radar V2/V3, backup, produção ou a interface sem autorização.

## Reprodutibilidade
Teste automatizado isolado: `src/radarV4LabPilot02.test.ts`.
Execução: `npx vitest run src/radarV4LabPilot02.test.ts`.

Módulos usados na montagem da base: `parseResearchCatalog`, `mergeResearchPacks` e `applyBrazilResearchDateReview`. Todas as partidas são da pesquisa, sem escrita em `localStorage`. O teste congela os IDs dos 16 confrontos e as contagens esperadas por mercado.

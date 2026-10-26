# FutStats IA — Etapa 59 · comparação de amostras por mando e por tempo

**25/10/2026 (Brasília). Apenas PR experimental filho do #58.**

## Mudança prática
Na prévia do Radar, abaixo das matrizes de 4 indicadores × 3 períodos e da tabela Over/Under, o usuário pode expandir **“Conferir desempenho em casa e fora · 4 indicadores e tempos”**.

São duas visões separadas:
- **Mandante em casa**: dentre os **cinco últimos jogos anteriores** do clube na mesma competição e temporada, somente aqueles em que ele foi mandante.
- **Visitante fora**: dentre os cinco últimos jogos anteriores do outro clube na mesma competição e temporada, somente aqueles em que ele foi visitante.

Cada visão apresenta 12 linhas (gols, finalizações, chutes no alvo e escanteios × jogo completo/1º tempo/2º tempo), com **média feita**, **média sofrida**, **quantidade de partidas válidas e total de partidas nesse mando**, contagem de **N/D** e **somas conflitantes**. A lista NÃO procura jogos antigos além dos cinco anteriores por clube para fingir amostra maior.

## Proteções dos cálculos
- Exatamente a seleção `radarUpcoming` da temporada e liga específica. Não inclui o confronto principal, jogos posteriores, dados Work externos ou jogos de outras competições.
- Se houver **menos de 3 partidas válidas para indicador, período e mando**, a média aparece **N/D**, com a contagem real ainda exibida. Zero legítimo é contabilizado; N/D nunca é zero.
- O cálculo considera **ambos os lados** do placar/indicador do período. Valor ausente em uma equipe exclui o jogo daquele campo. Jogo completo não preenche nenhum tempo.
- `auditedRadarMetricValues` detecta divergência `jogo completo != 1º + 2º` por **cada equipe**, mesmo que erros opostos entre as equipes se anulem. Descarta apenas a métrica conflitante. Fontes com data divergente, jogo externo não encerrado e IDs repetidos não entram como partidas novas.
- Um confronto histórico entre os dois clubes pode contar em **duas perspectivas diferentes** (A como mandante e B como visitante), mas não pode ser duplicado dentro do mesmo recorte.
- Todas as medidas são históricas e DESCRITIVAS: não são odds, probabilidade, calibragem de V2/V3, indicação de aposta ou validação prospectiva. Não reescreve previsões ou backups.

## Arquivos e aceite
- `src/radarVenuePeriodProfile.ts` — módulo puro de amostra por mando, sem acesso à rede ou ao localStorage;
- `src/RadarVenuePeriodPanel.tsx` — painel recolhível com seções Casa/Fora, tabela com rolagem interna no celular e avisos de N/D;
- integração em `src/UpcomingRadar.tsx` e CSS; `src/radarVenuePeriodProfile.test.ts` e E2E sintéticos.
- Unitários: 24 células, 5+5 jogos, mandos separados, amostra reduzida 2/5 → N/D, jogo completo com tempos ausentes, conflitos de soma só na métrica afetada, zeros verdadeiros, data de fonte divergente, fixture compartilhado sem duplicação.
- Playwright desktop e viewport Android: prévia por “As Boas”, comparar médias feitos/sofridos dos dois clubes, conferir 24 linhas, localStorage idêntico antes/depois da consulta, salvar e recuperar a previsão congelada; segundo cenário: 2/5 mandos → N/D em vez de extrapolação.
- QA em Android físico, comprovação de resultado independente e merge/deploy continuam pendentes.

**Garantias:** preservar 659 históricos reais, Radar V2/V3, Work, backups e produção. Nenhum jogo ou resultado real adicionado, nenhum dado inventado, nenhum PR integrado; CI verde obrigatório para atualizar Controle Mestre #29.

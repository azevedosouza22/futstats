# FutStats V4 — Bundesliga 2025/26 e 2026/27: **não recolher dados já importados**

**Revisão em 23/10/2026 após encontrar os arquivos originais na Biblioteca do usuário.** Essa verificação substitui a instrução anterior, excessivamente ampla, de “coleta integral da Bundesliga 2026/27” nesta data.

## Dados que já existem no aplicativo Android (confirmados nas importações anteriores)

- **Bundesliga 2025/26:** **306/306 partidas completas** (34 rodadas, nove por rodada), todas no Histórico do FutStats. Arquivo original citado no relatório: `futstats_bundesliga_2025_26_consolidado_306_partidas.csv`; relatório `futstats_bundesliga_2025_26_lote_06_relatorio_final.md`. **NÃO recolher, NÃO substituir**.
- **Bundesliga 2026/27:** **54/54 partidas completas**, rodadas **1 a 6**, datas **28/08/2026 a 18/10/2026**. Arquivo ORIGINAL recuperado na Biblioteca ChatGPT: `futstats_bundesliga_2026_27_lote_01_PRONTO_IMPORTAR.csv`. Conferência programática em 23/10: **54 linhas, 55 colunas do padrão FutStats (índice de planilha à parte), 54 IDs únicos, nove jogos por rodada e zero N/D nas métricas**. Relatório `futstats_bundesliga_2026_27_lote_01_relatorio.md` e controle `futstats_bundesliga_2026_27_lote_01_controle.json`. **NÃO recolher, NÃO substituir**.
- Os **659 históricos no dispositivo** correspondem a 299 Brasileirão 2026 + 306 Bundesliga 2025/26 + 54 Bundesliga 2026/27. São dados da base principal já importados, não apenas “arquivos disponíveis”.
- Adicionalmente, o usuário confirmou **292 partidas completas via Work**, distribuídas pelas quatro outras ligas (70 Serie A italiana, 89 La Liga espanhola, 63 Ligue 1 francesa, 70 Premier League inglesa), em armazenamentos experimentais separados, e **155 placares CC0**. Não mexer nessas áreas nem no Radar.

## Quando será útil pesquisar novos jogos

Calendário oficial da DFB para a Bundesliga 2026/27:
https://datencenter.dfb.de/de/competitions/bundesliga/seasons/2026-2027/matchday/7

**7ª rodada marcada para 23–25 de outubro de 2026, nove jogos.** Esta rodada não terminou no momento da revisão em 23/10. **NÃO iniciar agora uma coleta integral ou refazer jogos das rodadas 1–6**. O recorte seguinte será **exclusivamente os jogos realmente encerrados da rodada 7**, verificáveis a partir de **26/10/2026** (salvo adiamentos), e quaisquer outros jogos posteriores ainda não coletados em futuras atualizações. Não trazer partidas futuras, incompletas ou abandonadas.

## Comando ao Work apenas após concluída a 7ª rodada

“Continue o FutStats PR nº 13. A Bundesliga 2025/26 inteira (306 jogos) e as rodadas 1–6 da Bundesliga 2026/27 (54 jogos completos em `futstats_bundesliga_2026_27_lote_01_PRONTO_IMPORTAR.csv`) **JÁ ESTÃO IMPORTADAS NO HISTÓRICO**. **Não pesquise nem importe esses 360 jogos novamente.** Pesquise **somente os nove confrontos da 7ª rodada de 2026/27 que estejam confirmados encerrados** (e quaisquer partidas posteriores encerradas, se a execução ocorrer mais tarde), com gols, finalizações, chutes no gol e escanteios por equipe nos três períodos. Use checkpoints e não peça comandos para cada jogo. Entregue um CSV único UTF-8 BOM de **55 colunas** apenas com partidas NOVAS, IDs e URLs genuínas, e relatório de validação. Preserve 659 históricos, 292 pesquisas Work, 155 resultados CC0, Radar, piloto Premier e produção. **Não importar nada.**”

## Na volta ao chat FutStats: deduplicação e integração segura

1. Comparar IDs, data, nomes de mandante/visitante, temporada e placares do **novo** CSV contra os **54 registros originais**, usando o arquivo original recuperável na Biblioteca, sem pedir que o usuário envie prints ou repita a exportação de backups.
2. Apenas registros **verdadeiramente novos** podem ser analisados para integração. Nenhuma edição/substituição silenciosa de valores já armazenados.
3. Escolher destino de importação de modo seguro. O Histórico atual da Bundesliga 2026/27 **já participa da base principal**, enquanto os 292 jogos Work estão em bases experimentais apartadas; uma eventual integração entre essas áreas requer teste explícito e consentimento para não duplicar ou alterar os dados do Radar.
4. Dados detalhados de Flashscore não devem ser publicados no GitHub nem presumidos liberados para redistribuição comercial.

**Estado ao salvar este roteiro:** somente documentação no PR #13. Nenhuma mudança em produção, no app, em localStorage, nas partidas já importadas ou no Radar.

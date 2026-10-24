# FutStats V4 — Serie A italiana 2026/27 — Lote 01 (Work)

**Status em 22/10/2026:** partidas e identificadores encontrados; escanteios, finalizações e chutes no alvo por período **ainda pendentes de conferência no Work**. Não importar ou afirmar que o lote estatístico está validado antes das verificações.

## Três partidas da 1ª rodada

| Partida e data | ID Flashscore identificado | Gols FT | Gols 1º T | Gols 2º T | Link de partida |
|---|---|---|---|---|---|
| Udinese × Como — 22/08/2026 | `QuSvm8ln` | 1 × 1 | 1 × 0 | 0 × 1 | https://www.flashscore.com.br/jogo/futebol/como-ttyLthOA/udinese-rXw8YKDE/resumo/estatisticas/?mid=QuSvm8ln |
| Inter × Monza — 22/08/2026 | `8Mn7Y8Zh` | 4 × 1 | 1 × 1 | 3 × 0 | https://www.flashscore.com.br/jogo/futebol/football-club-internazionale-milano-Iw7eKK25/monza-4YSMlwj7/resumo/estatisticas/?mid=8Mn7Y8Zh |
| Genoa × Napoli — 22/08/2026 | `z9lazV4t` | 0 × 2 | 0 × 0 | 0 × 2 | https://www.flashscore.in/match/football/genoa-d0PJxeie/napoli-69Dxbc61/summary/player-stats/passes/?mid=z9lazV4t |

O terceiro link é de uma página Flashscore em idioma inglês localizada pela pesquisa pública, **não** um link brasileiro de estatísticas. Localizar e confirmar a página Flashscore Brasil e os três períodos no Work antes de usar o registro em CSV. Não fabricar URLs nem converter domínios por adivinhação.

**Fonte independente dos placares e intervalos:** https://github.com/openfootball/football.json/blob/master/2026-27/it.1.json — registros `Matchday 1` e licença CC0. Placar final/intervalo também aparecem nos resultados públicos da Serie A no Flashscore: https://www.flashscore.com.br/futebol/italia/serie-a/resultados/

## Procedimento de pesquisa pontual no ChatGPT Work

1. Acessar cada partida pelo navegador do Work, sem scraping, automação massiva ou contorno de bloqueios.
2. Registrar por mandante/visitante, para jogo completo, primeiro e segundo tempo: **gols, finalizações, chutes no gol e escanteios**. Confirmar as datas e a identidade do jogo.
3. Validar `1º T + 2º T = FT` para cada equipe e cada métrica, `chutes no alvo <= finalizações`, e totals mandante+visitante; **não estimar** valores nem trocar ausência por 0. Se a fonte divergir, marcar N/D e descrever.
4. Exportar **um CSV UTF-8 com BOM, cabeçalho/ordem originais de 55 colunas**, copiando o padrão do último CSV Spurs × Coventry validado. Preservar o ID Flashscore e URLs genuínos por partida e período. A coluna `competicao` deve identificar consistentemente `Serie A italiana 2026/27`; no FutStats local o catálogo antigo do OpenFootball registra esse nome.
5. Entregar relatório sucinto por partida: valores conferidos, lacunas, divergências, fontes e somas. Se alguma partida ficar indisponível, **não rejeitar o lote inteiro** — conservar aprovadas e registrar a pendência.
6. **Não importar** no FutStats, não alterar `futstats:v1` com 659 históricos, `futstats-radar-previews-v1`, V2/V3 ou branch `main`. O lote pertence à pesquisa experimental V4 (PR #13). Nenhum dado do Flashscore deve ser publicado ou reutilizado comercialmente sem confirmar direitos de uso.

## Resultados preliminares (não são validação dos três períodos)

Os placares e gols por tempo desta tabela foram comparados no arquivo público OpenFootball. Foram encontradas páginas públicas de estatísticas FT para algumas partidas, mas existem divergências entre terceiros para números de finalizações e chutes no alvo, especialmente Inter × Monza. Por isso **nenhum** número de finalizações, chutes no alvo ou escanteios está pré-aprovado: tudo aguarda leitura e reconciliação no Work.

## Critério de aceitação

Até **três** partidas com 55 colunas, IDs genuínos, origem rastreável e confirmação independente dos gols; zero suposições; relatório curto. Uma futura etapa deverá permitir complementar a **base experimental separada de 155 jogos**, sem convertê-la silenciosamente em registros históricos.

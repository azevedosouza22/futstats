# FutStats — Serie A italiana 2026/27 — Lote 02 para Work

**Preparado em 22/10/2026.** O usuário confirmou `OK ✅` depois de concluir o Lote 01 no Android: **155 jogos na pesquisa experimental, sendo 3 completos via Work**, e **659 históricos intactos**. O Lote 02 cobre os **sete jogos restantes da 1ª rodada**, evitando novas ações repetitivas por sublotes. **Não importar automaticamente nem alterar o Radar.**

## Jogos definidos pela fonte gratuita já utilizada no FutStats

Fonte de referência dos placares: [OpenFootball — Serie A italiana 2026/27](https://github.com/openfootball/football.json/blob/master/2026-27/it.1.json) (domínio público/CC0).

| # | Data | Mandante | Visitante | Placar FT | 1º tempo | 2º tempo |
|---:|---|---|---|---|---|---|
| 4 | 22/08/2026 | Parma Calcio 1913 | Cagliari Calcio | 0 × 1 | 0 × 0 | 0 × 1 |
| 5 | 23/08/2026 | Frosinone Calcio | Juventus FC | 0 × 1 | 0 × 1 | 0 × 0 |
| 6 | 23/08/2026 | Venezia FC | US Lecce | 0 × 2 | 0 × 0 | 0 × 2 |
| 7 | 23/08/2026 | Atalanta BC | US Sassuolo Calcio | 2 × 1 | 1 × 0 | 1 × 1 |
| 8 | 23/08/2026 | Torino FC | AC Milan | 1 × 2 | 0 × 0 | 1 × 2 |
| 9 | 24/08/2026 | Bologna FC 1909 | SS Lazio | 0 × 1 | 0 × 0 | 0 × 1 |
| 10 | 24/08/2026 | AS Roma | ACF Fiorentina | 4 × 0 | 1 × 0 | 3 × 0 |

**Importante:** as tabelas acima registram placares e gols por tempo de OpenFootball, **não** estatísticas de finalizações ou escanteios; nenhum ID ou URL Flashscore foi identificado/confirmado previamente para essas sete partidas. O Work deverá localizar a página correspondente e o identificador real de cada uma. Se a página não existir ou a identidade/placar divergir, **não inventar** números nem URLs. Relatar a divergência antes de considerar o jogo validado.

## Instrução de pesquisa pontual para o navegador do ChatGPT Work

1. Trabalhar **exclusivamente nestes sete jogos**, usando o procedimento Flashscore pontual comprovado nos lotes anteriores. Não executar coleta massiva, login não autorizado, scraping, contorno de restrição ou reutilização comercial sem direitos.
2. Para cada partida identificada com precisão, coletar **gols, finalizações, chutes no alvo e escanteios**, separados em **jogo completo, primeiro tempo e segundo tempo**, para **mandante e visitante**, observando IDs, datas e URL de origem verdadeira.
3. Validar: `1ºT + 2ºT = completo` para cada equipe/indicador; `mandante + visitante = total` para as 12 combinações por jogo; `chutes no alvo <= finalizações` em cada período; verificar FT e 1T contra os placares de referência, sem aceitar placares conflitantes. Usar `N/D` para valores não disponíveis, sem presumir zero.
4. Entregar **um CSV UTF-8 com BOM, exatamente 55 colunas na mesma ordem** do `futstats_serie_a_2026_27_lote_01.csv`; coluna `competicao` uniforme: **`Serie A italiana 2026/27`**. Os nomes mandante/visitante podem aparecer abreviados, e o importador do V4 já recebeu aliases explícitos para os sete confrontos. Incluir URLs Flashscore por período com ID verdadeiro `?mid=...` e dados observados, sem fabricar.
5. Entregar **um relatório sucinto** com jogos concluídos, validação das somas, ausências, divergências, data/título e links. Retornar também jogos parciais quando algumas partidas estiverem inacessíveis, sem marcar estatísticas desconhecidas como conferidas.
6. **Não enviar nada ao app automaticamente:** a importação ocorrerá apenas depois que o usuário enviar CSV/relatório no ChatGPT e o FutStats validar localmente. **Não tocar** nos 155 jogos da pesquisa CC0, 659 jogos históricos, Radar V2/V3, produção ou `main`. Lote 01 (3 jogos) está concluído, portanto **não duplicá-lo**.

## Controle do fluxo

- Fase inicial: **preparado**, aguardando coleta pelo Work.
- Após revisão: o importador `Base de dados → Novas ligas → Completar estatísticas usando CSV do Work` aceita 55 colunas, verifica data/clubes/temporada/gols e protege contra duplicados e valores conflitantes.
- Resultado esperado **somente se todos os sete forem validos e importados**: a base experimental continua com **155 jogos**, dos quais **10 completos via Work** (3 + 7); os 659 históricos e o Radar permanecem intocados.
- Novos indicadores por tempo não foram autorizados para publicação pública ou monetização; armazenar apenas na sessão privada do usuário.

# FutStats — Validação retrospectiva do Radar Work V2 × V3 — 23/10/2026

## Objetivo e recorte
Quatro campeonatos, **292 partidas completas** das pesquisas Work, com arquivos CSV de 55 colunas previamente aprovados e dados completos dos períodos: Serie A italiana 2026/27 (**70**), La Liga espanhola 2026/27 (**89**), Ligue 1 francesa 2026/27 (**63**), Premier League inglesa 2026/27 (**70**).

**Esta é uma avaliação histórica; não houve gravação de previsões novas antes desses jogos.** Os valores individuais das estatísticas e IDs proprietários não são publicados neste arquivo. A simulação foi reproduzida sobre os arquivos CSV locais, seguindo os critérios fixos dos módulos `src/radarVenueV2.ts` e `src/radarVenueV3.ts`. A interface do FutStats passa a poder recalcular os resultados diretamente dos arquivos Work salvos no dispositivo, via `src/workRadarValidation.ts`.

## Metodologia

1. Para cada liga, ordenar datas dos jogos encerrados disponíveis. Dividir por **dia distinto**, cerca de dois terços de datas como desenvolvimento e o último terço para **validação posterior**, sem dividir jogos da mesma data entre os recortes.
2. Em cada jogo avaliado, ocultar a partida-alvo e **todos os jogos do mesmo dia ou posteriores** ao formar o histórico de cada equipe. Máximo dos **dez últimos confrontos anteriores** da equipe na mesma liga e temporada, depois restringir a **mandante em casa × visitante fora**. Exigir pelo menos **três jogos válidos por mando**.
3. V2: projetar produção e concessão médias, sinalizar Over/Under de totais de **gols linha 2,5**, **finalizações linha 24,5**, **chutes no gol linha 7,5** somente se a projeção ultrapassar margem de **15% da linha**.
4. V3: somente aceita o sinal V2 se ambos os recortes por mando confirmarem média afastada ≥5% da linha e frequência Over ≥60% ou ≤40% (para Under). Caso contrário, **sem sinal**.
5. **Referência honesta:** escolher “sempre Over” ou “sempre Under” por mercado e liga com base **exclusivamente no desenvolvimento** e aplicar a escolha **aos mesmos confrontos/mercados em que o V3 emitiu sinal**. Comparações V2 `todos os sinais` × V3 `selecionados` usam **denominadores diferentes**, portanto não indicam vantagem diretamente. Os vários mercados podem utilizar a mesma partida: sinais não são observações independentes.

## Resultados por liga — último período cronológico de cada amostra

| Liga | Jogos completos | V2 todos os sinais | V3 selecionados | Regra simples nos mesmos sinais V3 |
|---|---:|---:|---:|---:|
| Serie A italiana | 70 | 9/12 | 7/9 | **9/9** |
| La Liga espanhola | 89 | 35/42 | 13/15 | **13/15** |
| Ligue 1 francesa | 63 | 9/11 | 3/5 | **4/5** |
| Premier League inglesa | 70 | 11/22 | 9/16 | **8/16** |
| **Total** | **292** | **64/87 (73,6%)** | **32/45 (71,1%)** | **34/45 (75,6%)** |

**Por mercado, nas quatro ligas agregadas:**

| Mercado | V2 todos os sinais | V3 selecionados | Regra simples nos sinais V3 |
|---|---:|---:|---:|
| Gols, linha 2,5 | 18/33 | 5/13 | 8/13 |
| Finalizações, linha 24,5 | 18/21 | 10/12 | 10/12 |
| Chutes no gol, linha 7,5 | 28/33 | 17/20 | 16/20 |
| **Total** | **64/87** | **32/45** | **34/45** |

A referência ficou na direção **sempre Over em todos os mercados/ligas deste recorte**, escolhida sem usar jogos de validação. Isso ilustra a necessidade de comparar com baselines simples antes de afirmar eficiência de filtros.

## Conclusão e decisão de produto

- **O Radar V3 não superou a regra simples** nos mesmos 45 sinais validados: **32 acertos versus 34**. Seu desempenho varia muito por liga e mercado, e as amostras são pequenas. Os números do V2 sobre um grupo maior (87 sinais) não são uma comparação pareada.
- **Não promover V3 para previsão automática** nem substituir, migrar ou recalcular snapshots já salvos do Radar principal. Não fazer ajuste oportunista dos limites fixos com base nesses resultados do mesmo período.
- Manter Radar Work como painel **somente leitura**, com número de sinais, acertos, referência nos mesmos casos e corte temporal, sem prometer lucratividade. Reavaliar **quando chegarem novas rodadas** com quantidade suficiente de jogos posteriores às regras congeladas; reportar incerteza, cobertura e orientação de mercado.
- Os **659 históricos**, **155 resultados CC0**, **292 Work**, pilotos antigos e **Radar V2/V3 com previsões anteriores** continuam isolados. Nenhuma importação para `futstats:v1`, nenhum overwrite de `futstats-radar-previews-v1`, sem mudança em produção ou na branch `main`.

## Limites da verificação
A consistência interna do CSV foi avaliada no fluxo anterior. **Este relatório não afirma auditoria independente das estatísticas individuais na página de cada jogo**, não modela odds/comissões, não faz teste prospectivo verdadeiro de apostas, não estima significância estatística e não deduz probabilidade causal de vitória a partir de percentuais retrospectivos. As simulações usam dados de uma janela curta do início da temporada 2026/27 e uma referência definida no próprio recorte de desenvolvimento.

# FUTSTATS FUTEBOL F360 — LV4/Elite — 26/11/2026

**Registro imutável:** `F360-PRE-20261126-SPFC-REMO`  
**Data de cálculo e criação dos arquivos:** `2026-11-26T12:21:55Z` UTC (Brasília UTC−3)  
**Evento:** São Paulo × Remo, 26/11/2026 às 20h BRT (23h UTC), 37ª rodada da Série A, CBF jogo 363, Flashscore `tlP20OtQ`.  
**Status:** `DOCUMENTAL_PREJOGO_CONDICIONADO`, **não execução TypeScript nativa**, não Shadow V1, não projeção homologada para produção.  
**Decisão SDD:** **11 OBSERVAR**, **1 ABSTER**, **0 SELECIONAR**; **1 Elite documental** (subconjunto dos 11 sinais). Odds reais/bilhetes/ROI: **N/D**.

## Fontes consultadas antes do cálculo
- [CBF — São Paulo × Remo, horário e confronto](https://www.cbf.com.br/futebol-brasileiro/jogos/campeonato-brasileiro/serie-a/2026/sao-paulo-x-remo/832253)
- [Flashscore — jogo alvo, ID tlP20OtQ](https://www.flashscore.com.br/jogo/futebol/remo-2i0B6Zul/sao-paulo-QgP0oAUH/?mid=tlP20OtQ)
- Base experimental CP16 de 5.732 partidas, [arquivo Drive](https://drive.google.com/file/d/1-FUmgwHUmiy6dUAJHqsY4uludBRjU3ue/view), SHA-256 `1982fbc1e074a6a722cc9947cc023ec2520a6df2321f31b366716590bbf35423`.
- [Fechamento Coleta 19/11, São Paulo × Fluminense](https://drive.google.com/file/d/1CJcaLxDl0OFcMc0VfZ1tAvtb-ltYyCOE/view); [Coleta 22/11, Athletico-PR × Remo](https://drive.google.com/file/d/1o-QeFr4xKXDV7HqjkGBDr5t7mFRDgYLO/view).
- [Grade de linhas LV4](https://github.com/azevedosouza22/futstats/blob/6ef66d14a5d814d57dd59e552cf08983bc57d91a/src/radarV4LabToday.ts), reprodução Python separada do motor TypeScript.
- [HUB F360 PR DRAFT #104](https://github.com/azevedosouza22/futstats/pull/104) e [Issue #105](https://github.com/azevedosouza22/futstats/issues/105). Estratégias formalmente aprovadas: **zero**.

## Decisões LV4/Elite (as 12 células)
| Mercado | Período | Linha | Histórico | Média | Margem | Tipo | SDD |
|---|---|---|---:|---:|---:|---|---|
| Gols | FT | Over 1,5 | 7/10 | 2,9 | 1,4 | LV4 | **OBSERVAR** |
| Gols | 1T | Over 0,5 | 9/10 | 1,9 | 1,4 | ⭐ ELITE | **OBSERVAR** |
| Gols | 2T | ABSTER | — | 1,0 | — | — | **ABSTER** |
| Finalizações | FT | Over 26,5 | 7/10 | 28,5 | 2,0 | LV4 | **OBSERVAR** |
| Finalizações | 1T | Over 12,5 | 8/10 | 14,9 | 2,4 | LV4 | **OBSERVAR** |
| Finalizações | 2T | Over 13,5 | 7/10 | 13,6 | 0,1 | LV4 | **OBSERVAR** |
| Chutes no gol | FT | Over 6,5 | 8/10 | 9,8 | 3,3 | LV4 | **OBSERVAR** |
| Chutes no gol | 1T | Over 4,5 | 7/10 | 5,5 | 1,0 | LV4 | **OBSERVAR** |
| Chutes no gol | 2T | Over 2,5 | 8/10 | 4,3 | 1,8 | LV4 | **OBSERVAR** |
| Escanteios | FT | Over 8,5 | 8/10 | 11,8 | 3,3 | LV4 | **OBSERVAR** |
| Escanteios | 1T | Over 3,5 | 7/10 | 6,4 | 2,9 | LV4 | **OBSERVAR** |
| Escanteios | 2T | Over 4,5 | 7/10 | 5,4 | 0,9 | LV4 | **OBSERVAR** |

**Candidato Elite:** **Gols no 1º tempo, Over 0,5, frequência 9/10, média 1,9, margem +1,4 gol** sobre a linha de 0,5. O módulo Elite é *documental/provisório* (frequência ≥ 9/10 e margem de gols ≥0,8), não função separada nativa comprovada. Os demais sinais qualificados são LV4 comuns. **Gols 2º tempo: ABSTER**; nenhuma linha da grade atingiu ≥70%. Frequência histórica não é probabilidade calibrada.

## Histórico reproduzível: 5 jogos anteriores por equipe

| Equipe | Data | Confronto histórico | ID Flashscore |
|---|---|---|---|
|São Paulo|2026-10-24|Mirassol × São Paulo|`lQzFjYfB`|
|São Paulo|2026-10-28|Bahia × São Paulo|`nDr51AQQ`|
|São Paulo|2026-11-04|São Paulo × Corinthians|`6NbvG9uK`|
|São Paulo|2026-11-19|São Paulo × Fluminense|`CdsLOwOi`|
|São Paulo|2026-11-23|Botafogo × São Paulo|`86sbQjad`|
|Remo|2026-10-23|Cruzeiro × Remo|`rRhmYPvp`|
|Remo|2026-10-28|Remo × Botafogo|`WpKydlll`|
|Remo|2026-11-05|Palmeiras × Remo|`Q7uBAm3s`|
|Remo|2026-11-18|Remo × Chapecoense|`G82JXY6M`|
|Remo|2026-11-22|Athletico-PR × Remo|`Y5AK0Xz9`|


- Total **10 IDs distintos**, 10/10 valores para cada um dos 12 indicadores; nenhuma estatística presumida como zero.
- As duas partidas de novembro com alias `Brasileirão` já estavam no CP16 e foram identificadas pelos IDs **`CdsLOwOi` (São Paulo × Fluminense, 19/11)** e **`Y5AK0Xz9` (Athletico-PR × Remo, 22/11)**. Foram cruzadas **48 células individuais** (24 por partida) com os CSVs originais do Coleta, **0 divergências**. Nenhuma nova linha foi anexada ao CP16, nem nenhuma linha foi alterada.
- A normalização `Brasileirão` ↔ `Brasileirão Série A 2026` foi realizada **somente para o cálculo em memória**, com verificação de data e equipes; sem mudança da fonte/ID original. Não foram utilizados jogos na data do confronto nem resultados posteriores.

## Jogos continentais do dia: 36 confrontos ABSTER
- **UEFA Europa League 2026/27: 18 jogos**, [agenda oficial da UEFA](https://www.uefa.com/uefaeuropaleague/news/02a8-2174cafa5bb6-82bbc20c9b92-1000--2026-27-europa-league-all-the-league-phase-fixtures/). A base CP16 contém **apenas dois jogos sob `Liga Europa`**, muito abaixo de cinco partidas anteriores para cada equipe e oito IDs distintos.
- **UEFA Conference League 2026/27: 18 jogos**, [agenda oficial da UEFA](https://www.uefa.com/uefaconferenceleague/news/02a8-2174cb200f25-b94693ddff4e-1000--202627-conference-league-all-the-league-phase-fixtures/). A CP16 não contém histórico da competição.
- Consequentemente, **nenhum sinal LV4 para os jogos continentais**. A lista de confrontos está em `EUROPA_36_ABSTENCOES.csv`. Não é metodologicamente válido substituir a competição por estatísticas de campeonatos nacionais. As 36 abstenções são por **jogo inelegível**, não 432 linhas calculadas.

## Regras operacionais / Handoff
1. Este estudo foi gerado antes do início de São Paulo × Remo, com data/hora, fontes e linhas fixadas. **Não certifica execução do motor TS original, cotação em casa de apostas ou Shadow V1.**
2. **11 linhas em verde = candidatos OBSERVAR**, não aposta aprovada. **0 SELECIONAR** por falta de odd exata e probabilidade calibrada/EV. ABSTER exibido em cinza.
3. **Chat Coleta:** após o término, obter FT/1T/2T e vincular `tlP20OtQ` às 12 decisões originais; não modificar linhas, SDD ou Elite após o kickoff. **Work:** conferir paridade TypeScript e avaliar a recuperação da coorte e fontes, sem alterar modelos.
4. Resguardados: 659 partidas pessoais, LV4/Elite, Radar V2/V3/V4, app, backups e produção; branch experimental, **sem merge** e sem treino automático.

# FutStats IA — LV4 — pré-jogo, quarta-feira 04/11/2026

**Emissão:** 03/11/2026 (Brasília). **Modo:** pesquisa experimental, nenhuma aposta real. **Arquivo de dados complementar:** [checkpoint de 48 decisões](https://github.com/azevedosouza22/futstats/blob/a13ed3f399764167e7f28650f6d47c87c16b6bf3/research/radar-v4-lab/LV4_2026-11-04_CHECKPOINT_PREJOGO_VERIFICADO.json).

## Síntese e validação

- 13 jogos prioritários: 4 Brasileirão, 9 Champions League; [CBF](https://www.cbf.com.br/futebol-brasileiro/tabelas/campeonato-brasileiro/serie-a/2026) e [UEFA](https://www.uefa.com/uefachampionsleague/news/02a8-2174c9e9019d-f909a77bd77a-1000--2026-27-champions-league-all-the-league-phase-fix/).
- 4 jogos brasileiros: **48 indicadores, 48 sinais históricos**, **0 abstenções por frequência**; um sinal não é acerto nem probabilidade calibrada. Sem odds, odd mínima = N/D.
- 9 jogos Champions: **nenhum sinal LV4 qualificado**, pois cada clube fez somente três jogos na competição (mínimo cinco exigido). Outros 108 indicadores potenciais sem previsão, não contam como erros/abstenções do algoritmo.
- Regras originais: última sequência de 5 jogos da **mesma temporada e competição** para cada equipe, 8 IDs distintos no mínimo; 8 valores válidos por indicador; selecionar maior Over da grade `src/radarV4LabToday.ts` com frequência histórica ≥70%.
- Base principal: **324 partidas** Brasileirão 2026 até 28/10, IDs distintos, zero divergências entre soma dos dois períodos e jogo completo. Para atualização até 30/10 foram associados quatro resultados da rodada 33 por fontes públicas, **sem modificar ou importar esses jogos no arquivo-base original**.
- Resultados complementares: Vasco 1×4 Flamengo, Grêmio 2×0 Athletico-PR, Atlético-MG 0×1 Cruzeiro, Corinthians 2×0 Mirassol. CBF confirma placares, outras fontes forneceram alguns totais e períodos. Chutes e finalizações por período de certas partidas = N/D, usando 9 resultados válidos em vez de 10.
- Há **divergência de finalizações do Corinthians × Mirassol entre fontes secundárias**; hipótese de 35×1 foi usada provisoriamente a partir de fontes concordantes e necessita checagem posterior no Flashscore. Este trabalho não é importação canônica nem gravação no celular.

## 1. Partidas do Brasileirão — modelo LV4

### Flamengo × Grêmio — 19:30 BRT

| Indicador | Jogo completo | Primeiro tempo | Segundo tempo |
|---|---|---|---|
| Gols | Over 1,5 (8/10) | Over 0,5 (7/10) | Over 0,5 (10/10) |
| Finalizações | Over 26,5 (9/10) | Over 12,5 (7/9) | Over 13,5 (8/9) |
| Chutes no gol | Over 8,5 (8/10) | Over 4,5 (7/9) | Over 3,5 (7/9) |
| Escanteios | Over 9,5 (9/10) | Over 4,5 (9/10) | Over 5,5 (7/10) |

Últimos cinco por equipe (médias calculadas; produção / cedido):

| Equipe | V-E-D | Gols marcados/sofridos | Finalizações pró/contra | Escanteios pró/contra |
|---|---|---|---|---|
| Flamengo | 4V, 1E, 0D | 13/5 | 18.6/11.4 | 8.2/3.4 |
| Grêmio | 2V, 2E, 1D | 7/6 | 16.6/15.6 | 6.8/7.2 |

Fonte da amostra: 8 registros do CSV validado + 2 jogos recentes de fontes públicas complementares; alguns períodos têm apenas nove números disponíveis.

### Athletico-PR × Vasco — 19:30 BRT

| Indicador | Jogo completo | Primeiro tempo | Segundo tempo |
|---|---|---|---|
| Gols | Over 1,5 (8/10) | Over 0,5 (8/10) | Over 0,5 (7/10) |
| Finalizações | Over 26,5 (7/10) | Over 10,5 (8/9) | Over 13,5 (8/9) |
| Chutes no gol | Over 7,5 (8/10) | Over 3,5 (7/9) | Over 2,5 (8/9) |
| Escanteios | Over 9,5 (7/10) | Over 3,5 (9/10) | Over 3,5 (9/10) |

Últimos cinco por equipe (médias calculadas; produção / cedido):

| Equipe | V-E-D | Gols marcados/sofridos | Finalizações pró/contra | Escanteios pró/contra |
|---|---|---|---|---|
| Athletico-PR | 1V, 2E, 2D | 7/8 | 18.6/14.4 | 9.2/3.8 |
| Vasco | 2V, 1E, 2D | 6/8 | 17.4/11.0 | 6.6/4.4 |

Fonte da amostra: 8 registros do CSV validado + 2 jogos recentes de fontes públicas complementares; alguns períodos têm apenas nove números disponíveis.

### Botafogo × Atlético-MG — 21:30 BRT

| Indicador | Jogo completo | Primeiro tempo | Segundo tempo |
|---|---|---|---|
| Gols | Over 1,5 (7/10) | Over 0,5 (8/10) | Over 0,5 (7/10) |
| Finalizações | Over 26,5 (9/10) | Over 12,5 (7/9) | Over 13,5 (9/9) |
| Chutes no gol | Over 7,5 (9/10) | Over 3,5 (7/9) | Over 4,5 (7/9) |
| Escanteios | Over 9,5 (8/10) | Over 3,5 (8/10) | Over 5,5 (8/10) |

Últimos cinco por equipe (médias calculadas; produção / cedido):

| Equipe | V-E-D | Gols marcados/sofridos | Finalizações pró/contra | Escanteios pró/contra |
|---|---|---|---|---|
| Botafogo | 1V, 1E, 3D | 4/8 | 15.0/13.4 | 6.6/7.6 |
| Atlético-MG | 2V, 1E, 2D | 7/7 | 16.2/20.0 | 6.4/6.8 |

Fonte da amostra: 9 registros do CSV validado + 1 jogos recentes de fontes públicas complementares; alguns períodos têm apenas nove números disponíveis.

### São Paulo × Corinthians — 21:30 BRT

| Indicador | Jogo completo | Primeiro tempo | Segundo tempo |
|---|---|---|---|
| Gols | Over 1,5 (9/10) | Over 0,5 (8/10) | Over 0,5 (9/10) |
| Finalizações | Over 26,5 (8/10) | Over 12,5 (7/9) | Over 13,5 (7/9) |
| Chutes no gol | Over 7,5 (8/10) | Over 4,5 (7/9) | Over 3,5 (7/9) |
| Escanteios | Over 7,5 (7/10) | Over 3,5 (7/9) | Over 3,5 (7/9) |

Últimos cinco por equipe (médias calculadas; produção / cedido):

| Equipe | V-E-D | Gols marcados/sofridos | Finalizações pró/contra | Escanteios pró/contra |
|---|---|---|---|---|
| São Paulo | 2V, 1E, 2D | 6/7 | 15.2/15.6 | 7.0/5.6 |
| Corinthians | 1V, 1E, 3D | 7/10 | 20.4/14.0 | 6.2/3.2 |

Fonte da amostra: 9 registros do CSV validado + 1 jogos recentes de fontes públicas complementares; alguns períodos têm apenas nove números disponíveis.

## 2. Liga dos Campeões — apenas estudo auxiliar

Na UEFA, cada clube tem três resultados nesta temporada; não há amostra suficiente para emitir Over LV4 de mesmo campeonato (máximo de 6 históricos entre duas equipes, abaixo de 8). Como contextualização, abaixo estão médias de **gols totais nos seis jogos anteriores das duas equipes juntas**. Nenhum dado desta tabela representa previsão qualificada nem porcentagem futura de acerto.

| Jogo — 04/11 | Média gols | Over 1,5 nos 6 anteriores | Over 2,5 nos 6 anteriores |
|---|---:|---:|---:|
| AEK Athens × Real Madrid | 4,33 | 5/6 | 5/6 |
| Fenerbahçe × Liverpool | 5,17 | 6/6 | 5/6 |
| Borussia Dortmund × Real Betis | 3,33 | 4/6 | 4/6 |
| Porto × Napoli | 3,33 | 4/6 | 3/6 |
| PSV Eindhoven × Club Brugge | 3,17 | 4/6 | 3/6 |
| Leipzig × Manchester City | 4,17 | 5/6 | 4/6 |
| Lens × Como | 4,17 | 6/6 | 5/6 |
| Slavia Praha × Arsenal | 3,17 | 5/6 | 4/6 |
| Viking × Sabah | 3,83 | 6/6 | 5/6 |

Dois jogos antecipados da Champions começam às 14h45 de Brasília (AEK × Real Madrid e Fenerbahçe × Liverpool); os outros às 17h00. A Europa League tem ainda Rennes × Olympiacos às 12h30 BRT, mas não há temporada atual dessa competição com cinco jogos para cada equipe no pacote FutStats, logo N/D.

## 3. Lições e auditoria posterior
- Manter gols, finalizações, chutes no gol e escanteios em jogo completo, 1º tempo e 2º tempo.
- Verificar após partidas os 48 sinais brasileiros com estatísticas reais de cada equipe por período, sem trocar linhas. Separar N/D e abstenções de erros.
- **Nunca tratar 10/10 como chance 100%.** Mercados de uma mesma partida são correlacionados e a amostra é pequena.
- Não há odds verificadas e **não se realizarão apostas reais**, em respeito à decisão do usuário e às restrições regulatórias. Valor esperado/ROI prospectivo são N/D.
- Preservar dados pessoais de 659 partidas, Radar V2/V3, produção, backups, algoritmo e todos os prognósticos anteriores.

## 4. Fonte dos complementos
- Vasco × Flamengo: https://jornaldofla.com/vasco-1x4-flamengo-ficha-tecnica-e-estatisticas-brasileirao-2026/
- Grêmio × Athletico: https://www.papodebola.com.br/futebol/brasileirao-serie-a/jogo/29-10-2026/gremio-athletico
- Atlético-MG × Cruzeiro: https://www.benchmarkfutestats.com.br/jogo/8409610/
- Corinthians × Mirassol: https://scorely.tv/pt-br/jogo/corinthians-vs-mirassol-2026-10-30/
- Gols das três primeiras jornadas UCL: https://www.uefa.com/uefachampionsleague/news/02a8-2174c9e9019d-f909a77bd77a-1000--2026-27-champions-league-all-the-league-phase-fix/

**Status:** documentação prospectiva concluída, em ramo experimental, não equivale a sinal gravado no armazenamento local do app.

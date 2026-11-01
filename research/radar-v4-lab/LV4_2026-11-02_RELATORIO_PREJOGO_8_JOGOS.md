# FutStats IA / Laboratório V4 — Pré-jogo 02/11/2026

**Preparado em 01/11/2026, antes das partidas.** Não modificar este estudo após o início. Todas as odds do mercado Stake para estas linhas são **N/D**; não houve captura verificada de odds. Não é relatório de apostas nem registro no Radar V2/V3.

## Fonte e método
- Código de referência `src/radarV4LabToday.ts`: 5 jogos anteriores de cada equipe na **mesma temporada/competição**, mínimo 8 IDs de jogos distintos e pelo menos 8 totais válidos por métrica, maior linha Over da grade original com frequência >=70%.
- Para o Brasileirão 2026, utilizaram-se 324 partidas do arquivo de Google Drive `brasileirao_2026_324_20261029.json`, conferido com 0 duplicatas e 0 inconsistências de total = 1T + 2T; dados até 28/10/2026. Bragantino e Santos têm 33 partidas no arquivo cada.
- Para a Liga Portugal 2026/27, foram utilizados os pacotes no ramo experimental `public/research/packs/liga_portugal_2026_27.json` (81 partidas até 26/10) e `liga_portugal_2026_27_lv4_20261031.json` (1 partida; sem duplicidade). 82 IDs únicos, 0 lacunas ou inconsistências dos quatro mercados.
- Os históricos da temporada passada usados nos outros quatro confrontos estão em `public/research/packs/*_2025_26.json`, NÃO são qualificações LV4 da temporada 2026/27.
- Ver tabela estruturada completa, com linha exata, frequência, médias e IDs das partidas, em [checkpoint de pré-jogo](https://github.com/azevedosouza22/futstats/blob/3c5680b575aea3328d11e5aef286821985afb2cb/research/radar-v4-lab/LV4_2026-11-02_PREJOGO_8_JOGOS_BASE_20261101.json).
- Horários de Brasília; confirmar os da agenda oficial antes do kickoff.

## A. Três jogos com 12 decisões por confronto e dados de temporada atual

**Células: Over linha (acertos/10). '—' é SEM SINAL, não falta de análise.**

| Jogo | Período | Gols | Finalizações | No alvo | Escanteios |
|---|---|---|---|---|---|
| Bragantino × Santos | FT | 1,5 (9/10) | 26,5 (9/10) | 8,5 (8/10) | 9,5 (8/10) |
| | 1T | 0,5 (7/10) | 12,5 (8/10) | 2,5 (8/10) | 4,5 (8/10) |
| | 2T | 0,5 (9/10) | 13,5 (9/10) | 4,5 (9/10) | 4,5 (7/10) |
| Benfica × Alverca | FT | 2,5 (7/10) | 26,5 (7/10) | 6,5 (8/10) | — |
| | 1T | 0,5 (10/10) | 10,5 (8/10) | 2,5 (9/10) | 2,5 (7/10) |
| | 2T | 0,5 (8/10) | 11,5 (9/10) | 3,5 (7/10) | 2,5 (8/10) |
| Gil Vicente × Vitória SC | FT | 1,5 (7/10) | 24,5 (7/10) | 6,5 (7/10) | 6,5 (8/10) |
| | 1T | — | 8,5 (8/10) | — | 3,5 (7/10) |
| | 2T | 0,5 (9/10) | 11,5 (9/10) | 3,5 (8/10) | 2,5 (9/10) |

### Formas recentes
- Bragantino últimos 5: 2V, 2E, 1D, 9 marcados/6 sofridos. Santos últimos 5: 1V, 3E, 1D, 6 marcados/6 sofridos.
- Benfica últimos 5: 4V, 0E, 1D, 12 marcados/5 sofridos. Alverca: 3V, 0E, 2D, 9 marcados/5 sofridos.
- Gil Vicente últimos 5: 2V, 1E, 2D, 5 marcados/6 sofridos. Vitória Guimarães: 1V, 2E, 2D, 7 marcados/5 sofridos.

### Observações para comparação de linhas sem confundir com recomendação
- Bragantino × Santos FT finalizações: **Over 26,5 9/10** (sinal algoritmo); **Over 24,5 10/10** (linha alternativa, não a selecionada pelo algoritmo). Cotação de ambas é N/D; 10/10 não significa p=100%.
- Benfica × Alverca 1T gols: **Over 0,5 10/10**.
- Gil Vicente × Vitória 2T gols: **Over 0,5 9/10**; 2T escanteios **Over 2,5 9/10**.

## B. Quatro jogos com somente referência de 2025/26 (não sinais oficiais)
| Jogo | Padrões da temporada passada, recorte dos últimos 5 por clube | Uso correto |
|---|---|---|
| Newcastle × Everton | FT gols Over 1,5 em 8/10; FT chutes no gol Over 6,5 em 8/10 | Pesquisa auxiliar. Base do mesmo campeonato de 2026/27 insuficiente no checkout acessível |
| Sassuolo × Fiorentina | FT finalizações Over 20,5 em 7/9; 2T finalizações Over 9,5 em 9/9 | Pesquisa auxiliar. Amostra 9 IDs porque um confronto é compartilhado entre os dois últimos-cinco |
| Atalanta × Parma | FT finalizações Over 20,5 em 8/10; 2T gols Over 0,5 em 9/10 | Pesquisa auxiliar. Temporada anterior |
| Lorient × Brest | FT gols Over 1,5 em 9/10; 2T gols Over 0,5 em 9/10 | Pesquisa auxiliar. Temporada anterior |
| Deportivo La Coruña × Osasuna | N/D. Deportivo sem jogos no pacote de La Liga 2025/26; período corrente insuficiente | Não calcular frequência nem sinal LV4 |

## C. Ranking de acompanhamento para validar em jogos futuros
1. Benfica × Alverca, gols 1T Over 0,5, 10/10 retrospectivo, 10 partidas distintas.
2. Bragantino × Santos, finalizações FT Over 26,5 9/10; alternativa Over 24,5 10/10, requer cotação e cautela com a diferença de linhas.
3. Gil Vicente × Vitória, gols 2T Over 0,5 9/10 / escanteios 2T Over 2,5 9/10. **São hipóteses correlacionáveis no mesmo jogo, não 'duas chances independentes'.**
Não definir prioridade de aposta real, ROI esperado ou odd mínima sem probabilidade prospectiva calibrada. Frequência do histórico é observação, não predição confiável.

## D. Lições das apostas reais em 01/11
- Amostra de seis bilhetes R$1, 3V/3D, resultado líquido -R$0,36, ROI -6%; **insuficiente para calibrar modelo**.
- Apostas com mesma frequência histórica 7/10 tiveram odds de 1,47 a 2,41, e ganharam ou perderam: valor da odd precisa ser estimado com `p` prospectiva.
- Se odd amanhã for vista na Stake, registrar **linha exata, mercado, período, horário e odd** antes do jogo. Probabilidade implícita = 1/odd. `p_calibrada`, `odd_justa`, `odd_minima_valor` e `EV` = **N/D** neste estágio.
- Evitar tratar bilhete múltiplo como mercados independentes; evitar tendência à seleção retrospectiva de odds vencedoras; não aumentar stake.

## E. Pendências e preservação
- O Brasil e Portugal foram calculados com os arquivos **atualmente acessíveis**, não se alegou consultar o banco local Android atualizado em tempo real; diferenças posteriores devem ser reconciliadas antes de afirmar equivalência completa.
- Não entrar em jogos não confirmados no calendário; alguns horários/reprogramações podem mudar.
- Não atribuir a estes documentos o status de registro `V4FrozenRecord` dentro do app, que exige agenda recente, horário confirmado e gravação no armazenamento local do usuário.
- Não modificar a base pessoal de 659 jogos, Radar V2/V3, apostas já feitas, produção, arquivo-fonte, nem previsões congeladas de dias anteriores.

**Status:** pesquisado e salvo no ramo experimental, apenas pesquisa pré-jogo.

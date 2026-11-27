# F360 — Auditoria de recência e cobertura por liga (23/11/2026)

**Registro:** `F360-CTRL-RECENCIA-LIGAS-20261123`
**Tipo:** CONTROLE / qualidade e priorização de coleta (não previsão, experimento homologado ou alteração de estratégia).
**Corte operacional:** 23/11/2026, 17h45 BRT. Referência de calendário ainda em andamento.
**Base:** [01_INDICE_PARTIDAS_ELEGIVEIS_5620.csv](https://drive.google.com/file/d/19nLXneG2zkrY8us4dWozf7Vth7P_BKBj/view), gerada em 15/11. SHA-256 reportado na análise de 23/11: `4a9c232e7fb63f91338bc63b64cf59726a1de907865e559f8d5f928961c0a7f2`.

## 1. Diagnóstico objetivo

O índice independente possui **5.620 registros com 24/24 valores**, cobrindo 21 combinações de liga/temporada; nenhuma partida tem data posterior a **09/11/2026**. Este índice é um checkpoint de pesquisa, **não prova do estado atual do app Android, da produção ou do catálogo 6.123**.

Foram encontrados **41 jogos distintos auditados entre 18 e 22/11** em CSVs pós-jogo externos ao corte deste índice, em cinco lotes por data: 3 + 3 + 7 + 17 + 11. Todos têm data posterior ao último registro do índice de 5.620, mas isso **não prova que estejam ausentes de outras cópias experimentais**. Incorporar à cópia de pesquisa só após reconciliação de IDs e duplicações, com controle temporal e sem escrita na produção.

## 2. Tabela de prioridade e recência

| Prior. | Liga/temporada | IDs no índice | Última data | Dias até 23/11 | Jogos auditados 18–22/11 |
|---|---|---:|---|---:|---:|
| P0 | Brasileirão 2026 | 336 | 2026-11-06 | 17 | 12 |
| P1 | La Liga 2026/27 | 117 | 2026-11-08 | 15 | 5 |
| P1 | MLS 2026 | 511 | 2026-11-07 | 16 | 6 |
| P1 | Argentina 2026 | 494 | 2026-11-07 | 16 | 3 |
| P1 | Serie A italiana 2026/27 | 109 | 2026-11-08 | 15 | 3 |
| P1 | Ligue 1 2026/27 | 89 | 2026-11-08 | 15 | 7 |
| P2 | Bundesliga 2026/27 | 81 | 2026-11-08 | 15 | 2 |
| P2 | Premier League 2026/27 | 100 | 2026-11-08 | 15 | 1 |
| P2 | Eliteserien 2026 | 208 | 2026-11-09 | 14 | 1 |
| P2 | Saudi Pro League 2026/27 | 104 | 2026-10-31 | 23 | 1 |
| P2 | Liga Portugal 2026/27 | 96 | 2026-11-08 | 15 | 0 |

**Interpretação:** colunas de partidas auditadas são um **piso mínimo de material já disponível** para reconciliação, não o total real de confrontos faltantes. O número de dias é a diferença entre as datas de corte do índice e 23/11, não dias consecutivos de competição. Se houve pausa de calendário, não multiplicar dias por jogos.

Distribuição dos 41 jogos auditados: Brasileirão 12; Ligue 1 7; MLS 6; La Liga 5; Serie A italiana 3; Argentina 3; Bundesliga 2; Premier League 1; Eliteserien 1; Saudi Pro League 1; Liga Portugal 0.

## 3. Achados críticos por qualidade e funcionamento LV4

### P0 — Brasileirão 2026 (primeiro a atualizar)

- Última partida indexada: **06/11**, 336 partidas completas. Há **12 jogos auditados em 18,19,21 e 22/11** como material de recuperação e calendários CBF 35ª–36ª rodadas, com a 36ª ainda disputada até 25/11. [CBF calendário 35/36](https://www.cbf.com.br/futebol-brasileiro/noticias/campeonato-brasileiro-serie-a/a/cbf-divulga-tabela-detalhada-das-35a-e-36a-rodadas-do-brasileirao-serie-a).
- Estudo de 22/11: **seis candidatos Elite bloqueados** por recência insuficiente. Estudo de 23/11: **Botafogo x São Paulo 12 ABSTER**; **Santos x Grêmio dez DESCARTAR**; registros de 14 e 19/11 com dados por período/mercado faltantes, e outros anexos sem vínculo de ID certificado.
- **Alerta de identidade:** no índice do Brasileirão há 21 grafias distintas para 20 clubes: `RB Bragantino` comparece em **32 participações** e `Red Bull Bragantino` em **2**, claramente o mesmo clube. Normalizar para ID canônico sem apagar texto de origem. A divergência afeta a busca dos cinco jogos por equipe.
- Sinalização de revisão temporal no relatório do índice: **50 partidas brasileiras** (não equivalem a exclusões automáticas).
- Ordem: identificar jogos encerrados após 06/11, coletar 24 valores por jogo e validações, reconciliar os 12 já auditados, fechar 35ª/36ª rodada por ID e data, atualizar cópia experimental e retestar os casos bloqueados sem alterar decisões antigas.

### P1 — La Liga 2026/27

- 117 partidas até 08/11; **cinco partidas** auditadas 20–22/11 fora do corte.
- **Osasuna x Málaga 22/11 teve cinco candidatos Elite e cinco erros**, sinal forte para auditoria de qualidade/recência, **não prova de que atraso causou os erros**.
- Temporada encerrada 2025/26 aparece com **371/380 partidas** no índice: **nove a identificar** para cobertura integral da temporada, condicionada à verificação de calendário/IDs.

### P1 — MLS 2026 (integridade e separação de fase)

- O índice tem **511 linhas**, mas há **30 clubes regulares com 34 participações cada (=510 jogos)**, mais o registro não pertinente `All-Stars da MLS x Liga MX All-Stars`, ID `d0OLOOJ5`, em 29/07/2026. **Excluir esse ID da amostra de liga regular sem apagar a fonte original**.
- **Seis partidas de 20–22/11** auditadas fora do corte. Separam-se da **temporada regular** por se tratar de playoffs. O mesmo grupo historico não deve ser usado como se fosse coorte homogênea; registrar liga/fase e eliminar cruzamento de amostras.
- Temporada MLS 2025: **509 registros** no índice, ante alvo estrutural teórico de 510 jogos de fase regular; auditar 1 possível falta sem presumir que não esteja em outra versão.

### P1 — Argentina 2026

- 494 IDs até 07/11; mais três jogos auditados entre 20 e 22/11. **145 registros de 2026 com sinalização de data** no relatório de origem; sinalização pede revisão, não é conflito estatístico comprovado.
- Identificar Apertura/Clausura e playoffs; separar fase por registro e manter datas/IDs, conferindo os 24 indicadores.

### P1 — Serie A italiana 2026/27

- 109 IDs até 08/11; mais três partidas auditadas em 21–22/11.
- O estudo pré-jogo 23/11 confirmou **Fiorentina x Juventus em 08/11 ausente do índice**; há divergência de finalizações FT, de forma que campos inconclusivos **continuam N/D**, sem estimativa. Priorizar reconstrução exata do confronto e recência do Monza x Fiorentina.

### P1 — Ligue 1 2026/27

- 89 registros até 08/11; **sete partidas** completas auditadas 20–22/11.
- Lote de 21/11 teve 33/54 (61,11%) acertos documentais, e 22/11 Marseille x Le Mans 8/8 entre sinais válidos. Divergência de desempenho **não é prova causal de falta de dados**; atualizar cobertura e auditar amostras por clube antes de alterar estratégia.
- Temporada encerrada 2025/26: **305/306**, auditar uma possível partida ausente.

### P2 — Demais ligas em atualização incremental

- **Bundesliga 2026/27:** 81 até 08/11, dois jogos recentes auditados, inclusive Bayern x Köln.
- **Premier League 2026/27:** 100 até 08/11, Newcastle x Arsenal auditado; Brentford x Everton agendado em 23/11 demanda recência antes da próxima análise.
- **Eliteserien 2026:** 208 até 09/11, Molde x Bodø/Glimt de 20/11 auditado. A competição segue calendário em novembro; **não classificar jogos futuros como atrasados**. [Federação norueguesa](https://www.fotball.no/fotballdata/turnering/hjem/?fiksId=206092).
- **Saudi Pro League 2026/27:** 104 até 31/10, uma partida 20/11 auditada. Maior defasagem em dias (**23**), mas a liga passou por pausa; **não inferir 23 dias de jogos ausentes**. A liga confirmou retorno em 20/11. [SPL oficial](https://www.spl.com.sa/en/news/rsl-schedule-2026-27).
- **Liga Portugal 2026/27:** 96 até 08/11, nenhum jogo na amostra auditada de 18–22/11. Conferir calendário efetivo antes de criar pendências.

## 4. Backlog secundário de temporadas já encerradas

Apenas como indicação de auditoria de integridade de cobertura, sem completar artificialmente:
- **La Liga 2025/26:** 371 de 380 → 9 jogos a localizar.
- **Ligue 1 2025/26:** 305 de 306 → 1 jogo a localizar.
- **MLS 2025:** 509 de 510 jogos esperados em temporada regular → conferir 1 caso.

## 5. Fontes internas e reconciliação

- Base e protocolo: [Relatório da base de 5.620 jogos](https://docs.google.com/document/d/1m-Qu4lk4PldlIzMmkStZVe1bbACoHaAR/edit).
- [Estudo de 22/11 e bloqueios](../PREJOGO_ESTUDOS/F360-ESTUDO-20261122-RELATORIO.md).
- [Estudo de 23/11 no Drive](https://docs.google.com/document/d/1wVMZXqLzb29AP7kr_LPQD67y-DU0Y1Uz/edit).
- Fechamentos com CSVs e 24 indicadores: [18/11](https://drive.google.com/file/d/1GfU8mo7sEZ9Kz2buHxshZbo0ARX_fUBw/view), [19/11](https://drive.google.com/file/d/1CJcaLxDl0OFcMc0VfZ1tAvtb-ltYyCOE/view), [20/11](https://drive.google.com/file/d/17Y6_cE0POnFT-sLDd_VJGfbDzuB_U8HN/view), [21/11](https://drive.google.com/file/d/1ZBiebMZM_n8PnhBztvKdZGSQ8fEnTtXb/view), [22/11](https://drive.google.com/file/d/1ss-W_D6xGfR0MTw_kV3ziQVUe7TpOWcf/view).
- Previsões/sinais são **documentais condicionados**, sem execução TypeScript nativa ou congelamento autenticado; **não promovê-los** a prospectivos oficiais por atualizar a base.

## 6. Plano de coleta e gates de publicação

1. **P0 Brasileiro:** recuperar o calendário real (por rodada/equipe), cruzar IDs Flashscore com índice 5.620 + CSVs de 18–22, conferir dados FT/1T/2T, corrigir alias RB Bragantino, identificar lacunas e atualizar apenas uma nova cópia incremental de pesquisa.
2. **P1 Espanha, MLS, Argentina, Itália, França:** mesma reconciliação, mais fases (MLS/Argentina), 2025/26 (Espanha/França) e pontuais (Fiorentina).
3. **P2 restante:** agendar por partida já encerrada/rodada, sem assumir faltas durante pausas e sem importar partidas futuras.
4. A cada lote: arquivo de origem preservado; checkpoint; quantidade de elegíveis antes/depois; URLs, 24 valores, ID e hash; 0 duplicações por ID canônico; checagem FT=1T+2T, alvo <= finalizações; conflitos e N/D explícitos; comparação do relatório de bloqueios antes/depois.
5. **Reavaliação é nova hipótese de pesquisa, não correção retrospectiva de previsão.** Nenhuma escrita em 659 jogos pessoais, V2/V3/V4, LV4/Elite, Android, produção ou Controle Mestre #29. Sem merge, sem promoção de estratégias.

## Veredito

**Brasileirão 2026 precisa ser atualizado primeiro.** Seguem P1 La Liga, MLS, Argentina, Serie A italiana e Ligue 1, por diferentes razões de cobertura, recência e integridade. Saudi apresenta maior atraso em dias, mas a pausa do campeonato muda a urgência real.

# F360 — Aprendizagem experimental de robustez da amostra

Pesquisa retrospectiva, sem promoção de modelo. Protocolo fixado no commit c337aa91d44ef30ee2b00f3a974a5a65b5a80fb1 antes de executar o backtest; horários e limiares no PROTOCOLO_EXPERIMENTO.json.

## Hipóteses e baseline

Baseline documental Python da grade analyzeV4Fixture 6ef66d14: últimos5por equipe,>=8IDs distintos e>=8observações, maior linha Over da grade com>=70%. Exclui jogo atual e todos os jogos da mesma data. Aliases apenas em memória; IDs deduplicados.24/24 linhas e médias dos snapshots26/11 reproduzidas. Não foi demonstrada paridade de execução TS nativa.

H1: ambos últimos jogos até21dias; H2: cada equipe com pelo menos3/5 históricos acima da mesma linha; H3: margem (média arredondada−linha)/linha>=10%. H123=conjunção fixa, candidato principal. Não há reotimização nem alteração de linha: somente retirar sinais. Elite original é avaliada nos fechamentos congelados; nenhum proxy Elite foi inventado no backtest.

Desenvolvimento:2025-01-01 até2026-09-30; validação temporal:01/10–17/11/2026; verificação secundária:18–23/11.26/11 e posteriores excluídos de todos os testes. Sem seleção de melhor limiar pelos resultados. O lote26/11 é diagnóstico pós-jogo, não teste independente.

## Resultados por recorte

| Recorte | Modelo | Jogos com sinais | Sinais | Acertos | Erros | Taxa% | Cobertura% |
|---|---|---|---|---|---|---|---|
| DEVELOPMENT | BASELINE | 3957 | 40084 | 28166 | 11918 | 70.2674 | 100.0 |
| DEVELOPMENT | H123 | 3840 | 33169 | 23691 | 9478 | 71.4251 | 82.7487 |
| VALIDATION | BASELINE | 617 | 6777 | 4846 | 1931 | 71.5066 | 100.0 |
| VALIDATION | H123 | 579 | 5539 | 4013 | 1526 | 72.4499 | 81.7323 |
| SECONDARY | BASELINE | 81 | 884 | 659 | 225 | 74.5475 | 100.0 |
| SECONDARY | H123 | 81 | 768 | 584 | 184 | 76.0417 | 86.8778 |

## Componentes na validação independente

| Filtro | Sinais | Taxa% | Diferença pp | IC95% por jogo | Acertos descartados | Erros evitados |
|---|---|---|---|---|---|---|
| BASELINE | 6777 | 71.5066 | 0.0 | null | 0 | 0 |
| H1 | 6376 | 71.1261 | -0.3805 | [-0.7849, -0.0073] | 311 | 90 |
| H2 | 6162 | 71.9247 | 0.4181 | [0.0527, 0.7872] | 414 | 201 |
| H3 | 6457 | 72.4485 | 0.9419 | [0.6509, 1.2349] | 168 | 152 |
| H123 | 5539 | 72.4499 | 0.9433 | [0.3486, 1.5447] | 833 | 405 |

H123 melhora a taxa em0,94pp na validação, mas retém81,73% dos sinais: descarta833 acertos e evita405 erros. Não aumenta o número absoluto de acertos nem demonstra lucro. H1 sozinho PIORA (-0,38pp); não há evidência para adotar recência21dias isoladamente. H3 mostra efeito positivo na mesma validação, mas escolher H3 como novo vencedor após ver a validação exigiria OUTRA amostra prospectiva independente. Não substituir o candidato registrado H123 por escolha pós-resultado.

## Validação por mercado e período

| Mercado | Período | Baseline A/E | Taxa% | H123 A/E | Taxa% | Sinais H123 |
|---|---|---|---|---|---|---|
| Gols | FT | 377/163 | 69.8148 | 313/138 | 69.4013 | 451 |
| Gols | 1T | 295/131 | 69.2488 | 253/113 | 69.1257 | 366 |
| Gols | 2T | 433/135 | 76.2324 | 394/116 | 77.2549 | 510 |
| Finalizações | FT | 430/164 | 72.3906 | 310/94 | 76.7327 | 404 |
| Finalizações | 1T | 414/160 | 72.1254 | 326/110 | 74.7706 | 436 |
| Finalizações | 2T | 457/155 | 74.6732 | 389/125 | 75.6809 | 514 |
| Chutes no gol | FT | 425/180 | 70.2479 | 353/144 | 71.0262 | 497 |
| Chutes no gol | 1T | 353/158 | 69.0802 | 287/127 | 69.3237 | 414 |
| Chutes no gol | 2T | 423/176 | 70.6177 | 352/143 | 71.1111 | 495 |
| Escanteios | FT | 407/176 | 69.8113 | 331/141 | 70.1271 | 472 |
| Escanteios | 1T | 390/172 | 69.395 | 327/140 | 70.0214 | 467 |
| Escanteios | 2T | 442/161 | 73.3002 | 378/135 | 73.6842 | 513 |

GolsFT e1T apresentam pequena piora; não tratar melhoria agregada como melhoria uniforme. Arquivos CSV trazem os12pares mercado/período para todos os recortes e candidatos. Bootstrap2000 repetições com seed20261127, reamostrando jogos inteiros, preserva dependência entre sinais da mesma partida; não controla toda dependência de times entre datas nem múltiplas comparações.

## Limitações e decisão

CP16 é snapshot posterior aos jogos; excluir resultados futuros pelo campo data não recupera a disponibilidade vintage dos dados. Portanto o estudo é RETROSPECTIVO TEMPORAL DOCUMENTAL, não validação prospectiva ou prova de ganho causal. Jogos com inconsistência de aditividade detectável ou All-Stars foram excluídos; isso não certifica ausência de prorrogação ou erro não marcado em todo o histórico. Fontes documentais/derivadas preexistentes continuam assim classificadas. O corpus possui limitações de cobertura e temporadas/ligas desiguais.

Decisão: H123 é hipótese promissora para acompanhamento prospectivo, sem alteração de parâmetros atuais ou aprovação automática. Registrar baseline e candidato lado a lado antes do kickoff em futura coorte; avaliar acerto,cobertura,calibração e preços reais. Sem odds não há EV/ROI. Nenhum treinamento automático, peso aprendido ou modelo implantado.

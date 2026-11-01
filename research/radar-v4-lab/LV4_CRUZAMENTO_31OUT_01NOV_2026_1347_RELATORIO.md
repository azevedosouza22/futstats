# FutStats IA — Matriz cruzada LV4 (31/10 e parcial 01/11/2026)

**Corte:** 01/11/2026 ~13h47 Brasília; somente dados então confirmados, sem reavaliação retrospectiva. **Fonte 31/10:** auditoria atômica do Drive [CSV](https://drive.google.com/file/d/1o3I0OCj0OVH48lZUHflytPdh86VuYdft/view); **fonte 01/11:** [snapshot original](https://github.com/azevedosouza22/futstats/blob/9e50531db0c18f7603df601e007ee20022de4c19/research/radar-v4-lab/PREVISOES_PROSPECTIVAS_2026-11-01.json) e estatísticas públicas já auditadas no [relatório anterior](https://github.com/azevedosouza22/futstats/blob/41a55efd0f1fab3d7bb73c48ed4fbe2d61f51199/research/radar-v4-lab/RELATORIO_2026-10-31_E_2026-11-01_PARCIAL_1347.md).

## Controle de universo
- 34 jogos únicos encerrados, 408 decisões (34 × 12), das quais **216 acertos, 94 erros, 65 N/D, 33 abstenções**.
- Taxa apenas sobre resultados verificáveis: **216/310 = 69,68%**. N/D e abstenções fora do denominador.
- 28 jogos de 31/10 + 6 de 01/11. Apenas 23 jogos do primeiro dia possuíam FT/1T/2T completos com 55 colunas. Nenhum ROI real (odds pré-jogo exatas não verificadas).
- Sinais de um mesmo confronto não são independentes; 2 dias (e algumas ligas têm apenas 1 dia). Top rates selecionadas dentre 96 testes estão sujeitas a viés de múltiplas comparações. Nomes de linhas Over devem permanecer os mesmos do arquivo congelado.

## 8 ligas × 3 períodos
| Liga | Completo | 1T | 2T |
|---|---|---|---|
| Premier League | 24/30 (80.0%) | 13/20 (65.0%) | 23/29 (79.3%) |
| La Liga | 13/19 (68.4%) | 9/12 (75.0%) | 12/14 (85.7%) |
| Bundesliga | 15/24 (62.5%) | 15/22 (68.2%) | 20/25 (80.0%) |
| Serie A italiana | 14/23 (60.9%) | 7/8 (87.5%) | 5/11 (45.5%) |
| Ligue 1 | 5/8 (62.5%) | 1/1 (100.0%) | 2/2 (100.0%) |
| Liga Portugal | 5/8 (62.5%) | 1/4 (25.0%) | 5/5 (100.0%) |
| Saudi Pro League | 6/11 (54.5%) | 6/10 (60.0%) | 7/12 (58.3%) |
| Brasileirão | 3/4 (75.0%) | 1/4 (25.0%) | 4/4 (100.0%) |

## 8 ligas × 4 mercados
| Liga | Gols | Finaliz. | No alvo | Escanteios |
|---|---|---|---|---|
| Premier League | 14/17 (82.3%) | 15/22 (68.2%) | 13/21 (61.9%) | 18/19 (94.7%) |
| La Liga | 13/14 (92.9%) | 6/11 (54.5%) | 9/10 (90.0%) | 6/10 (60.0%) |
| Bundesliga | 12/18 (66.7%) | 16/18 (88.9%) | 10/17 (58.8%) | 12/18 (66.7%) |
| Serie A italiana | 10/15 (66.7%) | 4/9 (44.4%) | 7/9 (77.8%) | 5/9 (55.6%) |
| Ligue 1 | 5/5 (100.0%) | 1/2 (50.0%) | 2/2 (100.0%) | 0/2 (0.0%) |
| Liga Portugal | 4/5 (80.0%) | 3/4 (75.0%) | 2/4 (50.0%) | 2/4 (50.0%) |
| Saudi Pro League | 4/8 (50.0%) | 6/9 (66.7%) | 3/8 (37.5%) | 6/8 (75.0%) |
| Brasileirão | 2/3 (66.7%) | 2/3 (66.7%) | 1/3 (33.3%) | 3/3 (100.0%) |

## Premier League: 12 cruzamentos específicos
| Período | Mercado | A/N | Taxa | Jogos distintos | N/D |
|---|---|---|---|---|---|
| full | goals | 6/7 | 85.71% | 7 | 0 |
| full | shots | 6/8 | 75.00% | 8 | 0 |
| full | target | 5/8 | 62.50% | 8 | 0 |
| full | corners | 7/7 | 100.00% | 7 | 0 |
| first | goals | 2/2 | 100.00% | 2 | 0 |
| first | shots | 3/7 | 42.86% | 7 | 1 |
| first | target | 3/6 | 50.00% | 6 | 1 |
| first | corners | 5/5 | 100.00% | 5 | 1 |
| second | goals | 6/8 | 75.00% | 8 | 0 |
| second | shots | 6/7 | 85.71% | 7 | 1 |
| second | target | 5/7 | 71.43% | 7 | 1 |
| second | corners | 6/7 | 85.71% | 7 | 1 |

**Interpretação:** Premier League escanteios 18/19 = 94,74%, dos quais jogo completo 7/7, 1T 5/5, 2T 6/7. Finalizações 1T 3/7 apesar de finalizações 2T 6/7. Não extrapolar benefício futuro com apenas 8 jogos em uma data.

## Ranking das combinações liga × período × mercado (mínimo 5 sinais avaliados, ainda exploratório)
| Liga | Período | Mercado | A/N | Taxa | Jogos | Dias |
|---|---|---|---|---|---|---|
| Premier League | full | corners | 7/7 | 100.00% | 7 | 1 |
| Bundesliga | second | shots | 6/6 | 100.00% | 6 | 1 |
| Premier League | first | corners | 5/5 | 100.00% | 5 | 1 |
| La Liga | full | target | 5/5 | 100.00% | 5 | 2 |
| La Liga | second | goals | 5/5 | 100.00% | 5 | 2 |
| Premier League | full | goals | 6/7 | 85.71% | 7 | 1 |
| Premier League | second | shots | 6/7 | 85.71% | 7 | 1 |
| Premier League | second | corners | 6/7 | 85.71% | 7 | 1 |
| Bundesliga | second | goals | 6/7 | 85.71% | 7 | 2 |
| Bundesliga | full | shots | 5/6 | 83.33% | 6 | 1 |
| Bundesliga | first | shots | 5/6 | 83.33% | 6 | 1 |
| Bundesliga | second | corners | 5/6 | 83.33% | 6 | 1 |
| Serie A italiana | full | goals | 5/6 | 83.33% | 6 | 2 |
| La Liga | full | goals | 4/5 | 80.00% | 5 | 2 |
| Bundesliga | first | target | 4/5 | 80.00% | 5 | 1 |
| Premier League | full | shots | 6/8 | 75.00% | 8 | 1 |
| Premier League | second | goals | 6/8 | 75.00% | 8 | 1 |
| Premier League | second | target | 5/7 | 71.43% | 7 | 1 |
| Bundesliga | full | corners | 4/6 | 66.67% | 6 | 1 |
| Serie A italiana | full | target | 4/6 | 66.67% | 6 | 2 |
| Premier League | full | target | 5/8 | 62.50% | 8 | 1 |
| Bundesliga | first | goals | 3/5 | 60.00% | 5 | 1 |
| Premier League | first | target | 3/6 | 50.00% | 6 | 1 |
| Bundesliga | full | goals | 3/6 | 50.00% | 6 | 1 |
| Bundesliga | full | target | 3/6 | 50.00% | 6 | 1 |
| Bundesliga | first | corners | 3/6 | 50.00% | 6 | 1 |
| Bundesliga | second | target | 3/6 | 50.00% | 6 | 1 |
| Serie A italiana | full | shots | 3/6 | 50.00% | 6 | 2 |
| Premier League | first | shots | 3/7 | 42.86% | 7 | 1 |
| La Liga | full | shots | 2/5 | 40.00% | 5 | 2 |
| Serie A italiana | full | corners | 2/5 | 40.00% | 5 | 2 |
| Serie A italiana | second | goals | 2/5 | 40.00% | 5 | 2 |

## Ranking da linha Over original × liga × período × mercado (mínimo 4 sinais avaliados)
| Liga | Período | Mercado | Over | A/N | Taxa | Jogos |
|---|---|---|---|---|---|---|
| Premier League | full | goals | 1,5 | 6/6 | 100.00% | 6 |
| Premier League | second | goals | 0,5 | 6/6 | 100.00% | 6 |
| La Liga | second | goals | 0,5 | 5/5 | 100.00% | 5 |
| La Liga | full | target | 8,5 | 4/4 | 100.00% | 4 |
| La Liga | first | goals | 0,5 | 4/4 | 100.00% | 4 |
| Premier League | second | shots | 13,5 | 5/6 | 83.33% | 6 |
| Premier League | full | shots | 22,5 | 4/5 | 80.00% | 5 |
| Premier League | second | target | 3,5 | 4/5 | 80.00% | 5 |
| Bundesliga | second | goals | 1,5 | 3/4 | 75.00% | 4 |
| Serie A italiana | full | goals | 1,5 | 3/4 | 75.00% | 4 |
| Serie A italiana | full | target | 8,5 | 3/4 | 75.00% | 4 |
| Serie A italiana | first | goals | 0,5 | 3/4 | 75.00% | 4 |
| Premier League | first | shots | 8,5 | 3/5 | 60.00% | 5 |
| Bundesliga | first | goals | 0,5 | 3/5 | 60.00% | 5 |
| Premier League | first | target | 2,5 | 2/4 | 50.00% | 4 |
| Bundesliga | second | target | 4,5 | 2/4 | 50.00% | 4 |
| Premier League | full | target | 7,5 | 1/4 | 25.00% | 4 |

## Hipóteses para PROSPECÇÃO futura (não apostas)
| Hipótese | Acertos / sinais | Jogos | Dias | N/D |
|---|---|---|---|---|
| Premier League / escanteios FT | 7/7 | 7 | 1 | 0 |
| Premier League / finalizações 1T | 3/7 | 7 | 1 | 1 |
| Bundesliga / finalizações 2T | 6/6 | 6 | 1 | 1 |
| La Liga / gols 2T | 5/5 | 5 | 2 | 0 |

- Hipótese 1: Escanteios Premier League distribuídos entre FT/1T/2T; medir persistência por linha e descanso/mando de campo (somente se dados anteriores ao kickoff disponíveis).
- Hipótese 2: Finalizações 2T Bundesliga vs finalizações 1T, sem mudar thresholds retrospectivamente.
- Hipótese 3: Gols 2T La Liga e gols FT, distinguindo Over 0,5 e Over 1,5; coleta de odds reais antes dos jogos.
- Contraprovas obrigatórias: Premier finalizações 1T 3/7; Serie A italiana gols 2T 2/5; La Liga finalizações FT 2/5; Bundesliga chutes no gol FT 3/6. Não ignorar N/D, abstenções, adversários fortes/fracos, cartões e linhas alternativas.

## Segurança
**Nenhuma alteração em produção, 659 partidas pessoais, Radar V2/V3, previsões congeladas ou backups.** Classificação descritiva, não estratégia validada ou prova de retorno financeiro. Próxima etapa: completar métricas N/D, capturar odds exatas pré-jogo e testar filtros publicados antes de rodadas futuras (≥30 jogos/5 datas como amostra inicial; idealmente 100 jogos futuros/10 datas para validação exploratória adicional).

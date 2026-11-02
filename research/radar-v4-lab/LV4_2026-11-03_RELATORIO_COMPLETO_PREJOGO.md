# FutStats IA — LV4 — Pré-jogo completo de terça-feira, 03/11/2026
**Preparado em 02/11/2026**, antes dos confrontos. **Modo: APENAS PESQUISA E SIMULAÇÃO — zero apostas reais.**

## 1. Conclusão executiva
- **11 jogos confirmados**: 2 Brasileirão e 9 Champions League (horários de Brasília).
- A base verificada da temporada correta permite calcular o **LV4 de 2 jogos brasileiros**, 24 decisões: **22 sinais + 2 abstenções legítimas**. As previsões da Champions foram **não calculadas** por inexistência de base UCL 2026/27 suficiente no repositório/pacotes consultados (9 jogos × 12 decisões potenciais = 108 células sem sinal, não classificadas como erros nem como abstenções do algoritmo).
- **Zero novas apostas**, depósitos, odds fictícias ou ROI prospectivo. Sem cotação real cotejada no mesmo mercado/linha/tempo: odd N/D, p_calibrada N/D, odd mínima N/D.
- O modelo seleciona a maior linha Over de sua grade com frequência retrospectiva ≥70% em pelo menos 8 partidas distintas; esta **não é probabilidade calibrada**. Dez acertos em dez jogos não significa 100% de chance amanhã.
- O estudo foi documentado no GitHub experimental, mas **não gravado como previsão congelada no armazenamento local do app**. Não alterar a metodologia após começo do jogo.

## 2. Agenda e classificação das fontes
| Horário BRT | Competição | Confronto | LV4 com base suficiente? |
|---|---|---|---|
| 14h45 | Champions | Shakhtar Donetsk × Sporting CP | Não — sem pacote exato UCL 2026/27 |
| 14h45 | Champions | Galatasaray × Stuttgart | Não |
| 17h00 | Champions | Atlético Madrid × Bayern | Não |
| 17h00 | Champions | Barcelona × Aston Villa | Não |
| 17h00 | Champions | Feyenoord × Inter | Não |
| 17h00 | Champions | Bodø/Glimt × Lille | Não |
| 17h00 | Champions | LASK × Slovan Bratislava | Não |
| 17h00 | Champions | Manchester United × Roma | Não |
| 17h00 | Champions | Villarreal × PSG | Não |
| 19h30 | Brasileirão | Chapecoense × Mirassol | **Sim** |
| 21h30 | Brasileirão | Internacional × Coritiba | **Sim** |

Fontes de agenda:
- [UEFA, calendário oficial da Champions League 2026/27](https://www.uefa.com/uefachampionsleague/news/02a8-2174c9e9019d-f909a77bd77a-1000--2026-27-champions-league-all-the-league-phase-fixtures-and-results/)
- [CBF, credenciamento e partidas em 03/11/2026](https://credencial.cbf.com.br/competicoes/listar/42/1)

## 3. Base e validações
- Fonte das estatísticas do Brasileirão: [FutStats/Testes — `brasileirao_2026_324_20261029.json`](https://drive.google.com/file/d/1bHlyHnId20T39-hTqZNzTY8yFNsnoS9Y/view) com 324 jogos (28/01 a 28/10/2026), 324 IDs Flashscore distintos; nenhuma divergência aritmética ao conferir FT = 1T + 2T nos quatro mercados e duas equipes.
- Nas partidas de amanhã, 5 jogos passados de cada equipe, 10 IDs distintos por confronto. Os jogos de 03/11 ainda não aparecem na base nem são usados no treinamento.
- Grade completa de Over e política de status: `src/radarV4LabToday.ts`. Status `SEM SINAL` apenas quando a frequência de toda a grade foi inferior a 70%; `N/D` apenas quando não há dados ou preços.

## 4. Chapecoense × Mirassol — 19h30
| Mercado | Jogo completo | 1º tempo | 2º tempo |
|---|---|---|---|
| Gols | Over 1,5 (8/10) | Over 0,5 (8/10) | **SEM SINAL** |
| Finalizações | Over 26,5 (7/10) | Over 12,5 (7/10) | Over 13,5 (9/10) |
| Chutes no gol | Over 8,5 (7/10) | Over 3,5 (7/10) | Over 4,5 (7/10) |
| Escanteios | Over 7,5 (8/10) | Over 4,5 (7/10) | Over 3,5 (9/10) |

**Médias dos 10 históricos:** Gols 2,5; Finalizações 30,5; Chutes no gol 10,4; Escanteios 10,0. **1º tempo:** Gols 1,3; Finalizações 12,5; Chutes no gol 4,9; Escanteios 4,9. **2º tempo:** Gols 1,2; Finalizações 18,0; Chutes no gol 5,5; Escanteios 5,1.

**Forma dos clubes em seus últimos 5:**
| Equipe | Forma (V-E-D) | Gols pró / contra | Finalizações pró / cedidas (média) | Escanteios pró / cedidos (média) |
|---|---|---|---|
| Chapecoense | 1-0-4 | 3 / 13 | 11.2 / 18.0 | 4.6 / 5.4 |
| Mirassol | 2-2-1 | 6 / 3 | 14.2 / 17.6 | 4.0 / 6.0 |

**Diagnóstico:** Chapecoense venceu 1/5, marcou 3 e sofreu 13. Mirassol venceu 2, empatou 2 e perdeu 1, com 6 marcados e 3 sofridos. Os registros de alta frequência no 2º tempo referem-se a **finalizações Over 13,5 (9/10)** e **escanteios Over 3,5 (9/10)**; **gols no 2º tempo** não passam no filtro (Over 0,5 apenas 6/10). Volume estatístico alto sem conversão correspondente em gols é hipótese exploratória, não certeza.

Alternativas com preços N/D: escanteios FT **Over 6,5 10/10** versus linha original FT Over 7,5 8/10; escanteios 2º tempo **Over 2,5 10/10** versus original Over 3,5 9/10. As alternativas não substituem as linhas previamente congeladas.

IDs históricos: YDhJ7WU9, EkcGEvrf, IsfXAdsJ, YBVbjP0S, faJea2wq, 4zWUq8L5, f75igXFG, hz97G0Ds, 0MmjRHRa, lQzFjYfB.

## 5. Internacional × Coritiba — 21h30
| Mercado | Jogo completo | 1º tempo | 2º tempo |
|---|---|---|---|
| Gols | Over 1,5 (8/10) | **SEM SINAL** | Over 0,5 (9/10) |
| Finalizações | Over 26,5 (9/10) | Over 12,5 (8/10) | Over 13,5 (10/10) |
| Chutes no gol | Over 8,5 (8/10) | Over 3,5 (7/10) | Over 4,5 (7/10) |
| Escanteios | Over 9,5 (8/10) | Over 3,5 (7/10) | Over 5,5 (7/10) |

**Médias dos 10 históricos:** Gols 2,6; Finalizações 32,2; Chutes no gol 10,6; Escanteios 12,6. **1º tempo:** Gols 0,9; Finalizações 14,0; Chutes no gol 4,8; Escanteios 5,4. **2º tempo:** Gols 1,7; Finalizações 18,2; Chutes no gol 5,8; Escanteios 7,2.

**Forma dos clubes em seus últimos 5:**
| Equipe | Forma (V-E-D) | Gols pró / contra | Finalizações pró / cedidas (média) | Escanteios pró / cedidos (média) |
|---|---|---|---|
| Internacional | 2-1-2 | 7 / 6 | 14.8 / 17.0 | 4.8 / 7.6 |
| Coritiba | 0-1-4 | 1 / 12 | 10.0 / 22.6 | 4.4 / 8.4 |

**Diagnóstico:** o Coritiba registrou 0 vitórias, 1 empate, 4 derrotas, 1 gol marcado e 12 sofridos. Concedeu média de **22,6 finalizações e 8,4 escanteios por jogo**. O Internacional registrou 2 vitórias, 1 empate e 2 derrotas, com 7 gols marcados e 6 sofridos. A linha mais forte do recorte é **Over 13,5 finalizações no 2º tempo (10/10)**, mas não há sinal de gol no 1º tempo (Over 0,5 em apenas 6/10).

Alternativas descritivas: escanteios 2º tempo **Over 2,5 ocorreu em 10/10**, contra linha oficial de maior Over 5,5 (7/10). Finalizações FT Over 24,5 em 10/10, mas o modelo selecionou Over 26,5 (9/10). Sem odd e p prospectiva, não comparar EV nem chamar essas linhas de oportunidades de aposta.

IDs históricos: phCOok8j, 8CzkbJcD, 0MmjRHRa, lOeeW39d, UsHUp3Ok, AFN2tZED, EmpIvY0N, OKIyMMkK, MyxaPedC, UJYsf713.

## 6. Champions League — 9 jogos, somente contexto verificado
**Restrição metodológica:** cada um dos 18 clubes chegou à 4ª jornada tendo disputado 3 jogos da fase de liga. O arquivo de pacotes FutStats consultado não contém temporada Champions 2026/27 com estatísticas completas de 1º/2º/FT. Portanto, nenhum dos 9 confrontos atinge o mínimo de 5 partidas por equipe e 8 IDs distintos **dentro da mesma competição**. Não misturar jogos nacionais com Champions para emitir uma previsão denominada LV4 válida.

Resultados mais recentes da **3ª jornada** consultados na UEFA (referências factuais, não prognósticos):
| Confronto de 03/11 | Último resultado de cada equipe na Champions | Status 12 decisões LV4 |
|---|---|---|
| Shakhtar Donetsk × Sporting CP | Shakhtar 0–1 Inter; Sporting 2–3 LASK | N/D, sem previsão qualificada |
| Galatasaray × Stuttgart | Galatasaray 4–2 Lille; Stuttgart 1–1 Atlético Madrid | N/D, sem previsão qualificada |
| Atlético de Madrid × Bayern München | Atlético 1–1 Stuttgart; Bayern 2–2 Arsenal | N/D, sem previsão qualificada |
| Barcelona × Aston Villa | Barcelona 2–4 PSG; Aston Villa 3–1 Viking | N/D, sem previsão qualificada |
| Feyenoord × Inter | Feyenoord 0–1 Betis; Inter 1–0 Shakhtar | N/D, sem previsão qualificada |
| Bodø/Glimt × Lille | Bodø/Glimt 3–4 Napoli; Lille 2–4 Galatasaray | N/D, sem previsão qualificada |
| LASK × Slovan Bratislava | LASK 3–2 Sporting; Slovan 0–4 Roma | N/D, sem previsão qualificada |
| Manchester United × Roma | United 1–4 Como; Roma 4–0 Slovan | N/D, sem previsão qualificada |
| Villarreal × PSG | Villarreal 3–4 Liverpool; PSG 4–2 Barcelona | N/D, sem previsão qualificada |

São resultados de **uma rodada**, insuficientes para inferir probabilidade de gols, cantos, finalizações ou chutes no alvo. A forte variação dos placares não justifica inventar linhas Over.

## 7. Gestão do experimento e odds
- As entradas de 01/11 renderam 3 acertos e 3 erros, total R$6 e retorno informado R$5,64, líquido −R$0,36, ROI −6% (dois desfechos comunicados pelo usuário sem print final de liquidação). Não transferir o ROI de uma única data para o conjunto LV4.
- Para 03/11: não haverá bilhetes reais, não calcular ROI financeiro. Registrar separadamente acerto estatístico, abstenção do algoritmo, impossibilidade de cálculo por falta de dados e ausência de cotação.
- Incluir os 22 sinais em monitoramento, mas sem priorizar apostas. A ausência de odds comparáveis, linhas asiáticas distintas e mercados indisponíveis impede qualquer afirmação de valor esperado positivo.
- **Situação regulatória:** MP nº 1.394/2026 proibiu oferta e exploração de apostas de quota fixa em território brasileiro. A pesquisa não inicia nem recomenda novas operações financeiras. [Ministério da Fazenda](https://www.gov.br/fazenda/pt-br/composicao/orgaos/secretaria-de-premios-e-apostas/medida-provisoria-ndeg-1-394-2026-entenda-as-novas-regras-para-as-apostas-de-quota-fixa) / [Congresso Nacional](https://www.congressonacional.leg.br/materias/medidas-provisorias/-/mpv/175871).

## 8. Próximo fechamento e cuidados
Quando as duas partidas brasileiras terminarem, buscar **gols, finalizações, chutes no gol e escanteios de ambas as equipes em FT/1T/2T**. Checar somas antes de avaliar as 24 decisões. Reportar 22 sinais e 2 abstenções sem alteração de linhas. Para Champions, pode-se anotar placar e gols, mas não atribuir percentuais de acerto LV4 sem previsões válidas congeladas.
Preservar 659 jogos pessoais, Radar V2/V3, produção, backups, branch experimental e prognósticos anteriores. Não fazer merge.

**Checkpoint completo de dados:** [JSON pré-jogo 03/11/2026](https://github.com/azevedosouza22/futstats/blob/bdfe8b4c70da20615e0aa0ee844d8f6a4d14216b/research/radar-v4-lab/LV4_2026-11-03_CHECKPOINT_PREJOGO_11_CONFRONTOS.json).

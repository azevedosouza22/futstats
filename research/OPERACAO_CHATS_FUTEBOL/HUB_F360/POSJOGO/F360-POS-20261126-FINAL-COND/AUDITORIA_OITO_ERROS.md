# F360 — Auditoria dos oito erros de São Paulo × Remo

Linhas congeladas preservadas. Reprodução documental:24/24 linhas e médias dos dois pré-jogos coincidem com a grade analyzeV4Fixture do commit6ef66d14; não constitui execução TS nativa. Não encontrei erro aritmético na seleção congelada. A causa causal do jogo não pode ser determinada só por estatísticas.

| Mercado | Período | Linha | Média10 | Real | Diferença real−média | SP média5 | Remo média5 |
|---|---|---|---|---|---|---|---|
| Finalizações | FT | 26.5 | 28.5 | 15 | -13.5 | 30.8 | 26.2 |
| Chutes no gol | FT | 6.5 | 9.8 | 5 | -4.8 | 8.8 | 10.8 |
| Escanteios | FT | 8.5 | 11.8 | 7 | -4.8 | 13.8 | 9.8 |
| Finalizações | 1T | 12.5 | 14.9 | 8 | -6.9 | 16.4 | 13.4 |
| Chutes no gol | 1T | 4.5 | 5.5 | 2 | -3.5 | 5.2 | 5.8 |
| Escanteios | 1T | 3.5 | 6.4 | 3 | -3.4 | 8.6 | 4.2 |
| Finalizações | 2T | 13.5 | 13.6 | 7 | -6.6 | 14.4 | 12.8 |
| Escanteios | 2T | 4.5 | 5.4 | 4 | -1.4 | 5.2 | 5.6 |

## Amostra e contexto mensurável

Cada equipe contribuiu com cinco jogos;10IDs distintos;mesma competição, datas anteriores26/11. Os CSVs HISTORICOS_10_DETALHADOS e AUDITORIA_ERROS_E_AMOSTRA preservam IDs, datas, adversários, mando, totais, médias, desvio e suporte por equipe.

São Paulo: Mirassol fora24/10, Bahia fora28/10, Corinthians casa04/11, Fluminense casa19/11, Botafogo fora23/11. Remo: Cruzeiro fora23/10, Botafogo casa28/10, Palmeiras fora05/11, Chapecoense casa18/11, Athletico fora22/11. A amostra tem somente2 jogos do São Paulo em casa e3 do Remo fora; não permite inferência robusta de mando. Não há ajuste de força do adversário no algoritmo observado.

O método usa TOTAIS DOS DOIS TIMES em partidas anteriores, não apenas produção ofensiva própria. Remo teve jogos contra Palmeiras7gols e Athletico6gols; estes combinam14e15 chutes no alvo, elevando o histórico. Isso identifica composição da amostra; não prova que adversários fortes causaram a derrota da linha.

## Recência não resolve automaticamente

As médias combinadas dos últimos3 jogos por equipe seriam30,5 finalizações FT e11,33 chutes no gol FT, acima das médias28,5e9,8 do pool5+5. Reforçar recência isoladamente teria aumentado, não reduzido, a expectativa retrospectiva desses mercados. Escanteios FT cairiam de11,8 para10,33, ainda acima do real7. Dados não mostram tendência generalizada de queda capaz de antecipar os oito erros.

## Mando, dispersão e margem

Finalizações FT: médias de totais por jogo SP30,8 eRemo26,2; no mesmo mando da partida,30,0e25,33, com n2/n3. O real15 ficou13,5 abaixo da média28,5 (desvio amostral6,24); esse desvio é descrição da amostra, não probabilidade normal calibrada. Chutes no alvoFT: médias próprias SP4,2eRemo5,2; totais médios8,8e10,8; o jogo atual produziu4e1. Somar médias ofensivas não equivale a um modelo de confronto calibrado.

A regra escolhe a MAIOR linha da grade com frequência>=70%; não exige margem mínima. A linha de finalizações2T O13,5 tinha média13,6, margem só0,1; sensível a uma pequena oscilação. Escanteios2T O4,5 tinha média5,4, margem0,9. Outros erros tinham margem maior, portanto margem mínima não explica nem evita todos. No primeiro tempo, escanteios totais médiosSP8,6 versusRemo4,2 mostram heterogeneidade escondida pelo pool6,4.

## Erros semelhantes anteriores

Nos44 jogos com sinais avaliáveis dos fechamentos19–23/11, três tiveram>=8 erros: Bayern–Köln20/11 (2A/10E), Nice–PSG21/11 (4A/8E), Osasuna–Málaga22/11 (3A/9E). São Paulo–Remo é o quarto nesse conjunto de46 jogos incluindo26/11. Os mercados e períodos de uma mesma partida são dependentes; oito erros não são oito ensaios independentes.

No recorte19–23, LV4 convencional300A/93E=76,34%; Elite documental50A/16E=75,76%. A pequena amostra Elite de26/11 (4/4) não estabelece superioridade permanente. As classes condicionais e bloqueios originais foram mantidos; sem ROI.

## Conclusão técnica

Evidência compatível com queda excepcional de volume da partida e limitações estruturais (pool pequeno, adversário/mando não ajustados e escolha de linha por frequência sem margem). Não é possível distinguir, com um jogo, oscilação isolada de falha estrutural causal. Não há prova de bug aritmético nas24 decisões, e nenhuma previsão foi reescrita. Hipóteses foram registradas antes do backtest e avaliadas em datas separadas; resultados no relatório experimental.

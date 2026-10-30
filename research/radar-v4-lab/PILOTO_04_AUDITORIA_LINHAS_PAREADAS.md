# FutStats IA — Laboratório Radar V4 — Piloto 04: auditoria pareada por linha

## Status e escopo
Auditoria exclusivamente experimental, **sem alteração de sinais ou recomendações no aplicativo**, sem acesso ou escrita em `localStorage`, backups, histórico pessoal, V2/V3 ou produção. Extende o Teste 03 com 240 jogos (30 por cada uma de oito ligas), quatro mercados e três períodos — **2.880 oportunidades**. A amostra e o método de cálculo de histórico são os mesmos, reaproveitados integralmente no teste `src/radarV4LabPilot04.test.ts`. O teste primeiro exige reproduzir o total publicado: **2.591 sinais, 1.840 acertos, 751 erros e 289 abstenções**. Divergência implica falha do teste, não ajuste oportunista dos números.

## Controle justo, mesmo jogo, linha e período
Cada uma das doze combinações período × mercado recebe **uma linha fixa antes de consultar desfechos**: a segunda linha da lista originalmente definida no Teste 03.

| Período | Finalizações | Escanteios | Chutes no gol | Gols |
| --- | ---: | ---: | ---: | ---: |
| Partida inteira | Over 22,5 | Over 7,5 | Over 6,5 | Over 2,5 |
| Primeiro tempo | Over 10,5 | Over 3,5 | Over 3,5 | Over 1,5 |
| Segundo tempo | Over 11,5 | Over 3,5 | Over 3,5 | Over 1,5 |

Para cada combinação, a mesma sequência de **240 confrontos** é avaliada de três maneiras:
1. **Controle sem filtro:** registrar Over na linha fixa em todos os 240 jogos.
2. **Filtro histórico 60%:** registrar Over na MESMA linha apenas se o histórico anterior de oito ou mais confrontos alcançar 60%; nos demais, abster-se.
3. **Filtro histórico 70%:** mesmo procedimento com corte de 70%. Separar os acertos/erros dos 240 jogos nos blocos **indicados** e **abstidos**. A comparação honesta da utilidade do filtro é entre taxa dos jogos selecionados versus não selecionados e respectiva cobertura, e não um pareamento fictício contra o controle no mesmo subconjunto selecionado (que sempre terá os mesmos acertos e erros por construção).

Os únicos dados usados para filtrar são últimos cinco jogos estritamente anteriores de cada equipe na mesma temporada e competição; exclusão de confrontos do mesmo dia, futuros e sourceIds duplicados. Os resultados da partida sob avaliação são usados **apenas para aferir**. Cada mercado/tempo dos 240 jogos é correlacionado com outros mercados/tempos da mesma partida; 2.880 oportunidades não equivalem a 2.880 ensaios independentes.

## Verificações automatizadas
O teste:
- exige a base de 3.260 confrontos e reprodução dos 240 jogos e 2.591 sinais;
- interrompe se os 1.840 acertos publicados não forem reproduzidos;
- verifica que o total selecionado + abstido seja 240 em cada política;
- reconcilia acertos e erros entre amostras selecionadas e excluídas;
- verifica ordem temporal do histórico e a ausência de duplicatas;
- publica no log CI a linha **`RADAR_V4_MATCHED_AUDIT_JSON=`** com as 12 comparações completas.

Comando para reprodução: `npx vitest run src/radarV4LabPilot04.test.ts`. O teste também integra a lista de testes de `npm run build` **apenas neste PR DRAFT #102**.

## Limites e decisão
Os resultados pareados **não estão antecipados neste registro**: devem ser extraídos da execução verificável do teste com a base exata do repositório, não da simulação financeira do Piloto 03. Sem odds reais previamente disponíveis, custos, linhas praticadas e validação prospectiva congelada, nenhuma taxa obtida demonstra lucratividade ou vantagem sobre Radar V2/V3. O piloto avalia somente a regra experimental de filtro de frequência, não executa o código dos modelos V2/V3. Qualquer inclusão em As Boas do Dia depende de novo aceite e comparação direta com V2/V3.

Referências: `research/radar-v4-lab/PILOTO_03_OITO_LIGAS_30_JOGOS_FT_1T_2T.md`, PR #102 e Controle Mestre issue #29.

## Resultados reproduzidos em execução de CI de 30/10/2026

A reexecução sobre os 240 confrontos e os 12 pares mercado/período gerou o seguinte comparativo. **Cada linha** utiliza os mesmos 240 jogos e a **mesma linha fixa** nas três políticas; as taxas da política filtrada têm denominadores diferentes porque alguns jogos foram conscientemente descartados.

| Período | Mercado | Linha fixa | Sem filtro | Filtro ≥60% | Filtro ≥70% | Descartados pelo filtro 70% |
|---|---|---:|---:|---:|---:|---:|
| FT | Finalizações | Over 22,5 | 168/240 (70,0%) | 138/187 (73,8%) | 112/146 (76,7%) | 56/94 (59,6%) |
| FT | Escanteios | Over 7,5 | 181/240 (75,4%) | 169/225 (75,1%) | 139/188 (73,9%) | 42/52 (80,8%) |
| FT | Chutes no gol | Over 6,5 | 193/240 (80,4%) | 179/225 (79,6%) | 150/191 (78,5%) | 43/49 (87,8%) |
| FT | Gols | Over 2,5 | 131/240 (54,6%) | 75/127 (59,1%) | 42/74 (56,8%) | 89/166 (53,6%) |
| 1ºT | Finalizações | Over 10,5 | 163/240 (67,9%) | 117/162 (72,2%) | 95/121 (78,5%) | 68/119 (57,1%) |
| 1ºT | Escanteios | Over 3,5 | 173/240 (72,1%) | 147/203 (72,4%) | 123/163 (75,5%) | 50/77 (64,9%) |
| 1ºT | Chutes no gol | Over 3,5 | 142/240 (59,2%) | 85/133 (63,9%) | 57/91 (62,6%) | 85/149 (57,0%) |
| 1ºT | Gols | Over 1,5 | 87/240 (36,3%) | 11/29 (37,9%) | 4/12 (33,3%) | 83/228 (36,4%) |
| 2ºT | Finalizações | Over 11,5 | 168/240 (70,0%) | 143/197 (72,6%) | 115/154 (74,7%) | 53/86 (61,6%) |
| 2ºT | Escanteios | Over 3,5 | 171/240 (71,3%) | 161/228 (70,6%) | 143/200 (71,5%) | 28/40 (70,0%) |
| 2ºT | Chutes no gol | Over 3,5 | 178/240 (74,2%) | 154/208 (74,0%) | 117/157 (74,5%) | 61/83 (73,5%) |
| 2ºT | Gols | Over 1,5 | 114/240 (47,5%) | 37/76 (48,7%) | 17/35 (48,6%) | 97/205 (47,3%) |

No **jogo completo — finalizações Over 22,5**, o filtro de 70% selecionou 146 jogos e acertou 112 (76,7%), contra 56/94 (59,6%) entre os que descartou. No **primeiro tempo — finalizações Over 10,5**, selecionou 121 e acertou 95 (78,5%), contra 68/119 (57,1%) descartados. Isso sinaliza capacidade de seleção **nessas duas linhas**, não demonstra vantagem financeira ou robustez prospectiva.

Em contrapartida, em **FT — escanteios Over 7,5**, os descartados tiveram 42/52 (80,8%) contra 139/188 (73,9%) nos selecionados. Em **FT — chutes no gol Over 6,5**, os descartados tiveram 43/49 (87,8%) contra 150/191 (78,5%) nos selecionados. Portanto, o limiar de 70% **não deve ser aplicado indiscriminadamente** aos quatro mercados.

### Divergência de reprodutibilidade descoberta e registrada

O teste do PR #102 sobre a base atual produziu **2.591 sinais adaptativos, 1.846 acertos, 745 erros e 289 abstenções**, enquanto o relatório original do Piloto 03 dizia **1.840 acertos, 751 erros**. Seis acertos de diferença estão concentrados no Brasileirão 2026 (257 agora versus 251 relatados anteriormente), sem alteração nas outras sete ligas. A primeira execução do gate foi **vermelha intencionalmente**, porque a afirmação antiga foi exigida como igualdade; log consultável em [GitHub Actions #40998177035](https://github.com/azevedosouza22/futstats/actions/runs/40998177035). Houve recontagem independente com os mesmos arquivos e reprodução exata de 1.846 acertos. O Piloto 03 e seus asserts foram retificados com trilha de auditoria: **não presumir causa original** até conferir a procedência histórica dos números anteriores.

Os resultados agora permanecem congelados nas asserções do Piloto 03 e no gate deste Piloto 04. Os números pareados acima refletem o estado da **base experimental atual**, não uma comparação direta com modelos V2/V3 nem uma simulação econômica real. As apostas de odds fictícias do Piloto 03 devem permanecer apenas como ilustração. Não modificar o motor As Boas do Dia sem novos testes prospectivos, independentemente dos percentuais.

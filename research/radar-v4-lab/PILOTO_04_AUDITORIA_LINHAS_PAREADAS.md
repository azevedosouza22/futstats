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

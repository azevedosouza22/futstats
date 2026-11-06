# FutStats IA — LV4 Elite Futebol V1 (triagem provisória) — Brasileirão de 04/11/2026

**Emissão:** 03/11/2026, antes dos jogos. **Tipo:** Segunda camada diagnóstica de observação. **Sem apostas reais ou indicações financeiras.** [Arquivo JSON com todas as 48 decisões](https://github.com/azevedosouza22/futstats/blob/cc2f5b4d97d4ed5756c3bca9878319617d8e79f5/research/radar-v4-lab/LV4_ELITE_2026-11-04_TRIAGEM_BRASILEIRAO.json).

## O que foi aplicado
Foi discutido anteriormente um segundo nível experimental chamado **LV4 Elite**, que preserva o Radar V4 e estuda consistência histórica, margem sobre a linha, situação das equipes, períodos, qualidade de dados e eventual comparação com odds. **Não existe uma fórmula Elite de futebol homologada com pesos exatos.** Esta V1 é um filtro **provisório, transparente, não uma implementação do Elite final, nem um modelo de chance de acerto.** Não usar números como odds justas ou 90% de chance.

Regras temporárias para **candidato Elite**:
1. O sinal já foi emitido pelo LV4 original, sem modificar linha, mercado, período e data.
2. Pelo menos 9 sucessos entre 10 observações válidas da temporada/competição.
3. Média do recorte acima da linha Over com margem mínima exploratória: gols +0,8; finalizações +3,0; chutes no gol +1,5; escanteios +2,0 (média − linha). Essas margens são **hipóteses novas de triagem**, não parâmetros históricos validados do projeto.
4. **Sob ressalva:** atende à frequência de pelo menos 90%, porém falta um dado de período (9/9) ou a margem média é menor que o limiar. Os demais mantêm status **LV4 convencional**, nunca descartados da auditoria.
5. **Aprovação financeira:** nenhuma. Faltam validação fora da amostra, probabilidade calibrada, comparação de linhas/odds e condições legais. A classificação Elite não garante vantagem financeira.

## Resumo
- 4 jogos; 48 indicadores originais.
- **9 candidatos Elite**; **2 sinais sob ressalva**; **37 sinais LV4 convencionais**.
- 0 apostas reais; 0 entradas aprovadas; odds N/D.
- **Flamengo × Grêmio:** 4 Elite, 0 revisão, 8 LV4 convencional
- **Athletico-PR × Vasco:** 1 Elite, 1 revisão, 10 LV4 convencional
- **Botafogo × Atlético-MG:** 2 Elite, 1 revisão, 9 LV4 convencional
- **São Paulo × Corinthians:** 2 Elite, 0 revisão, 10 LV4 convencional

## 9 candidatos Elite em observação
| Jogo | Mercado / período | Linha original | Histórico | Média | Margem média acima da linha |
|---|---|---:|---:|---:|---:|
| Flamengo × Grêmio | Gols / 2ºT | Over 0,5 | 10/10 | 1,7 | +1,2 |
| Flamengo × Grêmio | Finalizações / Jogo completo | Over 26,5 | 9/10 | 31,1 | +4,6 |
| Flamengo × Grêmio | Escanteios / Jogo completo | Over 9,5 | 9/10 | 12,8 | +3,3 |
| Flamengo × Grêmio | Escanteios / 1ºT | Over 4,5 | 9/10 | 6,7 | +2,2 |
| Athletico-PR × Vasco | Escanteios / 2ºT | Over 3,5 | 9/10 | 7,1 | +3,6 |
| Botafogo × Atlético-MG | Finalizações / Jogo completo | Over 26,5 | 9/10 | 32,3 | +5,8 |
| Botafogo × Atlético-MG | Chutes no gol / Jogo completo | Over 7,5 | 9/10 | 10,7 | +3,2 |
| São Paulo × Corinthians | Gols / Jogo completo | Over 1,5 | 9/10 | 3,0 | +1,5 |
| São Paulo × Corinthians | Gols / 2ºT | Over 0,5 | 9/10 | 1,6 | +1,1 |

## 2 sinais sob ressalva
| Jogo | Mercado / período | Linha original | Histórico | Média | Margem média acima da linha |
|---|---|---:|---:|---:|---:|
| Athletico-PR × Vasco | Escanteios / 1ºT | Over 3,5 | 9/10 | 4,9 | +1,4 |
| Botafogo × Atlético-MG | Finalizações / 2ºT | Over 13,5 | 9/9 | 17,8 | +4,3 |

O Over 3,5 escanteios no 1ºT de Athletico-PR × Vasco tem 9/10, porém a margem média é de +1,4 escanteio em relação à linha, inferior ao limiar provisório de +2,0. O Over 13,5 finalizações no 2ºT de Botafogo × Atlético-MG obteve 9/9, mas um jogo recente não tinha estatísticas completas desse período.

## Diagnóstico por confronto
- **Flamengo × Grêmio:** maior concentração de candidatos (4). Há correlação entre escanteios do 1ºT e escanteios do jogo completo; ambos não são provas independentes. Gol no 2ºT 10/10 é a frequência mais alta observada, com média de 1,7 no período.
- **Athletico-PR × Vasco:** escanteios segundo tempo são o candidato mais destacado (9/10, média 7,1 para Over 3,5); primeiro tempo com 9/10, mas margem mais estreita e classificação sob ressalva.
- **Botafogo × Atlético-MG:** finalizações e chutes no gol do jogo inteiro (9/10 cada) têm histórico de volume alto. O indicador do 2ºT com 9/9 não deve ser apresentado como equivalente a uma amostra completa de 10.
- **São Paulo × Corinthians:** dois candidatos de gols (FT Over1,5 9/10, 2ºT Over0,5 9/10). São indicadores sobrepostos, não independentes. A fonte de finalizações de Corinthians × Mirassol apresentou discrepância entre fornecedores e precisa validação visual; não elevamos finalizações deste confronto a Elite.

## Limites estatísticos
Frequência histórica não é probabilidade calibrada. Como mera medida do pequeno tamanho de amostra, o intervalo de Wilson bilateral de 95%, **sem corrigir seleção da linha ou dependência entre indicadores**, vai aproximadamente de **59,6% a 98,2%** para 9/10 e **72,2% a 100%** para 10/10. Não são garantias de resultado, não validam uma probabilidade futura e não sustentam odd mínima.

**Outras verificações pendentes:** separação detalhada de mando/visita, ausências e escalações, adversários e contexto, período recente com estatísticas N/D em algumas partidas, divergências entre fontes e avaliação fora da amostra. Não preencha lacunas por suposição.

## Pós-jogo
1. Auditar as 48 previsões originais, não apenas as 9 Elite, com gols/finalizações/chutes no gol/escanteios no jogo/1ºT/2ºT. N/D e pendência não são erros.
2. Cruzar os resultados por grupo: 9 Elite, 2 sob ressalva, 37 convencional. A unidade de resultado principal é a partida (apostas/mercados do mesmo jogo são correlacionados).
3. Comparar a precisão prospectiva ao LV4 base, preservando os thresholds congelados acima; não recalibrar olhando o resultado de 04/11.
4. Não realizar novas apostas reais e não alterar produção, Radar V2/V3, 659 partidas pessoais, backups ou linhas originais.

**Fonte base e metodologia original:** [checkpoint LV4 de 04/11/2026](https://github.com/azevedosouza22/futstats/blob/a13ed3f399764167e7f28650f6d47c87c16b6bf3/research/radar-v4-lab/LV4_2026-11-04_CHECKPOINT_PREJOGO_VERIFICADO.json). Este filtro é somente uma camada adicional de pesquisa, sem sincronização automática com o aplicativo Android.

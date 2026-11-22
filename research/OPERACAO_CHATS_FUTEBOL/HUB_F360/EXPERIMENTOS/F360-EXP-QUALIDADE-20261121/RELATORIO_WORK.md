# Work F360 - reconciliação e qualidade de 19/20 de novembro

Registro: **F360-EXP-QUALIDADE-20261121**. Tipo EXPERIMENTO de qualidade/reprodutibilidade, não experimento de melhora do modelo.

## Execução e corte
Releitura do HUB, contrato, issue #105, PR DRAFT #104, Controle Mestre #29 e seus comentários e PR #103. Eventos 19 e 20/11/2026. Leitura dos registros compartilhados de 18, 19, 20 e 30/10 antes desta avaliação. Os dois consolidados foram recuperados novamente do Drive, sem refazer coleta ou análise pré-jogo. Carimbo real em RESULTADO_QUALIDADE.json; a data no ID identifica esta missão, não um congelamento anterior aos eventos.

## Resultado verificado
120 células, dez jogos distintos. Replay determinístico de 100 sinais com linha: **100/100 liquidações coincidem, zero divergências**. Preservadas 13 SEM LINHA e sete abstenções. Nos 100 sinais: 79 acertos e 21 erros (79/100), somente descritivo documental. Não misturar com 18/11, 30/10, auditoria histórica de 1.078 sinais ou Shadow V1.

| Data | Células | Acertos | Erros | SEM LINHA | ABSTER | Taxa documental |
|---|---:|---:|---:|---:|---:|---:|
| 19/11 | 36 | 18 | 3 | 13 | 2 | 18/21 = 85,71% |
| 20/11 | 84 | 61 | 18 | 0 | 5 | 61/79 = 77,22% |

CSV/JSON CELULAS_RECONCILIADAS relacionam jogo_id Flashscore, mercado, período, linha, frequência, Elite original, resultado por equipe, URL, carimbo da coleta e hash do arquivo de análise. O campo auditoria_cell_id veio dos relatórios pós-jogo. **Não é ID nativo de previsão congelada.** A chave confronto/mercado/período e o SHA do arquivo original identificam a referência documental, sem inventar um novo PREJOGO ou alterar o anterior.

## Cobertura e fontes
240 valores individuais disponíveis: 232 observados e oito calculados. Vélez JC90 = 1T+2T, por equipe. A aba JOGO de 120 minutos não foi usada para liquidar. Seattle exclui os pênaltis. Aditividade e relação no gol <= finalizações foram rechecadas nos dados recuperados; em Vélez a aditividade é identidade de construção, não segunda fonte independente.

13 células de 19/11 continuam SEM LINHA por histórico incompleto, embora o resultado real seja conhecido. No esquema do contrato estão em N_D com motivo SEM_LINHA_ORIGINAL; isso não significa pendência de coleta do resultado. Elite original preservado: 19/11 5/5, 20/11 8/10; é subconjunto dos sinais, não motor independente ou aposta.

## Teste de melhoria temporal: bloqueado, não executado
Os dois lotes declaram auditoria documental condicionada. O arquivo de 20/11 declara reprodução de regras sem executar TypeScript original; 19/11 não comprova snapshot nativo autenticado. Persistência no Drive anterior ao horário publicado não resolve a falta. Neste recorte, **zero sinais admitidos como teste prospectivo homologado**. Não foram definidos treino/teste retrospectivos para fabricar validação, nem escolhidos limiares pelos vencedores.

MAE, viés, melhora/piora de candidato e retorno financeiro ficam N/D. O teste 100/100 acima só confere aritmética da liquidação, sem demonstrar qualidade preditiva ou ganho financeiro.

## Achados para hipótese futura, sem promoção
1. No dia 20, chutes no gol tiveram 12/20 acertos, abaixo de finalizações 18/21; amostra pequena e sinais dependentes por jogo. Testar previamente hipótese de menor robustez desse mercado, sem escolher retrospectivamente apenas o que ganhou.
2. Elite errou em Bayern gols 2T O0,5 e Molde finalizações 1T O12,5, ambos 9/10 históricos. Frequência não é probabilidade calibrada.
3. Oito erros do dia 20 ficaram a um evento do primeiro total vencedor. Linhas inferiores só poderão ser comparadas se ambas forem congeladas antes do jogo, com critérios previamente registrados; nenhum acerto alternativo foi atribuído agora.

## Handoff da issue #105
- Work: auditoria de fontes, amostra/cobertura e replay concluídos para 19/20; reconciliação por ID preenchida em arquivo novo. Teste temporal de melhoria continua pendente.
- Coleta: snapshots nativos e POSJOGO pareados, especialmente piloto 18/11; conferir recorte excluído de 30/10 e pendências de 21/11. Nenhum desses lotes foi reclassificado neste trabalho.
- Análise: ler índice, últimos POSJOGO e ESTRATEGIAS (zero aprovadas) antes de novos sinais. Criar futuros PREJOGO com ID da partida, versão, linha, fonte e horário anterior ao início.
- Nenhuma estratégia promovida. Dados pessoais, base 5.620, LV4/Elite, Radar V2/V3/V4, snapshots, Controle #29, main, Android e produção preservados. Sem merge/deploy.

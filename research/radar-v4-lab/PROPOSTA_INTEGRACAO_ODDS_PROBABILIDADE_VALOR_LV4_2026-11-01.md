# FutStats IA — Laboratório V4 — Protocolo experimental de odds e preço justo
Data de registro: 2026-11-01. Estado: PROPOSTA / NÃO IMPLEMENTADA, apenas estudo. Nenhuma ordem ou aposta automatizada.

## Intenção registrada
A pessoa usuária relata que conseguiu visualizar odds reais e realizou algumas apostas pequenas na Stake. Quer que cada hipótese LV4 apresente histórico, estimativa de probabilidade, odd cotada, odd mínima para eventual valor matemático, e comparação entre mercado, linha, período e liga. As apostas existentes serão auditadas individualmente quando trouxer os comprovantes.

## Restrição matemática e conceitual
- O algoritmo atual `src/radarV4LabToday.ts` seleciona maior linha Over com frequência histórica >=70%, usando até 10 confrontos únicos de histórico; comentários do próprio código esclarecem que isso **não é probabilidade calibrada nem recomendação de apostas**.
- **Exemplo 8/10**: é 80% de frequência retrospectiva nesse recorte; **NÃO** autoriza afirmar p=80% de sucesso prospectivo e **NÃO** autoriza definir odd mínima como 1,25.
- Odds decimais: probabilidade implícita de equilíbrio = 1/odd; odd justa hipotética = 1/p, somente quando p for prospectiva, calibrada e estimada sem vazamento de informações futuras.
- Valor esperado hipotético com stake unitária = p × odd − 1. Exemplo hipotético p calibrada 0,70 e odd 1,55: EV +8,5%; se p verdadeiro fosse 0,60, EV seria −7%. Modelo e margem de erro importam mais que o sinal bruto.
- Sem evidência suficiente de calibração/intervalo de incerteza: **probabilidade calibrada = N/D, odd mínima defensável = N/D, status = OBSERVAÇÃO/SEM APOSTA INDICADA**. A plataforma pode exibir odds de mercado e frequência sem calcular valor esperado falso.

## Campos de dados prospectivos
Chave de correspondência: data+competição+mandante+visitante+mercado+período+direção Over/Under+linha EXATA, além de ID único Flashscore quando disponível.
- `n_historico`, `acertos_historicos`, `frequencia_historica`: exposição descritiva da base LV4, sem chamar de chance.
- `probabilidade_calibrada`, `metodo_calibracao`, `amostra_calibracao`, `intervalo_incerteza`, `validacao_fora_da_amostra`: N/D até evidência real.
- `odd_pre_jogo`, `operadora`, `capturada_em_brt`, `fonte_cotacao`, `mercado_cotado_exato`: anotar antes do início; não reutilizar odds live como pré-jogo.
- `prob_implicita`, `odd_justa_teorica`, `odd_minima_com_margem`, `ev_estimado`, `status_preco`: calcular somente quando houver p calibrada + cotação válida para linha idêntica.
- `stake_real`, `aposta_simples_ou_multipla`, `status_bilhete`, `retorno_real`, `lucro_prejuizo`, `roi_real`: auditados em cada bilhete com captura do usuário; não atribuir retornos a hipóteses que não foram apostadas.
- `resultado_futebol_validado`, `periodo_1_total`, `periodo_2_total`, `fonte_estatistica`: fonte Flashscore por telas ou verificações cruzadas.

## Interface experimental desejada (exemplo de layout, sem previsão)
| Competição/Jogo | Mercado/período/linha | Histórico LV4 | Prob. calibrada | Odd disponível | Prob. implícita | Odd mínima | Status |
|---|---|---|---|---|---|---|---|
| Ilustrativo | Finalizações / FT / Over 22,5 | 8/10 (80% histórico) | N/D | 1,40 (exemplo) | 71,43% | N/D | Sem prob. validada |

## Protocolo de coleta e teste
1. Congelar hipótese/linha/mercado/tempo, ID do confronto e o timestamp antes de ver resultado.
2. Capturar a odd pré-jogo para a MESMA LINHA e período, com comprovante da data/hora. Registrar mudança de odds separadamente, se relevante.
3. Validar resultados após encerramento por equipe em FT/1T/2T, preservar N/D e divergências; conferir somas por tempo.
4. Medir acertos/erros prospectivos por linha exata, por campeonato e período, separando recortes de treinamento e validação, incluindo abstenções.
5. Estimar e auditar calibração apenas depois de amostra suficiente em várias datas (teste inicial >=30 partidas em >=5 datas, maior robustez a partir de ~100 partidas em >=10 datas; os sinais do mesmo jogo são correlacionados). Registrar incertezas e evitar selecionar apenas hipóteses vencedoras retrospectivamente.
6. Somente com calibração confiável calcular odd justa e faixa mínima exigida pelo usuário, sem gerar ordem ou apostar automaticamente.
7. Registrar bilhetes reais já apostados com seus comprovantes, preservando separação entre histórico LV4, simulação e operações reais.

## Integridade do projeto
- Sem mudanças em `src/radarV4LabToday.ts`, linhas congeladas de 31/10 e 01/11, produção, 659 jogos pessoais, Radar V2/V3, backups ou lógica principal de futebol.
- Não interpretar frequência histórica ou ROI hipotético como rentabilidade comprovada.
- Usuário mantém controle sobre apostas e valores; o laboratório não deve impor progressão, martingale nem aumento de stake.

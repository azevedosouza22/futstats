# FutStats IA — Protocolo diário de descoberta, auditoria e validação de padrões V4
> Protocolo de pesquisa do LV4; registro operacional no PR DRAFT #103. **Não muda algoritmo, recomenda apostas nem altera produção.**

## 1. Objetivo e prioridade
Após cada dia de jogos, registrar integralmente as decisões do V4 **congeladas antes do início de cada jogo**; confrontar resultados reais; procurar padrões conhecidos e incomuns; distinguir coincidência de vantagem reproduzível; e, quando existir **odd real verificada previamente**, avaliar ROI/valor esperado. Preservar as previsões originais, inclusive abstenções, atrasos e falhas, sem seleção só de partidas vencedoras.

O objetivo é melhorar **valor esperado/ROI fora da amostra**, controlando perdas e incertezas — não maximizar taxa de acerto bruta. Não prometer lucro nem executar apostas.

## 2. Registro atômico obrigatório: uma linha por decisão do laboratório
**Identidade**: `date|competition|source_id|period|metric|scope|line|forecast_snapshot_commit`. A identidade do confronto deve ser inequívoca; se `source_id` faltar, usar chave composta documentada e marcar para revisão. Manter os 12 mercados existentes por partida (4 métricas × 3 períodos), inclusive abstidos. Para análises exploratórias de linhas alternativas, jamais as confundir com sinais originalmente emitidos.

Campos mínimos:
- `fixture_date`, `kickoff_brasilia` real e hora originalmente prevista, `kickoff_utc` com offset, `weekday` calculado em Brasília, indicador de fim de semana (sábado/domingo), `kickoff_hour_brasilia`, mês, temporada, competição, rodada, fase (regular/playoffs), mandante, visitante, ID Flashscore, URL e estado oficial (encerrado/adiado/não iniciado).
- `forecast_created_at`, commit/blob/URI da previsão, `period` (FT/1T/2T), `metric` (gols/finalizações/chutes no gol/escanteios), `line` **exata**, direção (Over), frequência histórica, n histórico e média, regra do modelo e versão.
- Resultado real **por equipe e período**, total, origem de cada leitura, horário da coleta, indicador de inconsistência/controvérsia, `decision` (ACERTO/ERRO/SEM_SINAL/N_D/PENDENTE).
- **Odds opcionais**: cotação decimal *exata para o mesmo período + mercado + linha + direção*, casa, fonte, captura com timestamp comprovadamente anterior ao kickoff, status de verificação; movimentação de odd pré-jogo quando observável. Odds posteriores ou sem captura anterior = **N/D**, nunca "reais".
- Descritores pré-jogo adicionais *se disponíveis*: casa/fora, faixa de média histórica, número de jogos elegíveis, descanso em dias, viagens, posição de tabela anterior, forma recente, rodada do campeonato, se é derby, diferença de força pregame. Descritores pós-jogo (cartão vermelho, clima observado, escalação final) são somente **diagnóstico de erros**, nunca features retroativamente consideradas disponíveis na previsão.
- `stake_hypothetical`, `p_calibrada` quando existir, proveniência da calibração, ROI hipotético e ROI real **somente para odds reais verificadas**. Campo desconhecido = N/D, não zero.

Usar timezone `America/Sao_Paulo` para comparação entre dias/horários. Diferenciar dia local da liga e dia de Brasília quando houver virada de data.

## 3. Segmentações a cruzar
**Obrigatórias em cada fechamento:** geral; dia; liga/temporada; fase; mercado; período; linha exata; mercado × período; liga × período; liga × mercado; mercado × período × linha; dia da semana; meio de semana (segunda–sexta) × fim de semana (sábado/domingo); faixa horária em Brasília (hora cheia e blocos de 3 horas); mandante/visitante (da perspectiva de gols/estatísticas e mando); histórico 7/10, 8/10, 9/10, 10/10; faixa de odd; intervalo de data; amostra de jogos únicos.

**Exploratórias, sem omitir achados contrários:** liga × mercado × período × linha; campeonato × dia de semana × faixa de horário; rodada/fase × período; horário × mercado; diferença de médias pré-jogo × linha; força de mandante/visitante × período; perfil de adversários; feriados; viagem/descanso/derby quando tenham evidência prospectiva; mudança de tendência por mês; sequência de perdas e dias sem sinais. **Nunca gerar condição ou variável sem fonte**.

Separar número de sinais e número de partidas únicas. Todos os mercados do mesmo jogo compartilham fatores e NÃO constituem observações independentes.

## 4. Contagem, lucro e auditoria
- `ACERTO` quando o valor total real é **estritamente maior** que a linha congelada; `ERRO` quando é menor ou igual com dado verificável.
- `SEM_SINAL` = abstenção original; `N/D` = resultado não confiável ou estatística ausente; `PENDENTE` = jogo não encerrado. Nenhum dos três entra no denominador de acerto.
- `taxa_acerto = acertos / (acertos + erros)` e publicar **sempre** `n sinais, n jogos únicos, n datas`.
- Simulação fixa 1,50: stake R$ 2 por sinal resolvido; lucro `acertos × 1 − erros × 2` reais, ROI sobre total investido. Empate: `1 / 1,50 = 66,67%`. Rotular SEMPRE "hipótese, não cotação oferecida".
- ROI realizado com odds comprovadamente pré-jogo: lucro `Σ stake×(odd−1)` por acerto menos `Σ stake` por erro; denominar exclusivamente os sinais com odds verificadas, informar cobertura (%) e excluir seleções sem preço. Sem odd comprovada, **nenhum ROI real**.
- Sem calibragem prospectiva, não preencher `p_calibrada`; `7/10` histórico não significa 70% de chance futura. EV só com `p_calibrada` e odd verdadeira do mesmo mercado.
- Comparar **resultados diários**, acumulado histórico, janelas móveis (7/30 dias) e validação prospectiva futura. Distinguir mudança verdadeira de ruído com intervalos de incerteza e análise por partidas/dias como clusters.

## 5. Teste rigoroso de padrões aparentemente estranhos
O LV4 pode testar hipóteses pouco óbvias, mas é fácil obter "90%" por acaso se forem exploradas centenas de combinações. Regras:
1. Cada segmento mostrar `acertos / avaliados`, jogos distintos, datas distintas, cobertura de odds, ROI e tamanho de amostra; ordenar por evidência e não só por porcentagem.
2. **Menos de 30 jogos distintos ou 5 datas**: rótulo `EXPLORATÓRIO` — nunca recomendar estratégia.
3. **Pelo menos 30 jogos em 5 datas**: `AMOSTRA INICIAL`, ainda sem validação. É um critério operacional mínimo, **não** garantia estatística.
4. **Candidato para validação**: protocolo e filtros escritos/congelados ANTES dos resultados futuros, em dados diferentes dos usados para encontrar o padrão. Mínimo operacional sugerido: 100 jogos futuros / 10 datas, preferindo múltiplas rodadas e competições; confirmar estabilidade, incerteza e odds reais, contabilizando comparação de múltiplas hipóteses. Esse número não é limiar de significância universal.
5. **Não** tratar cada uma das 12 decisões do mesmo jogo como amostra independente; usar validação fora do período de descoberta, agregação em blocos de jogo/dia (bootstrap por cluster quando factível), controle de múltiplas comparações e comparação com seleção ingênua/baseline.
6. Nunca criar regras pós-jogo e descrevê-las como pré-jogo. Descobertas novas só contam como **hipótese** até testadas prospectivamente.
7. Analisar também **abstenções** e jogos de desempenho adverso; não esconder 0/4, prorrogações, dias sem dados, empates ou ligas remarcadas.
8. Evitar `all-in`, martingale, dobrar stake após perdas, e escolhas simultâneas correlacionadas como se fossem entradas independentes.

## 6. Relatório diário padrão (um fechamento)
1. Identificação: data de Brasília; hora e fonte da apuração; jogos programados, confirmados, encerrados, adiados, pendentes, N/D.
2. **Painel**: 12 mercados × jogo/1T/2T; acertos, erros, abstenções, pendências, n jogos, taxa e discrepâncias.
3. **Ranking por liga, mercado, período, linha, dia de semana, faixa horária e cruzamentos**, sempre com n e status EXPLORATÓRIO/AMOSTRA INICIAL/VALIDADO PROSPECTIVAMENTE (este último só com teste futuro real).
4. **Padrões improváveis**: hipóteses descobertas, contraexemplos e o que precisa acontecer em jogos futuros para confirmá-las.
5. **Financeiro**: separadamente aposta simulada odd fixa 1,50 e apostas que teriam cotação real verificável; EV apenas quando calibrado, ROI, pior sequência, drawdown, cobertura de preços e sensibilidade à odd.
6. **Mudança frente a dias anteriores**: tendência por período/mercado, sem comparar mercados com diferentes dificuldades de linha como se fossem equivalentes.
7. **Erros/diagnóstico**: fontes divergentes, mudanças de hora, retrospecto desbalanceado por adversários, cartões vermelhos pós-jogo apenas como explicação descritiva.
8. **Próximo lote e hipóteses prospectivas**: predefinir filtros para o dia seguinte, congelar antes do início, não editar linhas do dia concluído.

Arquivos de saída por data: `LV4_YYYY-MM-DD_auditoria_atômica.csv`, `LV4_YYYY-MM-DD_relatorio.md`, `LV4_YYYY-MM-DD_segmentos.csv`, `LV4_YYYY-MM-DD_hipoteses.json`, `LV4_YYYY-MM-DD_odds_validas.csv`, `LV4_YYYY-MM-DD_checkpoint.json` e ZIP. Salvar em **Google Drive/FutStats/Testes** quando o Work tiver acesso, sem sobrescrever originais.

## 7. Situação de partida e primeiro objetivo
- **30/10:** 9 jogos, 71 acertos, 22 erros, 15 abstenções = 76,3% dos 93 sinais (amostra inicial, não lucro comprovado).
- **31/10 às 15h, segundo relatório do Work fornecido pelo usuário:** 17/30 jogos completos, 128/188 acertos, 60 erros, 32 abstenções previstas no total, 140 sinais pendentes, 2º tempo 76,47%, gols 73,33%, chutes no gol 59,57%, simulação odd 1,50 de +R$8 — **PARCIAL**, não misturar com auditoria final.
- Prioridade: recuperar ZIP e CSV/JSON completos em Drive; conferir 17 jogos, retomar apenas os 13 pendentes; verificar remarcações de Lyon × Angers para 01/11 e Lorient × Brest para 02/11, sem fingir que ocorreram 31/10; fechar 360 decisões (328 sinais, 32 abstenções originais) com status exatos.
- Primeira hipótese a testar: `Gols no segundo tempo` versus `Gols 1T`, estratificada por linha e competição; distinguir acerto de valor de odd.

## 8. Segurança e limites
Somente ambiente experimental do PR #103. Sem modificar produção, sem merge, sem mexer em 659 partidas pessoais, Radar V2/V3, previsões prospectivas congeladas, históricos originais ou backups. Não construir feed pago nem contornar bloqueios. Relatório automatizado sem dados suficientes deverá dizer **INCOMPLETO — retomada necessária**, nunca preencher resultados inexistentes.

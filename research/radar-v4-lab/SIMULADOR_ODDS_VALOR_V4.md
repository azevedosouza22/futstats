# Radar V4 — simulador experimental de odds e valor esperado

## Objetivo
Responder: **dada a odd oferecida para exatamente a linha Over exibida pelo V4, a cotação seria matematicamente vantajosa sob uma probabilidade de acerto independente e validada?**

Primeira entrega no PR DRAFT #103: botão **Simular odd** por mercado e período, em todos os jogos V4 com uma linha emitida. Sem sinal, não há avaliação. Não envia apostas, não lê cotações sem fonte e não altera outros dados.

## Versão implementada (fase 1 — calculadora, não recomendação automática)
- O usuário digita **odd decimal**, **probabilidade estimada em %**, **stake R$** (R$ 2 de exemplo).
- A probabilidade nunca é preenchida automaticamente a partir do histórico V4, porque 7/10 acertos históricos **não** é uma probabilidade futura calibrada.
- Campos em branco geram explicação e não disfarçam N/D como 0%.
- O app mostra limiar de empate, vantagem em pontos percentuais, ROI esperado, lucro esperado, retorno se acertar e perda se errar.
- Um EV positivo aparece como **“Valor teórico positivo”**, sem recomendação “APOSTE” ou promessa de lucro. Apenas cenário hipotético.
- Para datas retrospectivas como 30/10, odd digitada depois do jogo **não prova** qual cotação estava disponível antes do confronto.
- Os valores digitados ficam só no estado temporário da página; sem escrita em previsões congeladas, V2/V3, histórico, backups ou produção.

## Fórmulas (mercado binário, decimal, sem impostos/comissões)
- Probabilidade mínima de equilíbrio: `1/odd`.
- Edge em pontos percentuais: `p - (1/odd)`.
- ROI esperado: `p × odd - 1`.
- Lucro esperado por aposta: `stake × (p × odd - 1)`.
- Retorno bruto se acertar: `stake × odd`, lucro no acerto: `stake × (odd - 1)`.
- Perda se errar: `-stake`.

Exemplo: `odd=1,50; p estimado=70%; stake=R$2`. Empate exige 66,67%; edge +3,33 p.p.; ROI hipotético +5%; lucro médio **hipotético** R$0,10. Essa probabilidade não foi fornecida nem certificada pelo V4.

## Fase 2 (ainda NÃO implementada)
1. Construir amostra **prospectiva**, com previsão original congelada, linha exata, horário, odd real e fonte oferecida antes da partida (sem inventar).
2. Auditar gols, finalizações, chutes no gol, escanteios por FT/1T/2T e por campeonato e ajustar probabilidades com calibração temporal fora da amostra (ex.: curvas de confiabilidade, Brier score, log loss).
3. Só depois associar uma **probabilidade calibrada e sua incerteza** às linhas. Se ausente ou insuficiente: “Valor ainda não avaliável”.
4. Quando existir evidência adequada: calcular EV com odd real da mesma linha e comparar com limiar de segurança; expor a fonte e limites. Evitar múltiplos mercados do mesmo jogo como amostras independentes e não recomendar apostar só porque o EV pontual é positivo.
5. Validar estratégias de stake, ROI realmente realizado e drawdown em meses diferentes **antes** de considerar qualquer indicação prática.

## QA
Teste unitário `src/radarV4OddsValue.test.ts`: cálculos exatos e casos inválidos.
Teste de navegação `e2e/radar-v4-laboratorio.spec.ts`: abrir registro da manhã, simular odd 1,50, exigir p informado, valor positivo com p=70% e negativo com odd 1,30.
Build CI inclui a nova suíte.

## Segurança
Somente ramo experimental do PR #103; manter PR DRAFT; não mesclar nem mexer em `main`, previsões V4 já congeladas, Radar V2/V3, 659 partidas pessoais, backup, produção e bancos de dados do usuário.

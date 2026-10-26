# FutStats IA — Etapa 56: quatro indicadores × três períodos (matriz histórica)

**25/10/2026, Brasília. Implementação exclusivamente experimental em PR filho do #55. Não alterar main, Vercel ou o app instalado.**

## Problema identificado
O Radar de jogos futuros já apresentava frequências/linhas históricas e sinais V2/V3. No entanto, os quatro indicadores — gols, finalizações, chutes no alvo e escanteios — nem sempre tinham números completos no jogo todo, 1º tempo e 2º tempo. Em especial, alguns CSVs têm o total do jogo sem informações dos tempos; exibir uma média geral sem sua amostra por período poderia induzir à interpretação incorreta de que todos os períodos estavam disponíveis.

## Solução de UX
Dentro de **Agenda → escolher confronto → Radar para jogo futuro**, o cartão de prévia ganhou uma área recolhível **“Conferir 4 indicadores por período”**. Ela mostra **12 células (4×3)** com:
- indicador, incluindo escanteios;
- jogo completo, 1º tempo e 2º tempo, lado a lado;
- média histórica do **total das duas equipes em cada partida**, com amostra válida **n/N**;
- campos incompletos explicitamente **N/D** em vez de zero;
- quantidade de registros contraditórios por métrica/tempo, sem mutar ou “consertar” dados originais.

A tela mostra quantos jogos históricos distintos têm todos os 12 campos completos. A tabela tem rolagem horizontal **dentro do quadro**, sem alargar o documento Android de 320px. A prévia permanece informativa, não é sinal adicional, odd, recomendação, probabilidade nem resultado real.

## Critérios de integridade
- Seleção é a **mesma amostra de `radarUpcoming`**: cinco partidas anteriores por equipe na mesma competição e temporada. Partidas atuais/posteriores e partidas de outras ligas não entram.
- Deduplicar por ID para não contar um confronto entre os dois times duas vezes. Um `research.dateDiscrepancy` conhecido é excluído da matriz; partidas com datas futuras ou partidas externas não encerradas não são elegíveis.
- Dados completos exigem **mandante e visitante** no período. Um lado ausente torna a célula desse jogo indisponível; não se preenche a lacuna com a média ou com zero.
- Se existem full/1T/2T para um indicador e a soma dos tempos diverge do total, descartar **somente esse indicador** para o jogo nos três períodos, marcando conflito, sem mexer no CSV ou contornar validação original.
- O zero informado é valor legítimo. O cálculo da média usa apenas jogos válidos para aquela célula.
- **Não reescreve, complementa ou reconstrói previsões já salvas**, preservando congelamento V2/V3 e amostras originais. Não importa CSV, não acessa fontes externas ou realiza coleta contínua.

## Testes
- Vitest com 12 células vazias → N/D, deduplicação cross-teams, exclusão por data/temporada, zero válido, total FT conhecido com 1T/2T N/D, lado ausente, conflito de soma (exclusão métrica) e histórico imutável.
- E2E desktop e viewport Android: criar histórico sintético de 10 partidas, deixar escanteios do 1º tempo de um jogo indisponíveis, abrir a agenda oficial, conferir matriz **9/10 jogos completamente cobertos** e **9/10 válidos para escanteios**, verificar que não houve gravação local, salvar previsão, recuperar a mesma previsão congelada e verificar ausência de overflow horizontal.
- **Dados sintéticos não são jogos reais, 0/30 resultados externamente autenticados permanece inalterado.** O teste físico do Android e a integração final aguardam etapa específica e autorização.

## Entregas
`src/radarPeriodCoverage.ts`, `src/RadarPeriodCoveragePanel.tsx`, integração em `src/UpcomingRadar.tsx`, estilos, testes Vitest/Playwright e pacote CI. Documentação registrada para continuidade no Controle Mestre #29 após CI verde.

**Próxima ação prevista:** melhorar os indicadores dos tempos sem inventar dados, consolidar QA de prévias e planejar testes reais quando possível, sem alterar produção ou histórico.

# FutStats — Radar V4: agenda de dia completo e relatório pré-jogo persistente

**Desenvolvimento experimental PR DRAFT #103. Não integrar com produção, Radar V2/V3, backups pessoais ou As Boas do Dia.**

## O problema descoberto em 30/10/2026

O chat analisou dez confrontos em seis ligas às 05h55 (Brasília), gerando 105 sinais e 15 abstenções sobre 120 mercados. À noite, o app não mostrava a mesma lista: o calendário principal removia confrontos iniciados/encerrados, não havia leitura do arquivo original congelado, e alguns feeds livres omitiam jogos com resultados publicados.

## Novo fluxo

1. **Consultar hoje:** o app monta a lista de jogos da data de Brasília, **sem excluir quem já começou**, respeitando fontes e datas. Prioriza fontes oficiais cadastradas, depois agenda CSV do usuário (leitura) e por fim candidatos comunitários gratuitos. Evita duplicatas em competições/temporadas correspondentes. Exibe origem, falta de cobertura, equipes não reconhecidas e histórico insuficiente, sem inventar jogos.
2. **Analisar:** cada partida encontrada é avaliada pelo mesmo núcleo de laboratório V4, utilizando os últimos cinco jogos *anteriores ao dia* de cada clube na mesma competição/temporada; no mínimo oito IDs distintos. Para partida completa, 1T e 2T, verifica finalizações, escanteios, chutes no gol e gols. Seleciona **a maior linha Over previamente definida com frequência >=70%**; do contrário, **Sem sinal**.
3. **Consulta à noite:** jogos não somem só porque começaram. Análises calculadas depois do início são identificadas como consulta experimental, **não um teste prospectivo registrado antes do jogo**. A possibilidade de salvar uma previsão continua bloqueada sem horário futuro e referência oficial recente. Referências desatualizadas não conservam horários confirmados.
4. **Histórico de 30/10:** ao abrir o Laboratório em 30/10, ou escolher a data em dia posterior, carrega o arquivo **imóvel e pré-jogo**, que foi salvo às 05h55 em `public/research/v4-lab/2026-10-30.json`. São **10 partidas, 105 sinais, 15 abstenções**, cada uma com 12 decisões, média, linha e IDs usados. Não recalcula nem altera o arquivo depois de conhecer placares.
5. **Comparar com a conversa:** teste automatizado `src/radarV4DailyArchive.test.ts` confronta as **120 linhas, frequências, médias e IDs de histórico** da previsão original com um recálculo sobre a base experimental de 3.260 partidas, sempre usando apenas históricos anteriores a 30/10/2026. Divergências provocam reprovação do teste e **não** substituem a previsão original.

## Fontes, limites e honestidade operacional

| Origem | Cobertura | Restrições |
| --- | --- | --- |
| Agenda oficial cadastrada | Jogos pontuais Brasileirão, Bundesliga, Premier, La Liga, Serie A e registros europeus | Manual, incompleta, pode estar desatualizada. Hora só é confirmada se referência recente e jogo futuro |
| CSV de agenda existente no aparelho | Jogos cadastrados pelo próprio usuário | Somente leitura; datas/horários não são validados novamente no fornecedor |
| OpenFootball sob demanda | Candidatos de Premier League, La Liga, Serie A italiana, Ligue 1 | Data pode estar no fuso de origem e mudar; partidas com placar também aparecem, sem considerar placar na análise; nunca autoriza salvar previsão |
| Arquivo pré-jogo de 30/10 | **Os dez confrontos efetivamente analisados no chat**, incluindo Portugal e Saudi Pro League | Registro histórico de data determinada, não prova cobertura automática de dias futuros |

**Ainda não existe feed diário universal** capaz de cobrir automaticamente Brasil, Alemanha, Portugal, Arábia Saudita e todas as demais ligas em qualquer data. Assim, o app **não deve anunciar cobertura completa** sem correspondentes verificações reais. A adição de provedores/arquivos diários futuros poderá ampliar isso em etapas, mantendo custos gratuitos sempre que possível.

## Segurança e testes

- `readOfficialCalendar()` do V2/V3 **não foi alterado**; o V4 tem uma leitura separada de dia inteiro.
- `researchDateBefore` impede que resultados da partida em análise ou da mesma data sejam usados como histórico. Nada acrescenta ou sobrescreve as 659 partidas originais, previsões V2/V3, backup, IndexedDB, histórico local ou dados da produção.
- Registros pré-jogo V4 só podem ser salvos prospectivamente pela função já existente de verificação oficial atual.
- Arquivo original de 30/10 continua preservado em `research/radar-v4-lab/PREVISOES_PROSPECTIVAS_2026-10-30.json` e no commit `f0274c218c2cca184f95059df2244098b953ee91`.
- As 120 decisões e amostras não são probabilidades calibradas nem prova de lucro sem odds reais.
- A homologação requer testes unitários, compilação, testes de interface no desktop/Android e verificação PWA offline. PR deve permanecer DRAFT até aprovação.

# FutStats IA — Etapa 42: diagnóstico de elegibilidade e três novas fontes CBF

**Data:** 25/10/2026 (Brasília). **Escopo:** PR experimental empilhado sobre #41; sem merge, deploy, importação, atividade em segundo plano, gravação de palpites nem qualquer alteração nos 659 históricos, Radar V2/V3, Work ou backups.

## Fontes oficiais verificadas de programação futura
No [portal oficial de credenciamento da CBF, lista de jogos da Série A 2026](https://credencial.cbf.com.br/competicoes/listar/42/1), conferido em 25/10/2026, constam:
- Fluminense × Internacional — 28/10, 19h30 de Brasília (22h30Z).
- RB Bragantino × Chapecoense — 28/10, 19h30 de Brasília (22h30Z).
- Remo × Botafogo — 28/10, 21h30 de Brasília (29/10, 00h30Z).

Fonte é **listagem de várias partidas**, não página individual nem serviço ao vivo. O link pode exigir autenticação para certas funções de credenciamento. Somente o host oficial exato `credencial.cbf.com.br` foi adicionado à allowlist HTTPS; não aceitar domínios parecidos.

A confirmação externa é somente dos horários **na data de consulta**, não da realização das partidas. De acordo com a política vigente, após dois dias, o horário passa a N/D; uma ligação para a URL não atualiza `verifiedAt`.

## Diagnóstico por campeonato de “As Boas do Dia”
A lista experimental mostra um detalhamento, por campeonato, de:
1. Confrontos oficiais futuros identificados.
2. Horários de referência que exigem reconferência (N/D, fonte vencida, fonte não aprovada).
3. Partidas programadas para data posterior (não contam como recomendação do dia).
4. Jogos de hoje com histórico anterior insuficiente.
5. Jogos de hoje com histórico suficiente, mas **sem sinal V2/V3 conservador**.
6. Jogos qualificados e a quantidade apresentada (limite de três).

Isso é uma **auditoria de elegibilidade**, não classificação de desempenho. Os números não são taxa de acerto, não produzem odds ou recomendações de aposta. Um encontro não é salvo automaticamente por aparecer na lista; exige clique expresso no Radar, hora oficial ainda válida e reconferência da seleção.

O relatório não altera estatísticas históricas, não mistura Work/Historico, não cria coorte fictícia e não grava dados no navegador. Mantém deduplicação por data/campeonato/equipes e prefere a origem elegível quando recebe duplicações.

## Critérios de aceitação
- Três jogos novos dentro do registro oficial, com fuso e data correta (inclusive Remo × Botafogo após meia-noite UTC).
- Consistência de data de origem, HTTPS autorizado e expiração de dois dias.
- Total de diagnósticos por liga sem confundir jogos posteriores, sem histórico e sinais ausentes com acertos/erros.
- Playwright verifica transparência da tabela com fonte vencida no Android/desktop e ausência de registros automáticos.
- GitHub Actions: Vitest, TypeScript/Vite e E2E. Testes são sintéticos e não validam um percentual real de desempenho. Resultado real prospectivo continua dependente de previsão efetivamente salva antes do jogo, fonte CSV documentada e comparação externa independente.

**Segurança operacional:** PR rascunho, sem alteração de GitHub main, PRs antigos, Vercel produção, dados originais, arquivos históricos, previsões anteriores ou resultados Work.

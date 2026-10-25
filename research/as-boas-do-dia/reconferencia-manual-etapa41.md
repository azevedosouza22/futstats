# FutStats IA — Etapa 41: fila de revisão de agenda oficial

**Status:** implementação experimental somente leitura, base PR #40. Referência de projeto 25/10/2026, 67% antes dos testes. Nenhum merge, deploy, importação, coleta contínua, gravação automática ou validação real de acertos.

## Experiência na agenda
- Mostra prioridade dentro da janela selecionada: primeiro fontes oficiais com data de conferência vencida, depois partidas com início nas próximas 48 horas e, finalmente, as demais partidas futuras.
- Exibe contadores de referências vencidas, jogos próximos e outras datas. Limita a visualização prioritária a seis partidas para preservar a navegação no Android, mas mantém todas as demais nos cartões abaixo.
- Cada item mostra times, dia, motivo da conferência e um link direto para a página oficial já cadastrada.
- **Abrir o link NÃO reconfirma o horário automaticamente.** Nenhum clique altera `verifiedAt`, `utcKickoff`, a tabela de partidas, o localStorage, Radar ou Work.
- Depois de dois dias do snapshot original, o app continua apresentando horário **N/D** e impede tratar esse jogo como indicação oficial de “As Boas do Dia”.
- Em caso de fonte offline, horário alterado ou conflito, não reaproveitar o horário antigo: obter atualização comprovada da autoridade e versionar o código experimental (ou ferramenta futura explicitamente auditada).

## Critério de rastreabilidade da coorte
- O próximo resultado a medir é uma indicação **realmente selecionada e salva antes do horário confirmado da partida** no Radar experimental, sem automação do registro.
- Histórico antigo, Work, dados sintéticos, previsão tardia e fonte vencida não entram na amostra prospectiva de “As Boas”.
- O painel de resultados mantém contadores e N/D por liga. CSV local documentado não comprova verificação externa da realidade.
- Para avaliar mudanças no modelo, requerer pelo menos 30 confrontos prospectivos distintos por liga e resultados conferidos externamente, com amostras, referências e incerteza. Nenhuma taxa de acerto real é atribuída nesta etapa.

## Testes e segurança
- Unidade: filtro de duplicatas, triagem por 48h, referência vencida, horário N/D e imutabilidade dos objetos de entrada.
- Playwright: fonte vencida aparece com link e NÃO vira previsão nem seleção “As Boas” nos layouts desktop e Android.
- GitHub Actions deve passar TypeScript/Vite, todos os testes unitários e E2E antes de atribuir novo ponto no Controle Mestre.
- Não tocar produção, GitHub main, PRs anteriores, 659 históricos, Radar original, Work, backups existentes ou importação de resultados.

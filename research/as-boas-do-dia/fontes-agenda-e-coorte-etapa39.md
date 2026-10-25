# FutStats IA — Etapa 39: agenda oficial ampliada e disposição da coorte prospectiva

**Checkpoint:** 25/10/2026 (Brasília). **Somente experimento em PR #39**, base PR #38. Sem merge, sem produção, sem importação, sem coleta contínua, sem tocar Histórico 659, Work ou previsões anteriores Radar.

## Fontes independentes conferidas manualmente
As referências abaixo foram consultadas em 25/10/2026. **São snapshots, não uma API em tempo real**. Jogos podem mudar de data/horário; a interface invalida o uso automático do horário após 2 dias da conferência e requer nova referência para o Radar. Somente jogos ainda futuros são exibidos.

### Brasileirão Série A — referências individuais CBF
- Atlético-MG × Cruzeiro — **29/10/2026 19h30 Brasília**: [CBF, jogo 326](https://www.cbf.com.br/futebol-brasileiro/jogos/campeonato-brasileiro/serie-a/2026/atletico-mineiro-x-cruzeiro/832216).
- Grêmio × Athletico-PR — **29/10/2026 21h30 Brasília**: [CBF, jogo 327](https://www.cbf.com.br/futebol-brasileiro/jogos/campeonato-brasileiro/serie-a/2026/gremio-x-athletico-paranaense/832217?view=escala-de-arbitros). Na base UTC, isso é **30/10 00h30Z**, sem trocar o dia local do evento.
- Corinthians × Mirassol — **30/10/2026 20h Brasília**: [CBF, jogo 324](https://www.cbf.com.br/futebol-brasileiro/jogos/campeonato-brasileiro/serie-a/2026/corinthians-x-mirassol/832214).

### Premier League — anúncio oficial de horários alterados
[Fonte Premier League, alterações de outubro/novembro](https://www.premierleague.com/en/news/4688862/fixture-amendments-for-premier-league-matches-in-october-and-november). Em 31/10/2026 e novembro o horário publicado é **GMT (Europe/London)**, diferente do BST que vigorou até 24/10:
- Chelsea × Manchester United — **31/10 12h30 GMT = 09h30 Brasília**
- Tottenham Hotspur × Crystal Palace — **31/10 17h30 GMT = 14h30 Brasília**
- Aston Villa × Fulham — **31/10 20h GMT = 17h Brasília**
- Liverpool × Arsenal — **01/11 16h30 GMT = 13h30 Brasília**
- Newcastle United × Everton — **02/11 20h GMT = 17h Brasília**

Partidas do mesmo fim de semana **sem horário específico publicado** no artigo não foram adicionadas como horário confirmado. Nenhuma partida acima é automaticamente uma indicação “As Boas do Dia”: a seleção ainda exige horário oficial recém-conferido, partida no dia, 5 jogos anteriores por equipe, ao menos 8 observações do indicador, 10 da liga e sinais V2/V3 concordantes.

## Controle da coorte
- O painel experimental agora separa por liga todos os registros explicitamente atribuídos a “As Boas”: **jogo futuro**, **aguardando resultado**, **fonte do resultado pendente**, **excluídos por integridade/atraso/ambiguidade**, e **resultado com origem CSV documentada**.
- Essas categorias somam os registros atribuídos; não converter pendentes, N/D, duplicatas ou excluídos em acertos e não misturar os registros gerais Radar nem Work.
- Fonte CSV local validada estruturalmente **não significa verificação externa do resultado**. Mesmo 30 jogos com CSV não tornam automaticamente uma liga elegível para ajuste: exigem-se pelo menos **30 confrontos prospectivos distintos com resultados conferidos independentemente nas fontes**, em várias datas, e avaliação de viés/variância.
- Não há armazenamento adicional de dados, agendamento de coleta, webhook, extração automática, apostas, odds ou ação no calendário do dispositivo. O registro continua explícito no Radar.

## Critérios de aceitação
- Executar **testes unitários/compilação** e **fluxos Playwright desktop e viewport Android** no GitHub Actions.
- Confirmar a conversão GMT→Brasília e a virada UTC de um jogo CBF, casos expirados com horário N/D, restrições HTTPS por provedor, ausência de vazamento dos cadastros originais e inclusão de todas as categorias de coorte.
- Manter o PR em rascunho; não promover qualquer alteração em produção sem autorização explícita.

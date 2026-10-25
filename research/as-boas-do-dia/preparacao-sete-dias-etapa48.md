# FutStats IA — Etapa 48 · preparar oportunidades dos próximos 7 dias

**Data:** 25/10/2026. Implementação experimental filha do PR #47. Sem merge, deploy, atualização automática do calendário, acesso ao navegador pessoal, importação de partidas ou mudança na produção.

## Resultado prático
Dentro de “As Boas do Dia”, a nova seção recolhível **“Preparar próximos 7 dias”** mostra a possibilidade de consulta antecipada de jogos já cadastrados na agenda oficial. Permite distinguir:
- **Prévia possível** — horário com referência oficial datada ainda recente (validade até 2 dias), origem HTTPS em domínio autorizado, jogo futuro de amanhã até o sétimo dia e pelo menos 5 partidas anteriores de **ambas as equipes na mesma liga**. Um botão **“Abrir prévia no Radar (sem indicação)”** leva ao Radar comum. Não cria “Boa” antecipada.
- **Histórico insuficiente** — falta equipe identificada ou pelo menos 5 jogos anteriores para qualquer equipe no período; não liberar o atalho rápido.
- **Fonte ou horário a reconfirmar** — referência vencida ou horário N/D, URL oficial inválida, data de verificação antiga; sem usar o horário e sem renovar `verifiedAt`.
- **Horário divergente** — duas referências igualmente recentes indicam horas diferentes para o mesmo confronto. Bloqueia prévia até confirmação externa de fato.

As prioridades aparecem no começo da lista. A UI exibe os seis primeiros registros e o total completo de cada situação, com os nomes, datas, ligas e links originais somente quando estruturalmente HTTPS oficial. A agenda “7 dias” continua mostrando demais jogos. O app não busca nem inventa jogos ou resultados, nem apresenta probabilidades, odds ou acertos.

## Fronteira para As Boas
**As Boas do Dia continua restrita a jogos do próprio dia**, fonte oficial recente, análise pré-jogo congelável com V2/V3 convergentes, distância mínima de 15%, amostra por indicador e liga suficiente. Esta fila é somente logística para priorizar pesquisa e escolher futuras análises genéricas.

Mesmo se o usuário clicar em **Abrir prévia no Radar (sem indicação)** e salvar uma previsão futura genérica, o registro **não contém `goodPicks`**, logo não recebe retroativamente a identidade da lista “As Boas”. Uma prévia não atesta que o horário permanecerá o mesmo até a partida.

## Regras de implementação
- `src/dailyGoodNextWeek.ts` recebe **somente** o registro oficial já carregado e o histórico principal. Não mistura Work nem consulta provedores, não faz polling e não grava estado.
- Filtra **exclusivamente amanhã a hoje +7 dias** em Brasília; datas de hoje continuam com a lista normal. Deduplicação por data/liga/clubes usando somente aliases explícitos de equipe por campeonato.
- Registros recentes de **mesma identidade e horários contraditórios** bloqueiam a abertura, sem escolher arbitrariamente uma fonte. Links HTTPS e cronologia da conferência são checados estruturalmente; isso **não verifica a página na internet**.
- A amostra de 5 jogos por time apenas libera consulta da prévia, **não implica capacidade preditiva** nem emite sinais Over/Under. O Radar completo mantém suas próprias condições para salvar.
- Sem merge/deploy/extração contínua ou alterações em 659 históricos, Radar V2/V3, Work e backups.

## Aceitação
- Unitários abrangem janela de 7 dias, limites, 5 jogos de cada lado, ligas, deduplicação via alias, URL impostora, fonte vencida, horário N/D, conflito oficial, preservação dos objetos e ausência de valores/sinais fabricados.
- Playwright (desktop e viewport Android sintéticos) percorre seção da prévia, confirma um confronto com histórico, abre o Radar e registra só **previsão genérica**, sem atribuir `goodPicks`. A validação por dispositivo Android físico segue pendente.
- Nenhuma partida real nova ou previsão validada externamente é criada por este trabalho.

**Próxima etapa sugerida:** reconciliar prévias e agenda com um fluxo seguro de rechecagem de fontes reais, mantendo N/D e medindo elegibilidade/qualidade ao longo de uma coorte prospectiva concreta.

# FutStats IA — Etapa 65: divergência de horários oficiais bloqueia “As Boas do Dia”

**Data:** 26/10/2026, Brasília · PR DRAFT empilhado sobre #64; sem merge, deploy, importação ou coleta contínua.

## Falha corrigida
O planejador de sete dias (`nextGoodPreparationQueue`) **já recusava** duas referências oficiais recentes com horários diferentes para o mesmo confronto. Mas o filtro **do próprio dia** (`selectDailyGoodSignals`) simplesmente escolhia a primeira referência elegível e descartava as demais, mesmo quando uma outra fonte oficial também vigente apresentava horário diferente. Com histórico suficiente, isso podia gerar uma indicação de “As Boas” com hora contestada.

## Nova regra conservadora
- Para cada confronto do dia, agrupar referências por **data, competição/temporada e identidade explícita dos clubes**. Os aliases são restritos à competição cadastrada, sem nomes aproximados.
- Considerar como fonte de possível conflito apenas um `OfficialCalendarItem` com **`fresh=true`, `verifiedAt` real dentro da janela de 2 dias, URL HTTPS com hostname exato autorizado e hora sintaticamente válida**.
- Se duas ou mais dessas referências mostram horários distintos, marcar **`conflictingKickoff`** e **`needsRecheck`** por liga e **NÃO emitir nenhuma indicação nem abrir atribuição ao Radar como “Boa” para o confronto**. Isso vale mesmo se um dos horários já tiver passado no dia.
- Apresentar no diagnóstico um contador **“Horários divergentes”**, confronto bloqueado, `horário N/D`, horários meramente *informados*, datas das referências e links originais para reconferência. Mostrar ambos não significa escolher nenhum como correto.
- Duas fontes legítimas com o **mesmo horário** continuam sendo uma só indicação; escolher somente a data de conferência mais recente sem alterar o `verifiedAt` de origem.
- Uma referência velha, com hora ausente ou URL de phishing **não cria conflito falso** contra uma referência genuinamente vigente. Referências de outros dias, ligas ou temporadas não são fundidas.
- Nada é revalidado por abrir link. Não há scraping, atualização automática, IA treinada ou medição de taxa de acerto. Sinais V2/V3 e previsões já congeladas não são modificados nem removidos.

## Aceite
- Vitest: duas fontes atuais/horas diferentes → nenhuma indicação, um conflito e uma exigência de revisão; ordem das fontes invertida; fonte já passada versus outra futura; fonte expirada/phishing ignorada na disputa; horas iguais → uma indicação com timestamp genuinamente mais recente; aliases FC Barcelona/Barcelona e Real Madrid CF/Real Madrid na própria La Liga; ligas/temporadas distintas; entradas e histórico imutáveis.
- Playwright desktop e viewport Android: o diagnóstico mostra coluna de conflito, um jogo sem choque permanece selecionável e toda jornada **As Boas → Radar → salvar → recuperar** continua funcionando com registro original intacto.
- Histórico validado na branch de referência #64: 306 testes unitários + 50 Playwright. Não se atribui nenhuma previsão de futebol real a dados sintéticos do CI. Testes físicos no Android seguem pendentes.

## Segurança e continuidade
Todo código novo é somente leitura sobre a agenda, histórico e registros. A produção, os 659 históricos reais, Radar V2/V3, Work e backups ficam intactos. Último checkpoint validado antes deste PR era **91/100**; avançar somente se os testes completos ficarem verdes no HEAD final.

**Próxima ação após o CI:** fortalecer a análise por mando ou a revisão real de fontes/Android, mantendo o restante do plano dependente de comprovação concreta de resultados prospectivos externos e autorização para integração.

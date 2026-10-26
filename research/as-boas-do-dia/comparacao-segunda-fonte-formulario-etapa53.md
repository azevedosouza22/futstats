# FutStats IA · Etapa 53 — Comparação de segunda fonte sem preencher JSON

**25 de outubro de 2026. Implementação experimental**, branch filha da Etapa 52, sem merge, deploy, coleta contínua, importação ou alteração na produção.

## Problema prático
A comparação documental da Etapa 45 exigia baixar um JSON-modelo, preencher campos manualmente e reenviá-lo. Isso era pouco acessível num celular e aumentava a chance de erro de sintaxe.

## Novo percurso no próprio Radar
Em **Ver previsões já registradas → Validação de “As Boas do Dia” → Comparação documental de segunda fonte**, quando houver pelo menos uma indicação explicitamente salva antes do jogo com resultado CSV local elegível:
1. Abra **Comparar segunda fonte diretamente · sem arquivo JSON**.
2. Selecione o jogo salvo entre os que têm resultado CSV local atribuível.
3. Informe a URL **HTTPS de uma página de resultado de Sofascore, ESPN ou FotMob** que realmente tenha consultado, e a **data e hora em Brasília** em que ocorreu essa consulta. O horário é explicitamente informado pelo usuário: o app não atribui `now` automaticamente como prova de acesso. O app converte apenas o horário informado para UTC para usar o mesmo validador que já havia.
4. Transcreva somente os indicadores existentes na previsão congelada com resultado CSV disponível. Valores desconhecidos ficam **vazios = N/D**, sem copiar números do CSV local; zero é aceito quando efetivamente informado.
5. Confirme que fez a transcrição de uma página consultada e clique **Comparar números informados (sem verificar site)**.
6. A tabela existente de comparação exibirá **COINCIDE/DIVERGE/N/D** e o aviso **DOCUMENTAÇÃO INFORMADA — NÃO VERIFICADA NA WEB**. Se útil, o dossiê documental JSON com SHA-256 pode ser exportado sem depender da edição de JSON. Alterar qualquer campo limpa o resultado anterior e a possibilidade de exportar um dossiê desatualizado.

A via anterior de **carregar JSON documental** é preservada integralmente; backups e localStorage das previsões não são modificados.

## Travas e limites
- `src/dailyGoodQuickEvidence.ts` usa **exatamente** `parseDocumentaryEvidence` e `reconcileDocumentaryEvidence` das etapas anteriores: exigência de URL HTTPS em domínios estritos, fonte diferente da origem do CSV Flashscore, documento cronologicamente posterior ao jogo +120 minutos e nunca no futuro, identidade exata de jogo e campeonato, indicadores congelados e no máximo três entradas, inteiros não negativos.
- `src/DailyGoodQuickEvidenceForm.tsx` não preenche estatísticas, não abre sites nem simula acesso ao conteúdo remoto. A pessoa informa explicitamente URL e horário da consulta e confirma transcrição. Campos fora da previsão e com resultado local N/D não podem ser informados.
- A comparação e os valores informados vivem só no estado desta tela. Não são gravados no histórico, no Radar, nas escolhas de “As Boas” ou nos backups; o usuário pode exportar o dossiê e reabri-lo futuramente no fluxo existente. Mudanças no formulário descartam comparações anteriores; não se mantém afirmação antiga na UI.
- **Mesmo quando todos os números coincidem, isso NÃO autentica a fonte, NÃO comprova resultado real e NÃO incrementa a meta de 30 partidas prospectivas independentemente verificadas por liga**. A coorte da Etapa 52 permanece 0/30 até existir mecanismo de verificação real.
- A conversão de data usa fuso explícito **America/Sao_Paulo (UTC−03)**, com rejeição de dia impossível; nunca assume que qualquer usuário está em Brasília nem usa data local oculta como comprovante.

## Testes de aceitação
- Vitest: horário de consulta preenchido e convertido de Brasília para UTC, N/D sem preenchimento automático, zero válido, discrepâncias numéricas, domínio phishing/HTTP/mesma fonte, hora antes do período pós-jogo, hora futura, data impossível, números negativos/decimais/exponenciais, indicador externo incompatível, Radar genérico recusado e imutabilidade de dados.
- Playwright desktop e viewport Android simulados: salvar previsão real no fluxo UI sobre histórico **sintético**, adicionar resultado CSV **sintético** após o jogo, preencher formulário novo, bloquear URL phishing, gerar comparação e dossiê local com `independentVerification:'PENDENTE'`, mudar campo e garantir que comparação anterior desapareça, confirmar Radar original igual e coorte 0/30 externa.
- Sem teste Android físico e sem validação externa efetiva da página informada: ambos continuam pendentes.

**Arquivos:** `src/dailyGoodQuickEvidence.ts`, `src/DailyGoodQuickEvidenceForm.tsx`, `src/DailyGoodAuditPanel.tsx`, testes unitários e E2E, `package.json`.

**Próxima etapa sugerida:** melhorar preparação da conferência independente efetiva, sem duplicar tarefas ou alegar validação a partir de números transcritos, e avançar a integração controlada/QA físico quando autorizados.

# FutStats IA — Etapa 62 · Auditoria automática da cadeia de PRs experimentais

**26/10/2026, Brasília** — somente nova branch/PR DRAFT derivada do HEAD da Etapa 61. **Não houve merge, deploy, importação, alteração de `main`, Vercel ou produção.**

## Evidência existente antes da mudança
Consulta direta ao GitHub em 26/10/2026 confirmou que todos os **14 PRs #48–#61** ainda estavam **abertos, em rascunho e não mesclados** e que cada `base.ref` correspondia ao `head.ref` do PR anterior. O PR #61 terminou no HEAD `13461f73f38bda35e08674bb30e8f6f6a8ee065f`, com GitHub Actions #40312151106 aprovado (293 Vitest, compilação e 46/46 Playwright). O GitHub também confirmou por comparação real de SHA que #61 descende de #60 (`status=ahead`, `behind_by=0`).

## Entrega técnica
O workflow **FutStats Experimental Browser E2E** passou a incluir um passo de **auditoria da cadeia experimental** *antes* de executar os testes de navegador em novos PRs:

1. Executa **oito testes locais** sobre as regras de validação da cadeia, sem acessar a rede.
2. Se disparado por `pull_request`, consulta exclusivamente **GET** do GitHub API com `GITHUB_TOKEN` e permissões mínimas `contents:read` / `pull-requests:read`.
3. Confere sequencialmente todos os PRs de #48 até o PR atual: número sem lacunas, estado `open`, `draft=true`, não mesclado, origem e destino no repositório esperado e cada `base.ref` igual ao `head.ref` imediatamente anterior.
4. Confere ainda as **relações de ancestralidade reais dos SHAs** via `GET /compare/{anterior}...{atual}`, exigindo `ahead_by>=1`, `behind_by=0` e o par de SHAs exato. Comparar apenas nomes de branches não é suficiente.
5. Exige que o SHA final da cadeia corresponda exatamente ao `github.event.pull_request.head.sha` do teste. Falhas de rede, permissões, resposta inesperada, commit alterado, base incorreta, PR fechado ou unmerged/draft removido **bloqueiam o CI**. Não há reparação automática e nenhuma alteração é feita no GitHub.

Se toda a cadeia estiver íntegra, a mensagem informa **CADEIA EXPERIMENTAL VALIDADA**, mas mantém `productionRelease='BLOQUEADA'` e quatro pendências:

- QA realizado em aparelho Android físico.
- Backup externo efetivamente salvo e confirmado.
- Resultados reais confrontados com fonte externa independente, meta de pelo menos 30 por campeonato.
- Autorização expressa para a integração/merge/deploy.

**O verificador não aprova um merge, não acessa contas externas, não procura resultados esportivos e não altera dados do usuário.** Validar ancestralidade é um pré-requisito técnico, não comprova funcionamento no Android real nem eficácia de predição.

## Arquivos
- `scripts/stackedPrAudit.mjs` — regras puras de validação, recusando divergências.
- `scripts/stackedPrAudit.test.mjs` — 8 cenários, inclusive SHA incorreto, histórico divergente, PR não DRAFT, branch e fork inválidos.
- `scripts/check-stacked-prs.mjs` — leitura de PRs e comparação de commits na API GitHub, sem verbos de escrita.
- `.github/workflows/futstats-e2e.yml` — integração das novas verificações com token somente leitura, preservando build e Playwright existentes.

## Critérios de aceite
Todos os passos de GitHub Actions precisam ficar **verdes no mesmo HEAD**: 293 Vitest existentes, TypeScript/Vite, 8 testes Node, auditoria de PRs em tempo real e 46/46 Playwright. A porcentagem do Controle Mestre só pode aumentar se isso for comprovado, pois todos os critérios físicos/externos permanecem pendentes.

## Próxima etapa
Usar a cadeia validada para preparar integração em ambiente **não produtivo** apenas quando autorizada, coletando dados reais de QA de dispositivo e resultado independente sem inventá-los. Preservar 659 históricos, Radar V2/V3, Work e backups.

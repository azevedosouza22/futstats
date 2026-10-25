# FutStats IA · Etapa 50 — reconferência de fontes oficiais em lotes

**Data:** 25/10/2026 · ramo experimental derivado do PR #49. O conteúdo **não** se aplica automaticamente ao app em produção.

## Problema real identificado
A agenda oficial agrupava confrontos por liga, mas a fila de reconferência oferecia um link por partida. Na Bundesliga 2026/27, a 8ª rodada cadastrada na Etapa 49 tem **nove partidas na mesma página oficial**. Conferi-las individualmente exige nove visitas redundantes e aumenta o risco de esquecer algum jogo.

## Solução no app
Na área de partidas com referências oficiais, selecione **7 dias** e, se desejar, **Bundesliga 2026/27**. Abaixo do filtro aparece o bloco recolhível **“Reconferir por página oficial”**.

A visão agrupa por **campeonato e URL original**, exibindo o total de partidas cobertas por cada página, contagem de horários vencidos, jogos nas próximas 48 horas, as datas da conferência original e o conjunto de confrontos daquele grupo. Cada grupo oferece **um link original** com hostname HTTPS autorizado. Assim, a Bundesliga apresenta uma página para os nove jogos.

O botão **“Exportar checklist de fontes oficiais (CSV)”** cria `futstats-reconferencia-fontes-oficiais.csv`: **uma linha por página de origem**, com todos os confrontos, horário de Brasília somente se referência ainda vigente, URL, datas das consultas originais e coluna `reconferencia_atual = PENDENTE`.

## O que este recurso NÃO faz
- **Não** baixa o conteúdo da fonte oficial, não executa scraping nem consulta contínua.
- **Não** registra novo `verifiedAt`, não renova horários e não converte nenhuma referência vencida em fonte atual.
- **Não** informa o usuário de que clicou em “Abrir página oficial do grupo”, portanto a fonte foi comprovada ou realmente conferida.
- **Não** importa dados da Bundesliga, não registra previsão V2/V3 ou “Boa do Dia”, nem modifica Radar, histórico, Work, backup ou a produção.
- Uma página oficial que contém nove confrontos é apenas a **origem declarada e manualmente consultável**. Ser fonte da programação não é evidência dos resultados pós-jogo ou de acerto preditivo.

## Políticas de segurança
- `src/officialSourceBatches.ts` reaproveita `officialRecheckQueue` e `officialSnapshotFreshAt` no horário de Brasília. Verifica URL por **hostname oficial exato e HTTPS**, sem aceitar domínios semelhantes ou `userinfo`.
- Mesmo que o objeto recebido marque `fresh=true`, o agrupador recusa a hora se `verifiedAt` estiver fora do prazo de dois dias; em CSV fica **N/D**, não o último horário conhecido.
- Itens repetidos com mesmo ID são descartados. Fontes diferentes e campeonatos diferentes nunca são fundidos. A UI utiliza o filtro e a janela de datas selecionados, nunca inventa jogos ou links.
- O CSV é UTF-8 com BOM, células entre aspas e aspas internas escapadas; campos iniciados com possível fórmula de planilha são neutralizados. A exportação é apenas leitura e uma lista de tarefas, **não um arquivo de restauração**.
- Só os primeiros 8 grupos aparecem na tela para caber no celular; o CSV contém **todos os grupos visíveis no filtro escolhido**. O histórico do calendário e o JSON local seguem intactos.

## Aceite automatizado
Testes unitários: nove jogos DFL → uma fonte, vencimento de 25 para 29/10 (9 N/D), links falsificados recusados, duplicatas e competições segregadas, datas e status `PENDENTE`, texto suspeito em CSV e entrada vazia.

Playwright em desktop e viewport Android, **com dados sintéticos e agenda estática datada**, navega para 7 dias → Bundesliga → agrupamento, abre a lista, baixa checklist de uma linha para os nove jogos e simula 29/10: permanecem nove jogos **N/D**, com `PENDENTE`, sem alterar localStorage ou previsão. Não é QA em Android físico.

## Próximas pendências
Ainda precisamos avançar a **revalidação real e pontual** de partidas com novas consultas documentadas, fortalecer evidência pós-jogo independente e obter coorte prospectiva legítima antes de qualquer comparação de acerto. Integração/merge e liberação na produção continuam condicionados à autorização e QA físico. Nenhuma estatística de qualidade preditiva é afirmada nesta etapa.

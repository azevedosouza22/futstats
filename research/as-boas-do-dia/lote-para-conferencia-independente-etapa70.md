# FutStats IA — Etapa 70: um lote para pesquisa de resultados independentes

**26/10/2026 — PR experimental filho do #69, sem merge/deploy/importação.**

## Problema e objetivo
A validação das previsões continua sem 30 jogos prospectivos *realmente conferidos em segunda fonte* por liga. O aplicativo já consegue exportar um CSV de acompanhamento e um dossiê por confronto, mas seria trabalhoso exportar e enviar cada resultado separadamente para uma revisão externa. O armazenamento privado real do Android não está disponível automaticamente pelo GitHub nem por este chat.

## Recurso entregue
Em **Radar → Ver previsões salvas → Validação de As Boas do Dia → Conferência independente**, quando houver pelo menos um confronto *elegível* com resultado CSV local, exibir:

**“Exportar lote para conferir em segunda fonte (JSON)”**.

O arquivo `futstats-lote-conferencia-independente.json` inclui, somente para os confrontos preparados:
- identificador da previsão original, times, liga, horário do jogo em Brasília e horário declarado do salvamento;
- fonte oficial da agenda e data original de conferência;
- ID/URL/provedor/data de importação do resultado CSV local;
- direção e linha dos indicadores congelados **antes do jogo** e seus valores CSV locais ou N/D;
- `externalVerification: PENDENTE` por jogo, `externallyVerified: 0` no lote e meta **30 por liga**.

O JSON **não** contém o histórico com 659 partidas, dados de conta, preferências, backups V4 ou Work. O usuário **decide** se deseja fornecer o arquivo no chat para pesquisa. O aplicativo **não** acessa sites, não envia dados automaticamente, não cria tarefas em segundo plano, não gera acertos independentes e não atesta que o relógio local não foi adulterado.

O lote é insumo de pesquisa: na etapa posterior, um verificador precisará consultar uma fonte independente real, conferir placar/estatísticas por fonte e partida, registrar evidência e evitar duplicatas antes de calcular qualquer taxa. **Um CSV local, um URL válido ou a transcrição manual não bastam para declarar verificação externa.**

## Verificações e segurança
`src/dailyGoodOutcomeReviewBatch.ts` recebe as previsões congeladas, auditoria local, fila externa e trilha de IDs já validadas:
- exporta apenas `state=check_external`, `row.status=scored` e `CSV_LOCAL_DOCUMENTADO`;
- cruza IDs, mandante, visitante, competição, horário do jogo, horário de salvamento, fonte da agenda e metadados do CSV;
- exige salvamento anterior ao início do confronto, identidade de partida e ID único;
- exige o hostname HTTPS exato do Flashscore e igualdade entre `mid` da URL e o `sourceId` de origem;
- rejeita fontes adulteradas, chaves repetidas e totais incoerentes em vez de inventar valores;
- desconsidera partidas antes do fim, sem dados locais ou excluídas por ambiguidade/tardia; conta essas pendências no resumo, sem exportar seus registros privados.

Nenhuma previsão nem fonte original é alterada, restaurada, importada ou assinada criptograficamente. A string `PENDENTE` está congelada até existir verificação realmente independente, que **não é implementada ou simulada** por esta etapa.

## Aceite
- Vitest cobre pacote completo, vazio, previsão Radar genérica, escolha tardia, alteração de ID da fonte ou URL, divergência de fila/trilha, falseamento de status e imutabilidade.
- Playwright desktop/viewport Android: previsão salva antes do jogo, antes do CSV sem botão de lote; inclusão **somente no teste** de resultado CSV sintético, botão de lote habilitado, download de JSON com somente a previsão elegível e fonte local, verificação `PENDENTE`, dados Radar preservados.
- Manter **96/100** no Controle Mestre após CI verde. A Etapa 70 facilita o trabalho externo mas **não fornece os 3 pontos reais de qualidade pendentes**, pois nenhum resultado externo foi de fato conferido, nem 1/30 por liga. O ponto físico do Android permanece pendente.

## Continuidade / próximo passo
O percurso mais curto para validação esportiva real será obter voluntariamente **uma única exportação** do aplicativo em teste após jogos legitimamente previstos e encerrados, consultar fontes externas acessíveis de cada jogo e registrar comparações auditáveis. Não inferir que 30 previsões/validações existam. Não publicar sem teste Android físico, backup externo seguro e autorização específica.

**Produção, 659 partidas históricas, Radar V2/V3, Work, backups, main e todas as branches anteriores preservados.**

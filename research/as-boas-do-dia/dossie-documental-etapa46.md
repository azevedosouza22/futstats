# FutStats IA · Etapa 46 — dossiê local verificável de comparações documentais

**Data:** 25/10/2026. PR experimental empilhado após PR #45, sem merge ou deploy.

## O problema
Na Etapa 45 o FutStats passou a comparar resultados de CSV local com valores **informados** de uma segunda fonte. A comparação era temporária. A Etapa 46 permite guardar **somente no aparelho do usuário**, de maneira portátil, exatamente quais dados foram confrontados, por qual identidade de confronto, por qual URL informada, em que data e quais valores chegaram a COINCIDE, DIVERGE ou N/D.

O dossiê NÃO valida de forma remota a URL, não verifica autenticidade do fornecedor e não converte um arquivo informado pelo usuário em prova externa. A coluna `independentVerification` é **PENDENTE** de forma imutável.

## Fluxo funcional (experimental)
1. Abrir uma previsão da lista “As Boas” salva antes da partida e com resultado local pós-jogo documentado pelo CSV; não incluir Radar legado, duplicata, registro tardio ou inválido.
2. Utilizar comparação documental da Etapa 45: selecionar um arquivo JSON preenchido com dados **que tenham sido consultados de fato na fonte independente**, incluindo o URL, horário e valores; o app recusa valores ausentes ou fontes incompatíveis.
3. Pressionar **Exportar dossiê local da comparação (JSON)**. O arquivo `futstats-dossie-comparacao-local.json` contém: previsão ORIGINAL congelada desse confronto, linha de resultado CSV local sem mudanças, conteúdo de segunda fonte **informado**, comparação, instante da exportação UTC, status PENDENTE e um SHA-256.
4. Em outra ocasião, reabrir o próprio dossiê pelo controle **Conferir integridade do dossiê (JSON)**. O app calcula o SHA-256 do conteúdo, valida o formato e reexecuta os filtros de origem/horário/identidade/indicador, além de comparar previsão e linha CSV atuais com o que foi exportado. Divergência resulta em rejeição, sem substituir originais.
5. A reabertura não salva dados, não gera novos registros, não importa CSV de partidas, não configura automação nem altera estatísticas originais. A comparação reaparece em memória apenas quando a integridade é consistente.

## Limites cruciais do SHA-256
- SHA-256 **não é uma assinatura digital** e qualquer pessoa capaz de editar o arquivo também pode recalcular a soma. Serve para detectar alteração acidental ou diferença do dossiê frente aos dados atuais **neste aparelho**, não para provar autoria, acesso ou correspondência ao conteúdo de uma página na internet.
- A seleção do nome de domínio na Etapa 45 também é apenas validação de formato. O app não confirma que esse URL existia nem que exibia os números informados.
- Mesmo dossiê íntegro, com comparação coincidente, continua **DOCUMENTAÇÃO INFORMADA — NÃO VERIFICADA NA WEB** e `independentVerification:PENDENTE`.
- O dossiê é uma cópia isolada de um confronto. **Não substitui o backup integral de 9 grupos nem o backup JSON das previsões.** Conserve-os separadamente.

## Segurança e critérios de aceitação
- SHA-256 via WebCrypto, sem biblioteca, chamadas remotas ou segredo/assinatura fictícios. Se não houver WebCrypto seguro, falhar sem gerar um arquivo supostamente íntegro.
- Modelo de documento estrito sem campo `verified`; timestamp nunca no futuro; arquivo limitado a 300 KB no reimport. Exigir a mesma previsão e linha CSV, ordenação e IDs originais e o mesmo resultado da comparação recalculada.
- Vitest: criação/reabertura, adulteração, campos `verified`, integridade comparada ao registro atual, resultados divergentes e ausência de mutações. E2E Chromium desktop e viewport Android: baixar dossiê, verificar checksum, reabrir, detectar alteração e confirmar byte a byte que Radar não mudou.
- Não há acompanhamento em segundo plano, importação, merge/deploy, mudança na produção, nos 659 históricos, Radar V2/V3, Work ou backups. **Nenhum resultado real conferido externamente neste trabalho.**

**Meta seguinte:** priorizar experiências reais verificáveis de início/fim de jogo com fontes efetivamente consultadas, medindo amostras prospectivas por liga antes de qualquer afirmação de qualidade preditiva.

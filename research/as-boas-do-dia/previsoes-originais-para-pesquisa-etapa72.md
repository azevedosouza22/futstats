# Etapa 72 — exportação das previsões ORIGINAIS para pesquisa

**27/10/2026. DRAFT encadeado após #71. Sem merge, deploy ou acesso ao armazenamento real do Android.**

## Lacuna resolvida
A Etapa 70 já entregou um pacote de **resultados CSV locais** que estejam prontos para conferência independente, porém exclui por projeto jogos em andamento, futuros ou aguardando CSV. Para localizar previsões prospectivas autênticas disponíveis no dispositivo do usuário (sem retrocriar indicadores), a Etapa 72 adiciona uma **exportação distinta das previsões originais da lista**, inclusive antes de existir resultado local.

## Uso
Em **Radar → Ver previsões já registradas → Validação de As Boas do Dia**, aparece **“Levar previsões originais para conferência”**, com o botão **“Exportar previsões pré-jogo para pesquisa (JSON)”**. Só exporta se houver indicação expressamente selecionada na lista e elegível na auditoria local. Cada item registra chave exata, liga, confronto, data/hora de salvamento declaradas localmente, horário original agendado em Brasília, URL e dia da conferência original do calendário, sinais Over/Under **congelados**, projeções e amostras originais, e estado atual (`future`, `waiting`, `source_missing` ou `scored`).

A exportação **não** reconstrói qualquer previsão, não calcula mercados com histórico posterior nem preenche resultados esportivos. Legado Radar genérico, registros tardios, inválidos e confrontos ambíguos permanecem excluídos, com contagens explicativas. O pacote traz `externallyVerified:0`, `accuracy:'N/D'`, `externalCheck:'PENDENTE'` e `externalResult:'N/D'`. Não inclui placares, resultados ou CSVs presumidos: o **outro pacote da Etapa 70** permanece o caminho correto para partidas cujo CSV local foi realmente identificado.

**Importante:** `savedAtUtc` é somente horário gravado no navegador, **não um carimbo autenticado por terceira parte**. A pessoa precisará disponibilizar o arquivo real do seu dispositivo e permitir conferir as fontes, caso deseje avançar com a coorte de resultados. O GitHub não contém previsões privadas salvas no Android. Não existe coleta automática desses dados nem upload silencioso. O arquivo é para estudo **não para restaurar histórico**; preservar também o backup integral V4.

## Garantias
- Verificação de igualdade de quantidade, ordenação e identidade entre `SavedRadarRecord` e auditoria local antes da exportação. Repete critérios de elegibilidade sem afrouxar o validador atual; recusa datas futuras, IDs duplicados e confrontos repetidos. Nunca associa retroativamente Radar geral à lista.
- Leitura exclusiva; download sob clique do usuário. Nenhuma modificação de `localStorage`, fontes, previsão, ID ou modelo V2/V3; produção, 659 históricos, Work e backups intactos.
- Os dados de unidade e Playwright são **sintéticos**, não constituem evidência de previsão real ou acerto. O placar público de La Liga visto na Etapa 71 permanece separado de previsões privadas não fornecidas.

## Critérios de aceite
Vitest: registro válido pré-jogo, depois do jogo ainda aguardando resultado, exclusões, campeonato independente, divergência de ordem, data declarada futura, pacote vazio, imutabilidade. E2E desktop/layout Android: escolher partida sintética → salvar indicação → exportar pacote com N/D e 0 externos → avançar relógio → exportar mesma previsão aguardando resultado → verificar valores congelados e `localStorage` inalterados. `npm run build` e fluxo CI completo devem ficar verdes antes de marcar a entrega como validada.

**Progresso: 96/100 permanece**, pois infraestrutura de exportação não equivale a resultados **reais prospectivamente conferidos** nem QA no aparelho físico. Último ponto de produção/Android só após autorização, cópia externa e QA físico. Próxima decisão prática: analisar arquivo original realmente exportado do aparelho quando disponível, sem criar falsos dados retrospectivos.

# F360 — Handoff de análises documentais em 21/11/2026
**Registro:** `F360-CTRL-ANALISE-20261121` · tipo `CONTROLE` · chat F360/Análise.

## Status do chat
- Referências lidas: HUB F360 PR DRAFT #104; `INICIO_AQUI.md`, `COMANDOS_CHATS.md`, `ESTADO_ATUAL.json`, `INDICE_REGISTROS.csv`, `ESTRATEGIAS.json`, `CONTRATO_DADOS.md`, Controle Mestre #29 e issue #105.
- Estratégias aprovadas no HUB: **zero**; Elite é classificação histórica provisória, não regra promovida.
- Primeiro vínculo documental completo da análise: [F360-POS-V4-20261030-AUDIT09](../POSJOGO/F360-POS-V4-20261030-AUDIT09.md), 9 jogos e 108 decisões conferidas com o pré-jogo congelado.
- Não há neste controle um novo `PREJOGO` gerado antes do início de jogos futuros. Previsões antigas não foram recompostas ou congeladas retroativamente.

## Referências de relatórios recentes já existentes no Drive
Os links abaixo são **artefatos de pesquisa publicados em sessões anteriores**, com suas próprias ressalvas de corte, completude e eventual atraso. Esta inclusão no HUB **não valida** o horário de geração versus kickoff, o congelamento GitHub, a versão de código, as odds ou a elegibilidade prospectiva.

| Data de jogos | Planilha | ZIP de relatório | Situação no HUB |
|---|---|---|---|
| 19/11/2026 | [LV4/Elite 19NOV](https://docs.google.com/spreadsheets/d/1tyc1X0Z6NyIzDhiSu6d1K2ikwWu22OSk/edit) | [pacote 19NOV](https://drive.google.com/file/d/1OAQ-XNGQDI04wsFJ6S1RfVkksD9F-dUn/view) | `REFERENCIA_DOCUMENTAL_NAO_HOMOLOGADA` |
| 20/11/2026 | [LV4/Elite 20NOV](https://docs.google.com/spreadsheets/d/1KE9M67aGhm1DHZ01PMdkd0BlIy8E5xYr/edit) | [pacote 20NOV](https://drive.google.com/file/d/1V7F-G0KlyJjWqVTV7R-Kwn9Gii3qtNtO/view) | `REFERENCIA_DOCUMENTAL_NAO_HOMOLOGADA` |
| 21/11/2026 | [LV4/Elite 21NOV](https://docs.google.com/spreadsheets/d/1jPFz0Wa6bU7SQ3k32Wg3GsksRH57tg42/edit) | [pacote 21NOV](https://drive.google.com/file/d/1fe3TIiGotP3OhypK803ZriTdXLtEZms8/view) | `REFERENCIA_DOCUMENTAL_NAO_HOMOLOGADA` |

### Advertências
- O relatório de 21/11 usou índice com corte em 15/11. Parte da Série A brasileira teve históricos posteriores; sinais com base desatualizada foram explicitamente **não homologados**.
- O relatório de 20/11 contém algumas referências a confrontos de playoff e requer checagem de competição, temporada, horários e histórico realmente elegível. Não utilizar a coluna "Elite" como resultado de aposta.
- O relatório de 19/11 possui N/D em mercados com divergências de fonte. Nenhum N/D deve ser preenchido por inferência.

## Responsabilidades seguintes da issue #105
1. **Chat Coleta:** recuperar os registros originais de 19, 20 e 21/11, verificar se cada snapshot existia antes do kickoff, identificar ID real de jogo, linha, mercado e período; emitir `POSJOGO` apenas quando o vínculo estiver comprovado. Caso contrário, registrar como pesquisa retrospectiva.
2. **Work:** comparar os sinais com os resultados reconciliados em corte temporal, baselines e odds reais quando existirem, publicando `EXPERIMENTO` sem alterar modelos.
3. **F360/Análise:** ler `ESTRATEGIAS.json` e último `POSJOGO` antes de emitir novas indicações; registrar futuros `PREJOGO` com timestamp, versão, fonte, ID de jogo e SDD. Não declarar previsão pré-jogo se o evento já começou.

**Protegidos:** 659 partidas pessoais, Radar V2/V3/V4, modelos LV4/Elite, snapshots, `main`, Android e produção. **Sem merge, deploy, promoção de estratégia ou apostas inferidas.**


## Atualização por sincronização documental do HUB (21/11)
Após a criação deste controle, o chat Coleta publicou e indexou três fechamentos adicionais. Estes são **as referências de pós-jogo mais recentes encontradas no HUB** e devem ser lidos pelo F360 antes de novos sinais:

| Registro do Coleta | Situação | Resultado publicado | Uso autorizado |
|---|---|---|---|
| [F360-POS-20261118](../REGISTROS/POSJOGO_2026-11-18.md) | Piloto com snapshots anteriores / 3 jogos | 21 acertos, 13 erros, 2 abstenções | Auditoria documental vinculada; ainda sem EXPERIMENTO |
| [F360-POS-20261119-COND](../REGISTROS/POSJOGO_2026-11-19.md) | Documental condicionada / 3 jogos | 18 acertos, 3 erros, 13 sem linha, 2 abstenções | Fora da série prospectiva homologada |
| [F360-POS-20261120-COND](../REGISTROS/POSJOGO_2026-11-20.md) | Documental condicionada / 7 jogos | 61 acertos, 18 erros, 5 abstenções | Fora da série prospectiva homologada |

O estado `latest_verified_postgame_imported_to_hub` pertence ao piloto de 18/11; `latest_documental_postgame_imported_to_hub` pertence a 20/11. A reconciliação de 30/10 foi adicionada à lista histórica **sem substituir esses apontadores mais recentes**.

**Não somar indiscriminadamente** os 30/10 e 18–20/11 a outros totais antes de deduplicar partidas/indicadores e classificar o nível de evidência. Zero mudanças em `ESTRATEGIAS.json`; nenhuma regra nova aprovada.

# F360 | Estudo LV4/Elite 22/11/2026 — SDD documental condicionado

**Registro:** `F360-ESTUDO-20261122`  
**Elaborado/gravado antes do início dos onze confrontos selecionados** (primeiro kickoff às 14h30 BRT); data operacional 22/11/2026.  
**Natureza:** `ESTUDO_DOCUMENTAL_CONDICIONADO`. **NÃO HOMOLOGADO COMO PREJOGO PROSPECTIVO OFICIAL OU SHADOW V1**.  
**Arquivo integral e congelado das decisões:** [132 indicadores CSV](./F360-ESTUDO-20261122-INDICADORES-132.csv).  
**Arquivo paralelo no Google Drive:** [CSV 132 indicadores](https://drive.google.com/file/d/1ZAQ3R1OwFe9A2bKzNg4txcF7gQIVOTAH/view).

## Política e fontes examinadas
- Lidos o [HUB F360](../INICIO_AQUI.md), [índice](../INDICE_REGISTROS.csv), [estado](../ESTADO_ATUAL.json), [estratégias](../ESTRATEGIAS.json) e [contrato](../CONTRATO_DADOS.md), além dos POSJOGO do Coleta até 21/11 e issue #105.
- `ESTRATEGIAS.json` tem **zero estratégias formalmente aprovadas**. O fechamento do dia 21/11, `F360-POS-20261121-FINAL-COND`, foi 134 acertos/43 erros/27 abstenções e é DOCUMENTAL CONDICIONADO. Não foi usado para alterar o cálculo.
- Método numérico baseado no código original `analyzeV4Fixture`, commit `6ef66d14a5d814d57dd59e552cf08983bc57d91a`: 5 últimos jogos anteriores por equipe na mesma liga/temporada; união de pelo menos 8 jogos; mínimo 8 valores por célula; maior linha da grade Over com frequência >=70%; 4 mercados × 3 períodos.
- Cálculo de reprodução **em Python separado**, sem executar o TypeScript original; portanto NÃO declarar saída nativa do app. Elite documental = 9/10 ou 10/10 e margem média >= 0,8 gols / 3 finalizações / 1,5 chutes no gol / 2 escanteios. Nenhum motor Elite dedicado foi encontrado no código auditado.
- Índice de [5.620 partidas elegíveis](https://drive.google.com/file/d/19nLXneG2zkrY8us4dWozf7Vth7P_BKBj/view) usado em cópia local (SHA-256 `4a9c232e7fb63f91338bc63b64cf59726a1de907865e559f8d5f928961c0a7f2`), contendo jogos até 09/11; complementos do [CSV Coleta 18/11](https://drive.google.com/file/d/1GfU8mo7sEZ9Kz2buHxshZbo0ARX_fUBw/view) e [CSV Coleta 19/11](https://drive.google.com/file/d/1CJcaLxDl0OFcMc0VfZ1tAvtb-ltYyCOE/view), sem preencher estatísticas ausentes.
- Fonte calendário: [ge Brasileirão](https://ge.globo.com/ba/futebol/brasileirao-serie-a/noticia/2026/11/21/brasileirao-2026-veja-onde-assistir-ao-vivo-aos-jogos-da-36a-rodada.ghtml), [Goal Brasil agenda](https://www.goal.com/br/listas/futebol-programacao-jogos-tv-aberta-fechada-onde-assistir-online-app/bltc0a7361374657315), [CBS MLS](https://qa.img.cbssports.com/soccer/mls/schedule/20261122/), [LiveScore agenda](https://www.livescore.mobi/football/2026-11-22/).

## Quadro geral
**11 jogos; 132 decisões; 119 sinais históricos; 13 abstenções; 21 candidatos Elite documentais** (são subconjunto de 119, não somar duas vezes). Odds reais de cada linha, apostas e ROI: N/D.

| Jogo | Início BRT | Liga/fase | Sinais | Elite documental | SDD |
|---|---:|---|---:|---:|---|
| Osasuna × Málaga | 14h30 | La Liga | 12 | 5 | OBSERVAR, conferir calendário/ID/odd |
| Athletico-PR × Remo | 16h | Brasileirão | 11 | 2 | DESCARTAR para entrada: recência incompleta |
| Rosario Central × Gimnasia Mendoza | 16h | Argentina/playoff | 12 | 1 | OBSERVAR: fase playoff |
| Atalanta × Inter | 16h45 | Serie A italiana | 12 | 0 | OBSERVAR |
| Marseille × Le Mans | 16h45 | Ligue 1 | 8 | 2 | OBSERVAR |
| Getafe × Atlético de Madrid | 17h | La Liga | 11 | 3 | OBSERVAR: Atlético sem última partida conferida |
| Nashville SC × Cincinnati | 18h | MLS/playoff | 7 | 0 | OBSERVAR: fase playoff |
| Fluminense × Mirassol | 18h30 | Brasileirão | 12 | 1 | DESCARTAR para entrada: recência incompleta |
| River Plate × Lanús | 19h | Argentina/playoff | 10 | 0 | OBSERVAR: fase playoff |
| Red Bull Bragantino × Vasco | 19h30 | Brasileirão | 12 | 3 | DESCARTAR para entrada: recência incompleta |
| Chicago Fire × Charlotte | 20h30 | MLS/playoff | 12 | 4 | OBSERVAR: fase playoff |

## 21 candidatos Elite provisórios (apenas histórico)
| Jogo | Mercado | Período | Linha | Histórico | SDD |
|---|---|---|---:|---|---|
| Osasuna × Málaga | Gols | JC | Over 1,5 | 9/10 | OBSERVAR |
| Osasuna × Málaga | Chutes no gol | 1ºT | Over 2,5 | 9/10 | OBSERVAR |
| Osasuna × Málaga | Gols | 2ºT | Over 0,5 | 10/10 | OBSERVAR |
| Osasuna × Málaga | Finalizações | 2ºT | Over 13,5 | 10/10 | OBSERVAR |
| Osasuna × Málaga | Chutes no gol | 2ºT | Over 4,5 | 9/10 | OBSERVAR |
| Athletico-PR × Remo | Gols | JC | Over 1,5 | 9/10 | DESCARTAR — recência |
| Athletico-PR × Remo | Gols | 1ºT | Over 0,5 | 10/10 | DESCARTAR — recência |
| Rosario Central × Gimnasia Mendoza | Gols | 2ºT | Over 0,5 | 10/10 | OBSERVAR — playoff |
| Marseille × Le Mans | Gols | JC | Over 1,5 | 10/10 | OBSERVAR |
| Marseille × Le Mans | Chutes no gol | 2ºT | Over 3,5 | 9/10 | OBSERVAR |
| Getafe × Atlético de Madrid | Gols | 2ºT | Over 0,5 | 10/10 | OBSERVAR |
| Getafe × Atlético de Madrid | Finalizações | 2ºT | Over 13,5 | 9/10 | OBSERVAR |
| Getafe × Atlético de Madrid | Escanteios | 2ºT | Over 2,5 | 9/10 | OBSERVAR |
| Fluminense × Mirassol | Escanteios | 1ºT | Over 2,5 | 10/10 | DESCARTAR — recência |
| Red Bull Bragantino × Vasco | Gols | 1ºT | Over 0,5 | 9/10 | DESCARTAR — recência |
| Red Bull Bragantino × Vasco | Gols | 2ºT | Over 0,5 | 9/10 | DESCARTAR — recência |
| Red Bull Bragantino × Vasco | Escanteios | 2ºT | Over 3,5 | 9/10 | DESCARTAR — recência |
| Chicago Fire × Charlotte | Gols | JC | Over 3,5 | 9/10 | OBSERVAR — playoff |
| Chicago Fire × Charlotte | Gols | 1ºT | Over 0,5 | 10/10 | OBSERVAR — playoff |
| Chicago Fire × Charlotte | Gols | 2ºT | Over 1,5 | 9/10 | OBSERVAR — playoff |
| Chicago Fire × Charlotte | Chutes no gol | 2ºT | Over 3,5 | 10/10 | OBSERVAR — playoff |

## Bloqueios e rastreabilidade
- Em **Fluminense × Mirassol**, a última partida de Mirassol de 14/11 não entrou no catálogo auditável e as cinco partidas usadas não correspondem necessariamente aos cinco confrontos reais mais recentes. Em **Bragantino × Vasco**, a partida Chapecoense × Vasco de 14/11 tem lacunas; os jogos 19/11 foram adicionados apenas por totais observados. **Os 6 Elite brasileiros são bloqueados.**
- O último registro de Atlético de Madrid nessa seleção é de **31/10**; é necessária verificação de jogos posteriores. A Ligue 1 também depende de atualização, e MLS/Argentina requer separação por fase de playoffs. Não declarar probabilidades calibradas a partir de frequências.
- A identificação `fixture_id` do CSV é uma chave local de pesquisa (BR1, ES1 etc.), **não Flashscore ID**. As chaves externas ficam N/D quando não comprovadas; exemplos conferidos separadamente: Fluminense–Mirassol `CvlkSCUq` e Osasuna–Málaga `Ig1Jxr1l`. O CSV foi preservado sem retificação retroativa.
- **PREJOGO oficial:** não homologado; **SDD SELECIONAR:** zero. Para odds de mercado real e linha exata, exigir comprovação anterior ao kickoff.
- Responsável seguinte Coleta: obter ID e estatísticas dos jogos, auditar sem alterar estas linhas. Work: testar recência e playoff/baseline em uma coorte prospectiva.
- Protegidos: 659 históricos pessoais, LV4/Elite, Radar V2/V3/V4, `main`, Android e produção. Nenhum merge/deploy/alteração de estratégia.

**Este relatório não é recomendação automática de aposta.**

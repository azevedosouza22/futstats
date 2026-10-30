# FutStats IA — Laboratório Radar V4 — Piloto 03

## Escopo e origem
Ampliação do Piloto 02, executada sobre a **base de pesquisa de 3.260 partidas do FutStats**. Selecionamos **30 jogos concluídos por campeonato**, das oito ligas aprovadas, sempre os **30 mais recentes elegíveis** (ordem descendente por data e desempate por sourceId). Total de **240 jogos** e quatro métricas avaliadas em **três períodos** (FT / 1T / 2T): **2.880 oportunidades de sinal**.

**Dados históricos reais, não odds reais**. Fonte original da base: coletas Work/Flashscore, armazenadas em `public/research`; para Brasileirão usamos a revisão de datas brasileira disponível no repositório. Filtro de término: data até **29/10/2026**.

## Metodologia congelada antes do desfecho
- Para cada jogo, identificar últimos **5 jogos anteriores** de cada equipe **na mesma competição e mesma temporada**, excluir mesmo dia, futuro e duplicações de sourceId; pelo menos **8 jogos históricos distintos**.
- Para cada métrica/período, contar a frequência de Over nas referências anteriores, usar a **maior linha** cuja frequência histórica seja >= **70%**, ou **abster-se** caso nenhuma linha satisfaça.
- Linhas predefinidas:
  - FT: Finalizações 20,5/22,5/24,5/26,5; escanteios 6,5/7,5/8,5/9,5; chutes no gol 5,5/6,5/7,5/8,5; gols 1,5/2,5/3,5.
  - 1T: Finalizações 8,5/10,5/12,5; escanteios 2,5/3,5/4,5/5,5; chutes no gol 2,5/3,5/4,5; gols 0,5/1,5/2,5.
  - 2T: Finalizações 9,5/11,5/13,5; escanteios 2,5/3,5/4,5/5,5; chutes no gol 2,5/3,5/4,5; gols 0,5/1,5/2,5.
- Resultado do jogo examinado **apenas depois da escolha** de cada linha. Congelar decisões em registros de pesquisa sem tocar no aplicativo ou nas previsões pessoais. É **backtest cronológico retrospectivo**, não um registro prospectivo real.

## Resultado geral

| Indicador | Quantidade |
|---|---:|
| Ligas | 8 |
| Jogos | 240 |
| Oportunidades (4 × 3 × 240) | 2.880 |
| Sinais emitidos | **2.591** |
| Acertos | **1.840** |
| Erros | **751** |
| Sem sinal | **289** |
| Acertos entre sinais | **71,0%** |

### Resultado por liga

| Liga | Sinais | Acertos | Erros | Abstenções | Acertos / sinais | Lucro fictício a R$10, odd1,50 |
|---|---:|---:|---:|---:|---:|---:|
| Brasileirão 2026 | 350 | 251 | 99 | 10 | 71,7% | +R$ 265 |
| Bundesliga 2025/26 | 352 | 265 | 87 | 8 | 75,3% | +R$ 455 |
| Premier League 2025/26 | 339 | 248 | 91 | 21 | 73,2% | +R$ 330 |
| La Liga 2025/26 | 305 | 213 | 92 | 55 | 69,8% | +R$ 145 |
| Serie A italiana 2025/26 | 271 | 189 | 82 | 89 | 69,7% | +R$ 125 |
| Ligue 1 francesa 2025/26 | 342 | 247 | 95 | 18 | 72,2% | +R$ 285 |
| Liga Portugal 2025/26 | 286 | 199 | 87 | 74 | 69,6% | +R$ 125 |
| Saudi Pro League 2025/26 | 346 | 228 | 118 | 14 | 65,9% | -R$ 40 |
| **Total** | **2.591** | **1.840** | **751** | **289** | **71,0%** | **+R$ 1.690** |

### Resultado por período e por mercado

| Período | Mercado | Sinais | Acertos | Erros | Sem sinal | Taxa observada |
|---|---|---:|---:|---:|---:|---:|
| Partida inteira | Finalizações | 196 | 145 | 51 | 44 | 74,0% |
| Partida inteira | Escanteios | 235 | 155 | 80 | 5 | 66,0% |
| Partida inteira | Chutes no gol | 229 | 161 | 68 | 11 | 70,3% |
| Partida inteira | Gols | 208 | 143 | 65 | 32 | 68,8% |
| 1º tempo | Finalizações | 204 | 156 | 48 | 36 | 76,5% |
| 1º tempo | Escanteios | 228 | 163 | 65 | 12 | 71,5% |
| 1º tempo | Chutes no gol | 217 | 147 | 70 | 23 | 67,7% |
| 1º tempo | Gols | 179 | 129 | 50 | 61 | 72,1% |
| 2º tempo | Finalizações | 216 | 158 | 58 | 24 | 73,1% |
| 2º tempo | Escanteios | 238 | 156 | 82 | 2 | 65,5% |
| 2º tempo | Chutes no gol | 232 | 165 | 67 | 8 | 71,1% |
| 2º tempo | Gols | 209 | 162 | 47 | 31 | 77,5% |

### Comparação de amostras
- Teste 02: **16 jogos**, **57 sinais**, 47 acertos (82,5%). Foram apenas FT.
- Teste 03: **240 jogos**, **2.591 sinais**, 1.840 acertos (71,0%). São FT+1T+2T, com linhas diferentes por período. **As taxas não são equivalentes em desenho**, por isso a redução não deve ser interpretada isoladamente como piora de um modelo.
- O Teste 03 contém os dois jogos recentes de cada liga do Teste 02 e **não é uma amostra independente** do Teste 02.

## Simulação financeira — NÃO resultado financeiro histórico
Usuário solicitou entender apostas de **R$10 cada, odd fictícia 1,50**. Considerando uma aposta simples em cada um dos **2.591 sinais**:
- Total hipoteticamente apostado = **R$25.910**.
- Retorno bruto hipotético dos 1.840 acertos = **R$27.600**.
- Prejuízo hipotético dos 751 erros = R$7.510 já embutidos no lucro líquido.
- Lucro líquido hipotético = **R$1.690**; ROI fictício = **6,5%**.

**Isto não demonstra rentabilidade.** Odds uniformes de 1,50 **não foram observadas nem coletadas** para nenhuma linha. Algumas linhas conservadoras (especialmente Over 0,5 gols por tempo ou Over 1,5 gols no jogo) podem ter preços bem inferiores; vários mercados e tempos não são necessariamente ofertados. O teste emite cerca de 10,8 sinais por partida, vários fortemente correlacionados: perdas simultâneas e exigência de banca são riscos reais. Com odd 1,50 o ponto de equilíbrio teórico é 66,7% (antes de eventuais custos). **Não projetar lucros reais, não prometer performance e não ativar apostas automáticas.**

## Problemas ainda abertos
1. Comparações econômicas só terão significado com odds efetivamente disponíveis **antes** da partida, custos e registro do preço/mercado.
2. É necessário comparar métodos na **mesma partida, mesma linha e mesmo período**, não apenas taxas em linhas de dificuldade diferente.
3. Amostras históricas por equipe se sobrepõem e os 12 sinais da mesma partida não são independentes. 240 partidas e 2.591 sinais **não equivalem a 2.591 experimentos independentes**.
4. Piloto é *demonstração cronológica retrospectiva* e não prevê melhora sobre Radar V2/V3. Precisamos de validação prospectiva independente antes de mudar As Boas do Dia.

## Como reproduzir
Teste `src/radarV4LabPilot03.test.ts`:

```bash
npx vitest run src/radarV4LabPilot03.test.ts
```

O teste acessa somente arquivos de pesquisa e valida **3.260 jogos, 240 seleções em ordem temporal, ausência de fuga de dados futuros, resultados por liga, por indicador e por período**. Executa sem modificar a UI, `localStorage`, backups, Radar V2/V3 ou produção.

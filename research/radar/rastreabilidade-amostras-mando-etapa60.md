# FutStats IA · Etapa 60 — rastreabilidade das médias por mando

**Checkpoint anterior:** issue #29 — Etapa 59, 86/100, PR #59 DRAFT, CI aprovado. **Escopo:** novo PR experimental filho de #59; nada em produção ou no aparelho.

## Entrega
A prévia do Radar já separava o desempenho histórico do **mandante em casa** e **visitante fora**, usando apenas os cinco jogos anteriores de cada clube na mesma liga e temporada. Agora, dentro de **Conferir desempenho em casa e fora → Conferir partidas usadas nas médias e exclusões**, há uma lista por clube mostrando **data, confronto, ID local, inclusão ou exclusão, motivo, campos N/D, indicadores conflitantes e eventual link de origem cadastrado**.

O filtro de mando é aplicado **depois da escolha dos cinco jogos**. Um jogo fora do mando fica identificado e **não é substituído por outro mais antigo** para aumentar artificialmente a amostra. Partidas com data/fonte conflitante e IDs repetidos são explicitamente separadas. Os valores originais nunca são reescritos.

As fontes Flashscore individuais só recebem links se forem **HTTPS, domínio exato permitido e parâmetro mid igual ao ID salvo**. Uma URL estruturalmente permitida não prova que seu conteúdo tenha sido acessado, conferido ou que os resultados sejam verdadeiros. Registros sem URL válida mostram N/D.

O botão **Exportar rastro das amostras (CSV)** cria uma linha por partida **e por perspectiva de clube** (um confronto A × B pode aparecer legitimamente uma vez para cada equipe, sem contar como dois jogos independentes). Inclui o estado da amostra, contagens de lacunas/conflitos e **`checagem_externa=PENDENTE`**, em UTF-8 BOM com proteção contra fórmulas. Se o número de partidas da trilha divergir dos contadores do cálculo da Etapa 59, o app **bloqueia a exportação** em vez de fabricar um detalhamento.

## Aceite
- Unitários: amostras exatas 5+5, divergência de mando, jogo antigo não incluído como reposição, campo ausente, divergência FT/tempos, fonte de data conflitante, rejeição de domínio impostor, confronto compartilhado e proteção de CSV; sem modificação de objetos originais.
- Playwright desktop/viewport Android: agenda → “As Boas” sintética → Radar → comparação por mando → dez registros rastreados → checklist PENDENTE → localStorage byte idêntico → salvar previsão → recuperar previsão congelada.
- CI verde no **mesmo SHA**: Vitest, compilação TypeScript/Vite, navegação em desktop e viewport Android. QA Android físico não foi executado.

## Limites
Esta trilha é sobre **proveniência local da amostra**, não é validação de gols/finalizações/chutes/escanteios em fontes independentes, não comprova acerto de V2/V3 e não cria resultados reais. A meta de 30 partidas prospectivas externamente confirmadas por liga permanece pendente e com desempenho N/D. Nenhum merge/deploy, coleta contínua, importação ou mudança dos 659 históricos, Radar V2/V3, Work e backups.

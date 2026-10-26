# FutStats IA — Etapa 57 · Bloco 1: revisão pontual dos 12 campos

**Data:** 25/10/2026 (Brasília). **Somente DRAFT PR empilhado sobre #56.** Nada importado, corrigido, mesclado ou publicado.

## Entrega
O Radar já mostrava o quadro de 4 indicadores × 3 períodos com médias históricas, amostra n/N, N/D e indicação numérica de conflitos. Faltava identificar **quais partidas exatas precisam ser conferidas**, sem abrir centenas de páginas, e prevenir erros que se cancelam na soma dos dois times.

- A seção **“Conferir 4 indicadores por período”** agora contém **“Conferir dados incompletos e somas”**. Lista, por partida prévia distinta, as métricas/tempos com N/D ou soma divergente. Os primeiros cinco casos aparecem na tela; se houver outros, todos vão para o checklist CSV.
- **“Exportar pendências desta prévia (CSV)”** gera `futstats-pendencias-indicadores-periodos.csv` UTF-8: jogo, data, confronto, indicador, período, `N/D` ou `SOMA_DIVERGENTE`, ID de origem, URL permitida e `PENDENTE`. É uma fila de revisão, **não um CSV para importar/restaurar**.
- `assessGapSource` só fornece link ao usuário quando domínio Flashscore HTTPS, `mid` e ID armazenado conferem. URLs impostoras, não HTTPS ou metadados ausentes não são clicáveis e não aparecem no checklist.
- A consistência `full = 1T + 2T` é checada **separadamente para mandante e visitante**. Um +1 de um lado e -1 do outro não pode mascarar uma contradição do total combinado. Métrica com contradição fica fora da média nos três períodos; nenhuma outra métrica válida é descartada por isso.
- A origem da amostra permanece `radarUpcoming`: até cinco partidas anteriores de cada clube, competição/temporada igual, deduplicadas por ID, sem incluir jogo futuro e descartando divergência de data documentada. N/D nunca se transforma em zero, e full não preenche tempos ausentes.
- **Nenhum dado é escrito/alterado, nenhuma fonte é visitada automaticamente, nenhuma previsão é recalculada, nenhuma verificação esportiva real é presumida.**

## Aceite
- Vitest: entrada completa sem gaps; CSV histórico legítimo com 1º e 2º tempos N/D e full disponível, link HTTPS verificável apenas estruturalmente; duas divergências opostas de mandante/visitante que se anulam no total; separação de métrica afetada; URL phishing; partidas de temporadas diferentes e futuras; deduplicação de confrontos; CSV com fórmula neutralizada; imutabilidade.
- Playwright desktop e layout Android: Agenda → jogo → Radar → abrir matriz 4×3 → ver partida com escanteio 1º tempo N/D → validar o único link original permitido → exportar CSV de uma pendência `PENDENTE` → comparar localStorage sem alterações → salvar previsão V2/V3 e recuperá-la idêntica; sem overflow.
- Não é teste Android físico, nem validação independente de resultado. A amostra prospectiva externa continua 0/30 por liga, desempenho N/D.

**Próximo passo:** executar QA de integração ponta a ponta com perfil temporário e, depois, quando autorizado, Android físico + fontes de resultados realmente conferidas; a produção, 659 partidas originais, Work, Radar V2/V3 e backups seguem intactos.

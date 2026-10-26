# FutStats IA — Etapa 63 · Linha histórica personalizada e igualdade

**26/10/2026.** Experimento DRAFT filho de #62. Produção, main, Vercel e dados pessoais intocados.

## Mudança útil
Na prévia Agenda → selecionar confronto → Radar, ao lado do comparador de linhas por período, nova seção recolhível **“Comparar linha personalizada · acima, abaixo ou igual”**. Permite escolher **gols, finalizações, chutes no alvo ou escanteios**, **jogo completo, primeiro ou segundo tempo**, e valor em passos de **0,5**, de 0 até 500.

Para linhas inteiras, o programa distingue três situações:
- **Acima (Over):** valor observado estritamente maior que a linha.
- **Abaixo (Under):** valor observado estritamente menor que a linha.
- **Igual (push):** resultado exatamente igual à linha, contado separadamente, não como Under nem Over.

Para limiares meio-inteiros, não haverá push porque as quatro métricas são contagens inteiras; frequências Over+Under devem totalizar a amostra. Uma linha inteira pode ter muitos jogos iguais, então Over+Under < N é legítimo e o painel informa o terceiro resultado em separado. Exemplo sintético: 10 partidas com 6 gols totais =1 e 4 gols totais =2; linha 1 → 4 Over / 0 Under / 6 iguais; linha 1,5 → 4 Over / 6 Under / 0 iguais.

## Política de dados
- Reutiliza `radarUpcoming` (até cinco históricos anteriores de cada equipe, mesma liga e temporada) e `auditedRadarMetricValues`/matriz 4×3: resultado de um período não é inventado a partir de outro.
- Filtra partidas conflitantes por data/origem e duplicatas por ID. Confere invariantes com `radarPeriodCoverage` e falha em caso de divergência de denominadores.
- `N/D` não é zero, não entra no denominador. Estatísticas contraditórias também ficam excluídas, sem corrigir a fonte.
- Contagens são mostradas mesmo em amostras pequenas, mas **percentuais são N/D se houver menos de cinco jogos válidos**. Não há ranking, probabilidades futuras, odds disponíveis ou novas recomendações V2/V3. Não altera os sinais/snapshots congelados no armazenamento.
- Nunca lê site esportivo, não renova calendário vencido, não importa CSV, não grava a linha personalizada ou altera a produção.

## Aceite
- Vitest: 10 jogos com push, linha 1,5 sem push; zero observado válido, amostra curta com percentuais N/D, ausência de jogos, exclusão de jogo futuro/de outra competição/duplicata, conflitos FT vs tempos, lacunas N/D, entrada negativa/decimal incompatível/NaN e imutabilidade.
- Playwright desktop e viewport Android: salvar histórico sintético, abrir prévia, ajustar linha inteira 3 com 10/10 iguais, linha 3,5 com 10/10 abaixo, mudar período, tentar linha inválida 0,25, garantir nenhuma escrita no armazenamento durante a prévia, salvar previsão, recuperá-la idêntica e verificar que tela não cresceu horizontalmente.
- Teste Android físico e comparação com resultados esportivos reais continuam pendentes.

**Meta:** fechar um ponto da área 06 (comparação de linhas), 7/8→8/8, **somente** se GitHub Actions estiver inteiramente verde no head do novo PR. A conclusão não mede eficácia preditiva e não implica autorização de merge ou deploy.

# FutStats IA — Etapa 38: protocolo de validação prospectiva de “As Boas do Dia”

**Natureza:** experimental; PR em rascunho; apenas Histórico principal, nunca Work misturado. Nenhum resultado real foi inferido de testes sintéticos.

## Evento elegível
1. O jogo deve integrar a shortlist de **hoje**, estar no futuro e ter referência oficial HTTPS datada com fuso Brasília; catálogo comunitário não qualifica.
2. O usuário seleciona a indicação em **As Boas do Dia** e, antes do kickoff, confirma **Salvar previsão** no Radar. Não registrar seleções apenas visualizadas.
3. No clique de salvar, atualizar a conferência da agenda e reavaliar se jogo, data, hora e todos os sinais permanecem iguais. Se divergir, bloquear a etiqueta "As Boas" e pedir nova seleção.
4. Gravar uma única vez no registro existente do Radar: `savedAt`, `matchAt`, campeonato, equipes, link oficial, `verifiedAt`, IDs de mercado, linha, direção V2/V3, projeção, média anterior, amostra histórica e da liga.
5. Não alterar registros antigos. Registros pré-existentes sem origem explícita continuam Radar geral e **não contam** como acertos de “As Boas”.

## Desfecho e integridade
- Considerar apenas resultados do jogo **correspondente** em competição/temporada, data e mandante/visitante; mais de um candidato, sinal duplicado ou divergência de data resulta em **ambíguo**.
- O resultado deve ter metadados CSV de origem, identificador próprio, URL HTTPS de fonte permitida, períodos consistentes, importação posterior ao jogo e proteção de pelo menos duas horas após kickoff. Isso verifica a **estrutura local**, não garante que o site ainda publique o mesmo conteúdo. Revalidação de fonte real continua pendente.
- Sem resultado, fonte ou indicador bilateral: **N/D**; nunca converter N/D em zero, erro ou acerto.
- Usar somente os mercados originalmente indicados na shortlist, sem selecionar retrospectivamente os vencedores.
- Comparar V2/V3 concordantes e baselines de **sempre Over** e direção da **média anterior congelada**, nos mesmos confrontos e mercados avaliáveis. Exibir numerador/denominador e campeonato. Para amostras inferiores a 20 sinais, **não** mostrar percentual como desempenho interpretável.
- Cada mercado pode estar correlacionado aos demais no mesmo confronto; não apresentar os sinais como observações independentes nem prometer ganhos, odds, chance de sucesso ou calibração.
- Testes automatizados usam somente **jogos sintéticos** para validar lógica e interface; não demonstram taxa de acerto real.

## Critérios para futuras decisões
- Recolher **pelo menos 30 confrontos prospectivos distintos por liga**, em múltiplas datas e com desfechos conferidos em fonte real, antes de qualquer recomendação de ajuste por liga; quantidades maiores podem ser necessárias conforme dispersão.
- Preservar os snapshots originais e registrar também todos os casos sem sinal, pendentes, excluídos e N/D para evitar viés de seleção.
- Só então estimar incerteza, comparar desempenho a referências fixas, rodar backtests cronológicos separados e debater eventuais ajustes. Qualquer modificação das heurísticas exige uma nova versão identificada e validação em dados não usados no ajuste.
- Enquanto a fonte não estiver independentemente conferida, usar o rótulo **“origem CSV documentada; conteúdo não revisado na web”**.

## Limitações / segurança
Nenhum scrape, processo em segundo plano, importação, merge, edição da produção, alteração de 659 partidas históricas, Radar V2/V3 ou dados Work. Backup V4 conserva o JSON original do Radar com campos adicionais; a restauração reconhece o novo campo opcional e preserva os registros anteriores. Verificar CI real e Android físico em etapas posteriores.

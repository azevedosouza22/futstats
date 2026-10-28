# FutStats IA — Próxima temporada: La Liga espanhola 2025/26 (Work)

**Situação de partida 28/10/2026:** a Premier League 2025/26 foi finalizada pelo
Work, com 380 jogos completos (CSV privado e ZIP em Drive/FutStats/Testes),
e não deve ser coletada novamente. A temporada La Liga 2026/27 também já tem
pesquisa própria; **não confundir com 2025/26**.

## Comando único para o navegador visual do ChatGPT Work

Continue o projeto FutStats IA, desta vez fazendo o levantamento integral da
**La Liga espanhola 2025/26**. Uma liga e temporada por execução.

1. Antes de navegar, consultar os checkpoints anteriores da mesma temporada em
   Google Drive/FutStats/Testes. Se houver um arquivo final já conferido,
   NÃO repetir a coleta. Os arquivos atuais da La Liga 2026/27 não são o alvo.
2. Reutilizar exatamente o método já aprovado:
   `research/la-liga-2026-27/coleta-integral-work.md`,
   `research/ligue-1-2026-27/coleta-integral-work.md` e
   `research/PLANO_UNICO_COLETA_TEMPORADAS_WORK.md`.
   Abrir pelo navegador visual os resultados da temporada 2025/26 em Flashscore,
   os jogos individuais e, através dos controles comuns visíveis da página,
   a aba de Estatísticas nos períodos **Jogo, 1º tempo e 2º tempo**.
   Se uma regra de acesso bloquear a página, NÃO contornar.
3. Identificar todos os confrontos efetivamente concluídos da edição 2025/26
   (380 previstos em 38 rodadas; confirmar status real), IDs e links originais.
   Por jogo, consultar separadamente **mandante/visitante**, gols,
   finalizações, chutes no alvo e escanteios nos três períodos.
4. Validar valores brutos realmente exibidos, 1T+2T=FT,
   mandante+visitante=total, alvo≤finalizações, IDs individuais,
   datas da página/título e consistência de equipe/rodada.
   Não criar números ausentes; registrar N/D e separar registros incompletos.
5. Usar checkpoints internos persistentes, preferencialmente a cada rodada
   ou grupos pequenos, com lista de IDs já completos. Não pedir que o usuário
   reinicie a tarefa ou envie um comando por rodada.
6. Entregar **um CSV UTF-8 BOM de 55 colunas**, idêntico ao padrão FutStats
   com somente os completos, arquivo separado de pendências e relatório
   objetivo com evidências de validação. Salvar novos arquivos privados em
   Google Drive/FutStats/Testes, sem sobrescrever nenhum original.
7. **Nenhuma importação automática:** a inserção posterior na pesquisa
   privada será feita apenas após auditoria do arquivo completo.
   Não alterar produção, `main`, 659 partidas do aparelho,
   as 1.019 pesquisas originais, as 380 PL 2025/26, Radar V2/V3,
   snapshots, backups ou previsões.

## Preparação técnica já disponível

O PR experimental de importação privada (`feat/v4-private-season-csv-ingestion`)
aceita CSV FutStats de uma temporada, faz checagem de completude e duplicações,
e mantém os pacotes somente no IndexedDB do navegador, fora do histórico
pessoal. O histórico exibido na Comparação continuará limitado por padrão às
duas edições mais recentes de cada competição; safras mais antigas poderão
ser selecionadas individualmente.

**Importante:** este documento prepara o próximo Work; **não diz que a
La Liga 2025/26 já foi baixada**.

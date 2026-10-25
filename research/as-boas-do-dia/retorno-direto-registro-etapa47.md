# FutStats IA — Etapa 47: da indicação à previsão salva, sem duplicações

**Data:** 25/10/2026. Alterações apenas no ramo experimental após PR #46. Nenhum merge, deploy, importação de novos resultados ou alteração da produção.

## Melhoria funcional para o usuário
Anteriormente, abrir “As Boas do Dia” depois de salvar uma previsão deixava o mesmo jogo novamente com o botão **Abrir Radar e conferir análise**. Na tela manual o FutStats já impedia salvar a segunda previsão, mas a pessoa precisava navegar por vários atalhos para recuperar a primeira. Agora a indicação verifica, em leitura, os registros realmente salvos no navegador e mostra o acesso **Ver previsão já registrada**, recuperando diretamente o registro congelado com foco de teclado/rolagem mesmo entre muitos jogos.

O sistema exibe casos distintos:
- **Sem previsão:** continua **Abrir Radar e conferir análise**; nunca salva automaticamente.
- **Indicação salva em As Boas:** mostra **Indicação já salva em As Boas · previsão original congelada**, somente se origem oficial, data verificada, lista de sinais V2/V3 e horário correspondem exatamente ao registro original salvo pré-jogo.
- **Previsão criada manualmente no Radar:** informa a existência do registro, mas **não** atribui retrospectivamente a seleção à lista de “As Boas”.
- **Horário/origem/sinais diferentes:** exige revisão do registro existente; não produz nova previsão e não presume que uma mudança de calendário valida a origem anterior.
- **Mais de um registro do mesmo confronto ou ID duplicado:** alerta para revisar duplicidades e não escolhe arbitrariamente um registro como verdadeiro.

O atalho leva à seção de previsões já salvas com filtro **Todos**, focando o registro exato quando há identidade única. Não recalcula sinais nem modifica dados, e preserva as cópias integrais.

## Restrições de segurança
- O vínculo usa data, campeonato, mandante e visitante normalizados, com checagem exata de horário, fonte oficial, data de verificação, sinais congelados e instante pré-jogo em Brasília. Uma previsão genérica nunca vira “Boa” apenas por ser da mesma partida.
- A navegação não gera novos resultados, não marca pontuação como acertada, não atualiza “verificado em” e não altera localStorage.
- O percurso não autoriza uso automático de “As Boas” em dias sem fonte oficial recente ou histórico suficiente.
- O recurso funciona na UI experimental; não foi instalado automaticamente no PWA de produção nem testado em aparelho Android físico.

## Critérios de aceite
- Testes unitários do reconciliador dos registros para casos de indicação original, Radar manual, previsão inexistente, horário divergente, sinais/snapshot adulterados, fonte vencida, múltiplas previsões e chaves duplicadas.
- Playwright reproduz o ciclo agenda → As Boas → Radar → salvar → voltar a As Boas → ver previsão existente, em desktop e viewport Android. O foco chega ao registro correto e o JSON de previsões segue idêntico, com somente um registro.

**Próxima ação proposta:** continuar fortalecendo o fluxo diário e tratar os impedimentos de utilização real com fonte oficial e amostra prospectiva auditada, mantendo bloqueios contra resultados inventados. As porcentagens do Controle Mestre representam entregáveis do projeto, não precisão estatística nem prontidão de produção.

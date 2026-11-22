# Contrato de dados F360 (sem reescrever histórico)

**Tipos de registro:** PREJOGO, POSJOGO, EXPERIMENTO, APOSTA_USUARIO, APROVACAO, CONTROLE.

**PREJOGO:** `registro_id` imutável, `jogo_id` da fonte e chaves de mandante/visitante, `data_evento_brt`, `inicio_utc`, `criado_utc`, `competicao`, `temporada`, `mercado`, `alvo` (mandante/visitante/ambos), `periodo` (FT/1T/2T), `direcao` Over/Under, `linha`, `projecao` e `versao` LV4/Elite/Radar, `decisao` SDD, `odd` opcional com origem/horario, `fonte` e `qualidade`. Sem previa gravada antes do início, não é previsão prospectiva.

**POSJOGO:** ID novo, `registro_prejogo_id` obrigatório (ou ausência justificada), `placar`, `valor_real`, estatísticas explícitas por equipe/período, `status` ACERTO/ERRO/ABSTER/VOID/N_D, `fonte_resultado` e `conferido_utc`. Nunca atualizar previsão original depois do jogo. Sem histórico comprovado antes do evento, separar como retrospectivo.

**APOSTA_USUARIO:** comprovante/identificador protegido, `valor_apostado`, `odd_executada`, `mercado`, `linha_executada`, `resultado_financeiro`, `moeda`. Não misturar com indicação teórica; nem expor imagens pessoais ou dados bancários.

**EXPERIMENTO:** registrar corte treino/teste, amostra, versão do método e do baseline, MAE/viés, acertos/erros e retorno apenas quando comprovado; registrar impacto em abstinências e resultados por mercado e FT/1T/2T. Não selecionar parâmetros com resultados de teste.

**APROVAÇÃO:** exige validação separada e aprovação do usuário, PR/commit e plano de reversão. Registro `ESTRATEGIAS.json.approved_strategies` só é atualizado após isso.

O índice não armazena dados brutos: aponta para artefatos imutáveis. Preservar IDs e CSV de pesquisa, sem deduplicação agressiva nem criação de zeros em campos N/D. O projeto Futebol não usa dados do Basquete/Hóquei para treinar previsões.

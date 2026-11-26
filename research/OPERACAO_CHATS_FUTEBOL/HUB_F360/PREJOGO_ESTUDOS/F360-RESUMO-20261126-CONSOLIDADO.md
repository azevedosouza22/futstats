# FUTSTATS F360 — CONSOLIDADO LV4/ELITE · 26/11/2026

**Registros documentais vinculados, criados antes dos jogos:**  
- Brasil: \`F360-PRE-20261126-SPFC-REMO\` · 26/11/2026 20h BRT.  
- Arábia Saudita: \`F360-PRE-20261126-ALFAYSALY-DIRIYAH\` · 26/11/2026 14h30 BRT **(agenda conflitante; confirmar realização)**.

**Resultado da matriz:** 2 confrontos de ligas cobertas, 24 indicadores (23 LV4 com linha, 1 ABSTER), 4 classificações Elite documentais provisórias (1 BR + 3 Saudi), 0 SELECIONAR. Outras 36 partidas UEFA Europa League/Conference League ABSTER por inexistência de histórico qualificado da competição.

## Brasil — São Paulo × Remo
- **Elite:** gols 1T Over 0,5, 9/10, média 1,9 gol, margem +1,4.
- 11 sinais LV4 com linha; gols 2T ABSTER.
- Base CP16 5.732 IDs, 10 jogos anteriores distintos; alias \`Brasileirão\` identificado em dois jogos recentes, conferidos 48 valores individuais, zero divergências.
- CBF: https://www.cbf.com.br/futebol-brasileiro/jogos/campeonato-brasileiro/serie-a/2026/sao-paulo-x-remo/832253.
- Detalhes: \`RELATORIO_LV4_ELITE_26NOV2026.md\`.

## Saudita — Al Faysaly × Al Diriyah
- **Elite:** escanteios 1T Over 2,5 (9/10); gols 2T Over 0,5 (9/10); escanteios 2T Over 2,5 (10/10).
- 12 sinais LV4 com linha, nenhum ABSTER numérico, porém todos **OBSERVAR CONDICIONADO**.
- A grafia \`Al Faysaly\` da CP16 foi corretamente relacionada a \`Al Faisaly\` na agenda; uma abstenção inicial por ausência de histórico foi **corrigida em registro independente**, sem modificar os sinais brasileiros já congelados.
- **Conflito:** [SPL oficial](https://www.spl.com.sa/en/fixtures-results) mantém a partida na programação, mas o [FotMob](https://www.fotmob.com/en-GB/teams/205687/fixtures/al-faisaly) sinaliza possível adiamento (\`PP\`). Antes de considerar qualquer entrada, confirmar que será disputada.
- Detalhes: \`RELATORIO_SAUDI_26NOV2026.md\`.

## Abstenções Europa
18 jogos Europa League e 18 Conference League hoje; base CP16 tem 2 jogos de Liga Europa e 0 de Conference, insuficientes para cinco jogos por time e mínimo de oito IDs. Arquivo \`EUROPA_36_ABSTENCOES.csv\` preserva a lista inteira e as fontes oficiais de agenda.

## Proveniência, riscos e controles
- Base original CP16: SHA-256 \`1982fbc1e074a6a722cc9947cc023ec2520a6df2321f31b366716590bbf35423\`. Aliases normalizados apenas para pesquisa em memória, sem escrita no CSV original.
- Reprodução documental da grade V4 \`src/radarV4LabToday.ts\` (commit \`6ef66d14a5d814d57dd59e552cf08983bc57d91a\`), não execução nativa homologada do motor oficial. Elite não é função nativa independente certificada.
- **Frequência histórica não é probabilidade calibrada.** Odds/bilhetes/ROI N/D; sem autorizar apostas. A cor verde identifica OBSERVAR, não certeza de sucesso.
- Coleta: conferir jogos realizados antes de publicar POSJOGO; se adiados, marcar ADIADO/CANCELADO e não ERRO. Auditar resultados regulamentares por FT/1T/2T. Work: paridade de implementação e estudo temporal.
- Estratégias formalmente aprovadas no HUB: 0. Preservados 659 jogos pessoais, V2/V3/V4, LV4/Elite, snapshots, produção e \`main\`; sem merge/deploy.

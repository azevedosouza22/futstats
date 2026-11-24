# F360 — CP16 — atualização de novembro concluída

Corte da consulta: 24/11/2026, manhã BRT. Pesquisa experimental; sem merge/deploy.

Base CP03: 5.675 → CP04 recuperado: 5.680 → CP16: 5.732 IDs únicos.
Cinco jogos recuperados, sem recoleta; 52 novas coletas desta sessão; 57 acréscimos desde CP03.

|Liga|Antes|Novos jogos|Total atualizado|Última data|
|---|---:|---:|---:|---|
|Brasileirão|351|8|359|2026-11-23|
|Argentina|497|5|502|2026-11-23|
|Bundesliga|83|7|90|2026-11-22|
|Eliteserien|209|7|216|2026-11-22|
|La Liga|123|6|129|2026-11-23|
|Liga Portugal|97|1|98|2026-11-08|
|Ligue 1|96|3|99|2026-11-22|
|MLS|517|3|520|2026-11-23|
|Premier League|101|9|110|2026-11-23|
|Saudi Pro League|105|0|105|2026-11-20|
|Serie A italiana|112|8|120|2026-11-23|

Contagens da tabela: temporadas correntes, com aliases de competição agrupados apenas no relatório; a base completa inclui temporadas anteriores e dois registros de Liga Europa.

## Conferência

243 IDs de resultados de novembro das 11 ligas comparados com a base; zero ausências restantes nesse recorte. As páginas consultadas continham jogos anteriores a novembro, confirmando que o recorte estava carregado até o início do mês. Liga Portugal: 98 resultados da temporada listados, 97 já presentes, Rio Ave–Braga adicionado; último resultado listado 08/11. Isso não constitui homologação de temporadas integrais ou auditoria de estatísticas antigas.

Base CP04: todos os 5.680 registros preservados integralmente. Base CP03: 5.675 registros preservados. CSV 55 colunas, 5.732 IDs únicos, zero duplicatas. Novos registros: somas por período/equipe conferidas; alvo ≤ finalizações.

Gimnasia L.P.–Newells (tMgLJeAF): FT regulamentar 2–2. Os oito valores FT90 foram calculados por 1T+2T e conferidos contra FT120 menos prorrogação. FT120 e prorrogação observados estão documentados no lote14; não contam como oito leituras diretas adicionais. Os demais 51 novos jogos desta sessão têm 24 valores observados diretamente.

Metadados: títulos não registrados individualmente em 40 coletas CP06–13 foram marcados N/D no CP16; data BRT exibida e os valores estatísticos foram preservados. Divergências UTC/BRT verificadas de três jogos MLS foram registradas explicitamente.

SHA256 base final: 1982fbc1e074a6a722cc9947cc023ec2520a6df2321f31b366716590bbf35423

## Entregas

Base: https://drive.google.com/file/d/1-FUmgwHUmiy6dUAJHqsY4uludBRjU3ue/view?usp=drivesdk

Pasta com bases, incrementais, lotes JSON e checkpoints CP04–CP16: https://drive.google.com/drive/folders/1skWfiAdLW3n8gzUr1GTK5A8FL0MVaui6

Preservados 659 jogos pessoais, modelos LV4/Elite, Radar V2/V3/V4, app e produção. Somente documentação na branch experimental.

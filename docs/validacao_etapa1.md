# Validação da etapa 1 — Frisco, Celina, Plano, Wylie, Parker

Gerado em 2026-11-23 por `scripts/validar.py`.

Cada linha compara o valor gravado na base com o valor relido direto do arquivo bruto da fonte, por um caminho de código separado do coletor. Isso prova que a base reproduz a fonte; não prova que a fonte está certa — essa parte é a sua conferência, com o que você conhece dessas cidades.

| Unidade | Dado | Na base | Na fonte (releitura) | Confere? | Trecho bruto / como conferir |
|---|---|---:|---:|:-:|---|
| Celina × Celina ISD | Renda mediana (ACS) | 170894.0 | 170894.0 | sim | `1600000US4813684|170894|12592` |
| Celina × Celina ISD | Valor mediano do imóvel (ACS) | 509600.0 | 509600.0 | sim | `1600000US4813684|509600|46875` |
| Celina × Celina ISD | População (ACS) | 34268.0 | 34268.0 | sim | `1600000US4813684|34268|32` |
| Celina × Celina ISD | Permits unifamiliares 2025 (BPS) | 2489 | 2489 | sim | `2025,48,117500,085,0775,13684 ,00000 ,20005 ,206,19100,2, ,75009      ,3,7,12,Celina,2489,…` coluna 1-unit Units |
| Celina × Celina ISD | Valor típico da casa (ZHVI) | 499751 | 499751 | sim | última coluna do CSV, linha Celina / Collin County |
| Celina × Celina ISD | Valorização 5 anos (ZHVI) | 6.0 | 6.0 | sim | 471601 → 499751 |
| Celina × Celina ISD | Nota do ISD 2026 (TEA) | 85 | 85 | sim | 043903 CELINA ISD: B 85 |
| Celina × Celina ISD | Minutos até Downtown Dallas (OSRM) | 54.3 | 54.3 | sim | nova consulta pelo endpoint /route (o coletor usa /table) |
| Celina × Celina ISD | % da área em zona de alagamento (FEMA) | 12.9 | — | sem 2ª via | calculado por interseção de polígonos; conferir no visualizador msc.fema.gov |
| Celina × Celina ISD | Coberta pela SB 15 | nao | — | regra | lei vigente desde 2025-09-01. texto conferido na data de referência; população base 2020: 17.099 |
| Celina × Prosper ISD | Renda mediana (ACS) | 170894.0 | 170894.0 | sim | `1600000US4813684|170894|12592` |
| Celina × Prosper ISD | Valor mediano do imóvel (ACS) | 509600.0 | 509600.0 | sim | `1600000US4813684|509600|46875` |
| Celina × Prosper ISD | População (ACS) | 34268.0 | 34268.0 | sim | `1600000US4813684|34268|32` |
| Celina × Prosper ISD | Permits unifamiliares 2025 (BPS) | 2489 | 2489 | sim | `2025,48,117500,085,0775,13684 ,00000 ,20005 ,206,19100,2, ,75009      ,3,7,12,Celina,2489,…` coluna 1-unit Units |
| Celina × Prosper ISD | Valor típico da casa (ZHVI) | 499751 | 499751 | sim | última coluna do CSV, linha Celina / Collin County |
| Celina × Prosper ISD | Valorização 5 anos (ZHVI) | 6.0 | 6.0 | sim | 471601 → 499751 |
| Celina × Prosper ISD | Nota do ISD 2026 (TEA) | 91 | 91 | sim | 043912 PROSPER ISD: A 91 |
| Celina × Prosper ISD | Minutos até Downtown Dallas (OSRM) | 53.7 | 53.7 | sim | nova consulta pelo endpoint /route (o coletor usa /table) |
| Celina × Prosper ISD | % da área em zona de alagamento (FEMA) | 11.2 | — | sem 2ª via | calculado por interseção de polígonos; conferir no visualizador msc.fema.gov |
| Celina × Prosper ISD | Coberta pela SB 15 | nao | — | regra | lei vigente desde 2025-09-01. texto conferido na data de referência; população base 2020: 17.099 |
| Frisco × Frisco ISD | Renda mediana (ACS) | 150212.0 | 150212.0 | sim | `1600000US4827684|150212|6821` |
| Frisco × Frisco ISD | Valor mediano do imóvel (ACS) | 642100.0 | 642100.0 | sim | `1600000US4827684|642100|10137` |
| Frisco × Frisco ISD | População (ACS) | 219304.0 | 219304.0 | sim | `1600000US4827684|219304|67` |
| Frisco × Frisco ISD | Permits unifamiliares 2025 (BPS) | 1090 | 1090 | sim | `2025,48,246500,085,1540,27684 ,00000 ,128993 ,206,19100,2, ,75034      ,3,7,12,Frisco,1090…` coluna 1-unit Units |
| Frisco × Frisco ISD | Valor típico da casa (ZHVI) | 626532 | 626532 | sim | última coluna do CSV, linha Frisco / Collin County |
| Frisco × Frisco ISD | Valorização 5 anos (ZHVI) | 14.5 | 14.5 | sim | 546997 → 626532 |
| Frisco × Frisco ISD | Nota do ISD 2026 (TEA) | 91 | 91 | sim | 043905 FRISCO ISD: A 91 |
| Frisco × Frisco ISD | Minutos até Downtown Dallas (OSRM) | 36.6 | 36.6 | sim | nova consulta pelo endpoint /route (o coletor usa /table) |
| Frisco × Frisco ISD | % da área em zona de alagamento (FEMA) | 5.8 | — | sem 2ª via | calculado por interseção de polígonos; conferir no visualizador msc.fema.gov |
| Frisco × Frisco ISD | Coberta pela SB 15 | sim | — | regra | lei vigente desde 2025-09-01. texto conferido na data de referência; população base 2020: 200.531; vale só para gleba >= 5 acres, sem plat, zoneada unifamiliar |
| Frisco × Lewisville ISD | Renda mediana (ACS) | 150212.0 | 150212.0 | sim | `1600000US4827684|150212|6821` |
| Frisco × Lewisville ISD | Valor mediano do imóvel (ACS) | 642100.0 | 642100.0 | sim | `1600000US4827684|642100|10137` |
| Frisco × Lewisville ISD | População (ACS) | 219304.0 | 219304.0 | sim | `1600000US4827684|219304|67` |
| Frisco × Lewisville ISD | Permits unifamiliares 2025 (BPS) | 1090 | 1090 | sim | `2025,48,246500,085,1540,27684 ,00000 ,128993 ,206,19100,2, ,75034      ,3,7,12,Frisco,1090…` coluna 1-unit Units |
| Frisco × Lewisville ISD | Valor típico da casa (ZHVI) | 626532 | 626532 | sim | última coluna do CSV, linha Frisco / Collin County |
| Frisco × Lewisville ISD | Valorização 5 anos (ZHVI) | 14.5 | 14.5 | sim | 546997 → 626532 |
| Frisco × Lewisville ISD | Nota do ISD 2026 (TEA) | 83 | 83 | sim | 061902 LEWISVILLE ISD: B 83 |
| Frisco × Lewisville ISD | Minutos até Downtown Dallas (OSRM) | 34.2 | 34.2 | sim | nova consulta pelo endpoint /route (o coletor usa /table) |
| Frisco × Lewisville ISD | % da área em zona de alagamento (FEMA) | 17.7 | — | sem 2ª via | calculado por interseção de polígonos; conferir no visualizador msc.fema.gov |
| Frisco × Lewisville ISD | Coberta pela SB 15 | sim | — | regra | lei vigente desde 2025-09-01. texto conferido na data de referência; população base 2020: 200.531; vale só para gleba >= 5 acres, sem plat, zoneada unifamiliar |
| Frisco × Little Elm ISD | Renda mediana (ACS) | 150212.0 | 150212.0 | sim | `1600000US4827684|150212|6821` |
| Frisco × Little Elm ISD | Valor mediano do imóvel (ACS) | 642100.0 | 642100.0 | sim | `1600000US4827684|642100|10137` |
| Frisco × Little Elm ISD | População (ACS) | 219304.0 | 219304.0 | sim | `1600000US4827684|219304|67` |
| Frisco × Little Elm ISD | Permits unifamiliares 2025 (BPS) | 1090 | 1090 | sim | `2025,48,246500,085,1540,27684 ,00000 ,128993 ,206,19100,2, ,75034      ,3,7,12,Frisco,1090…` coluna 1-unit Units |
| Frisco × Little Elm ISD | Valor típico da casa (ZHVI) | 626532 | 626532 | sim | última coluna do CSV, linha Frisco / Collin County |
| Frisco × Little Elm ISD | Valorização 5 anos (ZHVI) | 14.5 | 14.5 | sim | 546997 → 626532 |
| Frisco × Little Elm ISD | Nota do ISD 2026 (TEA) | 78 | 78 | sim | 061914 LITTLE ELM ISD: C 78 |
| Frisco × Little Elm ISD | Minutos até Downtown Dallas (OSRM) | 42.5 | 42.5 | sim | nova consulta pelo endpoint /route (o coletor usa /table) |
| Frisco × Little Elm ISD | % da área em zona de alagamento (FEMA) | 4.3 | — | sem 2ª via | calculado por interseção de polígonos; conferir no visualizador msc.fema.gov |
| Frisco × Little Elm ISD | Coberta pela SB 15 | sim | — | regra | lei vigente desde 2025-09-01. texto conferido na data de referência; população base 2020: 200.531; vale só para gleba >= 5 acres, sem plat, zoneada unifamiliar |
| Frisco × Prosper ISD | Renda mediana (ACS) | 150212.0 | 150212.0 | sim | `1600000US4827684|150212|6821` |
| Frisco × Prosper ISD | Valor mediano do imóvel (ACS) | 642100.0 | 642100.0 | sim | `1600000US4827684|642100|10137` |
| Frisco × Prosper ISD | População (ACS) | 219304.0 | 219304.0 | sim | `1600000US4827684|219304|67` |
| Frisco × Prosper ISD | Permits unifamiliares 2025 (BPS) | 1090 | 1090 | sim | `2025,48,246500,085,1540,27684 ,00000 ,128993 ,206,19100,2, ,75034      ,3,7,12,Frisco,1090…` coluna 1-unit Units |
| Frisco × Prosper ISD | Valor típico da casa (ZHVI) | 626532 | 626532 | sim | última coluna do CSV, linha Frisco / Collin County |
| Frisco × Prosper ISD | Valorização 5 anos (ZHVI) | 14.5 | 14.5 | sim | 546997 → 626532 |
| Frisco × Prosper ISD | Nota do ISD 2026 (TEA) | 91 | 91 | sim | 043912 PROSPER ISD: A 91 |
| Frisco × Prosper ISD | Minutos até Downtown Dallas (OSRM) | 39.0 | 39.0 | sim | nova consulta pelo endpoint /route (o coletor usa /table) |
| Frisco × Prosper ISD | % da área em zona de alagamento (FEMA) | 7.5 | — | sem 2ª via | calculado por interseção de polígonos; conferir no visualizador msc.fema.gov |
| Frisco × Prosper ISD | Coberta pela SB 15 | sim | — | regra | lei vigente desde 2025-09-01. texto conferido na data de referência; população base 2020: 200.531; vale só para gleba >= 5 acres, sem plat, zoneada unifamiliar |
| Parker × Allen ISD | Renda mediana (ACS) | 229080.0 | 229080.0 | sim | `1600000US4855152|229080|45246` |
| Parker × Allen ISD | Valor mediano do imóvel (ACS) | 859600.0 | 859600.0 | sim | `1600000US4855152|859600|88083` |
| Parker × Allen ISD | População (ACS) | 5999.0 | 5999.0 | sim | `1600000US4855152|5999|23` |
| Parker × Allen ISD | Permits unifamiliares 2025 (BPS) | 61 | 61 | sim | `2025,48,536500,085,3197,55152 ,00000 ,5442 ,206,19100, , ,75002      ,3,7,12,Parker,61,61,…` coluna 1-unit Units |
| Parker × Allen ISD | Valor típico da casa (ZHVI) | 1082153 | 1082153 | sim | última coluna do CSV, linha Parker / Collin County |
| Parker × Allen ISD | Valorização 5 anos (ZHVI) | 21.7 | 21.7 | sim | 889099 → 1082153 |
| Parker × Allen ISD | Nota do ISD 2026 (TEA) | 90 | 90 | sim | 043901 ALLEN ISD: A 90 |
| Parker × Allen ISD | Minutos até Downtown Dallas (OSRM) | 35.7 | 35.7 | sim | nova consulta pelo endpoint /route (o coletor usa /table) |
| Parker × Allen ISD | % da área em zona de alagamento (FEMA) | 1.7 | — | sem 2ª via | calculado por interseção de polígonos; conferir no visualizador msc.fema.gov |
| Parker × Allen ISD | Coberta pela SB 15 | nao | — | regra | lei vigente desde 2025-09-01. texto conferido na data de referência; população base 2020: 5.459 |
| Parker × Plano ISD | Renda mediana (ACS) | 229080.0 | 229080.0 | sim | `1600000US4855152|229080|45246` |
| Parker × Plano ISD | Valor mediano do imóvel (ACS) | 859600.0 | 859600.0 | sim | `1600000US4855152|859600|88083` |
| Parker × Plano ISD | População (ACS) | 5999.0 | 5999.0 | sim | `1600000US4855152|5999|23` |
| Parker × Plano ISD | Permits unifamiliares 2025 (BPS) | 61 | 61 | sim | `2025,48,536500,085,3197,55152 ,00000 ,5442 ,206,19100, , ,75002      ,3,7,12,Parker,61,61,…` coluna 1-unit Units |
| Parker × Plano ISD | Valor típico da casa (ZHVI) | 1082153 | 1082153 | sim | última coluna do CSV, linha Parker / Collin County |
| Parker × Plano ISD | Valorização 5 anos (ZHVI) | 21.7 | 21.7 | sim | 889099 → 1082153 |
| Parker × Plano ISD | Nota do ISD 2026 (TEA) | 85 | 85 | sim | 043910 PLANO ISD: B 85 |
| Parker × Plano ISD | Minutos até Downtown Dallas (OSRM) | 41.2 | 41.2 | sim | nova consulta pelo endpoint /route (o coletor usa /table) |
| Parker × Plano ISD | % da área em zona de alagamento (FEMA) | 12.2 | — | sem 2ª via | calculado por interseção de polígonos; conferir no visualizador msc.fema.gov |
| Parker × Plano ISD | Coberta pela SB 15 | nao | — | regra | lei vigente desde 2025-09-01. texto conferido na data de referência; população base 2020: 5.459 |
| Plano × Frisco ISD | Renda mediana (ACS) | 112253.0 | 112253.0 | sim | `1600000US4858016|112253|3281` |
| Plano × Frisco ISD | Valor mediano do imóvel (ACS) | 465900.0 | 465900.0 | sim | `1600000US4858016|465900|4919` |
| Plano × Frisco ISD | População (ACS) | 290594.0 | 290594.0 | sim | `1600000US4858016|290594|98` |
| Plano × Frisco ISD | Permits unifamiliares 2025 (BPS) | 138 | 138 | sim | `2025,48,553500,085,3310,58016 ,00000 ,285110 ,206,19100,2,1,750860358  ,3,7,12,Plano,138,1…` coluna 1-unit Units |
| Plano × Frisco ISD | Valor típico da casa (ZHVI) | 484787 | 484787 | sim | última coluna do CSV, linha Plano / Collin County |
| Plano × Frisco ISD | Valorização 5 anos (ZHVI) | 14.3 | 14.3 | sim | 423988 → 484787 |
| Plano × Frisco ISD | Nota do ISD 2026 (TEA) | 91 | 91 | sim | 043905 FRISCO ISD: A 91 |
| Plano × Frisco ISD | Minutos até Downtown Dallas (OSRM) | 36.1 | 36.1 | sim | nova consulta pelo endpoint /route (o coletor usa /table) |
| Plano × Frisco ISD | % da área em zona de alagamento (FEMA) | 4.7 | — | sem 2ª via | calculado por interseção de polígonos; conferir no visualizador msc.fema.gov |
| Plano × Frisco ISD | Coberta pela SB 15 | sim | — | regra | lei vigente desde 2025-09-01. texto conferido na data de referência; população base 2020: 285.465; vale só para gleba >= 5 acres, sem plat, zoneada unifamiliar |
| Plano × Lewisville ISD | Renda mediana (ACS) | 112253.0 | 112253.0 | sim | `1600000US4858016|112253|3281` |
| Plano × Lewisville ISD | Valor mediano do imóvel (ACS) | 465900.0 | 465900.0 | sim | `1600000US4858016|465900|4919` |
| Plano × Lewisville ISD | População (ACS) | 290594.0 | 290594.0 | sim | `1600000US4858016|290594|98` |
| Plano × Lewisville ISD | Permits unifamiliares 2025 (BPS) | 138 | 138 | sim | `2025,48,553500,085,3310,58016 ,00000 ,285110 ,206,19100,2,1,750860358  ,3,7,12,Plano,138,1…` coluna 1-unit Units |
| Plano × Lewisville ISD | Valor típico da casa (ZHVI) | 484787 | 484787 | sim | última coluna do CSV, linha Plano / Collin County |
| Plano × Lewisville ISD | Valorização 5 anos (ZHVI) | 14.3 | 14.3 | sim | 423988 → 484787 |
| Plano × Lewisville ISD | Nota do ISD 2026 (TEA) | 83 | 83 | sim | 061902 LEWISVILLE ISD: B 83 |
| Plano × Lewisville ISD | Minutos até Downtown Dallas (OSRM) | 27.6 | 27.6 | sim | nova consulta pelo endpoint /route (o coletor usa /table) |
| Plano × Lewisville ISD | % da área em zona de alagamento (FEMA) | 6.3 | — | sem 2ª via | calculado por interseção de polígonos; conferir no visualizador msc.fema.gov |
| Plano × Lewisville ISD | Coberta pela SB 15 | sim | — | regra | lei vigente desde 2025-09-01. texto conferido na data de referência; população base 2020: 285.465; vale só para gleba >= 5 acres, sem plat, zoneada unifamiliar |
| Plano × Plano ISD | Renda mediana (ACS) | 112253.0 | 112253.0 | sim | `1600000US4858016|112253|3281` |
| Plano × Plano ISD | Valor mediano do imóvel (ACS) | 465900.0 | 465900.0 | sim | `1600000US4858016|465900|4919` |
| Plano × Plano ISD | População (ACS) | 290594.0 | 290594.0 | sim | `1600000US4858016|290594|98` |
| Plano × Plano ISD | Permits unifamiliares 2025 (BPS) | 138 | 138 | sim | `2025,48,553500,085,3310,58016 ,00000 ,285110 ,206,19100,2,1,750860358  ,3,7,12,Plano,138,1…` coluna 1-unit Units |
| Plano × Plano ISD | Valor típico da casa (ZHVI) | 484787 | 484787 | sim | última coluna do CSV, linha Plano / Collin County |
| Plano × Plano ISD | Valorização 5 anos (ZHVI) | 14.3 | 14.3 | sim | 423988 → 484787 |
| Plano × Plano ISD | Nota do ISD 2026 (TEA) | 85 | 85 | sim | 043910 PLANO ISD: B 85 |
| Plano × Plano ISD | Minutos até Downtown Dallas (OSRM) | 30.7 | 30.7 | sim | nova consulta pelo endpoint /route (o coletor usa /table) |
| Plano × Plano ISD | % da área em zona de alagamento (FEMA) | 8.2 | — | sem 2ª via | calculado por interseção de polígonos; conferir no visualizador msc.fema.gov |
| Plano × Plano ISD | Coberta pela SB 15 | sim | — | regra | lei vigente desde 2025-09-01. texto conferido na data de referência; população base 2020: 285.465; vale só para gleba >= 5 acres, sem plat, zoneada unifamiliar |
| Wylie × Community ISD | Renda mediana (ACS) | 119522.0 | 119522.0 | sim | `1600000US4880356|119522|6369` |
| Wylie × Community ISD | Valor mediano do imóvel (ACS) | 387000.0 | 387000.0 | sim | `1600000US4880356|387000|8163` |
| Wylie × Community ISD | População (ACS) | 60334.0 | 60334.0 | sim | `1600000US4880356|60334|742` |
| Wylie × Community ISD | Permits unifamiliares 2025 (BPS) | 231 | 231 | sim | `2025,48,774500,085,4705,80356 ,00000 ,52309 ,206,19100,2, ,75098      ,3,7,12,Wylie,231,23…` coluna 1-unit Units |
| Wylie × Community ISD | Valor típico da casa (ZHVI) | 404365 | 404365 | sim | última coluna do CSV, linha Wylie / Collin County |
| Wylie × Community ISD | Valorização 5 anos (ZHVI) | 6.1 | 6.1 | sim | 381102 → 404365 |
| Wylie × Community ISD | Nota do ISD 2026 (TEA) | 80 | 80 | sim | 043918 COMMUNITY ISD: B 80 |
| Wylie × Community ISD | Minutos até Downtown Dallas (OSRM) | 50.3 | 50.3 | sim | nova consulta pelo endpoint /route (o coletor usa /table) |
| Wylie × Community ISD | % da área em zona de alagamento (FEMA) | 46.2 | — | sem 2ª via | calculado por interseção de polígonos; conferir no visualizador msc.fema.gov |
| Wylie × Community ISD | Coberta pela SB 15 | nao | — | regra | lei vigente desde 2025-09-01. texto conferido na data de referência; população base 2020: 57.539 |
| Wylie × Wylie ISD | Renda mediana (ACS) | 119522.0 | 119522.0 | sim | `1600000US4880356|119522|6369` |
| Wylie × Wylie ISD | Valor mediano do imóvel (ACS) | 387000.0 | 387000.0 | sim | `1600000US4880356|387000|8163` |
| Wylie × Wylie ISD | População (ACS) | 60334.0 | 60334.0 | sim | `1600000US4880356|60334|742` |
| Wylie × Wylie ISD | Permits unifamiliares 2025 (BPS) | 231 | 231 | sim | `2025,48,774500,085,4705,80356 ,00000 ,52309 ,206,19100,2, ,75098      ,3,7,12,Wylie,231,23…` coluna 1-unit Units |
| Wylie × Wylie ISD | Valor típico da casa (ZHVI) | 404365 | 404365 | sim | última coluna do CSV, linha Wylie / Collin County |
| Wylie × Wylie ISD | Valorização 5 anos (ZHVI) | 6.1 | 6.1 | sim | 381102 → 404365 |
| Wylie × Wylie ISD | Nota do ISD 2026 (TEA) | 92 | 92 | sim | 043914 WYLIE ISD: A 92 |
| Wylie × Wylie ISD | Minutos até Downtown Dallas (OSRM) | 42.0 | 42.0 | sim | nova consulta pelo endpoint /route (o coletor usa /table) |
| Wylie × Wylie ISD | % da área em zona de alagamento (FEMA) | 11.6 | — | sem 2ª via | calculado por interseção de polígonos; conferir no visualizador msc.fema.gov |
| Wylie × Wylie ISD | Coberta pela SB 15 | nao | — | regra | lei vigente desde 2025-09-01. texto conferido na data de referência; população base 2020: 57.539 |

## Resultado

104 comparações, **0 divergências**.

Nenhum valor da base difere do arquivo bruto da fonte.

## O que este teste não cobre

- Dados de nível cidade (ACS, BPS, ZHVI) são repetidos em todas as unidades da mesma cidade; a fatia de cada ISD pode ser bem diferente da média da cidade.
- Alagamento (FEMA) não tem segunda via automática.
- 19 dos 26 critérios não têm dado nessas cidades (veja `data/pendencias.csv`).
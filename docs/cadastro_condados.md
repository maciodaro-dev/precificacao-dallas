
## Collin (Collin CAD) — testado, completo
- Serviço oficial: https://services2.arcgis.com/uXyoacYrZTPTKD3R/arcgis/rest/services/CCAD_Parcel_Feature_Set/FeatureServer/4 (441.840 lotes, dados de 2026-10-23, rol em andamento de 2027; polígonos; 2.000 por página).
- Arquivos: `parcels_with_appraisal_data_R5.zip` (170 MB) e `LiteDatabaseCurrent.zip` (86 MB), ligados em https://collincad.org/category/gis-downloads/ (não baixados por inteiro).
- Lote vago residencial: `propCategoryCode` = `C1` com `propSubType` = `Land`: 28.257 (C1 total 33.080; 4.823 são comerciais).
- Ficam de fora: `D1` agrícola (6.078), `D2` (1.018), `E` rural (6.450), C1 comercial (4.823). Não há categoria de estoque de construtora nesta camada.
- Campos: `landSizeAcres`, `landSizeSqft`, `situsCity`, `situsZip`; valor do ano corrente vem vazio (rol em andamento): usar `prevValLand` (2026).
- Uso: "para uso público, fins informativos".

## Dallas (DCAD) — fonte oficial inacessível daqui
- O site www.dallascad.org derruba a conexão em todas as tentativas; os arquivos oficiais não puderam ser testados.
- Alternativa (a), atual mas parcial: camada da Prefeitura de Dallas, https://gis.dallascityhall.com/arcgis/rest/services/Basemap/DallasTaxParcels/FeatureServer/0 (ano 2026; só a cidade de Dallas e 1 milha em volta, cerca de 60% do condado).
- Alternativa (b), condado inteiro mas de 2025 e não oficial: cópia pública do arquivo estadual de 2025 feita por terceiro, https://services.arcgis.com/6dxqrE38upDMg1va/arcgis/rest/services/Dallas_Co_Parcels/FeatureServer/0 (694.160 lotes; pode sair do ar).
- Lote vago residencial: `SPTBCODE` / `STAT_LAND_` = `C11` (lotes e áreas vagas de casa): 29.699 no condado em 2025.
- Ficam de fora: `C12` vago comercial (24.589), `C13` vago industrial (1.990), `C14` rural vago com menos de 5 acres (1.086), `O10` estoque de construtora (3.118), `D10` agrícola (2.231).

## Denton (Denton CAD) — testado, completo
- Serviço do condado com dados do CAD: https://gis.dentoncounty.gov/arcgis/rest/services/Parcels_FC/MapServer/0 (385.908 lotes, rol em andamento de 2027; polígonos).
- Lote vago residencial: `stateCodes` = `C1` (campo com vários códigos separados por vírgula): 35.779, mais 3.033 "C1,PLAN".
- Ficam de fora: `C2` (4.171, provável vago comercial, sem descrição), `C3` (1.383), `D1` agrícola (6.157), `E4` rural (7.514). Sem código de construtora entre os mais frequentes.
- Campos: `legalAcreage`, `land_sqft`, `situsCity`, `situsZip`, `cityTaxingUnitName`, `exemptions`.

## Rockwall (Rockwall CAD) — testado, com ressalva
- Contorno oficial dos lotes: https://services6.arcgis.com/9DACe4o4mozvuNJW/arcgis/rest/services/rockwall_parcels/FeatureServer/0 (57.173; só o identificador).
- Código de uso: só numa cópia do cadastro publicada pela Prefeitura de McLendon-Chisholm (não oficial, pode ficar desatualizada): https://services1.arcgis.com/xP7qm9UK33sxaaxK/arcgis/rest/services/Rockwall_County_Parcels/FeatureServer/0 (56.243 lotes, valores de 2026).
- Lote vago residencial: `statecd` = `C1` (5.484), mais `C3` lotes fora de cidade (472), `C4` com vista para a água (47), `C5` à beira d'água (49).
- Ficam de fora: `C2` comercial (662), `O1` estoque de construtora (589), `D1` agrícola (721), `E4` rural (218).

## Vale para todos
- O código C1 não é limpo: inclui áreas comuns de condomínio, faixas verdes e lotes de drenagem (descrição legal com "COMMON AREA", "LOT CA-1", valor de terra de US$ 50 a 100). É preciso filtrar por valor de terra, isenção e palavras na descrição legal.
- Collin, Denton e Rockwall já mostram o rol de 2027 em andamento; os valores fechados são os de 2026.

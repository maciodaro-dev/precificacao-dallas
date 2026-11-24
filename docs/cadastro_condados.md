<<<<<<< HEAD

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
=======
# Cadastro de terrenos dos condados — levantamento das fontes (em andamento, 2026-11-24)

Nada foi coletado nem usado ainda. Este arquivo registra o que foi testado, condado a condado, para o usuário aprovar antes do uso.
Fonte estadual (TxGIO StratMap Land Parcels, versão 2026-09-25): o servidor de arquivos devolveu HTTP 403 e o serviço de mapas está com consultas desligadas.

## Tarrant (TAD) — testado, completo
- Serviço: https://tad.newedgeservices.com/arcgis/rest/services/InteractiveMap/TADMap/MapServer/0 (703.336 lotes, ano 2026, polígonos, 2.000 por página, estatísticas funcionam).
- Arquivos: https://www.tad.org/content/data-download/PropertyData(Delimited)_R.ZIP (51 MB, certificado 2026, texto com `|`) e https://www.tad.org/content/gis-data/Parcels.zip (111 MB, 2026-07-30). Junção: `GIS_Link` = `TAXPIN`.
- Lote vago residencial: `PropertyUseCode` / `State_Use_Code` = `C1` ("VACANT LAND RESIDENTIAL"): 41.742 lotes.
- Ficam de fora: `O` estoque de construtora (14.119), `D1` terra agrícola com avaliação especial (3.852), `E`/`EC` rural não agrícola (1.381), `C2` vago comercial (1.284), `X` isentos/públicos.
- Campos: `LandTotalSqft`, `ACRES`, `LandValue`, `ImprovementValue`, `SitusAddress` (sem nome da cidade).

## Johnson (JCAD) — testado, completo
- Serviço: https://jcadgis.johnsoncad.com/arcgis/rest/services/Public_Map_Parcels/MapServer/1 (103.589 lotes, ano 2026).
- Arquivos: https://johnsoncad.com/wp-content/uploads/2026/08/BATCH_896.all_.zip (45 MB, rol certificado de 2026-08-10) e https://johnsoncad.com/wp-content/uploads/2026/03/2026-03-10.zip (GIS). Junção: `GEO ACCOUNT NUM` = `GIS` (4.985 de 4.987 lotes C1 casaram).
- Lote vago residencial: `LAND PTD` / `PTDLand` = `C1`: 4.987 no rol.
- Ficam de fora: `O1` estoque vago de construtora (1.531), `D1`/`D3` agrícola (9.316), `E4` rural não agrícola vago (3.359), `C2` vago comercial (802), `C3` (7.036, descrição truncada no arquivo: "Mostly Resi", a conferir), `X..` isentos.
- Tamanho: `LAND SQFT` vem zerado em parte dos lotes; há tabela de acreagem para completar.

## Parker (Parker CAD) — parcial
- O site parkercad.org recusa acesso automático (403). Serviço público do mapa: https://services.arcgis.com/79g1H99xInKSRRK3/arcgis/rest/services/ParkerCADWebService/FeatureServer/0 (102.287 lotes, rol de trabalho de 2027, não o certificado).
- **Sem código de uso do solo.** Só há uma aproximação: sem benfeitoria e com valor de terra (14.899 lotes; 3.919 dentro de cidade), que não separa lote residencial de comercial, de construtora ou público.

## Wise (Wise CAD) — sem fonte confirmada
- O site é um portal que carrega os arquivos por um serviço do fornecedor; não foi possível testar. O mapa antigo só tem o contorno dos lotes, sem código nem tamanho.
>>>>>>> e1143f302f65923b8157c79aa30d9f546e54fdf8

## Kaufman (Kaufman CAD) — testado, completo
- Rol certificado de 2026 (exportado em 2026-07-17): https://kaufman-cad.org/wp-content/uploads/2026/07/2026-Certified-Export-Files.zip (72 MB, texto de largura fixa PACS; leiaute em https://kaufman-cad.org/wp-content/uploads/2026/04/Appraisal-Export-Layout-8.0.33-2026.xlsx). `land_state_cd` nas colunas 2742–2751; `legal_acreage` 1660–1675; situs 1040–1149; linhas válidas têm 9.714 caracteres.
- Contorno dos lotes: https://services9.arcgis.com/26s7bQ5Q51Gt4J2Q/arcgis/rest/services/KaufmanCADWebService/FeatureServer/0 (100.687 lotes, rol de trabalho de 2027; sem código de uso; junção por `prop_id`).
- Lote vago residencial: `C1` na cidade (2.737), `C1H` na cidade com condomínio (475), `C3` fora de cidade (2.087), `C3H` fora de cidade com condomínio (837): cerca de 6.136.
- Ficam de fora: `OL` terra de estoque de construtora sem benfeitoria (7.419), `D1` agrícola (7.265), `E5` rural não desenvolvido (3.509), `C2` vago comercial (1.028), `M2` área pública, isentos `X..`.

## Hunt (Hunt CAD) — testado, mas o rol com códigos é de 2024
- Rol certificado de 2024 (exportado em 2025-06-24) numa pasta pública do SharePoint ligada no portal de dados do distrito (https://hunt-cad-open-data-hunt-cad.hub.arcgis.com/); exige o cookie do link de compartilhamento. Não há rol de 2025 ou 2026 público: seria preciso pedir ao distrito.
- Contorno dos lotes: https://services3.arcgis.com/GIIiqmeq0npieHV9/arcgis/rest/services/Hunt_CAD_Parcel_Data/FeatureServer/4 (70.995; só `PROP_ID`). Endereço: CSV "2024 Certified Property Info" do portal.
- Lote vago residencial: `C1` "lote vago em cidade ou rural/residencial (loteamentos)": 10.008 propriedades (2024).
- Ficam de fora: `O` estoque (617), `O2` loteamento não desenvolvido (3), `C3` vago comercial (1.110), `D1` agrícola (13.590), `E4` terra não qualificada como agrícola (3.513).

## Ellis (Ellis CAD) — arquivos oficiais inacessíveis daqui
- Rol de 2026 e arquivos de mapa estão no Google Drive do distrito (ligados em https://www.elliscad.com/appraisal-data-export e /gis-data); todos os downloads devolveram "cota excedida". Mesmo leiaute PACS de Kaufman; a lista de códigos de Ellis não foi vista.
- Alternativa que funciona: cópia publicada pela Prefeitura de Red Oak, https://services7.arcgis.com/URKkSE6MsjA926qB/arcgis/rest/services/Ellis_County_Parcel_Ownership/FeatureServer/0 (101.505 lotes, valores de 2026, atualizada por volta de 2026-08-20). **Sem código de uso do solo.**
- Aproximação possível: sem benfeitoria e com valor de terra (17.928); com até 2 acres (12.544); com número de lote (10.002). O campo `marketarea` ajuda a tirar comercial (1.463), área comum de condomínio (983), isentos (352) e ruas (147). Não separa agrícola nem estoque de construtora.

## NCTCOG — não há fonte regional de lotes
- Só existe o mapa de uso do solo de 2020, em manchas (não lote a lote). Serve no máximo como conferência grosseira.

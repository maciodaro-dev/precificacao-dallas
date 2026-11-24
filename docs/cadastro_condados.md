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

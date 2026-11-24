# Idiomas da interface

O site pode ser usado em português (origem), inglês, espanhol e hindi. O seletor fica no cabeçalho; a escolha fica guardada no navegador.

## Como funciona
- Os componentes continuam escritos em português. Uma camada entre o JSX e o React (`app/src/i18n/jsx-runtime.ts`) passa todo texto de tela por `tr()` antes de desenhar.
- `app/src/i18n/en.json`, `es.json` e `hi.json` mapeiam o texto em português para cada idioma. Texto com números usa marcadores: "atende {0} de {1}".
- Frases com nomes próprios no meio (distritos escolares, condados) são traduzidas por padrões em `app/src/i18n/index.ts`.
- Texto sem tradução aparece em português.

## O que não é traduzido
- "Groundwork" e "by CSD Tools" (grafia fixa).
- Nomes de cidades, condados e distritos escolares.
- Dados da base: observações das fontes, nomes das fontes, premissas e pendências.
- Arquivos exportados (.xlsx, .csv).
- Formato dos números (continua no padrão brasileiro: 1.234,5).

## Para incluir um texto novo
1. Escrever o texto em português no componente, normalmente.
2. Rodar a coleta (`scratchpad/coleta.cjs` nesta sessão; ver o histórico) ou acrescentar a chave à mão nos três arquivos JSON.
3. O teste `app/src/i18n/i18n.test.ts` confere que os três dicionários têm as mesmas chaves e os mesmos marcadores.

## Limitações conhecidas
- As traduções foram feitas por máquina e conferidas só por amostra. O hindi, em especial, precisa da revisão de um falante.
- Algumas frases são montadas em pedaços (texto + número + texto). Em hindi, que tem outra ordem de palavras, parte delas lê de forma pouco natural.

---
versao: V1
tipo: melhoria
area: cases / SDR
---

# Cases — Forçar SDR sempre buscar

## Situação atual (MVP)
O Chairman (`gpt-5.4-mini`) decide sozinho se chama ou não o SDR (`gpt-4o-mini-search-preview`).
Com `tool_choice: 'auto'`, ele tende a gerar cases do próprio treinamento sem acionar a busca na web.
O resultado é bom, mas limitado ao conhecimento de treino — sem cases recentes ou muito específicos.

## Melhoria proposta
Forçar o SDR a sempre buscar cases na web, independente do Chairman já ter uma resposta do treinamento.

**Por quê:** O Chairman com mais opções (5-7 cases reais e recentes) seleciona melhor. Hoje ele escolhe com o que tem; com o SDR sempre ativo, ele escolhe com o que é melhor.

## Como implementar
Mudar `tool_choice: 'auto'` para uma chamada obrigatória antes da resposta final:

1. **Opção A — tool_choice forçado**
   Trocar `tool_choice: 'auto'` por `tool_choice: { type: 'function', function: { name: 'search_cases' } }` no primeiro turno. O Chairman é obrigado a chamar o SDR antes de responder.

2. **Opção B — dois estágios explícitos**
   - Etapa 1: Chairman analisa o problema e gera o brief de busca (sem resposta final)
   - Etapa 2: SDR busca e retorna cases
   - Etapa 3: Chairman recebe os cases e gera a resposta completa
   Mais controle, mais custo.

## Trade-off
- Latência aumenta (toda resposta espera o SDR)
- Custo aumenta (toda sessão chama o SDR)
- Qualidade dos cases melhora consistentemente

## Recomendação
Implementar Opção A quando o produto sair do MVP e a base de usuários justificar o custo extra por sessão.

# MZnet — Input Layer (Backlog de Implementação)

> **Status:** Planejado — não implementado ainda  
> **Contexto:** Agente Comercial MZnet (Claudinho) — FastAPI + OpenAI, deploy no Cloud Run  
> **Objetivo:** Criar camada de pré-processamento de input ANTES da lógica do agente, tolerante a erro humano real sem depender exclusivamente do LLM

---

## O que já existe hoje (não remover)

| Módulo | Situação atual | Onde está |
|---|---|---|
| Normalização de texto | Existe, mas duplicada em 4 arquivos | `_normalize()` em check_condominio, check_coverage, geocode_address, classify_address |
| Fuzzy matching | Levenshtein + word-level (condomínio), Levenshtein + Jaccard (bairro) | `check_condominio.py`, `check_coverage.py` |
| Extração de endereço | Regex extrai `rua + número` | `_extract_addresses()` em `agent.py` |
| Confidence score | `match_score` float (0.0–1.0) | Retorno de `check_condominio` e `check_coverage` |
| Pre-validação | Injeta resultados reais antes do LLM | `_inject_pre_validation()` em `agent.py` |

**Gaps críticos para o público-alvo (idosos, baixa literacia, áudio):**
- `"r adhemar 45 ns aparecida"` — regex atual não extrai bairro standalone
- `"ademaar"` — fuzzy genérico funciona, mas sem dicionário de erros conhecidos o score cai
- Sem ambiguidade estruturada: se dois candidatos têm score parecido, pega o primeiro silenciosamente

---

## Arquitetura proposta

```
[INPUT BRUTO DO USUÁRIO]
        ↓
┌─────────────────────────────────────────┐
│           INPUT LAYER                   │
│                                         │
│  M1: Text Normalization                 │
│  M2: Abbreviation Expansion             │
│  M3: Human Error Dictionary             │
│  M4: Entity Extraction                  │
│  M5: Fuzzy Matching (centralizado)      │
│  M6: Confidence Scoring                 │
│  M7: Ambiguity Handling                 │
│  M8: Audio Transcript Tolerance         │
│  M9: Structured Output Contract         │
│  M10: Logging for Learning              │
└─────────────────────────────────────────┘
        ↓
[_inject_pre_validation() — lógica de negócio]
        ↓
[Loop LLM]
```

**Regra de ouro:** A Input Layer NUNCA decide viabilidade, plano, ou executa handoff. Só limpa, normaliza, extrai e pontua confiança.

---

## Estrutura de pastas

```
tools/
  input_layer/
    __init__.py
    normalizer.py        # M1
    abbreviations.py     # M2
    error_dict.py        # M3
    extractor.py         # M4
    fuzzy.py             # M5 (centraliza o que hoje está duplicado)
    confidence.py        # M6
    ambiguity.py         # M7
    audio.py             # M8
    contract.py          # M9 — tipos e contrato de output
    logger.py            # M10
    config.py            # thresholds configuráveis por entidade
  tests/
    test_input_layer.py
```

---

## Módulo 1 — Text Normalization

**Função pura, sem efeitos colaterais.**

```python
def normalize(text: str) -> str:
    # 1. lowercase
    # 2. remove acentos (unicodedata NFD)
    # 3. expande abreviações (delegar para M2)
    # 4. remove pontuação irrelevante (preserva números)
    # 5. colapsa espaços múltiplos
    # 6. strip
```

Exemplos esperados:
- `"Rua Adhemar, nº 45"` → `"rua adhemar 45"`
- `"Sta. Terezinha"` → `"santa terezinha"`
- `"João  Paulo"` → `"joao paulo"`
- `"R. Adhemar"` → `"rua adhemar"`

---

## Módulo 2 — Abbreviation Expansion

**Dicionário configurável em `config.py`.**

```python
ABBREVIATIONS = {
    "r":    "rua",
    "av":   "avenida",
    "sta":  "santa",
    "sto":  "santo",
    "jd":   "jardim",
    "vl":   "vila",
    "pq":   "parque",
    "ns":   "nossa senhora",
    "n s":  "nossa senhora",
    "prof": "professor",
    "dr":   "doutor",
    "dra":  "doutora",
    "pe":   "padre",
    "cel":  "coronel",
    "ten":  "tenente",
    "gen":  "general",
    "dep":  "deputado",
    "pres": "presidente",
    "s":    "são",        # cuidado: só no início de bairro/rua
}
```

**Regra de aplicação:** só expande no início da string ou após separadores. Não substituir dentro de palavras (ex: "ns" em "anseio" não vira "nossa senhora").

---

## Módulo 3 — Human Error Dictionary

**Arquivo JSON simples, crescimento incremental com dados de produção.**

```json
{
  "erros_conhecidos": {
    "ademaar":      "adhemar",
    "ademar":       "adhemar",
    "pinhero":      "pinheiro",
    "aparecidaa":   "aparecida",
    "tiberi":       "tibery",
    "tibery":       "tibery",
    "umuaramaa":    "umuarama",
    "luizoti":      "luizote",
    "saraivaa":     "saraiva",
    "custodio":     "custodio pereira",
    "sta monika":   "santa monica",
    "sta monica":   "santa monica",
    "jd brasilia":  "jardim brasilia",
    "jd karaiba":   "jardim karaiba"
  }
}
```

**Fluxo de consulta:** antes do fuzzy. Se achar no dicionário → aplica diretamente com confidence=high, sem passar pelo Levenshtein.

**Como alimentar:** todo erro confirmado em produção (quando usuário corrige ou operador confirma) deve ser registrado aqui pelo M10.

---

## Módulo 4 — Entity Extraction

**Extrai do texto livre:**

| Entidade | Regex / heurística | Fallback |
|---|---|---|
| Rua | `(rua\|av\|avenida\|...) NOME [,\s] NUMERO` | LLM nomeia campo |
| Número | `\d{1,5}` após logradouro | número isolado no contexto |
| Bairro | `bairro\|b/\|no NOME` | vizinhança da rua no geocoding |
| Complemento | `bloco\|torre\|apto\|ap\|andar` + identificador | pergunta ao usuário |
| Nome próprio | após `me chamo\|meu nome\|sou o/a\|aqui é` | LLM extrai |
| Intenção | palavra-chave de intenção (quero, preciso, verificar, contratar) | LLM classifica |

**Output parcial é válido:** retornar o que foi extraído com flags dos campos ausentes.

---

## Módulo 5 — Fuzzy Matching (centralizado)

**Unifica o que hoje está duplicado em check_condominio e check_coverage.**

```python
def fuzzy_match(
    query: str,
    candidates: list[str],
    threshold: float,        # vem de config.py por tipo de entidade
    max_results: int = 3,
) -> FuzzyResult:
    # retorna: best_match, score, alternatives[], confidence_level
```

**Algoritmo:** Levenshtein global (60%) + fuzzy word-level (40%) — já implementado, só centralizar.

**Thresholds por entidade** (ver Módulo 6 + config.py).

---

## Módulo 6 — Confidence Scoring

**Três níveis com lógica composta:**

```
HIGH   (≥ threshold_high)  → segue sem confirmação
MEDIUM (threshold_low a threshold_high) → segue se contexto consistente, senão confirma
LOW    (< threshold_low)   → obrigatoriamente confirma com usuário
```

**Fatores que compõem o score:**
1. Score do fuzzy match (peso principal)
2. Presença de número no endereço (+bonus de consistência)
3. Encontrado no dicionário de erros (→ HIGH direto)
4. Número de candidatos com score parecido (muitos candidatos → penaliza)
5. Consistência rua + bairro (se ambos matcham → bonus)
6. Completude do input (endereço completo → bonus)

---

## Módulo 7 — Ambiguity Handling

**Quando dois ou mais candidatos têm score dentro de margem aceitável:**

```python
{
  "status": "needs_confirmation",
  "field": "street",
  "candidates": [
    {"value": "Rua Adhemar de Barros", "score": 0.87},
    {"value": "Rua Adhemar Pereira", "score": 0.84},
  ],
  "reason": "multiple_high_similarity_matches"
}
```

**Margem de ambiguidade:** se `score_2 / score_1 > 0.93` → ambíguo. Configurável em `config.py`.

---

## Módulo 8 — Audio Transcript Tolerance

**Heurísticas para transcrições ruins:**

- Remover palavras duplicadas consecutivas (`"rua rua adhemar"` → `"rua adhemar"`)
- Tratar separação ruim (`"ruaadhemar"` → tenta split por logradouro conhecido)
- Ignora ruído conversacional (`"oi amigo olha"`, `"então né"`) antes de extrair entidade
- Lista de prefixos de ruído a ignorar (configurável)

**Upgrade futuro:** matching fonético (Soundex/Metaphone em português).

---

## Módulo 9 — Structured Output Contract

**Toda passagem pela Input Layer retorna este objeto:**

```python
@dataclass
class InputLayerResult:
    raw_input: str
    normalized_input: str
    extracted_entities: ExtractedEntities
    interpretation_status: Literal[
        "resolved",
        "partially_resolved",
        "needs_confirmation",
        "unresolved"
    ]
    issues: list[str]        # ex: ["street_ambiguous", "number_missing"]
    notes: list[str]         # ex: ["abbreviation_expanded: ns→nossa senhora"]
    processing_time_ms: int

@dataclass
class ExtractedEntities:
    street:      EntityField | None
    number:      NumberField | None
    neighborhood: EntityField | None
    complement:  str | None
    person_name: EntityField | None

@dataclass
class EntityField:
    raw:          str
    normalized:   str
    candidate:    str
    confidence:   Literal["high", "medium", "low"]
    alternatives: list[str]
    score:        float
```

---

## Módulo 10 — Logging for Learning

**Registra em arquivo JSONL (append-only):**

```json
{
  "ts": "2026-04-06T14:32:00Z",
  "session_id": "abc123",
  "raw_input": "rua ademaar 45 ns aparecida",
  "normalized": "rua adhemar 45 nossa senhora aparecida",
  "entities": { "street": "adhemar", "number": "45", "neighborhood": "nossa senhora aparecida" },
  "candidates": [{"value": "Rua Adhemar de Freitas Macedo", "score": 0.82}],
  "confidence": "medium",
  "confirmed_by_user": true,
  "correction_applied": null
}
```

**Objetivo:** alimentar M3 (Error Dictionary) e ajustar thresholds de M6 com dados reais.

---

## Config — Thresholds por entidade

```python
# config.py — todos configuráveis, nenhum hardcoded sem explicação

THRESHOLDS = {
    "rua": {
        "high":   0.85,   # Ruas têm nomes longos → match alto = seguro
        "low":    0.68,   # Abaixo disso confirma — nomes de rua são críticos operacionalmente
        "ambiguity_margin": 0.93,  # ratio score_2/score_1 para declarar ambiguidade
    },
    "bairro": {
        "high":   0.80,   # Bairros são nomes curtos — score 0.80 já é muito bom
        "low":    0.65,   # Abaixo confirma — bairro errado redireciona o lead errado
        "ambiguity_margin": 0.92,
    },
    "nome_proprio": {
        "high":   0.90,   # Nome errado em handoff é problema sério — exige score alto
        "low":    0.75,
        "ambiguity_margin": 0.95,
    },
    "intencao": {
        "high":   0.70,   # Intenção tem menos variação possível — threshold mais baixo ok
        "low":    0.50,
        "ambiguity_margin": 0.90,
    },
}
```

**Por que esses valores:**
- `rua` tem threshold baixo mais alto (0.68) porque um erro de rua manda técnico no endereço errado — risco real
- `bairro` é mais tolerante porque tem lista fechada (76 bairros), score 0.65 já discrimina bem
- `nome_proprio` é conservador porque aparece no contrato e na comunicação com cliente
- `intencao` é mais liberal porque o vocabulário de intenção é pequeno e repetível

---

## Tabela operacional

| Situação | Ação |
|---|---|
| confidence=HIGH, sem ambiguidade | Resolve sozinho, segue |
| confidence=HIGH, com ambiguidade (ratio > margem) | Pede confirmação com opções |
| confidence=MEDIUM, contexto consistente (rua+bairro batem) | Resolve e nota no log |
| confidence=MEDIUM, contexto inconsistente | Pede confirmação |
| confidence=LOW | Obrigatoriamente confirma com usuário |
| input_status=unresolved (sem nenhuma entidade extraída) | Pergunta de forma aberta ao usuário |
| dois erros consecutivos de confirmação | Escala para humano |

---

## Testes a implementar

### Casos simples
- `"Rua Adhemar 45"` → resolved, high confidence
- `"Jardim Karaíba"` → resolved, bairro correto

### Grafia errada leve
- `"Rua Ademar 45"` → candidate: Adhemar, medium/high via error dict

### Grafia errada severa
- `"rua addhemar quarenta e sinco"` → unresolved ou low, pede confirmação

### Múltiplos candidatos parecidos
- `"rua adhemar"` → needs_confirmation se duas ruas "Adhemar X" e "Adhemar Y" com scores próximos

### Input incompleto
- `"é na adhemar"` → partially_resolved, street=medium, number=null

### Abreviação
- `"r adhemar 45 ns aparecida"` → expande para "rua adhemar 45 nossa senhora aparecida"

### Ruído conversacional
- `"oi amigo queria ver se pega internet la na rua adhemar num sei o numero ainda"` → extrai rua=adhemar, number=null, intenção=verificar_cobertura

### Áudio ruim
- `"rua rua adhemar perto da pracinha"` → deduplica, extrai rua=adhemar

### Texto correto mas perigoso
- `"Rua Adhemar, 165"` → match com INVIAVEL no JSON — correto na extração, resultado negativo na viabilidade (não confundir os dois)

---

## O que NÃO está no escopo da Input Layer

- Decidir viabilidade → responsabilidade do `check_condominio` / `check_coverage`
- Executar handoff → responsabilidade do agente
- Responder ao usuário → responsabilidade do LLM
- Armazenar estado de sessão → responsabilidade do `LeadContext`

---

*Criado em: 2026-04-06 | Projeto: Agente Comercial MZnet*

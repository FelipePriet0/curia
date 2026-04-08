# MZnet — Matriz de Erros Humanos

> **Contexto:** Agente Comercial Claudinho — público com baixa literacia digital, idosos, inputs via WhatsApp e transcrição de áudio  
> **Objetivo:** Mapear os erros mais prováveis por categoria, risco operacional e estratégia de tratamento

---

## Categoria 1 — Digitação

Erros de tecla, pressa, autocorrect.

| Exemplo real | Intenção provável | Risco operacional | Estratégia | Confirmar? |
|---|---|---|---|---|
| `"ademaar"` | Adhemar | Médio — fuzzy pode resolver | Error dict → fuzzy | Não se HIGH |
| `"adheamr"` | Adhemar | Médio | Levenshtein | Não se HIGH |
| `"umuarma"` | Umuarama | Baixo — bairro em lista fechada | Levenshtein | Não |
| `"tiberi"` | Tibery | Baixo | Error dict + Levenshtein | Não |
| `"luizoti"` | Luizote | Baixo | Levenshtein | Não |
| `"aparecidaa"` | Aparecida | Baixo | Error dict | Não |
| `"rua adhemar 4 5"` | número 45 | Médio — número partido | Normalizar: colapsar dígitos separados | Não |
| `"pinhero"` | Pinheiro | Médio | Error dict | Não |

**Threshold recomendado:** rua ≥ 0.80 HIGH, bairro ≥ 0.75 HIGH  
**Lógica:** digitação troca 1–2 caracteres — Levenshtein captura bem. Error dict captura os recorrentes.

---

## Categoria 2 — Abreviação

Abreviações regionais e comuns no WhatsApp.

| Exemplo real | Expansão correta | Risco operacional | Estratégia | Confirmar? |
|---|---|---|---|---|
| `"r adhemar 45"` | Rua Adhemar, 45 | Alto — regex atual não captura sem "rua" | Expansão M2 antes do regex | Não após expansão |
| `"av rondon 4600"` | Av. Rondon Pacheco, 4600 | Baixo — "av" expandido | Expansão M2 | Não |
| `"ns aparecida"` | Nossa Senhora Aparecida | Alto — bairro não reconhecido sem expansão | Expansão M2 | Não após expansão |
| `"jd karaiba"` | Jardim Karaíba | Médio | Expansão M2 + Levenshtein | Não |
| `"sta monica"` | Santa Mônica | Médio | Error dict + expansão | Não |
| `"dr carlos 20"` | Rua Doutor Carlos..., 20 | Alto — pode falhar sem tipo de logradouro | Expansão + inferir tipo | Sim se ambíguo |
| `"prof jose 300"` | Rua Professor José..., 300 | Alto | Expansão M2 | Sim se múltiplos candidatos |

**Threshold recomendado:** após expansão, aplicar threshold normal da entidade  
**Lógica:** abreviação não é erro — é convenção. Tratar antes do fuzzy, não como fuzzy.

---

## Categoria 3 — Fonética

O usuário escreve como ouve ou como pronuncia.

| Exemplo real | Intenção provável | Risco operacional | Estratégia | Confirmar? |
|---|---|---|---|---|
| `"sao jorg"` | São Jorge | Baixo | Levenshtein | Não |
| `"tiburina"` | Tubalina | Médio — som parecido, bairro diferente | Fuzzy + error dict | Sim |
| `"grambear"` | Grand Ville? | Alto — interpretação fonética ambígua | Low confidence → confirma | Sim obrigatório |
| `"jaragua"` | Jaraguá | Baixo | Levenshtein + normalização sem acento | Não |
| `"copacabana"` | Copacabana | Nenhum — bairro real | Match direto | Não |
| `"osvaldo resende"` | Osvaldo Rezende | Médio | Levenshtein | Não se HIGH |
| `"nossa sinhor aparecida"` | Nossa Senhora Aparecida | Médio | Fuzzy word-level | Não se HIGH |

**Threshold recomendado:** fonética requer word_fuzzy_score ≥ 0.75 para HIGH (sons parecidos geram falsos positivos)  
**Lógica:** erro fonético tende a acertar início da palavra e errar meio/fim — Levenshtein puro funciona. Word-level fuzzy ajuda em nomes compostos.

---

## Categoria 4 — Endereço Incompleto

Usuário passa só parte do endereço.

| Exemplo real | O que falta | Risco operacional | Estratégia | Confirmar? |
|---|---|---|---|---|
| `"é na adhemar"` | Número, tipo de logradouro, bairro | Alto — não dá para localizar | Extrai rua=adhemar, pede número | Sim — número obrigatório |
| `"moro perto do park shopping"` | Rua, número | Alto | Geocode pelo ponto de referência (futuro) | Sim |
| `"rua adhemar no aparecida"` | Número | Alto | Extrai rua + bairro, pede número | Sim |
| `"bloco b torre 3"` | Rua, condomínio, número | Alto | Só complemento → pede endereço base | Sim |
| `"é no 450"` | Rua, bairro | Alto — número sem rua é inútil | Pede rua | Sim |
| `"aqui no karaiba"` | Rua, número | Médio — bairro extraído | Extrai bairro, pede rua+número | Sim |
| `"rua das palmeiras"` | Número | Médio | Extrai rua (candidate), pede número | Sim |

**Threshold recomendado:** input incompleto → sempre `partially_resolved` → nunca tentar validar sem número  
**Lógica:** número é obrigatório para check_condominio e para identificar unidade. Sem ele, a validação de endereço é impossível.

---

## Categoria 5 — Ambiguidade

Input que pode ser interpretado de mais de uma forma.

| Exemplo real | Ambiguidade | Risco operacional | Estratégia | Confirmar? |
|---|---|---|---|---|
| `"rua adhemar"` | Pode haver mais de uma rua Adhemar | Alto — lead vai para endereço errado | Retorna candidatos, pede escolha | Sim se score_2/score_1 > 0.93 |
| `"aparecida"` | Bairro Aparecida ou Nossa Senhora Aparecida? | Médio | Verificar se ambos na lista, apresentar opções | Sim |
| `"jardim brasilia"` | Jardim Brasília ou Jardim Brasília 3? | Médio | Apresentar as duas opções | Sim |
| `"rua david"` | Rua David Canabarro ou outra? | Alto | Candidates + pede número para desambiguar | Sim |
| `"é na karaiba"` | Bairro Karaíba ou Jardim Karaíba? | Médio | Ambos na lista → confirma | Sim |
| `"adhemar 165"` | Sem tipo de logradouro | Baixo — contexto sugere rua | Infere logradouro + HIGH se único match | Não se único candidato |

**Threshold recomendado:** `ambiguity_margin = score_2 / score_1 > 0.93` → needs_confirmation  
**Lógica:** margem de 7% entre candidatos é suficiente para ser "o melhor". Abaixo disso, o sistema está chutando.

---

## Categoria 6 — Transcrição de Áudio

Input vindo de STT (Speech-to-Text) com qualidade variada.

| Exemplo real | Intenção provável | Risco operacional | Estratégia | Confirmar? |
|---|---|---|---|---|
| `"rua rua adhemar quarenta e cinco"` | Rua Adhemar, 45 | Médio | Deduplica "rua rua", converte por extenso para dígito | Não |
| `"rua ademar perto da pracinha"` | Rua Adhemar | Médio | Remove ruído contextual, extrai rua | Não se HIGH |
| `"eu moro na bairro luizote"` | Luizote | Baixo | Normaliza "na bairro" → "bairro", extrai | Não |
| `"quarenta cinco"` | 45 | Alto — número por extenso | Converter por extenso → dígito (dicionário) | Não após conversão |
| `"quinhentos"` | 500 | Médio | Idem | Não após conversão |
| `"rua doutor carlos marengo pereyra filhoo vinte"` | Rua Doutor Carlos Marengo Pereira Filho, 20 | Baixo — captura apesar dos erros | Levenshtein word-level | Não se HIGH |
| `"tiburina tiburina"` | Tubalina | Médio — duplicação por pausa de áudio | Deduplica, fuzzy | Sim se baixo score |

**Threshold recomendado:** áudio → aplicar normalização extra (deduplica, converte extenso) antes do fuzzy. Threshold igual à entidade.  
**Lógica:** a maioria dos erros de STT são léxicos (troca de palavra parecida), não fonéticos profundos. Levenshtein e error dict cobrem bem.

**Números por extenso — dicionário mínimo:**
```
um → 1, dois → 2, três → 3, quatro → 4, cinco → 5,
seis → 6, sete → 7, oito → 8, nove → 9, dez → 10,
vinte → 20, trinta → 30, quarenta → 40, cinquenta → 50,
cem → 100, duzentos → 200, trezentos → 300, quatrocentos → 400,
quinhentos → 500, seiscentos → 600, setecentos → 700,
oitocentos → 800, novecentos → 900, mil → 1000
```

---

## Categoria 7 — Nomes Próprios

Nomes de pessoas no momento do handoff.

| Exemplo real | Intenção provável | Risco operacional | Estratégia | Confirmar? |
|---|---|---|---|---|
| `"me chamo joao"` | João | Médio — nome incompleto | Aceita, pede sobrenome se necessário | Não para conversa |
| `"sou a maria rezende"` | Maria Rezende | Baixo | Extrai nome próprio | Não |
| `"juliana sousa santos"` | Juliana Sousa Santos | Nenhum — completo | Aceita direto | Não |
| `"me chama de ze"` | José (apelido) | Alto — apelido no cadastro | Registra apelido, solicita nome completo para handoff | Sim — handoff exige nome formal |
| `"thiago"` (só primeiro nome) | Thiago X | Médio — handoff sem sobrenome | Aceita para conversa, pede completo no handoff | Sim — no momento do handoff |
| `"MARIA APARECIDA DA SILVA"` | Maria Aparecida da Silva | Nenhum | Normaliza caixa | Não |

**Threshold recomendado:** nome_proprio: high=0.90, low=0.75 — conservador porque aparece no contrato  
**Lógica:** erro no nome causa problema com a equipe de instalação. Melhor confirmar do que corrigir depois.

---

## Categoria 8 — Bairros e Ruas Parecidos

Pares que confundem o sistema e o usuário.

| Par problemático | Risco | Estratégia | Confirmar? |
|---|---|---|---|
| Aparecida ↔ Nossa Senhora Aparecida | Alto — dois bairros distintos na lista | Apresentar ambos | Sim |
| Jardim Brasília ↔ Jardim Brasília 3 | Alto — cobertura diferente | Apresentar ambos | Sim |
| Karaíba ↔ Jardim Karaíba | Médio — ambos cobertos | Apresentar ambos | Sim |
| Luizote ↔ Luizote 4 | Alto — cobertura pode diferir | Verificar se os dois estão na lista, confirmar | Sim |
| Custódio Pereira ↔ Custódio | Médio | Normalizar "custodio" → match "custodio pereira" | Não se único match HIGH |
| Tibery ↔ Tiburina (inventada) | Médio | Error dict + Levenshtein | Não se score >= 0.80 |
| Rua Adhemar de Freitas Macedo ↔ Rua Adhemar Pereira | Alto — prédios diferentes, statuses diferentes | Ambiguity handler obrigatório | Sim |

**Regra especial para pares conhecidos:**  
Criar lista de pares ambíguos conhecidos em `config.py`. Quando qualquer candidato do par aparecer na query, forçar `needs_confirmation` independente do score.

```python
AMBIGUOUS_PAIRS = [
    ("Aparecida", "Nossa Senhora Aparecida"),
    ("Jardim Brasília", "Jardim Brasília 3"),
    ("Karaíba", "Jardim Karaíba"),
    ("Luizote", "Luizote 4"),
]
```

---

## Tabela Operacional — Quando o sistema faz o quê

| Situação | Ação do sistema |
|---|---|
| confidence=HIGH, 1 candidato, sem par ambíguo conhecido | Resolve sozinho |
| confidence=HIGH, found no error dict | Resolve sozinho (mais seguro que fuzzy) |
| confidence=MEDIUM, rua+bairro consistentes | Resolve e loga para revisão |
| confidence=MEDIUM, rua+bairro inconsistentes | Pede confirmação da rua ou do bairro |
| confidence=LOW | Pede confirmação obrigatória |
| Ambiguidade (ratio > margem) | Apresenta candidatos e pede escolha |
| Par ambíguo conhecido detectado | Apresenta os dois sempre, sem exceção |
| Número ausente | Pede número — nunca valida sem ele |
| Entidade não extraída (unresolved) | Pergunta de forma aberta |
| 2+ erros consecutivos de confirmação | Escala para operador humano |
| Input de áudio com número por extenso | Converte → normaliza → processa normalmente |

---

## Thresholds — Explicação de cada valor

### `rua` — high=0.85, low=0.68
- **Por que 0.85:** rua errada manda técnico no endereço errado. Score 0.85 = diferença de 1–2 caracteres em nome longo. Aceitável sem confirmação.
- **Por que 0.68:** abaixo de 0.68 o match já é duvidoso mesmo para nomes com erros severos. Melhor confirmar.
- **Risco de baixar:** falsos positivos — "Rua Adhemar" matchando "Rua Ademilson" com score 0.67.

### `bairro` — high=0.80, low=0.65
- **Por que 0.80:** bairros são palavras curtas — score 0.80 já é bastante restritivo. Levenshtein funciona bem.
- **Por que 0.65:** lista fechada de 76 bairros. Abaixo de 0.65 provavelmente não é nenhum dos cadastrados.
- **Risco de subir:** rejeitar bairros com erros moderados ("luizote" vs "Luizote" — sem acento score cai).

### `nome_proprio` — high=0.90, low=0.75
- **Por que 0.90:** nome aparece no contrato. Erro aqui é problema com cliente.
- **Por que 0.75:** aceitar variações comuns (apelido, forma reduzida) para conversa, mas exigir confirmação.
- **Nota:** para handoff, exigir nome completo independente do score.

### `intencao` — high=0.70, low=0.50
- **Por que 0.70:** vocabulário de intenção é pequeno e repetível. "Quero contratar" vs "quer contratar" = mesma intenção.
- **Por que 0.50:** abaixo de 0.50 o texto é genuinamente ambíguo. Pede clarificação.
- **Risco:** intenção errada muda completamente o fluxo do agente.

### `ambiguity_margin` — rua=0.93, bairro=0.92, nome=0.95
- **O que significa:** se `score_candidato_2 / score_candidato_1 > margem` → ambíguo.
- **Por que 0.93 para rua:** diferença de 7% entre candidatos já justifica confirmar. Ruas são críticas.
- **Por que 0.92 para bairro:** lista fechada, menos candidatos parecidos — 8% de margem suficiente.
- **Por que 0.95 para nome:** nomes próprios têm variações legítimas (Maria vs Maria Aparecida) — margem mais apertada.

---

*Criado em: 2026-04-06 | Projeto: Agente Comercial MZnet | Para implementar junto com Input Layer*

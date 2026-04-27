# CURIA — Migração Tipográfica v3 (Fraunces editorial-tech)

Instruções pra aplicar a nova tipografia no projeto Next.js.

## 📁 Arquivos a substituir

```
app/src/app/layout.tsx       → Substituir pelo novo layout.tsx
app/src/app/globals.css      → Substituir pelo novo globals.css
```

## 🎯 O que muda

### Tipografia

| Antes (v2) | Depois (v3) |
|---|---|
| Eczar (serifa indiana) | **Fraunces** (serifa display variável) |
| Source Sans 3 (mantém) | Source Sans 3 (mantém) |
| Lilita One (logo) | Lilita One (mantém) |
| Agfolan (acento custom) | **REMOVIDA** |

### Filosofia visual

- **Antes:** Sans-serif pesada como display + serifa em body
- **Depois:** Serifa editorial Fraunces como protagonista + sans em momentos cirúrgicos (números, CTAs, eyebrows)

## ⚙️ Passos de migração

### 1. Substituir `layout.tsx`

Cola o novo arquivo. Ele:
- Carrega Fraunces variável (com axes opsz e SOFT)
- Carrega Source Sans 3
- Carrega Lilita One
- Aplica como CSS variables no `<html>`
- **Remove** os 9 `<link>` antigos do Google Fonts

### 2. Substituir `globals.css`

Cola o novo arquivo. Ele:
- Mantém tokens neutros (preto, cinza, creme)
- Atualiza tipografia inteira pra Fraunces + Source Sans
- Adiciona `font-variation-settings` nas classes display
- Remove referências a Eczar
- Mantém compatibilidade via aliases CSS

### 3. Remover dependências antigas

Se houver no projeto, remover:
- `@font-face` da Agfolan no globals (já removido)
- Arquivos `/public/fonts/agfolan-regular.woff*` (opcional — não atrapalha se ficar)

### 4. Migrar classes nos componentes

Find-and-replace global no projeto:

| Classe antiga | Classe nova |
|---|---|
| `.font-curia-body` | `.curia-body` |
| `.font-curia-body-bold` | `.curia-body-strong` |
| `.font-curia-display` | `.curia-display` |
| `.font-curia-ui` | `.curia-ui` |
| `.font-curia-ui-bold` | `.curia-ui-strong` |
| `.font-curia-logo` | `.curia-logo` |
| `.font-curia-accent` | **remover** (Agfolan saiu) |
| `.font-kefir-alt`, `.font-curia-serif` | `.curia-body` |
| `.myriad-bold--display` | `.curia-display` |
| `.myriad-bold--body` | `.curia-ui` |
| `.font-benzin-alt` | `.curia-display` ou `.curia-heading` |
| `.font-notably-alt` | `.curia-eyebrow` |
| `.font-curia-script` | **remover** |

## 📐 Como usar — Exemplos práticos

### Hero da landing

```tsx
<section className="curia-hero-stack">
  <span className="curia-eyebrow">
    Acesso antecipado · vagas limitadas
  </span>

  <h1 className="curia-display-xl">
    O conselho executivo de IA.
    <em> Para empresas que pensam grande.</em>
  </h1>

  <p className="curia-lead">
    Um board de conselheiros de IA com a inteligência estratégica
    de uma big tech — <em>pela primeira vez, dentro da sua empresa.</em>
  </p>

  <button className="btn-primary">
    <span className="curia-cta">Reservar minha vaga →</span>
  </button>
</section>
```

### Seção com estatística

```tsx
<section>
  <span className="curia-eyebrow">Pesquisa BDC · 2024</span>

  <div className="flex items-baseline gap-4">
    <span className="curia-numeric-xl">24%</span>
    <span className="curia-lead">
      mais crescimento em vendas
    </span>
  </div>

  <p className="curia-body">
    Empresas com conselho consultivo ativo crescem em média 24% mais
    em vendas que empresas sem conselho.
  </p>
</section>
```

### Citação

```tsx
<blockquote className="curia-quote">
  O empresário brasileiro de PME nunca teve acesso a um conselho
  executivo. Não porque não merecia — porque não existia maneira
  de entregar isso a preço que coubesse.
</blockquote>
```

### Card escuro (carrossel ou seção)

```tsx
<div className="on-obsidian bg-[var(--chamber-ink-deep)] p-16">
  <span className="curia-eyebrow">Manifesto</span>

  <h2 className="curia-display">
    Curia.
    <em> O conselho que faltava.</em>
  </h2>

  <p className="curia-lead">
    Toda tipografia dentro de `.on-obsidian` se ajusta automaticamente.
  </p>
</div>
```

## ✅ Checklist de validação

Depois de aplicar, abrir LP e verificar:

- [ ] Hero da LP usa Fraunces (não mais Eczar)?
- [ ] Headline tem aquela elegância "didone moderna" estilo Blank School?
- [ ] Itálico em palavras-chave cria peso editorial?
- [ ] Body/lead lê confortável (Fraunces opsz 14 e 36)?
- [ ] CTAs ainda em Source Sans pesado?
- [ ] Eyebrows uppercase em Source Sans?
- [ ] Logo "Curia" em Lilita One?
- [ ] Fundo creme `#FAFAF7`?
- [ ] Texto preto suave `#1A1A1A`?
- [ ] Zero gold ativo no sistema?

## 🚫 Erros comuns a evitar

1. **Não usar Fraunces em CTA.** CTA é Source Sans pesado, sempre.
2. **Não usar Source Sans em headline.** Headline é sempre Fraunces.
3. **Não esquecer `<em>`** nas palavras de destaque do display — é o que cria a "voz Blank".
4. **Não usar `font-feature-settings` direto** — usar `font-variation-settings: var(--fraunces-display)` etc.
5. **Não readicionar Eczar** — saiu do sistema.

## 📊 Performance

Carregamento esperado:
- Fraunces variable: ~80kb (vs 4 weights tradicionais = ~120kb)
- Source Sans 3: ~60kb
- Lilita One: ~12kb
- **Total: ~152kb** (era ~280kb com Eczar + Agfolan + 9 fontes legadas)

**Ganho de ~46% no peso total das fontes** + carregamento via next/font (self-hosted, zero layout shift).

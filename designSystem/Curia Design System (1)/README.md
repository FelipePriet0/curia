# Curia Design System

> **O lugar onde boas empresas se tornam ótimas.**

Curia é um **board de executivos IA** — um conselho estratégico virtual para fundadores de pequenas e médias empresas. Combina o raciocínio de um sócio de consultoria estratégica, a visão operacional de um COO experiente e o pensamento financeiro de um CFO, em uma conversa estruturada, 24/7.

O nome vem da **Curia Romana** — o senado onde as decisões mais importantes eram tomadas. A missão é trazer esse nível de conselho para quem nunca teve acesso a ele.

---

## Produto

- **Produto único (por enquanto):** Curia Web App — Next.js em `/app`.
  - **Landing Page** pública (`/`) — hero + carrossel de citações + como funciona + marquee de big-techs + pricing.
  - **Board** (`/board`) — a experiência principal: a "Câmara" isométrica onde 6 conselheiros deliberam em tempo real enquanto o founder apresenta desafios.
  - **Onboarding** (`/onboarding`) — diagnóstico inicial da empresa.
  - **Auth** — login / signup / forgot-password (Clerk).

- **Conselheiros (6):** Estratégia, Finanças, Growth, Produto, Operações, Marca — cada um com cor própria.

- **Estado da câmara (4 fases):** `idle` → `receiving` → `deliberating` → `verdict`.

---

## Fontes do material (para referência)

- **Repo:** `FelipePriet0/curia` (GitHub), branch `main`.
  - App: `app/src/` — Next.js 15 + Tailwind + shadcn-ish UI.
  - Tokens: `app/src/app/globals.css`.
  - Câmara 3D isométrica: `app/src/components/board/chamber/CuriaChambra.tsx`.
  - Landing: `app/src/components/landing/LandingPage.tsx`.
  - Briefs: `aiboardobsidian/*.md` (`01 - O que é a Curia.md`, `🏛️ CURIA UI UX BRIEF.md`).
  - Copy: `UIs/Copy da L;P.txt`.

---

## CONTENT FUNDAMENTALS

### Idioma e público
- **Português brasileiro.** Expansão planejada para mercados lusófonos e hispânicos.
- Público: **fundadores de PMEs** — decisores solitários, com pouca estrutura de mentoria.

### Voz
- **Executiva, direta, densa.** Frases curtas, muita pontuação em lista. Tom de board advisor sênior, não de copy SaaS.
- **Metáfora central:** conselho / câmara / deliberação / parecer — NUNCA "chatbot", "IA que te responde", "assistente".
- **"Você" formal** (não "tu"). Tratamento respeitoso sem ser cerimonioso. Exemplo: `Olá, Empresário` como saudação.

### Casing
- **Sentence case** em títulos. Ex: *"Como funciona"*, *"Fortaleça suas decisões"*.
- **ALL CAPS com letter-spacing amplo** (0.14–0.18em) reservado para micro-labels UI: `DIAGNÓSTICO`, `PARECER FINAL`, `PROCESSO`.

### Emoji / iconografia
- **Sem emoji no produto.** O único uso documentado é `🏛️` no nome do brief interno — não é motif do produto.
- Iconografia é via **Lucide** (stroke). Nunca emoji, nunca decorativo.

### Vibe
- **Editorial. Sofisticada. Quieta.** Background creme quente (#FDFBF9) + texto marrom café (#2B1A07) + um laranja de ação muito saturado (#FF6F1E). Mesma sensibilidade de uma publicação impressa (The Economist, Monocle) mais que de um SaaS.

### Exemplos de copy (do próprio produto)
- Hero: *"Os conselheiros estratégicos das grandes empresas trabalhando para você"* — com "**trabalhando para você**" em script decorativa laranja, como uma anotação à mão.
- Hero badge (script): *"Acesso antecipado — vagas limitadas"*.
- Sub-hero: *"Teste grátis por 14 dias."*
- Saudação do Board: *"Olá, Empresário"* + *"O que você deseja resolver hoje?"*.
- Input placeholder: *"Conte-nos o seu maior desafio, vamos resolvê-lo juntos."* (italic, Eczar).
- Princípios de voz (para o agente): *"Insight é pergunta, não declaração."* / *"Especificidade é respeito."* / *"Diagnóstico antes de plano."*.

### Padrão de escrita dos conselheiros
Resposta sempre estruturada:
1. **Diagnóstico** — o que está acontecendo de verdade
2. **Problema Central** — causa raiz, não sintoma
3. **Riscos Estratégicos**
4. **Framework Aplicado**
5. **Recomendações** (3–5 ações específicas, com métrica)
6. **Próximos Passos 7–14 dias**
7. **Perguntas Difíceis** (3 perguntas que um bom conselheiro faria)

---

## VISUAL FOUNDATIONS

### Paleta

**Editorial (app / LP — principal):**
- `#FDFBF9` — fundo (creme quente)
- `#2B1A07` — tinta (café escuro, ~28hsl)
- `#FF6F1E` — ação / CTA (laranja torrado, único acento forte)
- `#F5F0EC` e `#F5EDE0` — superfícies suaves
- `#E4DFD7` — borda de input

**Chamber (a câmara, escuro):**
- `#0A0A0B` preto profundo, `#1A1A1F` grafite, `#2A2A32` meia-sombra
- `#C9A84C` dourado (luz da mesa) + `#E8D08A` dourado suave
- `#F5F0E8` branco quente
- `#A8B5C0` prata (conselheiro Finanças)
- `#C06060` risco / alerta

Os **conselheiros** têm cores próprias (ver `counselors.config.ts`): dourado (Estratégia), prata (Finanças), verde (Growth), azul (Produto), aço (Operações), roxo (Marca) — sempre em saturação média, nunca neon.

### Tipografia
Ver `colors_and_type.css` para todas as vars. Resumo:
- **Eczar** (serif, 400/500/600) — **corpo padrão** e sub-headlines. Esta é a voz principal — NÃO é Inter/Geist SaaS. É editorial, serifada.
- **Inter** — labels técnicos, microcopy, UI pequena, botões (uppercase + letter-spacing).
- **Lilita One** (fallbacks: Sniglet, Fredoka, Baloo 2) — logo "Curia" + headlines *rounded*. Bold, arredondada, amigável — é o "rosto" da marca.
- **Pacifico** (fallback: Lobster Two, Dancing Script) — "script decorativa". Usada para frases à mão que anotam/completam o headline (ex: "trabalhando para você", "se inspira"). Sempre laranja.
- **Agfolan** — terciária, peso carregado localmente (`/fonts/agfolan-regular.woff2`). Uso raro.
- **Teko** — alternativa display condensada.
- **Notable** — usada em labels de seção do parecer (tracking largo, uppercase).

> **Substituição:** Agfolan não é gratuita; se o font file não estiver presente, usar **Inter Black** como fallback mais próximo e sinalizar.

### Espaçamento & raios
- Escala de radius: `sm 0.375rem` / `md 0.5rem` / `lg 0.75rem` (default) / `xl 1rem`.
- Cards, input boxes e CTAs usam **radius lg** (12px). Pílulas (badge de contexto) usam radius maior / `9999px`.
- Secções da LP têm padding vertical generoso (`py-24` / `py-28`), tipografia grande, linha quieta.

### Backgrounds
- **Full-bleed creme** por padrão; sem texturas, sem ruído.
- **Glow laranja radial** muito sutil (~7% opacidade, blur 3xl) atrás de hero/pricing — único "efeito" de fundo permitido.
- Imagens de autoridade (Elon, Newton, Sêneca etc.) são **retratos tratados em preto-e-branco/sépia**, com overlay preto e quote em painel glassmorphism.

### Animação
- **Respiração.** Conselheiros fazem micro-bob (3.2s ease-in-out infinite), com delays distintos.
- **`curia-bob-quick`** em estado "thinking".
- **`keyword-chip`**: 2.8s — palavra sobe 28px com fade in/out.
- **`dot-pulse`** e **`deliberate-bounce`** (1.2s) para indicadores de carregamento.
- **`verdict-appear`**: 0.5s `cubic-bezier(0.4,0,0.2,1)` — translateY(16px) + fade.
- Transições padrão: 0.15–0.25s ease (hover), 0.6–0.9s ease (estado da câmara).
- **Nunca bounce alto, nunca overshoot.** O tom é contido — um conselho é calmo.

### Hover / Press
- **Botões primários (laranja):** `hover:opacity-0.88` + `translateY(-1px)` no ativo.
- **Botões secundários:** `hover:bg-muted` (creme mais claro).
- **Cards (quickstart):** `hover:translateY(-1px)` + background ganha tint laranja (`rgba(255,111,30,0.06)`) e borda laranja suave.
- **Press:** não encolhe — apenas perde o `translateY`.

### Borders
- Cor padrão: `hsl(36 20% 87%)` ≈ `#E4DFD7` (warm border).
- Largura: **1px**. 2px reservado para accent (ex: `verdict-plano` com `border-left: 2px solid rgba(201,168,76,0.5)`).
- Focus ring: `3px rgba(255,111,30,0.07)` + borda primária com 45% opacidade — muito sutil, nunca gritante.

### Sombras
Sistema mínimo:
- **Cards/input:** `shadow-sm` (Tailwind) e `shadow-2xl` em elementos hero-size.
- **Glow laranja reativo** no hero e pricing (27% opacidade, blur 3xl, decorativo).
- **Glow dourado** dentro da câmara, reagindo ao estado (`0.02 → 0.10 → 0.22`).
- **Sombra em mesa isométrica:** ellipse preta ~18% + blur 6px.

### Transparência & blur
- **Glassmorphism** SÓ nos painéis de quote sobre foto (backdrop-blur-xl, background `rgba(43,26,7,0.10)`, borda `rgba(43,26,7,0.20)`).
- Context badge: `rgba(253,251,249,0.88)` + backdrop-blur 4px.
- Em todo o resto: opaco.

### Imagens
- **Retratos**: preto/branco tendendo ao quente, com **object-position 50% 15%** (foco no rosto).
- **Logos big-techs**: SVG invertidos (filter invert), opacity 0.45, rolando em marquee vertical lento (32–40s).
- **Paleta global das imagens:** warm, nunca frio. Sem highlight neon, sem gradientes roxo/azul.

### Layout
- **Max widths:** 680px (input), 1024px (hero copy), 1152px (seções principais), 1536px (big-techs).
- **Grid 12-col** via Tailwind.
- **`text-wrap: pretty` + `balance`** em headings e parágrafos por padrão — controle de viúvas.

### Raios / cards
- Card típico: `bg-#fff`, border `1px solid border-warm`, radius `lg` (12px), padding `1rem 1.15rem`, gap `0.4–0.65rem`.
- Nunca uso de *left-border colored accent* (evitar estereótipo).
- Corner-radius consistente; não mistura pílulas e cards no mesmo contexto.

---

## ICONOGRAPHY

- **Sistema:** Lucide React (already used in the codebase: `import { ArrowRight } from 'lucide-react'`). Stroke-style, 1.5–2px, outlined. Sem preenchimento.
- **CDN fallback (neste design system):** Lucide via CDN (`https://unpkg.com/lucide-static@latest`) — para protótipos HTML estáticos, incluir o SVG inline ou por `<img>` de `/assets/icons/lucide/*.svg`.
- **Cores de ícones:** geralmente `#2B1A07` com opacidade 0.35–0.75 (tom diminuído). Ícones dentro de CTAs laranja: `#2B1A07` opaco (para contraste).
- **Sem emoji, sem unicode-as-icon** (nada de ★, ✓ desenhado via caractere). O único check visto é um SVG inline (círculo + tique) em laranja, usado nos bullets de pricing.
- **Logos de empresas (big-techs):** 16 SVGs proprietários copiados em `assets/logos/` — Apple, Google, Netflix, Meta, Stripe, OpenAI, Tesla, Spotify, Airbnb, Uber, GitHub, Shopify, Notion, Figma, Zoom, YouTube. Todos renderizados **pretos** (filter invert em fundos claros) com opacity 0.45.
- **Ícone "Curia" (logo):** é puramente **tipográfico** — palavra "Curia" em Lilita One, preta (#2B1A07). Sem marca gráfica dedicada. A "câmara isométrica" é o selo visual do produto, mas fica na tela do app, não no logo.

---

## Index / Manifest

```
README.md                   ← este arquivo
colors_and_type.css         ← tokens CSS (vars + classes utilitárias)
SKILL.md                    ← contrato de skill (Agent SKills compatible)
fonts/                      ← webfonts locais (ou referenciados via Google Fonts)
assets/
  logos/                    ← 16 logos de big-techs (SVG)
  curia/                    ← logotipo + wordmarks Curia
preview/                    ← cards do Design System (HTML, ~700×150)
ui_kits/
  curia_app/                ← UI kit do produto Curia (LP + Board)
    README.md
    index.html              ← demo click-through
    *.jsx                   ← componentes React soltos
```

### Caveats
- **Agfolan** não foi copiada (licenciamento) — fallback para **Inter Black**. Peça ao usuário os arquivos .woff2 se precisar do peso original.
- A câmara isométrica recriada é uma **versão simplificada** da `CuriaChambra.tsx` — mesas + silhuetas + glow. A original tem 6 conselheiros animados com 3 variantes de braço/olho por cadeira; aqui mantive a aparência, não a lógica.
- Imagens das citações (Elon, Sêneca etc.) **não foram copiadas** — licenciamento dos retratos. No UI kit, usei placeholders tonificados.
```


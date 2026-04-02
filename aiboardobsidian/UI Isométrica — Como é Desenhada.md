# UI Isométrica — Como é Desenhada

> Documento técnico sobre o sistema de renderização da câmara isométrica da Curia (`/board`).

---

## Fundamento: SVG puro

Toda a cena é um único `<svg viewBox="230 120 340 280">`. Não há canvas, WebGL nem biblioteca de renderização. O "3D" é geometria 2D calculada matematicamente.

Elementos SVG usados:
- `<polygon>` — faces dos boxes (corpos, mesa, cadeiras)
- `<ellipse>` — sombras, glows, superfície da mesa
- `<circle>` — olhos, assento das cadeiras
- `<path>` — encosto das cadeiras
- `<text>` — labels dos conselheiros
- `<radialGradient>` — textura da mesa

---

## Projeção Isométrica

A função central de todo o sistema:

```ts
function iso(ix, iy, iz): [number, number] {
  return [
    OX + (ix - iy) * SX,
    OY + (ix + iy) * SY - iz * SZ,
  ]
}
```

**Constantes:**
- `OX = 400, OY = 288` — origem da cena em screen space
- `SX = 38` — pixels por unidade iso em X
- `SY = 21` — pixels por unidade iso em Y
- `SZ = 40` — pixels por unidade de altura (Z)

Qualquer ponto no mundo iso `(ix, iy, iz)` vira um ponto 2D na tela. É isso que cria a ilusão de profundidade.

---

## Primitivo: Box

O `Box` é o único bloco de construção da cena. Ele renderiza 3 polígonos SVG para simular volume:

```
┌─────────┐   ← TOP face    (ct = cor clara)
│  RIGHT  │   ← +X face     (cr = cor média)
│  face   │
└─────────┘
      \
       LEFT face (+Y, cl = cor escura)
```

Cada `Box` recebe `ix, iy, iz` (posição), `w, d, h` (dimensões) e 3 cores `[ct, cr, cl]`.

**Iluminação global:** fonte de luz fixada no topo-esquerda.
- `top` → face mais clara (recebe luz direta)
- `right (+X)` → face média
- `left (+Y)` → face mais escura (sombra)

Essa regra nunca muda entre personagens ou objetos.

---

## Personagens

Cada personagem é um conjunto de `Box` primitivos em coordenadas iso:

| Parte | Descrição |
|---|---|
| `legL`, `legR` | Dois boxes baixos no `iz = 0` |
| `shoeL`, `shoeR` | Boxes ainda mais baixos e rasos |
| `torso` | Box central, mais alto (`iz = 0.28, h = 0.58`) |
| `armL`, `armR` | Boxes laterais na altura do torso (`iz = 0.54`) |
| `handL`, `handR` | Boxes pequenos na ponta dos braços |
| `head` | Box no topo (`iz = 0.92`) |
| `hair` | Box fino sobre a cabeça (`iz = 1.26`) |

Proporção total: `h ≈ 3 × w` (padrão de personagem low-poly legível).

---

## Sistema de Facing (Orientação)

Nenhum `transform rotate()` é usado. A orientação é resolvida estruturalmente com 4 estados fixos:

```ts
type Facing = 'toward-right' | 'toward-left' | 'toward-down' | 'toward-up'
```

### Como o facing é calculado

```ts
dx = TABLE_CX − characterScreenX
dy = TABLE_CY − characterScreenY

|dx| > |dy|  →  toward-right  (dx > 0)  ou  toward-left  (dx < 0)
|dy| ≥ |dx|  →  toward-down   (dy > 0)  ou  toward-up    (dy < 0)
```

O eixo dominante (horizontal vs. vertical) define o facing. Simples e previsível.

### Variação estrutural por facing

Cada facing **não é uma rotação** — é uma geometria diferente dos braços:

| Facing | Braços | Face frontal |
|---|---|---|
| `toward-right` | Estendem em ±X, profundidade em Y | +X face |
| `toward-down` | Igual ao toward-right | +X face |
| `toward-left` | Estendem em ±Y, profundidade em X | +Y face |
| `toward-up` | Igual ao toward-right | (sem olhos) |

### Olhos

Os olhos são dois `<circle>` colocados na face frontal da cabeça:

- `toward-right / toward-down` → face `+X` → `iso(head.x + head.w, head.y + d * t, head.z + h * 0.62)`
- `toward-left` → face `+Y` → `iso(head.x + w * t, head.y + head.d, head.z + h * 0.62)`
- `toward-up` → sem olhos (costas para o viewer)

Cada olho tem um ponto branco de luz deslocado `-0.7, -0.7` para simular reflexo.

---

## Mesa

A mesa é construída com 3 elipses empilhadas em Y para criar a ilusão de cilindro:

```
ellipse cy = TABLE_CY      → superfície (fill: radialGradient madeira)
ellipse cy = TABLE_CY + 4  → borda superior do cilindro (mid-tone)
ellipse cy = TABLE_CY + 9  → base do cilindro (mais escuro)
```

O gradiente radial vai de `#D4BC8C` (centro claro) até `#B09050` (borda).

---

## Ordem de Renderização (Painter's Algorithm)

Para profundidade correta, a ordem de desenho é:

```
1. Glow ambiente (fundo)
2. Cadeiras + personagens BACK (ix + iy < 0) — atrás da mesa
3. Mesa
4. Keywords flutuantes (deliberação)
5. Cadeiras + personagens FRONT (ix + iy > 0) — na frente da mesa
```

Isso garante que personagens na frente tapem a mesa, e a mesa tape os personagens de trás.

---

## Personagens na cena (posições atuais)

| Personagem | Posição iso | Facing | Face dos olhos |
|---|---|---|---|
| Estratégia | `[-2.1, -2.1]` | `toward-down` | +X |
| Finanças | `[0.4, -2.0]` | `toward-left` | +Y |
| Marca | `[-2.0, 0.4]` | `toward-right` | +X |
| Fundador | `[0.65, 0.65]` | — (cadeira vazia) | — |

---

## Cadeiras

Cada cadeira é um `<circle>` com um `<path>` de encosto, renderizado em screen space e **rotacionado para apontar para a mesa**:

```ts
const angleDeg = Math.atan2(sy - TABLE_CY, sx - TABLE_CX) * (180 / Math.PI)
<g transform={`translate(sx, sy) rotate(angleDeg + 90)`}>
```

As cadeiras usam rotação (diferente dos personagens) porque são objetos simétricos — a rotação não distorce sua forma.

---

## Regras do sistema (não negociável)

- ❌ Nunca usar `transform rotate()` em personagens
- ❌ Nunca misturar perspectivas entre elementos
- ❌ Nunca inverter a iluminação (`top` sempre é o mais claro)
- ✅ Toda orientação é resolvida por variação estrutural dos braços + escolha da face dos olhos
- ✅ Iluminação global consistente em todos os `Box` da cena

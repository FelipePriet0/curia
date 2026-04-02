 # `ink.ts` — Renderização e Tema (Dissecado)
 
 Objetivo: padronizar a renderização do TUI com tema unificado, evitando boilerplate em cada tela.
 
 Peças principais
 - `withTheme(node)`: wrap em `ThemeProvider`, centraliza contexto de tema para todos os componentes.
 - `render(node, options)`: delega a `ink/root.js` adicionando tema; retorna `Instance` (controla lifecycle/teardown do Ink).
 - `createRoot(options)`: cria Root e sobrescreve `render` para sempre aplicar `withTheme`.
 - Re-exporta grande parte do toolkit de UI: Box/Text/Link/Buttons, hooks (`useInput`, `useTerminalTitle`, `useInterval`, etc.) e helpers (wrapText, measureElement, supportsTabStatus).
 
 Porquês de design
 - Consistência visual: todas as telas compartilham tokens/cores via `ThemeProvider` sem lembrar de montar em cada local.
 - Isolamento: o pacote Ink “puro” fica neutro; o app injeta sua camada de design‑system sem modificar o core do Ink.
 - DX: ao importar de `src/ink.ts`, o dev ganha componentes já “tematizados”, reduzindo chances de divergência.
 
 Q&A interno
 - Q: Por que não montar `ThemeProvider` no root do app apenas?
   A: Porque existem múltiplos pontos de render (ex.: diálogos utilitários, flows fora do root do app). O wrapper garante invariantes em todos os renders.
 - Q: O que acontece se outro time quiser um tema diferente?
   A: O wrapper é o único ponto de customização — basta trocar `ThemeProvider`/tokens sem tocar nos call sites.
 

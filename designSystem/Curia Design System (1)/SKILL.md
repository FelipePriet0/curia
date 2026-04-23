---
name: curia-design
description: Use this skill to generate well-branded interfaces and assets for Curia, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.
If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.
If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick reference

- **Brand:** Curia — "O lugar onde boas empresas se tornam ótimas." An AI board of executives for SMEs (PMEs brasileiras).
- **Language:** Portuguese-BR. Tone: executive, direct, council-like. Never "chatbot" / "assistente".
- **Core palette:** `#FDFBF9` bg · `#2B1A07` ink · `#FF6F1E` action · `#C9A84C` chamber gold · chamber dark `#0A0A0B/#1A1A1F/#2A2A32`.
- **Fonts:** Eczar (body, serif, editorial), Inter (UI/labels), Lilita One (logo + rounded headlines), Pacifico (script accents, always orange).
- **Icons:** Lucide (stroke). Never emoji. Never unicode-as-icon.
- **Motif:** an isometric chamber with 6 counselors deliberating. Gold glow on the table reacts to state (idle → deliberating → verdict).
- **Anti-patterns:** purple/blue gradients, bubbly SaaS cards, colored left-border accents, heavy shadows, emoji. Keep it editorial and quiet.

Files: `colors_and_type.css` (tokens) · `assets/logos/` (big-tech SVGs) · `preview/` (design system cards) · `ui_kits/curia_app/` (React recreations of LP + Board).

# Curia App — UI Kit

Recreates the two main surfaces of the Curia product:

1. **Landing Page** — `TopNav`, `Hero` (with script accent + glow), `BigTechStrip` marquee, simple footer.
2. **Board** — `BoardSidebar`, `Chamber` (isometric 6-counselor scene with phase glow), `Composer`, `QuickStart`, `VerdictPanel`.

## Files
- `index.html` — interactive demo. Opens to LP, "Comece agora" → Board. Send a message → câmara delibera → verdict appears.
- `Common.jsx` — `CuriaBtn`, `CuriaLogo`, `TopNav`, `Hero`, `BigTechStrip`.
- `Board.jsx` — `BoardSidebar`, `Chamber`, `Composer`, `QuickStart`, `VerdictPanel`, `COUNSELORS`.

## Notes
- Visuals lifted from `app/src/components/landing/LandingPage.tsx` and `app/src/components/board/chamber/CuriaChambra.tsx`.
- The chamber is a SVG simplification (isometric floor + gold table + 6 seat avatars) — not the full 3 arm/eye variants of the original.
- Counselor portraits are stand-ins (initial letter on color disk). Replace with real avatars when assets are available.
- All tokens come from `../../colors_and_type.css`.

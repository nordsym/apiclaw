# PRD: APIClaw Mobile Responsiveness

## Scope
Göra workspace och landing page mobile-friendly.

## Arbete (1 agent, ingen spawn)

Jag gör allt själv — inga subagenter. Estimat: ~20 min.

---

## Del 1: Workspace Mobile (workspace/page.tsx)

### Ändringar:
1. **Sidebar** → Dold på mobil, visa via hamburger-meny
2. **Tabs** → Horisontell scroll eller dropdown på mobil
3. **Cards/Tables** → Stack vertically på små skärmar
4. **Agent-kort** → Responsiv layout, knappar under content
5. **Input-fält** → Full width på mobil

### Tekniskt:
- Tailwind breakpoints: `sm:`, `md:`, `lg:`
- Befintlig `Menu`/`X` icons redan importerade
- Mobil sidebar state: `sidebarOpen` finns redan

---

## Del 2: Landing Page Header (page.tsx)

### Ändringar:
1. **Desktop nav** → Dölj på mobil (`hidden lg:flex`)
2. **Hamburger** → Visa på mobil (`lg:hidden`)
3. **Mobile menu** → Slide-in eller dropdown
4. **CTA-knappar** → Stack på mobil

### Tekniskt:
- Lägg till mobile menu state
- Animera med Tailwind transitions

---

## Filer som ändras:
1. `landing/src/app/workspace/page.tsx`
2. `landing/src/app/page.tsx`

## Inga nya dependencies

## Teststrategi:
- Chrome DevTools mobile view
- Breakpoints: 375px (iPhone), 768px (tablet)

---

## Attestera?

Svara **"kör"** för att starta.

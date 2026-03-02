# UI Governance

## Design System Rules
- Use semantic Tailwind utility classes and shared tokens (`brand`, `surface`, `text`, `border`).
- Do not use hardcoded hex colors in `.ts` / `.tsx` files.
- Use shared UI primitives from `src/shared/ui` before introducing native elements.
- Keep page shells consistent:
  - page background: `bg-gray-50 dark:bg-gray-900`
  - header surface: `bg-white dark:bg-zinc-950 border-b border-gray-200 dark:border-gray-800`

## Accessibility Rules
- Native `<button>` must declare `type`.
- Icon-only `<button>` / `<a>` must include one of:
  - `aria-label`
  - `aria-labelledby`
  - `title`
- Preserve visible focus state on all interactive controls (`focus-visible:*` styles).
- Respect reduced motion via `prefers-reduced-motion` handling.

## Canonical Components
- Buttons: `src/shared/ui/button.tsx`
- Inputs/Textareas/Selects: `src/shared/ui/input.tsx`, `src/shared/ui/textarea.tsx`, `src/shared/ui/select.tsx`
- Subpage page-shell header: `src/shared/ui/subpage-header.tsx`
- Listing view mode control: `src/shared/ui/view-mode-toggle.tsx`

## Automated Enforcement
- `npm run lint:styles:tokens`: blocks hardcoded hex in TS/TSX.
- `npm run lint:a11y:native`: checks native button/link accessibility.
- `npm run lint:a11y:icons`: checks icon-only button labels.
- `npm run lint`: runs all enforcement checks.


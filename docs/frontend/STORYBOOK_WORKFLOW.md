# Storybook Workflow

## Purpose
Use Storybook stories as the source of truth for reusable UI states before page-level integration.

## Baseline Stories
Maintain these required stories:
- `stories/ui/Button.stories.tsx`
- `stories/ui/SubpageHeader.stories.tsx`
- `stories/ui/ProductCard.stories.tsx`

## Update Rules
- If a shared component API changes, update its story in the same PR.
- Add both English and Arabic examples for user-facing UI where applicable.
- Keep stories focused on component states (default, interactive, empty/error variants).

## CI Gate
- `npm run storybook:check` validates the baseline story files exist and are well-formed.
- This check is included in `npm run lint`.

## Recommended Review Flow
1. Update component.
2. Update/add story.
3. Run `npm run lint` and `npm run build`.
4. Include story notes in PR description (changed states and why).

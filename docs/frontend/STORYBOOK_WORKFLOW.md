# Storybook Workflow

## Purpose
Use Storybook stories as the source of truth for reusable UI states before page-level integration.

## Baseline Stories
Maintain these required stories:
- `stories/ui/Button.stories.tsx`
- `stories/ui/SubpageHeader.stories.tsx`
- `stories/ui/PostCard.stories.tsx`

## Local Commands
- `npm run storybook` starts the component workbench on port `6006`.
- `npm run storybook:build` creates a reviewable static Storybook build.
- `npm run storybook:check` verifies the required baseline and compiles every story into a temporary static test build.

## Update Rules
- If a shared component API changes, update its story in the same PR.
- Add both English and Arabic examples for user-facing UI where applicable.
- Keep stories focused on component states (default, interactive, empty/error variants).

## CI Gate
- `.github/workflows/frontend-storybook-governance.yml` runs `npm run storybook:check` for frontend changes.
- The gate checks actual Storybook compilation, not only filename or export patterns. Its temporary build output is removed after the check.

## Recommended Review Flow
1. Update component.
2. Update/add story.
3. Run `npm run lint`, `npm run storybook:check`, and `npm run build`.
4. Include story notes in PR description (changed states and why).

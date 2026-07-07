# Phase 1 UI Design Contract

## Scope

Extend the existing Create Tournament card and Setup view only. Preserve the current visual system; Phase 6 owns broad navigation and mobile polish.

## Creation Flow

- Tournament name remains first.
- A two-card Tournament Format selector follows: `League` and `Group Stage`.
- Selecting Group Stage reveals a compact two-column configuration panel for `Number of groups` and `Teams per group`.
- A live capacity summary reads: `[N] teams required · [G] groups × [T] teams`.
- League selection hides group inputs and uses existing defaults.

## Saved Tournament Cues

- Tournament list cards include a small `League` or `Group Stage` format label.
- Group Stage Setup includes a configuration summary and stable group labels.
- Until assignment is implemented, the fixture action explains that teams must match capacity and assignment is the next step; it must not generate League fixtures.

## Interaction and Accessibility

- Format choices are native radio inputs inside existing card-style labels.
- Numeric fields have visible labels, integer minimums, and descriptive helper text.
- Conditional fields remain in normal document flow.
- Validation feedback uses the existing feedback/error styling and is announced through readable text.
- Touch targets and responsive stacking follow current form behavior.

## Visual Tokens

- Reuse `fixtureTypeCard`, active gradient, border, radius, typography, and input tokens.
- Add only narrowly scoped format/configuration classes.
- No new colors, fonts, icon library, modal pattern, or layout system.

## Copy

- Selector heading: `Tournament Format`
- League description: `One table where every team plays the competition schedule.`
- Group Stage description: `Multiple independent groups with their own fixtures and tables.`
- Capacity helper: `[N] teams required`
- Group summary: `Group A`, `Group B`, etc.

## Responsive Contract

- Format cards stack on narrow screens.
- Numeric fields use two columns when space allows and one column below 390px.
- Capacity summary never relies on horizontal scrolling.

---
*UI contract approved from user-provided direction: 2026-06-24*

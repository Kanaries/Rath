# Frontend Infra Phase 2: Tailwind 4 and shadcn Alignment

Status: implemented and verified in Rath on 2026-07-10
Runtime remains React 18.2
Versions: Tailwind CSS 4.3.2, `@tailwindcss/vite` 4.3.2, `tailwind-merge` 3.6.0, `tw-animate-css` 1.4.0, shadcn CLI validation 4.13.0

## Scope and decisions

This phase is an infrastructure-equivalence migration. It does not switch the visual system to OKLCH, replace individual Radix packages with the unified `radix-ui` package, remove React 18 `forwardRef`, or overwrite local shadcn source.

The supported production browser floor is now explicit:

- Chrome and Chromium Edge 111+;
- Safari 16.4+;
- Firefox 128+.

These versions match Tailwind 4's core browser requirements. Supporting older browsers requires rolling back to the verified Vite + Tailwind 3 build; a JavaScript legacy plugin cannot polyfill the required CSS features.

## CSS and token migration

- Vite uses the official `@tailwindcss/vite` plugin. The Tailwind 3 PostCSS config, Autoprefixer and direct PostCSS dependency were removed.
- `src/index.css` imports Tailwind, `tw-animate-css`, Rath tokens, the legacy normalize layer and the global component layer as one ordered CSS entry.
- Rath's HSL values remain visually unchanged, but each custom property now contains a complete `hsl(...)` color. `@theme inline` maps those product tokens to Tailwind color utilities without nested `hsl(var(...))` wrappers.
- The old JavaScript `tailwind.config.js` color and radius mapping was removed. Radius aliases explicitly preserve Rath's former `rounded-sm`, bare `rounded`, `rounded-md` and `rounded-lg` dimensions.
- Tailwind 3's implicit gray border color is retained temporarily as a base compatibility rule. Existing semantic `border-border` and `border-input` utilities remain authoritative.
- `normalize.css` is imported into Tailwind's `base` layer and `App.css` into `components`. This is required because unlayered legacy CSS otherwise outranks Tailwind 4 utilities; browser verification caught that failure as black text on the primary button.

Template utilities were migrated using the documented v3-to-v4 equivalents where visual meaning changed:

- `shadow-sm` → `shadow-xs`, bare `shadow` → `shadow-sm`;
- `rounded-sm` → `rounded-xs`, bare `rounded` → `rounded-sm`;
- `outline-none` → `outline-hidden` to retain forced-colors behavior.

No deprecated opacity, flex shrink/grow, overflow ellipsis, bare ring, blur or drop-shadow utility required a product-source migration.

## shadcn ownership

`components.json` now describes the existing Vite, TypeScript, Radix, Lucide and CSS-variable layout. `shadcn info --json` resolves the project as Tailwind v4 and finds all 27 local UI components in `src/components/ui`.

An upstream dry-run diff was reviewed for the Button component and intentionally not applied. The current registry version would:

- replace individual Radix imports with the unified package;
- move to React 19-style component typing;
- change Rath's 32 px default density and variants;
- change shadows, focus rings and dark-mode behavior.

Those are separate design-system or React phases. Existing components remain Rath-owned, and future CLI use must start with `view`, `--dry-run` or `--diff`; `add --all --overwrite` is prohibited.

## Automated protection and verification

`yarn audit:tailwind4` checks dependency majors, CSS-first configuration, shadcn paths and removed v3 syntax. CI runs this audit before typecheck and build.

Verification completed:

- Tailwind 4 audit: pass;
- TypeScript: pass;
- Jest: 6 suites and 47 tests pass;
- Vite production build: pass, all 14 Workers retained;
- Chromium production smoke: 3 tests pass at root and `/rath/`;
- compact primary button: 32 px, white foreground on Rath primary background;
- base-path public assets: all five Data Connections source icons load below `/rath/`;
- Radix dialog: Preferences portal opens, receives its accessible dialog role and closes with Escape;
- visual inspection: Data Connections, source cards, DataSource empty state, Sidebar and Preferences dialog match the compact Rath layout without blank states or overlays.

## Residual risks and rollback

- Tailwind 4's generated main CSS is larger than the Tailwind 3 baseline (about 58.7 kB versus 46.4 kB uncompressed). This remains small relative to the application JavaScript and should be tracked, not hidden.
- Space/divide selector behavior and rarely visited product pages still warrant normal release QA even though no removed utility remains and the key interaction surfaces pass.
- Dark tokens remain defined but no new dark-mode switch or class strategy was introduced.
- Roll back this phase as a unit to the verified Vite + React 18 + Tailwind 3 state. Do not regenerate old components through the shadcn CLI.

References: [Tailwind CSS upgrade guide](https://tailwindcss.com/docs/upgrade-guide), [Tailwind CSS compatibility](https://tailwindcss.com/docs/compatibility), [shadcn Tailwind v4](https://ui.shadcn.com/docs/tailwind-v4), [shadcn components.json](https://ui.shadcn.com/docs/components-json).

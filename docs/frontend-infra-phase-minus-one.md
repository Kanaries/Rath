# Frontend Infra Phase -1 Decision Record

Status: accepted on 2026-07-10

## Decision

- `Rath` is the authoritative implementation for shared frontend UI and infrastructure.
- `RATH-insider` remains supported during the transition, but contains only SaaS-specific overlays on top of the Rath baseline.
- Infra phases are implemented and verified in Rath first. Each phase is kept reviewable and is then cherry-picked or manually replayed into Insider with a small overlay adapter commit.
- Insider follows Rath's shadcn/Tailwind UI baseline. We will not spend a separate migration cycle making the legacy Fluent UI baseline React 19 compatible before removing it.
- Production authorization only prevents the normal page lifecycle from automatically loading the application before authorization succeeds. Static chunks are not treated as protected resources.
- The long-term target is to retire the independently maintained Insider frontend after Rath exposes stable plugin interfaces for external capabilities such as SaaS accounts, workspaces, services, navigation, routes, telemetry, and authorization.

## Shared authoritative surface

The following behavior is owned by Rath and must not be independently reimplemented in Insider:

- Node, Yarn, TypeScript, React, Vite, Tailwind and shadcn versions;
- Vite config, HTML entry, build output, asset/base-path behavior and environment conventions;
- Web Worker and Monaco Worker registration;
- shared bootstrap lifecycle and error-reporting contracts;
- shared providers, routes, navigation extension points and UI primitives;
- lint, typecheck, unit, production-build and browser-smoke gates;
- shared Docker build semantics and bundle analysis.

## Insider overlay surface

The following capabilities remain Insider-owned until equivalent plugin APIs exist:

- authorization checks and login redirects;
- account, workspace, organization and SaaS data flows;
- Insider service endpoints and environment values;
- permissions, SaaS logging, monitoring and telemetry;
- Insider-only pages such as notebook or account/workspace administration;
- deployment-specific HTML metadata and server configuration.

Overlay code must integrate through explicit bootstrap/provider/route/navigation hooks. It must not fork the shared Vite config, Worker handling, React runtime or UI primitives.

## Bootstrap contract

The shared Rath entry owns application startup. Its default behavior starts the app immediately. Insider supplies a lightweight pre-bootstrap authorization hook:

```ts
export interface RathBootstrapPlugin {
    beforeStart?(): void | Promise<void>;
    providers?: React.ComponentType<React.PropsWithChildren>;
    onStartError?(error: unknown): void;
}
```

During the Vite migration, Insider may initially use a local adapter around this contract. Route and navigation extension points are the next plugin-API layer rather than inert fields in the initial interface. The contract should later move to a versioned Rath plugin API. It is not a security boundary for static assets.

## Sync and rollback rules

1. Finish and verify each infra phase in Rath before touching Insider.
2. Keep shared infra changes separate from public-account removal and unrelated product changes.
3. Prefer cherry-picking small phase commits. If code divergence prevents a clean cherry-pick, replay the same shared files and record the unavoidable overlay delta.
4. Every Insider replay must pass Rath's shared gates plus Insider authorization and SaaS smoke tests.
5. Vite, Tailwind 4 and React 19 use separate releases and remain independently reversible.
6. Do not keep CRA/Vite, Tailwind 3/4 or React 18/19 dual implementations after their documented verification window.

## Protected Insider areas

The initial overlay audit must treat these areas as protected until explicitly migrated:

- `packages/rath-client/public/preload.js`
- `packages/rath-client/public/index.html` authorization flow
- `packages/rath-client/src/pages/loginInfo`
- `packages/rath-client/src/store/userStore.ts`
- `packages/rath-client/src/store/fetch.ts`
- `packages/rath-client/src/services/permission.ts`
- `packages/rath-client/src/services/enhance.ts`
- `packages/rath-client/src/loggers`
- Insider-only notebook, workspace and SaaS pages

The Vite phase replaces the production HTML/preload mechanism with the bootstrap hook while preserving its user-visible authorization behavior.

## Phase order

1. Phase 0: runtime and CRA baseline protection in Rath.
2. Phase 1: Vite equivalence on React 18 and Tailwind 3.
3. Phase 2: Tailwind 4 and shadcn tooling alignment.
4. Phase 3: React 19-compatible dependency preparation on React 18.3.1.
5. Phase 4/5: React 19 canary, verification and cleanup.
6. Replay each verified phase into Insider and reconnect only the documented overlay.

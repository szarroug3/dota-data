# CI Verification

This repo runs ESLint and TypeScript checks on every push/PR via GitHub Actions.

- Workflow: `.github/workflows/verify.yml`
- Commands:
  - `pnpm lint:ci` → ESLint with `--max-warnings=0`
  - `pnpm type-check:ci` → `tsc --noEmit`

Use the **Actions** tab to trigger the run manually (`workflow_dispatch`) or view results on PRs.

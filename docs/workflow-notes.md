# Workflow Notes

- These workflows run on **any branch** and on PRs.
- We can't switch your Git branch inside a zip. If you want this on `refactor-frontend`,
  please commit these files to that branch or upload a zip built from that branch and I'll continue from there.
- The `verify` job always runs TypeScript type-check **even if ESLint fails**, and uploads a combined report:
  - `verify-report.md` (quick read)
  - `eslint-report.txt` and `eslint-report.json`
  - `tsc-report.txt`

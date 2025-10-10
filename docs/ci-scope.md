# CI Scope for TypeScript & ESLint

To keep the migration focused and avoid noise from test/mocks, CI uses a dedicated `tsconfig.ci.json`
and limits ESLint to `src/`:
- TypeScript: `tsc --noEmit -p tsconfig.ci.json --skipLibCheck true`
- ESLint: `eslint --max-warnings=0 src`

This preserves strictness for application code while not blocking on test/mocks during the migration.
We can expand CI scope later once the app-data migration is complete.

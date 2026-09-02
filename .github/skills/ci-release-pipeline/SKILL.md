---
name: ci-release-pipeline
description: 'Maintain and troubleshoot Unbound Cloud GitHub Actions and releases. Use for frontend/backend/E2E workflows, workflow_call inputs or secrets, path filters, concurrency, browser matrices, test environment versions, release version bumps, tags, the heroku test branch, multiark/electron release branches, bot Git configuration, approvals, or CI failures.'
argument-hint: 'Describe the workflow, CI job, versioning, or release issue'
---

# CI and Release Pipeline

## Workflow Map

- `.github/workflows/frontend_tests.yml`: React tests on Node 22 for side-branch pushes, manual dispatch, and reusable calls.
- `.github/workflows/backend_tests.yml`: independent Node and Python jobs with account/trade secrets.
- `.github/workflows/end_to_end_tests.yml`: Chrome, Firefox, Edge, and Safari matrix with service startup and artifacts.
- `.github/workflows/main-ci.yml`: calls all test workflows, versions the package, updates `heroku`, and prepares `multiark`/`electron`.
- `.github/actions/configure_bot_git/action.yml`: release commit/tag Git identity.

## Change Procedure

1. Identify every trigger mode: direct push/PR, `workflow_dispatch`, and `workflow_call`.
2. Keep reusable-workflow `inputs` and `secrets` declarations exactly synchronized with every caller's `with` and `secrets` blocks.
3. Update path filters when a new source, generated file, lockfile, or configuration can affect the job.
4. Preserve concurrency semantics: direct runs cancel stale runs, while called workflows use run-specific groups.
5. Keep local tool versions compatible with CI's Node 22 and Python 3.13.
6. Run each changed job's commands locally before pushing.
7. Check artifact paths and `if: always()` cleanup when editing E2E jobs.
8. Validate least-privilege permissions and never echo repository secrets.

## Release Semantics

After all three suites pass on `main`, `main-ci.yml` selects the version bump from the head commit message:

- Starts with `BREAKING:`: major.
- Contains `(#`: minor unless breaking.
- Otherwise: patch.

`yarn version` creates the version commit/tag, then the workflow pushes with tags. The pipeline rebases and force-pushes the `heroku` test branch and later the `multiark` and `electron` release branches; release pushes require the `release-approval` environment. `ACTIONS_PAT` is used where pushes must trigger downstream workflows.

Do not weaken approval or force-push safeguards casually. Test branch/history behavior in a disposable branch or fork when changing these jobs.

## Local Validation

Run the commands represented by the affected workflow:

```powershell
yarn test-all
yarn --cwd server test-all-js
yarn --cwd server test-py
python DataCopy.py
yarn build
```

For E2E changes, use the Selenium skill and reproduce the relevant browser mode. Use VS Code YAML diagnostics or an available GitHub Actions linter for workflow syntax, then inspect the rendered workflow/job graph on a manual dispatch before relying on release automation.

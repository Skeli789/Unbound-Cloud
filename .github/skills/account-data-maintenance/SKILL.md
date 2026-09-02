---
name: account-data-maintenance
description: 'Safely inspect and clean Unbound Cloud account files with RemoveUnactivatedAccounts.py. Use for stale unactivated accounts, account-storage reports, malformed account JSON, APPDATA cleanup, the 30-day retention threshold, deactivated_files_not_accessed.txt, disk reclamation, or changes to the account maintenance script.'
argument-hint: 'Describe the account cleanup, report, or maintenance-script change'
disable-model-invocation: false
---

# Account Data Maintenance

This workflow can permanently delete production account files. Default to reporting and review; require explicit human confirmation for deletion.

## Script Behavior

`RemoveUnactivatedAccounts.py`:

1. Resolves `%APPDATA%/unboundcloud/accounts`.
2. Reads files and counts activated/deactivated records.
3. Selects unactivated records whose `lastAccessed` is more than 30 days old.
4. Also reports malformed JSON as deletion candidates.
5. Writes `deactivated_files_not_accessed.txt` in the current working directory.
6. Deletes candidates only after the operator types `yes`.

## Safe Runbook

1. Confirm the exact `APPDATA` value and printed target directory. Stop if it is unexpected.
2. Snapshot or back up the accounts directory before any cleanup.
3. Run first against a copied directory by setting `APPDATA` to the copy's parent layout.
4. At the prompt, answer anything except `yes` to produce a dry-run report without deletion.
5. Review every report entry, especially `lastAccessed: Unknown`; malformed JSON may be recoverable and should not be deleted automatically.
6. Confirm that shared files such as the email-to-username table are not candidates.
7. Re-run against the intended directory, review the counts again, and let the human operator type the confirmation directly.
8. After deletion, verify account lookup consistency and retain the backup according to operational policy.

Run from the repository root so the report location is predictable:

```powershell
python RemoveUnactivatedAccounts.py
```

## Modifying the Script

- Refactor executable code behind `main()` before importing it in tests.
- Separate scanning, candidate classification, report writing, and deletion into testable functions.
- Keep report generation non-destructive.
- Treat malformed JSON separately from expired unactivated accounts.
- Handle an empty directory and missing `APPDATA` without an unbound variable or ambiguous path.
- Never remove the explicit confirmation gate.

Add tests using a temporary fake `APPDATA` tree with activated, recent-unactivated, expired-unactivated, malformed, shared-table, and empty-directory cases. Tests must never point at the real `%APPDATA%/unboundcloud` directory.
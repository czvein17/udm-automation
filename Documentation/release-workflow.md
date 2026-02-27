# Release Workflow (Main -> Production)

This project uses two long-lived branches:

- `main`: source of truth for ongoing development
- `production`: release-ready branch for internal distribution

## Normal release flow

1. Merge feature work into `main`.
2. Verify build/test on `main`.
3. Create a PR from `main` to `production`.
4. Merge PR into `production`.
5. Build the Windows package from `production`:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\package-windows-release.ps1
```

6. Upload `release\udm-automation-windows.zip` to SharePoint.
7. Tag the release commit on `production` (recommended):

```bash
git tag -a vYYYY.MM.DD -m "Windows internal release"
git push origin vYYYY.MM.DD
```

## Hotfix flow

If an urgent fix is applied to `production`, sync it back to `main` immediately.

```bash
git checkout main
git pull
git cherry-pick <production-fix-sha>
git push origin main
```

## Artifact policy

- Do not commit release zip artifacts to git.
- Keep package outputs in `release/` locally and publish through SharePoint.
- Regenerate artifacts per release from the source commit.

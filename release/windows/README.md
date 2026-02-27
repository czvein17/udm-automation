# UDM Automation (Windows Internal Package)

## End-user quick start

1. Download and extract `udm-automation-windows.zip`.
2. Open `Launch-UDM-Automation.cmd`.
3. Wait for first-run setup.
4. The app opens on a local URL (`http://127.0.0.1:<port>`).

For department rollout instructions, use:

- `release/windows/DEPARTMENT-INSTALL-GUIDE.md`

## Runtime behavior

- Portable runtimes are included:
  - Node `v24.14.0`
  - Bun `1.3.9`
- First run installs local runtime dependencies (`playwright-core` and `dotenv`) under `%LOCALAPPDATA%\BHVR-Automation\deps`.
- The local SQLite DB is created from a clean template at `%LOCALAPPDATA%\BHVR-Automation\data\app.sqlite`.
- Port auto-pick range is `3900-3999`.

## Stop the local app

- Run `Stop-UDM-Automation.cmd`.

## Build package (maintainers)

From repo root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\package-windows-release.ps1
```

This generates:

- `release\udm-automation-windows.zip`

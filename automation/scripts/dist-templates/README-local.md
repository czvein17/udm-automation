udm-automation — local distribution
----------------------------------
Contents:
 - cli.js          (bundled Node CLI, run with `node cli.js`)
 - run.sh/run.ps1  (wrappers that set PROFILE_DIR & disable reporter)
 - setup.sh/setup.ps1 (one-time setup: ensure Playwright browsers installed)
 - README-local.md

Quick start:
1) Ensure Node LTS is installed.
2) One-time: run `./setup.sh` (or `.un.ps1`) to install Playwright browsers.
3) Interactive login (headful) to create profile:
   PROFILE_DIR="$HOME/.udm-automation/profile" BROWSER_HEADFUL=1 ./run.sh --job udm:copy_elements_to_another_cycle --runId local-1
4) Offline run:
   REPORTER_DISABLED=1 PROFILE_DIR="$HOME/.udm-automation/profile" ./run.sh --job udm:copy_elements_to_another_cycle --runId run-2
Security:
 - Profile dir contains auth cookies. Do NOT commit it. Use file perms to secure it.

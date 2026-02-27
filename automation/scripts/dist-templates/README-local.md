udm-automation - local distribution
----------------------------------
Contents:
 - cli.js (bundled Node CLI, run with `node cli.js`)
 - run.sh/run.ps1 (wrappers that set PROFILE_DIR and disable reporter)
 - setup.sh/setup.ps1 (one-time setup to install Playwright browsers)
 - README-local.md

Quick start:
1) Ensure Node LTS is installed.
2) One-time: run `./setup.sh` (or `./setup.ps1`) to install Playwright browsers.
3) Interactive login (headful) to create profile:
   PROFILE_DIR="$HOME/.udm-automation/profile" BROWSER_HEADFUL=1 ./run.sh --job udm:copy_elements_to_another_cycle --runId local-1
4) Offline run:
   REPORTER_DISABLED=0 PROFILE_DIR="$HOME/.udm-automation/profile" ./run.sh --job udm:copy_elements_to_another_cycle --runId run-2

Security:
 - Profile dir contains auth cookies. Do not commit it.

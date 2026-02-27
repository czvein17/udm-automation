# Department Install Guide (Windows)

Use this guide to install and run the offline UDM automation tool on a work laptop.

## 1) Download

1. Open the SharePoint package link: `<PASTE_SHAREPOINT_LINK_HERE>`.
2. Download `udm-automation-windows.zip`.
3. Extract the zip to a local folder (example: `C:\Tools\udm-automation`).

Important:
- Do not run directly from inside the zip.
- Keep the extracted folder path short and local (avoid network drives).

## 2) Launch

1. Open the extracted folder.
2. Double-click `Launch-UDM-Automation.cmd`.
3. Wait for first-run setup to finish.
4. Your browser opens the local app URL automatically (`http://127.0.0.1:<port>`).

Notes:
- First launch can take longer because local runtime dependencies are set up.
- Port is auto-selected in range `3900-3999`.

## 3) Use the tool

1. In the browser UI, choose your automation settings.
2. Start the run.
3. Monitor progress in the automation terminal panel.

## 4) Stop the tool

- Double-click `Stop-UDM-Automation.cmd`.

## 5) Where local data is stored

The tool stores runtime files here:

- `%LOCALAPPDATA%\BHVR-Automation\config`
- `%LOCALAPPDATA%\BHVR-Automation\data`
- `%LOCALAPPDATA%\BHVR-Automation\state`
- `%LOCALAPPDATA%\BHVR-Automation\logs`

## 6) Troubleshooting

If the app does not open:

1. Run `Stop-UDM-Automation.cmd`.
2. Run `Launch-UDM-Automation.cmd` again.
3. Wait up to 60 seconds on first launch.

If there is still an issue, share these files with the support contact:

- `%LOCALAPPDATA%\BHVR-Automation\logs\server.out.log`
- `%LOCALAPPDATA%\BHVR-Automation\logs\server.err.log`

## 7) Support

- Team contact: `<TEAM_CONTACT_NAME_OR_CHANNEL>`
- Include a screenshot of the error and the two log files above.

# KKY Tool Lab Pages

This folder is deployed as a GitHub Pages based static site for KKY Tool Revit.

It now serves two roles:

- update feed hosting for the add-in
- lightweight landing page for KKY Tool downloads and feature-request direction
- manual draft hosting under `Manual/`

## Key files

- `index.html`
- `assets/site.css`
- `assets/site.js`
- `Manual/index.html`
- `Manual/manual.css`
- `Manual/manual.js`
- `.nojekyll`
- `CNAME`
- `latest.json`

## Current feed URL

```text
https://update.zerokky.com/latest.json
```

## Release package pattern

```text
KKY_Tool_Revit(2019,21,23,25,27)_v{version}.exe
KKY_Tool_Revit(2019,21,23,25,27)_v{version}.zip
```

The landing page reads `latest.json` and updates the visible version, release date, and package link automatically.

## Deploy note

When you upload a new release:

1. Add the latest `.exe` and `.zip` files to this folder.
2. Update `latest.json`.
3. Push this folder to the Pages repository.

Updated on 2026-03-22.

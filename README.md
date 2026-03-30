# Digital Twin Workbench

Isolated playground for the OKey Digital Twin experience (owner + tenant flows) with mock data and local 3D assets.

## Quick start

```bash
npm install
./scripts/setup-web-ifc.sh
npm run dev
```

## Download extra sample models

```bash
./scripts/download-models.sh
```

## Extract point clouds

```bash
./scripts/extract-pointclouds.sh
```

## Useful routes

- `/` workbench landing
- `/workbench` scenario selector
- `/workbench/view?persona=owner&property=prop-midrise-condo` combined view
- `/owner/properties/prop-midrise-condo` overview
- `/owner/properties/prop-midrise-condo/digital-twin` full workspace
- `/tenant/digital-twin` tenant view

## Notes

- Mock API is enabled via `.env` (`VITE_MOCK_API_MODE=mock`).
- 3D models are served from `public/listing-3d-mockup`.
- Reference assets from other repos live in `references/`.
- IFC direct viewer needs `public/web-ifc/web-ifc.wasm` (use `./scripts/setup-web-ifc.sh` after install).
- Point cloud viewer lists PLY files via `public/documents/scans/pointclouds.json` (updated by `./scripts/extract-pointclouds.sh`).
- Model overrides/defaults are stored in localStorage per property (`digital-twin-default-models-v1`).
- Point cloud viewer settings persist per property + user in localStorage (`digital-twin-pointcloud-settings-v1:{propertyId}:{userId}`).
- Property intelligence uses `VITE_INTELLIGENCE_API_BASE_URL` (defaults to the live endpoint); set `VITE_MOCK_API_MODE=false` to force live data.

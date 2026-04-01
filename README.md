# Digital Twin Workbench

3DEstate-style building visualization platform built with xeokit BIM engine. Deployed as a sub-app at `/digital-twin/` on okeylist.com and embedded via iframe in the O'Key Platform.

## Features

- **EstateShell**: Portfolio → Building → Unit navigation with building tabs
- **28 MEP layers**: HVAC, plumbing, electrical, fire, security, water, gas, drainage, sprinklers, lighting, access, sensors, cameras, parking, elevators, stairs, roof, solar, zones, maintenance, communs, lockers, pool, farming, rooftop, internet
- **4 unit view modes**: Exterior, Model 360, Floorplan 3D, Tour
- **Procedural furniture**: Bed, sofa, coffee table, kitchen counter, bathroom, desk
- **Floor plan overlays**: 2D images with unit markers
- **IFC model loading**: WebIFCLoaderPlugin with model selector
- **Day/night lighting**, exploded view, X-ray mode, floor isolation

## Embedding

```
/digital-twin/index.html?embed=true&propertyId=prop-midrise-condo&shell=true
```

| Param | Effect |
|-------|--------|
| `embed=true` | Show TwinShell |
| `propertyId` | Property to load |
| `unitId` | Pre-select unit |
| `view=inside` | Walkthrough mode |

## Development

```bash
npm install
npm run dev     # localhost:5174
npm run build   # dist/ → copy to OKey-Platform/public/digital-twin/
```

## Architecture

```
src/
├── App.tsx                        # URL params from window.location.search
├── components/estate/             # EstateShell, TopToolbar, BottomBar, views
├── features/digital-twin/
│   ├── components/
│   │   ├── BuildingViewer3D.tsx   # xeokit viewer (28 MEP layers + furniture)
│   │   ├── FloorPlanOverlay.tsx   # 2D floor plans
│   │   ├── ModelSelector.tsx      # IFC/GLB switcher
│   │   └── shell/                 # TwinShell, BottomToolbar, BottomSheet
│   ├── twinData.ts               # Mock data (maintenance, IoT, inspections)
│   └── archetypes.ts             # 18 building types
└── store/                         # digitalTwinStore, ownerPropertiesStore
```

# Digital Twin Workbench - Codex Completion Instructions

This document provides step-by-step instructions for Codex (or any AI assistant) to complete the Digital Twin Workbench integration with external 3D models, IoT monitoring, Google Maps, and AR/VR capabilities.

## Current State (Completed)

The following components have been created and integrated:

### 1. TwinUnitInteriorViewer (`src/features/digital-twin/components/TwinUnitInteriorViewer.tsx`)
- **Purpose**: 3D interior viewer for individual units using GLTF models
- **Features**:
  - Loads external GLTF models (default: 3D office from CodePen)
  - Multiple view modes: Orbit, Walkthrough, Floorplan
  - System overlays: HVAC, Plumbing, Electrical piping visualization
  - IoT sensor markers with click interaction
  - Day/Night lighting modes
  - Adapts scale based on unit area (m2)
- **Status**: Complete, integrated into TwinPanelRight with toggle

### 2. TwinARVRModelViewer (`src/features/digital-twin/components/TwinARVRModelViewer.tsx`)
- **Purpose**: Full-featured 3D model viewer similar to digital-twinz.com
- **Features**:
  - GLTF/GLB model loading with DRACO compression support
  - View presets (front, back, left, right, top, bottom, iso)
  - Render modes (solid, wireframe, xray)
  - Environment presets (studio, outdoor, warehouse, night)
  - Auto-rotate with speed control
  - Exploded view with distance slider
  - Screenshot capture
  - Fullscreen mode
  - Model statistics (vertices, triangles, meshes, materials)
  - AR/VR ready placeholders
- **Status**: Complete, standalone component

### 3. TwinIoTDashboard (`src/features/digital-twin/components/TwinIoTDashboard.tsx`)
- **Purpose**: Real-time IoT sensor monitoring dashboard
- **Features**:
  - Multiple sensor types: temperature, humidity, CO2, energy, water, motion, air quality, light, noise
  - Real-time value updates with configurable refresh interval
  - 24-hour trend sparklines
  - Threshold monitoring and alerts
  - System health cards (HVAC, Plumbing, Electrical, Fire Safety)
  - Alert management with acknowledgment
  - Sensor filtering by type
- **Status**: Complete, standalone component

### 4. GoogleMapsEmbed (`src/components/maps/GoogleMapsEmbed.tsx`)
- **Purpose**: Reusable Google Maps integration
- **Features**:
  - Dynamic map loading via Google Maps JavaScript API
  - Custom markers with different types (property, poi, alert, sensor)
  - Info windows on marker click
  - Custom map styling
  - Static map fallback when API key not available
- **Status**: Complete, requires `VITE_GOOGLE_MAPS_API_KEY` environment variable

---

## Remaining Tasks for Codex

### Task 1: Integrate Google Maps into TwinPropertyIntelligencePanel

**File**: `src/features/digital-twin/components/TwinPropertyIntelligencePanel.tsx`

**Instructions**:
1. Import the GoogleMapsEmbed component:
   ```tsx
   import { GoogleMapsEmbed } from '@/components/maps/GoogleMapsEmbed';
   ```

2. Replace the map placeholder (lines 102-120) with:
   ```tsx
   <div className="rounded-2xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-4 text-sm">
     <p className="text-xs uppercase tracking-[0.08em] text-[var(--semantic-text-subtle)]">Carte</p>
     <GoogleMapsEmbed
       center={{
         lat: intelligenceProperty?.latitude ?? 45.5017,
         lng: intelligenceProperty?.longitude ?? -73.5673,
       }}
       zoom={15}
       markers={[
         {
           id: 'property',
           lat: intelligenceProperty?.latitude ?? 45.5017,
           lng: intelligenceProperty?.longitude ?? -73.5673,
           title: intelligenceProperty?.address ?? address,
           type: 'property',
           info: `${intelligenceProperty?.type ?? 'Property'} - ${formatNumber(intelligenceProperty?.squareFeet)} pi2`,
         },
       ]}
       className="mt-3 h-44"
     />
   </div>
   ```

3. Add environment variable:
   - Create `.env.local` file with: `VITE_GOOGLE_MAPS_API_KEY=your_api_key_here`

---

### Task 2: Add TwinIoTDashboard to Main Panel

**File**: `src/features/digital-twin/DigitalTwinPanel.tsx`

**Instructions**:
1. Import the component:
   ```tsx
   import { TwinIoTDashboard } from './components/TwinIoTDashboard';
   ```

2. Add below `<TwinDataUniversePanel propertyId={propertyId} />` (around line 295):
   ```tsx
   <TwinIoTDashboard propertyId={propertyId} />
   ```

---

### Task 3: Add TwinARVRModelViewer as Standalone Page/Modal

**Option A: Create a new route**

1. Create file `src/pages/ModelViewerPage.tsx`:
   ```tsx
   import { TwinARVRModelViewer } from '@/features/digital-twin';
   import { useSearchParams } from 'react-router-dom';

   export function ModelViewerPage() {
     const [searchParams] = useSearchParams();
     const modelUrl = searchParams.get('model') || '/listing-3d-mockup/models/modern-apartment-building.glb';

     return (
       <div className="min-h-screen bg-[var(--panel-soft)] p-6">
         <TwinARVRModelViewer
           modelUrl={modelUrl}
           title="3D Model Viewer"
           enableAR={true}
           enableVR={true}
         />
       </div>
     );
   }
   ```

2. Add route in router config

**Option B: Add modal trigger in DigitalTwinPanel**

Add a button that opens the ARVRModelViewer in a modal overlay.

---

### Task 4: Connect IoT Data to Real Backend (Optional)

**File**: `src/features/digital-twin/components/TwinIoTDashboard.tsx`

**Instructions**:
1. Create API hook in `src/hooks/useIoTSensors.ts`:
   ```tsx
   import { useQuery } from '@tanstack/react-query';
   import { apiClient } from '@/lib/api/base';

   export function useIoTSensors(propertyId: string) {
     return useQuery({
       queryKey: ['iot-sensors', propertyId],
       queryFn: () => apiClient.get(`/properties/${propertyId}/iot/sensors`),
       refetchInterval: 5000,
     });
   }
   ```

2. Replace mock data in TwinIoTDashboard with the hook

---

### Task 5: Add 3dverse Livelink SDK Integration (Advanced)

**Prerequisites**:
- 3dverse account and API key
- Published 3D scene in 3dverse

**Instructions**:
1. Install SDK:
   ```bash
   npm install @3dverse/livelink
   ```

2. Create wrapper component `src/components/3dverse/LivelinkViewer.tsx`:
   ```tsx
   import { useEffect, useRef } from 'react';

   export function LivelinkViewer({
     sceneId,
     token,
   }: {
     sceneId: string;
     token: string;
   }) {
     const canvasRef = useRef<HTMLCanvasElement>(null);

     useEffect(() => {
       const init = async () => {
         const SDK3DVerse = await import('@3dverse/livelink');

         await SDK3DVerse.default.joinOrStartSession({
           userToken: token,
           sceneUUID: sceneId,
           canvas: canvasRef.current!,
           viewportProperties: {
             defaultCameraSpeed: 2,
           },
         });
       };

       init();

       return () => {
         SDK3DVerse.default.disconnectFromSession();
       };
     }, [sceneId, token]);

     return <canvas ref={canvasRef} className="h-full w-full" />;
   }
   ```

---

### Task 6: External GLTF Model Sources

The following GLTF models can be used:

1. **Default Office Model** (currently used):
   ```
   https://rawcdn.githack.com/ricardoolivaalonso/ThreeJS-Room01/98fd8d7909308ec03a596928a394bb25ed9239f1/THREEJS2.glb
   ```

2. **Local Models** (place in `public/models/`):
   - Modern Apartment Building: `/models/modern-apartment-building.glb`
   - Office Interior: `/models/office-interior.glb`

3. **User Upload**: Add file input to allow users to upload their own GLTF/GLB files

---

## Environment Variables Required

Add to `.env.local`:
```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_3DVERSE_TOKEN=your_3dverse_token (optional)
VITE_3DVERSE_SCENE_ID=your_scene_uuid (optional)
```

---

## Testing Checklist

- [ ] Run `npm run dev` and verify no TypeScript errors
- [ ] Navigate to Digital Twin panel
- [ ] Toggle between Parametric and 3D GLTF interior views
- [ ] Verify IoT sensor markers appear and are clickable
- [ ] Test system overlay toggles (HVAC, Plumbing, Electrical)
- [ ] Test day/night mode toggle
- [ ] Open TwinARVRModelViewer and test all controls
- [ ] Test explode view slider
- [ ] Verify Google Maps loads (if API key configured)
- [ ] Test IoT Dashboard real-time updates
- [ ] Test alert acknowledgment

---

## File Structure Reference

```
src/features/digital-twin/
├── components/
│   ├── BuildingViewer3D.tsx          # Main xeokit-based 3D viewer
│   ├── TwinUnitInteriorViewer.tsx    # NEW: Three.js GLTF interior viewer
│   ├── TwinARVRModelViewer.tsx       # NEW: Full-featured 3D model viewer
│   ├── TwinIoTDashboard.tsx          # NEW: Real-time IoT monitoring
│   ├── TwinIoTMonitoringPanel.tsx    # Basic IoT panel (kept for compatibility)
│   ├── TwinInteriorStudioPanel.tsx   # Parametric interior generator
│   ├── TwinPropertyIntelligencePanel.tsx  # Property data + Google Maps
│   ├── TwinPanelRight.tsx            # Updated with interior view toggle
│   └── ...
├── DigitalTwinPanel.tsx              # Main panel component
├── index.ts                          # Updated exports
└── types.ts

src/components/
├── maps/
│   └── GoogleMapsEmbed.tsx           # NEW: Google Maps integration
└── ...
```

---

## Notes for Codex

1. **Three.js** is already installed (`"three": "^0.174.0"`)
2. **TypeScript types** for Three.js: `@types/three` may need to be added if not present
3. The office GLTF model loads from a CDN - for production, consider hosting locally
4. AR/VR features are placeholder - WebXR implementation requires compatible browser/device
5. All new components follow existing design patterns (V2Surface, V2StatusPill, Button)
6. Color tokens use CSS variables (e.g., `var(--semantic-primary)`)

---

## Common Issues

### Model not loading
- Check browser console for CORS errors
- Verify GLTF URL is accessible
- Check if model is DRACO compressed (loader handles this)

### Google Maps not showing
- Verify API key is set in `.env.local`
- Check Google Cloud Console for API restrictions
- Enable Maps JavaScript API in Google Cloud Console

### TypeScript errors
- Run `npm install` to ensure all dependencies are installed
- Check for missing type definitions

---

*Document created: March 30, 2026*
*Last updated: March 30, 2026*

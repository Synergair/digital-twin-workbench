import { Navigate, Route, Routes, useSearchParams } from 'react-router-dom';
import { EstateShell } from './components/estate/EstateShell';
import { TwinShell } from './features/digital-twin/components/shell/TwinShell';

function EstatePage() {
  const [params] = useSearchParams();
  const embed = params.get('embed') === 'true';
  const propertyId = params.get('propertyId') ?? null;
  const shell = params.get('shell') === 'true';

  // When embedded with a propertyId, show the full TwinShell (3D viewer with MEP, floor plans, etc.)
  if (embed && propertyId) {
    return <TwinShell propertyId={propertyId} readOnly={false} />;
  }

  // When shell=true with a propertyId, also show TwinShell
  if (shell && propertyId) {
    return <TwinShell propertyId={propertyId} readOnly={false} />;
  }

  // Otherwise show the EstateShell (portfolio/building/unit hierarchy)
  return (
    <EstateShell
      embed={embed}
      initialPropertyId={propertyId}
      initialShell={false}
    />
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<EstatePage />} />
      <Route path="/embed" element={<EstatePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

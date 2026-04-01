import { Navigate, Route, Routes } from 'react-router-dom';
import { EstateShell } from './components/estate/EstateShell';
import { TwinShell } from './features/digital-twin/components/shell/TwinShell';

// Read params from window.location.search directly to avoid React Router basename issues
function getParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    embed: params.get('embed') === 'true',
    propertyId: params.get('propertyId') ?? null,
    unitId: params.get('unitId') ?? null,
    view: params.get('view') ?? null,
    shell: params.get('shell') === 'true',
  };
}

function EstatePage() {
  const { embed, propertyId, unitId, shell } = getParams();

  // When embedded with a propertyId, show the full TwinShell
  if ((embed || shell) && propertyId) {
    return <TwinShell propertyId={propertyId} unitId={unitId} readOnly={false} />;
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
      <Route path="/index.html" element={<EstatePage />} />
      <Route path="*" element={<EstatePage />} />
    </Routes>
  );
}

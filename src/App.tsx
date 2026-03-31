import { Navigate, Route, Routes, useSearchParams } from 'react-router-dom';
import { EstateShell } from './components/estate/EstateShell';

function EstatePage() {
  const [params] = useSearchParams();
  const embed = params.get('embed') === 'true';
  const propertyId = params.get('propertyId') ?? null;
  const shell = params.get('shell') === 'true';

  return (
    <EstateShell
      embed={embed}
      initialPropertyId={propertyId}
      initialShell={shell}
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

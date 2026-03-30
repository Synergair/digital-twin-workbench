import { Link, Navigate, Route, Routes, useParams, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import OwnerDigitalTwinPage from './pages/owner/OwnerDigitalTwinPage';
import TenantDigitalTwinPage from './pages/tenant/TenantDigitalTwinPage';
import { DigitalTwinOverview, DigitalTwinWorkspace } from './features/digital-twin';
import { useOwnerPropertiesStore } from './store/ownerPropertiesStore';
import { getPersona, personaConfigs } from './features/digital-twin/personas';

const DEFAULT_PROPERTY_ID = 'prop-midrise-condo';

function WorkbenchHome() {
  const properties = useOwnerPropertiesStore((state) => state.properties);
  const [personaId, setPersonaId] = useState(personaConfigs[0].id);
  const defaultProperty = properties.find((entry) => entry.id === DEFAULT_PROPERTY_ID)?.id ?? properties[0]?.id ?? DEFAULT_PROPERTY_ID;
  const [propertyId, setPropertyId] = useState(defaultProperty);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="rounded-3xl border border-[var(--semantic-border)] bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[var(--semantic-text)]">Digital Twin Workbench</h1>
        <p className="mt-2 text-sm text-[var(--semantic-text-subtle)]">
          Environnement isolé pour simuler les scénarios propriétaires, gestionnaires, développeurs et locataires sur différents types de bâtiments.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
        <div className="rounded-3xl border border-[var(--semantic-border)] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--semantic-text)]">Personas</h2>
          <p className="mt-1 text-sm text-[var(--semantic-text-subtle)]">Choisissez un rôle pour calibrer le workspace.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {personaConfigs.map((persona) => (
              <button
                key={persona.id}
                type="button"
                onClick={() => setPersonaId(persona.id)}
                className={`rounded-2xl border p-4 text-left transition ${
                  personaId === persona.id
                    ? 'border-[#0d7377] bg-[#eef7f6]'
                    : 'border-[var(--semantic-border)] bg-[var(--panel-soft)] hover:border-[#0d7377]/30'
                }`}
              >
                <p className="text-sm font-semibold text-[var(--semantic-text)]">{persona.label}</p>
                <p className="mt-1 text-xs text-[var(--semantic-text-subtle)]">{persona.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--semantic-border)] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--semantic-text)]">Types de bâtiments</h2>
          <p className="mt-1 text-sm text-[var(--semantic-text-subtle)]">Sélectionnez un archetype à visualiser.</p>
          <div className="mt-4 max-h-[360px] space-y-2 overflow-auto pr-2">
            {properties.map((property) => (
              <button
                key={property.id}
                type="button"
                onClick={() => setPropertyId(property.id)}
                className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ${
                  propertyId === property.id
                    ? 'border-[#0d7377] bg-[#eef7f6]'
                    : 'border-[var(--semantic-border)] bg-[var(--panel-soft)] hover:border-[#0d7377]/30'
                }`}
              >
                <span className="font-semibold text-[var(--semantic-text)]">{property.name}</span>
                <span className="text-xs text-[var(--semantic-text-subtle)]">{property.floors} étages</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          to={`/workbench/view?persona=${personaId}&property=${DEFAULT_PROPERTY_ID}`}
          className="rounded-full bg-[var(--semantic-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm"
        >
          Ouvrir le workspace (OKey base)
        </Link>
        <Link
          to={`/workbench/view?persona=${personaId}&property=${propertyId}`}
          className="rounded-full border border-[var(--semantic-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--semantic-text)]"
        >
          Ouvrir l'archetype sélectionné
        </Link>
        <Link
          to={`/owner/properties/${DEFAULT_PROPERTY_ID}/digital-twin`}
          className="rounded-full border border-[var(--semantic-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--semantic-text)]"
        >
          OKey base workspace
        </Link>
        <Link
          to={`/owner/properties/${propertyId}`}
          className="rounded-full border border-[var(--semantic-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--semantic-text)]"
        >
          Vue propriétaire (overview)
        </Link>
      </div>
    </div>
  );
}

function WorkbenchView() {
  const [params] = useSearchParams();
  const persona = getPersona(params.get('persona'));
  const propertyId = params.get('property') ?? DEFAULT_PROPERTY_ID;
  const profile = useOwnerPropertiesStore((state) => state.getPropertyById(propertyId));

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[var(--semantic-border)] bg-white p-6 shadow-sm">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--semantic-text-subtle)]">Workbench</p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--semantic-text)]">{profile?.name ?? 'Digital Twin'}</h1>
          <p className="mt-1 text-sm text-[var(--semantic-text-subtle)]">Persona: {persona.label}</p>
        </div>
        <Link className="text-sm font-semibold text-[var(--semantic-primary)]" to="/workbench">
          Changer de scénario
        </Link>
      </div>

      <DigitalTwinWorkspace
        propertyId={propertyId}
        readOnly={persona.readOnly}
        canViewOtherUnits={persona.canViewOtherUnits}
        presetTab={persona.defaultTab}
        presetLayers={persona.defaultLayers}
      />
    </div>
  );
}

function OwnerOverviewRoute() {
  const { id } = useParams();
  if (!id) {
    return <Navigate to={`/owner/properties/${DEFAULT_PROPERTY_ID}`} replace />;
  }
  return (
    <div className="mx-auto max-w-6xl p-6">
      <DigitalTwinOverview propertyId={id} />
    </div>
  );
}

function OwnerPropertiesIndex() {
  const properties = useOwnerPropertiesStore((state) => state.properties);
  return (
    <div className="mx-auto max-w-4xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold text-[var(--semantic-text)]">Propriétés</h1>
      <p className="text-sm text-[var(--semantic-text-subtle)]">Sélectionnez une propriété pour explorer le digital twin.</p>
      <div className="grid gap-3">
        {properties.map((property) => (
          <Link
            key={property.id}
            to={`/owner/properties/${property.id}`}
            className="flex items-center justify-between rounded-xl border border-[var(--semantic-border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--semantic-text)]"
          >
            <span>{property.name}</span>
            <span className="text-xs text-[var(--semantic-text-subtle)]">{property.floors} étages</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function OwnerMaintenancePlaceholder() {
  return (
    <div className="mx-auto max-w-4xl space-y-3 p-6">
      <h1 className="text-2xl font-semibold text-[var(--semantic-text)]">Entretien</h1>
      <p className="text-sm text-[var(--semantic-text-subtle)]">Placeholder workbench - à connecter aux flows maintenance.</p>
      <Link className="text-sm font-semibold text-[var(--semantic-primary)]" to={`/owner/properties/${DEFAULT_PROPERTY_ID}/digital-twin`}>
        Retour au Digital Twin
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<WorkbenchHome />} />
      <Route path="/workbench" element={<WorkbenchHome />} />
      <Route path="/workbench/view" element={<WorkbenchView />} />
      <Route path="/owner/properties" element={<OwnerPropertiesIndex />} />
      <Route path="/owner/properties/:id" element={<OwnerOverviewRoute />} />
      <Route path="/owner/properties/:id/digital-twin" element={<OwnerDigitalTwinPage />} />
      <Route path="/owner/maintenance" element={<OwnerMaintenancePlaceholder />} />
      <Route path="/tenant/digital-twin" element={<TenantDigitalTwinPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

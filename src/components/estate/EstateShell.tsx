import { useState, useMemo, useCallback } from 'react';
import { useOwnerPropertiesStore } from '@/store/ownerPropertiesStore';
import { getTwinData } from '@/features/digital-twin/twinData';
import { TopToolbar } from './TopToolbar';
import { BottomBar } from './BottomBar';
import { PortfolioView } from './PortfolioView';
import { BuildingView } from './BuildingView';
import { UnitView } from './UnitView';
import { UnitListPanel } from './UnitListPanel';
import { UnitInfoPanel } from './UnitInfoPanel';
import { PortfolioPanel } from './PortfolioPanel';

// ── View hierarchy state machine ─────────────────────
export type EstateLevel = 'portfolio' | 'building' | 'unit';
export type ViewMode = 'exterior' | 'model360' | 'floorplan3d' | 'tour';
export type PortfolioViewMode = 'map' | 'grid';

export interface EstateState {
  level: EstateLevel;
  propertyId: string | null;
  unitId: string | null;
  viewMode: ViewMode;
  portfolioViewMode: PortfolioViewMode;
  isDark: boolean;
}

interface EstateShellProps {
  embed?: boolean;
  initialPropertyId?: string | null;
  initialShell?: boolean;
}

export function EstateShell({ embed = false, initialPropertyId = null, initialShell = false }: EstateShellProps) {
  const [state, setState] = useState<EstateState>({
    level: initialPropertyId ? (initialShell ? 'unit' : 'building') : 'portfolio',
    propertyId: initialPropertyId,
    unitId: null,
    viewMode: 'exterior',
    portfolioViewMode: 'map',
    isDark: true,
  });

  const properties = useOwnerPropertiesStore((s) => s.properties);
  const getUnitsByProperty = useOwnerPropertiesStore((s) => s.getUnitsByProperty);

  const currentProperty = useMemo(
    () => properties.find((p) => p.id === state.propertyId) ?? null,
    [properties, state.propertyId],
  );

  // Convert store units (unitNumber, sqft, rent) → normalized shape (unit_number, area_m2, floor, current_rent)
  const currentUnits = useMemo(() => {
    if (!state.propertyId) return [];
    const raw = getUnitsByProperty(state.propertyId);
    return raw.map((u) => {
      // Derive floor from unit ID pattern: "prop-xxx-unit-{floor}-{index}"
      const idParts = u.id.split('-');
      const floorIdx = idParts.indexOf('unit');
      const floor = floorIdx >= 0 && idParts[floorIdx + 1] ? Number(idParts[floorIdx + 1]) : 0;

      return {
        id: u.id,
        property_id: u.propertyId,
        unit_number: u.unitNumber,
        unit_type: 'residential' as const,
        floor,
        area_m2: Math.round(u.sqft * 0.0929),
        current_rent: u.rent,
        status: u.status as 'occupied' | 'vacant' | 'alert' | 'warn',
        tenant_name: u.tenantName ?? null,
        lease_expiry: u.leaseEnd ?? null,
        has_digital_twin: true,
        last_capture_at: null,
        active_alerts: [] as any[],
        bedrooms: u.bedrooms,
        sqft: u.sqft,
      };
    });
  }, [state.propertyId, getUnitsByProperty]);

  const currentUnit = useMemo(
    () => currentUnits.find((u) => u.id === state.unitId) ?? null,
    [currentUnits, state.unitId],
  );

  const twinData = useMemo(
    () => (state.propertyId ? getTwinData(state.propertyId) : null),
    [state.propertyId],
  );

  // ── Navigation actions ───────────────────────────
  const navigateToPortfolio = useCallback(() => {
    setState((s) => ({ ...s, level: 'portfolio', propertyId: null, unitId: null, viewMode: 'exterior' }));
  }, []);

  const navigateToBuilding = useCallback((propertyId: string) => {
    setState((s) => ({ ...s, level: 'building', propertyId, unitId: null, viewMode: 'exterior' }));
  }, []);

  const navigateToUnit = useCallback((unitId: string) => {
    setState((s) => ({ ...s, level: 'unit', unitId, viewMode: 'exterior' }));
  }, []);

  const navigateBack = useCallback(() => {
    setState((s) => {
      if (s.level === 'unit') return { ...s, level: 'building', unitId: null, viewMode: 'exterior' };
      if (s.level === 'building') return { ...s, level: 'portfolio', propertyId: null, unitId: null };
      return s;
    });
    // PostMessage for OKey embed
    if (embed && state.level === 'building') {
      window.parent.postMessage({ type: 'dtw:navigate-back' }, '*');
    }
  }, [embed, state.level]);

  const setViewMode = useCallback((mode: ViewMode) => {
    setState((s) => ({ ...s, viewMode: mode }));
  }, []);

  const setPortfolioViewMode = useCallback((mode: PortfolioViewMode) => {
    setState((s) => ({ ...s, portfolioViewMode: mode }));
  }, []);

  const toggleDark = useCallback(() => {
    setState((s) => ({ ...s, isDark: !s.isDark }));
  }, []);

  // ── Render ───────────────────────────────────────
  return (
    <div className={`fixed inset-0 flex flex-col ${state.isDark ? 'bg-slate-900 text-white' : 'bg-gray-50 text-slate-900'}`}>
      {/* Top Toolbar */}
      <TopToolbar
        level={state.level}
        viewMode={state.viewMode}
        property={currentProperty}
        unit={currentUnit}
        properties={properties}
        selectedPropertyId={state.propertyId}
        portfolioViewMode={state.portfolioViewMode}
        isDark={state.isDark}
        embed={embed}
        onBack={navigateBack}
        onSelectProperty={navigateToBuilding}
        onSetViewMode={setViewMode}
        onSetPortfolioViewMode={setPortfolioViewMode}
      />

      {/* Main content: viewer (left) + panel (right) */}
      <div className="flex flex-1 overflow-hidden">
        {/* Viewer area */}
        <div className="relative flex-1 overflow-hidden">
          {state.level === 'portfolio' && (
            <PortfolioView
              properties={properties}
              viewMode={state.portfolioViewMode}
              isDark={state.isDark}
              onSelectProperty={navigateToBuilding}
            />
          )}

          {state.level === 'building' && currentProperty && (
            <BuildingView
              property={currentProperty}
              units={currentUnits}
              twinData={twinData}
              isDark={state.isDark}
              selectedUnitId={state.unitId}
              onSelectUnit={navigateToUnit}
            />
          )}

          {state.level === 'unit' && currentProperty && currentUnit && (
            <UnitView
              property={currentProperty}
              unit={currentUnit}
              units={currentUnits}
              twinData={twinData}
              viewMode={state.viewMode}
              isDark={state.isDark}
            />
          )}
        </div>

        {/* Right panel — collapses on mobile */}
        <div className={`hidden w-[380px] flex-shrink-0 flex-col border-l md:flex ${
          state.isDark ? 'border-white/10 bg-slate-900/95' : 'border-gray-200 bg-white'
        }`}>
          {/* Chevron toggle for collapsing */}
          <div className="flex-1 overflow-y-auto">
            {state.level === 'portfolio' && (
              <PortfolioPanel
                properties={properties}
                isDark={state.isDark}
                onSelectProperty={navigateToBuilding}
              />
            )}

            {state.level === 'building' && currentProperty && (
              <UnitListPanel
                property={currentProperty}
                units={currentUnits}
                twinData={twinData}
                isDark={state.isDark}
                selectedUnitId={state.unitId}
                onSelectUnit={navigateToUnit}
              />
            )}

            {state.level === 'unit' && currentProperty && currentUnit && (
              <UnitInfoPanel
                property={currentProperty}
                unit={currentUnit}
                units={currentUnits}
                twinData={twinData}
                isDark={state.isDark}
                onBack={() => setState((s) => ({ ...s, level: 'building', unitId: null }))}
                onSelectUnit={navigateToUnit}
              />
            )}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <BottomBar
        level={state.level}
        viewMode={state.viewMode}
        isDark={state.isDark}
        onToggleDark={toggleDark}
      />
    </div>
  );
}

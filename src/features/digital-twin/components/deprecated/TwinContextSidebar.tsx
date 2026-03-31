import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, ClipboardList, User, Wrench } from '@/components/icons/basil-lucide';
import Button from '@/components/ui/button';
import type { TwinPin, TwinSeverity, TwinUnit } from '../../types';

interface TwinContextSidebarProps {
  unit: TwinUnit | null;
  units: TwinUnit[];
  pins: TwinPin[];
  severity: TwinSeverity;
  pinDropMode: boolean;
  readOnly: boolean;
  onChangeSeverity: (severity: TwinSeverity) => void;
  onTogglePinDrop: () => void;
  onStartDispatch: () => void;
}

const severityOptions: { value: TwinSeverity; label: string; color: string }[] = [
  { value: 'urgent', label: 'Urgent', color: 'bg-rose-500' },
  { value: 'standard', label: 'Standard', color: 'bg-sky-500' },
  { value: 'planifie', label: 'Planifié', color: 'bg-amber-500' },
];

export function TwinContextSidebar({
  unit,
  units,
  pins,
  severity,
  pinDropMode,
  readOnly,
  onChangeSeverity,
  onTogglePinDrop,
  onStartDispatch,
}: TwinContextSidebarProps) {
  const [actionsExpanded, setActionsExpanded] = useState(true);

  // Calculate relevant alerts for the selected unit or all units
  const relevantAlerts = unit
    ? unit.active_alerts
    : units.flatMap((u) => u.active_alerts).slice(0, 5);

  const urgentAlerts = relevantAlerts.filter((a) => a.severity === 'urgent');

  return (
    <div className="space-y-4">
      {/* Unit Context Card */}
      <div className="surface-card-minimal p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--semantic-primary-soft)]">
            <User className="h-5 w-5 text-[var(--semantic-primary)]" />
          </div>
          <div className="min-w-0 flex-1">
            {unit ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-[var(--semantic-text)]">
                    Unité {unit.unit_number}
                  </h3>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    unit.status === 'alert' ? 'bg-rose-100 text-rose-700' :
                    unit.status === 'warn' ? 'bg-amber-100 text-amber-700' :
                    unit.status === 'vacant' ? 'bg-slate-100 text-slate-600' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {unit.status}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-[var(--semantic-text-subtle)]">
                  {unit.unit_type} • {unit.area_m2.toFixed(0)} m²
                </p>
              </>
            ) : (
              <>
                <h3 className="font-semibold text-[var(--semantic-text)]">Aucune unité</h3>
                <p className="mt-0.5 text-xs text-[var(--semantic-text-subtle)]">
                  Sélectionnez une unité dans le viewer
                </p>
              </>
            )}
          </div>
        </div>

        {unit && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <InfoItem label="Locataire" value={unit.tenant_name ?? 'Vacant'} />
            <InfoItem
              label="Loyer"
              value={unit.current_rent ? `${unit.current_rent.toLocaleString('fr-CA')} $` : 'N/A'}
            />
            <InfoItem
              label="Échéance bail"
              value={unit.lease_expiry
                ? new Date(unit.lease_expiry).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })
                : 'N/A'}
            />
            <InfoItem label="Pins actifs" value={String(pins.length)} />
          </div>
        )}
      </div>

      {/* Alerts Summary */}
      {relevantAlerts.length > 0 && (
        <div className="surface-card-minimal p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`h-4 w-4 ${urgentAlerts.length > 0 ? 'text-rose-500' : 'text-amber-500'}`} />
            <span className="text-sm font-medium text-[var(--semantic-text)]">
              {relevantAlerts.length} alerte{relevantAlerts.length > 1 ? 's' : ''}
              {urgentAlerts.length > 0 && (
                <span className="ml-1 text-rose-600">({urgentAlerts.length} urgente{urgentAlerts.length > 1 ? 's' : ''})</span>
              )}
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {relevantAlerts.slice(0, 3).map((alert, index) => (
              <div
                key={index}
                className={`flex items-start gap-2 rounded-lg p-2 text-xs ${
                  alert.severity === 'urgent' ? 'bg-rose-50' : 'bg-amber-50'
                }`}
              >
                <span className={`mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${
                  alert.severity === 'urgent' ? 'bg-rose-500' : 'bg-amber-500'
                }`} />
                <span className="text-[var(--semantic-text)]">{alert.description}</span>
              </div>
            ))}
            {relevantAlerts.length > 3 && (
              <p className="text-center text-[10px] text-[var(--semantic-text-muted)]">
                +{relevantAlerts.length - 3} autres alertes
              </p>
            )}
          </div>
        </div>
      )}

      {/* Actions Panel - Collapsible */}
      <div className="surface-card-minimal overflow-hidden">
        <button
          type="button"
          onClick={() => setActionsExpanded(!actionsExpanded)}
          className="collapsible-header w-full"
        >
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-[var(--semantic-primary)]" />
            <span className="text-sm font-medium text-[var(--semantic-text)]">Actions</span>
            {pinDropMode && (
              <span className="rounded-full bg-[var(--semantic-primary)] px-2 py-0.5 text-[10px] font-medium text-white">
                Pose active
              </span>
            )}
          </div>
          {actionsExpanded ? (
            <ChevronUp className="h-4 w-4 text-[var(--semantic-text-subtle)]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[var(--semantic-text-subtle)]" />
          )}
        </button>

        {actionsExpanded && (
          <div className="space-y-4 p-4 pt-0">
            {/* Severity Selection */}
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--semantic-text-muted)]">
                Sévérité
              </p>
              <div className="mt-2 flex gap-2">
                {severityOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onChangeSeverity(option.value)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      severity === option.value
                        ? 'bg-[var(--semantic-text)] text-white'
                        : 'bg-[var(--panel-soft)] text-[var(--semantic-text-subtle)] hover:bg-[var(--semantic-border)]'
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${option.color}`} />
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid gap-2">
              <Button
                type="button"
                variant={pinDropMode ? 'secondary' : 'primary'}
                onClick={onTogglePinDrop}
                disabled={readOnly || !unit}
                className="w-full justify-center"
              >
                <ClipboardList className="mr-2 h-4 w-4" />
                {pinDropMode ? 'Annuler' : 'Épingler problème'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={onStartDispatch}
                disabled={!unit}
                className="w-full justify-center"
              >
                Ouvrir briefing
              </Button>
            </div>

            {/* Context Info */}
            {unit && (
              <div className="rounded-lg bg-[var(--panel-soft)] p-3">
                <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--semantic-text-muted)]">
                  Contexte MEP
                </p>
                <ul className="mt-2 space-y-1 text-xs text-[var(--semantic-text)]">
                  <li>Mur: gypse 38 mm, feu 45 min</li>
                  <li>Plomberie: cuivre à 18-22 cm</li>
                  <li>Pins liés: {pins.length}</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--semantic-text-muted)]">
        {label}
      </p>
      <p className="mt-0.5 truncate text-sm text-[var(--semantic-text)]">{value}</p>
    </div>
  );
}

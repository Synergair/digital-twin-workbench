import { useMemo, useState } from 'react';
import Badge from '@/components/ui/badge';
import { V2StatusPill } from '@/components/dashboard/v2/primitives';
import { cn } from '@/lib/utils';
import { getTwinData } from '../twinData';
import { DocumentPreviewModal, type DocumentPreview } from './DocumentPreviewModal';

const currency = new Intl.NumberFormat('fr-CA', {
  style: 'currency',
  currency: 'CAD',
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat('fr-CA');

const percent = new Intl.NumberFormat('fr-CA', {
  maximumFractionDigits: 1,
});

const cardBase = 'rounded-[24px] border border-[var(--semantic-border)] bg-white/86 p-4';

const statusTone = (status: 'unclaimed' | 'pending' | 'verified') => {
  if (status === 'verified') return 'success';
  if (status === 'pending') return 'warning';
  return 'neutral';
};

const statusLabel = (status: 'unclaimed' | 'pending' | 'verified') => {
  if (status === 'verified') return 'Verifie';
  if (status === 'pending') return 'En validation';
  return 'Non revendique';
};

const typeTone = (type: 'permit' | 'lease' | 'maintenance' | 'inspection' | 'ownership') => {
  switch (type) {
    case 'permit':
      return 'warning';
    case 'lease':
      return 'info';
    case 'maintenance':
      return 'danger';
    case 'inspection':
      return 'success';
    case 'ownership':
    default:
      return 'neutral';
  }
};

const maintenanceTone = (status: 'completed' | 'in-progress' | 'scheduled') => {
  if (status === 'completed') return 'success';
  if (status === 'in-progress') return 'info';
  return 'warning';
};

const assetTone = (status: 'online' | 'degraded' | 'offline' | 'inspection') => {
  if (status === 'online') return 'success';
  if (status === 'degraded') return 'warning';
  if (status === 'inspection') return 'info';
  return 'danger';
};

const materialTone = (status: 'in-stock' | 'low' | 'ordered') => {
  if (status === 'in-stock') return 'success';
  if (status === 'low') return 'warning';
  return 'info';
};

const incidentTone = (severity: 'low' | 'medium' | 'high' | 'critical') => {
  if (severity === 'low') return 'success';
  if (severity === 'medium') return 'warning';
  if (severity === 'high') return 'danger';
  return 'danger';
};

const invoiceTone = (status: 'paid' | 'open' | 'overdue') => {
  if (status === 'paid') return 'success';
  if (status === 'open') return 'info';
  return 'danger';
};

const changeTone = (status: 'approved' | 'pending' | 'rejected') => {
  if (status === 'approved') return 'success';
  if (status === 'pending') return 'warning';
  return 'danger';
};

function MetricCard({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <div className="rounded-2xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--semantic-text-subtle)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--semantic-text)]">{value}</p>
      {helper ? <p className="mt-1 text-[11px] text-[var(--semantic-text-subtle)]">{helper}</p> : null}
    </div>
  );
}

export function TwinDataUniversePanel({ propertyId }: { propertyId: string }) {
  const data = useMemo(() => getTwinData(propertyId), [propertyId]);
  const [selectedDoc, setSelectedDoc] = useState<DocumentPreview | null>(null);
  const timelineEntries = useMemo(() => {
    const entries = [
      ...data.timeline.map((event) => ({
        date: event.date,
        title: event.label,
        meta: 'Memoire du batiment',
        label: event.type,
        variant: typeTone(event.type),
      })),
      ...data.maintenanceHistory.map((entry) => ({
        date: entry.date,
        title: `Maintenance ${entry.system}`,
        meta: `${entry.vendor} • ${currency.format(entry.cost)}`,
        label: entry.status,
        variant: maintenanceTone(entry.status),
      })),
      ...data.incidentReports.map((incident) => ({
        date: incident.date,
        title: `Incident ${incident.category}`,
        meta: incident.description,
        label: incident.severity,
        variant: incidentTone(incident.severity),
      })),
      ...data.changeOrders.map((order) => ({
        date: order.date,
        title: `Change order ${order.changeId}`,
        meta: `${order.scope} • ${order.approvedBy}`,
        label: order.status,
        variant: changeTone(order.status),
      })),
    ];

    return entries.sort((a, b) => b.date.localeCompare(a.date));
  }, [data]);

  const documents = useMemo(() => {
    const items = [
      ...data.invoices.map((invoice) => ({
        id: invoice.invoiceId,
        type: 'Invoice',
        title: invoice.attachment,
        meta: `${invoice.vendor} • ${invoice.invoiceId}`,
        date: invoice.issuedDate,
        status: invoice.status,
        url: `/documents/${invoice.attachment}`,
        format: 'pdf' as const,
        variant: invoiceTone(invoice.status),
      })),
      ...data.warrantyDocs.map((doc) => ({
        id: doc.docId,
        type: 'Warranty',
        title: doc.file,
        meta: `${doc.system} • ${doc.provider}`,
        date: doc.expiry,
        status: undefined,
        url: `/documents/${doc.file}`,
        format: 'pdf' as const,
        variant: 'neutral' as const,
      })),
      ...data.inspectionPhotos.map((photo) => ({
        id: photo.photoId,
        type: 'Inspection',
        title: photo.photoId,
        meta: `${photo.area} • ${photo.inspector}`,
        date: photo.capturedAt,
        status: undefined,
        url: photo.url,
        format: 'image' as const,
        variant: 'neutral' as const,
      })),
      ...data.vendorInsuranceCertificates.map((cert) => ({
        id: cert.policyId,
        type: 'Insurance',
        title: cert.certificate,
        meta: `${cert.vendor} • ${currency.format(cert.coverage)}`,
        date: cert.expiry,
        status: undefined,
        url: `/documents/${cert.certificate}`,
        format: 'pdf' as const,
        variant: 'neutral' as const,
      })),
      ...data.ifcModels.map((model) => ({
        id: model.id,
        type: 'IFC Model',
        title: model.file,
        meta: `${model.buildingType} • ${model.sizeMb}MB`,
        date: model.updatedAt,
        status: undefined,
        url: `/documents/models/${model.file}`,
        format: 'file' as const,
        variant: 'neutral' as const,
      })),
      ...data.floorPlans.map((plan) => ({
        id: plan.id,
        type: 'Floor plan',
        title: plan.file,
        meta: `${plan.label} • ${plan.level}`,
        date: plan.updatedAt,
        status: undefined,
        url: `/documents/floorplans/${plan.file}`,
        format: 'image' as const,
        variant: 'neutral' as const,
      })),
      ...data.mepDocs.map((doc) => ({
        id: doc.id,
        type: 'MEP Doc',
        title: doc.file,
        meta: `${doc.discipline} • ${doc.title}`,
        date: doc.updatedAt,
        status: undefined,
        url: `/documents/mep/${doc.file}`,
        format: 'pdf' as const,
        variant: 'neutral' as const,
      })),
      ...data.inspectionChecklists.map((doc) => ({
        id: doc.id,
        type: 'Inspection',
        title: doc.file,
        meta: `${doc.authority} • ${doc.title}`,
        date: doc.updatedAt,
        status: undefined,
        url: `/documents/inspections/${doc.file}`,
        format: 'pdf' as const,
        variant: 'neutral' as const,
      })),
      ...data.pointCloudScans.map((scan) => ({
        id: scan.id,
        type: 'Point cloud',
        title: scan.archive,
        meta: `${scan.name} • ${scan.points}`,
        date: scan.capturedAt,
        status: undefined,
        url: `/documents/scans/${scan.preview}`,
        downloadUrl: `/documents/scans/${scan.archive}`,
        format: 'image' as const,
        variant: 'neutral' as const,
      })),
    ];

    return items.sort((a, b) => b.date.localeCompare(a.date));
  }, [data]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
      <div className="space-y-4">
        <section className={cardBase}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--semantic-text)]">Registre & propriete</p>
              <p className="text-xs text-[var(--semantic-text-subtle)]">Reference officielle, statut de revendication, sources.</p>
            </div>
            <Badge variant="outline">{data.twinId}</Badge>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <MetricCard label="Adresse" value={data.geo.address} helper={`Parcelle ${data.geo.parcelId}`} />
            <MetricCard label="Zonage" value={data.geo.zoning} helper={`${data.geo.lat}, ${data.geo.lon}`} />
            <div className="rounded-2xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--semantic-text-subtle)]">Revendication</p>
              <div className="mt-2 flex items-center gap-2">
                <V2StatusPill label={statusLabel(data.ownership.claimStatus)} variant={statusTone(data.ownership.claimStatus)} />
                <span className="text-xs text-[var(--semantic-text-subtle)]">{data.ownership.verification}</span>
              </div>
              <p className="mt-2 text-[11px] text-[var(--semantic-text-subtle)]">Dernier transfert {data.ownership.lastTransfer}</p>
            </div>
            <div className="rounded-2xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--semantic-text-subtle)]">Sources</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {data.dataSources.map((source) => (
                  <span key={source} className="rounded-full border border-[var(--semantic-border)] bg-white px-2.5 py-1 text-[11px] font-semibold">
                    {source}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className={cardBase}>
          <div>
            <p className="text-sm font-semibold text-[var(--semantic-text)]">Leasing & finance</p>
            <p className="text-xs text-[var(--semantic-text-subtle)]">Performance d occupation, rent roll et ratios financiers.</p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <MetricCard label="Occupation" value={`${percent.format(data.leasing.occupancyRate)}%`} helper={`${data.leasing.vacancyUnits} vacants`} />
            <MetricCard label="Rent roll" value={currency.format(data.leasing.rentRollMonthly)} helper="Mensuel" />
            <MetricCard label="Baux" value={data.leasing.leaseExpiries.join(', ')} helper="Echeances majeures" />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <MetricCard label="Valeur" value={currency.format(data.financing.valuation)} helper="Evaluation marchande" />
            <MetricCard label="NOI annuel" value={currency.format(data.financing.noiAnnual)} helper={`Cap rate ${data.financing.capRate}%`} />
            <MetricCard label="Service dette" value={currency.format(data.financing.debtService)} helper="Annuelle" />
          </div>
        </section>

        <section className={cardBase}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--semantic-text)]">Assurance & carbone</p>
              <p className="text-xs text-[var(--semantic-text-subtle)]">Couvertures, risques et empreinte carbone cible.</p>
            </div>
            <Badge variant="info">{data.carbon.certification}</Badge>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <MetricCard label="Assureur" value={data.insurance.provider} helper={`Risque ${data.insurance.riskScore}/100`} />
            <MetricCard label="Prime" value={currency.format(data.insurance.premiumAnnual)} helper="Annuelle" />
            <MetricCard label="Couverture" value={currency.format(data.insurance.coverage)} helper="Plafond" />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <MetricCard label="Energie" value={`${number.format(data.carbon.energyKwhAnnual)} kWh`} helper="Annuel" />
            <MetricCard label="Emissions" value={`${number.format(data.carbon.emissionsTons)} tCO2e`} helper="Annuel" />
            <MetricCard label="Offsets" value={`${number.format(data.carbon.offsetCredits)} credits`} helper="Compensation" />
          </div>
        </section>
      </div>

      <div className="space-y-4">
        <section className={cardBase}>
          <div>
            <p className="text-sm font-semibold text-[var(--semantic-text)]">Operations & conformite</p>
            <p className="text-xs text-[var(--semantic-text-subtle)]">Planning previsionnel, audits, et work orders.</p>
          </div>
          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--semantic-text-subtle)]">Prochaines inspections</p>
              <div className="mt-2 grid gap-2">
                {data.facilities.nextInspections.map((inspection) => (
                  <div key={inspection.label} className="flex items-center justify-between text-xs text-[var(--semantic-text)]">
                    <span>{inspection.label}</span>
                    <span className="text-[var(--semantic-text-subtle)]">{inspection.due}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <MetricCard label="Preventif" value={number.format(data.facilities.preventiveTasks)} helper="Taches actives" />
              <MetricCard label="Work orders" value={number.format(data.facilities.activeWorkOrders)} helper="Ouverts" />
              <MetricCard label="Audits" value={number.format(data.compliance.auditsDue)} helper={`Dernier ${data.compliance.lastAudit}`} />
            </div>
            <MetricCard label="Permis ouverts" value={number.format(data.compliance.permitsOpen)} helper="Regulateur municipal" />
          </div>
        </section>

        <section className={cardBase}>
          <div>
            <p className="text-sm font-semibold text-[var(--semantic-text)]">Historique maintenance</p>
            <p className="text-xs text-[var(--semantic-text-subtle)]">Actions techniques, fournisseurs et couts associes.</p>
          </div>
          <div className="mt-4 space-y-2">
            {data.maintenanceHistory.map((entry) => (
              <div key={`${entry.date}-${entry.system}`} className="rounded-xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] px-3 py-2">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-semibold text-[var(--semantic-text)]">{entry.system}</p>
                    <p className="text-[var(--semantic-text-subtle)]">{entry.action}</p>
                  </div>
                  <V2StatusPill label={entry.status} variant={maintenanceTone(entry.status)} />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--semantic-text-subtle)]">
                  <span>{entry.vendor}</span>
                  <span>{entry.date}</span>
                  <span>{currency.format(entry.cost)}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[var(--semantic-text-subtle)]">
                  <span className="rounded-full border border-[var(--semantic-border)] bg-white px-2 py-0.5 font-semibold">
                    {entry.vendorLicense}
                  </span>
                  {entry.materials.map((material) => (
                    <span key={material} className="rounded-full border border-[var(--semantic-border)] bg-white px-2 py-0.5">
                      {material}
                    </span>
                  ))}
                </div>
                {entry.issues.length ? (
                  <div className="mt-2 text-[11px] text-[var(--semantic-text-subtle)]">
                    Problemes: {entry.issues.join(', ')}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <section className={cardBase}>
          <div>
            <p className="text-sm font-semibold text-[var(--semantic-text)]">Tables operations</p>
            <p className="text-xs text-[var(--semantic-text-subtle)]">Entrepreneurs, equipes, actifs, stocks, factures, change orders.</p>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className="rounded-2xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-3">
              <p className="text-xs font-semibold text-[var(--semantic-text)]">Entrepreneurs</p>
              <div className="mt-2 space-y-2">
                {data.contractorRoster.map((contractor) => (
                  <div key={contractor.license} className="rounded-lg border border-[var(--semantic-border)] bg-white/80 px-2 py-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-[var(--semantic-text)]">{contractor.name}</p>
                        <p className="text-[11px] text-[var(--semantic-text-subtle)]">{contractor.trade}</p>
                      </div>
                      <span className="text-[11px] text-[var(--semantic-text-subtle)]">Score {contractor.rating.toFixed(1)}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[var(--semantic-text-subtle)]">
                      <span className="rounded-full border border-[var(--semantic-border)] bg-white px-2 py-0.5 font-semibold">
                        {contractor.license}
                      </span>
                      <span className="rounded-full border border-[var(--semantic-border)] bg-white px-2 py-0.5">
                        Assurance {contractor.insuranceExpiry}
                      </span>
                      <span className="rounded-full border border-[var(--semantic-border)] bg-white px-2 py-0.5">
                        {contractor.bonded ? 'Cautionnement actif' : 'Cautionnement a verifier'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-3">
              <p className="text-xs font-semibold text-[var(--semantic-text)]">Equipes</p>
              <div className="mt-2 space-y-2">
                {data.crewRoster.map((member) => (
                  <div key={member.name} className="rounded-lg border border-[var(--semantic-border)] bg-white/80 px-2 py-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-[var(--semantic-text)]">{member.name}</p>
                        <p className="text-[11px] text-[var(--semantic-text-subtle)]">
                          {member.role} • {member.employer}
                        </p>
                      </div>
                      <span className="text-[11px] text-[var(--semantic-text-subtle)]">{member.lastOnSite}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[var(--semantic-text-subtle)]">
                      <span className="rounded-full border border-[var(--semantic-border)] bg-white px-2 py-0.5">{member.phone}</span>
                      {member.certifications.map((cert) => (
                        <span key={cert} className="rounded-full border border-[var(--semantic-border)] bg-white px-2 py-0.5">
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-3">
              <p className="text-xs font-semibold text-[var(--semantic-text)]">Actifs</p>
              <div className="mt-2 space-y-2">
                {data.assetRegistry.map((asset) => (
                  <div key={asset.assetId} className="rounded-lg border border-[var(--semantic-border)] bg-white/80 px-2 py-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-[var(--semantic-text)]">{asset.name}</p>
                        <p className="text-[11px] text-[var(--semantic-text-subtle)]">
                          {asset.system} • {asset.location}
                        </p>
                      </div>
                      <V2StatusPill label={asset.status} variant={assetTone(asset.status)} />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[var(--semantic-text-subtle)]">
                      <span>Dernier {asset.lastService}</span>
                      <span>Prochain {asset.nextService}</span>
                      <span>Garantie {asset.warrantyUntil}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-3">
              <p className="text-xs font-semibold text-[var(--semantic-text)]">Materiaux</p>
              <div className="mt-2 space-y-2">
                {data.materialsLedger.map((material) => (
                  <div key={`${material.material}-${material.supplier}`} className="rounded-lg border border-[var(--semantic-border)] bg-white/80 px-2 py-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-[var(--semantic-text)]">{material.material}</p>
                        <p className="text-[11px] text-[var(--semantic-text-subtle)]">
                          {material.quantity} {material.unit} • {material.supplier}
                        </p>
                      </div>
                      <V2StatusPill label={material.status} variant={materialTone(material.status)} />
                    </div>
                    <p className="mt-2 text-[11px] text-[var(--semantic-text-subtle)]">Dernier usage {material.lastUsed}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-3">
              <p className="text-xs font-semibold text-[var(--semantic-text)]">Factures</p>
              <div className="mt-2 space-y-2">
                {data.invoices.map((invoice) => (
                  <div key={invoice.invoiceId} className="rounded-lg border border-[var(--semantic-border)] bg-white/80 px-2 py-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-[var(--semantic-text)]">{invoice.vendor}</p>
                        <p className="text-[11px] text-[var(--semantic-text-subtle)]">{invoice.invoiceId}</p>
                      </div>
                      <V2StatusPill label={invoice.status} variant={invoiceTone(invoice.status)} />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[var(--semantic-text-subtle)]">
                      <span>{currency.format(invoice.amount)}</span>
                      <span>Echeance {invoice.dueDate}</span>
                      <span>Emission {invoice.issuedDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-3">
              <p className="text-xs font-semibold text-[var(--semantic-text)]">Change orders</p>
              <div className="mt-2 space-y-2">
                {data.changeOrders.map((order) => (
                  <div key={order.changeId} className="rounded-lg border border-[var(--semantic-border)] bg-white/80 px-2 py-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-[var(--semantic-text)]">{order.changeId}</p>
                        <p className="text-[11px] text-[var(--semantic-text-subtle)]">{order.scope}</p>
                      </div>
                      <V2StatusPill label={order.status} variant={changeTone(order.status)} />
                    </div>
                    <div className="mt-2 text-[11px] text-[var(--semantic-text-subtle)]">
                      {order.impact} • {order.approvedBy} • {order.date}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className={cardBase}>
          <div>
            <p className="text-sm font-semibold text-[var(--semantic-text)]">Bibliotheque documents</p>
            <p className="text-xs text-[var(--semantic-text-subtle)]">Factures, garanties, certificats, photos, preuves.</p>
          </div>
          <div className="mt-4 space-y-2">
            {documents.map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={() => setSelectedDoc(doc)}
                className="w-full rounded-xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] px-3 py-2 text-left text-xs transition hover:border-[var(--semantic-primary)] hover:bg-white"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--semantic-text)]">{doc.title}</p>
                    <p className="text-[11px] text-[var(--semantic-text-subtle)]">{doc.meta}</p>
                  </div>
                  <Badge variant="outline">{doc.type}</Badge>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--semantic-text-subtle)]">
                  <span>{doc.date}</span>
                  {doc.status ? <V2StatusPill label={doc.status} variant={doc.variant} /> : null}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className={cn(cardBase, 'flex flex-col gap-3')}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--semantic-text)]">Timeline unifiee</p>
              <p className="text-xs text-[var(--semantic-text-subtle)]">Memoire du batiment, incidents, maintenance, change orders.</p>
            </div>
            <Badge variant="outline">Timeline</Badge>
          </div>
          <div className="space-y-2">
            {timelineEntries.map((entry) => (
              <div key={`${entry.date}-${entry.title}`} className="flex items-center justify-between rounded-xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] px-3 py-2 text-xs">
                <div>
                  <p className="font-semibold text-[var(--semantic-text)]">{entry.title}</p>
                  <p className="text-[11px] text-[var(--semantic-text-subtle)]">{entry.meta}</p>
                  <p className="text-[11px] text-[var(--semantic-text-subtle)]">{entry.date}</p>
                </div>
                <V2StatusPill label={entry.label} variant={entry.variant} />
              </div>
            ))}
          </div>
        </section>

        <section className={cardBase}>
          <div>
            <p className="text-sm font-semibold text-[var(--semantic-text)]">Comportements locataires</p>
            <p className="text-xs text-[var(--semantic-text-subtle)]">Tendances usage, demandes, et niveau de service.</p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <MetricCard label="Demandes / mois" value={number.format(data.tenantBehavior.serviceRequestsMonthly)} helper="Signalements" />
            <MetricCard label="Temps reponse" value={`${number.format(data.tenantBehavior.avgResponseHours)} h`} helper="Moyenne" />
            <MetricCard label="Usage commun" value={`${number.format(data.tenantBehavior.commonAreaUsageIndex)} / 100`} helper="Indice" />
          </div>
        </section>

        <DocumentPreviewModal isOpen={Boolean(selectedDoc)} document={selectedDoc} onClose={() => setSelectedDoc(null)} />
      </div>
    </div>
  );
}

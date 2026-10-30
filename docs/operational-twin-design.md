# Operational Twin — Design Specification

**Status:** Proposed  
**Repository:** `Synergair/digital-twin-workbench`  
**Branch:** `design/operational-twin`  
**Owner:** CTO / Architecture Authority  
**Product collaborators:** Product/Design + O'Key/Domicie/Roof AI owners  
**Purpose:** Evolve the current Digital Twin from a visualization/inspection surface into a governed decision, simulation, action, and outcome system.

---

## 1. Why this exists

The current Digital Twin Workbench already represents a useful spatial and operational shell:

- property/building/unit navigation;
- IFC/GLB models;
- 28 MEP/system layers;
- floor plans;
- point clouds;
- asset registry;
- maintenance history;
- inspections;
- incident records;
- contractor/crew information;
- invoices/warranties;
- dispatch actions;
- digital captures;
- pins and alerts.

Today, however, most of the experience is still oriented around **seeing what exists**.

The next step is an **Operational Twin**:

> A live, governed model of the property or physical system that combines current state, history, external context, predictions, constraints, simulations, recommended interventions, approved actions, and measured outcomes.

The Twin should answer not only:

- What is here?
- What happened?
- What is broken?

but also:

- What is likely to happen next?
- Why?
- What should we do?
- What will likely happen if we do A instead of B?
- What does each intervention cost?
- Which option maximizes expected value?
- Is the action allowed?
- Who must approve it?
- Which contractor/resource should perform it?
- What happened after the action?
- Did the model's recommendation prove correct?

---

## 2. Architectural rule

The Digital Twin Workbench must **not** become another standalone intelligence backend.

It is an **Experience / Spatial Interaction Layer** over shared Synergair Core services.

The canonical ownership should be:

### Digital Twin Workbench owns

- 3D/2D spatial presentation;
- navigation;
- asset selection;
- scenario visualization;
- comparing alternatives;
- intervention preview;
- human review/approval UX;
- timeline visualization;
- spatial annotations;
- operational control surfaces;
- status/alert overlays.

### Synergair Core owns

- canonical entities and IDs;
- property/building/unit/asset facts;
- source provenance;
- data rights;
- signal computation;
- models;
- causal/uplift models;
- scenario simulation services;
- decision logic;
- BOUCLIER policy evaluation;
- DIFF verification;
- agent/tool execution;
- Outcome Store;
- cost/usage accounting;
- model registry;
- source registry;
- data lineage;
- regulatory logic.

### O'Key owns

- property-management/business workflows;
- financial/property experience;
- owner/manager/tenant surfaces;
- Property Passport presentation.

### Domicie owns

- dispatch;
- contractor/service workflow;
- quotes/jobs/payments;
- execution status;
- technician workflow.

### Roof AI / other specialist systems own

- domain-specific sensing and analysis;
- roof geometry/condition;
- specialist inspection outputs.

The Operational Twin consumes all of these through stable APIs/events.

---

## 3. Current repo constraints to fix first

### 3.1 Mock data cannot drive production Operational Twin behavior

`src/features/digital-twin/twinData.ts` currently synthesizes significant operational/financial/maintenance data.

That is acceptable for design/demo mode only.

Operational Twin decisions must never treat this data as real.

Required:

- explicit `demo/mock` badge when mock mode is active;
- no mock-derived recommendation may be labeled operational;
- production environment must fail loudly if required operational endpoints are unavailable;
- mock fallback may remain only in an explicit demo/development mode.

### 3.2 Silent API fallback must be removed for production operational paths

`src/lib/api/digitalTwin.ts` currently falls back to local mocks when remote calls fail.

For an Operational Twin, failure must be visible.

Required production behavior:

```
remote success -> render verified data
remote 404/not configured -> show capability unavailable
remote 5xx/network failure -> show degraded/offline state
mock mode -> explicit demo-only path
```

Never silently turn a failed production API call into synthetic operational data.

### 3.3 IDs must be canonical

All property, building, floor, unit, room, equipment, contractor, inspection, job, claim and sensor records must use canonical IDs from Core/O'Key rather than local-only generated identifiers.

---

## 4. Operational Twin model

The Twin should be composed of six synchronized layers.

### Layer A — Physical State

What exists physically.

- property;
- building;
- floor;
- unit;
- room;
- roof section;
- HVAC;
- plumbing;
- electrical;
- fire;
- security;
- elevator;
- solar;
- equipment;
- sensors;
- materials;
- structural components.

### Layer B — Observed State

What is known now.

- sensor telemetry;
- inspection results;
- photos;
- thermal readings;
- condition scores;
- work orders;
- open incidents;
- occupancy;
- energy;
- environmental context;
- asset status.

### Layer C — Historical State

How the property changed.

- maintenance;
- replacements;
- failures;
- inspections;
- claims;
- invoices;
- warranties;
- permits;
- contractors;
- ownership;
- renovations;
- past predictions;
- past decisions.

### Layer D — Predictive State

What SYN estimates is likely.

Examples:

- failure probability;
- remaining useful life;
- roof replacement window;
- water-leak risk;
- maintenance risk;
- expected energy consumption;
- expected CAPEX;
- tenant/service demand;
- probability of downtime;
- claim probability;
- asset degradation.

Every prediction must include:

- model ID/version;
- confidence/calibration;
- time horizon;
- input evidence;
- data freshness;
- explanation;
- allowed use.

### Layer E — Scenario State

Counterfactual alternatives.

Examples:

- repair now;
- defer 90 days;
- replace equipment;
- increase preventive maintenance;
- install sensors;
- replace roof membrane;
- insulate;
- modify HVAC schedule;
- change contractor;
- increase reserve budget.

Each scenario contains:

- intervention;
- assumptions;
- expected cost;
- expected downtime;
- expected risk;
- expected value;
- expected energy/carbon impact;
- confidence interval;
- constraints;
- required approvals.

### Layer F — Action / Outcome State

What humans/agents actually did and what happened.

- approved action;
- rejected action;
- modified recommendation;
- dispatched job;
- completed work;
- actual cost;
- actual time;
- actual performance;
- post-intervention measurement;
- model correctness;
- lessons for future decisions.

This is the layer that turns the Twin into a learning system.

---

## 5. The core Operational Twin loop

```
OBSERVE
  ↓
RESOLVE CURRENT STATE
  ↓
DETECT RISK / OPPORTUNITY
  ↓
GENERATE OPTIONS
  ↓
SIMULATE
  ↓
RANK OPTIONS
  ↓
POLICY / RIGHTS / SAFETY CHECK
  ↓
HUMAN OR AGENT APPROVAL
  ↓
EXECUTE
  ↓
MEASURE OUTCOME
  ↓
LEARN
  ↓
UPDATE TWIN
```

The loop must be event-driven and auditable.

---

## 6. Proposed Core APIs

These endpoints should live behind Synergair Core/O'Key domain APIs, not as local computation in the viewer.

### Current state

```
GET /operational-twin/{property_id}/state
GET /operational-twin/{property_id}/assets
GET /operational-twin/{property_id}/events
GET /operational-twin/{property_id}/signals
```

### Predictions

```
GET /operational-twin/{property_id}/predictions
GET /operational-twin/{property_id}/predictions/{asset_id}
```

### Scenario engine

```
POST /operational-twin/{property_id}/scenarios
GET  /operational-twin/{property_id}/scenarios/{scenario_id}
POST /operational-twin/{property_id}/scenarios/{scenario_id}/compare
```

Example scenario request:

```json
{
  "target_entity_id": "asset-roof-b",
  "purpose": "maintenance_planning",
  "jurisdiction": "CA-QC",
  "horizon_days": 365,
  "interventions": [
    {
      "type": "repair",
      "parameters": {
        "scope": "localized_membrane_repair"
      }
    },
    {
      "type": "replace",
      "parameters": {
        "scope": "full_membrane"
      }
    },
    {
      "type": "defer",
      "parameters": {
        "days": 180
      }
    }
  ]
}
```

### Decision

```
POST /operational-twin/{property_id}/decision
```

Response should include:

- recommended option;
- alternatives;
- expected value;
- confidence;
- explanation;
- data used;
- model versions;
- policy result;
- required approvals;
- uncertainty;
- Decision Receipt ID.

### Action

```
POST /operational-twin/{property_id}/actions/propose
POST /operational-twin/{property_id}/actions/{id}/approve
POST /operational-twin/{property_id}/actions/{id}/reject
POST /operational-twin/{property_id}/actions/{id}/execute
```

Execution may route into:

- Domicie dispatch;
- maintenance work order;
- purchase request;
- notification;
- contractor request;
- inspection;
- sensor task;
- other approved tools through Conduit.

### Outcome

```
POST /operational-twin/{property_id}/outcomes
```

All outcomes feed the universal Synergair Outcome Store.

---

## 7. Proposed frontend module structure

Add a separate feature module so simulation/decision code does not pollute the renderer.

```
src/features/operational-twin/
├── types/
│   ├── state.types.ts
│   ├── prediction.types.ts
│   ├── scenario.types.ts
│   ├── action.types.ts
│   ├── outcome.types.ts
│   └── receipt.types.ts
├── api/
│   └── operationalTwinApi.ts
├── hooks/
│   ├── useOperationalState.ts
│   ├── useTwinPredictions.ts
│   ├── useScenario.ts
│   ├── useScenarioComparison.ts
│   ├── useDecision.ts
│   ├── useTwinActions.ts
│   └── useOutcomeHistory.ts
├── store/
│   └── operationalTwinStore.ts
├── components/
│   ├── ScenarioPanel.tsx
│   ├── InterventionBuilder.tsx
│   ├── ScenarioComparison.tsx
│   ├── PredictionOverlay.tsx
│   ├── ConfidenceLegend.tsx
│   ├── DecisionPanel.tsx
│   ├── DecisionReceiptDrawer.tsx
│   ├── ActionApprovalPanel.tsx
│   ├── OutcomeTimeline.tsx
│   ├── AssumptionEditor.tsx
│   └── CostRiskValuePanel.tsx
└── index.ts
```

The current `digital-twin` rendering feature remains spatial.

The new `operational-twin` feature consumes the viewer's selected entity and paints state/scenario overlays on top.

---

## 8. UI/UX design

### 8.1 Three modes

Add a top-level mode switch:

```
OBSERVE | SIMULATE | OPERATE
```

### OBSERVE

Current Digital Twin behavior enhanced with:

- live state;
- predicted risks;
- confidence;
- evidence;
- history.

### SIMULATE

User selects one or more assets.

Then:

1. choose a decision horizon;
2. choose intervention(s);
3. modify assumptions;
4. run scenarios;
5. compare outcomes.

The 3D model visually changes based on the scenario where useful.

Examples:

- highlight assets expected to fail;
- fade components unaffected by scenario;
- show risk heatmap;
- show CAPEX by floor/system;
- show energy impact;
- show downtime zones.

### OPERATE

Convert a scenario into a real approved action.

Examples:

- create work order;
- dispatch Domicie contractor;
- request inspection;
- request quote;
- create procurement task;
- schedule maintenance;
- create owner/board approval.

---

## 9. Scenario comparison design

The default comparison should not be a flashy AI card.

It should be an engineering/business decision table.

Example:

| Option | 12m cost | Failure risk | Downtime | Expected value | Confidence |
|---|---:|---:|---:|---:|---:|
| Repair now | $18k | 9% | 1 day | +$41k | 0.84 |
| Replace | $72k | 2% | 4 days | +$93k | 0.78 |
| Defer 180d | $4k | 34% | unknown | -$27k | 0.72 |

The system must always show assumptions and uncertainty.

No false precision.

---

## 10. Simulation architecture

Do not create one giant "AI simulator."

Use pluggable model families.

### Asset degradation

- survival models;
- remaining useful life;
- hazard curves.

### Financial

- deterministic cash flows;
- discounted cash flow;
- reserve/capex projections.

### Energy

- engineering models;
- regression/forecast models;
- weather-normalized baselines.

### Service demand

- time series;
- Poisson/negative-binomial;
- event models.

### Intervention impact

- causal/uplift models where enough data exists;
- engineering/rule-based models where causal evidence is limited.

### Monte Carlo

Use when uncertain inputs materially affect outcomes.

All scenario outputs must include provenance and model versions.

---

## 11. "Operational Twin" vs "Digital Twin"

Digital Twin:

> virtual representation of a physical system.

Operational Twin:

> virtual representation + current operating state + policies + predictive intelligence + intervention simulation + executable workflow + outcome feedback.

The Operational Twin therefore becomes the bridge between:

```
PHYSICAL ASSET
      ↓
DIGITAL REPRESENTATION
      ↓
OPERATIONAL MEMORY
      ↓
PREDICTION
      ↓
SIMULATION
      ↓
DECISION
      ↓
ACTION
      ↓
REAL OUTCOME
```

---

## 12. Property Passport integration

The Operational Twin should use the Property Passport as its historical/evidence backbone.

Passport should include:

- property identity;
- ownership/management;
- permits;
- inspections;
- work;
- equipment;
- warranties;
- service records;
- claims;
- invoices;
- roof condition;
- HVAC/plumbing/electrical;
- Digital Twin assets;
- images/scans;
- maintenance recommendations;
- action/outcome records.

The Workbench visualizes this history spatially and temporally.

---

## 13. Domicie integration

When an approved intervention requires service:

```
Operational Twin
  ↓
recommended intervention
  ↓
human approval if required
  ↓
Domicie
  ↓
verified contractor
  ↓
quote / dispatch / work
  ↓
completion evidence
  ↓
Outcome Store
  ↓
Operational Twin updates
```

Required event examples:

- `service.requested`
- `quote.received`
- `contractor.assigned`
- `job.started`
- `job.completed`
- `inspection.completed`
- `invoice.paid`
- `claim.created`

---

## 14. Roof AI integration

Roof AI should attach specialist outputs directly to canonical roof-section entities.

Examples:

- geometry;
- slope;
- area;
- material;
- defect;
- condition;
- confidence;
- imagery;
- inspection date;
- model version.

Operational Twin can then simulate:

- repair;
- patch;
- membrane replacement;
- insulation improvement;
- deferral.

After field work, Domicie/Lafrance outcomes validate Roof AI predictions.

---

## 15. O'Key integration

O'Key owns the property-management context.

Operational Twin feeds:

- expected CAPEX;
- condition;
- maintenance priority;
- asset risk;
- scenario comparisons;
- reserve planning;
- property health;
- value impacts.

O'Key feeds:

- leases;
- units;
- occupancy;
- finances;
- property management;
- owner/board context.

---

## 16. External data integration

The Operational Twin can consume permitted signals from Source Foundry:

- weather;
- severe events;
- municipal permits;
- energy prices;
- equipment recalls;
- manufacturer data;
- material prices;
- property assessments;
- insurance/risk context;
- market data.

The viewer must never call third-party providers directly.

It requests canonical information from Core.

---

## 17. Policy and AI governance

Every scenario/decision may contain sensitive data or high-impact recommendations.

Flow:

```
scenario request
  ↓
BOUCLIER
  ↓
data/purpose/jurisdiction/provider rights
  ↓
approved model/data route
  ↓
simulation
  ↓
DIFF
  ↓
Decision Receipt
```

For actions:

```
recommended action
  ↓
Conduit capability request
  ↓
BOUCLIER
  ↓
DIFF
  ↓
human approval if threshold/risk requires
  ↓
execute
```

---

## 18. Decision Receipt integration

Each material recommendation should produce a receipt containing:

- `decision_id`;
- property/entity IDs;
- time;
- purpose;
- jurisdiction;
- current state snapshot;
- evidence/source IDs;
- signal IDs;
- model IDs/versions;
- scenario IDs;
- assumptions;
- confidence;
- recommended action;
- alternative actions;
- policy result;
- required human review;
- reviewer/approval;
- executed action;
- later outcome;
- immutable/hash reference.

The UI should expose this through a "Why?" / "Evidence" drawer.

---

## 19. Action safety levels

### Level 0 — Observe only

No action.

### Level 1 — Recommend

System proposes, human performs.

### Level 2 — Prepare

System prepares dispatch/work order/quote, human approves.

### Level 3 — Execute within policy

System may execute low-risk predefined actions.

### Level 4 — High-impact

Always requires human authorization.

Examples of Level 4:

- large spend;
- tenant-impacting shutdown;
- safety-critical equipment action;
- legal/compliance-sensitive action.

---

## 20. Outcome learning

Every recommendation must eventually become one of:

- executed / successful;
- executed / unsuccessful;
- executed / modified;
- rejected;
- deferred;
- superseded;
- unverifiable.

Capture:

- actual cost;
- actual downtime;
- actual failure/no-failure;
- actual performance improvement;
- actual energy/carbon delta;
- actual property-value impact where measurable;
- human reason for override.

This feeds:

- model calibration;
- source reputation;
- contractor reliability;
- scenario accuracy;
- future decision ranking.

---

## 21. Operational Twin event contract

Proposed canonical event envelope:

```json
{
  "event_id": "uuid",
  "event_type": "asset.inspection.completed",
  "occurred_at": "ISO-8601",
  "tenant_id": "uuid",
  "property_id": "uuid",
  "entity_id": "uuid",
  "entity_type": "roof_section",
  "source": "roof_ai",
  "purpose": "maintenance",
  "jurisdiction": "CA-QC",
  "data_classification": "confidential",
  "payload": {},
  "provenance": {},
  "rights": {},
  "confidence": 0.94,
  "schema_version": "1.0"
}
```

Do not invent a separate event bus for the twin.

Use the canonical Synergair event contract.

---

## 22. Operational Twin as a reusable platform primitive

Do not hard-code the concept to real estate.

The architecture should support other twins later.

### Restaurant / STATUS

- staff;
- tables;
- inventory;
- kitchen equipment;
- demand;
- simulation of staffing/pricing/promotions.

### TurfSense

- zones;
- soil;
- irrigation;
- vegetation;
- weather;
- treatment scenarios.

### Solar

- panel/string/inverter;
- defects;
- production;
- repair scenarios.

### Mining

- site;
- drill hole;
- geology;
- equipment;
- targets;
- exploration scenarios.

### Industrial / manufacturing

- line;
- machine;
- sensor;
- maintenance;
- throughput scenarios.

The **scenario/action/outcome engine belongs to Core**.
The Workbench is the property-specific spatial client.

---

## 23. Operational Twin maturity levels

### L0 — Visual Twin

3D/2D representation.

### L1 — Connected Twin

Live/periodic data attached.

### L2 — Historical Twin

State and events over time.

### L3 — Predictive Twin

Forecasts, risk and remaining useful life.

### L4 — Operational Twin

Scenario simulation, decisioning, approved action.

### L5 — Learning Twin

Outcomes continuously improve models, source trust and interventions.

The Workbench should explicitly report the twin's maturity level per property.

---

## 24. Implementation roadmap

### OT-00 — Production truth / mock isolation — P0

- make mock mode explicit;
- remove silent production fallback;
- display data provenance/state;
- add data freshness indicators;
- ensure canonical IDs.

**Acceptance:** production failure cannot silently display synthetic operational facts.

### OT-01 — Operational State API — P0

Create types/hooks/API for:

- current state;
- asset state;
- alerts;
- signals;
- history.

**Acceptance:** selected asset displays verified live/historical state with provenance.

### OT-02 — Prediction Overlay — P1

Render:

- predicted risk;
- confidence;
- horizon;
- evidence;
- model version.

**Acceptance:** no prediction is shown without confidence + model/evidence metadata.

### OT-03 — Scenario Engine contract — P1

Define Core scenario request/result schemas.

**Acceptance:** Workbench can request and persist a scenario without embedding model logic in frontend.

### OT-04 — Scenario Builder UI — P1

Add SIMULATE mode and intervention builder.

**Acceptance:** user can compare at least 2 alternatives and baseline.

### OT-05 — Scenario Comparison — P1

Cost/risk/value/downtime/energy comparison.

**Acceptance:** assumptions and uncertainty are visible.

### OT-06 — Decision Receipt — P1

Integrate receipt UI.

**Acceptance:** user can answer why, data used, model used, policy result and required approval.

### OT-07 — Domicie Action Bridge — P1

Convert approved intervention into dispatch/work order.

**Acceptance:** Twin action creates Domicie workflow and receives lifecycle events back.

### OT-08 — Roof AI Bridge — P1

Canonical roof entities + condition outputs + post-work validation.

**Acceptance:** roof prediction can be connected to resulting inspection/job outcome.

### OT-09 — Outcome Timeline — P1

Add before/after outcome tracking.

**Acceptance:** recommendation and actual result appear on same timeline.

### OT-10 — Property Passport — P1

Connect verified passport history to spatial entities.

### OT-11 — Operational Twin Store — P1

Separate scenario state from rendering/UI state.

### OT-12 — Policy / BOUCLIER integration — P1

Block unauthorized data/actions.

### OT-13 — Conduit execution — P2

Approved low-risk actions through capability-scoped tools.

### OT-14 — Monte Carlo / uncertainty — P2

Support probabilistic scenario ranges.

### OT-15 — Operational Twin SDK — P2

Generic schema reusable across other industries.

### OT-16 — Benchmark & evaluation suite — P2

Measure:

- scenario accuracy;
- calibration;
- realized savings;
- maintenance lift;
- downtime reduction;
- decision adoption;
- override rate.

---

## 25. First reference scenario: roof intervention

Use the Lafrance / Roof AI / Domicie ecosystem as the first full Operational Twin demonstration.

### Input

- property;
- roof section;
- roof geometry;
- age;
- inspection;
- thermal/visual condition;
- weather history;
- material;
- warranty;
- maintenance history;
- current contractor availability;
- estimated repair/replacement costs.

### Scenarios

A. repair localized defects now;  
B. full replacement now;  
C. inspect again in 90 days;  
D. defer 180 days.

### Outputs

- 1/3/5-year expected cost;
- leak/failure risk;
- insurance/claim risk where supported;
- expected downtime;
- expected maintenance burden;
- property-value impact where supported;
- confidence and uncertainty.

### Action

Owner/manager approves.

Domicie dispatches.

Roof AI/Lafrance captures completion evidence.

Outcome returns to Core.

This reference implementation proves the entire closed loop.

---

## 26. Second reference scenario: HVAC

Input:

- equipment age;
- service history;
- sensor anomalies;
- energy consumption;
- occupancy;
- weather;
- warranty;
- current performance.

Compare:

- tune/service;
- component replacement;
- full replacement;
- defer.

Outputs:

- failure probability;
- energy delta;
- CAPEX/OPEX;
- downtime;
- expected value.

---

## 27. Third reference scenario: portfolio CAPEX

For property managers/boards:

```
Which interventions across all buildings should we fund this year
under a $2.5M budget to minimize expected failure cost while
meeting compliance and reserve constraints?
```

This becomes a portfolio optimization problem.

The Workbench can visualize the chosen interventions across properties/assets.

---

## 28. Engineering principles

1. Viewer does not own business intelligence.
2. No silent mock fallback in production operational paths.
3. Every prediction has provenance/confidence/version.
4. Every action is policy checked.
5. Every material decision gets a receipt.
6. Every executed recommendation seeks an outcome.
7. Core IDs everywhere.
8. Scenario models are pluggable.
9. Assumptions are visible/editable.
10. Uncertainty is never hidden.
11. Do not claim causality from correlation.
12. Human override is first-class.
13. Reuse the same scenario/action/outcome contract across industries.

---

## 29. Success criteria

The initiative is successful when a user can:

1. open a property;
2. select a physical asset;
3. see current and predicted state;
4. understand why the system believes it;
5. run multiple intervention scenarios;
6. compare cost/risk/value;
7. approve one;
8. dispatch/execute the work;
9. see the real outcome;
10. see Core learn from the result.

At that point the product is no longer primarily a Digital Twin viewer.

It becomes a **decision and operating system attached to the physical world**.

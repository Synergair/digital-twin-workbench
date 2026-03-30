import sensorCsv from '@/assets/sample_df_lines.csv?raw';
import ttlText from '@/assets/improved_factory_model.ttl?raw';
import factoryModel from '@/assets/adt/FactoryInterface.json';
import productionLineModel from '@/assets/adt/ProductionLineInterface.json';
import productionStepModel from '@/assets/adt/ProductionStepInterface.json';

export type SensorSample = {
  lineId: string;
  flow: number;
  temperature: number;
  vibration: number;
  pressure: number;
  timestamp: string;
};

export type OntologyEntity = {
  id: string;
  label: string;
  kind: 'class' | 'property';
};

export type DtdlModel = {
  id: string;
  displayName?: string;
  description?: string;
  contentsCount: number;
};

export function parseSensorSamples(limit = 60): SensorSample[] {
  const lines = sensorCsv.trim().split('\n');
  if (lines.length <= 1) {
    return [];
  }
  const header = lines[0].split(',');
  const idx = (name: string) => header.indexOf(name);
  const flowIdx = idx('sensor_flow');
  const tempIdx = idx('sensor_temperature');
  const vibIdx = idx('sensor_vibration');
  const pressureIdx = idx('sensor_pressure');
  const tsIdx = idx('timestamp');
  const lineIdx = idx('line_id');

  return lines.slice(1, limit + 1).map((line) => {
    const cols = line.split(',');
    return {
      lineId: cols[lineIdx] ?? 'line-0',
      flow: Number(cols[flowIdx] ?? 0),
      temperature: Number(cols[tempIdx] ?? 0),
      vibration: Number(cols[vibIdx] ?? 0),
      pressure: Number(cols[pressureIdx] ?? 0),
      timestamp: cols[tsIdx] ?? '',
    };
  });
}

export function parseOntologyEntities(): OntologyEntity[] {
  const entities = new Map<string, OntologyEntity>();
  const lines = ttlText.split('\n');
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('ex:')) {
      return;
    }
    const [subject] = trimmed.split(' ');
    const id = subject.replace('ex:', '');
    if (trimmed.includes('rdfs:label')) {
      const match = trimmed.match(/rdfs:label\s+"([^"]+)"/);
      const label = match ? match[1] : id;
      const existing = entities.get(id);
      if (existing) {
        existing.label = label;
      } else {
        entities.set(id, { id, label, kind: trimmed.includes('rdfs:Property') ? 'property' : 'class' });
      }
    } else if (trimmed.includes('rdfs:Property')) {
      entities.set(id, { id, label: id, kind: 'property' });
    } else if (trimmed.includes('rdfs:Class')) {
      entities.set(id, { id, label: id, kind: 'class' });
    }
  });

  return Array.from(entities.values());
}

export function parseDtdlModels(): DtdlModel[] {
  const models = [factoryModel, productionLineModel, productionStepModel] as Array<Record<string, unknown>>;
  return models.map((model) => ({
    id: String(model['@id'] ?? model['id'] ?? 'model'),
    displayName: typeof model.displayName === 'string' ? model.displayName : undefined,
    description: typeof model.description === 'string' ? model.description : undefined,
    contentsCount: Array.isArray(model.contents) ? model.contents.length : 0,
  }));
}

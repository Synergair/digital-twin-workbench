export type PipelineHook = {
  id: string;
  label: string;
  status: 'stub' | 'connected';
  description: string;
};

export const bimPipelineHooks: PipelineHook[] = [
  {
    id: 'revit-import',
    label: 'Revit IFC Export',
    status: 'stub',
    description: 'Importer IFC via export Revit (Batch/Cloud).',
  },
  {
    id: 'autocad-dwg',
    label: 'AutoCAD DWG Ingest',
    status: 'stub',
    description: 'Convertir DWG/DXF vers glTF pour viewer.',
  },
  {
    id: 'bim-360',
    label: 'Autodesk Construction Cloud',
    status: 'stub',
    description: 'Hook API BIM 360 / ACC pour synchronisation modèles.',
  },
  {
    id: 'point-cloud',
    label: 'Point Cloud (LiDAR)',
    status: 'stub',
    description: 'Ingestion nuage de points et recalage modèle.',
  },
  {
    id: 'ifc-validation',
    label: 'IFC Validation',
    status: 'stub',
    description: 'Contrôles QA/QC, classification et mapping MEP.',
  },
];

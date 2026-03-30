export type TwinLayer =
  | 'structure'
  | 'envelope'
  | 'fire'
  | 'security'
  | 'it'
  | 'elevators'
  | 'stairs'
  | 'parking'
  | 'roof'
  | 'solar'
  | 'water'
  | 'gas'
  | 'drainage'
  | 'sprinklers'
  | 'lighting'
  | 'access'
  | 'sensors'
  | 'plomberie'
  | 'hvac'
  | 'electricite'
  | 'zones'
  | 'cameras'
  | 'communs'
  | 'lockers'
  | 'rooftop3d'
  | 'farming'
  | 'pool'
  | 'maintenance'
  | 'electrical'
  | 'internet';

export type TwinTab = 'mep' | 'unites' | 'parking' | 'structure';
export type TwinView = 'facade' | 'dessus' | 'cote' | 'iso' | 'inside';
export type TwinSeverity = 'urgent' | 'standard' | 'planifie';
export type TwinPinStatus = 'open' | 'assigned' | 'resolved' | 'dismissed';

export interface TwinAlert {
  id: string;
  alert_type: string;
  severity: TwinSeverity;
  description: string;
  status: string;
  created_at: string;
}

export interface TwinManifest {
  property_id: string;
  address: string;
  floors: number;
  total_units: number;
  has_odm_model: boolean;
  odm_model_url: string | null;
  building_passport_score: number;
  updated_at: string;
}

export interface TwinUnit {
  id: string;
  property_id: string;
  floor: number;
  unit_number: string;
  unit_type: string;
  area_m2: number;
  current_rent: number | null;
  status: 'occupied' | 'vacant' | 'alert' | 'warn';
  tenant_name: string | null;
  lease_expiry: string | null;
  has_digital_twin: boolean;
  last_capture_at: string | null;
  active_alerts: TwinAlert[];
}

export interface TwinPin {
  id: string;
  property_id: string;
  unit_id: string | null;
  created_by: string;
  coord_x: number;
  coord_y: number;
  coord_z: number;
  mesh_name: string | null;
  wall_type: string | null;
  wall_config_snap: Record<string, unknown> | null;
  mep_proximity: Array<Record<string, unknown>>;
  severity: TwinSeverity;
  description: string | null;
  photo_urls: string[];
  status: TwinPinStatus;
  tooling_rec: string[];
  duration_est: string | null;
  maintenance_request_id: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface TwinCapture {
  id: string;
  property_id: string;
  unit_id: string | null;
  project_id: string;
  capture_type: string;
  model_url: string | null;
  texture_url: string | null;
  point_count: number;
  precision_cm: number | null;
  status: 'processing' | 'ready' | 'failed' | 'canceled';
  nodeodm_task_id: string | null;
  error_message: string | null;
  captured_by: string;
  created_at: string;
  completed_at: string | null;
}

export interface TwinPassportLayer {
  id: string;
  property_id: string;
  layer_type: 'cadastral' | 'structural' | 'mep' | 'operational' | 'valuation';
  completeness_percent: number;
  data_points: Record<string, unknown>;
  last_updated: string;
}

export interface CreateTwinPinInput {
  unit_id?: string | null;
  coord_x: number;
  coord_y: number;
  coord_z: number;
  mesh_name?: string | null;
  wall_type?: string | null;
  description?: string | null;
  severity: TwinSeverity;
}

export interface TwinLayoutPoint {
  x: number;
  y: number;
  z: number;
}

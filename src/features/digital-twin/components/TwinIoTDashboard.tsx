import { useEffect, useState, useMemo, useCallback } from 'react';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/badge';
import { V2Surface, V2StatusPill } from '@/components/dashboard/v2/primitives';

// ============================================================================
// Types
// ============================================================================

type SensorType = 'temperature' | 'humidity' | 'co2' | 'energy' | 'water' | 'motion' | 'air_quality' | 'light' | 'noise';
type AlertSeverity = 'critical' | 'warning' | 'info';
type SensorStatus = 'online' | 'offline' | 'warning' | 'alert';

interface SensorReading {
  timestamp: number;
  value: number;
}

interface IoTSensor {
  id: string;
  name: string;
  type: SensorType;
  location: string;
  floor: number;
  unit: string;
  currentValue: number;
  minValue: number;
  maxValue: number;
  thresholdLow?: number;
  thresholdHigh?: number;
  status: SensorStatus;
  lastUpdate: Date;
  history: SensorReading[];
}

interface IoTAlert {
  id: string;
  sensorId: string;
  sensorName: string;
  type: string;
  severity: AlertSeverity;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

interface SystemHealth {
  system: string;
  status: 'healthy' | 'degraded' | 'critical';
  uptime: number;
  lastCheck: Date;
  metrics: { label: string; value: string | number }[];
}

// ============================================================================
// Mock Data Generation
// ============================================================================

const sensorTypeConfig: Record<SensorType, { unit: string; min: number; max: number; icon: string; color: string }> = {
  temperature: { unit: '°C', min: 15, max: 30, icon: '🌡️', color: '#ef4444' },
  humidity: { unit: '%', min: 30, max: 70, icon: '💧', color: '#3b82f6' },
  co2: { unit: 'ppm', min: 400, max: 1200, icon: '🌬️', color: '#8b5cf6' },
  energy: { unit: 'kW', min: 0, max: 150, icon: '⚡', color: '#f59e0b' },
  water: { unit: 'L/h', min: 0, max: 50, icon: '🚿', color: '#06b6d4' },
  motion: { unit: '', min: 0, max: 1, icon: '🚶', color: '#10b981' },
  air_quality: { unit: 'AQI', min: 0, max: 200, icon: '🍃', color: '#22c55e' },
  light: { unit: 'lux', min: 0, max: 1000, icon: '💡', color: '#fbbf24' },
  noise: { unit: 'dB', min: 30, max: 90, icon: '🔊', color: '#ec4899' },
};

const generateHistory = (type: SensorType, points = 24): SensorReading[] => {
  const config = sensorTypeConfig[type];
  const now = Date.now();
  return Array.from({ length: points }, (_, i) => ({
    timestamp: now - (points - i) * 3600000,
    value: config.min + Math.random() * (config.max - config.min) * 0.6 + (config.max - config.min) * 0.2,
  }));
};

const mockSensors: IoTSensor[] = [
  {
    id: 'temp-lobby',
    name: 'Lobby Temperature',
    type: 'temperature',
    location: 'Main Lobby',
    floor: 0,
    unit: '°C',
    currentValue: 21.5,
    minValue: 18,
    maxValue: 26,
    thresholdLow: 18,
    thresholdHigh: 24,
    status: 'online',
    lastUpdate: new Date(),
    history: generateHistory('temperature'),
  },
  {
    id: 'hum-mech',
    name: 'Mechanical Room Humidity',
    type: 'humidity',
    location: 'Mechanical Room B1',
    floor: -1,
    unit: '%',
    currentValue: 58,
    minValue: 30,
    maxValue: 70,
    thresholdHigh: 65,
    status: 'warning',
    lastUpdate: new Date(),
    history: generateHistory('humidity'),
  },
  {
    id: 'co2-common',
    name: 'Common Area CO2',
    type: 'co2',
    location: 'Floor 3 Common Area',
    floor: 3,
    unit: 'ppm',
    currentValue: 720,
    minValue: 400,
    maxValue: 1200,
    thresholdHigh: 1000,
    status: 'online',
    lastUpdate: new Date(),
    history: generateHistory('co2'),
  },
  {
    id: 'energy-main',
    name: 'Main Power Consumption',
    type: 'energy',
    location: 'Electrical Room',
    floor: 0,
    unit: 'kW',
    currentValue: 86.4,
    minValue: 0,
    maxValue: 150,
    thresholdHigh: 120,
    status: 'online',
    lastUpdate: new Date(),
    history: generateHistory('energy'),
  },
  {
    id: 'water-main',
    name: 'Main Water Flow',
    type: 'water',
    location: 'Water Entry',
    floor: -1,
    unit: 'L/h',
    currentValue: 23.8,
    minValue: 0,
    maxValue: 50,
    thresholdHigh: 40,
    status: 'online',
    lastUpdate: new Date(),
    history: generateHistory('water'),
  },
  {
    id: 'air-parking',
    name: 'Parking Air Quality',
    type: 'air_quality',
    location: 'Underground Parking',
    floor: -2,
    unit: 'AQI',
    currentValue: 45,
    minValue: 0,
    maxValue: 200,
    thresholdHigh: 100,
    status: 'alert',
    lastUpdate: new Date(),
    history: generateHistory('air_quality'),
  },
];

const mockAlerts: IoTAlert[] = [
  {
    id: 'alert-1',
    sensorId: 'hum-mech',
    sensorName: 'Mechanical Room Humidity',
    type: 'threshold_exceeded',
    severity: 'warning',
    message: 'Humidity approaching upper threshold (58% / 65%)',
    timestamp: new Date(Date.now() - 1800000),
    acknowledged: false,
  },
  {
    id: 'alert-2',
    sensorId: 'air-parking',
    sensorName: 'Parking Air Quality',
    type: 'sensor_anomaly',
    severity: 'warning',
    message: 'Air quality sensor showing intermittent readings',
    timestamp: new Date(Date.now() - 3600000),
    acknowledged: true,
  },
  {
    id: 'alert-3',
    sensorId: 'energy-main',
    sensorName: 'Main Power',
    type: 'spike_detected',
    severity: 'info',
    message: 'Unusual power spike detected at 14:30',
    timestamp: new Date(Date.now() - 7200000),
    acknowledged: true,
  },
];

const mockSystemHealth: SystemHealth[] = [
  {
    system: 'HVAC Central',
    status: 'healthy',
    uptime: 99.8,
    lastCheck: new Date(),
    metrics: [
      { label: 'Supply Air Temp', value: '18.5°C' },
      { label: 'Return Air Temp', value: '22.1°C' },
      { label: 'Fan Speed', value: '75%' },
    ],
  },
  {
    system: 'Plumbing Network',
    status: 'healthy',
    uptime: 100,
    lastCheck: new Date(),
    metrics: [
      { label: 'Main Pressure', value: '4.2 bar' },
      { label: 'Hot Water Temp', value: '55°C' },
      { label: 'Daily Usage', value: '2,450 L' },
    ],
  },
  {
    system: 'Electrical Grid',
    status: 'degraded',
    uptime: 98.5,
    lastCheck: new Date(),
    metrics: [
      { label: 'Load Factor', value: '72%' },
      { label: 'Power Factor', value: '0.92' },
      { label: 'Daily kWh', value: '1,842' },
    ],
  },
  {
    system: 'Fire Safety',
    status: 'healthy',
    uptime: 100,
    lastCheck: new Date(),
    metrics: [
      { label: 'Active Detectors', value: '48/48' },
      { label: 'Last Test', value: '3 days ago' },
      { label: 'Battery Status', value: 'OK' },
    ],
  },
];

// ============================================================================
// Mini Sparkline Component
// ============================================================================

function Sparkline({
  data,
  width = 120,
  height = 40,
  color = '#0d7377',
  showArea = true,
}: {
  data: SensorReading[];
  width?: number;
  height?: number;
  color?: string;
  showArea?: boolean;
}) {
  const path = useMemo(() => {
    if (data.length < 2) return '';

    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((d.value - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    });

    return `M${points.join(' L')}`;
  }, [data, width, height]);

  const areaPath = useMemo(() => {
    if (!showArea || data.length < 2) return '';
    return `${path} L${width},${height} L0,${height} Z`;
  }, [path, showArea, width, height, data.length]);

  return (
    <svg width={width} height={height} className="overflow-visible">
      {showArea && (
        <path d={areaPath} fill={color} fillOpacity={0.15} />
      )}
      <path d={path} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ============================================================================
// Sensor Card Component
// ============================================================================

function SensorCard({
  sensor,
  onClick,
  isSelected,
}: {
  sensor: IoTSensor;
  onClick?: () => void;
  isSelected?: boolean;
}) {
  const config = sensorTypeConfig[sensor.type];
  const percentage = ((sensor.currentValue - sensor.minValue) / (sensor.maxValue - sensor.minValue)) * 100;
  const isOverThreshold = sensor.thresholdHigh && sensor.currentValue > sensor.thresholdHigh;
  const isUnderThreshold = sensor.thresholdLow && sensor.currentValue < sensor.thresholdLow;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border p-4 text-left transition-all ${
        isSelected
          ? 'border-[var(--semantic-primary)] bg-[var(--semantic-primary)]/5 shadow-lg'
          : 'border-[var(--semantic-border)] bg-[var(--panel-soft)] hover:border-[var(--semantic-primary)]/40 hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{config.icon}</span>
          <div>
            <p className="text-sm font-semibold text-[var(--semantic-text)]">{sensor.name}</p>
            <p className="text-xs text-[var(--semantic-text-subtle)]">{sensor.location}</p>
          </div>
        </div>
        <V2StatusPill
          label={sensor.status}
          variant={
            sensor.status === 'alert' ? 'danger' :
            sensor.status === 'warning' ? 'warning' :
            sensor.status === 'offline' ? 'neutral' : 'success'
          }
        />
      </div>

      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className={`text-2xl font-bold ${isOverThreshold || isUnderThreshold ? 'text-amber-500' : 'text-[var(--semantic-text)]'}`}>
            {sensor.currentValue.toFixed(sensor.type === 'motion' ? 0 : 1)}
            <span className="ml-1 text-sm font-normal text-[var(--semantic-text-subtle)]">{sensor.unit}</span>
          </p>
          {sensor.thresholdHigh && (
            <p className="text-xs text-[var(--semantic-text-subtle)]">
              Threshold: {sensor.thresholdHigh} {sensor.unit}
            </p>
          )}
        </div>
        <Sparkline data={sensor.history} color={config.color} width={80} height={32} />
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/5">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.min(100, Math.max(0, percentage))}%`,
            backgroundColor: isOverThreshold || isUnderThreshold ? '#f59e0b' : config.color,
          }}
        />
      </div>
    </button>
  );
}

// ============================================================================
// Alert Row Component
// ============================================================================

function AlertRow({
  alert,
  onAcknowledge,
}: {
  alert: IoTAlert;
  onAcknowledge?: (id: string) => void;
}) {
  const severityConfig = {
    critical: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: '🚨' },
    warning: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: '⚠️' },
    info: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: 'ℹ️' },
  }[alert.severity];

  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${severityConfig.bg} ${severityConfig.border}`}>
      <div className="flex items-start gap-3">
        <span className="text-lg">{severityConfig.icon}</span>
        <div>
          <p className={`text-sm font-semibold ${severityConfig.color}`}>{alert.sensorName}</p>
          <p className="text-xs text-[var(--semantic-text)]">{alert.message}</p>
          <p className="mt-1 text-[10px] text-[var(--semantic-text-subtle)]">
            {alert.timestamp.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' })} -{' '}
            {alert.timestamp.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>
      {!alert.acknowledged && onAcknowledge && (
        <Button type="button" size="sm" variant="secondary" onClick={() => onAcknowledge(alert.id)}>
          Acknowledge
        </Button>
      )}
      {alert.acknowledged && (
        <Badge variant="outline">Acknowledged</Badge>
      )}
    </div>
  );
}

// ============================================================================
// System Health Card
// ============================================================================

function SystemHealthCard({ health }: { health: SystemHealth }) {
  const statusConfig = {
    healthy: { color: 'text-green-600', bg: 'bg-green-500', label: 'Healthy' },
    degraded: { color: 'text-amber-600', bg: 'bg-amber-500', label: 'Degraded' },
    critical: { color: 'text-red-600', bg: 'bg-red-500', label: 'Critical' },
  }[health.status];

  return (
    <div className="rounded-xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold text-[var(--semantic-text)]">{health.system}</p>
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${statusConfig.bg}`} />
          <span className={`text-xs font-semibold ${statusConfig.color}`}>{statusConfig.label}</span>
        </div>
      </div>
      <p className="mt-1 text-xs text-[var(--semantic-text-subtle)]">
        Uptime: {health.uptime.toFixed(1)}%
      </p>
      <div className="mt-3 space-y-1">
        {health.metrics.map((metric) => (
          <div key={metric.label} className="flex items-center justify-between text-xs">
            <span className="text-[var(--semantic-text-subtle)]">{metric.label}</span>
            <span className="font-medium text-[var(--semantic-text)]">{metric.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Main Dashboard Component
// ============================================================================

export function TwinIoTDashboard({ propertyId }: { propertyId?: string }) {
  const [sensors, setSensors] = useState<IoTSensor[]>(mockSensors);
  const [alerts, setAlerts] = useState<IoTAlert[]>(mockAlerts);
  const [selectedSensor, setSelectedSensor] = useState<IoTSensor | null>(null);
  const [filterType, setFilterType] = useState<SensorType | 'all'>('all');
  const [refreshInterval, setRefreshInterval] = useState(5000);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSensors((prev) =>
        prev.map((sensor) => {
          const config = sensorTypeConfig[sensor.type];
          const delta = (Math.random() - 0.5) * (config.max - config.min) * 0.05;
          const newValue = Math.max(config.min, Math.min(config.max, sensor.currentValue + delta));
          const newHistory = [
            ...sensor.history.slice(1),
            { timestamp: Date.now(), value: newValue },
          ];
          return {
            ...sensor,
            currentValue: newValue,
            lastUpdate: new Date(),
            history: newHistory,
          };
        })
      );
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const handleAcknowledge = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
  }, []);

  const filteredSensors = useMemo(
    () => (filterType === 'all' ? sensors : sensors.filter((s) => s.type === filterType)),
    [sensors, filterType]
  );

  const unacknowledgedAlerts = useMemo(
    () => alerts.filter((a) => !a.acknowledged),
    [alerts]
  );

  const sensorTypes = useMemo(
    () => Array.from(new Set(sensors.map((s) => s.type))),
    [sensors]
  );

  return (
    <V2Surface
      title="IoT Monitoring Dashboard"
      subtitle="Real-time sensor data, alerts, and system health monitoring"
      actions={
        <div className="flex items-center gap-2">
          {unacknowledgedAlerts.length > 0 && (
            <Badge variant="error">{unacknowledgedAlerts.length} Active Alerts</Badge>
          )}
          <Badge variant="outline">{sensors.length} Sensors</Badge>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="rounded-lg border border-[var(--semantic-border)] bg-white px-2 py-1 text-xs"
          >
            <option value={1000}>1s refresh</option>
            <option value={5000}>5s refresh</option>
            <option value={10000}>10s refresh</option>
            <option value={30000}>30s refresh</option>
          </select>
        </div>
      }
    >
      {/* Filter Bar */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={filterType === 'all' ? 'primary' : 'secondary'}
          onClick={() => setFilterType('all')}
        >
          All
        </Button>
        {sensorTypes.map((type) => (
          <Button
            key={type}
            type="button"
            size="sm"
            variant={filterType === type ? 'primary' : 'secondary'}
            onClick={() => setFilterType(type)}
          >
            {sensorTypeConfig[type].icon} {type.replace('_', ' ')}
          </Button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.618fr)_minmax(320px,0.78fr)]">
        {/* Left Column - Sensors Grid */}
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredSensors.map((sensor) => (
              <SensorCard
                key={sensor.id}
                sensor={sensor}
                isSelected={selectedSensor?.id === sensor.id}
                onClick={() => setSelectedSensor(sensor)}
              />
            ))}
          </div>

          {/* System Health */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-[var(--semantic-text)]">System Health</h3>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {mockSystemHealth.map((health) => (
                <SystemHealthCard key={health.system} health={health} />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Alerts & Details */}
        <div className="space-y-4">
          {/* Active Alerts */}
          <div className="rounded-2xl border border-[var(--semantic-border)] bg-white/90 p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-[var(--semantic-text)]">Alerts</h3>
              <V2StatusPill
                label={`${unacknowledgedAlerts.length} active`}
                variant={unacknowledgedAlerts.length > 0 ? 'warning' : 'success'}
              />
            </div>
            <div className="mt-3 space-y-2">
              {alerts.slice(0, 5).map((alert) => (
                <AlertRow key={alert.id} alert={alert} onAcknowledge={handleAcknowledge} />
              ))}
              {alerts.length === 0 && (
                <p className="py-4 text-center text-sm text-[var(--semantic-text-subtle)]">
                  No active alerts
                </p>
              )}
            </div>
          </div>

          {/* Selected Sensor Detail */}
          {selectedSensor && (
            <div className="rounded-2xl border border-[var(--semantic-border)] bg-white/90 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{sensorTypeConfig[selectedSensor.type].icon}</span>
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--semantic-text)]">
                      {selectedSensor.name}
                    </h3>
                    <p className="text-xs text-[var(--semantic-text-subtle)]">
                      {selectedSensor.location} - Floor {selectedSensor.floor}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="text-xs text-[var(--semantic-text-subtle)] hover:text-[var(--semantic-text)]"
                  onClick={() => setSelectedSensor(null)}
                >
                  Close
                </button>
              </div>

              <div className="mt-4">
                <p className="text-3xl font-bold text-[var(--semantic-text)]">
                  {selectedSensor.currentValue.toFixed(1)}
                  <span className="ml-1 text-lg font-normal text-[var(--semantic-text-subtle)]">
                    {selectedSensor.unit}
                  </span>
                </p>
              </div>

              <div className="mt-4 rounded-xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-3">
                <p className="mb-2 text-xs font-semibold text-[var(--semantic-text-subtle)]">
                  24-Hour Trend
                </p>
                <Sparkline
                  data={selectedSensor.history}
                  width={260}
                  height={60}
                  color={sensorTypeConfig[selectedSensor.type].color}
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg bg-[var(--panel-soft)] p-2">
                  <p className="text-[var(--semantic-text-subtle)]">Min Range</p>
                  <p className="font-semibold text-[var(--semantic-text)]">
                    {selectedSensor.minValue} {selectedSensor.unit}
                  </p>
                </div>
                <div className="rounded-lg bg-[var(--panel-soft)] p-2">
                  <p className="text-[var(--semantic-text-subtle)]">Max Range</p>
                  <p className="font-semibold text-[var(--semantic-text)]">
                    {selectedSensor.maxValue} {selectedSensor.unit}
                  </p>
                </div>
                {selectedSensor.thresholdLow && (
                  <div className="rounded-lg bg-[var(--panel-soft)] p-2">
                    <p className="text-[var(--semantic-text-subtle)]">Low Threshold</p>
                    <p className="font-semibold text-[var(--semantic-text)]">
                      {selectedSensor.thresholdLow} {selectedSensor.unit}
                    </p>
                  </div>
                )}
                {selectedSensor.thresholdHigh && (
                  <div className="rounded-lg bg-[var(--panel-soft)] p-2">
                    <p className="text-[var(--semantic-text-subtle)]">High Threshold</p>
                    <p className="font-semibold text-[var(--semantic-text)]">
                      {selectedSensor.thresholdHigh} {selectedSensor.unit}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </V2Surface>
  );
}

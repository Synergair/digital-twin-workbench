import { useMemo } from 'react';
import { useCaptureStore } from '../store/captureStore';

interface CoverageIndicatorProps {
  /** Size of the indicator in pixels */
  size?: number;
  /** Show percentage text in center */
  showPercentage?: boolean;
  /** Animate coverage updates */
  animated?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * CoverageIndicator - Visualizes 360° angular coverage during capture
 *
 * Displays a circular indicator showing which angles have been captured,
 * helping users ensure complete room coverage during video/photo capture.
 */
export function CoverageIndicator({
  size = 120,
  showPercentage = true,
  animated = true,
  className = '',
}: CoverageIndicatorProps) {
  const { coverageAngles, deviceOrientation, getOverallCoverage } = useCaptureStore();

  const overallCoverage = getOverallCoverage();
  const currentAngle = deviceOrientation?.alpha ?? 0;

  // Generate SVG paths for coverage segments
  const coveragePaths = useMemo(() => {
    const center = size / 2;
    const radius = (size / 2) - 8;
    const innerRadius = radius - 12;
    const paths: { path: string; intensity: number }[] = [];

    // Group consecutive covered angles into segments
    let segmentStart: number | null = null;
    let segmentEnd: number | null = null;
    let segmentIntensity = 0;

    for (let angle = 0; angle <= 360; angle++) {
      const coverage = coverageAngles[angle % 360] || 0;
      const isCovered = coverage > 0;

      if (isCovered) {
        if (segmentStart === null) {
          segmentStart = angle;
          segmentIntensity = coverage;
        }
        segmentEnd = angle;
        segmentIntensity = Math.max(segmentIntensity, coverage);
      } else if (segmentStart !== null && segmentEnd !== null) {
        // Create path for this segment
        const path = createArcPath(
          center,
          center,
          innerRadius,
          radius,
          segmentStart - 90, // Offset to start at top
          segmentEnd - 90
        );
        paths.push({ path, intensity: segmentIntensity / 10 });
        segmentStart = null;
        segmentEnd = null;
        segmentIntensity = 0;
      }
    }

    // Handle wrap-around segment
    if (segmentStart !== null && segmentEnd !== null) {
      const path = createArcPath(
        center,
        center,
        innerRadius,
        radius,
        segmentStart - 90,
        segmentEnd - 90
      );
      paths.push({ path, intensity: segmentIntensity / 10 });
    }

    return paths;
  }, [coverageAngles, size]);

  // Calculate pointer position
  const pointerAngle = currentAngle - 90; // Offset to start at top
  const pointerRadius = (size / 2) - 4;
  const pointerX = size / 2 + Math.cos((pointerAngle * Math.PI) / 180) * pointerRadius;
  const pointerY = size / 2 + Math.sin((pointerAngle * Math.PI) / 180) * pointerRadius;

  // Color based on coverage
  const getColorByIntensity = (intensity: number) => {
    if (intensity >= 0.8) return '#10b981'; // emerald
    if (intensity >= 0.5) return '#0d9488'; // teal
    return '#0ea5e9'; // sky
  };

  const getCoverageColor = () => {
    if (overallCoverage >= 80) return 'text-emerald-400';
    if (overallCoverage >= 50) return 'text-teal-400';
    if (overallCoverage >= 25) return 'text-amber-400';
    return 'text-white/60';
  };

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={animated ? 'transition-all duration-300' : ''}
      >
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={(size / 2) - 14}
          fill="none"
          stroke="currentColor"
          strokeWidth="12"
          className="text-white/10"
        />

        {/* Tick marks for every 30 degrees */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180);
          const innerR = (size / 2) - 22;
          const outerR = (size / 2) - 8;
          return (
            <line
              key={i}
              x1={size / 2 + Math.cos(angle) * innerR}
              y1={size / 2 + Math.sin(angle) * innerR}
              x2={size / 2 + Math.cos(angle) * outerR}
              y2={size / 2 + Math.sin(angle) * outerR}
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-white/20"
            />
          );
        })}

        {/* Coverage segments */}
        {coveragePaths.map((segment, index) => (
          <path
            key={index}
            d={segment.path}
            fill={getColorByIntensity(segment.intensity)}
            opacity={0.4 + segment.intensity * 0.5}
            className={animated ? 'transition-all duration-150' : ''}
          />
        ))}

        {/* Current direction pointer */}
        <circle
          cx={pointerX}
          cy={pointerY}
          r="4"
          fill="#f43f5e"
          className={animated ? 'transition-all duration-100' : ''}
        >
          <animate
            attributeName="r"
            values="4;5;4"
            dur="1s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Direction indicator line */}
        <line
          x1={size / 2}
          y1={size / 2}
          x2={pointerX}
          y2={pointerY}
          stroke="#f43f5e"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.6"
          className={animated ? 'transition-all duration-100' : ''}
        />

        {/* Center circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 4}
          fill="currentColor"
          className="text-slate-800"
        />
      </svg>

      {/* Percentage text */}
      {showPercentage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${getCoverageColor()}`}>
            {overallCoverage}%
          </span>
          <span className="text-[10px] text-white/40">couverture</span>
        </div>
      )}

      {/* Cardinal directions */}
      <div className="pointer-events-none absolute inset-0">
        <span className="absolute left-1/2 top-0 -translate-x-1/2 text-[10px] font-medium text-white/40">
          N
        </span>
        <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] font-medium text-white/40">
          E
        </span>
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[10px] font-medium text-white/40">
          S
        </span>
        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[10px] font-medium text-white/40">
          O
        </span>
      </div>
    </div>
  );
}

/**
 * Creates an SVG arc path between two angles
 */
function createArcPath(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number
): string {
  // Convert to radians
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;

  // Calculate points
  const startInnerX = cx + Math.cos(startRad) * innerRadius;
  const startInnerY = cy + Math.sin(startRad) * innerRadius;
  const endInnerX = cx + Math.cos(endRad) * innerRadius;
  const endInnerY = cy + Math.sin(endRad) * innerRadius;
  const startOuterX = cx + Math.cos(startRad) * outerRadius;
  const startOuterY = cy + Math.sin(startRad) * outerRadius;
  const endOuterX = cx + Math.cos(endRad) * outerRadius;
  const endOuterY = cy + Math.sin(endRad) * outerRadius;

  // Large arc flag
  const angleDiff = endAngle - startAngle;
  const largeArc = angleDiff > 180 ? 1 : 0;

  return [
    `M ${startInnerX} ${startInnerY}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 1 ${endInnerX} ${endInnerY}`,
    `L ${endOuterX} ${endOuterY}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 0 ${startOuterX} ${startOuterY}`,
    'Z',
  ].join(' ');
}

/**
 * Compact version for embedding in other UI
 */
export function CoverageIndicatorCompact({ className = '' }: { className?: string }) {
  const { getOverallCoverage } = useCaptureStore();
  const coverage = getOverallCoverage();

  const getColor = () => {
    if (coverage >= 80) return 'bg-emerald-500';
    if (coverage >= 50) return 'bg-teal-500';
    if (coverage >= 25) return 'bg-amber-500';
    return 'bg-slate-500';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="h-2 w-16 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-300 ${getColor()}`}
          style={{ width: `${coverage}%` }}
        />
      </div>
      <span className="text-xs font-medium text-white/60">{coverage}%</span>
    </div>
  );
}

export default CoverageIndicator;

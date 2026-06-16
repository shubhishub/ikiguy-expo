import Svg, { Circle, Defs, LinearGradient, Polygon, Polyline, Stop } from 'react-native-svg';

import { Colors } from '@/constants/theme';
import type { VisitStatus } from '@/lib/mock';

const color: Record<VisitStatus, string> = {
  good: Colors.statusGood,
  caution: Colors.statusCaution,
  flag: Colors.statusFlag,
};

// Trend line across the selected reports. Pure SVG, no chart library. The line
// takes the latest reading's status colour, and every point dot is coloured by
// its own status so good/caution/flag stays readable at a glance.
export function CompareChart({
  readings,
  width = 300,
  height = 78,
}: {
  readings: { value: number; status: VisitStatus }[];
  width?: number;
  height?: number;
}) {
  const vals = readings.map((r) => r.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const pad = 12;
  const stepX = (width - pad * 2) / Math.max(1, readings.length - 1);

  const coords = readings.map((r, i) => ({
    x: pad + i * stepX,
    y: pad + (height - pad * 2) * (1 - (r.value - min) / span),
    status: r.status,
  }));

  const lineStatus = readings[readings.length - 1].status;
  const line = coords.map((c) => `${c.x},${c.y}`).join(' ');
  const area = `${pad},${height - pad} ${line} ${width - pad},${height - pad}`;
  const gid = `cc-${lineStatus}-${vals.join('-')}`.replace(/[^a-z0-9-]/gi, '');

  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <LinearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color[lineStatus]} stopOpacity={0.16} />
          <Stop offset="100%" stopColor={color[lineStatus]} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Polygon points={area} fill={`url(#${gid})`} />
      <Polyline
        points={line}
        fill="none"
        stroke={color[lineStatus]}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {coords.map((c, i) => (
        <Circle
          key={i}
          cx={c.x}
          cy={c.y}
          r={i === coords.length - 1 ? 5 : 4}
          fill={color[c.status]}
          stroke="#FFFFFF"
          strokeWidth={2}
        />
      ))}
    </Svg>
  );
}

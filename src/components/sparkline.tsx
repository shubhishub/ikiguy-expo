import Svg, { Circle, Defs, LinearGradient, Polygon, Polyline, Stop } from 'react-native-svg';

import { Colors } from '@/constants/theme';
import type { VisitStatus } from '@/lib/mock';

const stroke: Record<VisitStatus, string> = {
  good: Colors.statusGood,
  caution: Colors.statusCaution,
  flag: Colors.statusFlag,
};

// Small line chart for biomarker trends. Pure SVG, no chart library.
export function Sparkline({
  points,
  status,
  width = 110,
  height = 44,
}: {
  points: number[];
  status: VisitStatus;
  width?: number;
  height?: number;
}) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const pad = 4;
  const stepX = (width - pad * 2) / (points.length - 1);

  const coords = points.map((p, i) => {
    const x = pad + i * stepX;
    const y = pad + (height - pad * 2) * (1 - (p - min) / span);
    return [x, y] as const;
  });

  const line = coords.map(([x, y]) => `${x},${y}`).join(' ');
  const area = `${pad},${height - pad} ${line} ${width - pad},${height - pad}`;
  const id = `g-${status}-${points.join('-')}`.replace(/[^a-z0-9-]/gi, '');
  const last = coords[coords.length - 1];
  const c = stroke[status];

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={c} stopOpacity={0.18} />
          <Stop offset="100%" stopColor={c} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Polygon points={area} fill={`url(#${id})`} />
      <Polyline
        points={line}
        fill="none"
        stroke={c}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={last[0]} cy={last[1]} r={3} fill={c} />
    </Svg>
  );
}

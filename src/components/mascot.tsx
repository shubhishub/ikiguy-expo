import Svg, { Circle, Ellipse, Path, Rect, SvgProps } from 'react-native-svg';

import type { VisitStatus } from '@/lib/mock';

// Data-driven cube mascot. Three health states map to VisitStatus, plus two
// extra faces: "steady" (no status / not enough data) and "celebrate" (a
// milestone, e.g. a marker reversing back into the healthy range).
export type MascotStatus = VisitStatus | 'steady' | 'celebrate';

type FaceProps = SvgProps & { size: number };

function GoodFace({ size, ...rest }: FaceProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none" accessibilityLabel="Healthy" {...rest}>
      <Rect x={0} y={0} width={120} height={120} rx={34} fill="#F5C77E" stroke="#E0A94E" strokeWidth={1.5} />
      <Rect x={14} y={14} width={92} height={78} rx={20} fill="#FBE6BE" />
      <Rect x={34} y={40} width={13} height={20} rx={5} fill="#3B2F1E" />
      <Rect x={73} y={40} width={13} height={20} rx={5} fill="#3B2F1E" />
      <Ellipse cx={38} cy={44} rx={2.6} ry={3.4} fill="#FFFFFF" />
      <Ellipse cx={77} cy={44} rx={2.6} ry={3.4} fill="#FFFFFF" />
      <Path d="M44 70 q16 16 32 0" fill="none" stroke="#3B2F1E" strokeWidth={4.5} strokeLinecap="round" />
      <Ellipse cx={26} cy={66} rx={7} ry={4.5} fill="#F2A39B" opacity={0.55} />
      <Ellipse cx={94} cy={66} rx={7} ry={4.5} fill="#F2A39B" opacity={0.55} />
      <Path d="M16 104 h18 l6 -12 l9 22 l8 -16 l5 6 h27" fill="none" stroke="#5FBF8E" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SteadyFace({ size, ...rest }: FaceProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none" accessibilityLabel="Steady" {...rest}>
      <Rect x={0} y={0} width={120} height={120} rx={34} fill="#F5C77E" stroke="#E0A94E" strokeWidth={1.5} />
      <Rect x={14} y={14} width={92} height={78} rx={20} fill="#FBE6BE" />
      <Rect x={34} y={42} width={13} height={16} rx={5} fill="#3B2F1E" />
      <Rect x={73} y={42} width={13} height={16} rx={5} fill="#3B2F1E" />
      <Path d="M46 72 h28" fill="none" stroke="#3B2F1E" strokeWidth={4.5} strokeLinecap="round" />
      <Path d="M16 104 h18 l6 -9 l9 16 l8 -12 l5 5 h27" fill="none" stroke="#8FB4FF" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CautionFace({ size, ...rest }: FaceProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none" accessibilityLabel="Needs attention" {...rest}>
      <Rect x={0} y={0} width={120} height={120} rx={34} fill="#F5C77E" stroke="#E0A94E" strokeWidth={1.5} />
      <Rect x={14} y={14} width={92} height={78} rx={20} fill="#FBE6BE" />
      <Path d="M28 34 q10 -6 19 -1" fill="none" stroke="#3B2F1E" strokeWidth={3.4} strokeLinecap="round" />
      <Path d="M75 33 q9 -5 19 1" fill="none" stroke="#3B2F1E" strokeWidth={3.4} strokeLinecap="round" />
      <Rect x={34} y={44} width={13} height={18} rx={5} fill="#3B2F1E" />
      <Rect x={73} y={44} width={13} height={18} rx={5} fill="#3B2F1E" />
      <Path d="M46 76 q14 -11 28 0" fill="none" stroke="#3B2F1E" strokeWidth={4.5} strokeLinecap="round" />
      <Path d="M16 104 h18 l6 -10 l9 18 l8 -13 l5 5 h27" fill="none" stroke="#F4B860" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FlagFace({ size, ...rest }: FaceProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none" accessibilityLabel="Needs action" {...rest}>
      <Rect x={0} y={0} width={120} height={120} rx={34} fill="#F5C77E" stroke="#E0A94E" strokeWidth={1.5} />
      <Rect x={14} y={14} width={92} height={78} rx={20} fill="#FBE6BE" />
      <Path d="M28 34 q10 -6 19 -1" fill="none" stroke="#3B2F1E" strokeWidth={3.4} strokeLinecap="round" />
      <Path d="M75 33 q9 -5 19 1" fill="none" stroke="#3B2F1E" strokeWidth={3.4} strokeLinecap="round" />
      <Rect x={34} y={44} width={13} height={18} rx={5} fill="#3B2F1E" />
      <Rect x={73} y={44} width={13} height={18} rx={5} fill="#3B2F1E" />
      <Path d="M46 80 q14 -13 28 0" fill="none" stroke="#3B2F1E" strokeWidth={4.5} strokeLinecap="round" />
      <Path d="M16 104 h18 l6 -10 l9 18 l8 -13 l5 5 h27" fill="none" stroke="#F2789F" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CelebrateFace({ size, ...rest }: FaceProps) {
  // Intrinsic viewBox is 132 x 120 (slightly wider for the balloon).
  const width = Math.round((size * 132) / 120);
  return (
    <Svg width={width} height={size} viewBox="0 0 132 120" fill="none" accessibilityLabel="Milestone reached" {...rest}>
      <Rect x={6} y={0} width={110} height={110} rx={32} fill="#F5C77E" stroke="#E0A94E" strokeWidth={1.5} />
      <Rect x={19} y={13} width={84} height={70} rx={18} fill="#FBE6BE" />
      <Rect x={36} y={34} width={13} height={20} rx={5} fill="#3B2F1E" />
      <Rect x={73} y={34} width={13} height={20} rx={5} fill="#3B2F1E" />
      <Ellipse cx={40} cy={38} rx={2.6} ry={3.4} fill="#FFFFFF" />
      <Ellipse cx={77} cy={38} rx={2.6} ry={3.4} fill="#FFFFFF" />
      <Ellipse cx={61} cy={68} rx={13} ry={9} fill="#3B2F1E" />
      <Ellipse cx={61} cy={64} rx={9} ry={4} fill="#FBE6BE" />
      <Ellipse cx={30} cy={62} rx={6} ry={4} fill="#F2A39B" opacity={0.55} />
      <Ellipse cx={92} cy={62} rx={6} ry={4} fill="#F2A39B" opacity={0.55} />
      <Path d="M111 80 q15 -2 15 -17 q0 -7 -7 -7 q-5 0 -5 5" fill="#F5C77E" stroke="#E0A94E" strokeWidth={1.5} strokeLinejoin="round" />
      <Circle cx={113} cy={22} r={14} fill="#FFF3D6" stroke="#F5A623" strokeWidth={1.5} />
      <Path d="M107 26 a2.8 2.8 0 0 1 5.6 -1.5 a2.8 2.8 0 0 1 5.6 1.5 c0 3.2 -5.6 6.4 -5.6 6.4 s-5.6 -3.2 -5.6 -6.4 z" fill="#F5A623" />
    </Svg>
  );
}

const FACES: Record<MascotStatus, (p: FaceProps) => React.JSX.Element> = {
  good: GoodFace,
  caution: CautionFace,
  flag: FlagFace,
  steady: SteadyFace,
  celebrate: CelebrateFace,
};

// Picks the right cube face for a health status. Defaults to steady.
export function Mascot({ status = 'steady', size = 120, ...rest }: { status?: MascotStatus; size?: number } & SvgProps) {
  const Face = FACES[status] ?? SteadyFace;
  return <Face size={size} {...rest} />;
}

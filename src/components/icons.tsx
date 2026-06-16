// Lightweight inline line icons, stroke based to match the calm aesthetic.
// Ported from the web SVG set to react-native-svg.
import Svg, { Circle, Path, Rect, SvgProps } from 'react-native-svg';

import { Colors } from '@/constants/theme';

export type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
} & SvgProps;

function useBase({ size = 22, color = Colors.ink, strokeWidth = 1.8 }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
}

export const MicIcon = (p: IconProps) => (
  <Svg {...useBase(p)}>
    <Rect x="9" y="3" width="6" height="11" rx="3" />
    <Path d="M5 11a7 7 0 0 0 14 0" />
    <Path d="M12 18v3" />
  </Svg>
);

export const CameraIcon = (p: IconProps) => (
  <Svg {...useBase(p)}>
    <Path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.2l1-1.6A1 1 0 0 1 8.6 4h6.8a1 1 0 0 1 .9.4l1 1.6h1.2A2.5 2.5 0 0 1 21 8.5v8A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5z" />
    <Circle cx="12" cy="12.5" r="3.2" />
  </Svg>
);

export const PlusIcon = (p: IconProps) => (
  <Svg {...useBase(p)}>
    <Path d="M12 5v14M5 12h14" />
  </Svg>
);

export const HomeIcon = (p: IconProps) => (
  <Svg {...useBase(p)}>
    <Path d="M4 10.5 12 4l8 6.5" />
    <Path d="M6 9.5V20h12V9.5" />
  </Svg>
);

export const ChartIcon = (p: IconProps) => (
  <Svg {...useBase(p)}>
    <Path d="M4 19h16" />
    <Path d="M7 16V9M12 16V5M17 16v-4" />
  </Svg>
);

export const UserIcon = (p: IconProps) => (
  <Svg {...useBase(p)}>
    <Circle cx="12" cy="8" r="3.4" />
    <Path d="M5 20a7 7 0 0 1 14 0" />
  </Svg>
);

export const BellIcon = (p: IconProps) => (
  <Svg {...useBase(p)}>
    <Path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
    <Path d="M10 19a2 2 0 0 0 4 0" />
  </Svg>
);

export const BackIcon = (p: IconProps) => (
  <Svg {...useBase(p)}>
    <Path d="M15 6l-6 6 6 6" />
  </Svg>
);

export const UploadIcon = (p: IconProps) => (
  <Svg {...useBase(p)}>
    <Path d="M12 16V5" />
    <Path d="M8 9l4-4 4 4" />
    <Path d="M5 16v2a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2" />
  </Svg>
);

export const ShareIcon = (p: IconProps) => (
  <Svg {...useBase(p)}>
    <Circle cx="6" cy="12" r="2.4" />
    <Circle cx="18" cy="6" r="2.4" />
    <Circle cx="18" cy="18" r="2.4" />
    <Path d="M8.1 11 16 6.8M8.1 13l7.9 4.2" />
  </Svg>
);

export const SaveIcon = (p: IconProps) => (
  <Svg {...useBase(p)}>
    <Path d="M5 4h11l3 3v13H5z" />
    <Path d="M8 4v5h7V4M8 20v-6h8v6" />
  </Svg>
);

export const LinkIcon = (p: IconProps) => (
  <Svg {...useBase(p)}>
    <Path d="M9 15l6-6" />
    <Path d="M11 7l1-1a3.5 3.5 0 0 1 5 5l-1 1" />
    <Path d="M13 17l-1 1a3.5 3.5 0 0 1-5-5l1-1" />
  </Svg>
);

export const PillIcon = (p: IconProps) => (
  <Svg {...useBase(p)}>
    <Rect x="3" y="8" width="18" height="8" rx="4" transform="rotate(-45 12 12)" />
    <Path d="M9 9l6 6" />
  </Svg>
);

export const FileIcon = (p: IconProps) => (
  <Svg {...useBase(p)}>
    <Path d="M7 3h7l5 5v13H7z" />
    <Path d="M14 3v5h5" />
  </Svg>
);

export const StopIcon = (p: IconProps) => {
  const { size = 22, color = Colors.ink } = p;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Rect x="7" y="7" width="10" height="10" rx="2.5" />
    </Svg>
  );
};

export const CheckIcon = (p: IconProps) => (
  <Svg {...useBase(p)}>
    <Path d="M5 12.5l4 4 10-10" />
  </Svg>
);

export const XIcon = (p: IconProps) => (
  <Svg {...useBase(p)}>
    <Path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);

export const ReportsIcon = (p: IconProps) => (
  <Svg {...useBase(p)}>
    <Rect x="5" y="5" width="14" height="16" rx="2.5" />
    <Rect x="9" y="3" width="6" height="3.4" rx="1.2" />
    <Path d="M8.5 11h7M8.5 14.5h7M8.5 18h4" />
  </Svg>
);

// Health style heart: filled heart with an ECG / pulse line across it.
export const HeartIcon = ({ size = 22, color = Colors.statusFlag, ...rest }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
    <Path
      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      fill={color}
    />
    <Path
      d="M4 12.4h3.1l1.5-3.1 2.5 5.4 1.9-3.9 1.3 1.6H20"
      fill="none"
      stroke="#FFFFFF"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const PlusUsersIcon = (p: IconProps) => (
  <Svg {...useBase(p)}>
    <Circle cx="9" cy="8" r="3.2" />
    <Path d="M3 19a6 6 0 0 1 12 0" />
    <Path d="M18 8v6M15 11h6" />
  </Svg>
);

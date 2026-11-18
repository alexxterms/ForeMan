import React from 'react';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'clip' | 'wallet' | 'box' | 'tag' | 'doc' | 'building' | 'hat' | 'mic' | 'back' | 'check'
  | 'plus' | 'cloudoff' | 'cloudup' | 'sync' | 'cam' | 'user' | 'pin' | 'cal' | 'alert' | 'x'
  | 'clock' | 'pencil' | 'plane' | 'share' | 'del' | 'stop' | 'minus' | 'down' | 'chev' | 'globe' | 'gear';

const CLOUD = 'M7 18h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.2 9.5 4.5 4.5 0 0 0 7 18z';

// Line icons on a 24px grid. Stroke only, round caps. See docs/04-design-system.md section 4.
function glyph(name: IconName): React.ReactNode {
  switch (name) {
    case 'clip':
      return (<><Rect x={4.5} y={4} width={15} height={17.5} rx={2.5} /><Rect x={8.8} y={2.2} width={6.4} height={3.8} rx={1.3} /><Path d="M8.3 13.2l2.5 2.5 4.9-5" /></>);
    case 'wallet':
      return (<><Rect x={3} y={6} width={18} height={14} rx={2.5} /><Path d="M3 10h18M16 14.5h2" /><Path d="M3 9V7.5A1.5 1.5 0 0 1 4.5 6H17" /></>);
    case 'box':
      return (<><Path d="M3 7.5L12 3l9 4.5v9L12 21l-9-4.5z" /><Path d="M3 7.5l9 4.5 9-4.5M12 12v9" /></>);
    case 'tag':
      return (<><Path d="M3 12V4.5A1.5 1.5 0 0 1 4.5 3H12l9 9-9 9z" /><Circle cx={7.5} cy={7.5} r={1.5} /></>);
    case 'doc':
      return (<><Path d="M6 2.8h8.4L19 7.4v13.8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3.8a1 1 0 0 1 1-1z" /><Path d="M14.4 2.8v4.6H19" /><Path d="M8.5 12h7M8.5 15.2h7M8.5 18.4h4" /></>);
    case 'building':
      return (<><Path d="M4 21V4h10v17M14 9h6v12M2 21h20" /><Path d="M7 7.5h1.5M10.5 7.5h1.5M7 11h1.5M10.5 11h1.5M7 14.5h1.5M10.5 14.5h1.5" /></>);
    case 'hat':
      return (<><Path d="M3.5 15.5a8.5 8.5 0 0 1 17 0z" /><Path d="M2.5 15.5h19v2.2a1.3 1.3 0 0 1-1.3 1.3H3.8a1.3 1.3 0 0 1-1.3-1.3z" /><Path d="M12 7v8.5M7.2 10.5a6 6 0 0 1 2.5-2.4" /></>);
    case 'mic':
      return (<><Rect x={9} y={2.5} width={6} height={11.5} rx={3} /><Path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6" /></>);
    case 'back':
      return <Path d="M15 18l-6-6 6-6" />;
    case 'check':
      return <Path d="M5 12.5l4.5 4.5L19 7.5" />;
    case 'plus':
      return <Path d="M12 5v14M5 12h14" />;
    case 'minus':
      return <Path d="M5 12h14" />;
    case 'cloudoff':
      return (<><Path d="M3 3l18 18" /><Path d={CLOUD} /></>);
    case 'cloudup':
      return (<><Path d={CLOUD} /><Path d="M12 15.5v-5M9.6 12.9L12 10.5l2.4 2.4" /></>);
    case 'sync':
      return <Path d="M4 12a8 8 0 0 1 14-5l2 2M20 4v5h-5M20 12a8 8 0 0 1-14 5l-2-2M4 20v-5h5" />;
    case 'cam':
      return (<><Path d="M3 8.2a1.5 1.5 0 0 1 1.5-1.5h3.2l1.8-2.7h5l1.8 2.7h3.2A1.5 1.5 0 0 1 21 8.2v10.3a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z" /><Circle cx={12} cy={13.2} r={3.6} /></>);
    case 'user':
      return (<><Circle cx={12} cy={8.2} r={4} /><Path d="M4.5 21a7.5 7.5 0 0 1 15 0" /></>);
    case 'pin':
      return (<><Path d="M12 21.5s-6.8-6-6.8-11.3a6.8 6.8 0 0 1 13.6 0C18.8 15.5 12 21.5 12 21.5z" /><Circle cx={12} cy={10.2} r={2.4} /></>);
    case 'cal':
      return (<><Rect x={3.5} y={5} width={17} height={15.5} rx={2.2} /><Path d="M3.5 9.5h17M8 3v4M16 3v4" /></>);
    case 'alert':
      return (<><Path d="M12 3.5L2.5 20h19z" /><Path d="M12 10v4.5M12 17.5v.01" /></>);
    case 'x':
      return (<><Circle cx={12} cy={12} r={9} /><Path d="M9 9l6 6M15 9l-6 6" /></>);
    case 'clock':
      return (<><Circle cx={12} cy={12} r={9} /><Path d="M12 7v5l3 2" /></>);
    case 'pencil':
      return <Path d="M4 20h4L19 9l-4-4L4 16z" />;
    case 'plane':
      return (<><Path d="M21 3L10 14" /><Path d="M21 3l-7 18-4-7-7-4z" /></>);
    case 'share':
      return (<><Circle cx={18} cy={5.5} r={2.5} /><Circle cx={6} cy={12} r={2.5} /><Circle cx={18} cy={18.5} r={2.5} /><Path d="M8.2 10.8l7.6-4M8.2 13.2l7.6 4" /></>);
    case 'del':
      return (<><Path d="M21 6H9l-6 6 6 6h12a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1z" /><Path d="M14 10l-4 4M10 10l4 4" /></>);
    case 'down':
      return <Path d="M6 9l6 6 6-6" />;
    case 'chev':
      return <Path d="M9 6l6 6-6 6" />;
    case 'globe':
      return (<><Circle cx={12} cy={12} r={9} /><Path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>);
    case 'gear':
      return (<><Circle cx={12} cy={12} r={3} /><Path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" /></>);
    case 'stop':
      return <Rect x={6} y={6} width={12} height={12} rx={2} />;
  }
}

type Props = { name: IconName; size?: number; color?: string; strokeWidth?: number };

export function Icon({ name, size = 24, color = '#0F172A', strokeWidth = 2 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G stroke={color} fill="none" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        {glyph(name)}
      </G>
    </Svg>
  );
}

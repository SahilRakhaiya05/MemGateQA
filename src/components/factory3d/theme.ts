/** Factory warehouse palette + neon cyber accents */
export const FACTORY_COLORS = {
  void: '#0d1118',
  floor: '#1A1F2B',
  floorGrid: '#2A3340',
  metal: '#2A3340',
  metalLight: '#3d4a5c',
  conveyor: '#222b38',
  belt: '#323d4d',
  neonCyan: '#00f5ff',
  neonOrange: '#EF5A2A',
  cerebrasOrange: '#EF5A2A',
  challengerBlue: '#3C7BF2',
  neonPurple: '#b44dff',
  neonGreen: '#46C46E',
  clearedGreen: '#46C46E',
  neonPink: '#ff2d95',
  neonGold: '#F5A623',
  overflowAmber: '#F5A623',
  glowCyan: '#00f5ff44',
  glowOrange: '#EF5A2A44',
  glowGreen: '#46C46E44',
  done: '#46C46E',
  active: '#00f5ff',
  pending: '#4a5568',
  danger: '#e0533f',
  manila: '#E8DCC0',
} as const;

export const STATIONS_3D = [
  { id: 'intake', label: 'Intake', icon: '📥', x: -12, color: FACTORY_COLORS.neonGold },
  { id: 'remember', label: 'Remember', icon: '🧠', x: -7.2, color: FACTORY_COLORS.neonCyan, op: 'remember' },
  { id: 'interrogate', label: 'Interrogate', icon: '🔍', x: -2.4, color: FACTORY_COLORS.cerebrasOrange, op: 'recall' },
  { id: 'surgery', label: 'Surgery', icon: '🔧', x: 2.4, color: FACTORY_COLORS.neonPink, op: 'improve' },
  { id: 'rerun', label: 'Rerun', icon: '♻️', x: 7.2, color: FACTORY_COLORS.neonPurple, op: 'recall' },
  { id: 'ship', label: 'Ship', icon: '📋', x: 12, color: FACTORY_COLORS.clearedGreen, op: 'forget' },
] as const;

export type Station3DId = (typeof STATIONS_3D)[number]['id'];

export const STATUS_TO_STATION_3D: Record<string, Station3DId> = {
  open: 'intake',
  intake: 'remember',
  tested: 'interrogate',
  surgery: 'surgery',
  repaired: 'rerun',
  closed: 'ship',
};
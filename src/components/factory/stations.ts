export const FACTORY_COLORS = {
  neonCyan: '#00f5ff',
  neonOrange: '#EF5A2A',
  neonPurple: '#b44dff',
  neonGreen: '#46C46E',
  neonGold: '#F5A623',
  neonPink: '#ff2d95',
} as const;

export const STATIONS = [
  { id: 'intake', label: 'Intake', icon: '📥', color: FACTORY_COLORS.neonGold },
  { id: 'remember', label: 'Remember', icon: '🧠', color: FACTORY_COLORS.neonCyan, op: 'remember' },
  { id: 'interrogate', label: 'Interrogate', icon: '🔍', color: FACTORY_COLORS.neonOrange, op: 'recall' },
  { id: 'surgery', label: 'Surgery', icon: '🔧', color: FACTORY_COLORS.neonPink, op: 'improve' },
  { id: 'rerun', label: 'Rerun', icon: '♻️', color: FACTORY_COLORS.neonPurple, op: 'recall' },
  { id: 'ship', label: 'Ship', icon: '📋', color: FACTORY_COLORS.neonGreen, op: 'forget' },
] as const;

export type StationId = (typeof STATIONS)[number]['id'];

export const STATUS_TO_STATION: Record<string, StationId> = {
  open: 'intake',
  intake: 'remember',
  tested: 'interrogate',
  surgery: 'surgery',
  repaired: 'rerun',
  closed: 'ship',
};
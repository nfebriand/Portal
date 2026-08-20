export interface KpiTrafficLightItem {
  key: string;
  label: string;
  rangeLabel: string;
  min: number;
  max: number;
  color: string;
  bgLight: string;
  borderLight: string;
  textColor: string;
  description: string;
}

export const KPI_TRAFFIC_LIGHT_SYSTEM: KpiTrafficLightItem[] = [
  {
    key: 'optimal',
    label: 'Optimal / Tercapai',
    rangeLabel: '≥ 100%',
    min: 100,
    max: Infinity,
    color: '#10b981', // Emerald 500
    bgLight: 'bg-emerald-50',
    borderLight: 'border-emerald-200',
    textColor: 'text-emerald-700',
    description: 'Target kinerja telah tercapai atau melampaui ekspektasi'
  },
  {
    key: 'baik',
    label: 'Baik / On-Track',
    rangeLabel: '80% - 99%',
    min: 80,
    max: 99.99,
    color: '#84cc16', // Lime 500
    bgLight: 'bg-lime-50',
    borderLight: 'border-lime-200',
    textColor: 'text-lime-700',
    description: 'Kinerja berjalan baik sesuai dengan lintasan target'
  },
  {
    key: 'cukup',
    label: 'Cukup / Waspada',
    rangeLabel: '60% - 79%',
    min: 60,
    max: 79.99,
    color: '#eab308', // Yellow 500
    bgLight: 'bg-amber-50',
    borderLight: 'border-amber-200',
    textColor: 'text-amber-700',
    description: 'Perlu pengawasan berkala agar tidak mengalami deviasi'
  },
  {
    key: 'kurang',
    label: 'Kurang / Perlu Akselerasi',
    rangeLabel: '40% - 59%',
    min: 40,
    max: 59.99,
    color: '#f97316', // Orange 500
    bgLight: 'bg-orange-50',
    borderLight: 'border-orange-200',
    textColor: 'text-orange-700',
    description: 'Realisasi di bawah target, membutuhkan langkah percepatan'
  },
  {
    key: 'kritis',
    label: 'Kritis / Red-Flag',
    rangeLabel: '0% - 39%',
    min: 0,
    max: 39.99,
    color: '#ef4444', // Red 500
    bgLight: 'bg-rose-50',
    borderLight: 'border-rose-200',
    textColor: 'text-rose-700',
    description: 'Realisasi sangat tertinggal, butuh intervensi langsung pimpinan'
  }
];

export const getGaugeColorByPercentage = (pct: number): string => {
  if (pct >= 100) return '#10b981'; // Emerald 500
  if (pct >= 80) return '#84cc16'; // Lime 500
  if (pct >= 60) return '#eab308'; // Yellow 500
  if (pct >= 40) return '#f97316'; // Orange 500
  return '#ef4444'; // Red 500
};

export const getKpiStatusByPercentage = (pct: number): KpiTrafficLightItem => {
  if (pct >= 100) return KPI_TRAFFIC_LIGHT_SYSTEM[0];
  if (pct >= 80) return KPI_TRAFFIC_LIGHT_SYSTEM[1];
  if (pct >= 60) return KPI_TRAFFIC_LIGHT_SYSTEM[2];
  if (pct >= 40) return KPI_TRAFFIC_LIGHT_SYSTEM[3];
  return KPI_TRAFFIC_LIGHT_SYSTEM[4];
};

export const isRedFlagIndicator = (pct: number): boolean => {
  return pct < 50; // Categories below 50% or in red/orange-critical threshold
};

export const getGaugeColorByPercentage = (pct: number) => {
  if (pct >= 100) return '#10b981'; // Emerald 500
  if (pct >= 80) return '#84cc16'; // Lime 500
  if (pct >= 60) return '#eab308'; // Yellow 500
  if (pct >= 40) return '#f97316'; // Orange 500
  return '#ef4444'; // Red 500
};

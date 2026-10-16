import React from 'react';

interface SparklineProps {
  points: number[];
  positive: boolean;
  width?: number;
  height?: number;
  /** Supply for a standalone chart; omit when an adjacent cell already states the trend. */
  label?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({ points, positive, width = 120, height = 36, label }) => {
  const clean = points.filter((n) => Number.isFinite(n));
  if (clean.length < 2) return null;

  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const range = max - min || 1;
  const coords = clean
    .map((p, i) => {
      const x = (i / (clean.length - 1)) * width;
      const y = height - ((p - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role={label ? 'img' : 'presentation'}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className="inline-block align-middle"
    >
      <polyline
        fill="none"
        stroke={positive ? '#10b981' : '#f43f5e'}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coords}
      />
    </svg>
  );
};

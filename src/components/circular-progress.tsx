import React from 'react';

interface CircularProgressProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
}

export function CircularProgress({ value, max, size = 260, strokeWidth = 12 }: CircularProgressProps) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = radius * 2 * Math.PI;
  const percent = Math.min(Math.max(value / max, 0), 1);
  const strokeDashoffset = circumference - percent * circumference;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg className="absolute transform -rotate-90" width={size} height={size}>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={strokeWidth}
        />

        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset,
            transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </svg>

      {/* Center content */}
      <div className="text-center relative z-10">
        <div className="font-bold text-foreground leading-none">
          <span className="text-2xl text-muted-foreground">&yen;</span>
          <span className="text-5xl">{value}</span>
        </div>
        <div className="text-[10px] text-muted-foreground mt-2 font-medium tracking-wider">
          / &yen;{max} 上限
        </div>
        <div className="text-[9px] text-muted-foreground/70 mt-1">
          {Math.round(percent * 100)}%
        </div>
      </div>
    </div>
  );
}

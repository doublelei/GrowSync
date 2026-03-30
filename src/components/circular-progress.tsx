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

  // Outer decorative ring
  const outerRadius = radius + strokeWidth + 4;
  const outerCircumference = outerRadius * 2 * Math.PI;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Ambient glow behind the ring */}
      <div
        className="absolute rounded-full animate-glow-pulse"
        style={{
          width: size * 0.7,
          height: size * 0.7,
          background: 'radial-gradient(circle, oklch(0.82 0.22 155 / 0.15) 0%, transparent 70%)',
        }}
      />

      <svg className="absolute transform -rotate-90" width={size} height={size}>
        <defs>
          {/* Gradient for the progress arc */}
          <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.82 0.22 155)" />
            <stop offset="50%" stopColor="oklch(0.7 0.25 170)" />
            <stop offset="100%" stopColor="oklch(0.55 0.28 290)" />
          </linearGradient>
          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feFlood floodColor="oklch(0.82 0.22 155)" floodOpacity="0.6" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="shadow" />
            <feMerge>
              <feMergeNode in="shadow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer decorative dashed ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={outerRadius}
          fill="none"
          stroke="oklch(0.82 0.22 155 / 0.08)"
          strokeWidth={1}
          strokeDasharray="4 8"
        />

        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="oklch(0.2 0.04 280)"
          strokeWidth={strokeWidth}
        />

        {/* Subtle secondary track for depth */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="oklch(0.55 0.28 290 / 0.06)"
          strokeWidth={strokeWidth + 6}
        />

        {/* Progress arc with gradient and glow */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progress-gradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          filter="url(#glow)"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset,
            transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />

        {/* Tick marks at quarters */}
        {[0, 0.25, 0.5, 0.75].map((tick) => {
          const angle = tick * 2 * Math.PI - Math.PI / 2;
          const innerR = radius - strokeWidth / 2 - 4;
          const outerR = radius - strokeWidth / 2 - 1;
          return (
            <line
              key={tick}
              x1={size / 2 + innerR * Math.cos(angle)}
              y1={size / 2 + innerR * Math.sin(angle)}
              x2={size / 2 + outerR * Math.cos(angle)}
              y2={size / 2 + outerR * Math.sin(angle)}
              stroke="oklch(0.82 0.22 155 / 0.3)"
              strokeWidth={1.5}
            />
          );
        })}
      </svg>

      {/* Center content */}
      <div className="text-center relative z-10">
        <div className="font-mono font-bold text-foreground leading-none">
          <span className="text-2xl text-primary/60">&yen;</span>
          <span className="text-5xl text-glow">{value}</span>
        </div>
        <div className="text-[10px] text-muted-foreground mt-2 font-medium tracking-wider uppercase">
          / &yen;{max} cap
        </div>
        <div className="text-[9px] text-primary/40 mt-1 font-mono">
          {Math.round(percent * 100)}%
        </div>
      </div>
    </div>
  );
}

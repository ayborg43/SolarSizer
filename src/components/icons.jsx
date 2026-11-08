// Light-stroke SVG icons (1.5 width) — replaces emoji on system/result surfaces.
const base = {
  width: 22, height: 22, viewBox: "0 0 24 24", fill: "none",
  stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round",
  "aria-hidden": true, focusable: false,
};

export function SunLogo({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6" />
    </svg>
  );
}

export function BatteryIcon() {
  return (
    <svg {...base}>
      <rect x="2.5" y="8" width="16" height="8.5" rx="2" />
      <path d="M21.5 11v2.5M6 11v2.5M9.5 11v2.5" />
    </svg>
  );
}

export function PanelIcon() {
  return (
    <svg {...base}>
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path d="M9 4v12M15 4v12M3 10h18M12 16v3M8.5 21h7" />
    </svg>
  );
}

export function BoltIcon() {
  return (
    <svg {...base}>
      <path d="M13 2.5 4.5 13.5H11L9.8 21.5 18.5 10H12L13 2.5Z" />
    </svg>
  );
}

export function ControllerIcon() {
  return (
    <svg {...base}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h4" />
      <circle cx="16" cy="16.5" r="1.4" />
      <path d="M8 16.5h3" />
    </svg>
  );
}

export function RackIcon() {
  return (
    <svg {...base}>
      <path d="M4 17 10 7h10l-6 10H4Z" />
      <path d="M8.5 17 13 9.5M6 21h14M9 21l1.2-4M16 21l1.2-4" />
    </svg>
  );
}

export function TargetIcon() {
  return (
    <svg {...base}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.8" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

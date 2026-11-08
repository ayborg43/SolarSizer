export default function Stepper({ T, steps, step, isDesktop }) {
  return (
    <div style={{ display: "flex", gap: isDesktop ? "6px" : "4px", padding: isDesktop ? "24px 0 20px" : "14px 0 0", overflowX: "auto" }}>
      {steps.map((s, i) => (
        <div key={s} style={{ flex: 1, minWidth: isDesktop ? "64px" : "40px", display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
          <div style={{ width: isDesktop ? "34px" : "28px", height: isDesktop ? "34px" : "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: isDesktop ? "12px" : "11px", fontWeight: "700", background: i < step ? "#fbbf24" : i === step ? "rgba(251,191,36,0.15)" : T.stepDotInactive, border: i <= step ? "2px solid #fbbf24" : `2px solid ${T.stepDotBorder}`, color: i < step ? "#0a0f1e" : i === step ? "#fbbf24" : T.stepLabelOff, transition: "all 0.3s" }}>
            {i < step ? "✓" : i + 1}
          </div>
          <div style={{ fontSize: isDesktop ? "10px" : "9px", color: i <= step ? "#fbbf24" : T.stepLabelOff, textAlign: "center", fontWeight: i === step ? "600" : "400", whiteSpace: "nowrap" }}>{s}</div>
        </div>
      ))}
    </div>
  );
}
